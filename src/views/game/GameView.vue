<template>
  <Header :has-referer="false" title="게임" class="z-10" />

  <div class="flex-1 w-full min-h-full pt-[4rem] pb-28 px-4 space-y-4">
    <!-- 상단 메뉴 버튼 -->
    <div class="flex gap-2 pt-3">
      <button
        @click="router.push('/rules')"
        class="flex-1 min-w-0 flex items-center justify-center gap-2 py-4 px-0 bg-white text-gray-900 text-lg font-bold rounded-lg border border-gray-300 hover:bg-gray-50 active:bg-gray-100 transition-colors shadow-sm"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 2h8c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2z"
            stroke="currentColor"
            stroke-width="1.5"
            fill="none"
          />
          <path
            d="M5 6h6M5 9h6M5 12h4"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
        <span>규칙</span>
      </button>
      <button
        @click="router.push('/game-list')"
        class="flex-1 min-w-0 flex items-center justify-center gap-2 py-4 px-0 bg-white text-gray-900 text-lg font-bold rounded-lg border border-gray-300 hover:bg-gray-50 active:bg-gray-100 transition-colors shadow-sm"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2 4h12M2 8h12M2 12h12"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
        <span>경기</span>
      </button>
    </div>

    <!-- 로딩 상태 -->
    <div v-if="loading" class="space-y-5">
      <div
        v-for="i in 3"
        :key="i"
        class="p-5 border bg-white rounded-2xl shadow space-y-5 animate-pulse"
      >
        <div class="flex justify-between items-start">
          <div class="space-y-2 w-full">
            <div class="mb-1 flex">
              <span class="font-semibold text-gray-300 block w-32 h-5 bg-gray-200 rounded"></span>
              <span class="flex ml-3 w-6 h-6 bg-gray-200 rounded-full"></span>
            </div>
            <div class="text-xs flex gap-1 items-center">
              <span class="block w-16 h-3 bg-gray-200 rounded"></span>
              <span class="mx-1 text-gray-200">&gt;</span>
              <span class="block w-12 h-3 bg-gray-200 rounded"></span>
            </div>
          </div>
          <span class="text-xs font-semibold px-2 py-2 rounded-full w-[5rem] bg-gray-200"></span>
        </div>
        <div class="w-full h-10 bg-gray-200 rounded-[5px]"></div>
      </div>
    </div>

    <!-- 게임 목록 -->
    <template v-else>
      <div v-if="allGames.length" class="space-y-4">
        <div
          v-for="game in allGames"
          :key="game.id"
          :id="'game-' + game.id"
          @click="game.showRuleDetail = true"
          :class="[
            'relative p-5 rounded-xl bg-white border space-y-4 transition-all',
            getCardClass(game),
            { 'highlight-purple': highlightedGameId === game.id },
          ]"
        >
          <!-- 규칙(게임명, 카테고리) 정보 최상단 -->
          <div class="flex justify-between items-start mb-2">
            <div class="min-w-0 flex items-center gap-2">
              <div>
                <img
                  class="w-10"
                  :src="`/category-picture/${game.rule.minorCategory || '미분류'}.png`"
                  alt="카테고리 이미지"
                />
              </div>
              <div>
                <span class="text-base font-extrabold text-gray-900 truncate block">
                  {{ game.rule.ruleTitle }}
                </span>
                <div class="flex gap-1 items-center mt-1 text-xs text-orange-500 font-medium">
                  {{ game.rule.majorCategory }}
                  <span v-if="game.rule.minorCategory" class="mx-1 text-orange-500">&gt;</span>
                  <span v-if="game.rule.minorCategory">{{ game.rule.minorCategory }}</span>
                </div>
              </div>
            </div>
            <!-- 공유 버튼 (우상단) -->
            <button
              @click.stop="shareGameWithNative(game)"
              class="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors flex-shrink-0"
              title="공유하기"
            >
              <i class="fas fa-share-nodes text-sm"></i>
            </button>
          </div>

          <!-- 도전자 버튼 및 모달 -->
          <div class="mb-2">
            <!-- Owner vs Opponent Profile Row -->
            <div class="flex justify-between items-end mt-3 mb-1">
              <!-- Owner (좌측) -->
              <div class="flex flex-col items-center flex-1">
                <img
                  :src="
                    game.type === 'my-game'
                      ? game.myProfileUrl || '/default.png'
                      : game.ownerProfileUrl || '/default.png'
                  "
                  class="w-14 h-14 rounded-full object-cover border-2 border-orange-400 shadow"
                  alt="Owner Profile"
                />
                <span
                  class="mt-1 text-xs font-semibold text-gray-700 truncate max-w-[4.5rem] text-center"
                >
                  {{ game.type === 'my-game' ? game.myNickname : game.ownerNickname }}
                </span>
              </div>
              <!-- VS -->
              <div class="flex flex-col items-center flex-1">
                <span class="text-lg font-bold text-gray-400 mb-2">VS</span>
              </div>
              <!-- Opponent (우측) -->
              <div class="flex flex-col items-center flex-1">
                <img
                  v-if="game.opponentProfileUrl"
                  :src="game.opponentProfileUrl"
                  class="w-14 h-14 rounded-full object-cover border-2 border-blue-400 shadow"
                  alt="Opponent Profile"
                />
                <div
                  v-else
                  class="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300 shadow"
                >
                  <i class="fas fa-user text-2xl text-gray-400"></i>
                </div>
                <span
                  class="mt-1 text-xs font-semibold text-gray-700 truncate max-w-[4.5rem] text-center"
                >
                  {{ game.opponentNickname || '미정' }}
                </span>
              </div>
            </div>
          </div>

          <!-- 도전자(신청자) 목록 모달 -->
          <div
            v-if="
              showApplicantsModal && selectedApplicantsGame && selectedApplicantsGame.id === game.id
            "
            class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[100000]"
          >
            <div class="bg-white p-6 m-5 rounded-2xl w-full max-w-md shadow-lg relative">
              <button
                @click.stop="closeApplicantsModal"
                class="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              >
                <i class="fas fa-times"></i>
              </button>
              <h2 class="text-lg font-bold mb-4 text-gray-900">도전자 목록</h2>
              <div
                v-if="
                  selectedApplicantsGame.applicants && selectedApplicantsGame.applicants.length > 0
                "
                class="space-y-3"
              >
                <div
                  v-for="user in selectedApplicantsGame.applicants"
                  :key="user.userId"
                  class="p-3 bg-gray-50 rounded-xl flex items-center justify-between"
                >
                  <router-link :to="'/profile/' + user.userId">
                    <div class="flex items-center gap-3">
                      <img
                        :src="user.applicantProfileUrl || '/default.png'"
                        class="w-10 h-10 rounded-full object-cover"
                      />
                      <div class="space-y-1">
                        <p class="text-sm font-bold text-gray-800 flex items-center gap-2">
                          {{ user.applicantNickname }}
                          <champion-badge
                            v-if="selectedApplicantsGame.championId == user.userId"
                          ></champion-badge>
                        </p>
                        <p class="text-xs text-gray-500">
                          {{ user.applicantGameStatisticsDTO.wins }}승
                          {{ user.applicantGameStatisticsDTO.draws }}무
                          {{ user.applicantGameStatisticsDTO.losses }}패 · 승률
                          {{ getWinRate(user.applicantGameStatisticsDTO) }}%
                        </p>
                      </div>
                    </div>
                  </router-link>
                  <div class="flex flex-col gap-2">
                    <template v-if="selectedApplicantsGame.type === 'my-game'">
                      <button
                        v-if="!user.approved"
                        @click.stop="approve(selectedApplicantsGame.id, user.userId)"
                        :disabled="approvedExists(selectedApplicantsGame.applicants)"
                        class="px-4 py-2 text-xs rounded-lg text-white font-semibold"
                        :class="
                          approvedExists(selectedApplicantsGame.applicants)
                            ? 'bg-gray-300'
                            : 'bg-orange-500 hover:bg-orange-600'
                        "
                      >
                        승인
                      </button>
                      <button
                        v-else
                        @click.stop="cancelApproval(selectedApplicantsGame.id, user.userId)"
                        class="px-4 py-2 text-xs rounded-lg bg-red-100 text-red-600 font-semibold hover:bg-red-200"
                      >
                        취소
                      </button>
                    </template>
                  </div>
                </div>
              </div>
              <div v-else class="text-center text-gray-400 text-sm py-6">신청자가 없습니다.</div>
            </div>
          </div>

          <!-- 장소 & 날짜 -->
          <div
            class="mt-3 flex flex-col justify-start items-start text-sm text-gray-500 gap-1 mb-2"
          >
            <div class="flex items-center gap-2">
              <i class="fas w-3 fa-map-marker-alt text-orange-500"></i>
              <span>{{
                !game.matchLocation || game.matchLocation.trim() === ''
                  ? '장소 미정'
                  : game.matchLocation
              }}</span>
            </div>
            <div class="flex items-center gap-2">
              <i class="far w-3 fa-calendar text-orange-500"></i>
              <span>{{ formatDate(game.matchDate) }}</span>
            </div>
          </div>

          <!-- 규칙 모달 -->
          <MatchRuleModal
            v-if="game.showRuleDetail"
            :rule="game.rule"
            @close="game.showRuleDetail = false"
          />

          <!-- 신청한 게임: 소유자 정보 -->
          <div v-if="game.type === 'sent'" class="pt-3">
            <div class="flex justify-between items-center">
              <div>
                <p class="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  {{ game.ownerNickname }}
                  <span class="text-xs flex items-center gap-1">
                    <i
                      :class="[
                        (game.ownerStatistics.manner || 4.5) >= 4
                          ? 'fas fa-face-smile text-green-500'
                          : (game.ownerStatistics.manner || 4.5) >= 2
                            ? 'fas fa-face-meh text-orange-500'
                            : (game.ownerStatistics.manner || 4.5) > 0
                              ? 'fas fa-face-frown text-red-500'
                              : 'fas fa-user-slash text-gray-400',
                      ]"
                    ></i>
                    {{ (game.ownerStatistics.manner || 4.5).toFixed(1) }}
                  </span>
                </p>
                <p class="text-xs text-gray-500">
                  {{ game.ownerStatistics.wins }}승 {{ game.ownerStatistics.draws }}무
                  {{ game.ownerStatistics.losses }}패 · 승률 {{ getWinRate(game.ownerStatistics) }}%
                </p>
              </div>
              <div>
                <champion-badge v-if="game.championId == game.ownerId"></champion-badge>
              </div>
            </div>
            <div class="flex gap-2 pt-3">
              <button
                v-if="game.status === 'REQUESTED' || game.status === 'APPROVED'"
                @click.stop="openCancelConfirmModal(game.id)"
                class="flex-1 min-w-0 flex items-center justify-center gap-2 text-red-400 text-sm border-[1px] border-red-400 py-3 px-0 rounded-[8px]"
              >
                <i class="fas fa-xmark"></i> 신청 취소
              </button>
              <button
                v-else-if="game.status === 'REJECTED'"
                class="flex-1 min-w-0 flex items-center justify-center gap-2 bg-[#afafaf] text-sm text-white border-[1px] py-3 px-0 rounded-[8px] opacity-70 cursor-not-allowed"
                disabled
              >
                승인 거부됨
              </button>
              <button
                @click.stop="goDM(game.ownerId)"
                class="flex-1 min-w-0 flex items-center justify-center gap-2 text-sm text-white bg-blue-400 py-3 px-0 rounded-[8px]"
              >
                <i class="fas fa-paper-plane"></i> DM
              </button>
              <button
                class="flex-1 min-w-0 flex items-center justify-center gap-2 py-3 px-0 bg-blue-100 text-blue-700 rounded-[8px] font-semibold text-sm hover:bg-blue-200 transition"
                @click.stop="openApplicantsModal(game)"
              >
                도전자
              </button>
            </div>
          </div>

          <!-- 내 게임: 게임 시작 버튼만 표시 -->
          <div v-else-if="game.type === 'my-game'" class="space-y-3">
            <div class="pt-3 flex gap-2">
              <button
                v-if="game.status === 'IN_PROGRESS'"
                class="flex-1 min-w-0 bg-orange-500 text-white font-bold rounded-xl py-3 px-0 shadow hover:bg-orange-400 transition active:scale-95"
                @click.stop="joinGame(game.id)"
              >
                <i class="fas fa-sign-in-alt mr-2"></i>경기 참여
              </button>
              <button
                v-else-if="game.isOwner && canStart(game)"
                class="flex-1 min-w-0 bg-[#56b97b] text-white font-bold rounded-xl py-3 px-0 shadow transition active:scale-95"
                @click.stop="openStartModal(game)"
              >
                <i class="fas fa-play mr-2"></i>경기 시작
              </button>
              <button
                class="flex-1 min-w-0 flex items-center justify-center gap-2 text-sm text-white bg-blue-400 py-3 px-0 rounded-[8px]"
                @click.stop="goDM(game.opponentId || game.ownerId)"
              >
                <i class="fas fa-paper-plane"></i> DM
              </button>
              <button
                class="flex-1 min-w-0 flex items-center justify-center gap-2 py-3 px-0 bg-blue-100 text-blue-700 rounded-[8px] font-semibold text-sm hover:bg-blue-200 transition"
                @click.stop="openApplicantsModal(game)"
              >
                도전자
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 빈 상태 -->
      <div v-else class="text-center text-gray-400 text-sm py-10">게임이 없습니다.</div>
    </template>
  </div>

  <FooterNav tab="game" />

  <!-- 게임 시작 모달들 (MyGameListView에서 가져온 것) -->
  <div
    v-if="showAddressModal"
    class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[100000]"
  >
    <div class="bg-white p-6 m-5 rounded-2xl w-full max-w-md shadow-lg">
      <h2 class="text-lg font-semibold mb-4">경기 장소 설정</h2>
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          <i class="fas fa-search mr-1 text-orange-500"></i>
          장소 검색
        </label>
        <div class="relative">
          <input
            ref="addressInputModal"
            v-model="searchQuery"
            class="w-full text-base px-4 py-3 bg-white rounded-xl border-2 border-gray-200 outline-none focus:border-orange-400 transition"
            placeholder="장소명 또는 주소 입력 (예: 서초탁구장)"
            autocomplete="off"
          />
          <i
            v-if="!searchQuery"
            class="fas fa-location-dot absolute right-4 top-1/2 -translate-y-1/2 text-gray-300"
          ></i>
        </div>
        <p class="text-xs text-gray-400 mt-2">
          <i class="fas fa-lightbulb text-yellow-500 mr-1"></i>
          장소명이나 주소를 입력하면 자동으로 검색됩니다
        </p>
      </div>

      <div v-if="selectedPlace" class="mb-4 p-4 bg-orange-50 rounded-xl border border-orange-200">
        <div class="flex items-start gap-3">
          <i class="fas fa-map-marker-alt text-orange-500 mt-1"></i>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-gray-800 mb-1">{{ selectedPlace.name }}</p>
            <p class="text-sm text-gray-600">{{ selectedPlace.address }}</p>
          </div>
          <button @click="clearSelection" class="text-gray-400 hover:text-gray-600 transition">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>

      <div v-if="!selectedPlace" class="mt-4 text-xs text-gray-500 flex items-center gap-2">
        <i class="fas fa-info-circle text-blue-400"></i>
        <span>장소를 선택해야 게임을 시작할 수 있습니다</span>
      </div>
      <div class="flex justify-end mt-6 space-x-2">
        <button
          @click="closeModal"
          class="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 transition"
        >
          취소
        </button>
        <button
          :disabled="!selectedPlace"
          class="px-5 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-600 transition shadow-md"
          @click="submitAndStartGame"
        >
          <i class="fas fa-play mr-1"></i>
          경기 진행
        </button>
      </div>
    </div>
  </div>

  <div
    v-if="showCountdownModal"
    class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[100050]"
  >
    <div class="bg-white p-7 m-5 rounded-2xl w-full max-w-md shadow-2xl text-center">
      <h2 class="text-xl font-bold text-gray-900 mb-3 tracking-tight">경기 시작 전 확인</h2>
      <p class="text-sm text-gray-500 mb-1">이 경기는 다음 시간 동안 진행됩니다:</p>
      <div class="text-4xl font-black text-orange-500 py-4 mb-4 mt-3">
        {{ countdownDurationText }}
      </div>
      <p class="text-xs text-gray-400 mb-5">
        아래 <span class="font-semibold text-orange-500">"바로 시작하기"</span> 버튼을 누르면 즉시
        경기가 시작되고 상대방에게도 표시됩니다.
      </p>
      <div class="flex justify-end gap-2">
        <button
          @click="showCountdownModal = false"
          class="px-4 py-2 rounded bg-gray-100 text-gray-600 text-sm"
        >
          취소
        </button>
        <button
          @click="confirmStartGame"
          class="px-5 py-2 rounded bg-orange-500 text-white text-sm font-semibold shadow hover:bg-orange-400 transition active:scale-95"
        >
          바로 시작하기
        </button>
      </div>
    </div>
  </div>

  <div
    v-if="showAddressErrorModal"
    class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[100100]"
  >
    <div class="bg-white p-6 m-5 rounded-2xl w-full max-w-sm shadow-2xl">
      <div class="text-center mb-4">
        <i class="fas fa-exclamation-triangle text-orange-500 text-4xl mb-3"></i>
        <h3 class="text-lg font-bold text-gray-900 mb-2">장소를 찾을 수 없습니다</h3>
        <p class="text-sm text-gray-600">
          더 구체적인 장소를 입력해주세요.<br />
          <span class="text-xs text-gray-500 mt-2 block">예: 서초탁구장, 강남체육관</span>
        </p>
      </div>
      <button
        @click="showAddressErrorModal = false"
        class="w-full bg-orange-500 text-white font-semibold py-3 rounded-xl hover:bg-orange-600 transition shadow"
      >
        확인
      </button>
    </div>
  </div>

  <CameraCapture
    :is-visible="showCameraModal"
    title="경기 시작 인증샷"
    subtitle="피드에 표시될 사진을 촬영해주세요"
    @capture="onPhotoCapture"
    @cancel="onCameraCancel"
  />

  <!-- 신청 취소 확인 모달 -->
  <div
    v-if="showCancelConfirmModal"
    class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[100000]"
  >
    <div class="bg-white p-6 m-5 rounded-2xl w-full max-w-sm shadow-lg">
      <h2 class="text-lg font-bold mb-3 text-gray-900">신청 취소</h2>
      <p class="text-sm text-gray-600 mb-6">정말로 신청을 취소하시겠습니까?</p>
      <div class="flex gap-2 justify-end">
        <button
          @click="showCancelConfirmModal = false"
          class="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 transition"
        >
          아니오
        </button>
        <button
          @click="confirmCancelRequest"
          class="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition"
        >
          예, 취소합니다
        </button>
      </div>
    </div>
  </div>

  <CustomToast />
</template>

<script setup>
// 도전자(신청자) 모달 상태
const showApplicantsModal = ref(false)
const selectedApplicantsGame = ref(null)

// 신청 취소 확인 모달 상태
const showCancelConfirmModal = ref(false)
const cancelTargetGameId = ref(null)

function openApplicantsModal(game) {
  selectedApplicantsGame.value = game
  showApplicantsModal.value = true
}

function closeApplicantsModal() {
  showApplicantsModal.value = false
  selectedApplicantsGame.value = null
}
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import client from '../../api/api'
import Header from '../../components/HeaderComp.vue'
import FooterNav from '../../components/FooterNav.vue'
import ChampionBadge from '../../components/ChampionBadge.vue'
import MatchRuleModal from '../../components/MatchModal.vue'
import CustomToast from '../../components/CustomToast.vue'
import CameraCapture from '../../components/CameraCapture.vue'
import { useToast } from '../../composable/useToast'
import { parseRegion } from '../../utils/regionParser'

const { showToast } = useToast()
const router = useRouter()
const route = useRoute()

const sentGames = ref([]) // 신청한 게임
const myGames = ref([]) // 내 게임
const applicantsMap = ref({}) // 각 게임의 신청자 목록 (gameId -> applicants)
const loading = ref(true)

// 게임 시작 관련
const showAddressModal = ref(false)
const searchQuery = ref('')
const selectedPlace = ref(null)
const currentGameId = ref(null)
const showCountdownModal = ref(false)
const countdownDurationText = ref('')
const showAddressErrorModal = ref(false)
const showCameraModal = ref(false)
const capturedPhotoFile = ref(null)
const addressInputModal = ref(null)
let autocompleteModal = null

// 스크롤 하이라이트 관련
const highlightedGameId = ref(null)

// 모든 게임을 최신순으로 합쳐서 보여주기 (신청한 게임 + 내 게임)
// 내 게임에는 신청자 목록도 함께 포함
const allGames = computed(() => {
  const sent = sentGames.value.map((g) => ({
    ...g,
    type: 'sent',
    timestamp: g.matchDate || g.createdAt,
  }))
  const my = myGames.value.map((g) => ({
    ...g,
    type: 'my-game',
    timestamp: g.matchDate || g.startedAt || g.createdAt,
    applicants: applicantsMap.value[g.id] || [], // 신청자 목록 추가
  }))

  const all = [...sent, ...my]
  all.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

  return all
})

onMounted(async () => {
  loading.value = true

  try {
    const [applicantsRes, sentRes, myGamesRes] = await Promise.all([
      client.get('/api/games/my-games/applicants'), // 내 게임의 신청자 목록
      client.get('/api/games/my-requests'), // 신청한 게임
      client.get('/api/games/my-games'), // 내 게임
    ])

    // 신청자 목록을 gameId로 매핑
    const applicantsData = applicantsRes.data
    applicantsData.forEach((game) => {
      applicantsMap.value[game.gameId] = game.applicants || []
    })

    sentGames.value = sentRes.data.map((g) => ({ ...g, showRuleDetail: false }))
    myGames.value = myGamesRes.data.map((g) => ({ ...g, showRuleDetail: false }))
  } catch (e) {
    console.error('Failed to load games:', e)
  } finally {
    loading.value = false

    // URL 쿼리에서 게임 ID 확인하고 스크롤
    const gameId = route.query.id
    if (gameId) {
      await nextTick()
      scrollToGame(gameId)
    }
  }
})

// 게임으로 스크롤 이동 및 하이라이트
function scrollToGame(gameId) {
  const element = document.getElementById(`game-${gameId}`)
  if (element) {
    // 부드러운 스크롤
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })

    // 하이라이트 효과
    highlightedGameId.value = Number(gameId)

    // 3초 후 하이라이트 제거
    setTimeout(() => {
      highlightedGameId.value = null
    }, 3000)
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '미정'
  const date = new Date(dateStr)
  return date.toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })
}

// function getStatusClass(game) {
//   if (game.type === 'sent') {
//     if (game.status === 'APPROVED') return 'text-blue-600'
//     if (game.status === 'REQUESTED') return 'text-gray-500'
//     if (game.status === 'REJECTED') return 'text-red-500'
//   } else if (game.type === 'my-game') {
//     if (game.status === 'IN_PROGRESS') return 'text-green-500'
//     if (game.status === 'SCHEDULED') return 'text-orange-500'
//     if (game.status === 'MATCHING') return 'text-orange-400'
//     if (game.status === 'COMPLETED') return 'text-gray-400'
//     if (game.status === 'CANCELED') return 'text-red-400'
//   }
//   return 'text-gray-500'
// }

// function getStatusText(game) {
//   if (game.type === 'sent') {
//     if (game.status === 'APPROVED') return '승인됨 - 시작 대기 중'
//     if (game.status === 'REQUESTED') return '대기 중'
//     if (game.status === 'REJECTED') return '거절됨'
//   } else if (game.type === 'my-game') {
//     if (game.status === 'MATCHING') return '매칭 중'
//     if (game.status === 'SCHEDULED') return '진행 예정'
//     if (game.status === 'IN_PROGRESS') return '진행 중'
//     if (game.status === 'COMPLETED') return '완료됨'
//     if (game.status === 'CANCELED') return '취소됨'
//   }
//   return '알 수 없음'
// }

function getWinRate(stats) {
  const total = stats.wins + stats.draws + stats.losses
  if (total === 0) return 0
  return Math.round((stats.wins / total) * 100)
}

function approvedExists(applicants) {
  return applicants.some((user) => user.approved)
}

async function approve(gameId, userId) {
  try {
    await client.post(`/api/games/approve`, { gameId, userId })
    const applicants = applicantsMap.value[gameId]
    const user = applicants?.find((a) => a.userId === userId)
    if (user) user.approved = true

    const game = myGames.value.find((g) => g.id === gameId)
    if (game) {
      game.status = 'SCHEDULED'
      game.opponentNickname = user?.applicantNickname || ''
    }

    showToast(`@${user?.applicantNickname || '사용자'}님을 승인했습니다!`)
  } catch (err) {
    if (err.response?.data?.message?.includes('한 명만 승인 가능')) {
      alert('이미 다른 사용자가 승인되었습니다.')
    } else {
      console.error(err)
      alert('승인 중 오류가 발생했습니다.')
    }
  }
}

async function cancelApproval(gameId, userId) {
  await client.post(`/api/games/cancel-approve`, { gameId, userId })
  const applicants = applicantsMap.value[gameId]
  const user = applicants?.find((a) => a.userId === userId)
  if (user) user.approved = false

  const game = myGames.value.find((g) => g.id === gameId)
  if (game) {
    game.status = 'MATCHING'
    game.opponentNickname = ''
  }

  showToast(`${user?.applicantNickname || '사용자'}님의 참여를 취소했습니다!`)
}

function openCancelConfirmModal(gameId) {
  cancelTargetGameId.value = gameId
  showCancelConfirmModal.value = true
}

async function confirmCancelRequest() {
  const gameId = cancelTargetGameId.value
  if (!gameId) return

  try {
    await client.post('/api/games/cancel-request', { gameId })
    sentGames.value = sentGames.value.filter((g) => g.id !== gameId)
    showToast('신청을 취소했습니다.')
  } finally {
    showCancelConfirmModal.value = false
    cancelTargetGameId.value = null
  }
}

function goDM(userId) {
  router.push('/chat/' + userId)
}

// 내 게임 관련 함수들
const joinGame = (id) => router.push(`/games/${id}/play`)
const canStart = (g) => g.status === 'SCHEDULED' && !!g.opponentNickname

// 게임 상태별 공유 메시지 생성
function getShareMessage(game) {
  const ruleName = game.rule.ruleTitle
  const location =
    game.matchLocation && game.matchLocation.trim() !== '' ? game.matchLocation : '장소 미정'
  const date = game.matchDate ? formatDate(game.matchDate) : '날짜 미정'

  if (game.type === 'my-game') {
    if (game.status === 'MATCHING') {
      return `🎮 ${ruleName} 경기에 도전자를 찾고 있어요!\n📍 ${location}\n📅 ${date}\n\n지금 바로 도전해보세요!`
    } else if (game.status === 'SCHEDULED') {
      return `🎮 ${ruleName} 경기가 곧 시작됩니다!\n📍 ${location}\n📅 ${date}\n\n응원해주세요!`
    } else if (game.status === 'IN_PROGRESS') {
      return `🔥 ${ruleName} 경기가 진행 중입니다!\n📍 ${location}\n\n실시간으로 응원해주세요!`
    } else if (game.status === 'COMPLETED') {
      return `✅ ${ruleName} 경기가 종료되었습니다!\n📍 ${location}\n\n결과를 확인해보세요!`
    }
  } else if (game.type === 'sent') {
    if (game.status === 'REQUESTED') {
      return `🎮 ${ruleName} 경기에 신청했어요!\n📍 ${location}\n📅 ${date}\n\n승인을 기다리고 있습니다!`
    } else if (game.status === 'APPROVED') {
      return `✅ ${ruleName} 경기 신청이 승인되었어요!\n📍 ${location}\n📅 ${date}\n\n곧 경기가 시작됩니다!`
    }
  }

  return `🎮 ${ruleName} 경기\n📍 ${location}\n📅 ${date}`
}

// Web Share API를 사용한 공유 함수
async function shareGameWithNative(game) {
  const message = getShareMessage(game)
  const shareUrl = `https://raspy.app/game/${game.id}` // 임시 딥링크 URL

  const shareData = {
    title: `Match - ${game.rule.ruleTitle}`,
    text: message,
    url: shareUrl,
  }

  try {
    // Web Share API 지원 확인
    if (navigator.share) {
      await navigator.share(shareData)
      showToast('공유되었습니다!')
    } else {
      // Web Share API 미지원 시 URL 복사
      await fallbackCopyToClipboard(shareUrl, message)
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      // 사용자가 취소한 경우가 아니면 fallback
      await fallbackCopyToClipboard(shareUrl, message)
    }
  }
}

// URL 복사 fallback 함수
async function fallbackCopyToClipboard(url, message) {
  const fullText = `${message}\n\n${url}`

  // iOS WebView 전용 복사
  if (
    window.webkit &&
    window.webkit.messageHandlers &&
    window.webkit.messageHandlers.clipboardCopy
  ) {
    window.webkit.messageHandlers.clipboardCopy.postMessage(fullText)
    showToast('공유 링크가 복사되었습니다!')
    return
  }

  // 일반 클립보드 복사
  try {
    await navigator.clipboard.writeText(fullText)
    showToast('공유 링크가 복사되었습니다!')
    return
  } catch (err) {
    try {
      const input = document.createElement('input')
      input.value = fullText
      document.body.appendChild(input)
      input.select()
      const success = document.execCommand('copy')
      document.body.removeChild(input)
      if (success) {
        showToast('공유 링크가 복사되었습니다!')
      } else {
        showToast('복사에 실패했습니다!')
      }
    } catch (err2) {
      showToast('복사에 실패했습니다!')
    }
  }
}

const initGoogleAutocomplete = () => {
  if (window.google?.maps?.places && addressInputModal.value) {
    autocompleteModal = new window.google.maps.places.Autocomplete(addressInputModal.value, {
      componentRestrictions: { country: 'kr' },
      fields: ['formatted_address', 'address_components', 'geometry', 'name'],
      types: ['establishment', 'geocode'],
    })

    autocompleteModal.addListener('place_changed', () => {
      const place = autocompleteModal.getPlace()
      if (place.geometry && place.formatted_address) {
        const parsed = parseRegion(place.formatted_address)

        if (!parsed) {
          showAddressErrorModal.value = true
          searchQuery.value = ''
          selectedPlace.value = null
          return
        }

        selectedPlace.value = {
          name: place.name || '',
          address: parsed.fullAddress,
          region1: parsed.region1,
          region2: parsed.region2,
          geometry: place.geometry,
        }
      }
    })
  }
}

const clearSelection = () => {
  selectedPlace.value = null
  searchQuery.value = ''
}

const openStartModal = (game) => {
  showAddressModal.value = true
  searchQuery.value = ''
  selectedPlace.value = null
  currentGameId.value = game.id

  nextTick(() => {
    initGoogleAutocomplete()
  })
}

const submitAndStartGame = async () => {
  if (!selectedPlace.value) return alert('장소를 선택해주세요.')
  await client.post(`/api/games/${currentGameId.value}/set-region`, {
    roadAddress: selectedPlace.value.address,
    detailAddress: selectedPlace.value.name,
  })

  showAddressModal.value = false
  showCameraModal.value = true
}

const onPhotoCapture = (photoFile) => {
  capturedPhotoFile.value = photoFile
  showCameraModal.value = false

  const game = myGames.value.find((g) => g.id === currentGameId.value)
  const dur = game?.rule?.duration

  if (dur === -1) {
    countdownDurationText.value = '제한 없음'
  } else {
    const min = Math.floor(dur / 60)
    const sec = dur % 60
    countdownDurationText.value = (min ? `${min}분 ` : '') + (sec ? `${sec}초` : '')
  }
  showCountdownModal.value = true
}

const onCameraCancel = () => {
  showCameraModal.value = false
  capturedPhotoFile.value = null
}

const confirmStartGame = async () => {
  if (!capturedPhotoFile.value) {
    alert('사진을 촬영해주세요.')
    return
  }

  try {
    const formData = new FormData()
    formData.append('photo', capturedPhotoFile.value)

    await client.post(`/api/games/${currentGameId.value}/start`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    router.push(`/games/${currentGameId.value}/play`)
    showCountdownModal.value = false
  } catch (e) {
    alert('게임 시작 실패: ' + (e.response?.data?.message ?? e.message))
  }
}

const closeModal = () => {
  showAddressModal.value = false
  searchQuery.value = ''
  selectedPlace.value = null
  currentGameId.value = null
}

// 게임 타입별 카드 스타일 (심플/플랫)
function getCardClass(game) {
  if (game.type === 'sent') {
    return 'border-gray-200 hover:border-blue-300 hover:shadow-md'
  } else if (game.type === 'my-game') {
    // 시작 가능한 게임은 초록색 강조
    if (game.isOwner && canStart(game)) {
      return 'border-green-400 shadow-md shadow-green-100'
    }
    return 'border-gray-200 hover:border-orange-300 hover:shadow-md'
  }
  return 'border-gray-200'
}

// // 타입 텍스트 색상
// function getTypeTextClass(game) {
//   if (game.type === 'sent') {
//     return 'text-blue-600'
//   } else if (game.type === 'my-game') {
//     if (game.isOwner && canStart(game)) {
//       return 'text-green-600'
//     }
//     return 'text-orange-600'
//   }
//   return 'text-gray-600'
// }

/**  타입 라벨
function getTypeLabel(game) {
  if (game.type === 'sent') return '신청한 게임'
  if (game.type === 'my-game') {
    if (game.isOwner && canStart(game)) return '시작 가능'
    return '내 게임'
  }
  return '게임'
}
*/
</script>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css');

.highlight-orange {
  animation: highlight-orange-fade 1s cubic-bezier(0.49, 0.38, 0.27, 1.18);
}
@keyframes highlight-orange-fade {
  0% {
    background: #ffe4ba;
  }
  40% {
    background: #ffa565;
  }
  70% {
    background: #ffa565;
  }
  100% {
    background: white;
  }
}

.highlight-purple {
  animation: highlight-purple-pulse 1.5s ease-out;
}

@keyframes highlight-purple-pulse {
  0% {
    background: #faf5ff;
    border-color: #d8b4fe;
  }
  50% {
    background: #f5f3ff;
    border-color: #c4b5fd;
  }
  100% {
    background: white;
    border-color: inherit;
  }
}
</style>

<style>
.pac-container {
  z-index: 100010 !important;
}
</style>
