<template>
  <div class="pb-[200px]">
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
          <i
            :class="
              winnerIdx == 1 ? 'fas fa-trophy text-orange-500' : 'fas fa-times-circle text-gray-400'
            "
            class="text-5xl mb-2"
          ></i>
          <h2
            class="text-3xl font-extrabold"
            :class="winnerIdx == 1 ? 'text-orange-500' : 'text-gray-500'"
          >
            {{ winnerIdx == 1 ? '승리!' : '패배' }}
          </h2>
          <p class="text-orange-600 mt-2" v-if="winnerIdx == 1">
            축하합니다 {{ user1.nickname }}님!
          </p>
        </div>
        <div v-else-if="user2.id == currentUserId">
          <i
            :class="
              winnerIdx == 2 ? 'fas fa-trophy text-orange-500' : 'fas fa-times-circle text-gray-400'
            "
            class="text-5xl mb-2"
          ></i>
          <h2
            class="text-3xl font-extrabold"
            :class="winnerIdx == 2 ? 'text-orange-500' : 'text-gray-500'"
          >
            {{ winnerIdx == 2 ? '승리!' : '패배' }}
          </h2>
          <p class="text-orange-600 mt-2" v-if="winnerIdx == 2">
            축하합니다 {{ user2.nickname }}님!
          </p>
        </div>
      </div>

      <div v-else>
        <i class="fas fa-handshake text-5xl text-gray-400 mb-2"></i>
        <h2 class="text-3xl font-bold text-gray-500">무승부</h2>
      </div>

      <!-- 챔피언 여부 카드 -->
      <div
        v-if="(championIdx == 1 && idxCorrect) || (championIdx == 2 && !idxCorrect)"
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
            CHAMPION
          </h2>
          <span class="text-lg font-semibold text-white mb-2">
            축하합니다, {{ user1.nickname }}님!
          </span>
          <span class="text-base text-white/90">새로운 챔피언 타이틀을 획득하셨습니다.</span>
        </div>
      </div>

      <div
        v-if="(championIdx == 2 && idxCorrect) || (championIdx == 1 && !idxCorrect)"
        class="relative max-w-md mx-auto my-8 px-6 py-8 rounded-2xl bg-gray-100 flex flex-col items-center border border-gray-200 shadow"
      >
        <i class="fas fa-frown text-2xl text-gray-400 mb-2"></i>
        <span class="text-base font-bold text-gray-700 mb-1">챔피언 타이틀을 빼앗겼습니다</span>
        <span class="text-xs text-gray-400">다음 기회를 노려보세요!</span>
      </div>

      <!-- 게임 정보 카드 (아이콘 포함) -->
      <div class="bg-white p-5 rounded-2xl shadow space-y-4 text-left border">
        <div class="text-sm font-medium text-gray-700 flex justify-start items-center">
          <span class="text-xs text-gray-500 flex flex-col gap-1">
            <div>
              <i class="fas fa-map-marker-alt"></i>
              {{ game.matchLocation || '장소미정' }}
            </div>
            <div>
              <i class="fas fa-calendar-alt"></i>
              {{ formatDate(startDate) }}
            </div>
          </span>
        </div>

        <div class="flex justify-around items-center py-4">
          <div class="flex flex-col items-center">
            <img
              :src="user1.profileUrl || defaultImg"
              class="w-16 h-16 rounded-full mb-1 border-2 border-orange-500"
            />
            <p class="text-sm font-semibold">{{ user1.nickname }}</p>
            <p class="text-2xl font-bold text-orange-500">{{ user1SetCount }}</p>
          </div>
          <div class="text-center text-xs text-gray-500">
            <p class="mb-1">세트</p>
            <p class="text-lg font-bold">{{ totalSetCount }}</p>
          </div>
          <div class="flex flex-col items-center">
            <img
              :src="user2.profileUrl || defaultImg"
              class="w-16 h-16 rounded-full mb-1 border-2 border-orange-500"
            />
            <p class="text-sm font-semibold">{{ user2.nickname }}</p>
            <p class="text-2xl font-bold text-orange-500">{{ user2SetCount }}</p>
          </div>
        </div>
      </div>

      <!-- 세트 결과 -->
      <div class="bg-gray-50 p-4 rounded-xl shadow space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-bold text-gray-800 flex items-center gap-2">
            <i class="fas fa-list-ul"></i> 세트 결과
          </h3>
          <span
            @click="showSetResults = !showSetResults"
            class="flex items-center gap-1 select-none cursor-pointer text-orange-500 hover:text-orange-600 transition font-medium"
            style="user-select: none"
          >
            <span class="hidden sm:inline">{{ showSetResults ? '접기' : '펼치기' }}</span>
            <i
              :class="[
                'fas transition-transform duration-200',
                showSetResults ? 'fa-chevron-up' : 'fa-chevron-down',
              ]"
            ></i>
          </span>
        </div>
        <transition name="fade">
          <ul v-if="showSetResults" class="space-y-2">
            <li
              v-for="set in setResults"
              :key="set.setIdx"
              class="flex justify-between items-center bg-white p-3 rounded-lg shadow border text-sm"
            >
              <span>{{ set.setIdx }}세트</span>
              <span v-if="idxCorrect">
                {{ set.user1Score }} : {{ set.user2SCore }}
                <i
                  :class="
                    set.winnerIdx == 1
                      ? 'fas fa-check-circle text-orange-500 ml-1'
                      : set.winnerIdx == 2
                        ? 'fas fa-check-circle text-orange-500 ml-1'
                        : 'fas fa-minus-circle text-gray-400 ml-1'
                  "
                ></i>
              </span>
              <span v-else>
                {{ set.user2SCore }} : {{ set.user1Score }}
                <i
                  :class="
                    set.winnerIdx == 2
                      ? 'fas fa-check-circle text-orange-500 ml-1'
                      : set.winnerIdx == 1
                        ? 'fas fa-check-circle text-orange-500 ml-1'
                        : 'fas fa-minus-circle text-gray-400 ml-1'
                  "
                ></i>
              </span>
            </li>
          </ul>
        </transition>
      </div>

      <!-- 경기 사진 선택 -->
      <div class="bg-white p-5 rounded-xl shadow space-y-4 text-left border">
        <h3 class="text-lg font-bold text-gray-800 flex items-center gap-2">
          <i class="fas fa-camera"></i> 경기 사진 선택 (최대 5장)
        </h3>

        <!-- 촬영된 사진이 없을 때 -->
        <div v-if="allPictures.length === 0" class="text-center py-8 text-gray-400">
          <i class="fas fa-images text-4xl mb-2"></i>
          <p class="text-sm">경기 중 촬영한 사진이 없습니다</p>
        </div>

        <!-- 사진 목록 -->
        <div v-else>
          <!-- 선택된 사진 (드래그로 순서 변경 가능) -->
          <div v-if="selectedPictures.length > 0" class="mb-4">
            <p class="text-sm text-gray-600 mb-2">
              선택된 사진 ({{ selectedPictures.length }}/5) - 드래그하여 순서 변경
            </p>
            <div class="grid grid-cols-3 gap-2">
              <div
                v-for="(pic, index) in selectedPictures"
                :key="pic.id"
                class="relative aspect-square rounded-lg overflow-hidden border-2 border-orange-500 cursor-move"
                draggable="true"
                @dragstart="handleDragStart(index)"
                @dragover.prevent
                @drop="handleDrop(index)"
              >
                <img :src="pic.dataUrl" class="w-full h-full object-cover" />
                <div
                  class="absolute top-1 left-1 bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold"
                >
                  {{ index + 1 }}
                </div>
                <button
                  @click="deselectPicture(pic.id)"
                  class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition"
                >
                  <i class="fas fa-times text-xs"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- 선택 가능한 사진들 -->
          <div v-if="unselectedPictures.length > 0">
            <p class="text-sm text-gray-600 mb-2">사진 선택</p>
            <div class="grid grid-cols-4 gap-2">
              <div
                v-for="pic in unselectedPictures"
                :key="pic.id"
                class="relative aspect-square rounded-lg overflow-hidden border border-gray-300 cursor-pointer hover:border-orange-400 transition"
                @click="selectPicture(pic)"
              >
                <img :src="pic.dataUrl" class="w-full h-full object-cover" />
                <button
                  @click.stop="deletePicture(pic.id)"
                  class="absolute top-1 right-1 bg-gray-800 bg-opacity-60 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 transition"
                >
                  <i class="fas fa-trash text-xs"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 리뷰 남기기 -->
      <div
        v-if="!reviewSubmitted"
        class="bg-white p-5 rounded-xl shadow space-y-4 text-left border"
      >
        <h3 class="text-lg font-bold text-gray-800 flex items-center gap-2">
          <i class="fas fa-comment-dots"></i> 상대 리뷰 남기기
        </h3>

        <div class="space-y-1">
          <label class="text-sm font-medium text-gray-700">매너</label>
          <div class="flex gap-1">
            <i
              v-for="n in 5"
              :key="'manner' + n"
              @click="review.manner = n"
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
              @click="review.performance = n"
              :class="
                n <= review.performance
                  ? 'fas fa-fire text-orange-400'
                  : 'fas fa-fire text-gray-300'
              "
              class="text-xl cursor-pointer w-6"
            ></i>
          </div>
        </div>

        <textarea
          v-model="review.text"
          rows="4"
          class="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          placeholder="텍스트 리뷰 (선택)"
        ></textarea>

        <button
          @click="submitReview"
          class="w-full bg-orange-500 text-white py-3 rounded-[7px] font-bold shadow hover:brightness-110 transition"
        >
          리뷰 등록
        </button>
      </div>

      <!-- 사진 제출 버튼 (리뷰 제출 후에만 표시) -->
      <div
        v-if="reviewSubmitted && selectedPictures.length > 0 && !picturesSubmitted"
        class="bg-white p-5 rounded-xl shadow space-y-4 text-left border"
      >
        <h3 class="text-lg font-bold text-gray-800 flex items-center gap-2">
          <i class="fas fa-upload"></i> 선택한 사진 제출
        </h3>
        <p class="text-sm text-gray-600">
          {{ selectedPictures.length }}장의 사진이 선택되었습니다. 제출하시겠습니까?
        </p>
        <button
          @click="submitPictures"
          :disabled="isSubmittingPictures"
          class="w-full bg-orange-500 text-white py-3 rounded-[7px] font-bold shadow hover:brightness-110 transition disabled:opacity-50"
        >
          {{ isSubmittingPictures ? '업로드 중...' : '사진 제출' }}
        </button>
      </div>

      <CustomToast />
    </div>
  </div>

  <button
    @click="goHome"
    class="w-full fixed bottom-0 left-0 text-gray-800 py-2 py-[16px] raspy-bot bg-orange-500 text-white"
  >
    나가기
  </button>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../api/api'
import defaultImg from '../../assets/default.png'
import CustomToast from '../../components/CustomToast.vue'
import { useToast } from '../../composable/useToast'
import {
  getGamePictures,
  removeGamePicture,
  // updateGamePicturesOrder
} from '../../utils/gamePictureStorage'

const { showToast } = useToast()
const route = useRoute()
const router = useRouter()
const gameId = route.params.gameId

const isLoading = ref(true)
const reviewSubmitted = ref(false)
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
const showSetResults = ref(false)

// 사진 관련 상태
const allPictures = ref([])
const selectedPictures = ref([])
const draggedIndex = ref(null)
const picturesSubmitted = ref(false)
const isSubmittingPictures = ref(false)

// 선택되지 않은 사진들
const unselectedPictures = computed(() => {
  const selectedIds = new Set(selectedPictures.value.map((p) => p.id))
  return allPictures.value.filter((p) => !selectedIds.has(p.id))
})

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

    // 저장된 사진 불러오기
    allPictures.value = getGamePictures(gameId)
  } catch (err) {
    console.error(err)
  } finally {
    isLoading.value = false
  }
})

// 사진 선택
const selectPicture = (pic) => {
  if (selectedPictures.value.length >= 5) {
    showToast('최대 5장까지 선택할 수 있습니다.')
    return
  }
  selectedPictures.value.push(pic)
}

// 사진 선택 해제
const deselectPicture = (picId) => {
  selectedPictures.value = selectedPictures.value.filter((p) => p.id !== picId)
}

// 사진 삭제 (영구 삭제)
const deletePicture = (picId) => {
  if (!confirm('이 사진을 삭제하시겠습니까?')) return

  allPictures.value = removeGamePicture(gameId, picId)
  selectedPictures.value = selectedPictures.value.filter((p) => p.id !== picId)
}

// 드래그 시작
const handleDragStart = (index) => {
  draggedIndex.value = index
}

// 드롭
const handleDrop = (dropIndex) => {
  if (draggedIndex.value === null) return

  const draggedItem = selectedPictures.value[draggedIndex.value]
  selectedPictures.value.splice(draggedIndex.value, 1)
  selectedPictures.value.splice(dropIndex, 0, draggedItem)

  draggedIndex.value = null
}

// 사진 제출
const submitPictures = async () => {
  if (selectedPictures.value.length === 0) {
    showToast('선택된 사진이 없습니다.')
    return
  }

  isSubmittingPictures.value = true

  try {
    // FormData 생성
    const formData = new FormData()

    // 선택된 사진들을 File 객체로 변환하여 추가
    selectedPictures.value.forEach((pic, index) => {
      const file = dataUrlToFile(pic.dataUrl, `game_${gameId}_${index}.jpg`)
      formData.append('pictures', file)
    })

    // 백엔드 API 엔드포인트 (실제 API 경로에 맞게 수정 필요)
    await api.post(`/api/games/${gameId}/pictures`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    picturesSubmitted.value = true
    showToast('사진이 성공적으로 제출되었습니다!')
  } catch (err) {
    console.error('사진 제출 실패:', err)
    showToast('사진 제출에 실패했습니다. 다시 시도해주세요.')
  } finally {
    isSubmittingPictures.value = false
  }
}

// base64를 File 객체로 변환
const dataUrlToFile = (dataUrl, filename) => {
  const arr = dataUrl.split(',')
  const mime = arr[0].match(/:(.*?);/)[1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new File([u8arr], filename, { type: mime })
}

const submitReview = async () => {
  if (review.value.manner === 0 || review.value.performance === 0) {
    showToast('매너와 퍼포먼스 평점을 모두 입력해 주세요.')
    return
  }

  // ===== 비속어 검사 =====
  const bannedWords = [
    'fuck',
    'shit',
    'asshole',
    'bitch',
    'bastard',
    'dick',
    'fucking',
    'fucker',
    'cunt',
    'nigger',
    'slut',
    'whore',
    'sex',
    'sexy',
    'nazi',
    'motherfucker',
    '씨발',
    '시발',
    '씨바',
    'ㅆㅂ',
    'ㅅㅂ',
    'ㅂㅅ',
    '병신',
    '새끼',
    '좆',
    '애미',
    '개새끼',
    '지랄',
    '염병',
    '꺼져',
    '죽어',
    '멍청',
    '저능',
    '존나',
    'ㅄ',
    'ㄱㅐ',
    'ㅈㄴ',
    '개같',
    '더럽',
    '섹스',
    '자지',
    '보지',
    '딸딸이',
    '빨아',
    '꼬추',
    '보빨',
    '조까',
    '좇',
    '애비',
    '년놈',
    '암캐',
    '걸레',
    '쓰레기',
    '창녀',
    '미친놈',
    '미친년',
  ]

  const lowerText = (review.value.comment || '').toLowerCase()
  const found = bannedWords.find((word) => lowerText.includes(word))
  if (found) {
    showToast(`비속어("${found}")가 포함되어 있어 등록할 수 없습니다.`)
    return
  }

  try {
    await api.post(`/api/games/${gameId}/review`, review.value)
    reviewSubmitted.value = true
  } catch (err) {
    console.error(err)
    showToast('잘못된 접근입니다.')
    reviewSubmitted.value = true
  }
}

const goHome = () => router.push(`/profile/0?id=${gameId}`)

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })
}
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

.fade-enter-active,
.fade-leave-active {
  transition:
    max-height 0.3s,
    opacity 0.2s;
  overflow: hidden;
}
.fade-enter-from,
.fade-leave-to {
  max-height: 0;
  opacity: 0;
}
.fade-enter-to,
.fade-leave-from {
  max-height: 600px; /* 충분히 크게 */
  opacity: 1;
}
</style>
