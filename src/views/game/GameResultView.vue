<template>
  <div class="h-dvh w-dvw flex flex-col relative overflow-hidden bg-white">

    <!-- 📌 로딩 오버레이 -->
    <div
      v-if="isLoading"
      class="fixed inset-0 z-50 flex justify-center items-center bg-white bg-opacity-70"
    >
      <div class="animate-spin rounded-full h-16 w-16 border-4 border-t-orange-500"></div>
    </div>

    <!-- 🎉 게임 결과 화면 -->
    <div v-else class="flex-1 overflow-y-auto px-4 py-4">
      <div class="max-w-xl mx-auto space-y-4 text-center pb-20">
        <!-- 승패 결과 -->
        <div v-if="winnerIdx != 0" class="space-y-0.5">
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
          class="relative max-w-md mx-auto my-6 px-6 py-8 rounded-2xl overflow-hidden shadow-2xl flex flex-col items-center champion-card-glow"
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

        <!-- 점수판 -->
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

        <!-- 경기 사진 섹션 -->
        <div class="p-2 space-y-2 text-left">
          <h3 class="text-lg font-bold text-gray-800">
            경기 사진 (최대 5장)
          </h3>

          <!-- 촬영/선택된 사진이 없을 때 -->
          <div v-if="allPictures.length === 0" class="text-center py-6 text-gray-400 bg-gray-50 rounded-lg">
            <i class="fas fa-images text-4xl mb-2"></i>
            <p class="text-sm mb-3">촬영된 사진이 없습니다</p>
            <button
              @click="openCamera"
              class="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow hover:brightness-110 transition"
            >
              <i class="fas fa-camera mr-1"></i> 사진 촬영하기
            </button>
          </div>

          <!-- 사진 목록 -->
          <div v-else class="space-y-3">
            <!-- 선택된 사진 (드래그로 순서 변경 가능) -->
            <div v-if="selectedPictures.length > 0">
              <p class="text-sm text-gray-600 mb-2">
                선택된 사진 ({{ selectedPictures.length }}/5) - 드래그하여 순서 변경
              </p>
              <div class="grid grid-cols-3 gap-2">
                <div
                  v-for="(pic, index) in selectedPictures"
                  :key="pic.id"
                  :data-index="index"
                  :class="[
                    'relative aspect-square rounded-lg overflow-hidden border-2 cursor-move touch-none transition-all duration-150',
                    isDragging && draggedIndex === index
                      ? 'opacity-50 scale-95 border-orange-300'
                      : touchCurrentIndex === index && isDragging
                        ? 'border-blue-500 scale-105'
                        : 'border-orange-500'
                  ]"
                  draggable="true"
                  @dragstart="handleDragStart(index)"
                  @dragover.prevent="handleDragOver"
                  @drop="handleDrop(index)"
                  @dragend="handleDragEnd"
                  @touchstart="handleTouchStart(index)"
                  @touchmove.prevent="handleTouchMove($event)"
                  @touchend="handleTouchEnd(index)"
                >
                  <img :src="pic.dataUrl" class="w-full h-full object-cover pointer-events-none" />
                  <div
                    class="absolute top-1 left-1 bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold pointer-events-none"
                  >
                    {{ index + 1 }}
                  </div>
                  <button
                    @click.stop="deselectPicture(pic.id)"
                    class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition z-10"
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

            <!-- 추가 촬영 버튼 (5장 미만일 때만 표시) -->
            <button
              v-if="allPictures.length < 5"
              @click="openCamera"
              class="w-full border-2 border-dashed border-orange-300 text-orange-500 py-3 rounded-lg text-sm font-semibold hover:bg-orange-50 transition"
            >
              <i class="fas fa-camera mr-1"></i> 사진 추가 촬영 ({{ allPictures.length }}/5)
            </button>
          </div>
        </div>

        <!-- 리뷰 남기기 -->
        <div class="p-2 space-y-1 text-left">
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
                class="flex-1 w-full p-4 text-base focus:outline-none resize-none bg-transparent"
                placeholder="상대방에게 남기고 싶은 말을 자유롭게 입력하세요."
                style="min-height: 60vh;"
                autofocus
              ></textarea>
            </div>
          </div>
        </div>

        <div class="flex justify-center gap-3 mt-4">
          <button class="px-4 py-2 rounded-lg bg-blue-100 text-blue-700 font-semibold shadow">친구 추가</button>
          <button class="px-4 py-2 rounded-lg bg-green-100 text-green-700 font-semibold shadow">결과 공유</button>
        </div>
      </div>
    </div>

    <!-- 하단 고정 버튼 -->
    <button
      @click="submitReviewAndGoHome"
      :disabled="isSubmitting"
      class="flex-shrink-0 w-full text-gray-800 py-4 bg-orange-500 text-white font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
    >
      제출하기
    </button>

    <!-- 제출 확인 모달 -->
    <div
      v-if="showConfirmModal"
      class="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center px-4"
    >
      <div class="bg-white w-full max-w-sm rounded-xl shadow-2xl p-6 text-center">
        <h3 class="text-lg font-bold text-gray-800 mb-4">경기 결과 제출</h3>
        <div class="text-left text-sm text-gray-700 space-y-2 mb-6">
          <p v-if="selectedPictures.length > 0">
            <i class="fas fa-check-circle text-green-500"></i>
            선택하신 사진 <span class="font-bold text-orange-500">{{ selectedPictures.length }}장</span>이 업로드됩니다.
          </p>
          <p v-else>
            <i class="fas fa-info-circle text-gray-400"></i>
            선택한 사진이 없습니다.
          </p>
          <p class="text-xs text-gray-500 mt-2">
            * 제출 후에는 수정할 수 없습니다.
          </p>
        </div>
        <div class="flex gap-3">
          <button
            @click="cancelSubmit"
            class="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
          >
            취소
          </button>
          <button
            @click="confirmSubmit"
            class="flex-1 px-4 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:brightness-110 transition shadow"
          >
            확인
          </button>
        </div>
      </div>
    </div>

    <!-- 제출 중 로딩 오버레이 -->
    <div
      v-if="isSubmitting"
      class="fixed inset-0 z-50 flex flex-col justify-center items-center bg-white bg-opacity-95"
    >
      <div class="animate-spin rounded-full h-16 w-16 border-4 border-t-orange-500 border-orange-200 mb-4"></div>
      <p class="text-lg font-semibold text-gray-700">제출 중...</p>
      <p class="text-sm text-gray-500 mt-2">잠시만 기다려주세요</p>
    </div>

    <!-- 숨겨진 카메라 input -->
    <input
      ref="cameraInputRef"
      type="file"
      accept="image/*"
      capture="environment"
      @change="onCameraChange"
      class="hidden"
    />

    <CustomToast />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../api/api'
import defaultImg from '../../assets/default.png'
import CustomToast from '../../components/CustomToast.vue'
import { useToast } from '../../composable/useToast'
import { getGamePictures, removeGamePicture, addGamePicture, compressImage } from '../../utils/gamePictureStorage'

const { showToast } = useToast()
const showReviewModal = ref(false)
const showConfirmModal = ref(false)
const isSubmitting = ref(false)
const cameraInputRef = ref(null)

// 자동 제출 함수들
function setManner(n) {
  review.value.manner = n
}
function setPerformance(n) {
  review.value.performance = n
}

function submitReviewAndGoHome() {
  // 리뷰 제출 전 유효성 검사
  if (review.value.manner === 0 || review.value.performance === 0) {
    showToast('매너와 퍼포먼스 평점을 모두 입력해주세요.')
    return
  }
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

  // 확인 모달 표시
  showConfirmModal.value = true
}

function confirmSubmit() {
  showConfirmModal.value = false
  isSubmitting.value = true

  // 사진 제출 후 리뷰 제출
  submitPictures()
    .then(() => {
      // 리뷰 제출
      return api.post(`/api/games/${gameId}/review`, review.value)
    })
    .then(() => {
      showToast('리뷰가 제출되었습니다.')
      // 약간의 딜레이 후 이동 (토스트 메시지 보이도록)
      setTimeout(() => {
        goHome()
      }, 500)
    })
    .catch(() => {
      isSubmitting.value = false
      showToast('잘못된 접근입니다.')
    })
}

function cancelSubmit() {
  showConfirmModal.value = false
}

const route = useRoute()
const router = useRouter()
const gameId = route.params.gameId

const isLoading = ref(true)
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

// 사진 관련 상태
const allPictures = ref([])
const selectedPictures = ref([])
const draggedIndex = ref(null)
const touchStartIndex = ref(null)
const touchCurrentIndex = ref(null)
const isDragging = ref(false)

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

// 카메라 열기
const openCamera = () => {
  if (allPictures.value.length >= 5) {
    showToast('최대 5장까지 촬영할 수 있습니다.')
    return
  }
  cameraInputRef.value?.click()
}

// 카메라 파일 선택 완료
const onCameraChange = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return

  if (allPictures.value.length >= 5) {
    showToast('최대 5장까지 촬영할 수 있습니다.')
    e.target.value = ''
    return
  }

  const reader = new FileReader()

  reader.onload = async (event) => {
    try {
      const dataUrl = event.target.result

      // 이미지 압축 (기본값 사용: 1200px, quality 0.6)
      const compressed = await compressImage(dataUrl)

      // localStorage에 저장
      addGamePicture(gameId, compressed)

      // 목록 갱신
      allPictures.value = getGamePictures(gameId)

      showToast('사진이 저장되었습니다!')
    } catch (error) {
      console.error('사진 저장 실패:', error)
      if (error.message === 'QUOTA_EXCEEDED') {
        showToast('저장 공간이 부족합니다. 일부 사진을 삭제한 후 다시 시도해주세요.')
      } else {
        showToast('사진 저장에 실패했습니다.')
      }
    }
  }

  reader.onerror = () => {
    console.error('파일 읽기 실패')
    showToast('사진 저장에 실패했습니다.')
  }

  reader.readAsDataURL(file)

  // input 초기화
  e.target.value = ''
}

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

// 드래그 시작 (마우스)
const handleDragStart = (index) => {
  draggedIndex.value = index
  isDragging.value = true
}

// 드래그 오버
const handleDragOver = (e) => {
  e.preventDefault()
}

// 드래그 종료
const handleDragEnd = () => {
  isDragging.value = false
  draggedIndex.value = null
}

// 드롭 (마우스)
const handleDrop = (dropIndex) => {
  if (draggedIndex.value === null) return

  const draggedItem = selectedPictures.value[draggedIndex.value]
  selectedPictures.value.splice(draggedIndex.value, 1)
  selectedPictures.value.splice(dropIndex, 0, draggedItem)

  isDragging.value = false
  draggedIndex.value = null
}

// 터치 드래그 시작
const handleTouchStart = (index) => {
  touchStartIndex.value = index
  isDragging.value = true
}

// 터치 드래그 중
const handleTouchMove = (e) => {
  if (touchStartIndex.value === null) return

  const touch = e.touches[0]
  const elementAtPoint = document.elementFromPoint(touch.clientX, touch.clientY)

  if (elementAtPoint) {
    const closestItem = elementAtPoint.closest('[data-index]')
    if (closestItem) {
      const newIndex = parseInt(closestItem.getAttribute('data-index'))
      touchCurrentIndex.value = newIndex
    }
  }
}

// 터치 드래그 종료
const handleTouchEnd = (dropIndex) => {
  if (touchStartIndex.value === null) return

  const targetIndex = touchCurrentIndex.value !== null ? touchCurrentIndex.value : dropIndex

  if (touchStartIndex.value !== targetIndex) {
    const draggedItem = selectedPictures.value[touchStartIndex.value]
    selectedPictures.value.splice(touchStartIndex.value, 1)
    selectedPictures.value.splice(targetIndex, 0, draggedItem)
  }

  isDragging.value = false
  touchStartIndex.value = null
  touchCurrentIndex.value = null
}

// 사진 제출
const submitPictures = async () => {
  if (selectedPictures.value.length === 0) {
    return Promise.resolve()
  }

  try {
    const formData = new FormData()

    selectedPictures.value.forEach((pic, index) => {
      const file = dataUrlToFile(pic.dataUrl, `game_${gameId}_${index}.jpg`)
      formData.append('pictures', file)
    })

    await api.post(`/api/games/${gameId}/pictures`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return Promise.resolve()
  } catch (err) {
    console.error('사진 제출 실패:', err)
    return Promise.reject(err)
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

const goHome = () => router.push(`/profile/0?id=${gameId}`)
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
</style>
