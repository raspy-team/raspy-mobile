<template>
  <HeaderComp />
  <div>
    <h2 class="font-semibold mb-4 text-lg">내 신청 내역</h2>
    <div v-if="games.length" class="space-y-6">
      <div v-for="game in games" :key="game.id" class="border rounded p-4 bg-white shadow-sm">
        <div class="mb-2">
          <p class="text-sm text-gray-500">장소-{{ game.matchLocation || '미정' }} / 일시-{{ formatDate(game.matchDate) }}</p>
          <div class="my-3 bg-gray-100 p-4">
            <p class="font-bold">{{ game.title }} · <span class="text-[0.8rem] font-[400] text-gray-700">{{ game.majorCategory }} > {{ game.minorCategory }}</span></p>
            <p class="mt-1 text-sm text-gray-600">{{ game.description }}</p>
          </div>
        </div>

        <ul class="space-y-2 border-t-[2px] pt-4">
          <div class="font-semibold text-gray-700">상대</div>
          <div class="flex justify-between items-center">
            <div class="text-sm text-gray-700">
              {{ game.ownerNickname }} · {{ game.ownerWins }}승 {{ game.ownerDraws }}무 {{ game.ownerLosses }}패 · {{ game.ownerRating }}%
            </div>
            <span class="text-xs font-semibold"
              :class="{
                'text-blue-600': game.status === 'APPROVED',
                'text-gray-500': game.status === 'REQUESTED',
                'text-red-500': game.status === 'REJECTED'
              }">
              {{ translateStatus(game.status) }}
            </span>
          </div>

          <div v-if="game.status === 'REQUESTED'" class="text-right mt-2">
            <button
              class="text-sm text-red-500 hover:underline"
              @click="cancelRequest(game.id)">
              지원 취소
            </button>
          </div>
        </ul>
      </div>
    </div>
    <div v-else class="text-center text-sm text-gray-400">신청한 게임이 없습니다.</div>
  </div>
  <FooterNav />
</template> 

<script setup>
import { onMounted, ref } from 'vue'
import client from '../../api/api'
import HeaderComp from '../HeaderComp.vue'
import FooterNav from '../FooterNav.vue'

const games = ref([])

onMounted(async () => {
  const res = await client.get('/api/games/my-requests')
  games.value = res.data
})

function formatDate(dateStr) {
  if (!dateStr) return '미정'
  const date = new Date(dateStr)
  return date.toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })
}

function translateStatus(status) {
  switch (status) {
    case 'APPROVED': return '승인됨'
    case 'REQUESTED': return '대기 중'
    case 'REJECTED': return '거절됨'
    default: return '알 수 없음'
  }
}

async function cancelRequest(gameId) {
  await client.post(`/api/games/cancel-request`, { gameId })
  games.value = games.value.filter(g => g.id !== gameId)
}
</script>
