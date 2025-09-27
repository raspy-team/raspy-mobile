<template>
  <header class="fixed top-0 left-0 w-full h-20 z-[30] raspy-top">
    <!-- 우측: 알림 + DM -->
    <div class="flex items-center justify-end raspy-top mt-8 space-x-4 mr-3">
      <!-- DM 버튼 -->
      <router-link
        to="/dm"
        class="w-9 h-9 flex items-center justify-center border-orange-500 rounded-full transition ml-1"
        title="DM"
      >
        <i class="fas fa-paper-plane text-orange-500 text-xl"></i>
      </router-link>

      <!-- 알림 버튼  -->
      <button
        class="w-9 h-9 flex items-center justify-center relative border-orange-500 rounded-full transition"
        @click="toggleNotificationPanel"
      >
        <i class="fas fa-bell text-orange-500 text-xl"></i>
        <span
          v-if="unreadCount > 0"
          class="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full"
        ></span>
      </button>
    </div>

    <!-- 알림 패널 (오른쪽 슬라이드) -->
    <transition name="slide">
      <aside
        v-if="showNotificationPanel"
        class="fixed top-0 right-0 h-full w-[350px] max-w-[96vw] bg-white raspy-top border-l z-[100] shadow-lg flex flex-col"
      >
        <div class="flex items-center justify-between px-6 h-16 border-b">
          <span class="text-base font-bold text-gray-800">알림</span>
          <button
            @click="toggleNotificationPanel"
            class="text-gray-400 hover:text-gray-800 text-xl"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="flex-1 overflow-y-auto">
          <template v-if="notifications.length > 0">
            <ul>
              <li
                v-for="n in notifications"
                :key="n.id"
                class="flex px-5 py-4 border-b group cursor-pointer hover:bg-orange-50/70 transition relative"
                @click="openNotification(n)"
              >
                <div
                  class="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-orange-50 mr-4"
                >
                  <i :class="notificationIcon(n.type)" class="text-xl" />
                </div>
                <div class="flex-1">
                  <div class="flex items-center gap-1">
                    <span class="font-medium text-sm text-black">{{ n.title }}</span>
                    <span
                      v-if="!n.isRead"
                      class="inline-block ml-1 w-2 h-2 rounded-full bg-orange-500 align-middle"
                    ></span>
                  </div>
                  <div class="text-xs text-gray-500 mt-1 truncate">
                    {{ n.message }}
                  </div>
                  <div class="text-[10px] text-gray-400 mt-1">
                    {{ formatDate(n.createdAt) }}
                  </div>
                </div>
              </li>
            </ul>
          </template>
          <template v-else>
            <div class="py-20 text-center text-gray-400 text-sm">알림이 없습니다.</div>
          </template>
        </div>
      </aside>
    </transition>
  </header>

  <div
    v-if="loading"
    class="relative inset-0 h-full w-full bg-black text-white overflow-hidden select-none"
  >
    <div class="flex items-center justify-center h-full">
      <div class="text-center">
        <div class="space-y-4 max-w-sm mx-auto p-6">
          <div class="h-4 bg-white/10 rounded animate-pulse"></div>
          <div class="h-20 bg-white/10 rounded animate-pulse"></div>
          <div class="h-4 bg-white/10 rounded w-3/4 animate-pulse"></div>
          <div class="h-4 bg-white/10 rounded w-1/2 animate-pulse"></div>
        </div>
        <p class="mt-6 text-white/70 text-sm">피드를 불러오는 중...</p>
      </div>
    </div>
  </div>

  <div
    v-else-if="!loading && sortedFeed.length === 0"
    class="relative inset-0 h-full w-full bg-black text-white overflow-hidden select-none"
  >
    <div class="flex items-center justify-center h-full">
      <div class="text-center max-w-sm mx-auto p-6">
        <i class="fas fa-trophy text-4xl text-white/30 mb-4"></i>
        <h3 class="text-lg font-semibold mb-2">아직 경기가 없어요</h3>
        <p class="text-white/70 text-sm leading-relaxed">
          친구들과 첫 경기를 시작해보세요!<br />
          새로운 도전이 기다리고 있습니다.
        </p>
        <button
          class="mt-6 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-full transition-colors"
          @click="$router.push('/games')"
        >
          경기 만들기
        </button>
      </div>
    </div>
  </div>

  <div
    v-else-if="!loading && sortedFeed.length > 0 && post"
    class="relative inset-0 h-full w-full bg-black text-white overflow-hidden select-none feed-viewport"
    @touchstart.passive="onFeedTouchStart"
    @touchmove.passive="onFeedTouchMove"
    @touchend.passive="onFeedTouchEnd($event)"
    @mousedown="onFeedMouseDown"
    @mousemove="onFeedMouseMove"
    @mouseup="onFeedMouseUp"
    @mouseleave="onFeedMouseUp"
  >
    <div class="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <div v-if="prevPost" class="absolute inset-0" :style="prevPreviewStyle">
        <div
          v-if="prevPost.type === 'game' && prevPost.isCompleted"
          class="absolute inset-0 bg-gradient-to-br from-emerald-600/80 via-cyan-600/60 to-blue-700/40"
        ></div>
        <div
          v-else-if="
            prevPost.type === 'upcoming_game' || (prevPost.type === 'game' && !prevPost.isCompleted)
          "
          class="absolute inset-0 bg-gradient-to-br from-violet-600/80 via-purple-600/60 to-fuchsia-700/40"
        ></div>
        <div
          v-else-if="prevPost.type === 'invite'"
          class="absolute inset-0 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600"
        ></div>

        <div class="ambient-overlay"></div>
        <div class="relative z-10 w-full h-full flex items-center justify-center px-4">
          <div v-if="prevPost.type === 'invite'" class="text-center text-white">
            <div
              class="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center border border-white/30 mb-4"
            >
              <i class="fas fa-user-friends text-white text-2xl"></i>
            </div>
            <div class="text-lg font-bold">친구 초대</div>
            <div class="text-sm text-white/70">더 많은 컨텐츠를 확인하세요</div>
          </div>

          <div
            v-else-if="prevPost.type === 'game' && prevPost.isCompleted"
            class="w-[92%] max-w-xl rounded-2xl p-5 bg-white/10 backdrop-blur-md border border-white/15 shadow-2xl text-white/90"
          >
            <div class="flex items-center justify-between mb-5">
              <div class="text-xl font-extrabold">경기 결과</div>
              <div class="text-xs text-white/70">{{ prevPost.date }}</div>
            </div>
            <div class="grid grid-cols-[auto_1fr_auto] items-center gap-3">
              <div class="text-center">
                <img
                  :src="prevPost.players?.[0]?.avatar || prevPost.author?.avatar"
                  class="w-14 h-14 rounded-full mx-auto mb-2 object-cover border-2 border-white/20"
                />
                <div class="text-white font-semibold text-xs truncate">
                  {{ prevPost.players?.[0]?.name || prevPost.author?.name }}
                </div>
              </div>
              <div class="text-center">
                <div
                  class="font-extrabold text-white tracking-wide leading-none text-4xl sm:text-5xl"
                >
                  {{ prevPost.result?.scoreA || 0 }}<span class="text-white/50"> : </span
                  >{{ prevPost.result?.scoreB || 0 }}
                </div>
                <div class="mt-1 text-xs text-emerald-300 font-medium">
                  Winner · {{ prevPost.result?.winner || '?' }}
                </div>
              </div>
              <div class="text-center">
                <img
                  :src="prevPost.players?.[1]?.avatar || prevPost.author?.avatar"
                  class="w-14 h-14 rounded-full mx-auto mb-2 object-cover border-2 border-white/20"
                />
                <div class="text-white font-semibold text-xs truncate">
                  {{ prevPost.players?.[1]?.name || '상대' }}
                </div>
              </div>
            </div>
          </div>

          <div
            v-else-if="
              prevPost.type === 'upcoming_game' ||
              (prevPost.type === 'game' && !prevPost.isCompleted)
            "
            class="w-[92%] max-w-xl rounded-2xl p-5 bg-white/10 backdrop-blur-md border border-white/15 shadow-2xl text-white/90"
          >
            <div class="flex items-center justify-between mb-5">
              <div class="text-xl font-extrabold">예정된 경기</div>
              <div class="text-xs text-blue-300">{{ prevPost.date }}</div>
            </div>
            <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
              <div class="text-center">
                <img
                  :src="prevPost.author?.avatar"
                  class="w-14 h-14 rounded-full mx-auto mb-2 object-cover border-2 border-blue-400"
                />
                <div class="text-white font-semibold text-xs">{{ prevPost.author?.name }}</div>
                <div class="text-blue-300 text-xs">주최자</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-black text-white/90">VS</div>
                <div class="text-xs text-white/60 mt-1">예정</div>
              </div>
              <div class="text-center">
                <div
                  class="w-14 h-14 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full mx-auto mb-2 flex items-center justify-center border-2 border-white/30"
                >
                  <i class="fas fa-user-plus text-gray-600 text-lg"></i>
                </div>
                <div class="text-white/70 text-xs">참가자 모집</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="nextPost" class="absolute inset-0" :style="nextPreviewStyle">
        <div
          v-if="nextPost.type === 'game' && nextPost.isCompleted"
          class="absolute inset-0 bg-gradient-to-br from-emerald-600/80 via-cyan-600/60 to-blue-700/40"
        ></div>
        <div
          v-else-if="
            nextPost.type === 'upcoming_game' || (nextPost.type === 'game' && !nextPost.isCompleted)
          "
          class="absolute inset-0 bg-gradient-to-br from-violet-600/80 via-purple-600/60 to-fuchsia-700/40"
        ></div>
        <div
          v-else-if="nextPost.type === 'invite'"
          class="absolute inset-0 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600"
        ></div>

        <div class="ambient-overlay"></div>
        <div class="relative z-10 w-full h-full flex items-center justify-center px-4">
          <div v-if="nextPost.type === 'invite'" class="text-center text-white">
            <div
              class="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center border border-white/30 mb-4"
            >
              <i class="fas fa-user-friends text-white text-2xl"></i>
            </div>
            <div class="text-lg font-bold">친구 초대</div>
            <div class="text-sm text-white/70">더 많은 컨텐츠를 확인하세요</div>
          </div>

          <div
            v-else-if="nextPost.type === 'game' && nextPost.isCompleted"
            class="w-[92%] max-w-xl rounded-2xl p-5 bg-white/10 backdrop-blur-md border border-white/15 shadow-2xl text-white/90"
          >
            <div class="flex items-center justify-between mb-5">
              <div class="text-xl font-extrabold">경기 결과</div>
              <div class="text-xs text-white/70">{{ nextPost.date }}</div>
            </div>
            <div class="grid grid-cols-[auto_1fr_auto] items-center gap-3">
              <div class="text-center">
                <img
                  :src="nextPost.players?.[0]?.avatar || nextPost.author?.avatar"
                  class="w-14 h-14 rounded-full mx-auto mb-2 object-cover border-2 border-white/20"
                />
                <div class="text-white font-semibold text-xs truncate">
                  {{ nextPost.players?.[0]?.name || nextPost.author?.name }}
                </div>
              </div>
              <div class="text-center">
                <div
                  class="font-extrabold text-white tracking-wide leading-none text-4xl sm:text-5xl"
                >
                  {{ nextPost.result?.scoreA || 0 }}<span class="text-white/50"> : </span
                  >{{ nextPost.result?.scoreB || 0 }}
                </div>
                <div class="mt-1 text-xs text-emerald-300 font-medium">
                  Winner · {{ nextPost.result?.winner || '?' }}
                </div>
              </div>
              <div class="text-center">
                <img
                  :src="nextPost.players?.[1]?.avatar || nextPost.author?.avatar"
                  class="w-14 h-14 rounded-full mx-auto mb-2 object-cover border-2 border-white/20"
                />
                <div class="text-white font-semibold text-xs truncate">
                  {{ nextPost.players?.[1]?.name || '상대' }}
                </div>
              </div>
            </div>
          </div>

          <div
            v-else-if="
              nextPost.type === 'upcoming_game' ||
              (nextPost.type === 'game' && !nextPost.isCompleted)
            "
            class="w-[92%] max-w-xl rounded-2xl p-5 bg-white/10 backdrop-blur-md border border-white/15 shadow-2xl text-white/90"
          >
            <div class="flex items-center justify-between mb-5">
              <div class="text-xl font-extrabold">예정된 경기</div>
              <div class="text-xs text-blue-300">{{ nextPost.date }}</div>
            </div>
            <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
              <div class="text-center">
                <img
                  :src="nextPost.author?.avatar"
                  class="w-14 h-14 rounded-full mx-auto mb-2 object-cover border-2 border-blue-400"
                />
                <div class="text-white font-semibold text-xs">{{ nextPost.author?.name }}</div>
                <div class="text-blue-300 text-xs">주최자</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-black text-white/90">VS</div>
                <div class="text-xs text-white/60 mt-1">예정</div>
              </div>
              <div class="text-center">
                <div
                  class="w-14 h-14 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full mx-auto mb-2 flex items-center justify-center border-2 border-white/30"
                >
                  <i class="fas fa-user-plus text-gray-600 text-lg"></i>
                </div>
                <div class="text-white/70 text-xs">참가자 모집</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div
      class="relative h-full w-full"
      :style="feedWrapperStyle"
      @transitionend="onFeedSnapTransitionEnd"
    >
      <AppInvitePost
        v-if="post.type === 'invite' || post.type === 'friend-invite'"
        @invite="handleInvite"
        @skip="handleSkipInvite"
        class="absolute inset-0 z-30"
      />
      <!-- Slides progress (top) -->
      <div
        v-if="post.type !== 'friend-invite'"
        class="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex gap-3 justify-center items-center"
      >
        <span
          v-for="(s, i) in sections"
          :key="'prog-dot-' + i"
          :class="[
            'w-3 h-3 rounded-full transition-all duration-200',
            i === currentSlide
              ? 'bg-orange-400 shadow-[0_0_0_2px_rgba(251,140,0,0.25)]'
              : 'bg-orange-400/30',
          ]"
        ></span>
      </div>

      <div
        class="absolute inset-0 z-0"
        @touchstart.passive="onTouchStart"
        @touchmove.passive="onTouchMove"
        @touchend.passive="onTouchEnd($event)"
        @mousedown.passive="onMouseDown"
        @mousemove.passive="onMouseMove"
        @mouseup.passive="onMouseUp($event)"
        @mouseleave.passive="onMouseUp($event)"
      >
        <div class="h-full flex" :style="wrapperStyle">
          <section
            v-if="post.type === 'game' && post.isCompleted && features.headline && hasPhotos"
            class="w-screen shrink-0 h-full relative"
          >
            <img
              :src="headlinePhoto.url"
              alt="headline"
              class="absolute inset-0 w-full h-full object-cover"
              draggable="false"
            />
            <div class="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/60" />
            <div class="ambient-overlay" />

            <div class="absolute bottom-[140px] left-0 right-0 px-4 z-10">
              <div
                class="max-w-xl bg-black/35 border border-white/10 rounded-2xl p-4 backdrop-blur-md"
              >
                <div class="text-lg font-bold">{{ post.players[0]?.name }}의 경기 하이라이트</div>
                <div class="mt-1 text-xs text-white/80">
                  {{ post.meta.place }}
                </div>
                <div class="mt-2 flex flex-wrap gap-1.5">
                  <span
                    v-for="t in post.tags"
                    :key="t"
                    class="text-[10px] px-2 py-1 rounded-full bg-white/10 border border-white/10"
                    >#{{ t }}</span
                  >
                </div>
              </div>
            </div>
          </section>

          <!-- 2. 경기 정보 (결과 + 규칙 접기/펼치기) -->
          <section class="w-screen shrink-0 h-full relative flex items-center justify-center">
            <div class="absolute inset-0 bg-gradient-to-b from-indigo-900 via-black to-black" />
            <div class="ambient-overlay" />

            <div
              class="relative z-10 w-[92%] max-w-xl rounded-2xl p-5 bg-white/10 backdrop-blur-md border border-white/15 shadow-2xl"
            >
              <div class="flex items-center justify-between mb-5">
                <div class="flex items-center justify-between text-xs text-white/60 mb-2">
                  <span>규칙 · {{ post.rule?.title || '경기' }}</span>
                  <button
                    class="px-3 py-1 rounded-full bg-black/30 border border-white/10 text-white/90 active:scale-95"
                    @click="showRuleModal = true"
                  >
                    자세히 보기
                  </button>
                </div>
                <div class="text-xs text-white/60">{{ post.date }}</div>
              </div>

              <div v-if="post.type === 'game' && post.isCompleted" class="space-y-6">
                <div class="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                  <div class="text-center relative">
                    <img
                      :src="post.players[0].avatar"
                      class="w-16 h-16 rounded-full mx-auto mb-2 object-cover border-2"
                      :class="
                        post.result.winner === post.players[0].name
                          ? 'border-amber-400 shadow-[0_0_0_3px_rgba(251,191,36,0.25)]'
                          : 'border-white/20'
                      "
                    />
                    <div
                      v-if="post.result.winner === post.players[0].name"
                      class="absolute -top-2 left-1/2 -translate-x-1/2 text-amber-300 text-xs flex items-center gap-1 winner-glow"
                    >
                      <span class="inline-block w-4 h-4" v-html="icons.trophy" /> WINNER
                    </div>
                    <div class="text-white font-semibold text-sm truncate">
                      {{ post.players[0].name }}
                    </div>
                  </div>
                  <div class="text-center">
                    <div
                      class="font-extrabold text-white tracking-wide leading-none text-[9.5vw] sm:text-6xl whitespace-nowrap"
                    >
                      {{ post.result.scoreA }}<span class="text-white/50"> : </span
                      >{{ post.result.scoreB }}
                    </div>
                    <div class="mt-1 text-xs text-emerald-300 font-medium">
                      Winner · {{ post.result.winner }}
                    </div>
                  </div>
                  <div class="text-center relative">
                    <img
                      :src="post.players[1].avatar"
                      class="w-16 h-16 rounded-full mx-auto mb-2 object-cover border-2"
                      :class="
                        post.result.winner === post.players[1].name
                          ? 'border-amber-400 shadow-[0_0_0_3px_rgba(251,191,36,0.25)]'
                          : 'border-white/20'
                      "
                    />
                    <div
                      v-if="post.result.winner === post.players[1].name"
                      class="absolute -top-2 left-1/2 -translate-x-1/2 text-amber-300 text-xs flex items-center gap-1 winner-glow"
                    >
                      <span class="inline-block w-4 h-4" v-html="icons.trophy" /> WINNER
                    </div>
                    <div class="text-white font-semibold text-sm truncate">
                      {{ post.players[1].name }}
                    </div>
                  </div>
                </div>

                <div
                  @click="showRuleModal = true"
                  class="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 cursor-pointer hover:bg-white/15 transition-all duration-200 group"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <div
                        class="w-10 h-10 bg-emerald-500/30 rounded-lg flex items-center justify-center"
                      >
                        <i class="fas fa-book text-emerald-400 text-lg"></i>
                      </div>
                      <div>
                        <div class="text-white font-semibold text-sm">경기 규칙</div>
                        <div class="text-white/70 text-xs">
                          {{ post.rule?.ruleTitle || post.rule?.title }}
                        </div>
                      </div>
                    </div>
                    <div class="text-white/50 group-hover:text-white/80 transition-colors">
                      <i class="fas fa-chevron-right text-sm"></i>
                    </div>
                  </div>
                  <div class="mt-3 text-white/60 text-xs">
                    {{ post.rule?.majorCategory }} • {{ post.rule?.minorCategory }} • 자세히 보기
                  </div>
                </div>
              </div>

              <div
                v-else-if="
                  post.type === 'upcoming_game' || (post.type === 'game' && !post.isCompleted)
                "
                class="space-y-6"
              >
                <div class="flex items-center gap-4">
                  <img
                    class="w-14 h-14 rounded-xl border border-white/30"
                    :src="`/category-picture/${post.rule?.minorCategory || '미분류'}.png`"
                    :alt="post.rule?.minorCategory"
                  />
                  <div class="flex-1">
                    <div class="text-white font-bold text-lg">{{ post.rule?.title || '경기' }}</div>
                    <div class="text-white/70 text-sm">
                      {{ post.rule?.majorCategory }} • {{ post.rule?.minorCategory }}
                    </div>
                  </div>
                </div>

                <div
                  @click="showRuleModal = true"
                  class="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 cursor-pointer hover:bg-white/15 transition-all duration-200 group"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <div
                        class="w-10 h-10 bg-blue-500/30 rounded-lg flex items-center justify-center"
                      >
                        <i class="fas fa-book text-blue-400 text-lg"></i>
                      </div>
                      <div>
                        <div class="text-white font-semibold text-sm">경기 규칙</div>
                        <div class="text-white/70 text-xs">
                          {{ post.rule?.ruleTitle || post.rule?.title }}
                        </div>
                      </div>
                    </div>
                    <div class="text-white/50 group-hover:text-white/80 transition-colors">
                      <i class="fas fa-chevron-right text-sm"></i>
                    </div>
                  </div>
                  <div class="mt-3 text-white/60 text-xs">
                    {{ post.rule?.majorCategory }} • {{ post.rule?.minorCategory }} • 자세히 보기
                  </div>
                </div>

                <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                  <div class="text-center">
                    <img
                      :src="post.players[0]?.avatar"
                      class="w-16 h-16 rounded-full mx-auto mb-2 object-cover border-2 border-blue-400"
                    />
                    <div class="text-white font-semibold text-sm">{{ post.players[0]?.name }}</div>
                    <div class="text-blue-300 text-xs font-medium">주최자</div>
                  </div>

                  <div class="text-center">
                    <div class="text-3xl font-black text-white/90">VS</div>
                    <div class="text-xs text-white/60 mt-1">예정</div>
                  </div>

                  <div class="text-center">
                    <div
                      class="w-16 h-16 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full mx-auto mb-2 flex items-center justify-center border-2 border-white/30"
                    >
                      <i class="fas fa-user-plus text-gray-600 text-xl"></i>
                    </div>
                    <div class="text-white/70 text-sm">참가자 모집</div>
                  </div>
                </div>

                <div class="space-y-3">
                  <div class="flex items-center gap-3 text-white/90">
                    <i class="fas fa-calendar text-blue-400 w-4"></i>
                    <span class="text-sm">{{ post.date }} 예정</span>
                  </div>
                  <div class="flex items-center gap-3 text-white/90">
                    <i class="fas fa-map-marker-alt text-blue-400 w-4"></i>
                    <span class="text-sm">{{ post.meta?.place || '장소 미정' }}</span>
                  </div>
                  <div class="flex items-center gap-3 text-white/90">
                    <i class="fas fa-users text-blue-400 w-4"></i>
                    <span class="text-sm">2명 매치</span>
                  </div>
                </div>

                <div class="mt-6">
                  <button
                    @click="handleJoin(post.id)"
                    class="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                  >
                    경기 참가하기
                  </button>
                </div>
              </div>

              <div
                v-if="post.type === 'game' && post.isCompleted"
                class="mt-2 text-center italic text-white/70 text-xs"
              >
                이 매치, 너라면 이길 수 있어?
              </div>
              <div
                v-if="post.type === 'game' && post.isCompleted"
                class="mt-4 grid grid-cols-2 gap-2 text-xs text-white/80"
              >
                <div class="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2">
                  <span class="inline-block w-4 h-4" v-html="icons.trophy" />
                  <span>세트수 {{ post.result.sets }}</span>
                </div>
                <div class="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2">
                  <span class="inline-block w-4 h-4" v-html="icons.clock" />
                  <span>총 시간 {{ post.result.duration }}</span>
                </div>
              </div>
              <div v-if="post.type === 'game' && post.isCompleted" class="mt-4 space-y-2">
                <div
                  v-for="(sc, idx) in post.result.setScores"
                  :key="'set-' + idx"
                  class="flex items-center justify-between bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/90"
                >
                  <div class="font-semibold">{{ sc.set + 1 }}세트</div>
                  <div class="font-bold">{{ sc.scoreA }} : {{ sc.scoreB }}</div>
                </div>
              </div>
              <div v-if="post.type === 'game' && post.isCompleted" class="mt-4">
                <div class="flex items-center justify-between text-xs text-white/60 mb-2">
                  <span>규칙 · {{ post.rule.title }}</span>
                  <button
                    class="px-3 py-1 rounded-full bg-black/30 border border-white/10 text-white/90 active:scale-95"
                    @click="showRuleModal = true"
                  >
                    자세히 보기
                  </button>
                </div>
              </div>
              <div
                v-if="post.type === 'game' && post.isCompleted"
                class="mt-3 text-[11px] text-white/70 flex items-center justify-between"
              >
                <span>{{ post.meta.place }}</span>
                <span>{{ post.meta.time }}</span>
              </div>
            </div>
          </section>

          <section
            v-if="
              post?.type === 'game' &&
              post?.isCompleted &&
              features.reviews &&
              post?.reviews?.length > 0
            "
            class="w-screen shrink-0 h-full relative"
          >
            <div class="absolute inset-0 bg-gradient-to-b from-slate-900 via-black to-black" />
            <div class="ambient-overlay" />
            <div
              class="relative z-10 h-full flex flex-col justify-center items-center gap-4 px-4 py-12"
            >
              <div class="max-w-xl mx-auto w-full">
                <div class="flex items-center justify-between mb-1">
                  <div class="text-xl font-extrabold">평점 & 리뷰</div>
                  <div class="text-xs text-white/70" v-if="post.reviews && post.reviews.length > 0">
                    총 {{ post.reviews.length }}개
                  </div>
                </div>
                <div class="text-[11px] text-white/60 mb-2">너라면 더 잘할 수 있지?</div>
              </div>
              <div
                v-if="post.reviews?.length > 0 && post.reviews[0]?.author"
                class="flex items-center justify-center"
              >
                <div
                  class="w-full max-w-xl bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 text-center min-h-56 flex flex-col justify-between"
                >
                  <div class="flex items-center gap-3">
                    <img
                      :src="
                        post.reviews[0]?.author?.avatar ||
                        'https://d1iimlpplvq3em.cloudfront.net/service/default-profile.png'
                      "
                      class="w-12 h-12 rounded-full object-cover"
                    />
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between">
                        <div class="font-semibold truncate">
                          {{ post.reviews[0]?.author?.name || '익명' }}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="mt-3 text-white/80 text-sm leading-snug">
                    <span v-if="!expandedReviews[0]">{{
                      post.reviews[0]?.text ? truncatedText(post.reviews[0].text) : ''
                    }}</span>
                    <span v-else>{{ post.reviews[0]?.text || '' }}</span>
                  </div>
                  <div class="mt-2 flex items-center justify-between text-xs text-white/70">
                    <button
                      class="px-2 py-1 bg-black/30 border border-white/10 rounded-full active:scale-95"
                      @click="toggleExpand(0)"
                    >
                      {{ expandedReviews[0] ? '접기' : '더보기' }}
                    </button>
                    <button
                      class="px-2 py-1 bg-black/30 border border-white/10 rounded-full active:scale-95"
                      @click="toggleHelpful(0)"
                    >
                      도움이 됐어요 · {{ helpfulCounts[0] || 0 }}
                    </button>
                  </div>
                </div>
              </div>
              <div
                v-if="post.reviews?.length > 1 && post.reviews[1]?.author"
                class="flex items-center justify-center"
              >
                <div
                  class="w-full max-w-xl bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 text-center min-h-56 flex flex-col justify-between"
                >
                  <div class="flex items-center gap-3">
                    <img
                      :src="
                        post.reviews[1]?.author?.avatar ||
                        'https://d1iimlpplvq3em.cloudfront.net/service/default-profile.png'
                      "
                      class="w-12 h-12 rounded-full object-cover"
                    />
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between">
                        <div class="font-semibold truncate">
                          {{ post.reviews[1]?.author?.name || '익명' }}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="mt-3 text-white/80 text-sm leading-snug">
                    <span v-if="!expandedReviews[1]">{{
                      post.reviews[1]?.text ? truncatedText(post.reviews[1].text) : ''
                    }}</span>
                    <span v-else>{{ post.reviews[1]?.text || '' }}</span>
                  </div>
                  <div class="mt-2 flex items-center justify-between text-xs text-white/70">
                    <button
                      class="px-2 py-1 bg-black/30 border border-white/10 rounded-full active:scale-95"
                      @click="toggleExpand(1)"
                    >
                      {{ expandedReviews[1] ? '접기' : '더보기' }}
                    </button>
                    <button
                      class="px-2 py-1 bg-black/30 border border-white/10 rounded-full active:scale-95"
                      @click="toggleHelpful(1)"
                    >
                      도움이 됐어요 · {{ helpfulCounts[1] || 0 }}
                    </button>
                  </div>
                </div>
              </div>

              <div
                v-if="!post.reviews || post.reviews.length === 0"
                class="flex items-center justify-center"
              >
                <div
                  class="w-full max-w-xl bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-8 text-center"
                >
                  <div class="text-white/70 text-sm">
                    <i class="fas fa-comment-dots text-2xl mb-3 block"></i>
                    아직 리뷰가 없습니다.<br />
                    첫 번째 리뷰를 남겨보세요!
                  </div>
                </div>
              </div>
            </div>
          </section>
          <section
            v-if="features.friendRanking"
            class="w-screen shrink-0 h-full relative p-5 flex items-center justify-center"
          >
            <div
              class="absolute inset-0 bg-gradient-to-br from-pink-600 via-rose-600 to-orange-600"
            />
            <div class="ambient-overlay" />
            <div class="relative z-10 max-w-xl w-full">
              <div class="flex items-center justify-between mb-2">
                <div class="text-xl font-extrabold">친구 랭킹</div>
                <div class="text-xs text-white/70">총 {{ friendsRanking.length }}명</div>
              </div>
              <div class="text-[11px] text-white/60 mb-2">오늘은 누구를 제칠까?</div>
              <div
                class="bg-white/10 border border-white/15 rounded-2xl backdrop-blur-md max-h-[70vh] overflow-auto no-scrollbar touch-scroll"
                @touchstart.stop
                @touchmove.stop
                @touchend.stop
              >
                <div
                  v-for="(f, i) in friendsRanking"
                  :key="f.id"
                  class="flex items-center gap-3 px-4 py-2 border-b border-white/10 last:border-b-0 cursor-pointer active:scale-[0.98] transition"
                  :class="i < 3 ? 'bg-amber-400/5' : ''"
                  @click="goFriendProfile(f)"
                >
                  <div
                    class="w-8 text-center font-bold"
                    :class="i < 3 ? 'text-amber-300' : 'text-white'"
                  >
                    {{ i + 1 }}
                  </div>
                  <img :src="f.avatar" class="w-8 h-8 rounded-full object-cover" />
                  <div class="flex-1 min-w-0">
                    <div class="truncate">{{ f.name }}</div>
                    <div class="text-[10px] text-white/70 truncate">
                      최근 경기 {{ f.recentGames }} · 승률 {{ (f.winRate * 100).toFixed(0) }}%
                    </div>
                  </div>
                  <div v-if="f.isFriend" class="text-xs text-white/80">팔로우 됨</div>
                  <button
                    v-else
                    class="px-2 py-1 rounded-full bg-emerald-400/20 border border-emerald-300/30 text-emerald-200 text-xs active:scale-95"
                    @click.stop="makeFriend(i)"
                  >
                    팔로우
                  </button>
                </div>
              </div>
            </div>
          </section>

          <template v-for="p in galleryPhotos" :key="'gal-' + p.id">
            <section
              v-if="post.type === 'game' && post.isCompleted && features.gallery"
              class="w-screen shrink-0 h-full relative"
            >
              <img
                :src="p.url"
                alt="photo"
                class="absolute inset-0 w-full h-full object-cover"
                draggable="false"
              />
              <div
                class="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60"
              ></div>
              <div class="ambient-overlay"></div>
            </section>
          </template>
        </div>
      </div>

      <!-- Right action buttons column -->
      <div class="absolute z-40 right-4 bottom-[22%] flex flex-col items-center gap-4">
        <button
          v-if="post.type === 'game' && post.isCompleted"
          @click="toggleLike"
          class="flex flex-col items-center active:scale-95 transition"
        >
          <span
            class="w-8 h-8"
            :class="[post?.isLiked ? 'text-red-500' : '', likeBump ? 'like-bump' : '']"
            v-html="post?.isLiked ? icons.heartFill : icons.heart"
          ></span>
          <span class="text-[10px] mt-1">또 보고싶어</span>
        </button>
        <button
          v-if="post.type === 'game' && post.isCompleted"
          @click="onDoWithMe"
          class="flex flex-col items-center active:scale-95 transition"
        >
          <span class="w-8 h-8" v-html="icons.handshake"></span>
          <span class="text-[10px] mt-1">나랑도 해</span>
        </button>
        <button @click="onComment" class="flex flex-col items-center active:scale-95 transition">
          <span class="w-8 h-8" v-html="icons.comment"></span>
          <span class="text-[10px] mt-1">댓글</span>
        </button>
        <button @click="onShare" class="flex flex-col items-center active:scale-95 transition">
          <span class="w-8 h-8" v-html="icons.share"></span>
          <span class="text-[10px] mt-1">공유</span>
        </button>
      </div>

      <div class="pointer-events-none absolute inset-0 z-30">
        <div
          v-for="h in hearts"
          :key="h.id"
          class="absolute text-red-500 animate-heart-pop"
          :style="{ left: h.x + 'px', top: h.y + 'px' }"
          v-html="icons.heartFill"
        ></div>
      </div>
    </div>
  </div>

  <div v-if="showRuleModal" class="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm">
    <div class="h-full flex flex-col">
      <div
        class="flex-shrink-0 px-6 py-4 bg-gradient-to-r from-slate-900/95 to-gray-900/95 border-b border-white/10"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <i class="fas fa-book text-blue-400 text-sm"></i>
            </div>
            <div>
              <h2 class="text-xl font-bold text-white">경기 규칙</h2>
              <p class="text-sm text-white/60">{{ post?.rule?.ruleTitle || '규칙 제목 없음' }}</p>
            </div>
          </div>
          <button
            class="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/80 flex items-center justify-center transition-all duration-200 active:scale-95"
            @click="showRuleModal = false"
          >
            <i class="fas fa-times text-sm"></i>
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-hidden">
        <div class="h-full overflow-y-auto scrollbar-hidden" style="scroll-behavior: smooth">
          <div class="px-6 py-6 space-y-6">
            <div
              class="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl overflow-hidden"
            >
              <div class="px-5 py-4 bg-blue-500/10 border-b border-blue-500/20">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <i class="fas fa-target text-blue-400 text-xs"></i>
                  </div>
                  <h3 class="font-semibold text-white">경기 목표</h3>
                </div>
              </div>
              <div class="px-5 py-4">
                <p class="text-white/80 leading-relaxed whitespace-pre-line">
                  {{ post?.rule?.ruleGoal || '목표 정보 없음' }}
                </p>
              </div>
            </div>

            <div
              class="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl overflow-hidden"
            >
              <div class="px-5 py-4 bg-emerald-500/10 border-b border-emerald-500/20">
                <div class="flex items-center gap-2">
                  <div
                    class="w-6 h-6 bg-emerald-500/20 rounded-lg flex items-center justify-center"
                  >
                    <i class="fas fa-calculator text-emerald-400 text-xs"></i>
                  </div>
                  <h3 class="font-semibold text-white">점수 계산</h3>
                </div>
              </div>
              <div class="px-5 py-4">
                <p class="text-white/80 leading-relaxed whitespace-pre-line">
                  {{ post?.rule?.ruleScoreDefinition || '점수 정보 없음' }}
                </p>
              </div>
            </div>

            <div
              class="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-2xl overflow-hidden"
            >
              <div class="px-5 py-4 bg-orange-500/10 border-b border-orange-500/20">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <i class="fas fa-tools text-orange-400 text-xs"></i>
                  </div>
                  <h3 class="font-semibold text-white">경기 준비</h3>
                </div>
              </div>
              <div class="px-5 py-4">
                <p class="text-white/80 leading-relaxed whitespace-pre-line">
                  {{ post?.rule?.rulePreparation || '준비 정보 없음' }}
                </p>
              </div>
            </div>

            <div
              class="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl overflow-hidden"
            >
              <div class="px-5 py-4 bg-purple-500/10 border-b border-purple-500/20">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <i class="fas fa-list-ol text-purple-400 text-xs"></i>
                  </div>
                  <h3 class="font-semibold text-white">경기 순서</h3>
                </div>
              </div>
              <div class="px-5 py-4">
                <p class="text-white/80 leading-relaxed whitespace-pre-line">
                  {{ post?.rule?.ruleOrder || '순서 정보 없음' }}
                </p>
              </div>
            </div>

            <div
              class="bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border border-indigo-500/20 rounded-2xl overflow-hidden"
            >
              <div class="px-5 py-4 bg-indigo-500/10 border-b border-indigo-500/20">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                    <i class="fas fa-gavel text-indigo-400 text-xs"></i>
                  </div>
                  <h3 class="font-semibold text-white">판정 기준</h3>
                </div>
              </div>
              <div class="px-5 py-4">
                <p class="text-white/80 leading-relaxed whitespace-pre-line">
                  {{ post?.rule?.ruleDecision || '판정 정보 없음' }}
                </p>
              </div>
            </div>

            <div
              class="bg-gradient-to-br from-red-500/10 to-pink-500/10 border border-red-500/20 rounded-2xl overflow-hidden"
            >
              <div class="px-5 py-4 bg-red-500/10 border-b border-red-500/20">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <i class="fas fa-exclamation-triangle text-red-400 text-xs"></i>
                  </div>
                  <h3 class="font-semibold text-white">반칙</h3>
                </div>
              </div>
              <div class="px-5 py-4">
                <p class="text-white/80 leading-relaxed whitespace-pre-line">
                  {{ post?.rule?.ruleFoul || '반칙 정보 없음' }}
                </p>
              </div>
            </div>

            <div
              v-if="post?.rule?.ruleExtraInfo"
              class="bg-gradient-to-br from-gray-500/10 to-slate-500/10 border border-gray-500/20 rounded-2xl overflow-hidden"
            >
              <div class="px-5 py-4 bg-gray-500/10 border-b border-gray-500/20">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 bg-gray-500/20 rounded-lg flex items-center justify-center">
                    <i class="fas fa-info-circle text-gray-400 text-xs"></i>
                  </div>
                  <h3 class="font-semibold text-white">추가 정보</h3>
                </div>
              </div>
              <div class="px-5 py-4">
                <p class="text-white/80 leading-relaxed whitespace-pre-line">
                  {{ post?.rule?.ruleExtraInfo }}
                </p>
              </div>
            </div>

            <div class="h-4"></div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div
    v-else-if="!loading && (!sortedFeed.length || !post)"
    class="relative inset-0 h-full w-full bg-black text-white overflow-hidden select-none"
  >
    <div class="flex items-center justify-center h-full">
      <div class="text-center max-w-sm mx-auto p-6">
        <i class="fas fa-trophy text-4xl text-white/30 mb-4"></i>
        <h3 class="text-lg font-semibold mb-2">아직 경기가 없어요</h3>
        <p class="text-white/70 text-sm leading-relaxed">첫 번째 경기를 만들어보세요!</p>
        <button
          class="mt-6 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-full transition-colors"
          @click="$router.push('/games')"
        >
          경기 만들기
        </button>
      </div>
    </div>
  </div>

  <Footer tab="feed" />
  <CustomToast />

  <div
    v-if="showPlayerSelectModal"
    class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    @click="closePlayerSelectModal"
  >
    <div class="bg-white rounded-2xl max-w-sm w-full max-h-[80vh] overflow-y-auto" @click.stop>
      <div class="flex items-center justify-between p-6 border-b">
        <h3 class="text-lg font-bold text-gray-900">플레이어 선택</h3>
        <button
          @click="closePlayerSelectModal"
          class="text-gray-400 hover:text-gray-600 transition"
        >
          <i class="fas fa-times text-xl"></i>
        </button>
      </div>

      <div class="p-6">
        <p class="text-sm text-gray-600 mb-4">누구에게 나랑도해 요청을 보낼까요?</p>
        <div class="space-y-3">
          <button
            v-for="player in post?.players || []"
            :key="player.id"
            @click="sendPlayWithMeRequest(player)"
            class="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-orange-300 hover:bg-orange-50 transition group"
          >
            <img
              :src="player.avatar || '/assets/default.png'"
              :alt="player.name"
              class="w-12 h-12 rounded-full object-cover border-2 border-gray-200 group-hover:border-orange-300 transition"
            />
            <div class="flex-1 text-left">
              <div class="font-semibold text-gray-900 group-hover:text-orange-600 transition">
                {{ player.name }}
              </div>
              <div class="text-sm text-gray-500">플레이어</div>
            </div>
            <i
              class="fas fa-chevron-right text-gray-400 group-hover:text-orange-500 transition"
            ></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import Footer from '../../components/FooterNav.vue'
import api, { playWithMeTooAPI } from '../../api/api'
import featureFlags from '../../config/features'
import { useToast } from '../../composable/useToast'
import CustomToast from '../../components/CustomToast.vue'
import AppInvitePost from '../../components/feed/AppInvitePost.vue'
import { useFeed } from '../../composables/useFeed.js'
const router = useRouter()
// Currently available info flags for gating UI
const features = featureFlags
const { showToast } = useToast()

// 피드 데이터 관리
const { loading, sortedFeed, loadFeed } = useFeed()
const showNotificationPanel = ref(false)
const notifications = ref([])
const unreadCount = ref(0)

// 나랑도해 상태 관리
const playWithMeRequests = ref(new Map()) // userId -> boolean (요청 상태)
const showPlayerSelectModal = ref(false) // 플레이어 선택 모달 표시 상태

const fetchNotifications = async () => {
  const res = await api.get('/api/notifications')
  notifications.value = res.data
  console.log(res.data)
  unreadCount.value = notifications.value.filter((n) => !n.isRead).length
}

const toggleNotificationPanel = async () => {
  showNotificationPanel.value = !showNotificationPanel.value
  if (showNotificationPanel.value && notifications.value.length === 0) {
    await fetchNotifications()
  }
}

const openNotification = async (n) => {
  if (!n.isRead) {
    await api.post(`/api/notifications/${n.id}/read`)
    n.isRead = true
    unreadCount.value = notifications.value.filter((x) => !x.isRead).length
  }
  // url 존재 시 해당 링크로 이동
  if (n.url) {
    try {
      // 1. 완전한 URL이면, pathname + search + hash 만 추출
      const parsed = new URL(n.url, window.location.origin)
      const internalPath = parsed.pathname + parsed.search + parsed.hash
      router.push(internalPath)
    } catch (e) {
      // 2. 이미 상대경로면 그대로 push
      router.push(n.url)
    }
  }
}

const notificationIcon = (type) => {
  switch (type) {
    case 'GAME_START':
      return 'fas fa-play-circle text-orange-400'
    case 'GAME_END':
      return 'fas fa-flag-checkered text-gray-500'
    case 'GAME_COMMENT':
      return 'fas fa-comment-dots text-blue-400'
    case 'COMMENT_REPLY':
      return 'fas fa-comment-dots text-blue-400'
    case 'INBOX':
      return 'fas fa-inbox text-pink-400'
    case 'MY_GAME':
      return 'fas fa-calendar-alt text-green-500'
    default:
      return 'fas fa-bell text-orange-400'
  }
}

onMounted(() => {
  console.log('FeedView onMounted 실행')
  fetchNotifications()
  console.log('loadFeed 호출 예정')
  loadFeed()
})
// 현재 표시 중인 피드 인덱스
const currentFeedIndex = ref(0)

// 현재 표시 중인 포스트
const post = computed(() => {
  return sortedFeed.value[currentFeedIndex.value] || null
})

watch(
  post,
  async (newPost) => {
    if (newPost && newPost.type === 'game' && newPost.isCompleted) {
      await fetchLikeStatus(newPost)
    }
  },
  { immediate: true },
)

async function fetchLikeStatus(gamePost) {
  try {
    const response = await api.get(`/api/games/${gamePost.id}/like`)
    const { isLiked, totalCount } = response.data

    const postInFeed = sortedFeed.value.find((p) => p.id === gamePost.id)
    if (postInFeed) {
      postInFeed.isLiked = isLiked
      postInFeed.likeCount = totalCount
    }
  } catch (error) {
    console.error('좋아요 상태 조회 실패:', error)
    const postInFeed = sortedFeed.value.find((p) => p.id === gamePost.id)
    if (postInFeed) {
      postInFeed.isLiked = false
      postInFeed.likeCount = postInFeed.likeCount || 0
    }
  }
}

// ---------------------------
// Vertical feed management
// ---------------------------
// 이전 피드 관리 변수들 제거됨 - useFeed 사용

// 이전 더미 데이터 및 앱 초대 관련 함수들 제거됨

async function loadMoreFeed() {
  // 더 이상 사용하지 않음 - useFeed에서 페이지네이션 처리
  console.log('loadMoreFeed called but not implemented')
}

// 남은 미시청 항목이 5개가 되면 추가 로드
watch(currentFeedIndex, async (idx) => {
  const remaining = sortedFeed.value.length - idx - 1
  if (remaining === 5) {
    await loadMoreFeed()
  }
})

// Event handlers for app invite
const handleInvite = () => {
  console.log('Invite clicked')
  // Add invite functionality
  // Move to next post
  if (currentFeedIndex.value < sortedFeed.value.length - 1) {
    setCurrentFeed(currentFeedIndex.value + 1)
  }
}

const handleSkipInvite = () => {
  console.log('Skip invite clicked')
  // Move to next post
  if (currentFeedIndex.value < sortedFeed.value.length - 1) {
    setCurrentFeed(currentFeedIndex.value + 1)
  }
}

// Event handler for scheduled game join
const handleJoin = (postId) => {
  console.log('Join clicked:', postId)
  // Add join functionality
}

// fetchInitialFeed는 더 이상 필요없음 - useFeed의 loadFeed 사용

function setCurrentFeed(i) {
  const next = Math.max(0, Math.min(i, sortedFeed.value.length - 1))
  if (next === currentFeedIndex.value) return
  currentFeedIndex.value = next

  // post는 computed이므로 자동으로 업데이트됨
  // 포스트 단위 UX 상태 초기화
  currentSlide.value = 0
  hearts.value = []
  expandedReviews[0] = false
  expandedReviews[1] = false
  helpfulCounts[0] = 0
  helpfulCounts[1] = 0
  tryVibrate(10)
}

// Feed-level vertical swipe handling
const feedStartX = ref(0)
const feedStartY = ref(0)
const feedDeltaX = ref(0)
const feedDeltaY = ref(0)
const feedEndY = ref(0)
const feedIsPointerDown = ref(false)
const feedIsVertical = ref(false)
let feedGestureStartAt = 0
let feedActiveScrollEl = null
const feedTranslateY = ref(0)
const feedAnimating = ref(false)
let feedSwipeDirection = 0 // -1: down(이전), 1: up(다음), 0: none

const feedWrapperStyle = computed(() => ({
  transform: `translateY(${feedTranslateY.value}px)`,
  transition: feedAnimating.value ? 'transform 380ms cubic-bezier(.22,1,.36,1)' : 'none',
  willChange: 'transform',
}))

// Adjacent post previews
const nextPost = computed(() => sortedFeed.value[currentFeedIndex.value + 1] || null)
const prevPost = computed(() => sortedFeed.value[currentFeedIndex.value - 1] || null)

const nextPreviewStyle = computed(() => ({
  transform: `translateY(${(typeof window !== 'undefined' ? window.innerHeight : 800) + feedTranslateY.value}px)`,
  transition: feedAnimating.value ? 'transform 380ms cubic-bezier(.22,1,.36,1)' : 'none',
  willChange: 'transform',
}))
const prevPreviewStyle = computed(() => ({
  transform: `translateY(${-(typeof window !== 'undefined' ? window.innerHeight : 800) + feedTranslateY.value}px)`,
  transition: feedAnimating.value ? 'transform 380ms cubic-bezier(.22,1,.36,1)' : 'none',
  willChange: 'transform',
}))

function onFeedTouchStart(e) {
  const t = e.touches?.[0]
  if (!t) return
  feedStartX.value = t.clientX
  feedStartY.value = t.clientY
  feedDeltaX.value = 0
  feedDeltaY.value = 0
  feedEndY.value = feedStartY.value
  feedIsVertical.value = false
  feedIsPointerDown.value = true
  feedGestureStartAt = Date.now()
  feedActiveScrollEl = findScrollable(e.target)
  feedAnimating.value = false
  feedSwipeDirection = 0
  feedTranslateY.value = 0
}

function onFeedTouchMove(e) {
  if (!feedIsPointerDown.value) return
  const t = e.touches?.[0]
  if (!t) return
  const x = t.clientX
  const y = t.clientY
  feedDeltaX.value = x - feedStartX.value
  feedDeltaY.value = y - feedStartY.value
  feedEndY.value = y

  // 수직 제스처 우선 판별 + 내부 스크롤 존재 시 무시
  if (!feedIsVertical.value) {
    const verticalDominant =
      Math.abs(feedDeltaY.value) > Math.abs(feedDeltaX.value) && Math.abs(feedDeltaY.value) > 6
    if (verticalDominant && !feedActiveScrollEl) feedIsVertical.value = true
    const horizontalDominant = Math.abs(feedDeltaX.value) > Math.abs(feedDeltaY.value) + 6
    if (horizontalDominant) {
      // 가로 슬라이드 제스처로 간주: 상위 피드 제스처 중단
      feedIsPointerDown.value = false
      feedIsVertical.value = false
      feedTranslateY.value = 0
      return
    }
  }
  if (feedIsVertical.value && !feedActiveScrollEl) {
    // 가장자리에서 저항
    const atFirst = currentFeedIndex.value === 0 && feedDeltaY.value > 0
    const atLast = currentFeedIndex.value === sortedFeed.value.length - 1 && feedDeltaY.value < 0
    const resist = atFirst || atLast
    feedTranslateY.value = resist ? feedDeltaY.value * 0.35 : feedDeltaY.value
  }
}

function onFeedTouchEnd(e) {
  if (!feedIsPointerDown.value) return
  const thresholdPx = Math.floor(window.innerHeight * 0.08) // 조금 더 관대하게
  const duration = Math.max(1, Date.now() - feedGestureStartAt)
  const velocityY = feedDeltaY.value / duration

  const target = e?.target
  const onControl = !!(
    target &&
    target.closest &&
    target.closest('button, a, input, textarea, select, label, [data-stop-slide]')
  )
  const verticalMove = Math.abs(feedDeltaY.value) > Math.abs(feedDeltaX.value)
  const movedY = Math.abs(feedDeltaY.value) > thresholdPx || Math.abs(velocityY) > 0.25

  if (verticalMove && !onControl && movedY) {
    if (feedDeltaY.value < 0 && currentFeedIndex.value < sortedFeed.value.length - 1) {
      // 다음으로 스냅 아웃
      feedAnimating.value = true
      feedSwipeDirection = 1
      requestAnimationFrame(() => {
        feedTranslateY.value = -window.innerHeight
      })
    } else if (feedDeltaY.value > 0 && currentFeedIndex.value > 0) {
      // 이전으로 스냅 아웃
      feedAnimating.value = true
      feedSwipeDirection = -1
      requestAnimationFrame(() => {
        feedTranslateY.value = window.innerHeight
      })
    } else {
      // 경계: 원위치
      feedAnimating.value = true
      feedSwipeDirection = 0
      requestAnimationFrame(() => {
        feedTranslateY.value = 0
      })
    }
  } else {
    // 취소: 원위치 복귀
    feedAnimating.value = true
    feedSwipeDirection = 0
    requestAnimationFrame(() => {
      feedTranslateY.value = 0
    })
  }

  feedIsPointerDown.value = false
  feedIsVertical.value = false
  feedActiveScrollEl = null
}

function onFeedSnapTransitionEnd(e) {
  if (!feedAnimating.value) return
  if (e && e.target !== e.currentTarget) return
  if (feedSwipeDirection === 1) {
    setCurrentFeed(currentFeedIndex.value + 1)
  } else if (feedSwipeDirection === -1) {
    setCurrentFeed(currentFeedIndex.value - 1)
  }
  // 스냅 종료 후 즉시 원위치로 되돌림 (애니메이션 없이)
  feedAnimating.value = false
  feedSwipeDirection = 0
  feedTranslateY.value = 0
}

// Desktop mouse drag support for vertical feed
function onFeedMouseDown(e) {
  // 인터랙티브 요소는 무시
  if (
    e.target?.closest &&
    e.target.closest('button, a, input, textarea, select, label, [data-stop-slide]')
  )
    return
  feedStartX.value = e.clientX
  feedStartY.value = e.clientY
  feedDeltaX.value = 0
  feedDeltaY.value = 0
  feedEndY.value = feedStartY.value
  feedIsVertical.value = false
  feedIsPointerDown.value = true
  feedGestureStartAt = Date.now()
  feedActiveScrollEl = findScrollable(e.target)
  feedAnimating.value = false
  feedSwipeDirection = 0
  feedTranslateY.value = 0
}
function onFeedMouseMove(e) {
  if (!feedIsPointerDown.value) return
  const x = e.clientX
  const y = e.clientY
  feedDeltaX.value = x - feedStartX.value
  feedDeltaY.value = y - feedStartY.value
  feedEndY.value = y
  if (!feedIsVertical.value) {
    const verticalDominant =
      Math.abs(feedDeltaY.value) > Math.abs(feedDeltaX.value) && Math.abs(feedDeltaY.value) > 6
    if (verticalDominant && !feedActiveScrollEl) feedIsVertical.value = true
    const horizontalDominant = Math.abs(feedDeltaX.value) > Math.abs(feedDeltaY.value) + 6
    if (horizontalDominant) {
      feedIsPointerDown.value = false
      feedIsVertical.value = false
      feedTranslateY.value = 0
      return
    }
  }
  if (feedIsVertical.value && !feedActiveScrollEl) {
    const atFirst = currentFeedIndex.value === 0 && feedDeltaY.value > 0
    const atLast = currentFeedIndex.value === sortedFeed.value.length - 1 && feedDeltaY.value < 0
    const resist = atFirst || atLast
    feedTranslateY.value = resist ? feedDeltaY.value * 0.35 : feedDeltaY.value
  }
}
function onFeedMouseUp(e) {
  if (!feedIsPointerDown.value) return
  const thresholdPx = Math.floor(window.innerHeight * 0.08)
  const duration = Math.max(1, Date.now() - feedGestureStartAt)
  const velocityY = feedDeltaY.value / duration
  const target = e?.target
  const onControl = !!(
    target &&
    target.closest &&
    target.closest('button, a, input, textarea, select, label, [data-stop-slide]')
  )
  const verticalMove = Math.abs(feedDeltaY.value) > Math.abs(feedDeltaX.value)
  const movedY = Math.abs(feedDeltaY.value) > thresholdPx || Math.abs(velocityY) > 0.25
  if (verticalMove && !onControl && movedY) {
    if (feedDeltaY.value < 0 && currentFeedIndex.value < sortedFeed.value.length - 1) {
      feedAnimating.value = true
      feedSwipeDirection = 1
      requestAnimationFrame(() => {
        feedTranslateY.value = -window.innerHeight
      })
    } else if (feedDeltaY.value > 0 && currentFeedIndex.value > 0) {
      feedAnimating.value = true
      feedSwipeDirection = -1
      requestAnimationFrame(() => {
        feedTranslateY.value = window.innerHeight
      })
    } else {
      feedAnimating.value = true
      feedSwipeDirection = 0
      requestAnimationFrame(() => {
        feedTranslateY.value = 0
      })
    }
  } else {
    feedAnimating.value = true
    feedSwipeDirection = 0
    requestAnimationFrame(() => {
      feedTranslateY.value = 0
    })
  }
  feedIsPointerDown.value = false
  feedIsVertical.value = false
  feedActiveScrollEl = null
}

// Photos computed
const hasPhotos = computed(
  () => post.value && Array.isArray(post.value.photos) && post.value.photos.length > 0,
)

const headlinePhoto = computed(() => {
  // 새 API 구조: photos 배열의 첫 번째가 헤드라인 이미지
  if (!post.value) return null
  const photos = post.value.photos || []
  if (photos.length === 0) return null

  // 문자열 배열이므로 url 속성으로 감싸서 반환
  return { url: photos[0] }
})
const galleryPhotos = computed(() => {
  // 새 API 구조: 첫 번째를 제외한 나머지가 갤러리 사진들
  if (!post.value) return []
  const photos = post.value.photos || []
  if (photos.length <= 1) return []

  // 나머지 사진들을 url 객체로 변환
  return photos.slice(1).map((url) => ({ url }))
})

// Sections order
const sections = computed(() => {
  const arr = []

  if (!post.value) return arr

  // 예정된 경기는 경기 정보와 친구 랭킹 표시
  if (
    post.value.type === 'upcoming_game' ||
    (post.value.type === 'game' && !post.value.isCompleted)
  ) {
    if (features.gameInfo) arr.push('경기 정보')
    if (features.friendRanking) arr.push('친구 랭킹')
    return arr
  }

  // 완료된 경기는 모든 섹션 표시
  if (post.value.type === 'game' && post.value.isCompleted) {
    if (features.headline && hasPhotos.value) arr.push('헤드라인 사진')
    if (features.gameInfo) arr.push('경기 정보')
    if (features.reviews && post.value.reviews?.length > 0) arr.push('평점 & 리뷰')
    if (features.friendRanking) arr.push('친구 랭킹')
    if (features.gallery) {
      for (let i = 0; i < galleryPhotos.value.length; i++) arr.push('전체 사진')
    }
  }

  return arr
})
const totalSlides = computed(() => sections.value.length)

// const currentSectionLabel = computed(() => sections.value[currentSlide.value] || '')

// Slides logic
const currentSlide = ref(0)
const translateX = ref(0)
const animating = ref(false)
const startX = ref(0)
const startY = ref(0)
const deltaX = ref(0)
const deltaY = ref(0)
const endX = ref(0)
const isVerticalScroll = ref(false)
const isPointerDown = ref(false)
let gestureStartAt = 0
let activeScrollEl = null
let lastTapAt = 0
const hearts = ref([])

// Reviews UX state
const expandedReviews = reactive({ 0: false, 1: false })
const helpfulCounts = reactive({ 0: 0, 1: 0 })

function truncatedText(t) {
  const max = 60
  return t && t.length > max ? t.slice(0, max) + '…' : t
}
function toggleExpand(i) {
  expandedReviews[i] = !expandedReviews[i]
}
function toggleHelpful(i) {
  helpfulCounts[i] = (helpfulCounts[i] || 0) + 1
  tryVibrate(10)
}

const wrapperStyle = computed(() => ({
  width: totalSlides.value * 100 + 'vw',
  transform: `translateX(calc(${-currentSlide.value * 100}vw + ${translateX.value}px))`,
  transition: animating.value ? 'transform 380ms cubic-bezier(.22,1,.36,1)' : 'none',
  willChange: 'transform',
}))

function onTouchStart(e) {
  const t = e.touches[0]
  startX.value = t.clientX
  startY.value = t.clientY
  endX.value = startX.value
  deltaX.value = 0
  deltaY.value = 0
  isVerticalScroll.value = false
  animating.value = false
  activeScrollEl = findScrollable(e.target)
  isPointerDown.value = true
  gestureStartAt = Date.now()
}

function onTouchMove(e) {
  const t = e.touches[0]
  const x = t.clientX
  const y = t.clientY
  deltaX.value = x - startX.value
  deltaY.value = y - startY.value
  endX.value = x

  // lock to vertical if vertical movement dominates or inside scrollable
  if (!isVerticalScroll.value) {
    const verticalDominant =
      Math.abs(deltaY.value) > Math.abs(deltaX.value) && Math.abs(deltaY.value) > 4
    if (verticalDominant || activeScrollEl) {
      isVerticalScroll.value = true
    }
  }
  if (isVerticalScroll.value) {
    translateX.value = 0
    return
  }

  // horizontal swipe with overscroll resistance
  const atStart = currentSlide.value === 0 && deltaX.value > 0
  const atEnd = currentSlide.value === totalSlides.value - 1 && deltaX.value < 0
  translateX.value = atStart || atEnd ? deltaX.value * 0.35 : deltaX.value
}

function onTouchEnd(e) {
  const thresholdPx = Math.floor(window.innerWidth * 0.12)
  const duration = Math.max(1, Date.now() - gestureStartAt)
  const velocityX = deltaX.value / duration // px per ms
  // Horizontal swipe navigation
  if (
    !isVerticalScroll.value &&
    (Math.abs(deltaX.value) > thresholdPx || Math.abs(velocityX) > 0.25)
  ) {
    // commit to next/prev and snap immediately without overshoot
    commitSlide(deltaX.value < 0 ? 1 : -1)
  } else {
    // treat as tap/double-tap (even inside scrollables if no movement)
    const now = Date.now()
    const tapGap = now - lastTapAt
    const movedX = Math.abs(deltaX.value) > 10
    const movedY = Math.abs(deltaY.value) > 10
    const target = e?.target
    const onControl = !!(
      target &&
      target.closest &&
      target.closest('button, a, input, textarea, select, label, [data-stop-slide]')
    )
    if (!onControl && !movedX && !movedY && tapGap < 260) {
      //    const ty = e?.changedTouches?.[0]?.clientY ?? window.innerHeight * 0.45
      toggleLike()
      lastTapAt = 0
    } else if (!onControl && !movedX && !movedY) {
      lastTapAt = now
    }
    // animate back to current slide smoothly
    animating.value = true
    translateX.value = 0
  }
  setTimeout(() => {
    animating.value = false
  }, 380)
  isPointerDown.value = false
}

function findScrollable(el) {
  try {
    let node = el
    while (node && node !== document.body) {
      const st = getComputedStyle(node)
      if (
        (st.overflowY === 'auto' || st.overflowY === 'scroll') &&
        node.scrollHeight > node.clientHeight
      ) {
        return node
      }
      node = node.parentElement
    }
  } catch (e) {
    // ignore
  }
  return null
}

// Mouse drag support (desktop)
function onMouseDown(e) {
  // ignore if clicked interactive controls
  if (
    e.target.closest &&
    e.target.closest('button, a, input, textarea, select, label, [data-stop-slide]')
  )
    return
  startX.value = e.clientX
  startY.value = e.clientY
  endX.value = startX.value
  deltaX.value = 0
  deltaY.value = 0
  isVerticalScroll.value = false
  animating.value = false
  isPointerDown.value = true
  gestureStartAt = Date.now()
}
function onMouseMove(e) {
  if (!isPointerDown.value) return
  const x = e.clientX
  const y = e.clientY
  deltaX.value = x - startX.value
  deltaY.value = y - startY.value
  endX.value = x
  if (!isVerticalScroll.value) {
    const verticalDominant =
      Math.abs(deltaY.value) > Math.abs(deltaX.value) && Math.abs(deltaY.value) > 4
    if (verticalDominant) isVerticalScroll.value = true
  }
  if (isVerticalScroll.value) {
    translateX.value = 0
    return
  }
  const atStart = currentSlide.value === 0 && deltaX.value > 0
  const atEnd = currentSlide.value === totalSlides.value - 1 && deltaX.value < 0
  translateX.value = atStart || atEnd ? deltaX.value * 0.35 : deltaX.value
}
function onMouseUp(e) {
  if (!isPointerDown.value) return
  const thresholdPx = Math.floor(window.innerWidth * 0.12)
  const duration = Math.max(1, Date.now() - gestureStartAt)
  const velocityX = deltaX.value / duration
  if (
    !isVerticalScroll.value &&
    (Math.abs(deltaX.value) > thresholdPx || Math.abs(velocityX) > 0.25)
  ) {
    commitSlide(deltaX.value < 0 ? 1 : -1)
  } else {
    // desktop double-click style
    const now = Date.now()
    const tapGap = now - lastTapAt
    const movedX = Math.abs(deltaX.value) > 6
    const movedY = Math.abs(deltaY.value) > 6
    const target = e?.target
    const onControl = !!(
      target &&
      target.closest &&
      target.closest('button, a, input, textarea, select, label, [data-stop-slide]')
    )
    if (!onControl && !movedX && !movedY && tapGap < 260) {
      toggleLike()
      lastTapAt = 0
    } else if (!onControl && !movedX && !movedY) {
      lastTapAt = now
    }
    // animate back
    animating.value = true
    translateX.value = 0
  }
  setTimeout(() => {
    animating.value = false
  }, 380)
  isPointerDown.value = false
}

function commitSlide(dir) {
  animating.value = true
  // reset drag offset so we don't overshoot
  translateX.value = 0
  // defer index change to next frame so CSS transition applies cleanly
  requestAnimationFrame(() => {
    const before = currentSlide.value
    if (dir > 0) currentSlide.value = Math.min(currentSlide.value + 1, totalSlides.value - 1)
    else currentSlide.value = Math.max(currentSlide.value - 1, 0)
    if (currentSlide.value !== before) tryVibrate(10)
  })
}

// Actions
const likeBump = ref(false)
async function toggleLike() {
  if (!post.value || post.value.type !== 'game' || !post.value.isCompleted) {
    return
  }

  const currentPost = post.value
  const originalLikedState = currentPost.isLiked
  const originalLikeCount = currentPost.likeCount || 0

  // 1. Optimistic UI Update (UI 즉시 변경)
  currentPost.isLiked = !originalLikedState
  currentPost.likeCount = originalLikedState ? originalLikeCount - 1 : originalLikeCount + 1
  if (currentPost.likeCount < 0) currentPost.likeCount = 0

  // Animation & Haptic
  likeBump.value = false
  requestAnimationFrame(() => {
    likeBump.value = true
    setTimeout(() => (likeBump.value = false), 240)
  })
  tryVibrate(15)

  // Double tap heart spawn
  if (!originalLikedState) {
    const feedElement = document.querySelector('.feed-viewport')
    if (feedElement) {
      const rect = feedElement.getBoundingClientRect()
      spawnHeart(rect.width / 2, rect.height / 2)
    }
  }

  try {
    // 2. API 호출
    const response = await api.post(`/api/games/${currentPost.id}/like`)

    // 3. 서버 응답으로 상태 동기화 (선택적이지만 권장)
    currentPost.isLiked = response.data.isLiked
    currentPost.likeCount = response.data.totalCount
  } catch (error) {
    console.error('좋아요 토글 실패:', error)
    showToast('요청 처리 중 오류가 발생했습니다.', 'error')

    // 4. 실패 시 UI 롤백
    currentPost.isLiked = originalLikedState
    currentPost.likeCount = originalLikeCount
  }
}
function onDoWithMe() {
  if (!post.value || !post.value.players || post.value.players.length === 0) {
    showToast('플레이어 정보를 찾을 수 없습니다.', 'error')
    return
  }

  // 플레이어 선택 모달 열기
  showPlayerSelectModal.value = true
}

// 선택된 플레이어에게 나랑도해 요청 보내기
async function sendPlayWithMeRequest(selectedPlayer) {
  console.log('Selected player:', selectedPlayer)
  console.log('Rule ID:', post.value?.rule?.id)

  if (!post.value?.rule?.id) {
    showToast('경기 정보를 찾을 수 없습니다.', 'error')
    return
  }

  const targetUserId = selectedPlayer.id
  const ruleId = post.value.rule.id

  console.log('Sending request with targetUserId:', targetUserId, 'ruleId:', ruleId)

  try {
    await playWithMeTooAPI.sendRequest(targetUserId, ruleId)
    playWithMeRequests.value.set(targetUserId, true)
    showToast(`${selectedPlayer.name}님에게 나랑도해 요청을 보냈습니다.`, 'success')
    showPlayerSelectModal.value = false
  } catch (error) {
    console.error('나랑도해 요청 처리 중 오류:', error)
    showToast('요청 처리 중 오류가 발생했습니다.', 'error')
  }
}

// 플레이어 선택 모달 닫기
function closePlayerSelectModal() {
  showPlayerSelectModal.value = false
}

function onComment() {
  router.push('/games/demo-game/comments')
}
async function onShare() {
  const url = window.location.origin + '/'
  const text = `${post.value.players[0]?.name}의 경기 하이라이트 – Raspy`
  try {
    if (navigator.share) {
      await navigator.share({ title: 'Raspy', text, url })
    } else {
      await navigator.clipboard.writeText(url)
      alert('링크를 복사했어요!')
    }
  } catch (e) {
    console.log(e)
  }
}

const showRuleModal = ref(false)

function goFriendProfile(f) {
  if (!f || !f.id) return
  // router.push(`/profile/0`)
  alert('친구 페이지로 이동함')
}

function tryVibrate(ms) {
  try {
    if (navigator.vibrate) navigator.vibrate(ms)
  } catch (e) {
    // ignore
  }
}

function spawnHeart(x, y) {
  const id = Math.random().toString(36).slice(2)
  hearts.value.push({ id, x: x - 16, y: y - 16 })
  setTimeout(() => {
    hearts.value = hearts.value.filter((h) => h.id !== id)
  }, 700)
}

// Icons (inline SVG)
const icons = {
  heart:
    '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" xmlns="http://www.w3.org/2000/svg"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"/></svg>',
  heartFill:
    '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"/></svg>',
  handshake:
    '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" xmlns="http://www.w3.org/2000/svg"><path d="M8.5 13.5 10 15a2.828 2.828 0 0 0 4 0l3.5-3.5m-5-5 2 2m-7 7 2 2"/><path d="M3 8.5 8.5 3 12 6.5l3.5-3.5L21 8.5l-6.5 6.5"/></svg>',
  comment:
    '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" xmlns="http://www.w3.org/2000/svg"><path d="M21 12a8 8 0 0 1-8 8H7l-4 3V12a8 8 0 1 1 18 0Z"/></svg>',
  share:
    '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" xmlns="http://www.w3.org/2000/svg"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M16 6 12 2 8 6"/><path d="M12 2v14"/></svg>',
  camera:
    '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.6" xmlns="http://www.w3.org/2000/svg"><path d="M3 7h3l2-3h8l2 3h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"/><circle cx="12" cy="13" r="4"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.6" xmlns="http://www.w3.org/2000/svg"><path d="m12 3 2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8L3.5 9.2l5.9-.9L12 3Z"/></svg>',
  starFill:
    '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="m12 3 2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8L3.5 9.2l5.9-.9L12 3Z"/></svg>',
  trophy:
    '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.6" xmlns="http://www.w3.org/2000/svg"><path d="M8 21h8M12 17a5 5 0 0 0 5-5V4H7v8a5 5 0 0 0 5 5Z"/><path d="M5 4H3v2a4 4 0 0 0 4 4"/><path d="M19 4h2v2a4 4 0 0 1-4 4"/></svg>',
  clock:
    '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.6" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
  chevron:
    '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" xmlns="http://www.w3.org/2000/svg"><path d="m6 9 6 6 6-6"/></svg>',
}

onBeforeUnmount(() => {})
// Friends ranking (dummy 50 entries)
const friendsRanking = ref(
  Array.from({ length: 50 }, (_, i) => ({
    id: 'f' + (i + 1),
    name: '친구 ' + (i + 1),
    avatar: `https://i.pravatar.cc/100?img=${(i % 70) + 1}`,
    isFriend: i % 4 === 0,
    recentGames: 8 + (i % 5),
    winRate: 0.45 + ((50 - i) % 30) / 100,
  })),
)

function makeFriend(i) {
  const f = friendsRanking.value[i]
  if (f && !f.isFriend) {
    f.isFriend = true
    tryVibrate(10)
  }
}
</script>

<style scoped>
.w-8 :deep(svg),
.w-4 :deep(svg) {
  width: 100%;
  height: 100%;
}
.w-8 :deep(svg),
.w-4 :deep(svg) {
  display: block;
}

@keyframes heart-pop {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  10% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(1.6) translateY(-20px);
    opacity: 0;
  }
}
.animate-heart-pop :deep(svg) {
  width: 32px;
  height: 32px;
  animation: heart-pop 650ms ease forwards;
}

@keyframes like-bump-kf {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.12);
  }
  100% {
    transform: scale(1);
  }
}
.like-bump {
  animation: like-bump-kf 240ms ease;
}

/* Ambient mood overlay for emotional impact */
.ambient-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(1200px 600px at 20% 80%, rgba(255, 166, 0, 0.1), transparent 60%),
    radial-gradient(1000px 500px at 85% 20%, rgba(236, 72, 153, 0.08), transparent 60%);
  animation: ambient-move 12s ease-in-out infinite alternate;
}

@keyframes ambient-move {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
    opacity: 0.85;
  }
  100% {
    transform: translate3d(0, -8px, 0) scale(1.02);
    opacity: 1;
  }
}

/* Winner label subtle glow */
.winner-glow {
  text-shadow:
    0 0 6px rgba(251, 191, 36, 0.55),
    0 0 12px rgba(251, 191, 36, 0.35);
  filter: saturate(1.05);
  animation: winner-pulse 2.6s ease-in-out infinite;
}

@keyframes winner-pulse {
  0%,
  100% {
    opacity: 0.9;
    transform: translateY(0);
  }
  50% {
    opacity: 1;
    transform: translateY(-1px);
  }
}

/* hide scrollbars for rule box */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* enable smooth touch scrolling inside nested scroll areas */
.touch-scroll {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
  touch-action: pan-y;
}

.feed-viewport {
  touch-action: none;
  overscroll-behavior-y: contain;
}

/* Winner label subtle glow */
.winner-glow {
  text-shadow:
    0 0 6px rgba(251, 191, 36, 0.55),
    0 0 12px rgba(251, 191, 36, 0.35);
  filter: saturate(1.05);
  animation: winner-pulse 2.6s ease-in-out infinite;
}

@keyframes winner-pulse {
  0%,
  100% {
    opacity: 0.9;
    transform: translateY(0);
  }
  50% {
    opacity: 1;
    transform: translateY(-1px);
  }
}

/* hide scrollbars for rule box */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* enable smooth touch scrolling inside nested scroll areas */
.touch-scroll {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
  touch-action: pan-y;
}

.feed-viewport {
  touch-action: none;
  overscroll-behavior-y: contain;
}

/* Hide scrollbar for better UX */
.scrollbar-hidden {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.scrollbar-hidden::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}
</style>
