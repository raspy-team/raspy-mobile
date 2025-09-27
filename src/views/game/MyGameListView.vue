<template>
  <HeaderComp />
  <div ref="container" class="h-full pt-24 pb-28 px-5 max-w-md mx-auto space-y-0">
    <template v-if="!isLoading && games.length > 0">
      <div class="space-y-6 pb-[15dvh]">
        <div
          v-for="game in [...games].reverse()"
          :key="game.id"
          :ref="setGameRef"
          :id="`game-${game.id}`"
          @click="openRuleModal(game.rule)"
          class="mb-8 w-full rounded-2xl border border-orange-100 shadow-xl bg-white/95 hover:shadow-2xl transition-shadow"
        >
          <div class="flex justify-between items-center">
            <div class="flex-[2] p-5 pb-0 flex flex-col w-full justify-between">
              <div class="flex justify-between items-center">
                <div class="min-w-0 flex items-center gap-2">
                  <div>
                    <div>
                      <img
                        class="w-10"
                        :src="`/category-picture/${game.rule.minorCategory || '미분류'}.png`"
                        alt="카테고리 이미지"
                      />
                    </div>
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
            </div>

            <div class="flex flex-1 justify-end items-center text-base font-bold mb-2">
              <div
                :class="[
                  'flex flex-col  items-end justify-center pr-6 pt-3',
                  statusColor(game.status),
                ]"
              >
                <div>
                  <i
                    :class="statusIcon(game.status)"
                    class="mr-2"
                    v-if="game.status !== 'IN_PROGRESS'"
                  ></i>
                  <i :class="statusIcon(game.status)" class="mr-2 animate-spin-slow" v-else></i>
                  <span>{{ translateStatus(game.status) }}</span>
                </div>

                <span
                  v-if="game.status === 'IN_PROGRESS' && game.startedAt"
                  class="ml-3 text-orange-500 font-black animate-pulse text-sm"
                >
                  {{ elapsedTimes[game.id] }}
                </span>
              </div>
            </div>
          </div>
          <!-- VS AREA -->
          <div class="flex justify-between items-center px-7 pb-4">
            <div @click="router.push('/profile/0')" class="flex-1 flex flex-col items-center gap-1">
              <div class="h-8 flex items-end">
                <champion-badge v-if="game.myId == game.championId" />
              </div>
              <div class="relative">
                <img
                  :src="game.myProfileUrl"
                  class="w-14 h-14 rounded-full border-2 border-orange-400 shadow-lg bg-white"
                />
                <span
                  class="absolute bottom-0 right-0 bg-orange-400 text-xs text-white font-bold px-1.5 py-0.5 rounded-lg shadow"
                  >나</span
                >
              </div>
              <div class="text-gray-700 font-[600] text-sm">
                {{ game.myNickname }}
              </div>
              <div class="flex gap-2 mt-2 font-bold text-xs text-neutral-700 tracking-wider">
                <div>
                  <span class="block text-gray-400 font-medium">승</span>
                  <span class="text-base text-orange-500">{{ game.myStatistics.wins }}</span>
                </div>
                <div>
                  <span class="block text-gray-400 font-medium">무</span>
                  <span class="text-base text-blue-400">{{ game.myStatistics.draws }}</span>
                </div>
                <div>
                  <span class="block text-gray-400 font-medium">패</span>
                  <span class="text-base text-red-400">{{ game.myStatistics.losses }}</span>
                </div>
              </div>
            </div>
            <div class="vs-area flex flex-col items-center justify-center mx-3">
              <div class="text-lg font-black tracking-tight text-orange-500 mb-1">VS</div>
            </div>
            <div
              @click.stop="router.push('/profile/' + game.opponentId)"
              class="flex-1 flex flex-col flex-start items-center gap-2"
            >
              <template v-if="game.opponentNickname">
                <div class="h-8 flex items-end">
                  <champion-badge v-if="game.opponentId == game.championId" />
                </div>
                <img
                  :src="game.opponentProfileUrl"
                  class="w-14 h-14 rounded-full border-2 border-gray-200 shadow bg-gradient-to-tr from-gray-100 to-blue-100"
                />
                <div class="text-gray-700 font-[600] text-sm">
                  {{ game.opponentNickname }}
                </div>
                <div class="flex gap-2 mt-0 font-bold text-xs text-neutral-700 tracking-wider">
                  <div>
                    <span class="block text-gray-400 font-medium">승</span>
                    <span class="text-base text-orange-500">{{
                      game.opponentStatistics?.wins ?? '-'
                    }}</span>
                  </div>
                  <div>
                    <span class="block text-gray-400 font-medium">무</span>
                    <span class="text-base text-blue-400">{{
                      game.opponentStatistics?.draws ?? '-'
                    }}</span>
                  </div>
                  <div>
                    <span class="block text-gray-400 font-medium">패</span>
                    <span class="text-base text-red-400">{{
                      game.opponentStatistics?.losses ?? '-'
                    }}</span>
                  </div>
                </div>
              </template>
              <template v-else>
                <div
                  class="w-14 h-14 bg-gradient-to-tr from-gray-100 to-gray-200 rounded-full border border-gray-200 flex items-center justify-center"
                >
                  <i class="fas fa-user-clock text-2xl text-gray-400"></i>
                </div>
                <div
                  class="flex gap-1 mt-2 font-semibold text-xs text-gray-400 opacity-70 tracking-wide"
                >
                  <span>-</span><span>-</span><span>-</span>
                </div>
              </template>
            </div>
          </div>

          <!-- 상태 및 액션 -->
          <div class="px-5 pb-5 space-y-2">
            <!-- 장소 & 날짜 -->
            <div
              class="mt-3 flex flex-col justify-start items-start text-sm text-gray-500 gap-1 mb-2"
            >
              <div class="flex items-center gap-2">
                <i class="fas w-3 fa-map-marker-alt text-orange-500"></i>
                <span>{{
                  game.matchLocation == ' ' ||
                  game.matchLocation == null ||
                  game.matchLocation == ''
                    ? '미정'
                    : game.matchLocation
                }}</span>
              </div>
              <div class="flex items-center gap-2">
                <i class="far w-3 fa-calendar text-orange-500"></i>
                <span>{{ formatDate(game.matchDate) }}</span>
              </div>
            </div>
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
    </template>

    <div v-else-if="isLoading" class="py-2 space-y-8">
      <!-- 스켈레톤 카드 2개 반복 -->
      <div
        v-for="n in 2"
        :key="n"
        class="mb-8 rounded-2xl border border-orange-100 shadow-xl bg-white/90 animate-pulse"
      >
        <div class="flex justify-between items-center px-7 pt-1 pb-4">
          <div class="flex-1 flex flex-col items-center gap-1">
            <div class="h-8"></div>
            <div class="relative">
              <div class="w-14 h-14 rounded-full border-2 border-orange-200 bg-gray-100"></div>
              <span class="absolute bottom-0 right-0 bg-orange-200 w-7 h-4 rounded-lg"></span>
            </div>
            <div class="h-4 bg-gray-200 rounded w-16 mt-2"></div>
            <div class="flex gap-2 mt-2">
              <div class="w-6 h-4 bg-gray-100 rounded"></div>
              <div class="w-6 h-4 bg-gray-100 rounded"></div>
              <div class="w-6 h-4 bg-gray-100 rounded"></div>
            </div>
          </div>
          <div class="vs-area flex flex-col items-center justify-center mx-3">
            <div class="h-6 w-10 bg-orange-100 rounded mb-2"></div>
            <div class="h-4 w-7 bg-gray-100 rounded"></div>
          </div>
          <div class="flex-1 flex flex-col items-center gap-2">
            <div class="h-8"></div>
            <div class="relative">
              <div class="w-14 h-14 rounded-full border border-gray-200 bg-gray-100"></div>
            </div>
            <div class="h-4 bg-gray-200 rounded w-16 mt-2"></div>
            <div class="flex gap-2 mt-2">
              <div class="w-6 h-4 bg-gray-100 rounded"></div>
              <div class="w-6 h-4 bg-gray-100 rounded"></div>
              <div class="w-6 h-4 bg-gray-100 rounded"></div>
            </div>
          </div>
        </div>
        <div class="px-5 pb-5">
          <div class="h-7 bg-gray-100 rounded mb-4 w-2/5"></div>
          <div class="h-11 bg-orange-100 rounded-xl mb-2"></div>
          <div class="h-7 bg-gray-100 rounded w-full"></div>
        </div>
      </div>
    </div>

    <template v-else>
      <div class="text-center text-gray-400 py-10 font-light text-md">
        진행 예정인 게임이 없습니다.
      </div>
    </template>

    <!-- RULE 상세 모달 (컴포넌트화, 반드시 따로 만들어서 import) -->
    <MatchRuleModal v-if="showRuleModal" :rule="selectedRule" @close="showRuleModal = false" />
  </div>
  <FooterNav tab="my-game" />

  <!-- (아래: 장소/진행/공유/시작전확인/Toast 등 모달은 모두 기존과 동일) -->

  <!-- 장소/진행 모달 -->
  <div
    v-if="showAddressModal"
    class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
  >
    <div class="bg-white p-6 m-5 rounded-2xl w-full max-w-md shadow-lg">
      <h2 class="text-lg font-semibold mb-4">경기 장소 설정</h2>
      <div @click="openAddressSearch" class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">도로명 주소</label>
        <div
          class="flex items-center p-3 bg-white rounded-xl border border-gray-200 cursor-pointer"
        >
          <input
            v-model="placeRoad"
            readonly
            class="text-sm flex-1 bg-white border-none outline-none cursor-not-allowed"
            placeholder="도로명 주소 선택"
          />
        </div>
        <p class="text-xs text-gray-400 mt-1">도로명 주소를 입력하세요 (미입력 시 협의결정)</p>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">상세주소</label>
        <div
          :class="[
            placeRoad ? 'bg-white border-gray-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed',
          ]"
          class="rounded-xl border p-3"
        >
          <input
            v-model="placeDetail"
            :disabled="!placeRoad"
            class="w-full text-sm text-gray-700 outline-none bg-transparent"
            placeholder="상세주소 입력"
          />
        </div>
        <p class="text-xs text-gray-500 mt-1">예: ○○빌딩 3층, ○○체육관</p>
      </div>
      <div class="mt-4 text-xs text-gray-500">
        <template v-if="!placeRoad || placeRoad.trim() === ''">
          도로명 주소를 반드시 입력해야 게임을 시작할 수 있습니다.
        </template>
        <template v-else>
          현재 장소: {{ placeRoad + ' ' + placeDetail }}<br />
          이 장소가 맞는지 확인하거나, 수정해주세요.
        </template>
      </div>
      <div class="flex justify-end mt-6 space-x-2">
        <button
          @click="closeModal"
          class="px-4 py-2 rounded-[5px] bg-gray-100 text-gray-700 text-sm"
        >
          취소
        </button>
        <button
          :disabled="!placeRoad || placeRoad.trim() === ''"
          class="px-5 py-2 rounded-[5px] bg-green-600 text-white text-sm disabled:opacity-50"
          @click="submitAndStartGame"
        >
          경기 진행
        </button>
      </div>
    </div>
  </div>

  <!-- 시작 전 확인 모달 -->
  <div
    v-if="showCountdownModal"
    class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
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
  <CustomToast />
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import client from '../../api/api'
import HeaderComp from '../../components/HeaderComp.vue'
import FooterNav from '../../components/FooterNav.vue'
import ChampionBadge from '../../components/ChampionBadge.vue'
import MatchRuleModal from '../../components/MatchModal.vue' // 반드시 이 컴포넌트 필요!
import CustomToast from '../../components/CustomToast.vue'
import { useToast } from '../../composable/useToast'
const { showToast } = useToast()

const router = useRouter()
const route = useRoute()
const games = ref([])
const elapsedTimes = ref({})
const showAddressModal = ref(false)
const placeRoad = ref('')
const placeDetail = ref('')
const currentGameId = ref(null)
const showCountdownModal = ref(false)
const countdownDurationText = ref('')
const gameRefs = ref({})
let interval
const isLoading = ref(true)
const showEmpty = ref(false)

// RULE 상세 모달 상태
const showRuleModal = ref(false)
const selectedRule = ref(null)
function openRuleModal(rule) {
  selectedRule.value = rule
  showRuleModal.value = true
}

function setGameRef(el) {
  if (el && el.id?.startsWith('game-')) {
    const num = Number(el.id.replace('game-', ''))
    gameRefs.value[num] = el
  }
}

function updateElapsed() {
  games.value.forEach((game) => {
    if (game.status === 'IN_PROGRESS' && game.startedAt) {
      const now = new Date()
      const start = new Date(game.startedAt)
      let diff = Math.max(0, now - start)
      const h = Math.floor(diff / 3600000)
      diff %= 3600000
      const m = Math.floor(diff / 60000)
      diff %= 60000
      const s = Math.floor(diff / 1000)
      elapsedTimes.value[game.id] =
        h > 0 ? `${h}시간 ${m}분 ${s}초` : m > 0 ? `${m}분 ${s}초` : `${s}초`
    }
  })
}

const formatDate = (dateStr) => {
  if (!dateStr) return '미정'
  const date = new Date(dateStr)
  return date.toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })
}

function scrollToParamId() {
  const pid = Number(route.query.id)
  if (!isNaN(pid) && gameRefs.value[pid]) {
    const el = gameRefs.value[pid]
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setTimeout(() => {
      el.classList.add('highlight-orange')
    }, 100) // 1초 후 강조
  }
}

onMounted(async () => {
  isLoading.value = true
  showEmpty.value = false

  // 최소 1.5초 대기 Promise
  const minDelay = new Promise((resolve) => setTimeout(resolve, 1500))

  // 데이터 불러오기
  let res
  try {
    res = await client.get('/api/games/my-games')
    games.value = res.data
    updateElapsed()
    interval = setInterval(updateElapsed, 1000)
  } catch (e) {
    games.value = []
  }

  // 최소 1.5초 보장
  await minDelay

  // 데이터 도착 후 isLoading 해제
  isLoading.value = false

  // 최대 3초까지 Empty는 안 띄움
  if (!games.value.length) {
    const remain = 3000 - 2200 // 남은 시간 계산
    setTimeout(() => {
      if (!games.value.length) showEmpty.value = true
    }, remain)
  }

  nextTick(() => scrollToParamId())
})

onUnmounted(() => clearInterval(interval))

// 주소 검색
const openAddressSearch = () => {
  new window.daum.Postcode({
    oncomplete(data) {
      placeRoad.value = data.roadAddress || data.jibunAddress
      nextTick(() => {
        const el = document.getElementById('place-detail')
        if (el) el.focus()
      })
    },
  }).open()
}

const openStartModal = (game) => {
  showAddressModal.value = true
  placeRoad.value = game.matchLocation || ''
  placeDetail.value = ''
  currentGameId.value = game.id
}

const submitAndStartGame = async () => {
  if (!placeRoad.value.trim()) return alert('도로명 주소를 반드시 입력해야 합니다.')
  await client.post(`/api/games/${currentGameId.value}/set-region`, {
    roadAddress: placeRoad.value,
    detailAddress: placeDetail.value,
  })

  showAddressModal.value = false
  // 시작 전 확인용 모달 열기
  const game = games.value.find((g) => g.id === currentGameId.value)
  const dur = game?.rule?.duration

  if (dur === -1) {
    countdownDurationText.value = '제한 없음'
  } else {
    const min = Math.floor(dur / 60)
    const sec = dur % 60
    countdownDurationText.value = (min ? `${min}분 ` : '') + (sec ? `${sec}초` : '')
  }
  showAddressModal.value = false
  showCountdownModal.value = true
}

const confirmStartGame = async () => {
  await client.post(`/api/games/${currentGameId.value}/start`)
  router.push(`/games/${currentGameId.value}/play`)
  showCountdownModal.value = false
}

const closeModal = () => {
  showAddressModal.value = false
  placeRoad.value = ''
  placeDetail.value = ''
  currentGameId.value = null
}

const joinGame = (id) => router.push(`/games/${id}/play`)
const canStart = (g) => g.status === 'SCHEDULED' && !!g.opponentNickname

async function shareGame(gameId) {
  showToast('공유 링크가 복사되었습니다!')

  const res = await client.post('/api/invite', null, { params: { gameId } })
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

function translateStatus(s) {
  return (
    {
      MATCHING: '매칭 중',
      SCHEDULED: '진행 예정',
      IN_PROGRESS: '진행 중',
      COMPLETED: '완료됨',
      CANCELED: '취소됨',
    }[s] || s
  )
}
function statusIcon(s) {
  return {
    MATCHING: 'fas fa-search',
    SCHEDULED: 'fas fa-calendar-alt',
    IN_PROGRESS: 'fas fa-play-circle',
    COMPLETED: 'fas fa-flag-checkered',
    CANCELED: 'fas fa-times-circle',
  }[s]
}
function statusColor(s) {
  return {
    MATCHING: 'text-orange-400',
    SCHEDULED: 'text-orange-500',
    IN_PROGRESS: 'text-green-500',
    COMPLETED: 'text-gray-400',
    CANCELED: 'text-red-400',
  }[s]
}
</script>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css');
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
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
.game-card {
  margin-bottom: 24px;
  box-shadow:
    0 7px 22px 0 rgba(251, 146, 60, 0.08),
    0 0px 0px #fff;
  border-radius: 22px;
  border: 1.3px solid #f2ece6;
  transition:
    box-shadow 0.18s,
    border-color 0.2s;
  background: #fff;
}
.rule-box {
  background: #f6f6f7;
  border-radius: 14px;
  margin: 0 10px 0 10px;
  border: 1px solid #f1f1f1;
  box-shadow: 0 2px 6px 0 rgba(251, 146, 60, 0.018);
  padding: 17px 14px 13px 14px;
}
.stat-label {
  color: #b3b3b3;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.01em;
  margin-right: 0px;
}
.stat-num {
  font-size: 1.17rem;
  font-weight: 900;
  margin: 0 6px 0 2px;
  color: #222;
  letter-spacing: -0.01em;
}
.vs-area {
  min-width: 66px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.action-btn {
  background: #fb923c;
  color: white;
  padding: 13px 0;
  border-radius: 8px;
  font-weight: 800;
  text-align: center;
  font-size: 1.02rem;
  transition:
    background 0.18s,
    box-shadow 0.18s;
  border: none;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(251, 146, 60, 0.08);
}
.action-btn:hover {
  background: #ea7c23;
  box-shadow: 0 6px 12px rgba(251, 146, 60, 0.14);
}
.delete-btn {
  background: #fff;
  border: 2px solid #ef4444;
  color: #ef4444;
  padding: 13px 0;
  border-radius: 8px;
  font-weight: 800;
  text-align: center;
  font-size: 1.02rem;
  transition:
    background 0.18s,
    color 0.18s,
    border-color 0.18s,
    box-shadow 0.15s;
  cursor: pointer;
  margin-top: 2px;
}
.delete-btn:hover {
  background: #fff0f0;
  color: #b91c1c;
  border-color: #b91c1c;
  box-shadow: 0 4px 9px rgba(251, 146, 60, 0.1);
}
.icon-btn {
  padding: 8px;
  background: #f4f4f4;
  border-radius: 8px;
  font-size: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fb923c;
  transition: background 0.15s;
  border: none;
}
.icon-btn:hover {
  background: #ffe2c2;
}
.animate-spin-slow {
  animation: spin 1.4s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@media (max-width: 420px) {
  .game-card {
    margin-bottom: 14px;
  }
  .action-btn,
  .delete-btn {
    font-size: 0.98rem;
    padding: 10px 0;
  }
  .rule-box .rule-row {
    width: 100% !important;
  }
  .rule-box {
    padding: 13px 7px 9px 7px;
  }
  .stat-label,
  .stat-num {
    font-size: 11.4px;
  }
}
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
