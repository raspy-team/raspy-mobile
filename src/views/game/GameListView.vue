<template>
  <HeaderComp :has-referer="true" title="경기 목록" />
  <div
    class="bg-white pb-16"
    ref="containerRef"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseUp"
  >
    <!-- Status Bar -->
    <div class="bg-white h-6 w-full"></div>

    <!-- Header with Logo and Actions -->
    <header class="px-4 py-3 mt-5"></header>

    <!-- Pull to Refresh Indicator (새로고침 중) -->
    <transition name="pull-fade">
      <div
        v-if="pullTriggered"
        class="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full shadow-xl px-6 py-3 flex items-center gap-3"
      >
        <div class="relative w-5 h-5">
          <i class="fas fa-spinner fa-spin text-white text-lg"></i>
        </div>
        <span class="text-sm font-semibold text-white">새로고침 중...</span>
      </div>
    </transition>

    <!-- Pull to Refresh Complete (완료) -->
    <transition name="pull-fade">
      <div
        v-if="refreshComplete"
        class="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-green-500 to-green-600 rounded-full shadow-xl px-6 py-3 flex items-center gap-3"
      >
        <div class="relative w-5 h-5 flex items-center justify-center">
          <i class="fas fa-check text-white text-lg animate-bounce-in"></i>
        </div>
        <span class="text-sm font-semibold text-white">새로고침 완료!</span>
      </div>
    </transition>

    <!-- Pull Indicator (당기는 중) -->
    <transition name="pull-slide">
      <div
        v-if="isPulling && pullDistance > 20 && !pullTriggered"
        class="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-white rounded-full shadow-2xl px-6 py-3 flex items-center gap-3 border-2"
        :class="pullDistance > 80 ? 'border-orange-500' : 'border-gray-200'"
        :style="{
          opacity: Math.min(pullDistance / 80, 1),
          transform: `translate(-50%, ${Math.min(pullDistance / 3, 30)}px)`,
        }"
      >
        <div class="relative w-5 h-5 flex items-center justify-center">
          <i
            class="fas text-lg transition-all duration-300"
            :class="pullDistance > 80 ? 'fa-sync text-orange-500' : 'fa-arrow-down text-gray-400'"
            :style="{
              transform: pullDistance > 80 ? 'rotate(180deg)' : 'rotate(0deg)',
              animation: pullDistance > 80 ? 'pulse 0.8s infinite' : 'none',
            }"
          ></i>
        </div>
        <span
          class="text-sm font-semibold transition-colors"
          :class="pullDistance > 80 ? 'text-orange-500' : 'text-gray-600'"
        >
          {{ pullDistance > 80 ? '놓아서 새로고침!' : '아래로 당기세요...' }}
        </span>
      </div>
    </transition>

    <!-- Main Content -->
    <main class="pt-3 px-4 pb-4">
      <!-- 게임리스트 -->
      <div class="space-y-4">
        <!-- 필터 버튼 제거됨: 모든 지역, 최신순 기본값으로 표시 -->

        <div v-if="games.length > 0">
          <div
            v-for="(game, index) in games"
            :key="index"
            class="bg-white rounded-2xl shadow-lg border mb-4 p-0 overflow-hidden cursor-pointer"
            @click="selectedGame = game"
            :class="selectedGame && selectedGame.id === game.id ? 'ring-2 ring-orange-400' : ''"
          >
            <!-- 생성자 영역 -->
            <div class="flex items-center bg-orange-50 px-5 py-4 gap-4">
              <img
                :src="game.ownerProfileUrl || Default"
                class="w-12 h-12 rounded-full border-2 border-orange-400 shadow"
              />
              <div>
                <div class="font-bold text-lg text-gray-900">{{ game.ownerNickname }}</div>
                <div class="flex gap-2 mt-1">
                  <span class="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs border"
                    >해당규칙전적</span
                  >
                  <span class="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs border"
                    >도전자 수</span
                  >
                </div>
              </div>
              <div class="flex-1"></div>
              <div class="text-gray-400 text-xs text-right min-w-[60px]">
                {{ formatTimeAgo(game.createdAt) }}
              </div>
            </div>
            <!-- 규칙 영역 -->
            <div class="px-5 py-4 text-center border-b">
              <div
                class="font-extrabold text-xl text-orange-500 cursor-pointer"
                @click.stop="openModal(game)"
              >
                {{ game.rule.ruleTitle }}
              </div>
              <div class="text-gray-500 text-sm mt-2 truncate">
                {{ game.rule.ruleDescription }}
              </div>
            </div>
            <!-- 경기 조건 영역 -->
            <div class="px-5 py-3 flex justify-between items-center text-sm text-gray-700">
              <span>{{
                game.matchLocation == ' ' || game.matchLocation == ''
                  ? '장소 미정'
                  : game.matchLocation
              }}</span>
              <span>{{
                !game.matchDate || game.matchDate == ' ' ? '시간 미정' : formatDate(game.matchDate)
              }}</span>
            </div>
          </div>
        </div>
        <!-- 하단 고정 버튼 영역 -->
        <div
          v-if="selectedGame"
          class="fixed bottom-0 left-0 w-full bg-white border-t z-50 flex justify-center gap-4 py-3 shadow-lg"
        >
          <button
            :disabled="selectedGame.applied"
            @click="!selectedGame.applied && confirmApply(selectedGame)"
            :class="[
              'w-14 h-14 flex items-center justify-center font-semibold rounded-full transition text-white',
              selectedGame.applied
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-orange-500 hover:bg-orange-600 cursor-pointer',
            ]"
          >
            {{ selectedGame.applied ? '신청 완료' : '신청' }}
          </button>
          <button
            @click="toggleComment(selectedGame.id)"
            class="w-14 h-14 flex items-center justify-center bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition"
          >
            <i class="fas fa-comment"></i>
          </button>
          <div class="relative">
            <button
              @click="selectedGame.showMoreMenu = !selectedGame.showMoreMenu"
              class="w-14 h-14 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition"
              aria-label="더보기"
            >
              <span class="text-2xl">⋯</span>
            </button>
            <div
              v-if="selectedGame.showMoreMenu"
              class="absolute right-0 bottom-full mb-2 bg-white border rounded shadow-md z-30 w-32"
            >
              <button
                @click="(onClickReport(selectedGame.id), (selectedGame.showMoreMenu = false))"
                class="block w-full text-left px-4 py-2 text-red-500 hover:bg-gray-50"
              >
                신고하기
              </button>
              <button
                @click="(shareGame(selectedGame.id), (selectedGame.showMoreMenu = false))"
                class="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                공유하기
              </button>
            </div>
          </div>
        </div>
        <div v-else>
          <!-- 스켈레톤 or 없음 표시 -->
          <template v-if="!timerDone">
            <!-- 스켈레톤 UI: 카드 3개 정도 반복 -->
            <div
              v-for="n in 3"
              :key="n"
              class="bg-white rounded-2xl border shadow-sm overflow-hidden mb-4 p-4 animate-pulse"
            >
              <div class="flex justify-between items-start">
                <div class="flex flex-col w-full justify-between">
                  <div class="h-5 bg-gray-200 rounded w-2/3 mb-2"></div>
                  <div class="h-3 bg-gray-100 rounded w-1/3"></div>
                </div>
                <div class="h-4 bg-gray-100 rounded w-12"></div>
              </div>
              <div class="flex justify-between items-center px-7 pt-1 pb-4">
                <div class="flex-1 flex flex-col items-center gap-1">
                  <div class="h-8"></div>
                  <div class="relative">
                    <div class="w-14 h-14 rounded-full bg-gray-100 border-2 border-gray-200"></div>
                  </div>
                  <div class="h-4 w-16 bg-gray-100 rounded mt-2"></div>
                  <div class="h-3 w-10 bg-gray-100 rounded"></div>
                </div>
                <div class="vs-area flex flex-col gap-1 items-center justify-center mx-3 mt-5">
                  <div class="h-6 w-8 bg-gray-200 rounded"></div>
                  <div class="h-4 w-10 bg-gray-100 rounded"></div>
                </div>
                <div
                  class="flex-1 min-h-[60px] flex flex-col justify-center mt-6 items-center gap-2"
                >
                  <div>
                    <div
                      class="w-14 h-14 bg-gray-100 rounded-full border border-gray-200 flex items-center justify-center"
                    ></div>
                    <div class="flex justify-center gap-1 mt-2">
                      <div class="w-3 h-3 bg-gray-100 rounded"></div>
                      <div class="w-3 h-3 bg-gray-100 rounded"></div>
                      <div class="w-3 h-3 bg-gray-100 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div
                class="mt-3 flex flex-col justify-start items-start text-sm text-gray-500 gap-1 mb-2"
              >
                <div class="flex items-center gap-2">
                  <div class="w-4 h-4 bg-gray-100 rounded"></div>
                  <div class="h-3 w-16 bg-gray-100 rounded"></div>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-4 h-4 bg-gray-100 rounded"></div>
                  <div class="h-3 w-12 bg-gray-100 rounded"></div>
                </div>
              </div>
              <div class="mt-4 flex items-center gap-2">
                <div class="h-11 flex-grow rounded-full bg-gray-200"></div>
                <div class="w-11 h-11 bg-gray-200 rounded-full"></div>
                <div class="w-11 h-11 bg-gray-200 rounded-full"></div>
              </div>
            </div>
          </template>
          <div v-else class="text-center mt-10 text-gray-600 text-sm">표시할 게임이 없습니다</div>
        </div>
      </div>
    </main>

    <!-- 초대 모달 -->
    <div
      v-if="showInviteModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
      style="backdrop-filter: blur(2px)"
      @click.self="closeInviteModal"
    >
      <div
        class="relative bg-white rounded-3xl shadow-2xl w-[95%] pt-8 pb-2 flex flex-col items-center gap-2"
        style="box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.15)"
      >
        <!-- X Close Button -->
        <button
          @click="closeInviteModal"
          aria-label="닫기"
          class="absolute right-4 top-4 w-9 h-9 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition text-gray-500 hover:text-gray-900 z-10"
          style="box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04)"
        >
          <i class="fas fa-times text-xl"></i>
        </button>

        <!-- Icon and Title -->
        <div class="mb-1 flex flex-col items-center w-full px-7">
          <div class="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-2">
            <i class="fas fa-key text-orange-500 text-2xl"></i>
          </div>
          <div class="text-xl font-bold text-gray-900 tracking-tight text-center">
            초대 코드로 빠른 참가
          </div>
          <div class="text-gray-500 text-xs mt-1 text-center">
            친구에게 받은 <span class="text-orange-500 font-semibold">4자리 코드</span>를
            입력하세요.
          </div>
        </div>

        <!-- Input -->
        <div class="w-full flex flex-col gap-1 mt-4 px-7">
          <input
            v-model="inviteInput"
            maxlength="4"
            inputmode="numeric"
            placeholder="0000"
            class="w-full text-center text-2xl font-extrabold border-0 border-b-2 border-gray-200 focus:border-orange-500 focus:ring-0 transition placeholder-gray-300 tracking-widest bg-transparent py-2 mb-2"
            @keyup.enter="submitInvite"
            autocomplete="one-time-code"
          />
          <transition name="fade">
            <div v-if="inviteError" class="text-red-500 text-xs font-medium text-center mt-1">
              {{ inviteError }}
            </div>
          </transition>
        </div>

        <!-- 검색 버튼/로딩 -->
        <div v-if="!inviteGame" class="flex w-full mt-5 gap-2 px-7">
          <button
            @click="closeInviteModal"
            class="flex-1 py-2.5 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 text-gray-500 font-semibold transition"
          >
            취소
          </button>
          <button
            @click="submitInvite"
            :disabled="inviteLoading || inviteInput.length !== 4"
            class="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition flex justify-center items-center disabled:opacity-50"
          >
            <span v-if="!inviteLoading">확인</span>
            <i v-else class="fas fa-spinner fa-spin"></i>
          </button>
        </div>

        <!-- 초대한 사람 정보 (ownerNickname/ownerProfileUrl) -->

        <!-- 게임 정보 카드 -->
        <transition name="fade">
          <div v-if="inviteGame">
            <div class="bg-white overflow-auto mb-4 w-[86dvw] max-h-[68%] p-4">
              <!-- 타이틀과 생성자 정보(우측 상단) -->

              <div class="flex justify-between items-start">
                <div class="flex flex-col w-full justify-between">
                  <h4 class="text-lg font-extrabold text-gray-800 mb-1">
                    {{ inviteGame.ruleTitle }}
                  </h4>
                  <div class="text-xs text-orange-500 font-medium mb-2 flex gap-1 items-center">
                    {{ inviteGame.majorCategory }} <span class="mx-1 text-orange-500">&gt;</span>
                    {{ inviteGame.minorCategory }}
                  </div>
                </div>

                <div class="text-gray-600 text-right text-[0.79rem] min-w-[60px]">
                  {{ formatTimeAgo(inviteGame.createdAt) }}
                </div>
              </div>

              <!-- VS AREA -->
              <div class="flex justify-between items-center px-7 pt-1 pb-4">
                <div
                  @click="router.push('/profile/' + inviteGame.ownerId)"
                  class="flex-1 flex flex-col items-center gap-1"
                >
                  <div class="h-8 flex items-end">
                    <champion-badge v-if="inviteGame.championId == inviteGame.ownerId" />
                  </div>
                  <div class="relative">
                    <img
                      :src="inviteGame.ownerProfileUrl || Default"
                      class="w-14 h-14 rounded-full border-2 border-orange-400 shadow-lg bg-white"
                    />
                  </div>
                  <div class="text-gray-700 font-[600] text-sm">
                    {{ inviteGame.ownerNickname }}
                  </div>
                  <div>
                    <div
                      class="text-xs font-semibold flex mr-2 items-center justify-end pr-2"
                      :class="[
                        inviteGame.mannerScore >= 4
                          ? 'text-orange-500'
                          : inviteGame.mannerScore >= 2
                            ? 'text-orange-500'
                            : inviteGame.mannerScore > 0
                              ? 'text-red-500'
                              : 'text-gray-400',
                      ]"
                    >
                      <i
                        :class="[
                          inviteGame.mannerScore >= 4
                            ? 'fas fa-face-smile'
                            : inviteGame.mannerScore >= 2
                              ? 'fas fa-face-meh'
                              : inviteGame.mannerScore > 0
                                ? 'fas fa-face-frown'
                                : 'fas fa-user-slash',
                        ]"
                        class="mr-1"
                      ></i>
                      {{ inviteGame.mannerScore.toFixed(1) }}
                    </div>
                  </div>
                </div>
                <div class="vs-area flex flex-col gap-1 items-center justify-center mx-3 mt-5">
                  <div class="text-lg font-black tracking-tight text-orange-500">VS</div>
                  <div class="text-sm font-semibold text-orange-400">경기 전</div>
                </div>
                <div
                  class="flex-1 min-h-[60px] flex flex-col justify-center mt-6 items-center gap-2"
                >
                  <div>
                    <div
                      class="w-14 h-14 bg-gradient-to-tr from-gray-100 to-gray-200 rounded-full border border-gray-200 flex items-center justify-center"
                    >
                      <i class="fas fa-user-clock text-2xl text-gray-400"></i>
                    </div>
                    <div
                      class="flex justify-center gap-1 mt-2 font-semibold text-xs text-gray-400 opacity-70 tracking-wide"
                    >
                      <span>-</span><span>-</span><span>-</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 모달 Content -->
              <div class="bg-white rounded-xl py-6 max-w-lg w-full relative z-[1000000000]">
                <div class="flex gap-3 mb-3 items-center">
                  <div class="font-semibold text-gray-700">
                    {{ inviteGame.ruleTitle }}
                  </div>
                  <div class="text-xs text-orange-500 font-medium flex gap-1 items-center">
                    {{ inviteGame.majorCategory }} <span class="mx-1 text-orange-500">&gt;</span>
                    {{ inviteGame.minorCategory }}
                  </div>
                </div>
                <div class="text-sm text-gray-700 space-y-4">
                  <div>
                    <!-- 접힘 상태 -->
                    <div v-if="!expanded" class="relative text-right">
                      <p
                        class="line-clamp-2 leading-relaxed text-left whitespace-pre-line border-b pb-4"
                      >
                        {{ inviteGame.ruleDescription }}
                      </p>
                      <button
                        @click="expanded = true"
                        class="text-blue-600 text-sm hover:underline mt-1"
                      >
                        펼치기
                      </button>
                    </div>

                    <!-- 펼쳐진 상태 -->
                    <div v-else class="relative text-right">
                      <p class="leading-relaxed whitespace-pre-line text-left border-b pb-4">
                        {{ inviteGame.ruleDescription }}
                      </p>
                      <button
                        @click="expanded = false"
                        class="text-blue-600 text-sm hover:underline mt-1"
                      >
                        접기
                      </button>
                    </div>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500">세트 승리 기준</span>
                    <span>{{
                      inviteGame.winCondition === 'SETS_HALF_WIN' ? '점수 달성' : '시간 도달'
                    }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500">한세트 승리에 필요한 점수</span>
                    <span>{{
                      inviteGame.points === -1 ? '제한 없음' : inviteGame.points + '점'
                    }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500">총 세트 수</span>
                    <span>{{ inviteGame.sets }}세트</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500">세트 제한 시간</span>
                    <span>
                      {{
                        inviteGame.duration === -1
                          ? '제한 없음'
                          : inviteGame.duration >= 60
                            ? Math.floor(inviteGame.duration / 60) +
                              '분 ' +
                              (inviteGame.duration % 60) +
                              '초'
                            : inviteGame.duration + '초'
                      }}
                    </span>
                  </div>
                </div>
              </div>
              <!-- 장소 & 날짜 -->
              <div
                class="mt-3 flex flex-col justify-start items-start text-sm text-gray-500 gap-1 mb-2"
              >
                <div class="flex items-center gap-2">
                  <i class="fas w-3 fa-map-marker-alt text-orange-500"></i>
                  <span>{{
                    inviteGame.matchLocation == ' ' || inviteGame.matchLocation == ''
                      ? '미정'
                      : inviteGame.matchLocation
                  }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <i class="far w-3 fa-calendar text-orange-500"></i>
                  <span>{{ formatDate(inviteGame.matchDate) }}</span>
                </div>
              </div>
              <!-- 참가 버튼들 -->
              <div class="mt-4 flex items-center gap-2">
                <button
                  :disabled="inviteGame.applied"
                  @click.stop="() => applyInviteGame(inviteGame.id)"
                  :class="[
                    'h-11 flex-grow font-semibold rounded-full transition text-white',
                    inviteGame.applied
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-orange-500 hover:bg-orange-600 cursor-pointer',
                  ]"
                >
                  {{ inviteGame.applied ? '신청 완료' : '참가하기' }}
                </button>
                <button
                  @click.stop="toggleComment(inviteGame.id)"
                  class="w-11 h-11 flex items-center justify-center bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition"
                >
                  <i class="fas fa-comment"></i>
                </button>
                <button
                  @click.stop="shareGame(inviteGame)"
                  class="w-11 h-11 flex items-center justify-center bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition"
                >
                  <i class="fas fa-share"></i>
                </button>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>

    <!-- 지역 선택 모달/이하 동일 -->
    <div
      v-if="showRegionModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30"
    >
      <div class="bg-white rounded-xl w-11/12 max-w-md p-5 space-y-4">
        <h3 class="text-lg font-bold text-gray-800 mb-4">지역 선택</h3>
        <select
          v-model="selectedPrimary"
          @change="selectedSecondary = selectedPrimary === '전국' ? '전국' : ''"
          class="w-full border rounded px-3 py-2 text-sm"
        >
          <option value="" disabled selected>시/도 선택</option>
          <option v-for="(districts, primary) in regionMap" :key="primary" :value="primary">
            {{ primary }}
          </option>
        </select>
        <select
          v-model="selectedSecondary"
          :disabled="!selectedPrimary || selectedPrimary === '전국'"
          class="w-full border rounded px-3 py-2 text-sm"
        >
          <option value="" disabled selected>시/군/구 선택</option>
          <option v-for="sub in regionMap[selectedPrimary] || []" :key="sub" :value="sub">
            {{ sub }}
          </option>
        </select>
        <div class="flex justify-end space-x-2 pt-3">
          <button
            @click="showRegionModal = false"
            class="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 text-sm"
          >
            취소
          </button>
          <button
            :disabled="!selectedSecondary"
            @click="applyRegionFilter"
            class="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm disabled:opacity-50"
          >
            적용
          </button>
        </div>
      </div>
    </div>
    <CustomAlert
      v-if="alertMsg"
      :message="alertMsg"
      @confirm="applyConfirmed"
      @cancel="() => (alertMsg = '')"
    />
    <CustomToast class="z-[200]" />
    <!-- Share Game Modal -->
    <div
      v-if="shareModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[30000]"
      @click.self="shareModal = false"
    >
      <div class="bg-white rounded-xl shadow-lg p-6 w-80 mx-4">
        <h3 class="text-lg font-semibold text-gray-800 mb-4 text-center">초대 코드</h3>
        <div class="text-3xl font-bold text-orange-600 mb-2 tracking-widest text-center">
          {{ inviteCode }}
        </div>
        <div class="text-xs text-gray-400 text-center mb-4">
          친구에게 코드를 복사해서 공유하세요
        </div>
        <button
          @click="copyInviteCode"
          class="w-full mb-2 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition"
        >
          복사하기
        </button>
        <div v-if="copied" class="text-orange-500 text-xs text-center mb-2">복사 완료!</div>
        <button
          @click="shareModal = false"
          class="w-full py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition"
        >
          닫기
        </button>
      </div>
    </div>
  </div>

  <!-- 맨 위로 버튼 (스크롤 시에만) -->
  <button
    v-if="showScrollTop"
    @click="scrollToTop"
    class="fixed z-[99] bottom-20 right-6 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-xl w-12 h-12 flex items-center justify-center transition"
    aria-label="맨 위로"
    style="box-shadow: 0 6px 18px 0 rgba(255, 115, 0, 0.12)"
  >
    <i class="fas fa-arrow-up text-xl"></i>
  </button>

  <!-- 신고 입력 모달 -->
  <div
    v-if="showReportModal"
    class="fixed inset-0 z-50 bg-black bg-opacity-30 flex items-center justify-center p-4"
  >
    <div class="bg-white rounded-lg max-w-sm w-full p-6 shadow-lg relative">
      <button
        class="absolute top-3 right-3 text-gray-400"
        @click="showReportModal = false"
        aria-label="닫기"
      >
        <i class="fas fa-times"></i>
      </button>
      <h2 class="text-xl font-bold mb-3">신고하기</h2>
      <p class="text-gray-700 mb-4">신고 사유를 입력해주세요:</p>
      <textarea
        v-model="reportReason"
        class="w-full border rounded p-2 text-sm mb-4"
        rows="4"
        placeholder="신고 사유를 작성하세요"
      ></textarea>
      <div class="flex justify-end gap-2">
        <button
          @click="cancelReport"
          class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
          취소
        </button>
        <button
          @click="confirmReport"
          :disabled="!reportReason.trim()"
          class="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
        >
          신고하기
        </button>
      </div>
    </div>
  </div>

  <!-- 신고 완료 모달 -->
  <div
    v-if="showThankModal"
    class="fixed inset-0 z-50 bg-black bg-opacity-30 flex items-center justify-center p-4"
  >
    <div class="bg-white rounded-lg max-w-sm w-full p-6 shadow-lg relative">
      <button
        class="absolute top-3 right-3 text-gray-400"
        @click="showThankModal = false"
        aria-label="닫기"
      >
        <i class="fas fa-times"></i>
      </button>
      <h2 class="text-xl font-bold text-green-600 mb-3">신고 접수 완료</h2>
      <p class="text-gray-700 mb-4">
        신고해 주셔서 감사합니다.<br />
        제출하신 내용은 24시간 이내에 처리됩니다.
      </p>
      <div class="text-right">
        <button
          @click="showThankModal = false"
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          확인
        </button>
      </div>
    </div>
  </div>

  <Comment v-if="commentId != 0" :id="commentId" @close="commentId = 0" />

  <!-- 하단 중앙 고정 경기 생성 버튼 -->
  <button
    @click="router.push('/create-game')"
    class="fixed bottom-10 z-0 left-1/2 -translate-x-1/2 bg-orange-500 text-white rounded-full shadow-lg hover:bg-orange-600 active:scale-95 transition-all z-50 flex items-center gap-2 px-5 py-3.5"
  >
    <i class="fas fa-plus text-lg"></i>
    <span class="font-semibold text-sm px-2">경기 만들기</span>
  </button>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import api from '../../api/api'
import HeaderComp from '../../components/HeaderComp.vue'
import CustomAlert from '../../components/CustomAlert.vue'
import CustomToast from '../../components/CustomToast.vue'
// import MatchModal from '../../components/MatchModal.vue' (미사용)

import { useToast } from '../../composable/useToast'
import { useRouter } from 'vue-router'
import { useRoute } from 'vue-router'
const route = useRoute()

import regionMap from '../../assets/regionMap.json'
import Default from '../../assets/default.png'
import ChampionBadge from '../../components/ChampionBadge.vue'
import Comment from '../GameCommentView.vue'
// const expanded = ref([])
// const toggleExpand = (id) => {
//   if (expanded.value.includes(id)) {
//     expanded.value = expanded.value.filter(x => x !== id)
//   } else {
//     expanded.value.push(id)
//   }
// }

const expanded = ref(false)
const showScrollTop = ref(false)

// Pull to Refresh 상태
const pullTriggered = ref(false)
const refreshComplete = ref(false)
const startY = ref(0)
const isPulling = ref(false)
const pullDistance = ref(0)
const containerRef = ref(null)
const isMouseDown = ref(false)

// 터치 이벤트
const handleTouchStart = (e) => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop

  if (scrollTop <= 0) {
    startY.value = e.touches[0].clientY
    isPulling.value = true
    pullDistance.value = 0
  }
}

const handleTouchMove = (e) => {
  if (!startY.value) return

  const scrollTop = window.pageYOffset || document.documentElement.scrollTop

  if (scrollTop > 0) {
    isPulling.value = false
    pullDistance.value = 0
    return
  }

  const currentY = e.touches[0].clientY
  const diff = currentY - startY.value

  if (diff > 5) {
    isPulling.value = true
    pullDistance.value = Math.min(diff, 150)
    e.preventDefault()
  } else {
    pullDistance.value = 0
  }
}

const handleTouchEnd = async () => {
  if (isPulling.value && pullDistance.value > 80) {
    pullTriggered.value = true
    await fetchGames()
    pullTriggered.value = false

    // 완료 메시지 표시
    refreshComplete.value = true
    setTimeout(() => {
      refreshComplete.value = false
    }, 1500)
  }

  isPulling.value = false
  pullDistance.value = 0
  startY.value = 0
}

// 마우스 이벤트 (PC 테스트용)
const handleMouseDown = (e) => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop

  if (scrollTop <= 0) {
    startY.value = e.clientY
    isMouseDown.value = true
    isPulling.value = true
    pullDistance.value = 0
  }
}

const handleMouseMove = (e) => {
  if (!isMouseDown.value || !startY.value) return

  const scrollTop = window.pageYOffset || document.documentElement.scrollTop

  if (scrollTop > 0) {
    isPulling.value = false
    pullDistance.value = 0
    return
  }

  const currentY = e.clientY
  const diff = currentY - startY.value

  if (diff > 5) {
    isPulling.value = true
    pullDistance.value = Math.min(diff, 150)
    e.preventDefault()
  } else {
    pullDistance.value = 0
  }
}

const handleMouseUp = async () => {
  if (!isMouseDown.value) return

  if (isPulling.value && pullDistance.value > 80) {
    pullTriggered.value = true
    await fetchGames()
    pullTriggered.value = false

    // 완료 메시지 표시
    refreshComplete.value = true
    setTimeout(() => {
      refreshComplete.value = false
    }, 1500)
  }

  isMouseDown.value = false
  isPulling.value = false
  pullDistance.value = 0
  startY.value = 0
}

const handleScroll = () => {
  showScrollTop.value = window.scrollY > 120

  // 스크롤 중에는 pull 상태 초기화
  if (window.scrollY > 0) {
    isPulling.value = false
    pullDistance.value = 0
  }
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

function formatTimeAgo(dateString) {
  const now = new Date()
  const createdAt = new Date(dateString)
  const diff = (now - createdAt) / 1000
  if (diff < 60) return `방금 전`
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  if (diff < 2592000) return `${Math.floor(diff / 86400)}일 전`
  if (diff < 31104000) return `${Math.floor(diff / 2592000)}개월 전`
  return `${Math.floor(diff / 31104000)}년 전`
}
const router = useRouter()

const commentId = ref(0)
const toggleComment = (id) => {
  commentId.value = id
}
const shareModal = ref(false)
const inviteCode = ref('')
const copied = ref(false)
const OFFSET = 538

// 초대 딥링크 복사
async function shareGame(gameId) {
  showToast('공유 링크가 복사되었습니다!')

  const res = await api.post('/api/invite', null, { params: { gameId } })
  const url = res.data.url

  // iOS WebView (WKWebView)
  if (
    window.webkit &&
    window.webkit.messageHandlers &&
    window.webkit.messageHandlers.clipboardCopy
  ) {
    window.webkit.messageHandlers.clipboardCopy.postMessage(url)
    return
  }

  // (Android WebView는 그대로. clipboard 잘 동작하니 아래 코드 유지)
  try {
    await navigator.clipboard.writeText(url)
    return
  } catch (err) {
    // Safari 등 일부 환경에서 clipboard API가 막힌 경우 fallback
    try {
      const input = document.createElement('input')
      input.value = url
      document.body.appendChild(input)
      input.select()
      const success = document.execCommand('copy')
      document.body.removeChild(input)
      if (!success) {
        showToast('복사에 실패했습니다!')
      }
    } catch (err2) {
      showToast('복사에 실패했습니다!')
    }
  }
}

const copyInviteCode = async () => {
  try {
    await navigator.clipboard.writeText(inviteCode.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (e) {
    copied.value = false
    // clipboard API 실패 시
    if (window.AndroidApp?.copyTextToClipboard) {
      window.AndroidApp.copyTextToClipboard(inviteCode.value)
      copied.value = true
      setTimeout(() => {
        copied.value = false
      }, 2000)
      return
    }
  }
}
const { showToast } = useToast()

const showInviteModal = ref(false)
const inviteInput = ref('')
const inviteLoading = ref(false)
const inviteError = ref('')
const inviteGame = ref(null)
const closeInviteModal = () => {
  showInviteModal.value = false
  inviteInput.value = ''
  inviteLoading.value = false
  inviteError.value = ''
  inviteGame.value = null
  expanded.value = false
}
const submitInvite = async () => {
  inviteError.value = ''
  inviteGame.value = null
  inviteLoading.value = true
  try {
    const INV_MULTIPLIER = 7143
    const code = inviteInput.value
    if (!/^\d{4}$/.test(code)) {
      inviteError.value = '4자리 숫자를 입력하세요.'
      inviteLoading.value = false
      return
    }
    const num = parseInt(code, 10)
    const x = (num * INV_MULTIPLIER) % 10000
    const gameId = (x - OFFSET + 10000) % 10000
    const res = await api.get('/api/games/summary', {
      params: { gameId },
    })
    inviteGame.value = res.data
  } catch (e) {
    inviteError.value = '잘못된 초대 번호입니다.'
  } finally {
    inviteLoading.value = false
  }
}
const applyInviteGame = async (id) => {
  try {
    await api.post(`/api/games/${id}/apply`)
    showToast('참가 신청이 완료되었습니다!', `/game&id=${id}`)
    closeInviteModal()
  } catch (e) {
    showToast(e.response?.data?.message || '신청에 실패했습니다.')
  }
}

const requestCount = ref(0)

// const menuItems = [
//   { name: '규칙 탐색', icon: 'fas fa-book-open', link: '/rules' },

//   { name: '경기 생성', icon: 'fas fa-plus', link: '/create-game' },
//   { name: '경기 요청', icon: 'fas fa-envelope', link: '/inbox' },
// ]
const showRegionModal = ref(false)
const applyRegionFilter = () => {
  showRegionModal.value = false
  fetchGames()
}
const games = ref([])
const loading = ref(true)
const alertMsg = ref('')
const selectedGame = ref(null)
const sortOption = ref('latest')
// ...showFilterMenu 변수 제거됨
const selectedPrimary = ref('전국')
const selectedSecondary = ref('전국')
const timerDone = ref(false)
const fetchGames = async () => {
  loading.value = true
  try {
    const requestCountRes = await api.get('/api/games/request-count')
    requestCount.value = requestCountRes.data

    const res = await api.get('/api/games/list', {
      params: {
        region:
          selectedPrimary.value && selectedSecondary.value
            ? `${selectedPrimary.value} ${selectedSecondary.value}`
            : null,
        sort: sortOption.value,
      },
    })
    games.value = res.data.map((game) => ({
      ...game,
      showRuleDetail: false,
      applied: false,
    }))

    setTimeout(() => (timerDone.value = true), 1200)
  } catch (err) {
    console.error('게임 목록 로드 실패', err)
    setTimeout(() => (timerDone.value = true), 1200)
  } finally {
    loading.value = false
  }
}

function openModal(game) {
  if (game.showRuleDetail == true) return
  game.showRuleDetail = true
}

// ...setSort 함수 제거됨
const formatDate = (dateStr) => {
  if (!dateStr) return '미정'
  const date = new Date(dateStr)
  return date.toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })
}
const confirmApply = (game) => {
  selectedGame.value = game
  alertMsg.value = `@${game.ownerNickname}님의 경기에 신청하시겠습니까?`
}
const applyConfirmed = async () => {
  if (!selectedGame.value) return
  try {
    await api.post(`/api/games/${selectedGame.value.id}/apply`)
    showToast('신청이 완료되었습니다!', `/inbox?tab=sent&id=${selectedGame.value.id}`)
    requestCount.value += 1
  } catch (err) {
    showToast(err.response?.data?.message || '신청 실패. 다시 시도해주세요.')
  } finally {
    alertMsg.value = ''
    selectedGame.value = null
  }
}

const showReportModal = ref(false)
const showThankModal = ref(false)
const reportReason = ref('')
let reportTarget = ref(null)

function onClickReport(targetId) {
  reportTarget.value = targetId
  reportReason.value = ''
  showReportModal.value = true
}

function cancelReport() {
  showReportModal.value = false
}

async function confirmReport() {
  if (!reportReason.value.trim()) return
  try {
    await api.post('/api/reports', {
      targetType: 'GAME',
      targetId: reportTarget.value,
      reason: reportReason.value,
    })
    showReportModal.value = false
    showThankModal.value = true
  } catch (err) {
    console.error('신고 실패', err)
    showToast('신고 접수가 완료된 경기입니다.')
    showReportModal.value = false
  }
}

onMounted(() => {
  fetchGames()
  const commentQueryId = route.query.commentId
  if (commentQueryId && !isNaN(Number(commentQueryId))) {
    commentId.value = Number(commentQueryId)
  }
})
</script>
<style scoped>
input:focus {
  outline: none;
}
input[type='number']::-webkit-inner-spin-button,
input[type='number']::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.text-overflow-ellipsis {
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* Pull to Refresh 애니메이션 */
.pull-fade-enter-active,
.pull-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.pull-fade-enter-from {
  opacity: 0;
  transform: translate(-50%, -20px) scale(0.9);
}
.pull-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -10px) scale(0.95);
}

.pull-slide-enter-active,
.pull-slide-leave-active {
  transition: all 0.2s ease-out;
}
.pull-slide-enter-from,
.pull-slide-leave-to {
  opacity: 0;
  transform: translate(-50%, -10px);
}

@keyframes bounce-in {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

.animate-bounce-in {
  animation: bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.1);
  }
}
</style>
