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
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MatchLogo from './assets/Match.png'
import { socket } from './websocket'

const showSplash = ref(true)
const route = useRoute()
const router = useRouter()

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

import api from './api/api'

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
  transition: opacity 0.4s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
