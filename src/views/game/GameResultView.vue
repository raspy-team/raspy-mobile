<template>
  <div class="max-w-xl mx-auto px-4 py-6 space-y-8 text-center">

  <!-- 승패 결과 -->
  <div v-if="winnerIdx != 0" class="space-y-2">
    <div v-if="user1.id == currentUserId">
      <i :class="winnerIdx == 1 ? 'fas fa-trophy text-orange-500' : 'fas fa-times-circle text-gray-400'" class="text-5xl mb-2"></i>
      <h2 class="text-3xl font-extrabold" :class="winnerIdx == 1 ? 'text-orange-500' : 'text-gray-500'">
        {{ winnerIdx == 1 ? '승리!' : '패배' }}
      </h2>
      <p class="text-gray-600" v-if="winnerIdx == 1">🎉 축하합니다 {{ user1.nickname }}님!</p>
    </div>
    <div v-else-if="user2.id == currentUserId">
      <i :class="winnerIdx == 2 ? 'fas fa-trophy text-orange-500' : 'fas fa-times-circle text-gray-400'" class="text-5xl mb-2"></i>
      <h2 class="text-3xl font-extrabold" :class="winnerIdx == 2 ? 'text-orange-500' : 'text-gray-500'">
        {{ winnerIdx == 2 ? '승리!' : '패배' }}
      </h2>
      <p class="text-gray-600" v-if="winnerIdx == 2">🎉 축하합니다 {{ user2.nickname }}님!</p>
    </div>
  </div>

  <div v-else>
    <i class="fas fa-handshake text-5xl text-gray-400 mb-2"></i>
    <h2 class="text-3xl font-bold text-gray-500">무승부</h2>
  </div>

  <!-- 게임 정보 카드 -->
  <div class="bg-white p-5 rounded-2xl shadow space-y-4 text-left border">
    <div class="text-sm font-medium text-gray-700 flex justify-end items-center">
      <!-- <span>{{ game.majorCategory }} - {{ game.minorCategory }}</span> -->
      <span class="text-xs text-gray-500 flex items-center gap-1">
        <i class="fas fa-map-marker-alt"></i> {{ matchPlace ? matchPlace : '장소미정 ' }} · {{ formatDate(startDate) }}
      </span>
    </div>

    <div class="flex justify-around items-center py-4">
      <div class="flex flex-col items-center">
        <img :src="user1.profileUrl || defaultImg" class="w-16 h-16 rounded-full mb-1 border-2 border-orange-500" />
        <p class="text-sm font-semibold">@{{ user1.nickname }}</p>
        <p class="text-2xl font-bold text-orange-500">{{ user1SetCount }}</p>
      </div>
      <div class="text-center text-xs text-gray-500">
        <p class="mb-1">세트</p>
        <p class="text-lg font-bold">{{ totalSetCount }}</p>
      </div>
      <div class="flex flex-col items-center">
        <img :src="user2.profileUrl || defaultImg" class="w-16 h-16 rounded-full mb-1 border-2 border-orange-500" />
        <p class="text-sm font-semibold">@{{ user2.nickname }}</p>
        <p class="text-2xl font-bold text-orange-500">{{ user2SetCount }}</p>
      </div>
    </div>
  </div>

  <!-- 세트별 결과 -->
  <div class="bg-gray-50 p-4 rounded-xl shadow space-y-3">
    <h3 class="text-lg font-bold text-gray-800 flex items-center gap-2"><i class="fas fa-list-ul"></i> 세트 결과</h3>
    <ul class="space-y-2">
      <li v-for="set in setResults" :key="set.setIdx" class="flex justify-between items-center bg-white p-3 rounded-lg shadow border text-sm">
        <span>{{ set.setIdx }}세트</span>
        <span>
          {{ set.user1Score }} : {{ set.user2SCore }}
          <i :class="set.winnerIdx == 1 ? 'fas fa-check-circle text-orange-500 ml-1' : set.winnerIdx == 2 ? 'fas fa-check-circle text-orange-500 ml-1' : 'fas fa-minus-circle text-gray-400 ml-1'"></i>
        </span>
      </li>
    </ul>
  </div>

  <!-- 리뷰 남기기 -->
  <div class="bg-white p-5 rounded-xl shadow space-y-4 text-left border">
    <h3 class="text-lg font-bold text-gray-800 flex items-center gap-2"><i class="fas fa-comment-dots"></i> 상대 리뷰 남기기</h3>
    
    <div class="space-y-1">
      <label class="text-sm font-medium text-gray-700">매너</label>
      <div class="flex gap-1">
        <i v-for="n in 5" :key="'manner' + n" @click="review.manner = n" 
           :class="n <= review.manner ? 'fas fa-star text-orange-400' : 'far fa-star text-gray-300'" 
           class="text-xl cursor-pointer w-6"></i>
      </div>
    </div>

    <div class="space-y-1">
      <label class="text-sm font-medium text-gray-700">퍼포먼스</label>
      <div class="flex gap-1">
        <i v-for="n in 5" :key="'perf' + n" @click="review.performance = n" 
           :class="n <= review.performance ? 'fas fa-fire text-orange-400' : 'fas fa-fire text-gray-300'" 
           class="text-xl cursor-pointer w-6"></i>
      </div>
    </div>

    <textarea v-model="review.text" rows="4" class="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="텍스트 리뷰 (선택)"></textarea>

    <button @click="submitReview" class="w-full bg-orange-500 text-white py-2 rounded-full font-bold shadow hover:brightness-110 transition">
      리뷰 등록
    </button>

    <button @click="goHome" class="w-full  text-gray-800 border py-2 rounded-full font-light shadow hover:brightness-110 transition">
      나가기
    </button>
  </div>
</div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../api/api'
import defaultImg  from '../../assets/default.png'

const route = useRoute()
const router = useRouter()
const gameId = route.params.gameId

const game = ref({})
const user1 = ref({})
const user2 = ref({})
const totalSetCount = ref(0)
const setResults = ref([])
const drawCount = ref(0)
const user1SetCount = ref(0)
const user2SetCount = ref(0)
const matchPlace = ref('')
const startDate = ref('')
const winnerIdx = ref(0)
const currentUserId = ref(0)

const review = ref({ manner: 0, performance: 0, text: '' })

onMounted(async () => {
  const res = await api.get(`/api/games/${gameId}/result`)
  game.value = res.data.gameSummary
  user1.value = res.data.user1
  user2.value = res.data.user2
  setResults.value = res.data.setResults
  totalSetCount.value = res.data.totalSetCount
  drawCount.value = res.data.drawCount
  user1SetCount.value = res.data.user1SetCount
  user2SetCount.value = res.data.user2SetCount
  winnerIdx.value = res.data.winnerIdx
  startDate.value = res.data.startDate

  const myId = await api.get(`/api/auth/current-user-id`)
  currentUserId.value = myId.data
})

const submitReview = async () => {
  if (review.value.manner === 0 || review.value.performance === 0) {
    alert('매너와 퍼포먼스 평점을 모두 입력해 주세요.')
    return
  }

  try {
    await api.post(`/api/games/${gameId}/review`, review.value)
    alert('리뷰가 등록되었습니다.')
    router.push('/my-games')
  } catch (err) {
    console.error(err)
    alert('리뷰 등록에 실패했습니다.')
  }
}


const goHome =()=>{ router.push("/") }

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })
}
</script>
