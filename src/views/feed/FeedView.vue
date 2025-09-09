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

  <div class="relative h-[100dvh] w-full bg-black text-white overflow-hidden select-none">
    <!-- Slides progress (top) -->
    <div class="absolute top-0 left-0 right-0 z-20 flex gap-1 p-4 raspy-top">
      <div
        v-for="(s, i) in sections"
        :key="'prog-' + i"
        class="h-1 flex-1 rounded-full bg-white/30 overflow-hidden"
      >
        <div class="h-full bg-white" :style="{ width: i <= currentSlide ? '100%' : '0%' }" />
      </div>
    </div>

    <!-- Tap zones removed to allow inner scroll and gestures only -->

    <!-- Slides Wrapper -->
    <div
      class="absolute inset-0 z-0"
      @touchstart.passive="onTouchStart"
      @touchmove.passive="onTouchMove"
      @touchend.passive="onTouchEnd"
      @mousedown.passive="onMouseDown"
      @mousemove.passive="onMouseMove"
      @mouseup.passive="onMouseUp"
      @mouseleave.passive="onMouseUp"
    >
      <div class="h-full flex" :style="wrapperStyle">
        <!-- 1. 헤드라인 사진 (있을 때만) -->
        <section v-if="hasPhotos" class="w-screen shrink-0 h-full relative">
          <img
            :src="headlinePhoto.url"
            alt="headline"
            class="absolute inset-0 w-full h-full object-cover"
            draggable="false"
          />
          <div class="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/60" />
          <div
            class="absolute bottom-[calc(96px+env(safe-area-inset-bottom))] left-4 text-xs bg-white/10 border border-white/15 rounded-full px-2 py-1 backdrop-blur-md"
          >
            {{ idx('헤드라인 사진') + 1 }} / {{ totalSlides }} · 헤드라인 사진
          </div>
          <!-- Content overlay for 헤드라인 사진 -->
          <div
            class="absolute bottom-[calc(140px+env(safe-area-inset-bottom))] left-0 right-0 px-4 z-10"
          >
            <div
              class="max-w-xl bg-black/35 border border-white/10 rounded-2xl p-4 backdrop-blur-md"
            >
              <div class="text-lg font-bold">{{ post.author.name }}의 경기 하이라이트</div>
              <div class="mt-1 text-xs text-white/80">
                {{ post.meta.place }} · {{ post.meta.time }}
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
          <div
            class="relative z-10 w-[86%] max-w-xl rounded-2xl p-5 bg-white/10 backdrop-blur-md border border-white/15 shadow-2xl"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="text-white/80 text-sm">Match Result</div>
              <div class="text-xs text-white/60">{{ post.date }}</div>
            </div>
            <div class="grid grid-cols-3 items-center gap-3">
              <div class="text-center">
                <img
                  :src="post.players[0].avatar"
                  class="w-14 h-14 rounded-full mx-auto mb-2 object-cover"
                />
                <div class="text-white font-semibold text-sm truncate">
                  {{ post.players[0].name }}
                </div>
              </div>
              <div class="text-center">
                <div class="text-5xl font-extrabold text-white tracking-wider">
                  {{ post.result.scoreA }}<span class="text-white/50"> : </span
                  >{{ post.result.scoreB }}
                </div>
                <div class="mt-1 text-xs text-emerald-300 font-medium">
                  Winner · {{ post.result.winner }}
                </div>
              </div>
              <div class="text-center">
                <img
                  :src="post.players[1].avatar"
                  class="w-14 h-14 rounded-full mx-auto mb-2 object-cover"
                />
                <div class="text-white font-semibold text-sm truncate">
                  {{ post.players[1].name }}
                </div>
              </div>
            </div>
            <div class="mt-4 grid grid-cols-2 gap-2 text-xs text-white/80">
              <div class="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2">
                <span class="inline-block w-4 h-4" v-html="icons.trophy" />
                <span>세트수 {{ post.result.sets }}</span>
              </div>
              <div class="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2">
                <span class="inline-block w-4 h-4" v-html="icons.clock" />
                <span>총 시간 {{ post.result.duration }}</span>
              </div>
            </div>
            <!-- 세트 결과: 세로 전체폭 -->
            <div class="mt-4 space-y-2">
              <div
                v-for="(sc, idx) in post.result.setScores"
                :key="'set-' + idx"
                class="flex items-center justify-between bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/90"
              >
                <div class="font-semibold">{{ idx + 1 }}세트</div>
                <div class="font-bold">{{ sc.a }} : {{ sc.b }}</div>
              </div>
            </div>
            <!-- 규칙: 모달로 자세히 보기 -->
            <div class="mt-4">
              <div class="flex items-center justify-between text-xs text-white/60 mb-2">
                <span>규칙 · 총 {{ post.rule.items.length }}개 · 약 {{ ruleReadSeconds }}초</span>
                <button
                  class="px-3 py-1 rounded-full bg-black/30 border border-white/10 text-white/90 active:scale-95"
                  @click="showRuleModal = true"
                >
                  자세히 보기
                </button>
              </div>
            </div>
            <div class="mt-3 text-[11px] text-white/70 flex items-center justify-between">
              <span>{{ post.meta.place }}</span>
              <span>{{ post.meta.time }}</span>
            </div>
            <!-- 빠른 이동/행동 -->
            <div class="mt-3 flex flex-wrap gap-2 justify-center text-xs">
              <button
                class="px-3 py-1 rounded-full bg-black/30 border border-white/10 text-white/90 active:scale-95"
                @click="goToReviews"
              >
                리뷰 보기
              </button>
              <button
                class="px-3 py-1 rounded-full bg-black/30 border border-white/10 text-white/90 active:scale-95"
                @click="goToRanking"
              >
                랭킹 보기
              </button>
              <button
                v-if="idx('전체 사진') >= 0"
                class="px-3 py-1 rounded-full bg-black/30 border border-white/10 text-white/90 active:scale-95"
                @click="goToGallery"
              >
                사진 보기
              </button>
              <button
                class="px-3 py-1 rounded-full bg-emerald-400/20 border border-emerald-300/30 text-emerald-200 active:scale-95"
                @click="onDoWithMe"
              >
                리매치 제안
              </button>
            </div>
          </div>
          <div
            class="absolute bottom-[calc(96px+env(safe-area-inset-bottom))] left-4 text-xs bg-white/10 border border-white/15 rounded-full px-2 py-1 backdrop-blur-md"
          >
            {{ idx('경기 정보') + 1 }} / {{ totalSlides }} · 경기 정보
          </div>
        </section>

        <!-- 3. 평점 & 리뷰 -->
        <section class="w-screen shrink-0 h-full relative">
          <div class="absolute inset-0 bg-gradient-to-b from-slate-900 via-black to-black" />
          <div class="relative z-10 h-full flex flex-col gap-3 px-4 py-12">
            <!-- 리뷰 요약 카드 -->
            <div class="flex items-center justify-center">
              <div
                class="w-full max-w-xl bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4"
              >
                <div class="flex items-center justify-between">
                  <div class="font-semibold">평점 & 리뷰</div>
                  <div class="text-xs text-white/70">{{ post.reviews.length }}개</div>
                </div>
                <div class="mt-3 grid grid-cols-2 gap-2 text-sm text-white">
                  <div class="bg-black/30 rounded-lg px-3 py-2 text-center">
                    퍼포먼스 {{ avgPerformance.toFixed(1) }}/5
                  </div>
                  <div class="bg-black/30 rounded-lg px-3 py-2 text-center">
                    매너 {{ avgManner.toFixed(1) }}/5
                  </div>
                </div>
              </div>
            </div>
            <div class="flex items-center justify-center">
              <div
                class="w-full max-w-xl bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4"
              >
                <div class="flex items-center gap-3">
                  <img :src="post.reviews[0].avatar" class="w-12 h-12 rounded-full object-cover" />
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between">
                      <div class="font-semibold truncate">{{ post.reviews[0].name }}</div>
                      <div class="text-[10px] flex gap-2">
                        <span class="px-2 py-1 rounded-full bg-black/30 border border-white/10"
                          >퍼포먼스 {{ post.reviews[0].performance.toFixed(1) }}/5</span
                        >
                        <span class="px-2 py-1 rounded-full bg-black/30 border border-white/10"
                          >매너 {{ post.reviews[0].manner.toFixed(1) }}/5</span
                        >
                      </div>
                    </div>
                    <!-- progress bars removed -->
                  </div>
                </div>
                <div class="mt-3 text-white/80 text-sm leading-snug">
                  <span v-if="!expandedReviews[0]">{{ truncatedText(post.reviews[0].text) }}</span>
                  <span v-else>{{ post.reviews[0].text }}</span>
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
            <div class="flex items-center justify-center">
              <div
                class="w-full max-w-xl bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4"
              >
                <div class="flex items-center gap-3">
                  <img :src="post.reviews[1].avatar" class="w-12 h-12 rounded-full object-cover" />
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between">
                      <div class="font-semibold truncate">{{ post.reviews[1].name }}</div>
                      <div class="text-[10px] flex gap-2">
                        <span class="px-2 py-1 rounded-full bg-black/30 border border-white/10"
                          >퍼포먼스 {{ post.reviews[1].performance.toFixed(1) }}/5</span
                        >
                        <span class="px-2 py-1 rounded-full bg-black/30 border border-white/10"
                          >매너 {{ post.reviews[1].manner.toFixed(1) }}/5</span
                        >
                      </div>
                    </div>
                    <!-- progress bars removed -->
                  </div>
                </div>
                <div class="mt-3 text-white/80 text-sm leading-snug">
                  <span v-if="!expandedReviews[1]">{{ truncatedText(post.reviews[1].text) }}</span>
                  <span v-else>{{ post.reviews[1].text }}</span>
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
          </div>
          <div
            class="absolute bottom-[calc(96px+env(safe-area-inset-bottom))] left-4 text-xs bg-white/10 border border-white/15 rounded-full px-2 py-1 backdrop-blur-md"
          >
            {{ idx('평점 & 리뷰') + 1 }} / {{ totalSlides }} · 평점 & 리뷰
          </div>
        </section>
        <!-- 4. 친구 랭킹 -->
        <section class="w-screen shrink-0 h-full relative p-5">
          <div class="absolute inset-0 bg-gradient-to-b from-fuchsia-900 via-black to-black" />
          <div class="relative z-10 max-w-xl mx-auto w-full">
            <div class="flex items-center justify-between mb-2">
              <div class="text-xl font-extrabold">친구 랭킹</div>
              <div class="text-xs text-white/70">총 {{ friendsRanking.length }}명</div>
            </div>
            <div
              class="bg-white/10 border border-white/15 rounded-2xl backdrop-blur-md max-h-[70vh] overflow-auto no-scrollbar touch-scroll"
              @touchstart.stop
              @touchmove.stop
              @touchend.stop
            >
              <div
                v-for="(f, i) in friendsRanking"
                :key="f.id"
                class="flex items-center gap-3 px-4 py-2 border-b border-white/10 last:border-b-0"
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
                <div v-if="f.isFriend" class="text-xs text-white/80">친구</div>
                <button
                  v-else
                  class="px-2 py-1 rounded-full bg-emerald-400/20 border border-emerald-300/30 text-emerald-200 text-xs active:scale-95"
                  @click="makeFriend(i)"
                >
                  팔로우
                </button>
              </div>
            </div>
          </div>
          <div
            class="absolute bottom-[calc(96px+env(safe-area-inset-bottom))] left-4 text-xs bg-white/10 border border-white/15 rounded-full px-2 py-1 backdrop-blur-md"
          >
            {{ idx('친구 랭킹') + 1 }} / {{ totalSlides }} · 친구 랭킹
          </div>
        </section>

        <!-- 5. 전체 사진 (헤드라인 제외, 각 1장씩 슬라이드) -->
        <section
          v-for="(p, gi) in galleryPhotos"
          :key="'gal-' + p.id"
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
          />
          <div
            class="absolute bottom-[calc(140px+env(safe-area-inset-bottom))] left-4 text-xs bg-white/10 border border-white/15 rounded-full px-2 py-1 backdrop-blur-md"
          >
            {{ formatTakenAt(p.takenAt) }}
          </div>
          <div
            class="absolute bottom-[calc(96px+env(safe-area-inset-bottom))] left-4 text-xs bg-white/10 border border-white/15 rounded-full px-2 py-1 backdrop-blur-md"
          >
            {{ idx('전체 사진') + gi + 1 }} / {{ totalSlides }} · 사진
          </div>
        </section>
      </div>
    </div>

    <!-- Bottom left info (author/caption) -->
    <div class="absolute z-30 left-0 right-0 bottom-[calc(16px+env(safe-area-inset-bottom))] px-4">
      <div class="flex items-end justify-between gap-3 pr-16">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-3">
            <img :src="post.author.avatar" class="w-10 h-10 rounded-full object-cover" />
            <div class="min-w-0">
              <div class="font-semibold truncate">{{ post.author.name }}</div>
              <div class="text-xs text-white/70 truncate">{{ post.caption }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Right action buttons column -->
    <div
      class="absolute z-40 right-4 bottom-[calc(22%+env(safe-area-inset-bottom))] flex flex-col items-center gap-4"
    >
      <button @click="toggleLike" class="flex flex-col items-center active:scale-95 transition">
        <span
          class="w-8 h-8"
          :class="liked ? 'text-red-500' : ''"
          v-html="liked ? icons.heartFill : icons.heart"
        />
        <span class="text-[10px] mt-1">또 보고싶어</span>
      </button>
      <button @click="onDoWithMe" class="flex flex-col items-center active:scale-95 transition">
        <span class="w-8 h-8" v-html="icons.handshake" />
        <span class="text-[10px] mt-1">나랑도 해</span>
      </button>
      <button @click="onComment" class="flex flex-col items-center active:scale-95 transition">
        <span class="w-8 h-8" v-html="icons.comment" />
        <span class="text-[10px] mt-1">댓글</span>
      </button>
      <button @click="onShare" class="flex flex-col items-center active:scale-95 transition">
        <span class="w-8 h-8" v-html="icons.share" />
        <span class="text-[10px] mt-1">공유</span>
      </button>
    </div>

    <!-- Skip button removed per spec -->

    <!-- Floating like hearts -->
    <div class="pointer-events-none absolute inset-0 z-30">
      <div
        v-for="h in hearts"
        :key="h.id"
        class="absolute text-red-500 animate-heart-pop"
        :style="{ left: h.x + 'px', top: h.y + 'px' }"
        v-html="icons.heartFill"
      />
    </div>
  </div>

  <!-- Rules modal -->
  <div v-if="showRuleModal" class="fixed inset-0 z-50 bg-black/80 flex flex-col">
    <div class="flex items-center justify-between px-4 py-3 border-b border-white/10">
      <div class="text-lg font-bold">경기 규칙</div>
      <button
        class="px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80 active:scale-95"
        @click="showRuleModal = false"
      >
        닫기
      </button>
    </div>
    <div
      class="flex-1 overflow-auto p-4 space-y-2 touch-scroll"
      @touchstart.stop
      @touchmove.stop
      @touchend.stop
    >
      <div
        v-for="(it, idx) in post.rule.items"
        :key="'rm-' + idx"
        class="bg-white/10 border border-white/10 rounded-xl"
      >
        <div class="px-4 py-3 font-semibold">{{ idx + 1 }}. {{ it.title }}</div>
        <div class="px-4 pb-4 text-sm text-white/80 leading-snug">{{ it.desc }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../api/api'
const router = useRouter()
const showNotificationPanel = ref(false)
const notifications = ref([])
const unreadCount = ref(0)

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
  fetchNotifications()
})
// Dummy post data
const post = reactive({
  id: 'demo-1',
  date: '2025-09-05',
  // 전체 사진 (인증샷 포함). 첫 항목이 헤드라인 사진이라고 가정 (isHeadline: true)
  photos: [
    {
      id: 'p1',
      url: 'https://prodigits.co.uk/content4/wallpapers/2024/p2/29/f4te4054.jpg',
      takenAt: '2025-09-05T20:05:00+09:00',
      isHeadline: true,
    },
    {
      id: 'p2',
      url: 'https://images.unsplash.com/photo-1546484959-f9a53db84d8e?q=80&w=1200&auto=format&fit=crop',
      takenAt: '2025-09-05T20:08:00+09:00',
    },
    {
      id: 'p3',
      url: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1200&auto=format&fit=crop',
      takenAt: '2025-09-05T20:12:00+09:00',
    },
    {
      id: 'p4',
      url: 'https://images.unsplash.com/photo-1574629173115-01d0f4e6e1a5?q=80&w=1200&auto=format&fit=crop',
      takenAt: '2025-09-05T20:16:00+09:00',
    },
    {
      id: 'p5',
      url: 'https://images.unsplash.com/photo-1552074280-9f63f6f97130?q=80&w=1200&auto=format&fit=crop',
      takenAt: '2025-09-05T20:20:00+09:00',
    },
  ],
  reviewBg: 'https://prodigits.co.uk/content4/wallpapers/2024/p2/29/f4te4054.jpg',
  caption: '경기도 수원시',
  meta: {
    place: '수원시청 체육관',
    time: '어제 · 20:00',
  },
  tags: ['검도', '친선전', '3세트'],
  author: {
    name: '김우진',
    avatar:
      'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?q=80&w=200&auto=format&fit=crop',
  },
  players: [
    {
      name: '현수',
      avatar:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop',
    },
    {
      name: '민재',
      avatar:
        'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=200&auto=format&fit=crop',
    },
  ],
  result: {
    scoreA: 2,
    scoreB: 1,
    winner: '현수',
    sets: 3,
    duration: '34분',
    setScores: [
      { a: 11, b: 9 },
      { a: 8, b: 11 },
      { a: 11, b: 7 },
    ],
  },
  reviews: [
    {
      name: '현수',
      avatar:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop',
      performance: 4.8,
      manner: 4.9,
      text: '상대가 잘 받아냈어요! 마지막 랠리는 아직도 짜릿🤩 다음엔 드라이브 템포를 조금 더 올려볼게요.',
    },
    {
      name: '민재',
      avatar:
        'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=200&auto=format&fit=crop',
      performance: 4.2,
      manner: 5.0,
      text: '규칙이 깔끔해서 몰입감 최고. 리시브 포지션을 다듬으면 더 좋아질 듯!',
    },
  ],
  rule: {
    title: '3세트 승부 · 11점 선취',
    items: [
      {
        title: '타이틀임',
        desc: '내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임 ',
      },
    ],
  },
})

// Photos computed
const hasPhotos = computed(() => Array.isArray(post.photos) && post.photos.length > 0)
// const photoCount = computed(() => (post.photos ? post.photos.length : 0))
// const sortedPhotos = computed(() =>
//   (post.photos || []).slice().sort((a, b) => new Date(a.takenAt) - new Date(b.takenAt)),
// )
const headlinePhoto = computed(() => {
  const marked = (post.photos || []).find((p) => p.isHeadline)
  return marked || (post.photos || [])[0] || null
})
const galleryPhotos = computed(() => {
  const head = headlinePhoto.value
  const rest = (post.photos || []).filter((p) => !head || p.id !== head.id)
  return rest.slice().sort((a, b) => new Date(a.takenAt) - new Date(b.takenAt))
})

// Sections order
const sections = computed(() => {
  const arr = []
  if (hasPhotos.value) arr.push('헤드라인 사진')
  arr.push('경기 정보', '평점 & 리뷰', '친구 랭킹')
  for (let i = 0; i < galleryPhotos.value.length; i++) arr.push('전체 사진')
  return arr
})
const totalSlides = computed(() => sections.value.length)
function idx(label) {
  return sections.value.indexOf(label)
}

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
const avgPerformance = computed(() => {
  const arr = post.reviews.map((r) => r.performance || 0)
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
})
const avgManner = computed(() => {
  const arr = post.reviews.map((r) => r.manner || 0)
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
})

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

function onTouchEnd() {
  const thresholdPx = Math.floor(window.innerWidth * 0.12)
  const duration = Math.max(1, Date.now() - gestureStartAt)
  const velocityX = deltaX.value / duration // px per ms
  if (isVerticalScroll.value) {
    // end of vertical scroll gesture: do nothing
  } else if (Math.abs(deltaX.value) > thresholdPx || Math.abs(velocityX) > 0.25) {
    // commit to next/prev and snap immediately without overshoot
    commitSlide(deltaX.value < 0 ? 1 : -1)
  } else {
    // treat as tap/double-tap only (no navigation on single tap for mobile)
    const now = Date.now()
    const tapGap = now - lastTapAt
    const movedX = Math.abs(deltaX.value) > 10
    const movedY = Math.abs(deltaY.value) > 10
    if (!movedX && !movedY && tapGap < 260) {
      toggleLike()
      spawnHeart(endX.value, window.innerHeight * 0.45)
      lastTapAt = 0
    } else if (!movedX && !movedY) {
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
function onMouseUp() {
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

// function nextSlide() {
//   const before = currentSlide.value
//   currentSlide.value = Math.min(currentSlide.value + 1, totalSlides.value - 1)
//   if (currentSlide.value !== before) tryVibrate(10)
// }
// function prevSlide() {
//   const before = currentSlide.value
//   currentSlide.value = Math.max(currentSlide.value - 1, 0)
//   if (currentSlide.value !== before) tryVibrate(10)
// }

// Actions
const liked = ref(false)
function toggleLike() {
  liked.value = !liked.value
  tryVibrate(15)
}
function onDoWithMe() {
  router.push('/create-game')
}
function onComment() {
  router.push('/games/demo-game/comments')
}
async function onShare() {
  const url = window.location.origin + '/'
  const text = `${post.author.name}의 경기 하이라이트 – Raspy`
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

// Quick navigation helpers
// Rules modal state
const showRuleModal = ref(false)
function goToReviews() {
  const i = idx('평점 & 리뷰')
  if (i >= 0) currentSlide.value = i
  tryVibrate(12)
}
function goToRanking() {
  const i = idx('친구 랭킹')
  if (i >= 0) currentSlide.value = i
  tryVibrate(12)
}
function goToGallery() {
  const i = idx('전체 사진')
  if (i >= 0) currentSlide.value = i
  tryVibrate(12)
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

// Rules accordion state
// const openRule = reactive({})
// const allRulesOpen = computed(
//   () => post.rule.items.length && post.rule.items.every((_, idx) => openRule[idx]),
// )
const ruleReadSeconds = computed(() => Math.max(10, post.rule.items.length * 4))
// function toggleRule(idx) {
//   openRule[idx] = !openRule[idx]
// }
// function toggleAllRules() {
//   const to = !allRulesOpen.value
//   post.rule.items.forEach((_, idx) => (openRule[idx] = to))
// }

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

function formatTakenAt(t) {
  try {
    const d = new Date(t)
    return (
      d.getFullYear() +
      '.' +
      String(d.getMonth() + 1).padStart(2, '0') +
      '.' +
      String(d.getDate()).padStart(2, '0') +
      ' ' +
      String(d.getHours()).padStart(2, '0') +
      ':' +
      String(d.getMinutes()).padStart(2, '0')
    )
  } catch (e) {
    return ''
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
</style>
