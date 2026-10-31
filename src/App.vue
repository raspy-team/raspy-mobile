<template>
  <div class="h-full">

    <!-- 실제 라우터 뷰 -->
    <RouterView class="h-full" :key="route.fullPath" />

    <!-- 하단 탭: 어느 화면에서든 큰 갈래로 돌아갈 수 있게 앱 전체에서 한 번만 그린다 -->
    <FooterNav v-if="footerTab !== null" :tab="footerTab" />

    <!-- 앱 전체 알림 한 줄 (window.alert도 여기로 온다) -->
    <CustomToast />
    <UiConfirmHost />

    <!-- 끝난 경기 평가 요청. '나중에'를 누르면 그 경기는 다시 묻지 않는다 -->
    <UiDialog
      :model-value="showPendingReviewModal && !!pendingReviewGameId"
      title="경기는 어땠나요?"
      message="상대와 규칙을 평가해주세요. 다음 매칭과 규칙 순위에 반영돼요."
      confirm-text="평가하기"
      cancel-text="나중에"
      @confirm="goToPendingReview"
      @update:model-value="(v) => !v && dismissPendingReview()"
    />

    <!-- 진행 중인 내 경기. 경기 화면에 있을 때는 숨긴다 -->
    <ActiveGameBanner
      :game="showActiveBanner ? activeGame : null"
      :with-nav="footerTab !== null"
      @open="openActiveGame"
      @dismiss="dismissActiveGame"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { socket } from './websocket'
import api from './api/api'
import FooterNav from './components/FooterNav.vue'
import CustomToast from './components/CustomToast.vue'
import UiConfirmHost from './components/ui/UiConfirmHost.vue'
import UiDialog from './components/ui/UiDialog.vue'
import ActiveGameBanner from './components/game/ActiveGameBanner.vue'
import { useActiveGamePolling } from './composable/useActiveGamePolling'

const route = useRoute()

// 하단 탭을 보여줄 화면과 그때 켜질 탭. null이면 탭을 숨긴다 (가입·경기 진행·채팅처럼 한 가지에 집중하는 화면)
const footerTab = computed(() => {
  const p = route.path
  if (p === '/') return 'home'
  if (p === '/feed') return route.query.userId ? null : 'feed'
  if (p === '/game') return 'game'
  if (p === '/profile/0' || p === '/settings') return 'profile'
  if (p.startsWith('/profile/')) return ''
  if (p === '/rules' && route.query.fromGameCreate) return null
  if (p === '/rules' || p === '/rules/my-rules' || /^\/rules\/\d+\/ranking$/.test(p)) return 'home'
  if (p === '/dm') return ''
  return null
})
// 진행 중인 게임 폴링 (명시적으로 초기화)
const activeGamePolling = useActiveGamePolling()
const activeGame = activeGamePolling.activeGame || ref(null)
const pendingReviewGameIds = activeGamePolling.pendingReviewGameIds || ref([])
const startPolling = activeGamePolling.startPolling
const stopPolling = activeGamePolling.stopPolling
const dismissActiveGame = activeGamePolling.dismissActiveGame

// 펜딩 리뷰 모달 상태
const showPendingReviewModal = ref(false)
const pendingReviewGameId = ref(null)

// 하루에 한 번만 daily-first API 호출
const checkAndSendDailyFirst = async () => {
  try {
    const token = localStorage.getItem('raspy_access_token2')
    if (!token) return

    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD 형식
    const lastCallDate = localStorage.getItem('daily_first_last_call')

    if (lastCallDate !== today) {
      // 오늘 아직 호출하지 않았으면 호출
      await api.post('/api/access/daily-first')
      localStorage.setItem('daily_first_last_call', today)
      console.log('Daily first access recorded:', today)
    } else {
      console.log('Daily first access already recorded today:', today)
    }
  } catch (error) {
    console.error('Failed to send daily-first:', error)
  }
}

onMounted(() => {

  if (localStorage.getItem('251105match') != 1) {
    localStorage.removeItem('raspy_access_token2')
    localStorage.setItem('251105match', 1)
    router.push('/')
  }

  try {
    const token = localStorage.getItem('raspy_access_token2')

    // 로그인된 사용자면 게임 폴링 시작
    if (token) {
      startPolling(() => route.fullPath)
      // 하루 최초 접속 API 호출
      checkAndSendDailyFirst()
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

// '나중에 할게요': 이 경기는 다시 묻지 않는다 (평가는 결과 화면에서 언제든 할 수 있다)
const dismissedReviewIds = (() => {
  try {
    return JSON.parse(localStorage.getItem('dismissedReviewIds') || '[]')
  } catch {
    return []
  }
})()
const dismissPendingReview = () => {
  if (pendingReviewGameId.value) {
    dismissedReviewIds.push(pendingReviewGameId.value)
    try {
      localStorage.setItem('dismissedReviewIds', JSON.stringify(dismissedReviewIds.slice(-50)))
    } catch {
      // 저장 못 해도 이번에는 닫힌다
    }
  }
  showPendingReviewModal.value = false
}

// pendingReviewGameIds 변경 감지
watch(
  pendingReviewGameIds,
  (newIds) => {
    if (newIds && newIds.length > 0) {
      // 결과 페이지에 있지 않을 때만 모달 표시
      // 결과 화면에 있거나 '나중에'를 누른 경기는 다시 띄우지 않는다
      const next = newIds.find((id) => !dismissedReviewIds.includes(id))
      if (next && !route.fullPath.includes('/result')) {
        pendingReviewGameId.value = next
        showPendingReviewModal.value = true
      }
    } else {
      showPendingReviewModal.value = false
      pendingReviewGameId.value = null
    }
  },
  { immediate: true },
)

// 펜딩 리뷰 페이지로 이동
const goToPendingReview = () => {
  if (pendingReviewGameId.value) {
    showPendingReviewModal.value = false
    router.push(`/games/${pendingReviewGameId.value}/result`)
  }
}

// 진행 중 경기 띠: 경기·결과·내 경기 화면에 있거나 평가 창이 떠 있으면 숨긴다
// 내 경기 화면은 카드에 이미 '경기로 돌아가기'가 있어서 띠를 띄우지 않는다
const showActiveBanner = computed(
  () => !showPendingReviewModal.value && route.path !== '/game' && !/^\/games\/\d+\/(play|result)/.test(route.path),
)
const openActiveGame = () => {
  if (activeGame.value?.gameId) router.push(`/games/${activeGame.value.gameId}/play`)
}

// router 필요
const router = useRouter()

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

    // 채팅·경기 방에 들어오면 그 방에 연결하고, 나가면 끊는다
    // (예전에는 끊는 쪽 분기에 도달할 수 없어서 방을 나가도 연결이 남았다)
    if (roomId) socket.connect(roomId)
    else socket.disconnect({ clearRoomId: true })
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
  75%,
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

.animate-ping {
  animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
}
</style>
