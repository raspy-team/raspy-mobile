<template>
  <div>
    <GameStatusBar v-if="activeGame" :activeGame="activeGame" :countdown="countdown" />
     <RouterView :key="route.fullPath" />
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import api from './api/api'
import GameStatusBar from './components/GameStatusBar.vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const activeGame = ref(null)
const countdown = ref('')
let interval = null

async function fetchActiveGame() {
  try {
    const res = await api.get('/api/games/in-progress')
    if (res.data) {
      activeGame.value = res.data
      if (activeGame.value.startAt) {
        updateCountdown()
        if (!interval) interval = setInterval(updateCountdown, 1000)
      } else {
        countdown.value = ''
        if (interval) clearInterval(interval)
      }
    } else {
      activeGame.value = null
      countdown.value = ''
      if (interval) clearInterval(interval)
    }
  } catch (e) {
    activeGame.value = null
    countdown.value = ''
    if (interval) clearInterval(interval)
  }
}

// 라우트 이동 시마다 현재 게임이 진행 중인지 갱신됨됨
const router = useRouter()

router.afterEach((to, from) => {
  console.log(`route move ${to.path} <- ${from.path}`)
  const isGamePlayRoute = /^\/games\/\d+\/play$/.test(to.path)
  console.log(isGamePlayRoute)
  if (!isGamePlayRoute) {
    fetchActiveGame()
  }else {
    activeGame.value = false
  }
})

onBeforeUnmount(() => {
  if (interval) clearInterval(interval)
})
function updateCountdown() {
  const start = new Date(activeGame.value.startAt)
  const now = new Date()
  const diff = Math.max(0, now-start)
  const min = Math.floor(diff / 60000)
  const sec = Math.floor((diff % 60000) / 1000)
  countdown.value = `${min}분 ${sec}초`
}
</script>
