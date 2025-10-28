<template>
  <div class="h-full">
    <!-- Splash 화면 (anroid는 네이티브 위임, ios일때만 보임.) -->
    <transition name="fade">
      <div class="overflow-hidden">
        <div
          v-if="false && isIos && showSplash"
          class="fixed overflow-hidden inset-0 flex items-center justify-center bg-black z-[100]"
        >
          <span class="raspy text-5xl font-extrabold tracking-wider text-orange-500 font-kanit;">
            <img class="w-[50dvw]" :src="MatchLogo" />
          </span>
        </div>
      </div>
    </transition>

    <!-- 실제 라우터 뷰 -->
    <RouterView class="h-full" :key="route.fullPath" />

    <!-- 게임 시작 알림 (전역) -->
    <Transition name="fade">
      <div
        v-if="activeGame && activeGame.gameId"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999999] flex items-center justify-center p-4"
        @click.self="dismissActiveGame"
      >
        <Transition name="slide-up">
          <div
            v-if="activeGame && activeGame.gameId"
            class="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <!-- 헤더 -->
            <div class="relative px-6 py-8 bg-gradient-to-br from-orange-500 via-orange-600 to-red-500 text-white">
              <div class="text-center">
                <div class="inline-flex items-center justify-center mb-4">
                  <div class="relative">
                    <div class="absolute inset-0 bg-white/30 rounded-full animate-ping"></div>
                    <div class="relative bg-white/20 backdrop-blur-sm rounded-full p-4 border-2 border-white/30">
                      <i class="fas fa-trophy text-4xl"></i>
                    </div>
                  </div>
                </div>
                <h2 class="text-2xl font-black mb-2 tracking-tight">경기 시작!</h2>
                <p class="text-white/90 text-sm font-medium">참여하신 경기가 시작되었습니다</p>
              </div>
            </div>

            <!-- 게임 정보 -->
            <div class="px-6 py-6 space-y-4">
              <!-- 규칙 제목 -->
              <div class="text-center">
                <div class="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-full border border-orange-200">
                  <i class="fas fa-gamepad text-orange-500"></i>
                  <span class="text-sm font-bold text-orange-700">{{ activeGame.ruleTitle || '경기' }}</span>
                </div>
              </div>

              <!-- 플레이어 VS -->
              <div class="flex items-center justify-center gap-3 py-4">
                <div class="flex flex-col items-center flex-1">
                  <div class="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xl font-bold mb-2 shadow-lg">
                    {{ getInitial(activeGame.player1?.nickname) }}
                  </div>
                  <p class="text-sm font-bold text-gray-800 truncate max-w-[80px]">
                    {{ activeGame.player1?.nickname }}
                  </p>
                </div>

                <div class="flex flex-col items-center justify-center px-3">
                  <div class="text-3xl font-black text-orange-500 animate-pulse">VS</div>
                </div>

                <div class="flex flex-col items-center flex-1">
                  <div class="w-16 h-16 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white text-xl font-bold mb-2 shadow-lg">
                    {{ getInitial(activeGame.player2?.nickname) }}
                  </div>
                  <p class="text-sm font-bold text-gray-800 truncate max-w-[80px]">
                    {{ activeGame.player2?.nickname }}
                  </p>
                </div>
              </div>

              <!-- 시작 시각 -->
              <div class="flex items-center justify-center gap-2 text-sm text-gray-600">
                <i class="fas fa-clock text-gray-400"></i>
                <span>{{ formatStartTime(activeGame.startedAt) }}</span>
              </div>

              <!-- 카운트다운 -->
              <div class="text-center py-4">
                <div class="inline-flex flex-col items-center gap-2">
                  <p class="text-xs text-gray-500 font-medium">자동 참여까지</p>
                  <div class="relative">
                    <svg class="transform -rotate-90" width="80" height="80">
                      <circle cx="40" cy="40" r="36" stroke="#fee2e2" stroke-width="6" fill="none" />
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        :stroke="gameCountdown <= 2 ? '#ef4444' : gameCountdown <= 3 ? '#f97316' : '#22c55e'"
                        stroke-width="6"
                        fill="none"
                        stroke-linecap="round"
                        :stroke-dasharray="226"
                        :stroke-dashoffset="226 * (1 - gameCountdown / 5)"
                        class="transition-all duration-1000 ease-linear"
                      />
                    </svg>
                    <div class="absolute inset-0 flex items-center justify-center">
                      <span
                        class="text-3xl font-black"
                        :class="gameCountdown <= 2 ? 'text-red-500' : gameCountdown <= 3 ? 'text-orange-500' : 'text-green-500'"
                      >
                        {{ gameCountdown }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 버튼 -->
            <div class="px-6 pb-6">
              <button
                @click="dismissActiveGame"
                class="w-full py-3 px-6 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold active:scale-95 transition-all"
              >
                참여하지 않을래요
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MatchLogo from './assets/Match.png'
import { socket } from './websocket'
import api from './api/api'
// import GameStartNotification from './components/GameStartNotificationSimple.vue'
import { useActiveGamePolling } from './composable/useActiveGamePolling'

const showSplash = ref(true)
const route = useRoute()
const router = useRouter()

// 진행 중인 게임 폴링 (명시적으로 초기화)
const activeGamePolling = useActiveGamePolling()
const activeGame = activeGamePolling.activeGame || ref(null)
const startPolling = activeGamePolling.startPolling
const stopPolling = activeGamePolling.stopPolling
const dismissActiveGame = activeGamePolling.dismissActiveGame

const isIos = ref(false)
const ua = navigator.userAgent.toLowerCase()
if (ua.includes('raspy-ios')) {
  isIos.value = true
}
onMounted(() => {
  setTimeout(() => {
    showSplash.value = false
  }, 2000) //

  if (localStorage.getItem('250725update') != 1) {
    localStorage.removeItem('raspy_access_token2')
    localStorage.setItem('250725update', 1)
    router.push('/')
  }

  try {
    const token = localStorage.getItem('raspy_access_token2')
    setTimeout(() => {
      showSplash.value = false
    }, 2000) //

    // 로그인된 사용자면 게임 폴링 시작
    if (token) {
      startPolling(() => route.fullPath)
    }

    setTimeout(() => {
      if (window.AndroidApp && window.AndroidApp.registerFcmToken) {
        window.AndroidApp.registerFcmToken(token)
      } else if (
        window.webkit &&
        window.webkit.messageHandlers &&
        window.webkit.messageHandlers.iosBridge
      ) {
        window.webkit.messageHandlers.iosBridge.postMessage({
          action: 'registerFcmToken',
          jwt: token,
        })
      }
    }, 5000)
  } catch (e) {
    console.log('welcome [web] user')
  }
})

window.addEventListener('error', (event) => {
  console.error('Uncaught Error:', event.error)
})

// 게임 시작 알림 관련 함수들
const gameCountdown = ref(5)
let gameCountdownTimer = null

// 닉네임 첫 글자 추출
const getInitial = (nickname) => {
  if (!nickname) return '?'
  return nickname.charAt(0).toUpperCase()
}

// 시작 시각 포맷
const formatStartTime = (startedAt) => {
  if (!startedAt) return ''
  const date = new Date(startedAt)
  return date.toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// activeGame 변경 감지하여 카운트다운 시작
watch(
  activeGame,
  (newGame) => {
    if (newGame && newGame.gameId) {
      startGameCountdown()
    } else {
      stopGameCountdown()
    }
  }
)

const startGameCountdown = () => {
  stopGameCountdown()
  gameCountdown.value = 5

  gameCountdownTimer = setInterval(() => {
    gameCountdown.value--

    if (gameCountdown.value <= 0) {
      stopGameCountdown()
      // 자동으로 게임 화면으로 이동
      if (activeGame.value?.gameId) {
        router.push(`/games/${activeGame.value.gameId}/play`)
        dismissActiveGame()
      }
    }
  }, 1000)
}

const stopGameCountdown = () => {
  if (gameCountdownTimer) {
    clearInterval(gameCountdownTimer)
    gameCountdownTimer = null
  }
}

// router 필요
function getChatUrlFromPath(path) {
  // /chat/xxx 또는 /games/xxx/play 등 다양한 방 라우트 패턴 지원
  const chatMatch = path.match(/^\/chat\/([^/]+)/)
  if (chatMatch) return chatMatch

  return null
}
function getGameUrlFromPath(path) {
  // /chat/xxx 또는 /games/xxx/play 등 다양한 방 라우트 패턴 지원
  const gameMatch = path.match(/^\/games\/([^/]+)\/play/)
  if (gameMatch) return gameMatch

  return null
}

// 라우트가 바뀔 때마다 방 진입/이탈 감지
watch(
  () => route.fullPath,
  async (path) => {
    const chatUrl = getChatUrlFromPath(path)
    const gameUrl = getGameUrlFromPath(path)

    let roomId = false

    if (chatUrl) {
      const chatId = await chatUrl[1]
      const { data } = await api.post('/api/chat-room/dm-room', null, {
        params: { chatId },
      })
      roomId = data.roomId
    } else if (gameUrl) {
      const gameId = await gameUrl[1]
      const res = await api.get(`/api/games/${gameId}/detail`)

      roomId = res.data.chatRoomId
    }

    if (roomId) {
      if (roomId) {
        // 방에 들어왔을 때만 연결!
        socket.connect(roomId)
      } else {
        // 방에서 나갔을 때 완전 해제!
        socket.disconnect({ clearRoomId: true })
        console.log('disconnect all sockets. bye.')
      }
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  socket.disconnect({ clearRoomId: true })
  stopPolling()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Kanit:wght@600&display=swap');

/* Kanit 폰트 클래스 추가 */
@font-face {
  font-family: 'Kanit';
  font-style: normal;
  font-weight: 600;
  src:
    local('Kanit SemiBold'),
    local('Kanit-SemiBold'),
    url('https://fonts.gstatic.com/s/kanit/v20/nKKLRXYHTvRiG61aDCxHo_zY.woff2') format('woff2');
}

/* fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* slide-up transition */
.slide-up-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(30px) scale(0.9);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

/* ping animation */
@keyframes ping {
  75%, 100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

.animate-ping {
  animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
}
</style>
