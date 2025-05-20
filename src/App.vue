<template>

      <router-view />

  <div>
    <!-- 진행중 게임 상단 바 -->
    <div v-if="activeGame" class="fixed top-12  p-5 left-0 w-full text-white text-sm z-50">
      <div class="max-w-4xl mx-auto px-4 py-5 rounded-xl flex justify-between items-center bg-green-600 " style="opacity: 0.8">
        <span>
          🟢 진행 중인 게임:<br>
          {{ activeGame.myNickname }} vs {{ activeGame.opponentNickname }}
          · {{ activeGame.endsAt ? `종료까지 ${countdown}` : '제한 없음' }}
        </span>
        <router-link
          :to="`/game/progress/${activeGame.id}`"
          class="bg-white text-green-700 px-2 py-2 rounded hover:bg-gray-100 text-xs"
        >
          게임방 이동
        </router-link>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import api from './api/api'

const activeGame = ref(null)
const countdown = ref('')
let interval = null

onMounted(async () => {
  const res = await api.get('/api/games/in-progress')
  console.log(res.data)
  if (res.data) {
    activeGame.value = res.data
    if (activeGame.value.endsAt) {
      updateCountdown()
      interval = setInterval(updateCountdown, 1000)
    }
  }
})

onBeforeUnmount(() => {
  if (interval) clearInterval(interval)
})

function updateCountdown() {
  if (!activeGame.value?.endsAt) return
  const end = new Date(activeGame.value.endsAt)
  const now = new Date()
  const diff = Math.max(0, end - now)
  const min = Math.floor(diff / 60000)
  const sec = Math.floor((diff % 60000) / 1000)
  countdown.value = `${min}분 ${sec}초`
}
</script>

<style>
</style>
