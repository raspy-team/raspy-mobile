<template>
  <div>
    <h2 class="font-semibold mb-4 text-lg">내가 신청한 경기</h2>
    <div v-if="games.length > 0" class="space-y-4">
      <div v-for="game in games" :key="game.gameId" class="border rounded p-4 bg-white shadow-sm">
        <div class="flex justify-between items-center mb-2">
          <p class="font-bold">{{ game.title }}</p>
          <p class="text-sm text-gray-500">{{ formatDate(game.matchDate) }}</p>
        </div>
        <p class="text-sm text-gray-600 mb-1">장소: {{ game.matchLocation || '미정' }}</p>
        <p class="text-sm text-gray-600">상대: {{ game.opponentNickname || '미정' }}</p>
        <p class="text-sm text-gray-500 mt-1">상태: {{ translateStatus(game.matchStatus) }}</p>
        <button class="mt-3 text-sm text-red-500 hover:underline" @click="cancelRequest(game.gameId)">취소</button>
      </div>
    </div>
    <div v-else class="text-center text-sm text-gray-400">신청한 게임이 없습니다.</div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import client from '../../api/api'

const games = ref([])

onMounted(async () => {
  const res = await client.get('/api/inbox/sent')
  games.value = res.data
})

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })
}

function translateStatus(status) {
  return status === 'UPCOMING' ? '시작 전' : status === 'STARTED' ? '진행 중' : '완료'
}

async function cancelRequest(gameId) {
  await client.post(`/api/inbox/cancel/${gameId}`)
  games.value = games.value.filter(g => g.gameId !== gameId)
}
</script>
