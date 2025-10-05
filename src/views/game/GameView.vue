<template>
  <Header :has-referer="false" title="게임" class="z-10" />

  <div class="flex-1 w-full min-h-full pt-[4rem] pb-28 px-4 space-y-4">
    <!-- 상단 메뉴 버튼 -->
    <div class="flex gap-2 pt-3">
      <button
        @click="router.push('/rules')"
        class="flex-1 flex items-center justify-center gap-2 py-4 px-4 bg-white text-gray-900 text-lg font-bold rounded-lg border border-gray-300 hover:bg-gray-50 active:bg-gray-100 transition-colors shadow-sm"
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
        class="flex-1 flex items-center justify-center gap-2 py-4 px-4 bg-white text-gray-900 text-lg font-bold rounded-lg border border-gray-300 hover:bg-gray-50 active:bg-gray-100 transition-colors shadow-sm"
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
          ]"
        >
          <!-- 타입 표시 (왼쪽 상단 라벨) -->
          <div class="flex items-center gap-2 mb-2">
            <span :class="['text-xs font-semibold', getTypeTextClass(game)]">
              {{ getTypeLabel(game) }}
            </span>
            <div class="h-3 w-px bg-gray-300"></div>
            <span class="text-xs font-semibold" :class="getStatusClass(game)">
              {{ getStatusText(game) }}
            </span>
          </div>

          <!-- 헤더 -->
          <div class="flex justify-between items-start">
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
          <div v-if="game.type === 'sent'" class="border-t border-gray-300 pt-3">
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
            <div class="grid grid-cols-2 gap-3 pt-3">
              <button
                v-if="game.status === 'REQUESTED'"
                @click.stop="cancelRequest(game.id)"
                class="flex items-center justify-center gap-2 text-red-400 text-sm border-[1px] border-red-400 py-3 rounded-[8px]"
              >
                <i class="fas fa-xmark"></i> 신청 취소
              </button>
              <button
                v-else-if="game.status === 'APPROVED'"
                class="flex items-center justify-center gap-2 bg-green-500 text-sm text-white border-[1px] py-3 rounded-[8px]"
                disabled
              >
                <i class="fas fa-check"></i> 승인됨
              </button>
              <button
                v-else-if="game.status === 'REJECTED'"
                class="flex items-center justify-center gap-2 bg-[#afafaf] text-sm text-white border-[1px] py-3 rounded-[8px]"
                disabled
              >
                승인 거부됨
              </button>
              <button
                @click.stop="goDM(game.ownerId)"
                class="flex items-center justify-center gap-2 text-sm text-white bg-blue-400 py-3 rounded-[8px]"
              >
                <i class="fas fa-paper-plane"></i> DM
              </button>
            </div>
          </div>

          <!-- 내 게임: 신청자 목록 + 게임 시작 버튼 -->
          <div v-else-if="game.type === 'my-game'" class="space-y-3">
            <!-- 신청자 목록 (있을 경우만 표시) -->
            <div
              v-if="game.applicants && game.applicants.length > 0"
              class="border-t border-gray-300 pt-4 space-y-3"
            >
              <h4 class="text-sm font-semibold text-gray-700">신청자 목록</h4>
              <div
                v-for="user in game.applicants"
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
                        <champion-badge v-if="game.championId == user.userId"></champion-badge>
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
                  <button
                    v-if="!user.approved"
                    @click.stop="approve(game.id, user.userId)"
                    :disabled="approvedExists(game.applicants)"
                    class="px-4 py-2 text-xs rounded-lg text-white font-semibold"
                    :class="
                      approvedExists(game.applicants)
                        ? 'bg-gray-300'
                        : 'bg-orange-500 hover:bg-orange-600'
                    "
                  >
                    승인
                  </button>
                  <button
                    v-else
                    @click.stop="cancelApproval(game.id, user.userId)"
                    class="px-4 py-2 text-xs rounded-lg bg-red-100 text-red-600 font-semibold hover:bg-red-200"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>

            <!-- 게임 시작/참여 버튼 -->
            <div class="border-t border-gray-300 pt-3">
              <button
                v-if="game.status === 'IN_PROGRESS'"
                class="w-full bg-orange-500 text-white font-bold rounded-xl py-3 shadow hover:bg-orange-400 transition active:scale-95"
                @click.stop="joinGame(game.id)"
              >
                <i class="fas fa-sign-in-alt mr-2"></i>경기 참여
              </button>

              <button
                v-else-if="game.isOwner && canStart(game)"
                class="w-full bg-[#56b97b] text-white font-bold rounded-xl py-3 shadow transition active:scale-95"
                @click.stop="openStartModal(game)"
              >
                <i class="fas fa-play mr-2"></i>경기 시작
              </button>

              <button
                v-else-if="game.isOwner && !game.opponentNickname"
                class="w-full bg-orange-500 text-white font-bold rounded-xl py-3 shadow transition active:scale-95"
                @click.stop="shareGame(game.id)"
              >
                <i class="fas fa-share mr-2"></i>경기 공유하기
              </button>

              <div v-else class="text-center text-gray-400 text-sm py-3">경기 시작 대기 중</div>
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

  <CustomToast />
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
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
// const route = useRoute()

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
  }
})

function formatDate(dateStr) {
  if (!dateStr) return '미정'
  const date = new Date(dateStr)
  return date.toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })
}

function getStatusClass(game) {
  if (game.type === 'sent') {
    if (game.status === 'APPROVED') return 'text-blue-600'
    if (game.status === 'REQUESTED') return 'text-gray-500'
    if (game.status === 'REJECTED') return 'text-red-500'
  } else if (game.type === 'my-game') {
    if (game.status === 'IN_PROGRESS') return 'text-green-500'
    if (game.status === 'SCHEDULED') return 'text-orange-500'
    if (game.status === 'MATCHING') return 'text-orange-400'
    if (game.status === 'COMPLETED') return 'text-gray-400'
    if (game.status === 'CANCELED') return 'text-red-400'
  }
  return 'text-gray-500'
}

function getStatusText(game) {
  if (game.type === 'sent') {
    if (game.status === 'APPROVED') return '승인됨 - 시작 대기 중'
    if (game.status === 'REQUESTED') return '대기 중'
    if (game.status === 'REJECTED') return '거절됨'
  } else if (game.type === 'my-game') {
    if (game.status === 'MATCHING') return '매칭 중'
    if (game.status === 'SCHEDULED') return '진행 예정'
    if (game.status === 'IN_PROGRESS') return '진행 중'
    if (game.status === 'COMPLETED') return '완료됨'
    if (game.status === 'CANCELED') return '취소됨'
  }
  return '알 수 없음'
}

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

async function cancelRequest(gameId) {
  await client.post('/api/games/cancel-request', { gameId })
  sentGames.value = sentGames.value.filter((g) => g.id !== gameId)
  showToast('신청을 취소했습니다.')
}

function goDM(userId) {
  router.push('/chat/' + userId)
}

// 내 게임 관련 함수들
const joinGame = (id) => router.push(`/games/${id}/play`)
const canStart = (g) => g.status === 'SCHEDULED' && !!g.opponentNickname

async function shareGame(gameId) {
  showToast('공유 링크가 복사되었습니다!')
  const res = await client.post('/api/invite', null, { params: { gameId } })
  const url = res.data.url

  if (
    window.webkit &&
    window.webkit.messageHandlers &&
    window.webkit.messageHandlers.clipboardCopy
  ) {
    window.webkit.messageHandlers.clipboardCopy.postMessage(url)
    return
  }

  try {
    await navigator.clipboard.writeText(url)
    return
  } catch (err) {
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

// 타입 텍스트 색상
function getTypeTextClass(game) {
  if (game.type === 'sent') {
    return 'text-blue-600'
  } else if (game.type === 'my-game') {
    if (game.isOwner && canStart(game)) {
      return 'text-green-600'
    }
    return 'text-orange-600'
  }
  return 'text-gray-600'
}

// 타입 라벨
function getTypeLabel(game) {
  if (game.type === 'sent') return '신청한 게임'
  if (game.type === 'my-game') {
    if (game.isOwner && canStart(game)) return '시작 가능'
    return '내 게임'
  }
  return '게임'
}
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
</style>

<style>
.pac-container {
  z-index: 100010 !important;
}
</style>
