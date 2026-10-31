<template>
  <div v-if="game && user1 && user2" class="h-dvh flex flex-col bg-canvas text-fg overflow-hidden pt-safe pb-safe">
    <!-- 위: 뒤로 · 규칙 이름 · 규칙/로그 -->
    <header class="flex items-center gap-1 px-2 h-14 flex-shrink-0">
      <UiIconButton icon="fas fa-chevron-left" label="뒤로" @click="goBack" />
      <h1 class="flex-1 min-w-0 truncate t-body font-bold">{{ game.rule?.ruleTitle }}</h1>
      <UiIconButton icon="fas fa-book-open" label="규칙 보기" @click="game.showRuleDetail = true" />
      <UiIconButton icon="fas fa-list" label="경기 기록" @click="showLogModal = true" />
    </header>

    <!-- 규칙 요약 한 줄 + 시계 -->
    <section class="flex-shrink-0 text-center px-4">
      <p class="t-caption">
        {{ game.rule?.setsToWin }}세트 중 {{ currentSet }}세트 ·
        {{ game.rule?.pointsToWin == -1 ? '점수 제한 없음' : `${game.rule?.pointsToWin}점 선취` }} ·
        {{ limitTimeStr ? `세트당 ${limitTimeStr}` : '시간 제한 없음' }}
      </p>
      <p class="mt-2 text-4xl font-bold tabular-nums" :class="isOvertime ? 'text-danger-fg' : 'text-fg'">{{ elapsedTimeStr }}</p>
      <p v-if="isOvertime" class="text-sm text-danger-fg mt-1">시간이 지났어요 · 추가 시간</p>
    </section>

    <!-- 점수판: 선수 칸 전체가 +1 버튼 (경기 중에 대충 눌러도 되게 크게) -->
    <section class="flex-1 min-h-0 grid grid-cols-2 gap-3 px-4 py-4">
      <div v-for="side in sides" :key="side.idx" class="flex flex-col min-h-0">
        <button
          type="button"
          class="flex-1 min-h-0 flex flex-col items-center justify-center gap-2 rounded-2xl bg-surface border border-line active:bg-surface-2 transition-colors disabled:opacity-50"
          :disabled="scoreLocked"
          :aria-label="`${side.user.nickname} 1점 올리기`"
          @click="socket_sendScore(side.idx, 1)"
        >
          <UiAvatar :src="side.user.profileUrl" :name="side.user.nickname" size="md" />
          <span class="text-sm text-fg-muted truncate max-w-full px-2">{{ side.user.nickname }}</span>
          <span class="font-bold tabular-nums leading-none text-fg" style="font-size: clamp(4rem, 14vh, 8rem)">{{ side.score }}</span>
          <span class="flex gap-1" :aria-label="`세트 ${side.sets}개 승리`">
            <span v-for="n in setDots" :key="n" class="w-2 h-2 rounded-full" :class="n <= side.sets ? 'bg-primary' : 'bg-line-strong'"></span>
          </span>
        </button>
        <UiButton
          variant="secondary"
          size="sm"
          class="mt-2"
          :disabled="scoreLocked || side.score <= 0"
          :aria-label="`${side.user.nickname} 1점 내리기`"
          @click="socket_sendScore(side.idx, -1)"
        >
          −1
        </UiButton>
      </div>
    </section>

    <!-- 아래: 사진·영상 · 세트 끝내기 / 처음부터 · 경기 끝내기 -->
    <footer class="flex-shrink-0 px-4 pb-4 space-y-2">
      <div class="flex gap-2">
        <UiIconButton icon="fas fa-camera" label="사진 찍기" class="bg-surface" :disabled="isCountingDown" @click="triggerPhotoCapture" />
        <UiIconButton icon="fas fa-video" label="영상 찍기" class="bg-surface" :disabled="isCountingDown" @click="triggerVideoCapture" />
        <UiButton
          v-if="!isSetOver && !isGameOver && !isCountingDown"
          variant="secondary"
          class="flex-1"
          icon="fas fa-flag-checkered"
          @click="manualFinishSet"
        >
          세트 끝내기
        </UiButton>
      </div>
      <div class="flex gap-2">
        <UiButton variant="ghost" class="flex-1" icon="fas fa-rotate-left" @click="openConfirm('처음부터 다시 할까요?', socket_resetGame, '모든 점수와 세트가 지워져요.', '처음부터')">
          처음부터
        </UiButton>
        <UiButton variant="danger" class="flex-1" icon="fas fa-stop" @click="openConfirm('경기를 끝낼까요?', socket_finishGame, '지금 점수로 결과가 기록돼요.', '경기 끝내기')">
          경기 끝내기
        </UiButton>
      </div>
    </footer>

    <!-- 세트 시작 전: 화면 전체에서 시작 버튼 하나만 -->
    <div
      v-if="showStartButton || (isSetOver && !isGameOver) || isCountingDown"
      class="fixed inset-0 z-dialog bg-canvas/90 flex flex-col items-center justify-center px-8 text-center"
    >
      <template v-if="isCountingDown">
        <p class="t-caption">{{ currentSet }}세트 시작까지</p>
        <p class="font-bold text-primary tabular-nums leading-none my-4" style="font-size: 30vw">{{ countdown }}</p>
        <p class="t-caption">준비하세요</p>
      </template>
      <template v-else>
        <p class="t-title">{{ currentSet }}세트</p>
        <p class="t-caption mt-2">{{ currentScore1 || currentScore2 || currentSet > 1 ? `${user1SetsWon} : ${user2SetsWon}` : '두 사람이 준비되면 시작하세요' }}</p>
        <UiButton block size="lg" class="mt-8 max-w-sm" @click="showStartButton ? (startSet(), (showStartButton = false)) : socket_nextSet()">
          {{ currentSet }}세트 시작
        </UiButton>
      </template>
    </div>

    <!-- 연결이 끊겼을 때 -->
    <div v-if="socketStatus === 'connecting'" class="fixed inset-x-0 top-0 z-toast pt-safe">
      <div class="mx-4 mt-2 rounded-xl bg-surface-2 border border-line-strong px-4 py-3 flex items-center gap-3 text-sm">
        <UiSpinner size="sm" class="text-fg-muted" label="다시 연결하는 중" />
        다시 연결하는 중이에요. 점수는 연결되면 맞춰져요
      </div>
    </div>

    <MatchModal v-if="game.showRuleDetail" :rule="game.rule" @close="game.showRuleDetail = false" />
  </div>

  <!-- 숨겨진 카메라·동영상 입력 -->
  <input ref="cameraInputRef" type="file" accept="image/*" capture="environment" class="hidden" @change="onCameraChange" />
  <input ref="videoInputRef" type="file" accept="video/mp4,video/quicktime,video/*" class="hidden" @change="onVideoChange" />

  <!-- 경기 기록 -->
  <UiSheet v-model="showLogModal" title="경기 기록">
    <UiEmptyState v-if="!logs.length" icon="fas fa-list" title="아직 기록이 없어요" />
    <ol v-else class="space-y-1">
      <li v-for="(log, i) in logs" :key="i" class="flex gap-3 py-2 border-b border-line last:border-0 text-sm">
        <span class="t-micro tabular-nums w-12 flex-shrink-0 pt-0.5">{{ log.elapsed }}</span>
        <span class="text-fg">{{ log.message }}</span>
      </li>
    </ol>
  </UiSheet>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../api/api'
import { socket } from '../../websocket'
import MatchModal from '../../components/MatchModal.vue'
import { UiAvatar, UiButton, UiEmptyState, UiIconButton, UiSheet, UiSpinner } from '../../components/ui'
import { confirmDialog } from '../../composables/useConfirm'
import { useToast } from '../../composable/useToast'
import {
  addGamePicture,
  addGameVideo,
  compressImage,
  compressVideo,
} from '../../utils/gamePictureStorage'

const route = useRoute()
const router = useRouter()
const { showToast } = useToast()
const gameId = route.params.gameId

// 소켓 연결 상태
const socketStatus = ref('connected') // 'connected', 'connecting', 'disconnected'

// 카메라 관련 상태
const cameraInputRef = ref(null)
const videoInputRef = ref(null)
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
const elapsedTimeStr = ref('00:00')
const limitTimeStr = ref('')
const timerRef = ref(null)
const logs = ref([])
const user1 = ref(null)
const user2 = ref(null)
const gameWinner = ref('')
const showLogModal = ref(false)
const showStartButton = ref(false)
const countdown = ref(0)
const isCountingDown = ref(false)
const timeOverNotified = ref(false)

// 되돌리기 어려운 행동(처음부터, 경기 끝내기)은 한 번 더 묻는다
async function openConfirm(title, cb, message = '', confirmText = '확인') {
  if (await confirmDialog({ title, message, confirmText, danger: true })) cb()
}

// 점수판 두 칸 (왼쪽 user1, 오른쪽 user2)
const sides = computed(() => [
  { idx: 1, user: user1.value, score: currentScore1.value, sets: user1SetsWon.value },
  { idx: 2, user: user2.value, score: currentScore2.value, sets: user2SetsWon.value },
])
// 세트 승리 표시 점 개수: 과반 세트
const setDots = computed(() => Math.floor((game.rule?.setsToWin || 1) / 2) + 1)
const scoreLocked = computed(() => isSetOver.value || isGameOver.value || isCountingDown.value || showStartButton.value)
const isOvertime = computed(() => game.limitSeconds !== -1 && game.limitSeconds != null && elapsedSeconds.value >= game.limitSeconds)

function startSet() {
  currentScore1.value = 0
  currentScore2.value = 0
  isSetOver.value = false
  showFinishModal.value = false
  winner.value = '-'

  // 5초 카운트다운 시작
  isCountingDown.value = true
  countdown.value = 5

  const countdownInterval = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(countdownInterval)
      isCountingDown.value = false
      // 카운트다운 종료 후 세트 시작
      game.setStartedAt = new Date()
      elapsedSeconds.value = 0
      updateElapsed()
      startTimer()
    }
  }, 1000)
}

function addScore(userIdx, delta) {
  if (isSetOver.value || isGameOver.value || isCountingDown.value) return

  if (userIdx == user1.value.id) {
    // pointsToWin이 설정되어 있으면 그 이상으로 증가 불가
    if (game.rule.pointsToWin !== -1 && delta > 0 && currentScore1.value >= game.rule.pointsToWin) {
      return
    }
    currentScore1.value = Math.max(0, currentScore1.value + delta)
  } else {
    // pointsToWin이 설정되어 있으면 그 이상으로 증가 불가
    if (game.rule.pointsToWin !== -1 && delta > 0 && currentScore2.value >= game.rule.pointsToWin) {
      return
    }
    currentScore2.value = Math.max(0, currentScore2.value + delta)
  }

  checkSetOver()
}

function checkSetOver() {
  // pointsToWin 도달 시에만 자동으로 세트 종료
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

  // 제한시간이 지나도 세트를 자동 종료하지 않음 (UI만 빨간색으로 표시)
  // 수동으로 '세트종료' 버튼을 눌러야 다음 세트로 진행
}

function manualFinishSet() {
  // 수동으로 세트 종료 (시간 초과 시)
  if (game.rule.winBy == 'MOST_SETS_AND_POINTS') {
    if (currentScore1.value > currentScore2.value) {
      user1SetsWon.value++
      finishSet(1)
    } else if (currentScore2.value > currentScore1.value) {
      user2SetsWon.value++
      finishSet(2)
    } else {
      finishSet(0) // 무승부
    }
  } else {
    finishSet(0) // 무승부
  }
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
    goToResult()
  } else {
    currentSet.value++
  }
}

function startTimer() {
  if (isGameOver.value) return
  clearInterval(timerRef.value)
  updateElapsed()
  timerRef.value = setInterval(updateElapsed, 1000)
}

function updateElapsed() {
  if (!game.setStartedAt || isSetOver.value || isCountingDown.value) return
  const startedAt = new Date(game.setStartedAt)
  const now = new Date()
  const elapsed = Math.floor((now - startedAt) / 1000)

  // 제한시간이 있는 경우 시간 계산
  if (game.limitSeconds !== -1) {
    elapsedSeconds.value = elapsed
    // 남은 시간 계산 (0 미만 가능 - 오버타임)
    const remainingSeconds = game.limitSeconds - elapsed
    elapsedTimeStr.value = getTimeStr(Math.abs(remainingSeconds))
    limitTimeStr.value = getTimeStr(game.limitSeconds)
  } else {
    // 제한 없음
    elapsedSeconds.value = elapsed
    elapsedTimeStr.value = getTimeStr(elapsedSeconds.value)
    limitTimeStr.value = '제한 없음'
  }

  if (!isSetOver.value && !isGameOver.value) {
    checkSetOver()
  }

  // 시간 초과 알림
  if (
    game.limitSeconds !== -1 &&
    elapsedSeconds.value >= game.limitSeconds &&
    !timeOverNotified.value
  ) {
    timeOverNotified.value = true
    // 진동
    if (navigator.vibrate) {
      navigator.vibrate(500)
    }
    // 소리 (브라우저 기본 알림음 사용, 파일이 없으면 무시)
    try {
      const audio = new Audio('/notification.mp3')
      audio.play()
    } catch (e) {
      // 무시
    }
  }
}

function getTimeStr(seconds) {
  if (seconds <= 0) return '00:00'
  const min = Math.floor(seconds / 60)
  const sec = seconds % 60
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(min)}:${pad(sec)}`
}

function goToResult() {
  router.push(`/games/${gameId}/result`)
}

function goBack() {
  router.back()
}

function handleVisibilityChange() {
  if (document.visibilityState === 'visible') {
    // 페이지가 다시 활성화될 때 소켓 연결을 시도합니다.
    // socket.connect 내부 로직에 의해 이미 연결된 상태라면 아무 작업도 수행하지 않습니다.
    socket.connect(chatRoomId.value)

    updateElapsed()
    if (!isSetOver.value && !isGameOver.value) {
      startTimer()
    }
  }
}

function addLog(log) {
  const start = new Date(game.totalGameStartedAt)
  const current = new Date(log.time)
  const diffSec = Math.floor((current - start) / 1000)
  const minutes = String(Math.floor(diffSec / 60)).padStart(2, '0')
  const seconds = String(diffSec % 60).padStart(2, '0')
  const elapsed = `${minutes}:${seconds}`

  let message = ''
  if (log.type === 'SCORE') {
    message = `${log.targetId == user1.value.id ? user1.value.nickname : user2.value.nickname} ${log.delta}점 ${log.delta > 0 ? '득점' : '실점'} (변경자 - ${log.userSummary.nickname})`
  } else if (log.type === 'SET') {
    message = `${log.userSummary.nickname} 세트를 증가시킴`
  } else if (log.type === 'RESET') {
    message = `${log.userSummary.nickname} 경기를 리셋함`
  } else if (log.type === 'FINISH') {
    message = `경기가 종료되었습니다!`
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
  // 안드로이드 네이티브 카메라 콜백 등록
  if (typeof window !== 'undefined') {
    // 사진 촬영 콜백 핸들러
    const handleCameraResult = async (base64Image) => {
      try {
        const compressed = await compressImage(base64Image)
        await addGamePicture(gameId, compressed)
        showToast('사진이 저장되었습니다!')
      } catch (error) {
        console.error('Failed to process camera image:', error)
        if (error.message === 'QUOTA_EXCEEDED') {
          showToast('저장 공간이 부족합니다.')
        } else {
          showToast('사진 저장에 실패했습니다.')
        }
      }
    }

    // 동영상 촬영 콜백 핸들러
    const handleVideoCameraResult = async (base64Video, duration) => {
      try {
        // duration은 밀리초 단위로 전달된다고 가정
        await addGameVideo(gameId, base64Video, duration || 0)
        showToast('동영상이 저장되었습니다!')
      } catch (error) {
        console.error('Failed to process video:', error)
        if (error.message === 'QUOTA_EXCEEDED') {
          showToast('저장 공간이 부족합니다.')
        } else {
          showToast('동영상 저장에 실패했습니다.')
        }
      }
    }

    // 여러 콜백 이름을 모두 등록 (안드로이드/iOS 호환성)
    window.onCameraResult = handleCameraResult
    window.onGameCameraResult = handleCameraResult
    window.onVideoCameraResult = handleVideoCameraResult
    window.onGameVideoCameraResult = handleVideoCameraResult
  }

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
    // 시간 제한 없는 경우에만 자동 시작
    if (game.limitSeconds === -1) {
      startTimer()
    }
  }

  // 시간 제한 있는 경우 세트 시작 버튼 표시
  if (game.limitSeconds !== -1 && !isSetOver.value) {
    showStartButton.value = true
  }

  const logResponse = await api.get(`/api/games/${gameId}/game-logs`)
  const rawLogs = logResponse.data
  rawLogs.forEach((log) => addLog(log))

  // 소켓 핸들러 등록
  socket.onConnecting(() => {
    socketStatus.value = 'connecting'
  })
  socket.onConnected(() => {
    socketStatus.value = 'connected'
  })
  socket.onDisconnected(() => {
    socketStatus.value = 'disconnected'
  })

  socket.onMessage((payload) => {
    if (payload.type === 'SCORE') {
      addScore(payload.targetId, payload.delta)
      addLog(payload)
    } else if (payload.type === 'SET') {
      // setStartedAt는 startSet() 내부의 카운트다운이 끝난 후 설정됨
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

function socket_sendScore(userIndex, scoreDelta) {
  socket.sendGameEvent(chatRoomId.value, {
    type: 'SCORE',
    userId: userIndex === 1 ? user1.value.id : user2.value.id,
    setIndex: currentSet.value,
    scoreDelta: scoreDelta,
  })
}

function socket_nextSet() {
  socket.sendGameEvent(chatRoomId.value, {
    type: 'SET',
    setIndex: currentSet.value,
    userId: 0,
    scoreDelta: 0,
  })
}

function socket_finishGame() {
  socket.sendGameEvent(chatRoomId.value, {
    type: 'FINISH',
  })
}

function socket_resetGame() {
  socket.sendGameEvent(chatRoomId.value, {
    type: 'RESET',
  })
}

// 안드로이드 웹뷰 감지
function isAndroidWebView() {
  return window.AndroidApp !== undefined
}

function isIOSWebView() {
  const userAgent = navigator.userAgent.toLowerCase()
  return (
    userAgent.includes('raspy-ios') ||
    (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.iosBridge)
  )
}

// 사진 촬영 트리거
function triggerPhotoCapture() {
  if (isAndroidWebView()) {
    try {
      window.AndroidApp.openCamera()
      // 콜백은 window.onGameCameraResult로 받음
    } catch (error) {
      console.error('Failed to call Android camera:', error)
      // 실패 시 fallback
      cameraInputRef.value?.click()
    }
  } else if (isIOSWebView()) {
    try {
      window.webkit.messageHandlers.iosBridge.postMessage({
        action: 'openCamera',
        type: 'photo',
      })
      // 콜백은 window.onGameCameraResult로 받음
    } catch (error) {
      console.error('Failed to call iOS camera:', error)
      // 실패 시 fallback
      cameraInputRef.value?.click()
    }
  } else {
    // 일반 웹
    cameraInputRef.value?.click()
  }
}

// 동영상 촬영 트리거
function triggerVideoCapture() {
  if (isAndroidWebView()) {
    try {
      window.AndroidApp.openVideoCamera()
      // 콜백은 window.onGameVideoCameraResult로 받음
    } catch (error) {
      console.error('Failed to call Android video camera:', error)
      // 실패 시 fallback
      videoInputRef.value?.click()
    }
  } else if (isIOSWebView()) {
    try {
      window.webkit.messageHandlers.iosBridge.postMessage({
        action: 'openCamera',
        type: 'video',
      })
      // 콜백은 window.onGameVideoCameraResult로 받음
    } catch (error) {
      console.error('Failed to call iOS video camera:', error)
      // 실패 시 fallback
      videoInputRef.value?.click()
    }
  } else {
    // 일반 웹
    videoInputRef.value?.click()
  }
}

// 카메라 파일 선택 완료
async function onCameraChange(e) {
  const file = e.target.files?.[0]
  if (!file) return

  // File을 base64로 변환
  const reader = new FileReader()

  reader.onload = async (event) => {
    try {
      const dataUrl = event.target.result

      // 이미지 압축 (기본값 사용: 800px, quality 0.3)
      const compressed = await compressImage(dataUrl)

      // IndexedDB에 저장
      await addGamePicture(gameId, compressed)

      showToast('사진이 저장되었습니다!')
    } catch (error) {
      console.error('사진 저장 실패:', error)
      if (error.message === 'QUOTA_EXCEEDED') {
        showToast('저장 공간이 부족합니다. 일부 사진을 삭제한 후 다시 시도해주세요.')
      } else {
        showToast('사진 저장에 실패했습니다.')
      }
    }
  }

  reader.onerror = () => {
    console.error('파일 읽기 실패')
    showToast('사진 저장에 실패했습니다.')
  }

  reader.readAsDataURL(file)

  // input 초기화 (같은 파일 재선택 가능하도록)
  e.target.value = ''
}

// 동영상 파일 선택 완료
async function onVideoChange(e) {
  const file = e.target.files?.[0]
  if (!file) return

  showToast('동영상 처리 중...')

  try {
    // 동영상 압축 (최대 2분)
    const { dataUrl, duration } = await compressVideo(file, 120)

    // IndexedDB에 저장
    await addGameVideo(gameId, dataUrl, duration)

    showToast(`동영상이 저장되었습니다! (${Math.floor(duration)}초)`)
  } catch (error) {
    console.error('동영상 저장 실패:', error)
    if (error.message === 'QUOTA_EXCEEDED') {
      showToast('저장 공간이 부족합니다. 일부 미디어를 삭제한 후 다시 시도해주세요.')
    } else {
      showToast('동영상 저장에 실패했습니다.')
    }
  }

  // input 초기화
  e.target.value = ''
}

onUnmounted(() => {
  clearInterval(timerRef.value)
  document.removeEventListener('visibilitychange', handleVisibilityChange)

  // 안드로이드 네이티브 카메라 콜백 정리
  if (typeof window !== 'undefined') {
    window.onCameraResult = null
    window.onGameCameraResult = null
    window.onVideoCameraResult = null
    window.onGameVideoCameraResult = null
  }

  // 소켓 핸들러 정리
  socket.onConnecting(null)
  socket.onConnected(null)
  socket.onDisconnected(null)
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
@keyframes countdown {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0.9;
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
.animate-countdown {
  animation: countdown 1s ease-in-out;
}
</style>
