<template>
  <div class="pb-[200px] relative overflow-hidden">
    
    <!-- 📌 로딩 오버레이 -->
    <div
      v-if="isLoading"
      class="fixed inset-0 z-50 flex justify-center items-center bg-white bg-opacity-70"
    >
      <div class="animate-spin rounded-full h-16 w-16 border-4 border-t-orange-500"></div>
    </div>

    <!-- 🎉 게임 결과 화면 -->
    <div v-else class="max-w-xl pb-24 mx-auto px-4 py-6 space-y-8 text-center">
      <!-- 승패 결과 -->
      <div v-if="winnerIdx != 0" class="space-y-2">
        <div v-if="user1.id == currentUserId">
          <template v-if="!((championIdx == 1 && idxCorrect) || (championIdx == 2 && !idxCorrect) || (championIdx == 2 && idxCorrect) || (championIdx == 1 && !idxCorrect))">
            <h2
              v-if="winnerIdx == 1"
              class="text-3xl font-extrabold bg-gradient-to-r from-blue-400 via-green-400 to-blue-500 bg-[length:200%_200%] bg-clip-text text-transparent animate-gradient-x"
              style="animation: gradient-x 2.5s linear infinite;"
            >
              승리하셨습니다!
            </h2>
            <h2
              v-else
              class="text-3xl font-extrabold text-gray-500"
            >
              패배하셨습니다.
            </h2>
          </template>
        </div>
        <div v-else-if="user2.id == currentUserId">
          <template v-if="!((championIdx == 1 && idxCorrect) || (championIdx == 2 && !idxCorrect) || (championIdx == 2 && idxCorrect) || (championIdx == 1 && !idxCorrect))">
            <h2
              v-if="winnerIdx == 2"
              class="text-3xl font-extrabold bg-gradient-to-r from-blue-400 via-green-400 to-blue-500 bg-[length:200%_200%] bg-clip-text text-transparent animate-gradient-x"
              style="animation: gradient-x 2.5s linear infinite;"
            >
              승리하셨습니다!
            </h2>
            <h2
              v-else
              class="text-3xl font-extrabold text-gray-500"
            >
              패배하셨습니다.
            </h2>
          </template>
        </div>
      </div>

      <div v-else>
        <i class="fas fa-handshake text-5xl text-gray-400 mb-2"></i>
        <h2 class="text-3xl font-bold text-gray-500">무승부</h2>
      </div>

      <!-- 챔피언 여부 카드: 승/패 모두 동일 문구와 스타일 -->
      <div
        v-if="(championIdx == 1 && idxCorrect) || (championIdx == 2 && !idxCorrect) || (championIdx == 2 && idxCorrect) || (championIdx == 1 && !idxCorrect)"
        class="relative max-w-md mx-auto my-8 px-6 py-10 rounded-2xl overflow-hidden shadow-2xl flex flex-col items-center champion-card-glow"
      >
        <div class="absolute inset-0 z-0 pointer-events-none champion-card-bg"></div>
        <div
          class="absolute inset-0 rounded-2xl border-2 border-white border-opacity-50 z-10"
          style="backdrop-filter: blur(2px)"
        ></div>
        <div class="relative z-20 flex flex-col items-center">
          <i class="fas fa-crown text-5xl mb-3 text-white drop-shadow champion-glow-anim"></i>
          <h2 class="text-2xl font-extrabold text-white mb-1 drop-shadow champion-glow-anim">
            오늘 새로운 챔피언이 탄생합니다.
          </h2>
        </div>
      </div>

      <!-- ...existing code... -->

  <div class="flex justify-around items-center py-4">
          <div class="flex flex-col items-center">
            <p class="text-[7rem] sm:text-[10rem] font-extrabold text-orange-500 mb-3 leading-none">{{ user1SetCount }}</p>
            <img
              :src="user1.profileUrl || defaultImg"
              class="w-16 h-16 rounded-full mb-1 border-2 border-orange-500"
            />
            <p class="text-sm font-semibold">{{ user1.nickname }}</p>
          </div>
          <div class="flex flex-col items-center mx-6 sm:mx-20">
            <span class="text-base sm:text-xl font-bold text-orange-900 mb-2 select-none">경기 종료</span>
            <span class="text-[5rem] sm:text-[8rem] font-extrabold text-orange-300 select-none leading-none self-center flex items-center" style="line-height:1;">:</span>
          </div>
          <div class="flex flex-col items-center">
            <p class="text-[7rem] sm:text-[10rem] font-extrabold text-orange-500 mb-3 leading-none">{{ user2SetCount }}</p>
            <img
              :src="user2.profileUrl || defaultImg"
              class="w-16 h-16 rounded-full mb-1 border-2 border-orange-500"
            />
            <p class="text-sm font-semibold">{{ user2.nickname }}</p>
          </div>
        </div>
      </div>



      <!-- 리뷰 남기기 -->
      <div
        class="p-5 space-y-4 text-left"
      >
        <h3 class="text-lg font-bold text-gray-800">
          {{ (user1.id == currentUserId ? user2.nickname : user1.nickname) }} 님을 평가해주세요
        </h3>

        <div class="space-y-1">
          <label class="text-sm font-medium text-gray-700">매너</label>
          <div class="flex gap-1">
            <i
              v-for="n in 5"
              :key="'manner' + n"
              @click="setManner(n)"
              :class="
                n <= review.manner ? 'fas fa-star text-orange-400' : 'far fa-star text-gray-300'
              "
              class="text-xl cursor-pointer w-6"
            ></i>
          </div>
        </div>

        <div class="space-y-1">
          <label class="text-sm font-medium text-gray-700">퍼포먼스</label>
          <div class="flex gap-1">
            <i
              v-for="n in 5"
              :key="'perf' + n"
              @click="setPerformance(n)"
              :class="
                n <= review.performance
                  ? 'fas fa-fire text-orange-400'
                  : 'fas fa-fire text-gray-300'
              "
              class="text-xl cursor-pointer w-6"
            ></i>
          </div>
        </div>

        <button
          @click="showReviewModal = true"
          class="w-full border border-gray-300 rounded-lg p-3 text-sm text-left text-gray-700 bg-white hover:bg-orange-50 transition"
        >
          <span v-if="review.text && review.text.length > 0">{{ review.text }}</span>
          <span v-else class="text-gray-400">텍스트 리뷰 (선택)</span>
        </button>

        <!-- Fullscreen review modal -->
        <div v-if="showReviewModal" class="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center">
          <div class="bg-white w-full h-full max-w-md mx-auto flex flex-col">
            <div class="flex items-center justify-between p-4 border-b">
              <span class="font-bold text-lg">리뷰 작성</span>
              <button @click="showReviewModal = false" class="text-orange-500 font-bold text-base">닫기</button>
            </div>
            <textarea
              v-model="review.text"
              @input="autoSubmitReview"
              class="flex-1 w-full p-4 text-base focus:outline-none resize-none bg-transparent"
              placeholder="상대방에게 남기고 싶은 말을 자유롭게 입력하세요."
              style="min-height: 60vh;"
              autofocus
            ></textarea>
          </div>
        </div>

        <!-- 리뷰 등록 버튼 제거 -->
      </div>

      <CustomToast />
    </div>
  <!-- ...existing code... -->
  

        <button
        @click="goHome"
        class="w-full fixed bottom-0 left-0 text-gray-800  py-2 py-[16px] raspy-bot  bg-orange-500 text-white"
      >
        나가기
      </button>
</template>

<script setup>
// ...existing code...
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../api/api'
import defaultImg from '../../assets/default.png'
import CustomToast from '../../components/CustomToast.vue'
import { useToast } from '../../composable/useToast'

const { showToast } = useToast()
const showReviewModal = ref(false)

// 자동 제출 함수들
function setManner(n) {
  review.value.manner = n
  autoSubmitReview()
}
function setPerformance(n) {
  review.value.performance = n
  autoSubmitReview()
}
function autoSubmitReview() {
  // 기존 submitReview 함수 내용 복사 (단, 중복 제출 방지)
  if (review.value.manner === 0 || review.value.performance === 0) {
    // 평점이 모두 입력되어야 제출
    return
  }
  // 비속어 검사
  const bannedWords = [
    'fuck','shit','asshole','bitch','bastard','dick','fucking','fucker','cunt','nigger','slut','whore','sex','sexy','nazi','motherfucker',
    '씨발','시발','씨바','ㅆㅂ','ㅅㅂ','ㅂㅅ','병신','새끼','좆','애미','개새끼','지랄','염병','꺼져','죽어','멍청','저능','존나','ㅄ','ㄱㅐ','ㅈㄴ','개같','더럽','섹스','자지','보지','딸딸이','빨아','꼬추','보빨','조까','좇','애비','년놈','암캐','걸레','쓰레기','창녀','미친놈','미친년',
  ]
  const lowerText = (review.value.text || '').toLowerCase()
  const found = bannedWords.find((word) => lowerText.includes(word))
  if (found) {
  showToast(`비속어("${found}")가 포함되어 있어 등록할 수 없습니다.`)
    return
  }
  // 서버 제출
  api.post(`/api/games/${gameId}/review`, review.value)
    .then(() => { showToast('리뷰가 제출되었습니다. 다시 입력하면 수정됩니다.'); })
    .catch(() => { showToast('잘못된 접근입니다.'); })
}
const route = useRoute()
const router = useRouter()
const gameId = route.params.gameId

const isLoading = ref(true)
// removed reviewSubmitted, always show review UI
const review = ref({ manner: 0, performance: 0, text: '' })
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
const idxCorrect = ref(true)
// ...existing code...

onMounted(async () => {
  try {
    const myIdRes = await api.get('/api/auth/current-user-id')
    currentUserId.value = myIdRes.data

    const res = await api.get(`/api/games/${gameId}/result`)
    game.value = res.data.gameSummary
    startDate.value = res.data.startDate
    setResults.value = res.data.setResults
    totalSetCount.value = res.data.totalSetCount
    drawCount.value = res.data.drawCount
    winnerIdx.value = res.data.winnerIdx
    championIdx.value = res.data.newChampionIdx
    idxCorrect.value = res.data.user1.id === currentUserId.value

    if (idxCorrect.value) {
      user1.value = res.data.user1
      user2.value = res.data.user2
      user1SetCount.value = res.data.user1SetCount
      user2SetCount.value = res.data.user2SetCount
    } else {
      user1.value = res.data.user2
      user2.value = res.data.user1
      user1SetCount.value = res.data.user2SetCount
      user2SetCount.value = res.data.user1SetCount
      winnerIdx.value = res.data.winnerIdx === 2 ? 1 : res.data.winnerIdx === 1 ? 2 : 0
    }
  } catch (err) {
    console.error(err)
  } finally {
    isLoading.value = false
  }
})
// ...removed unused submitReview...

const goHome = () => router.push(`/profile/0?id=${gameId}`)

// ...existing code...
</script>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}

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
  box-shadow:
    0 0 64px 8px #fdba7477,
    0 0 0 4px #fb923c55 inset;
  position: relative;
}

.champion-glow-anim {
  filter: drop-shadow(0 0 12px #fff7) drop-shadow(0 0 16px #fdba74bb);
  animation: champion-glow-anim 1.8s ease-in-out infinite alternate;
}

@keyframes champion-glow-anim {
  0% {
    filter: drop-shadow(0 0 16px #fff9) drop-shadow(0 0 8px #fdba74cc);
  }
  100% {
    filter: drop-shadow(0 0 28px #fff) drop-shadow(0 0 18px #fdba74);
  }
}

.fade-enter-active, .fade-leave-active {
  transition: max-height 0.3s, opacity 0.2s;
  overflow: hidden;
}
.fade-enter-from, .fade-leave-to {
  max-height: 0;
  opacity: 0;
}
.fade-enter-to, .fade-leave-from {
  max-height: 600px; /* 충분히 크게 */
  opacity: 1;
}


</style>

@keyframes gradient-x {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
.animate-gradient-x {
  animation: gradient-x 2.5s linear infinite;
}
