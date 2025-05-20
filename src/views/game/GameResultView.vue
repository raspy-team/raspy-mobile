<template>
  <div class="max-w-xl mx-auto px-4 py-6 space-y-6">
    <h2 class="text-3xl font-bold text-center">승리!</h2>
    <p class="text-center text-gray-600">축하합니다, 승리의 신 {{ winner.nickname }}님</p>

    <div class="bg-gray-100 p-4 rounded-xl">
      <div class="text-sm text-gray-700 mb-2">{{ game.majorCategory }} - {{ game.minorCategory }}</div>
      <div class="text-xs text-gray-500 mb-2">{{ game.place }} · {{ formatDate(game.matchDate) }}</div>

      <div class="flex justify-around items-center py-4">
        <div class="flex flex-col items-center">
          <img :src="game.user1.profileUrl" class="w-12 h-12 rounded-full mb-1" />
          <p class="text-sm font-medium">{{ game.user1.nickname }}</p>
          <p class="text-2xl font-bold">{{ game.user1.sets }}</p>
        </div>
        <span class="text-gray-500 text-sm">세트</span>
        <div class="flex flex-col items-center">
          <img :src="game.user2.profileUrl" class="w-12 h-12 rounded-full mb-1" />
          <p class="text-sm font-medium">{{ game.user2.nickname }}</p>
          <p class="text-2xl font-bold">{{ game.user2.sets }}</p>
        </div>
      </div>
    </div>

    <!-- 리뷰 작성 -->
    <div class="space-y-3">
      <h3 class="text-lg font-semibold">리뷰</h3>

      <div class="space-y-1">
        <label class="text-sm text-gray-600">매너</label>
        <div class="flex gap-1">
          <span v-for="n in 5" :key="'manner' + n" @click="review.manner = n" class="text-2xl cursor-pointer">
            {{ n <= review.manner ? '⭐' : '☆' }}
          </span>
        </div>
      </div>

      <div class="space-y-1">
        <label class="text-sm text-gray-600">퍼포먼스</label>
        <div class="flex gap-1">
          <span v-for="n in 5" :key="'perf' + n" @click="review.performance = n" class="text-2xl cursor-pointer">
            {{ n <= review.performance ? '🔺' : '△' }}
          </span>
        </div>
      </div>

      <textarea v-model="review.text" rows="4" class="w-full border border-gray-300 rounded-md p-2" placeholder="텍스트 리뷰 (선택)"></textarea>

      <button @click="submitReview" class="w-full bg-indigo-600 text-white py-2 rounded-md">완료</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../api/api'

const route = useRoute()
const router = useRouter()
const gameId = route.params.gameId

const game = ref({})
const winner = ref({})
const review = ref({ manner: 0, performance: 0, text: '' })

onMounted(async () => {
  const res = await api.get(`/api/games/${gameId}/result`)
  game.value = res.data
  winner.value = res.data.winner
})

const submitReview = async () => {
  await api.post(`/api/games/${gameId}/review`, review.value)
  alert('리뷰가 등록되었습니다.')
  router.push('/my-games')
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })
}
</script>
