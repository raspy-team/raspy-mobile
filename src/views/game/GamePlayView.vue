<template>
  <div
    v-if="game && user1 && user2"
    class="w-dvw flex flex-col px-4 py-3 relative text-black overflow-hidden"
  >
    <div class="absolute inset-0 bg-white -z-10"></div>

    <div class="flex items-center justify-between mb-4">
      <button @click="goBack" class="text-white text-lg">
        <svg
          width="8"
          height="12"
          viewBox="0 0 8 12"
          fill="black"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M7.08934 0.410704C7.41477 0.736141 7.41477 1.26378 7.08934 1.58922L2.67859 5.99996L7.08934 10.4107C7.41477 10.7361 7.41477 11.2638 7.08934 11.5892C6.7639 11.9147 6.23626 11.9147 5.91083 11.5892L0.910826 6.58922C0.585389 6.26378 0.585389 5.73614 0.910826 5.4107L5.91083 0.410704C6.23626 0.0852667 6.7639 0.0852667 7.08934 0.410704Z"
            fill="black"
          />
        </svg>
      </button>
    </div>

    <div class="text-xs text-gray-700 text-center mb-3">
      경기 시작: {{ formatDate(game.totalGameStartedAt) }} | 현재 세트 시작:
      {{ formatDate(game.setStartedAt) }}
    </div>

    <div class="grid grid-cols-3 gap-2 mb-4">
      <div
        class="bg-white border border-orange-500 text-orange-500 px-4 py-3 rounded-xl shadow text-center"
      >
        <div class="text-xs font-semibold mb-1">한세트 승리에 필요한 점수</div>
        <div class="text-md font-extrabold">
          {{ game.rule.pointsToWin == -1 ? '제한 없음' : game.rule.pointsToWin + '점' }}
        </div>
      </div>
      <div
        class="bg-white border border-orange-500 text-orange-500 px-4 py-3 rounded-xl shadow text-center"
      >
        <div class="text-xs font-semibold mb-1">세트 제한 시간</div>
        <div class="text-md font-extrabold">{{ limitTimeStr }}</div>
      </div>
      <div
        class="bg-white border border-orange-500 text-orange-500 px-4 py-3 rounded-xl shadow text-center"
      >
        <div class="text-xs font-semibold mb-1">총 세트</div>
        <div class="text-md font-extrabold">{{ game.rule.setsToWin }}세트</div>
      </div>
    </div>

    <div class="flex justify-end mb-1">
      <button
        class="text-xs text-orange-500 border border-orange-200 rounded-full px-4 py-1 shadow-sm hover:bg-orange-50 transition font-semibold"
        @click="game.showRuleDetail = true"
      >
        규칙 보기
      </button>
    </div>

    <div class="text-center text-orange-600 text-lg font-bold animate-pulse mb-3">
      현재 세트: {{ currentSet }}
    </div>

    <div class="flex items-start justify-between mb-6 relative left-0">
      <div class="flex flex-col items-center animate-fade-in">
        <img
          :src="user1.profileUrl ? user1.profileUrl : DefaultImage"
          class="w-[20dvw] aspect-square object-cover rounded-full border-4 border-orange-500 shadow-lg mb-1"
        />
        <div class="font-bold text-sm">{{ user1.nickname }}</div>
        <div class="text-[10dvw] font-extrabold text-orange-500 mt-1">{{ currentScore1 }}</div>
        <div class="text-base font-bold text-orange-500 mt-1">세트: {{ user1SetsWon }}</div>
        <div class="flex space-x-2 mt-2 px-1">
          <button
            @click="socket_sendScore(1, 1)"
            :disabled="isSetOver || isGameOver"
            class="bg-orange-500 text-white w-[15dvw] py-1.5 rounded-full shadow hover:scale-110 transition text-base font-bold"
          >
            +1
          </button>
          <button
            @click="socket_sendScore(1, -1)"
            :disabled="isSetOver || isGameOver || currentScore1 <= 0"
            class="bg-gray-200 text-gray-800 w-[15dvw] py-1.5 rounded-full shadow hover:scale-110 transition text-base font-bold"
          >
            -1
          </button>
        </div>
      </div>
      <div>
        <div class="w-[20dvw] text-center text-[5dvw] font-[600] mt-8 text-orange-500">
          {{ elapsedTimeStr }}
        </div>
      </div>
      <div class="flex flex-col items-center animate-fade-in">
        <img
          :src="user2.profileUrl ? user2.profileUrl : DefaultImage"
          class="w-[20dvw] rounded-full border-4 border-orange-500 shadow-lg mb-1"
        />
        <div class="font-bold text-sm">{{ user2.nickname }}</div>
        <div class="text-[10dvw] font-extrabold text-orange-500 mt-1">{{ currentScore2 }}</div>
        <div class="text-base font-bold text-orange-500 mt-1">세트: {{ user2SetsWon }}</div>
        <div class="flex space-x-2 mt-2 px-1">
          <button
            @click="socket_sendScore(2, 1)"
            :disabled="isSetOver || isGameOver"
            class="bg-orange-500 text-white w-[15dvw] py-1.5 rounded-full shadow hover:scale-110 transition text-base font-bold"
          >
            +1
          </button>
          <button
            @click="socket_sendScore(2, -1)"
            :disabled="isSetOver || isGameOver || currentScore2 <= 0"
            class="bg-gray-200 text-gray-800 w-[15dvw] py-1.5 rounded-full shadow hover:scale-110 transition text-base font-bold"
          >
            -1
          </button>
        </div>
      </div>
    </div>

    <div class="mt-auto relative">
      <div class="relative max-h-28 overflow-hidden flex flex-col justify-end space-y-1 mb-10 px-1">
        <div
          v-for="(log, index) in logs"
          :key="index"
          class="text-xs bg-orange-50 border border-orange-200 rounded-md px-2 py-1 shadow-sm flex items-center justify-between text-gray-700"
        >
          <div class="flex-1 truncate">
            <span class="text-[11px] text-gray-500 mr-1">[{{ log.elapsed }}]</span>
            {{ log.message }}
          </div>
        </div>
        <div
          v-if="logs.length > 5"
          class="absolute top-0 left-0 w-full h-10 bg-gradient-to-b from-white/80 to-transparent flex justify-center items-start z-10"
        >
          <button
            @click="showLogModal = true"
            class="text-orange-500 text-[12px] font-[600] border border-orange-500 bg-white rounded-full shadow px-8 py-[7px] flex items-center space-x-1 hover:brightness-110 transition mt-1"
          >
            <span>모두 보기</span>
          </button>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3 mb-4">
        <button
          @click="openConfirm('정말로 게임을 재시작 하겠습니까?', socket_resetGame)"
          class="border border-orange-500 text-orange-500 px-3 py-3 rounded-[8.2px] text-xs hover:bg-orange-50 transition"
        >
          초기화
        </button>
        <button
          @click="openConfirm('정말로 게임을 즉시 종료합니까?', socket_finishGame)"
          class="bg-orange-500 text-white px-3 py-3 rounded-[8.2px] text-xs shadow hover:brightness-110 transition"
        >
          게임 종료
        </button>
      </div>
    </div>

    <div
      v-if="isSetOver && !isGameOver"
      class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50"
    >
      <button
        @click="socket_nextSet"
        class="bg-orange-500 text-white w-[70dvw] py-4 rounded-full text-lg font-bold shadow animate-blink transition hover:scale-110"
      >
        다음 세트
      </button>
    </div>

    <div
      v-if="showFinishModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-xl p-6 text-center shadow-lg w-[90%] max-w-md">
        <div class="text-lg font-bold mb-3">세트 종료</div>
        <div class="text-orange-500 font-extrabold text-xl mb-4">
          {{ winner != '-' ? '@' + winner + ' 승리' : '무승부' }}
        </div>
        <button
          @click="closeFinishModal"
          class="bg-orange-500 w-full text-white px-4 py-2 rounded-full text-sm shadow hover:brightness-110 transition"
        >
          확인
        </button>
      </div>
    </div>

    <div
      v-if="isGameOver"
      class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
    >
      <div
        class="bg-orange-500 text-white rounded-xl p-8 text-center shadow-2xl animate-fade-in w-[90%] max-w-md"
      >
        <div class="text-xl font-bold mb-4">🎉 경기 종료 🎉</div>
        <div class="text-2xl font-extrabold mb-5">
          {{ gameWinner == '무승부' ? '무승부' : gameWinner + ' 최종 승리!' }}
        </div>
        <button
          @click="goToResult"
          class="bg-white text-orange-500 w-full py-2 rounded-full text-base font-bold shadow hover:scale-105 transition"
        >
          결과 보기
        </button>
      </div>
    </div>

    <!-- MatchModal: 규칙 모달 -->
    <MatchModal v-if="game.showRuleDetail" :rule="game.rule" @close="game.showRuleDetail = false" />

    <!-- 커스텀 confirm 모달 -->
    <div
      v-if="showConfirm"
      class="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center"
    >
      <div class="bg-white w-full max-w-xs rounded-xl shadow-lg p-7 text-center">
        <div class="mb-5 text-lg font-bold text-gray-800">{{ confirmMessage }}</div>
        <div class="flex justify-center gap-3 mt-4">
          <button
            @click="closeConfirm"
            class="px-5 py-2 bg-gray-100 text-gray-600 rounded-full font-semibold text-sm"
          >
            취소
          </button>
          <button
            @click="confirmCallbackWrapper"
            class="px-6 py-2 bg-orange-500 text-white rounded-full font-semibold text-sm shadow hover:bg-orange-400"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  </div>

  <div
    v-if="showLogModal"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
  >
    <div class="bg-white rounded-xl p-4 shadow-lg w-[90%] max-w-md max-h-[70vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-3">
        <div class="text-lg font-bold">전체 로그</div>
        <button @click="showLogModal = false" class="text-orange-500 text-sm">닫기</button>
      </div>
      <div class="flex flex-col space-y-1">
        <div
          v-for="(log, index) in logs"
          :key="index"
          class="text-xs bg-orange-50 border border-orange-200 rounded-md px-2 py-1 shadow-sm flex items-center justify-between text-gray-700"
        >
          <div class="flex-1 truncate">
            <span class="text-[11px] text-gray-500 mr-1">[{{ log.elapsed }}]</span>
            {{ log.message }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../api/api'
import { socket } from '../../websocket'
import DefaultImage from '../../assets/default.png'
import MatchModal from '../../components/MatchModal.vue'

const route = useRoute()
const router = useRouter()
const gameId = route.params.gameId
const game = reactive({})
const chatRoomId = ref(null)
const currentSet = ref(1)
const currentScore1 = ref(0)
const currentScore2 = ref(0)
const user1SetsWon = ref(0)
const user2SetsWon = ref(0)
const isSetOver = ref(false)
const isGameOver = ref(false)
const showFinishModal = ref(false)
const winner = ref('-')
const elapsedSeconds = ref(0)
const elapsedTimeStr = ref('0분 0초')
const limitTimeStr = ref('')
const timerRef = ref(null)
const logs = ref([])
const user1 = ref(null)
const user2 = ref(null)
const gameWinner = ref('')
const showLogModal = ref(false)

// confirm 관련 상태
const showConfirm = ref(false)
const confirmMessage = ref('')
let confirmCallback = null
const confirmCallbackWrapper = () => {
  showConfirm.value = false
  if (typeof confirmCallback === 'function') confirmCallback()
}
const openConfirm = (msg, cb) => {
  confirmMessage.value = msg
  showConfirm.value = true
  confirmCallback = cb
}
const closeConfirm = () => {
  showConfirm.value = false
  confirmCallback = null
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function startSet() {
  currentScore1.value = 0
  currentScore2.value = 0
  isSetOver.value = false
  showFinishModal.value = false
  winner.value = '-'
  updateElapsed()
  startTimer()
}

function addScore(userIdx, delta) {
  if (isSetOver.value || isGameOver.value) return

  if (userIdx == user1.value.id) {
    currentScore1.value = Math.max(0, currentScore1.value + delta)
  } else {
    currentScore2.value = Math.max(0, currentScore2.value + delta)
  }

  checkSetOver()
}

function checkSetOver() {
  if (game.rule.pointsToWin != -1 && currentScore1.value >= game.rule.pointsToWin) {
    user1SetsWon.value++
    finishSet(1)
    return
  }
  if (game.rule.pointsToWin != -1 && currentScore2.value >= game.rule.pointsToWin) {
    user2SetsWon.value++
    finishSet(2)
    return
  }
  if (game.limitSeconds !== -1 && elapsedSeconds.value >= game.limitSeconds) {
    if (game.rule.winBy == 'MOST_SETS_AND_POINTS' && currentScore1.value > currentScore2.value) {
      user1SetsWon.value++
      finishSet(1)
    } else if (
      game.rule.winBy == 'MOST_SETS_AND_POINTS' &&
      currentScore2.value > currentScore1.value
    ) {
      user2SetsWon.value++
      finishSet(2)
    } else {
      finishSet(0) // 무승부
    }
    return
  }
  elapsedSeconds.value = 0
}

function finishSet(who) {
  isSetOver.value = true
  clearInterval(timerRef.value)
  if (who === 1) {
    winner.value = user1.value.nickname
  } else if (who === 2) {
    winner.value = user2.value.nickname
  }
  showFinishModal.value = true
  const setsToWin = game.rule.setsToWin
  const requiredWins = Math.ceil(setsToWin / 2)
  if (user1SetsWon.value >= requiredWins || user2SetsWon.value >= requiredWins) {
    isGameOver.value = true
    isSetOver.value = false
    socket_finishGame()
  } else {
    currentSet.value++
  }
}

function closeFinishModal() {
  showFinishModal.value = false
}

function startTimer() {
  if (isGameOver.value) return
  clearInterval(timerRef.value)
  updateElapsed()
  timerRef.value = setInterval(updateElapsed, 1000)
}

function updateElapsed() {
  if (!game.setStartedAt || isSetOver.value) return
  const startedAt = new Date(game.setStartedAt)
  const now = new Date()
  const elapsed = Math.floor((now - startedAt) / 1000)
  elapsedSeconds.value = game.limitSeconds === -1 ? elapsed : Math.min(elapsed, game.limitSeconds)
  elapsedTimeStr.value = getTimeStr(elapsedSeconds.value)
  if (game.limitSeconds !== -1) {
    limitTimeStr.value = getTimeStr(game.limitSeconds)
  } else {
    limitTimeStr.value = '제한 없음'
  }
  if (!isSetOver.value && !isGameOver.value) {
    checkSetOver()
  }
}

function getTimeStr(seconds) {
  if (seconds <= 0) return '0분 0초'
  const min = Math.floor(seconds / 60)
  const sec = seconds % 60
  return `${min}분 ${sec}초`
}

function goToResult() {
  router.push(`/games/${gameId}/result`)
}

function goBack() {
  router.back()
}

function handleVisibilityChange() {
  if (document.visibilityState === 'visible') {
    updateElapsed()
    if (!isSetOver.value && !isGameOver.value) {
      startTimer()
    }
  }
}

const addLog = (log) => {
  const start = new Date(game.totalGameStartedAt)
  const current = new Date(log.time)
  const diffSec = Math.floor((current - start) / 1000)
  const minutes = String(Math.floor(diffSec / 60)).padStart(2, '0')
  const seconds = String(diffSec % 60).padStart(2, '0')
  const elapsed = `${minutes}:${seconds}`

  let message = ''
  if (log.type === 'SCORE') {
    message = `@${log.targetId == user1.value.id ? user1.value.nickname : user2.value.nickname} ${log.delta}점 ${log.delta > 0 ? '득점' : '실점'} (변경자 - @${log.userSummary.nickname})`
  } else if (log.type === 'SET') {
    message = `@${log.userSummary.nickname} 세트를 증가시킴`
  } else if (log.type === 'RESET') {
    message = `@${log.userSummary.nickname} 게임을 리셋함`
  } else if (log.type === 'FINISH') {
    message = `게임이 종료되었습니다!`
  } else {
    message = '알 수 없는 이벤트'
  }

  logs.value.push({
    elapsed,
    message,
    type: log.type,
    user: log.userSummary,
  })
}

onMounted(async () => {
  const userRes = await api.get('/api/auth/current-user-id')
  const currentUserId = userRes.data

  const res = await api.get(`/api/games/${gameId}/detail`)
  if (res.data.gameStatus != 'IN_PROGRESS') {
    router.push(`/games/${gameId}/result`)
  }

  // reactive에 직접 대입 (전체 덮어쓰기)
  Object.assign(game, res.data)
  game.showRuleDetail = false

  chatRoomId.value = res.data.chatRoomId

  const g = res.data
  const isLeftUser1 = g.user1.id == currentUserId
  user1.value = isLeftUser1 ? g.user1 : g.user2
  user2.value = isLeftUser1 ? g.user2 : g.user1

  currentScore1.value = isLeftUser1 ? g.score1 : g.score2
  currentScore2.value = isLeftUser1 ? g.score2 : g.score1

  user1SetsWon.value = isLeftUser1 ? g.set1 : g.set2
  user2SetsWon.value = isLeftUser1 ? g.set2 : g.set1
  currentSet.value = g.currentSet || 0

  if (game.rule.pointsToWin != -1 && currentScore1.value >= game.rule.pointsToWin) {
    isSetOver.value = true
    isGameOver.value = false
    user1SetsWon.value += 1
    currentSet.value += 1
  } else if (game.rule.pointsToWin != -1 && currentScore2.value >= game.rule.pointsToWin) {
    isSetOver.value = true
    isGameOver.value = false
    user2SetsWon.value += 1
    currentSet.value += 1
  } else if (game.limitSeconds !== -1 && elapsedSeconds.value >= game.limitSeconds) {
    isSetOver.value = true
    isGameOver.value = false
    if (game.rule.winBy == 'MOST_SETS_AND_POINTS') {
      if (currentScore1.value > currentScore2.value) {
        user1SetsWon.value += 1
        currentSet.value += 1
      } else if (currentScore2.value > currentScore1.value) {
        user2SetsWon.value += 1
        currentSet.value += 1
      }
    }
  } else {
    isSetOver.value = false
    isGameOver.value = false
    updateElapsed()
    startTimer()
  }

  const logResponse = await api.get(`/api/games/${gameId}/game-logs`)
  const rawLogs = logResponse.data
  rawLogs.forEach((log) => addLog(log))

  socket.onMessage((payload) => {
    if (payload.type === 'SCORE') {
      addScore(payload.targetId, payload.delta)
      addLog(payload)
    } else if (payload.type === 'SET') {
      game.setStartedAt = new Date()
      startSet()
      addLog(payload)
    } else if (payload.type === 'FINISH') {
      isGameOver.value = true
      addLog(payload)
      const setsToWin = game.rule.setsToWin
      const requiredWins = Math.ceil(setsToWin / 2)
      if (user1SetsWon.value < requiredWins && user2SetsWon.value < requiredWins) {
        if (game.rule.winBy == 'MOST_SETS_AND_POINTS') {
          if (currentScore1.value > currentScore2.value) user1SetsWon.value++
          else if (currentScore2.value > currentScore1.value) user2SetsWon.value++
        }
      }
      if (user1SetsWon.value > user2SetsWon.value) {
        gameWinner.value = '@' + user1.value.nickname
      } else if (user2SetsWon.value > user1SetsWon.value) {
        gameWinner.value = '@' + user2.value.nickname
      } else {
        gameWinner.value = '무승부'
      }
    } else if (payload.type === 'RESET') {
      router.replace({
        path: route.fullPath,
        query: { ...route.query, reload: Date.now() },
      })
      addLog(payload)
    }
  })
  socket.connect(chatRoomId.value)

  document.addEventListener('visibilitychange', handleVisibilityChange)
})

const socket_sendScore = (userIndex, scoreDelta) => {
  socket.sendGameEvent(chatRoomId.value, {
    type: 'SCORE',
    userId: userIndex === 1 ? user1.value.id : user2.value.id,
    setIndex: currentSet.value,
    scoreDelta: scoreDelta,
  })
}

const socket_nextSet = () => {
  socket.sendGameEvent(chatRoomId.value, {
    type: 'SET',
    setIndex: currentSet.value,
    userId: 0,
    scoreDelta: 0,
  })
}

const socket_finishGame = () => {
  socket.sendGameEvent(chatRoomId.value, {
    type: 'FINISH',
  })
}

const socket_resetGame = () => {
  socket.sendGameEvent(chatRoomId.value, {
    type: 'RESET',
  })
}

onUnmounted(() => {
  clearInterval(timerRef.value)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<style scoped>
@keyframes fade-in {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes blink {
  0%,
  50%,
  100% {
    opacity: 1;
  }
  25%,
  75% {
    opacity: 0.3;
  }
}
@keyframes vs-jump-blink {
  0% {
    transform: translateY(0);
    opacity: 1;
  }
  25% {
    transform: translateY(3px);
    opacity: 0.7;
  }
  50% {
    transform: translateY(-6px);
    opacity: 1;
  }
  75% {
    transform: translateY(3px);
    opacity: 0.7;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}
.vs-jump-blink {
  animation: vs-jump-blink 1.5s ease-in-out infinite;
}
.animate-fade-in {
  animation: fade-in 0.6s ease forwards;
}
.animate-blink {
  animation: blink 2.5s infinite;
}
</style>
