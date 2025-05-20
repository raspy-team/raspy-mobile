<template>
  <div class="max-w-2xl mx-auto px-4 py-6 space-y-6">
    <!-- 제한 시간 상단 표시 -->
    <div class="fixed top-0 left-0 w-full bg-gray-900 text-white py-2 px-4 text-sm z-50 flex justify-between items-center">
      <span>⏱ 제한 시간: {{ timeLeft }}</span>
      <button @click="goBack" class="text-white text-xs underline">← 돌아가기</button>
    </div>

    <div class="pt-10 space-y-8">
      <!-- 점수 UI -->
      <div class="flex justify-between items-center">
        <!-- 왼쪽 유저 -->
        <div class="flex flex-col items-center gap-1">
          <img v-if="game.user1.profileUrl" :src="game.user1.profileUrl" class="w-12 h-12 rounded-full object-cover" />
          <p class="text-sm">{{ game.user1.nickname }}</p>
          <p class="text-2xl font-bold">{{ score1 }}</p>
          <div class="flex gap-1">
            <button @click="changeScore(game.user1.id, 1)">➕</button>
            <button @click="changeScore(game.user1.id, -1)">➖</button>
          </div>
        </div>

        <p class="text-3xl font-bold text-gray-700">VS</p>

        <!-- 오른쪽 유저 -->
        <div class="flex flex-col items-center gap-1">
          <img v-if="game.user2.profileUrl" :src="game.user2.profileUrl" class="w-12 h-12 rounded-full object-cover" />
          <p class="text-sm">{{ game.user2.nickname }}</p>
          <p class="text-2xl font-bold">{{ score2 }}</p>
          <div class="flex gap-1">
            <button @click="changeScore(game.user2.id, 1)">➕</button>
            <button @click="changeScore(game.user2.id, -1)">➖</button>
          </div>
        </div>
      </div>

      <!-- 세트/정보 -->
      <div class="text-center text-sm text-gray-600">
        <p>현재 세트: {{ currentSet + 1 }}</p>
        <p class="mt-2">{{ game.majorCategory }} - {{ game.minorCategory }} / {{ game.ruleTitle }}</p>
        <p class="mt-1">{{ game.place }} · {{ formatDate(game.matchDate) }}</p>
      </div>

      <!-- 액션 버튼 -->
      <div class="flex justify-around mt-8">
        <button @click="nextSet" class="bg-gray-200 px-4 py-2 rounded-full">다음 세트</button>
        <button @click="pauseGame" class="bg-gray-200 px-4 py-2 rounded-full">일시 중지</button>
        <button @click="finishGame" class="bg-red-600 text-white px-4 py-2 rounded-full">경기 종료</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../api/api'

const route = useRoute()
const router = useRouter()
const gameId = route.params.gameId

const game = ref({})
const currentSet = ref(0)
const score1 = ref(0)
const score2 = ref(0)
const timeLeft = ref('')

onMounted(async () => {
  const res = await api.get(`/api/games/${gameId}/detail`)
  game.value = res.data
  score1.value = res.data.score1
  score2.value = res.data.score2
  currentSet.value = res.data.currentSet || 0


  if (res.data.limitSeconds !== -1) {
    updateTimer(res.data.limitSeconds)
    setInterval(() => updateTimer(res.data.limitSeconds), 1000)
  } else {
    timeLeft.value = '제한 없음'
  }
})

const updateTimer = (limit) => {
  const startTime = new Date(game.value.startedAt)
  const now = new Date()
  const elapsed = Math.floor((now - startTime) / 1000)
  const remain = Math.max(0, limit - elapsed)
  const min = Math.floor(remain / 60)
  const sec = remain % 60
  timeLeft.value = `${min}분 ${sec}초`
}

const changeScore = async (targetId, delta) => {
  await api.post(`/api/games/${gameId}/score-log`, {
    targetId,
    action: delta > 0 ? 'INCREMENT' : 'DECREMENT'
  })

  if (targetId === game.value.user1.id) {
    score1.value += delta
  } else {
    score2.value += delta
  }
}

const nextSet = async () => {
  await api.post(`/api/games/${gameId}/next-set`)
  currentSet.value += 1
}

const pauseGame = async () => {
  await api.post(`/api/games/${gameId}/pause`)
  alert('게임이 일시 중지되었습니다.')
}

const finishGame = async () => {
  await api.post(`/api/games/${gameId}/finish`)
  router.push(`/games/${gameId}/result`)
}

const goBack = () => {
  router.back()
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })
}
</script>
