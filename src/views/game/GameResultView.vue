<template>
  <div class="max-w-xl mx-auto px-4 py-6 space-y-8 text-center">

  <!-- 승패 결과 -->
  <div v-if="winnerIdx != 0" class="space-y-2">
    <div v-if="user1.id == currentUserId">
      <i :class="winnerIdx == 1 ? 'fas fa-trophy text-orange-500' : 'fas fa-times-circle text-gray-400'" class="text-5xl mb-2"></i>
      <h2 class="text-3xl font-extrabold" :class="winnerIdx == 1 ? 'text-orange-500' : 'text-gray-500'">
        {{ winnerIdx == 1 ? '승리!' : '패배' }}
      </h2>
      <p class="text-orange-600 mt-2 " v-if="winnerIdx == 1">축하합니다 {{ user1.nickname }}님!</p>
    </div>
    <div v-else-if="user2.id == currentUserId">
      <i :class="winnerIdx == 2 ? 'fas fa-trophy text-orange-500' : 'fas fa-times-circle text-gray-400'" class="text-5xl mb-2"></i>
      <h2 class="text-3xl font-extrabold" :class="winnerIdx == 2 ? 'text-orange-500' : 'text-gray-500'">
        {{ winnerIdx == 2 ? '승리!' : '패배' }}
      </h2>
      <p class="text-orange-600 mt-2 " v-if="winnerIdx == 2">축하합니다 {{ user2.nickname }}님!</p>
    </div>
  </div>

  <div v-else>
    <i class="fas fa-handshake text-5xl text-gray-400 mb-2"></i>
    <h2 class="text-3xl font-bold text-gray-500">무승부</h2>
  </div>


  <div
  v-if="(championIdx == 1 && currentUserId == user1.id) || (championIdx == 2 && currentUserId == user2.id)"
  class="relative max-w-md mx-auto my-8 px-6 py-10 rounded-2xl overflow-hidden shadow-2xl flex flex-col items-center champion-card-glow"
>
  <!-- 화려한 빛나는 애니메이션 배경 -->
  <div class="absolute inset-0 z-0 pointer-events-none champion-card-bg"></div>
  <!-- Soft outer 테두리 (glass 느낌) -->
  <div class="absolute inset-0 rounded-2xl border-2 border-white border-opacity-50 z-10" style="backdrop-filter: blur(2px);"></div>
  <!-- 중앙 컨텐츠 -->
  <div class="relative z-20 flex flex-col items-center">
    <i class="fas fa-crown text-5xl mb-3 text-white drop-shadow champion-glow-anim"></i>
    <h2 class="text-2xl font-extrabold text-white mb-1 drop-shadow champion-glow-anim">CHAMPION</h2>
    <span class="text-lg font-semibold text-white mb-2">축하합니다, {{ currentUserId == user1.id ? user1.nickname : user2.nickname }}님!</span>
    <span class="text-base text-white/90">새로운 챔피언 타이틀을 획득하셨습니다.</span>
  </div>
</div>

<div
  v-if="championIdx == 1 && currentUserId == user2.id || championIdx == 2 && currentUserId == user1.id"
  class="relative max-w-md mx-auto my-8 px-6 py-8 rounded-2xl bg-gray-100 flex flex-col items-center border border-gray-200 shadow"
>
  <i class="fas fa-frown text-2xl text-gray-400 mb-2"></i>
  <span class="text-base font-bold text-gray-700 mb-1">챔피언 타이틀을 빼앗겼습니다</span>
  <span class="text-xs text-gray-400">다음 기회를 노려보세요!</span>
</div>


  <!-- 게임 정보 카드 -->
  <div class="bg-white p-5 rounded-2xl shadow space-y-4 text-left border">
    <div class="text-sm font-medium text-gray-700 flex justify-end items-center">
      <!-- <span>{{ game.majorCategory }} - {{ game.minorCategory }}</span> -->
      <span class="text-xs text-gray-500 flex items-center gap-1">
        <i class="fas fa-map-marker-alt"></i> {{ game.matchLocation ? game.matchLocation : '장소미정 ' }} · {{ formatDate(startDate) }}
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
const startDate = ref('')
const winnerIdx = ref(0)
const currentUserId = ref(0)
const championIdx = ref(0)

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
  championIdx.value = res.data.newChampionIdx
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

<style scoped>
.champion-card-bg {
  background: linear-gradient(135deg, #fdba74 10%, #fb923c 70%, #f59e42 100%);
  filter: blur(0px) brightness(1.05) saturate(1.2);
  opacity: 0.98;
  animation: champion-bg-move 7s ease-in-out infinite alternate;
}

@keyframes champion-bg-move {
  0% {
    background-position: 0% 50%;
    filter: blur(0px) brightness(1.1) saturate(1.3);
  }
  50% {
    background-position: 100% 60%;
    filter: blur(2px) brightness(1.18) saturate(1.6);
  }
  100% {
    background-position: 0% 40%;
    filter: blur(0px) brightness(1.1) saturate(1.2);
  }
}

.champion-card-glow {
  box-shadow: 0 0 64px 8px #fdba7477, 0 0 0 4px #fb923c55 inset;
  position: relative;
}

.champion-glow-anim {
  filter: drop-shadow(0 0 12px #fff7) drop-shadow(0 0 16px #fdba74bb);
  animation: champion-glow-anim 1.8s ease-in-out infinite alternate;
}

@keyframes champion-glow-anim {
  0% { filter: drop-shadow(0 0 16px #fff9) drop-shadow(0 0 8px #fdba74cc);}
  100% { filter: drop-shadow(0 0 28px #fff) drop-shadow(0 0 18px #fdba74);}
}

</style>