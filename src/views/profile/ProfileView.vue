<template>
  <div
    class="bg-black min-h-screen relative flex flex-col"
  >
    <!-- Fixed Top Bar -->
    <div
      class="fixed z-30 left-0 right-0 top-0 flex justify-between items-center px-4 border-b border-gray-600 bg-black/95 backdrop-blur-md border-b shadow-sm"
    >
      <div class="flex items-center h-14"></div>
      <div class="flex items-enter gap-3 mr-4">
        <button
          @click="searchUsers"
          class="flex items-center gap-2 px-2 py-1 text-gray-300 hover:text-orange-500 pt-3"
        >
          <i @click="searchUsers" class="fas fa-search text-xl text-orange-500"></i>
        </button>

        <button
          @click="goSettings"
          class="flex items-center gap-2 px-2 py-1 text-gray-300 hover:text-orange-500 pt-3"
        >
          <i class="fas fa-cog text-xl text-orange-500"></i>
          <span class="font-semibold text-sm hidden sm:inline">설정</span>
        </button>
      </div>
    </div>

    <!-- SKELETON: 유저정보/통계/그래프/탭 -->
    <template v-if="user == null">
      <section
        class="max-w-lg mx-auto bg-gray-800 rounded-2xl shadow-lg mt-10 mb-0 px-6 pt-7 pb-8 flex flex-col gap-5 relative animate-pulse"
      >
        <!-- 프로필 -->
        <div class="flex gap-5 items-start mb-2">
          <div class="w-20 h-20 rounded-full bg-gray-700"></div>
          <div class="flex-1 flex flex-col gap-2">
            <div class="w-28 h-6 bg-gray-700 rounded"></div>
            <div class="flex gap-2">
              <div class="w-16 h-5 bg-orange-800 rounded"></div>
              <div class="w-16 h-5 bg-gray-700 rounded"></div>
            </div>
            <div class="w-40 h-4 bg-gray-700 rounded"></div>
            <div class="flex gap-2 mt-3 mb-2">
              <div class="w-20 h-7 rounded-full bg-gradient-animate opacity-60"></div>
              <div class="w-20 h-7 rounded-full bg-gradient-animate opacity-60"></div>
            </div>
          </div>
        </div>
        <div
          class="rounded-xl bg-gray-700 p-0.5 w-full flex flex-col sm:flex-row gap-0 sm:gap-4 items-stretch shadow-sm"
        >
          <div
            class="flex flex-row flex-1 items-center justify-around px-4 py-3 gap-0 border-b sm:border-b-0 sm:border-r border-gray-600"
          >
            <div class="flex flex-col items-center gap-0.5">
              <div class="w-8 h-5 bg-gray-700 rounded"></div>
              <div class="w-6 h-3 bg-gray-600 rounded mt-1"></div>
            </div>
            <div class="flex flex-col items-center gap-0.5">
              <div class="w-8 h-5 bg-gray-700 rounded"></div>
              <div class="w-6 h-3 bg-gray-600 rounded mt-1"></div>
            </div>
            <div class="flex flex-col items-center gap-0.5">
              <div class="w-8 h-5 bg-gray-700 rounded"></div>
              <div class="w-6 h-3 bg-gray-600 rounded mt-1"></div>
            </div>
            <div class="flex flex-col items-center gap-0.5">
              <div class="w-10 h-5 bg-orange-800 rounded"></div>
              <div class="w-8 h-3 bg-orange-800 rounded mt-1"></div>
            </div>
          </div>
          <div class="flex flex-row flex-1 items-center justify-around px-4 py-3 gap-0">
            <div class="flex flex-col items-center gap-0.5">
              <div class="w-8 h-5 bg-gray-700 rounded"></div>
              <div class="w-6 h-3 bg-gray-600 rounded mt-1"></div>
            </div>
            <div class="flex flex-col items-center gap-0.5">
              <div class="w-8 h-5 bg-gray-700 rounded"></div>
              <div class="w-6 h-3 bg-gray-600 rounded mt-1"></div>
            </div>
            <div class="flex flex-col items-center gap-0.5">
              <div class="w-8 h-5 bg-gray-700 rounded"></div>
              <div class="w-6 h-3 bg-gray-600 rounded mt-1"></div>
            </div>
          </div>
        </div>
        <div class="flex gap-3 mt-1">
          <div class="flex-1 h-12 bg-gray-700 rounded-xl"></div>
          <div class="flex-1 h-12 bg-gray-700 rounded-xl"></div>
        </div>
      </section>
      <section class="max-w-lg mx-auto px-4">
        <div class="mb-4 flex gap-2">
          <div class="w-24 h-8 bg-gray-700 rounded"></div>
          <div class="w-20 h-8 bg-orange-800 rounded"></div>
          <div class="w-24 h-8 bg-gray-700 rounded"></div>
        </div>
        <div class="rounded-2xl bg-gray-800 shadow p-5 mb-8">
          <div class="flex justify-between items-center mb-3">
            <div class="w-32 h-6 bg-gray-700 rounded"></div>
            <div class="flex items-center gap-2">
              <div class="w-14 h-6 bg-orange-800 rounded"></div>
              <div class="w-14 h-6 bg-gray-700 rounded"></div>
            </div>
          </div>
          <div class="w-full flex items-center justify-center my-5 -ml-2">
            <div class="w-full h-36 bg-gray-700 rounded-xl"></div>
          </div>
          <div class="mt-3 grid grid-cols-2 gap-y-2 gap-x-6 text-[0.97rem]">
            <div class="w-24 h-5 bg-gray-700 rounded"></div>
            <div class="w-12 h-5 bg-gray-700 rounded justify-self-end"></div>
            <div class="w-24 h-5 bg-gray-700 rounded"></div>
            <div class="w-20 h-5 bg-gray-700 rounded justify-self-end"></div>
            <div class="w-24 h-5 bg-gray-700 rounded"></div>
            <div class="w-16 h-5 bg-orange-800 rounded justify-self-end"></div>
          </div>
        </div>
      </section>
      <section class="max-w-lg mx-auto px-4">
        <div class="flex items-center gap-2 mb-4">
          <div class="w-24 h-8 bg-gray-700 rounded"></div>
          <div class="w-16 h-8 bg-orange-800 rounded"></div>
        </div>
        <div class="space-y-6">
          <div class="h-20 bg-gray-700 rounded-xl"></div>
          <div class="h-20 bg-gray-700 rounded-xl"></div>
          <div class="h-20 bg-gray-700 rounded-xl"></div>
        </div>
      </section>
    </template>

    <!-- USER 정보: 로딩 후 노출 -->
    <template v-else>
      <main class="flex-1 overflow-hidden flex flex-col pt-14">
        <section
          class="w-full mx-auto bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 rounded-3xl shadow-2xl mb-6 px-5 pt-8 pb-6 flex flex-col gap-4 relative overflow-hidden flex-shrink-0"
        >
          <!-- Decorative background -->
          <div
            class="absolute -top-20 -right-20 w-40 h-40 bg-orange-900/20 rounded-full blur-3xl"
          ></div>
          <div
            class="absolute -bottom-20 -left-20 w-40 h-40 bg-orange-900/15 rounded-full blur-3xl"
          ></div>

          <!-- Profile Section - Improved -->
          <div class="flex flex-col items-center gap-5 relative z-10">
            <!-- Avatar with glow effect -->
            <div class="relative">
              <div
                class="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full blur-xl opacity-30 animate-pulse"
              ></div>
              <div class="relative">
                <img
                  :src="user.avatar ? user.avatar : Default"
                  alt="avatar"
                  class="w-32 h-32 rounded-full object-cover border-4 border-gray-700 shadow-2xl relative z-10 ring-4 ring-orange-900"
                />
                <!-- Status badge -->
                <div
                  class="absolute -bottom-1 -right-1 bg-green-500 w-8 h-8 rounded-full border-4 border-gray-700 flex items-center justify-center shadow-lg z-20"
                >
                  <i class="fas fa-check text-white text-xs"></i>
                </div>
              </div>
            </div>

            <div class="flex flex-col items-center gap-2 w-full">
              <div class="flex gap-2 items-center">
                <h1
                  class="text-4xl font-black bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 bg-clip-text text-transparent"
                >
                  {{ user.nickname }}
                </h1>
                <button
                  v-if="!user.isMe"
                  @click="blockUser"
                  class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600 active:bg-red-700 transition shadow-md"
                >
                  <i class="fas fa-ban text-xs"></i>
                </button>
              </div>
              <div class="text-sm font-medium text-gray-400">@{{ user.username }}</div>

              <!-- Info tags with icons -->
              <div class="flex gap-2 flex-wrap justify-center mt-2">
                <span
                  class="inline-flex items-center gap-1.5 bg-gradient-to-br from-orange-50 to-orange-100 text-orange-600 text-sm px-4 py-2 rounded-full font-bold border border-orange-200 shadow-sm"
                >
                  <i class="fas fa-birthday-cake text-xs"></i>
                  {{ user.age ? user.age + '세' : '연령 -' }}
                </span>
                <span
                  class="inline-flex items-center gap-1.5 bg-gradient-to-br from-gray-700 to-gray-800 text-gray-300 text-sm px-4 py-2 rounded-full font-bold border border-gray-600 shadow-sm"
                >
                  <i class="fas fa-venus-mars text-xs"></i>
                  {{ user.gender && user.gender != '비공개' ? user.gender : '성별 -' }}
                </span>
                <span
                  class="inline-flex items-center gap-1.5 bg-gradient-to-br from-blue-900 to-blue-800 text-blue-300 text-sm px-4 py-2 rounded-full font-bold border border-blue-700 shadow-sm"
                >
                  <i class="fas fa-map-marker-alt text-xs"></i>
                  {{
                    user.location != null && user.location.length > 2
                      ? user.location?.split(' ').slice(-1)[0] || ''
                      : '지역 -'
                  }}
                </span>
              </div>

              <!-- Bio with better styling -->
              <div
                v-if="user.intro"
                class="mt-3 px-6 py-4 bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-600 shadow-sm max-w-sm"
              >
                <p class="text-base text-gray-300 text-center leading-relaxed">{{ user.intro }}</p>
              </div>
              <!-- 친구추가/나의 친구 버튼: 바이오 바로 아래 -->
              <div v-if="!user.isMe" class="flex gap-3 mt-4 pb-3 w-full justify-center">
                <template
                  v-if="!friendStatus.isFriend && !friendStatus.sent && !friendStatus.received"
                >
                  <button
                    class="flex justify-center items-center bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-bold py-3.5 w-full rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                    @click="sendFriendRequest"
                  >
                    <i class="fas fa-user-plus mr-2"></i> 친구추가
                  </button>
                  <button
                    class="flex justify-center items-center bg-white border-2 border-blue-400 text-blue-500 font-bold py-3.5 w-full rounded-xl shadow-md hover:bg-blue-50 transition-all ml-2"
                    @click="goChat"
                  >
                    <i class="fas fa-comment-dots mr-2"></i> DM
                  </button>
                </template>
                <template v-else-if="friendStatus.sent && !friendStatus.isFriend">
                  <button
                    class="flex justify-center items-center bg-gray-700 border-2 border-orange-400 text-orange-300 font-bold py-3.5 w-full rounded-xl shadow-md hover:bg-gray-600 transition-all"
                    @click="sendFriendCancelRequest"
                  >
                    <i class="fas fa-hourglass-half mr-2"></i> 요청취소
                  </button>
                  <button
                    class="flex justify-center items-center bg-gray-700 border-2 border-blue-400 text-blue-300 font-bold py-3.5 w-full rounded-xl shadow-md hover:bg-gray-600 transition-all ml-2"
                    @click="goChat"
                  >
                    <i class="fas fa-comment-dots mr-2"></i> DM
                  </button>
                </template>
                <template v-else-if="friendStatus.received && !friendStatus.isFriend">
                  <div class="flex gap-3">
                    <button
                      class="flex-1 flex justify-center items-center bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all"
                      @click="acceptFriendRequest"
                    >
                      <i class="fas fa-user-check mr-2"></i> 승인
                    </button>
                    <button
                      class="flex-1 flex justify-center items-center bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold py-3.5 rounded-xl shadow-md transition-all border-2 border-gray-600"
                      @click="rejectFriendRequest"
                    >
                      <i class="fas fa-user-times mr-2"></i> 거부
                    </button>
                    <button
                      class="flex-1 flex justify-center items-center bg-gray-700 border-2 border-blue-400 text-blue-300 font-bold py-3.5 rounded-xl shadow-md hover:bg-gray-600 transition-all ml-2"
                      @click="goChat"
                    >
                      <i class="fas fa-comment-dots mr-2"></i> DM
                    </button>
                  </div>
                </template>
                <template v-else-if="friendStatus.isFriend">
                  <button
                    class="flex justify-center items-center bg-gray-700 border-2 border-red-400 text-red-400 font-bold py-3.5 w-full rounded-xl shadow-md hover:bg-gray-600 transition-all"
                    @click="showUnfriendConfirm = true"
                  >
                    <i class="fas fa-user-minus mr-2"></i> 친구 끊기
                  </button>
                  <button
                    class="flex justify-center items-center bg-gray-700 border-2 border-blue-400 text-blue-300 font-bold py-3.5 w-full rounded-xl shadow-md hover:bg-gray-600 transition-all ml-2"
                    @click="goChat"
                  >
                    <i class="fas fa-comment-dots mr-2"></i> DM
                  </button>
                </template>
              </div>
            </div>
          </div>

          <!-- Top 3 Rules - Enhanced Section -->
          <div v-if="user.top3Rules && user.top3Rules.length > 0" class="mt-6 w-full">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-bold text-gray-200 flex items-center gap-2">
                가장 많이 플레이한 규칙
              </h3>
              <button
                @click="showStatsModal = true"
                class="rounded-xl bg-gray-700 border border-gray-600 py-2 px-4 font-bold text-gray-300 text-base shadow hover:bg-gray-600 transition-all ml-2"
              >
                통계 더보기
              </button>
            </div>
            <div class="grid grid-cols-1 gap-3">
              <TopRuleCard v-for="rule in user.top3Rules" :key="rule.ruleId" :rule="rule" />
            </div>
          </div>

          <StatsModal
            v-if="showStatsModal"
            :stats="user.stats"
            :nickname="user.nickname"
            :playTime="user.playTime"
            :myChampions="user.myChampions"
            :manner="user.mannerScore"
            :userId="userId"
            @close="showStatsModal = false"
            @navigateToProfile="navigateToFriendProfile"
            @friendRemoved="onFriendRemoved"
          />
          <transition name="champ-slide">
            <div v-if="showChampions" class="champ-card-container w-full max-w-md mx-auto mt-0">
              <div
                class="champ-card bg-gray-800 rounded-2xl shadow-xl px-6 py-6 border border-gray-600"
              >
                <div class="flex items-center mb-4">
                  <i class="fas fa-crown text-yellow-400 text-lg mr-2"></i>
                  <span class="font-bold text-gray-200 text-base">
                    {{ user.nickname }}님이 획득한 챔피언
                  </span>
                </div>
                <div class="flex flex-col flex-wrap gap-2">
                  <span
                    v-for="(champ, idx) in user.myChampions"
                    :key="idx"
                    class="p-5 relative flex items-center rounded-[25px] shadow-md px-6 py-3 space-x-1 overflow-hidden bg-gradient-animate animate-pulse-slow"
                    title="챔피언"
                  >
                    <i class="fas fa-crown text-white text-sm z-10"></i>
                    <span class="text-md font-semibold text-white z-10 truncate">
                      {{ champ.region?.split(' ').slice(-1)[0] }} {{ champ.ruleTitle }} 챔피언
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </transition>

          <!-- 기존 친구추가/DM 버튼 영역 제거 -->
        </section>
        <section class="w-full mx-auto px-4 bg-gradient-to-b from-gray-800 to-gray-900 pb-0">
          <div v-if="false" class="flex items-center gap-2 mb-4 mt-2"></div>
          <div v-if="statMode === 'rule'" class="pb-4">
            @click="showRuleModal = true" class="w-full py-3 rounded-xl bg-orange-100
            text-orange-600 text-sm font-bold shadow flex items-center justify-center gap-2" >
            <i class="fas fa-list-alt"></i>
            {{ selectedRule?.ruleTitle || '경기 규칙 선택' }}
            placeholder="주 카테고리" />
            <CustomSelect
              :options="subCategoryOptions"
              v-model="selectedSubCategory"
              :disabled="!selectedMainCategory"
              placeholder="서브 카테고리"
            />
          </div>
          <div class="mb-3 text-xs text-gray-400 px-2">
            <template v-if="statMode === 'total' && false">
              전체 기준 (플레이한 유저: <b>{{ user.totalPlayers }}</b
              >명)
            </template>
            <!-- <template v-if="statMode === 'rule' && selectedRule">
            [{{ selectedRule.title }}] {{ selectedRule.description }}<br />
            카테고리: {{ selectedRule.majorCategory }} > {{ selectedRule.minorCategory }}
            <span class="block mt-1 text-gray-400"
              >플레이 유저: <b>{{ selectedRule.players }}</b
              >명</span
            >
          </template> -->
            <template v-if="statMode === 'category' && selectedMainCategory && selectedSubCategory">
              [{{ selectedMainCategory }} > {{ selectedSubCategory }}] 기준<br />
              플레이 유저: <b>{{ filteredCategoryPlayers }}</b
              >명
            </template>
          </div>
          <!-- <div class="rounded-2xl bg-white shadow p-5 mb-0">
          <div class="flex justify-between items-center mb-3">
            <span class="font-bold text-gray-900 text-base flex items-center gap-2">
              <i class="fas fa-chart-line text-orange-500"></i> 퍼포먼스 그래프
            </span>
            <div class="flex items-center gap-2">
              <span
                class="px-3 py-1 rounded-full bg-orange-500 text-white font-black text-xs shadow"
                >랭킹 -위</span
              >
              <span
                class="px-2 py-1 rounded-full bg-white text-orange-500 text-xs font-semibold border border-orange-400"
                >상위 -%</span
              >
            </div>
          </div>
          <div class="w-full flex items-center justify-center my-5 -ml-2">
            <canvas v-if="chartData.length > 0" ref="chartRef" height="" class=" "></canvas>
            <div v-else class="w-full text-center text-gray-400 text-sm py-8">
              경기 횟수가 부족하여<br />
              퍼포먼스 그래프를 표시할 수 없습니다.
            </div>
          </div>
          <div class="mt-3 grid grid-cols-2 gap-y-2 gap-x-6 text-[0.97rem]">
            <div class="font-semibold text-gray-500">퍼포먼스 평균</div>
            <div class="text-right font-bold text-gray-900">{{ stat.performance.toFixed(1) }}</div>
            <div class="font-semibold text-gray-500">승/무/패</div>
            <div class="text-right text-gray-600">
              {{ stat.wins }}승 {{ stat.draws }}무 {{ stat.losses }}패
            </div>
            <div class="font-semibold text-gray-500">승률</div>
            <div class="text-right text-orange-500 font-bold">{{ stat.winRate }}%</div>
          </div>
        </div> -->
        </section>
        <!-- Most Recent Game - Enhanced Card -->
        <section
          v-if="user.recentGames && user.recentGames.length > 0"
          class="w-full mx-auto px-4 pb-0 bg-gray-900"
        >
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-gray-200 flex items-center gap-2">최근 경기</h3>
            <button
              @click="goToUserFeed"
              class="rounded-xl bg-gray-700 border border-gray-600 py-2 px-4 font-bold text-gray-300 text-base shadow hover:bg-gray-600 transition-all ml-2"
            >
              더보기
            </button>
          </div>
          <div
            class="group relative bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl overflow-hidden border border-gray-600 transition-all duration-300 cursor-pointer"
          >
            <!-- Result badge overlay -->
            <div class="absolute top-3 right-3 z-10">
              <span
                :class="{
                  'bg-gradient-to-r from-orange-500 to-orange-600 text-white':
                    user.recentGames[0].result === 'win',
                  'bg-gradient-to-r from-blue-500 to-blue-600 text-white':
                    user.recentGames[0].result === 'loss',
                  'bg-gradient-to-r from-gray-400 to-gray-500 text-white':
                    user.recentGames[0].result === 'draw',
                }"
                class="px-3 py-1.5 rounded-full text-xs text-white font-bold shadow-lg"
              >
                {{
                  user.recentGames[0].result === 'win'
                    ? '승리'
                    : user.recentGames[0].result === 'loss'
                      ? '패배'
                      : '무승부'
                }}
              </span>
            </div>

            <div class="flex">
              <div
                class="relative flex-shrink-0 w-32 h-32 bg-gradient-to-br from-gray-700 to-gray-800 overflow-hidden"
              >
                <img
                  :src="user.recentGames[0].startPhotoUrl"
                  alt="경기 이미지"
                  class="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
              </div>

              <div class="flex-1 p-5 flex flex-col justify-between">
                <div>
                  <span class="text-lg font-bold text-gray-200 truncate block mb-2">
                    {{ user.recentGames[0].ruleTitle }}
                  </span>
                  <div class="flex items-center gap-3 text-base">
                    <div class="flex items-center gap-2">
                      <span
                        class="text-2xl font-black text-white"
                        :class="{
                          'text-orange-500': user.recentGames[0].result === 'win',
                          'text-blue-500': user.recentGames[0].result === 'loss',
                          'text-gray-500': user.recentGames[0].result === 'draw',
                        }"
                      >
                        {{ user.recentGames[0].myScore }}
                      </span>
                      <span class="text-gray-400 font-bold">:</span>
                      <span class="text-2xl font-black text-white">
                        {{ user.recentGames[0].opponentScore }}
                      </span>
                    </div>
                  </div>
                  <span class="text-sm text-gray-400 mt-1 block">
                    vs {{ user.recentGames[0].opponentNickname }}
                  </span>
                </div>
                <div class="flex items-center gap-2 text-xs text-gray-400 mt-2">
                  <i class="far fa-clock"></i>
                  <span>{{ formatDate(user.recentGames[0].playedAt) }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <!-- 모달/토스트/풋터 등 나머지 코드는 기존 그대로(생략) -->
      <transition name="fade">
        <div
          v-if="showRuleModal"
          class="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-end z-50"
        >
          <div class="w-full max-w-lg bg-gray-800 rounded-t-3xl shadow-2xl p-6 pb-">
            <div class="mb-2 flex justify-between items-center">
              <h3 class="text-lg font-bold text-gray-200">경기 규칙 선택</h3>
              <button
                @click="showRuleModal = false"
                class="text-gray-500 hover:text-orange-500 text-xl"
              >
                <i class="fas fa-times"></i>
              </button>
            </div>
            <input
              v-model="ruleSearch"
              class="w-full border rounded-full px-4 py-2 mb-3 text-sm focus:ring-2 focus:ring-orange-200"
              placeholder="규칙 제목 검색"
            />
            <div
              v-if="filteredRules.length > 0"
              class="max-h-80 overflow-y-auto flex flex-col gap-2"
            >
              <button
                v-for="rule in filteredRules"
                :key="rule.id"
                class="flex flex-col items-start gap-1 p-3 bg-gray-700 hover:bg-orange-900 rounded-xl text-sm font-bold text-gray-300 transition"
                :class="{ 'bg-orange-800 text-orange-300': selectedRuleId === rule.id }"
                @click="selectRule(rule.id)"
              >
                <div class="flex items-center gap-2">
                  <span class="font-bold text-base">{{ rule.ruleTitle }}</span>
                  <span class="text-xs px-2 py-0.5 bg-gray-600 rounded"
                    >{{ rule.majorCategory }} > {{ rule.minorCategory }}</span
                  >
                </div>
                <div class="text-xs text-gray-400 whitespace-pre-line leading-relaxed">
                  {{ rule.ruleDescription }}
                </div>
              </button>
            </div>
            <div v-else>플레이한 게임이 없습니다.</div>
          </div>
        </div>
      </transition>
      <transition name="fade">
        <div
          v-if="showUserModal"
          class="fixed inset-0 top-0 h-full bg-black bg-opacity-30 z-50 flex justify-center items-center"
        >
          <div
            class="bg-gray-800 w-dvw w-full h-full p-6 pt-10 relative"
            style="min-height: calc(var(--real-vh, 1vh) * 100)"
          >
            <button
              class="absolute top-10 right-7 text-gray-500 hover:text-orange-500 text-xl"
              @click="closeUserModal"
            >
              <i class="fas fa-times"></i>
            </button>
            <h3 class="font-bold text-lg mb-4 text-gray-200">유저 찾기</h3>
            <input
              v-model="userSearch"
              @input="onUserSearch"
              ref="userinput"
              type="text"
              class="w-full border rounded-[10px] px-4 py-3 mb-4 text-sm focus:ring-2 focus:ring-orange-200 outline-none"
              placeholder="유저의 이름을 입력하세요"
            />
            <div v-if="userSearching" class="text-center text-gray-500 py-4 text-sm">
              검색 중...
            </div>
            <div
              v-else-if="userSearchResult.length === 0 && userSearch.trim() !== ''"
              class="text-center text-gray-500 py-10 text-base"
            >
              검색 결과가 없습니다.
            </div>
            <div v-else class="flex flex-col gap-2 overflow-y-auto">
              <button
                v-for="user in userSearchResult"
                :key="user.id"
                @click="gotoUser(user.id)"
                class="flex items-center gap-3 p-2 hover:bg-orange-900 rounded-xl transition border border-transparent hover:border-orange-700"
              >
                <img
                  :src="user.avatar ? user.avatar : Default"
                  class="w-10 h-10 rounded-full border object-cover"
                />
                <div class="flex-1 text-left">
                  <div class="flex flex-col gap-0">
                    <div class="font-bold text-gray-200 text-sm">
                      {{ user.nickname }}
                    </div>
                    <div class="text-[0.8rem]">@{{ user.username }}</div>
                  </div>
                  <div class="text-xs text-gray-400">{{ user.intro }}</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </transition>
      <transition name="fade h-full">
        <div
          v-if="showFriendModal"
          class="h-full fixed inset-0 z-50 bg-black/40 flex justify-center items-end sm:items-center"
        >
          <div
            class="bg-gray-800 h-[60%] rounded-t-3xl sm:rounded-3xl max-w-md w-full mx-auto pb-4 pt-4 px-4 relative shadow-2xl"
            style="padding: 2rem 1.2rem 2.2rem 1.2rem; overflow-y: auto"
          >
            <button
              class="absolute right-5 top-4 text-xl text-gray-500 hover:text-orange-500"
              @click="closeFriendModal"
            >
              <i class="fas fa-times"></i>
            </button>
            <div class="flex gap-2 mb-5 mt-2">
              <button
                :class="
                  friendTab === 'friends'
                    ? 'font-bold border-b-2 border-orange-500 text-orange-400'
                    : 'text-gray-400'
                "
                class="flex-1 py-2 text-base transition"
                @click="friendTab = 'friends'"
              >
                친구
              </button>
              <button
                v-if="user?.isMe"
                :class="
                  friendTab === 'sent'
                    ? 'font-bold border-b-2 border-orange-500 text-orange-400'
                    : 'text-gray-400'
                "
                class="flex-1 py-2 text-base transition"
                @click="friendTab = 'sent'"
              >
                요청됨
              </button>
              <button
                v-if="user?.isMe"
                :class="
                  friendTab === 'received'
                    ? 'font-bold border-b-2 border-orange-500 text-orange-400'
                    : 'text-gray-400'
                "
                class="flex-1 py-2 text-base transition"
                @click="friendTab = 'received'"
              >
                요청받음
              </button>
            </div>
            <div v-if="friendTab === 'friends'">
              <div v-if="friends.length" class="flex flex-col gap-3 overflow-y-auto">
                <button
                  v-for="f in friends"
                  :key="f.id"
                  class="flex items-center gap-3 p-3 hover:bg-orange-900 rounded-xl border border-transparent hover:border-orange-700 transition"
                  @click="gotoUser(f.id)"
                >
                  <img
                    :src="f.avatar || Default"
                    class="w-10 h-10 rounded-full object-cover border"
                  />
                  <div class="flex-1 text-left min-w-0">
                    <div class="font-bold text-gray-200 text-sm truncate">{{ f.nickname }}</div>
                    <div class="text-[0.8rem] truncate">@{{ f.username }}</div>
                    <div class="text-xs text-gray-400 truncate">{{ f.intro }}</div>
                  </div>
                </button>
              </div>
              <div v-else class="text-gray-500 text-center py-8">친구가 없습니다.</div>
            </div>
            <div v-if="friendTab === 'sent' && user?.isMe">
              <div v-if="friendRequestsSent.length" class="flex flex-col gap-3 overflow-y-auto">
                <button
                  v-for="f in friendRequestsSent"
                  :key="f.id"
                  class="flex items-center gap-3 p-3 hover:bg-orange-900 rounded-xl border border-transparent hover:border-orange-700 transition"
                  @click="gotoUser(f.id)"
                >
                  <img
                    :src="f.avatar || Default"
                    class="w-10 h-10 rounded-full object-cover border"
                  />
                  <div class="flex-1 text-left min-w-0">
                    <div class="font-bold text-gray-200 text-sm truncate">{{ f.nickname }}</div>
                    <div class="text-[0.8rem] truncate">@{{ f.username }}</div>
                    <div class="text-xs text-gray-400 truncate">{{ f.intro }}</div>
                  </div>
                </button>
              </div>
              <div v-else class="text-gray-500 text-center py-8">요청한 친구가 없습니다.</div>
            </div>
            <div v-if="friendTab === 'received' && user?.isMe">
              <div v-if="friendRequestsReceived.length" class="flex flex-col gap-3 overflow-y-auto">
                <div
                  v-for="f in friendRequestsReceived"
                  :key="f.id"
                  class="flex items-center gap-3 p-3 hover:bg-orange-900 rounded-xl border border-transparent hover:border-orange-700 transition"
                >
                  <img
                    :src="f.avatar || Default"
                    class="w-10 h-10 rounded-full object-cover border"
                  />
                  <div @click="gotoUser(f.id)" class="flex-1 text-left min-w-0">
                    <div class="font-bold text-gray-200 text-sm truncate">{{ f.nickname }}</div>
                    <div class="text-[0.8rem] truncate">@{{ f.username }}</div>
                    <div class="text-xs text-gray-400 truncate">{{ f.intro }}</div>
                  </div>
                  <div class="flex gap-1 ml-2">
                    <button
                      class="px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold shadow"
                      @click="onAcceptRequest(f.id)"
                    >
                      승인
                    </button>
                    <button
                      class="px-5 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-xs font-bold shadow border border-gray-600"
                      @click="onRejectRequest(f.id)"
                    >
                      거부
                    </button>
                  </div>
                </div>
              </div>
              <div v-else class="text-gray-500 text-center py-8">받은 친구 요청이 없습니다.</div>
            </div>
          </div>
        </div>
      </transition>
    </template>
    <div
      v-if="showConfirm"
      class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
    >
      <div class="bg-gray-800 rounded-lg p-6 max-w-sm w-full">
        <h2 class="text-lg font-semibold mb-4 text-gray-200">유저 차단</h2>
        <p class="mb-6 text-gray-300">정말로 이 사용자를 차단하시겠어요?</p>
        <div class="flex justify-end gap-3">
          <button @click="cancel" class="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-gray-300">
            취소
          </button>
          <button
            @click="confirmBlock"
            class="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
          >
            차단
          </button>
        </div>
      </div>
    </div>
    <div class="pb-[130px]"></div>
    <CustomToast />
  </div>
  <Footer tab="profile" />

  <!-- 친구 끊기 확인 모달 -->
  <transition name="fade">
    <div
      v-if="showUnfriendConfirm"
      class="fixed inset-0 bg-black/50 flex justify-center items-center z-[60]"
      @click.self="showUnfriendConfirm = false"
    >
      <div class="bg-gray-800 rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4 animate-modalpop">
        <div class="text-center mb-6">
          <div class="w-16 h-16 bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-user-minus text-red-400 text-2xl"></i>
          </div>
          <h3 class="text-lg font-bold text-gray-200 mb-2">
            친구를 끊으시겠습니까?
          </h3>
          <p class="text-sm text-gray-400 mb-1">
            {{ user?.nickname }}님과의 친구 관계가 삭제됩니다.
          </p>
          <p class="text-xs text-gray-500">
            상대는 내가 친구를 끊은 것을 알 수 없습니다.
          </p>
        </div>
        <div class="flex gap-3">
          <button
            @click="showUnfriendConfirm = false"
            class="flex-1 py-3 px-4 bg-gray-700 text-gray-300 font-semibold rounded-xl hover:bg-gray-600 transition-all"
          >
            취소
          </button>
          <button
            @click="confirmUnfriend"
            class="flex-1 py-3 px-4 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-all"
          >
            끊기
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Chart from 'chart.js/auto'
import Footer from '../../components/FooterNav.vue'
import CustomSelect from './CustomSelect.vue'
import Default from '../../assets/default.png'
import api from '../../api/api'
import CustomToast from '../../components/CustomToast.vue'
import StatsModal from '../../components/StatsModal.vue'
// import CountUp from './CountUp.vue'
import TopRuleCard from '../../components/TopRuleCard.vue'
import { useToast } from '../../composable/useToast'
const { showToast } = useToast()

function formatDate(str) {
  if (!str) return '미정'
  const d = new Date(str)
  return d.toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })
}

const showFriendModal = ref(false)
const friendTab = ref('friends') // friends | sent | received
const friends = ref([])
const friendRequestsSent = ref([])
const friendRequestsReceived = ref([])

const chartRef = ref(null)
let chartInstance = null
const router = useRouter()
const route = useRoute()
let userId = route.params.id

const matchRefs = ref({})

// function setMatchRef(el, id) {
//   if (el) matchRefs.value[id] = el
// }

const user = ref(null)
// const allGames = ref([])

// [카테고리, [서브카테고리, ...]] 목록 (플레이한 것만)
const playedCategoryMap = ref({}) // { "신체": ["축구", "농구"], "보드": ["체스"] }
const playedRules = ref([]) // 전체 플레이한 룰 배열

// const statTabs = [
//   { id: 'total', label: '전체' },
//   // { id: 'rule', label: '경기 규칙별' },
//   // { id: 'category', label: '카테고리별' },
// ]
const statMode = ref('total')
const showRuleModal = ref(false)
const ruleSearch = ref('')
const selectedRuleId = ref(null)
const selectedMainCategory = ref(null)
const selectedSubCategory = ref(null)

const subCategoryOptions = computed(() =>
  selectedMainCategory.value && playedCategoryMap.value[selectedMainCategory.value]
    ? playedCategoryMap.value[selectedMainCategory.value].map((sub) => ({ label: sub, value: sub }))
    : [],
)

const showChampions = ref(false)
const showStatsModal = ref(false)
// function toggleChampion() {
//   if (user.value.myChampions.length == 0) return
//   showChampions.value = !showChampions.value
// }

const selectedRule = computed(() => playedRules.value.find((r) => r.id === selectedRuleId.value))

const goChat = () => {
  router.push('/chat/' + userId)
}

const sent = ref(false)

async function onAcceptRequest(friendId) {
  try {
    await api.post(`/api/friends/accept/${friendId}`)
    showToast('친구 요청을 승인했습니다!')
    // 바로 리스트 갱신
    loadFriends()
    fetchFriendStatus()
  } catch (e) {
    showToast('승인에 실패했습니다.')
  }
}
async function onRejectRequest(friendId) {
  try {
    await api.post(`/api/friends/reject/${friendId}`)
    showToast('친구 요청을 거부했습니다.')
    loadFriends()
    fetchFriendStatus()
  } catch (e) {
    showToast('거부에 실패했습니다.')
  }
}

async function sendFriendRequest() {
  try {
    await api.post(`/api/friends/request/${userId}`)
    sent.value = true
    showToast('친구 요청을 보냈습니다!')
    fetchFriendStatus()
  } catch (e) {
    if (e?.response?.data?.message) showToast(e.response.data.message)
    else showToast('이미 요청했거나 친구 상태입니다.')
  }
}

const showConfirm = ref(false)
const showUnfriendConfirm = ref(false)

function blockUser() {
  showConfirm.value = true
}

function cancel() {
  showConfirm.value = false
}

async function confirmBlock() {
  try {
    await api.post(`/api/block/${user.value.id}`)
    showToast(`${user.value.nickname}님을 차단했습니다.`)

    // 차단 성공 시 라우팅
    router.push('/profile/0')
  } catch (error) {
    console.error('차단 실패', error)
  } finally {
    showConfirm.value = false
  }
}

async function confirmUnfriend() {
  try {
    await api.delete(`/api/friends/${userId}`)
    showToast('친구를 끊었습니다.')
    showUnfriendConfirm.value = false
    // 친구 상태 다시 가져오기
    await fetchFriendStatus()
  } catch (error) {
    console.error('친구 끊기 실패:', error)
    showToast('친구 끊기에 실패했습니다.')
  }
}
async function sendFriendCancelRequest() {
  try {
    await api.delete(`/api/friends/cancel/${userId}`)
    sent.value = false
    showToast('친구 요청을 취소했습니다.')
    fetchFriendStatus()
  } catch (e) {
    showToast('요청 취소에 실패했습니다.')
  }
}
async function acceptFriendRequest() {
  await api.post(`/api/friends/accept/${userId}`)
  await fetchFriendStatus()
}
async function rejectFriendRequest() {
  await api.post(`/api/friends/reject/${userId}`)
  await fetchFriendStatus()
}
const friendStatus = ref({ sent: false, isFriend: false, received: false })

async function fetchFriendStatus() {
  const res = await api.get(`/api/friends/status/${userId}`)
  friendStatus.value = res.data
  sent.value = friendStatus.value.sent
}

// 친구 프로필로 이동
function navigateToFriendProfile(friendId) {
  showStatsModal.value = false
  router.push(`/profile/${friendId}`)
}

// 친구 제거 후 처리
function onFriendRemoved() {
  // 친구 수 감소
  if (user.value && user.value.stats && user.value.stats.friends > 0) {
    user.value.stats.friends -= 1
  }
}

onMounted(() => {
  fetchFriendStatus()
})

// const stat = computed(() => {
//   if (!user.value) return { performance: 0, wins: 0, draws: 0, losses: 0, winRate: 0 }
//   if (statMode.value === 'total') {
//     return {
//       performance: user.value.stats.performance ?? 0,
//       wins: user.value.stats.wins,
//       draws: user.value.stats.draws,
//       losses: user.value.stats.losses,
//       winRate: user.value.stats.winRate,
//     }
//   } else if (statMode.value === 'rule' && selectedRule.value) {
//     return selectedRule.value.stat ?? { performance: 0, wins: 0, draws: 0, losses: 0, winRate: 0 }
//   } else if (
//     statMode.value === 'category' &&
//     selectedMainCategory.value &&
//     selectedSubCategory.value
//   ) {
//     // 카테고리/서브카테고리 통계는 별도 API 필요하면 이곳에서 fetch하여 사용
//     return { performance: 0, wins: 0, draws: 0, losses: 0, winRate: 0 }
//   }
//   return { performance: 0, wins: 0, draws: 0, losses: 0, winRate: 0 }
// })

const filteredCategoryPlayers = computed(() => {
  if (statMode.value === 'category' && selectedMainCategory.value && selectedSubCategory.value) {
    // 플레이 유저 수 통계가 있다면 여기에 연결
    return 0
  }
  return user.value?.totalPlayers ?? 0
})

// const filteredGames = computed(() => {
//   if (statMode.value === 'total') return allGames.value
//   if (statMode.value === 'rule' && selectedRule.value) {
//     return allGames.value.filter((g) => g.ruleId === selectedRule.value.id)
//   }
//   if (statMode.value === 'category' && selectedMainCategory.value && selectedSubCategory.value) {
//     return allGames.value.filter(
//       (g) =>
//         g.mainCategory === selectedMainCategory.value &&
//         g.subCategory === selectedSubCategory.value,
//     )
//   }
//   return []
// })
async function loadFriends() {
  try {
    // 내 친구 목록
    const res = await api.get('/api/friends/my?userId=' + userId)
    friends.value = res.data
    // 요청 보냄/받음 (본인 프로필인 경우에만)
    if (user.value?.isMe) {
      const res2 = await api.get('/api/friends/my/sent')
      friendRequestsSent.value = res2.data
      const res3 = await api.get('/api/friends/my/received')
      friendRequestsReceived.value = res3.data
    }
  } catch (e) {
    showToast('친구 목록을 불러오지 못했습니다.')
  }
}
// function openFriendModal() {
//   friendTab.value = 'friends'
//   showFriendModal.value = true
//   loadFriends()
// }
// function closeFriendModal() {
//   showFriendModal.value = false
// }

// function onTabChange(item) {
//   statMode.value = item.id
//   if (item.id === 'rule' && playedRules.value.length && !selectedRule.value) {
//     selectedRuleId.value = playedRules.value[0].id
//   }
//   if (item.id === 'category') {
//     selectedMainCategory.value = Object.keys(playedCategoryMap.value)[0] || null
//     selectedSubCategory.value = playedCategoryMap.value[selectedMainCategory.value]?.[0] || null
//   }
// }

const chartData = computed(() => {
  if (statMode.value === 'total') return user.value?.stats?.performanceHistory ?? []
  if (statMode.value === 'rule' && selectedRule.value)
    return selectedRule.value.performanceHistory ?? []
  if (statMode.value === 'category') return []
  return []
})

// const formattedPlayTime = computed(() => {
//   const min = user.value?.playTime ?? 0
//   const h = Math.floor(min / 60)
//   const m = min % 60
//   if (h === 0) return `${m}m`
//   return `${h}h`
// })

const filteredRules = computed(() =>
  playedRules.value.filter((r) => r.ruleTitle.includes(ruleSearch.value)),
)

function selectRule(id) {
  selectedRuleId.value = id
  showRuleModal.value = false
}

function goSettings() {
  router.push('/settings')
}

function goToUserFeed() {
  router.push(`/feed?userId=${userId}`)
}

const updateChart = async () => {
  await nextTick()
  if (!chartRef.value) return
  if (chartInstance) chartInstance.destroy()
  if (chartData.value.length < 1) return

  chartInstance = new Chart(chartRef.value, {
    type: 'line',
    data: {
      labels: chartData.value.map((_, i) => i + 1),
      datasets: [
        {
          label: '퍼포먼스 점수',
          data: chartData.value,
          borderColor: '#fd7e14',
          backgroundColor: 'rgba(253,126,20,0.06)',
          pointRadius: 2,
          pointHoverRadius: 6,
          borderWidth: 3,
          fill: true,
          tension: 0.25,
        },
      ],
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          title: {
            display: true,
            text: '경기 횟수',
            color: '#aaa',
            font: { size: 13, weight: 600 },
          },
          grid: { display: false },
        },
        y: {
          min: 0,
          max: 5,
          ticks: { stepSize: 1, color: '#bbb' },
          title: {
            display: true,
            text: '퍼포먼스(점)',
            color: '#aaa',
            font: { size: 13, weight: 600 },
          },
          grid: { color: '#efefef' },
        },
      },
    },
  })
}

// 유저 검색 모달 및 검색 API
const showUserModal = ref(false)
const userSearch = ref('')
const userSearching = ref(false)
const userSearchResult = ref([])
let searchTimeout

const userinput = ref(null)

function searchUsers() {
  showUserModal.value = true
  userSearch.value = ''
  userSearchResult.value = []
  nextTick(() => {
    userinput.value?.focus()
  })
}
function closeUserModal() {
  showUserModal.value = false
}
async function onUserSearch() {
  clearTimeout(searchTimeout)
  if (!userSearch.value.trim()) {
    userSearchResult.value = []
    return
  }
  userSearching.value = true
  searchTimeout = setTimeout(async () => {
    const res = await api.get(
      `/api/user-profile/search?keyword=${encodeURIComponent(userSearch.value)}`,
    )
    userSearchResult.value = res.data
    userSearching.value = false
  }, 350)
}
function gotoUser(userId) {
  closeUserModal()
  router.push(`/profile/${userId}`)
}

// 데이터 로딩 및 예외처리
onMounted(async () => {
  try {
    const res1 = await api.get(`/api/user-profile/${userId}`)
    user.value = res1.data

    // 카테고리/서브카테고리 맵 구성
    const categoryMap = {}
    for (const rule of res1.data.playedRules) {
      if (!categoryMap[rule.majorCategory]) categoryMap[rule.majorCategory] = []
      if (!categoryMap[rule.majorCategory].includes(rule.minorCategory))
        categoryMap[rule.majorCategory].push(rule.minorCategory)
    }
    playedCategoryMap.value = categoryMap
    playedRules.value = res1.data.playedRules

    // 필터 기본값
    if (Object.keys(categoryMap).length) {
      selectedMainCategory.value = Object.keys(categoryMap)[0]
      selectedSubCategory.value = categoryMap[selectedMainCategory.value][0]
    }
    if (playedRules.value.length) selectedRuleId.value = playedRules.value[0].id

    // allGames는 더 이상 사용되지 않으므로 제거하거나, 필요에 따라 user.recentGames를 할당할 수 있습니다.
    // allGames.value = res2.data; // 이 줄은 제거됩니다.

    await nextTick()

    const matchId = Number(route.query.id)

    console.log('matchRefs:', matchRefs.value)
    console.log('matchId:', matchId)

    const el = matchRefs.value[matchId]
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })

      console.log('hello')
    }

    updateChart()
  } catch (e) {
    if (e.response && e.response.data && e.response.data.message) {
      showToast(e.response.data.message)
    } else {
      showToast('프로필 정보를 불러오는데 실패했습니다.')
    }
    console.log(e)
    router.back()
  }
})
// const minorCategories = ref([])
// const selectedMinorCategory = ref('')
// const ranking = ref({})
// const loadingRanking = ref(false)
// const showRankingModal = ref(false)
// const rankingValue = ref(null)
// const rankingPercent = ref(null)

// onMounted(async () => {
//   // 1. 마운트될 때 최다플레이 마이너카테고리 fetch
//   const res = await api.get(`/api/rules/top-played-categories/${userId}`)
//   minorCategories.value = res.data || []
//   minorCategories.value.unshift('전체')

//   // 2. 첫 번째 카테고리로 자동 선택
//   selectedMinorCategory.value = minorCategories.value[0] || ''
//   // 3. 바로 해당 카테고리로 랭킹 조회
//   if (selectedMinorCategory.value) fetchRankingAll()
// })

// async function fetchRanking(minorCategory) {
//   loadingRanking.value = true
//   try {
//     const res = await api.get(`/api/rankings?userId=${userId}&minorCategory=${minorCategory}`)
//     console.log(minorCategory)
//     ranking.value = res.data
//   } finally {
//     loadingRanking.value = false
//     rankingValue.value = ranking.value.minorCategoryRank
//     rankingPercent.value = ranking.value.minorCategoryPercent
//   }
// }

// async function fetchRankingAll() {
//   loadingRanking.value = true
//   try {
//     const res = await api.get(`/api/rankings?userId=${userId}`)
//     ranking.value = res.data
//   } finally {
//     loadingRanking.value = false
//     rankingValue.value = ranking.value.totalRank
//     rankingPercent.value = ranking.value.totalPercent
//   }
// }

// async function selectMinorCategory(cat) {
//   selectedMinorCategory.value = cat

//   if (cat === '전체') {
//     await fetchRankingAll()
//   } else {
//     await fetchRanking(cat)
//   }
// }

watch([statMode, selectedRuleId, selectedMainCategory, selectedSubCategory], updateChart, {
  deep: true,
})

watch(showStatsModal, (newValue) => {
  console.log('showStatsModal changed:', newValue)
})
</script>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css');
body {
  background: #f8f9fa !important;
}
.line-clamp-2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
}
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
::-webkit-scrollbar {
  display: none;
}
@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
.bg-gradient-animate {
  background: linear-gradient(90deg, #f97316, #fbbf24, #f97316 80%);
  background-size: 200% 200%;
  animation: gradientShift 4s ease-in-out infinite;
  opacity: 0.82;
}
@keyframes pulse-slow {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.85;
  }
}
.animate-pulse-slow {
  animation: pulse-slow 2s ease-in-out infinite;
}

.champ-slide-enter-active,
.champ-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55);
}
.champ-slide-enter-from {
  opacity: 0;
  transform: translateX(-32px);
}
.champ-slide-enter-to {
  opacity: 1;
  transform: translateX(0);
}
.champ-slide-leave-from {
  opacity: 1;
  transform: translateX(0);
}
.champ-slide-leave-to {
  opacity: 0;
  transform: translateX(-32px);
}

.champ-card-container {
  z-index: 30;
}

.champ-card {
  /* 모던 플랫 카드 */
  background: #fff;
  border-radius: 1.2rem;
  box-shadow:
    0 2px 18px 0 rgba(80, 80, 80, 0.07),
    0 1.5px 8px 0 rgba(230, 130, 60, 0.09);
  border: 1px solid #f2f3f6;
  transition: box-shadow 0.18s;
}

.champ-card .fa-crown {
  /* 타이틀쪽 크라운만 컬러! */
  color: #f7c63a;
}

@keyframes shine {
  0% {
    filter: drop-shadow(0 0 0 #fff);
  }
  50% {
    filter: drop-shadow(0 0 12px #ffd700);
  }
  100% {
    filter: drop-shadow(0 0 0 #fff);
  }
}
.animate-shine {
  animation: shine 1.7s ease-in-out infinite;
}

@keyframes pop {
  0% {
    transform: scale(0.8);
  }
  80% {
    transform: scale(1.08);
  }
  100% {
    transform: scale(1);
  }
}
.animate-pop {
  animation: pop 0.7s cubic-bezier(0.42, 2, 0.58, 0.7);
}
@keyframes modalpop {
  0% {
    transform: scale(0.8) translateY(50px);
    opacity: 0;
  }
  80% {
    transform: scale(1.05) translateY(-6px);
    opacity: 1;
  }
  100% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}
.animate-modalpop {
  animation: modalpop 0.5s cubic-bezier(0.42, 2, 0.58, 0.7);
}
@keyframes bounce-fast {
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
.animate-bounce-fast {
  animation: bounce-fast 0.25s;
}
</style>
