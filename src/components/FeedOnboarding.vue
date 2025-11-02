<template>
  <div
    v-if="isVisible"
    class="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black z-[99999] flex flex-col pt-safe"
  >
    <!-- 슬라이드 컨테이너 -->
    <div class="flex-1 relative overflow-hidden">
      <div
        class="absolute inset-0 flex transition-transform duration-500 ease-out"
        :style="{ transform: `translateX(-${currentPage * 100}%)` }"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
      >
        <!-- Page 1: 주변에서 펼쳐지는 경기에 도전하세요 -->
        <div class="w-full flex-shrink-0 flex flex-col items-center justify-center px-8">
          <div class="text-center space-y-8">
            <!-- 아이콘 -->
            <div class="relative inline-block">
              <div class="absolute inset-0 bg-orange-500/30 blur-3xl animate-pulse"></div>
              <div
                class="relative bg-gradient-to-br from-orange-400 to-orange-600 rounded-full p-8 shadow-2xl"
              >
                <i class="fas fa-map-marker-alt text-6xl text-white"></i>
              </div>
            </div>

            <!-- 제목 -->
            <div class="space-y-4">
              <h1 class="text-4xl font-black text-white">주변에서 펼쳐지는<br />경기에 도전하세요</h1>
              <p class="text-lg text-gray-300 leading-relaxed">
                위치 기반으로 주변의<br />
                다양한 경기를 찾아보세요
              </p>
            </div>

            <!-- 애니메이션 데모 -->
            <div class="flex flex-col items-center gap-4 py-8">
              <div class="flex items-center gap-3">
                <i class="fas fa-search text-orange-400 text-3xl animate-pulse"></i>
                <span class="text-gray-400">주변 경기 탐색</span>
              </div>
              <div class="w-16 h-1 bg-gray-700 rounded-full"></div>
              <div class="flex items-center gap-3">
                <i class="fas fa-bolt text-orange-400 text-3xl animate-pulse"></i>
                <span class="text-gray-400">즉시 참여</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Page 2: 인증샷, 경기 중 촬영, 점수 기록 -->
        <div class="w-full flex-shrink-0 flex flex-col items-center justify-center px-8">
          <div class="text-center space-y-8">
            <!-- 아이콘 -->
            <div class="relative inline-block">
              <div class="absolute inset-0 bg-blue-500/30 blur-3xl animate-pulse"></div>
              <div
                class="relative bg-gradient-to-br from-blue-400 to-blue-600 rounded-full p-8 shadow-2xl"
              >
                <i class="fas fa-camera text-6xl text-white"></i>
              </div>
            </div>

            <!-- 제목 -->
            <div class="space-y-4">
              <h1 class="text-4xl font-black text-white">실시간 경기 경험</h1>
              <p class="text-lg text-gray-300 leading-relaxed">
                경기를 더욱 생생하게<br />
                기록하고 공유하세요
              </p>
            </div>

            <!-- 기능 리스트 -->
            <div class="space-y-4 py-8">
              <div class="flex items-center gap-4 bg-white/5 rounded-xl p-4 backdrop-blur-sm">
                <div
                  class="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center"
                >
                  <i class="fas fa-camera-retro text-orange-400"></i>
                </div>
                <span class="text-gray-300 text-left flex-1">인증샷 촬영</span>
              </div>
              <div class="flex items-center gap-4 bg-white/5 rounded-xl p-4 backdrop-blur-sm">
                <div class="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <i class="fas fa-video text-blue-400"></i>
                </div>
                <span class="text-gray-300 text-left flex-1">경기 중 촬영</span>
              </div>
              <div class="flex items-center gap-4 bg-white/5 rounded-xl p-4 backdrop-blur-sm">
                <div
                  class="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center"
                >
                  <i class="fas fa-chart-line text-purple-400"></i>
                </div>
                <span class="text-gray-300 text-left flex-1">점수 기록</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Page 3: 피드 및 랭킹 확인 -->
        <div class="w-full flex-shrink-0 flex flex-col items-center justify-center px-8">
          <div class="text-center space-y-8">
            <!-- 아이콘 -->
            <div class="relative inline-block">
              <div class="absolute inset-0 bg-purple-500/30 blur-3xl animate-pulse"></div>
              <div
                class="relative bg-gradient-to-br from-purple-400 to-purple-600 rounded-full p-8 shadow-2xl"
              >
                <i class="fas fa-trophy text-6xl text-white"></i>
              </div>
            </div>

            <!-- 제목 -->
            <div class="space-y-4">
              <h1 class="text-4xl font-black text-white">피드 및 랭킹 확인</h1>
              <p class="text-lg text-gray-300 leading-relaxed">
                다른 사람들의 경기 결과를<br />
                확인하고 순위를 경쟁하세요
              </p>
            </div>

            <!-- 기능 리스트 -->
            <div class="space-y-4 py-8">
              <div class="flex items-center gap-4 bg-white/5 rounded-xl p-4 backdrop-blur-sm">
                <div
                  class="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center"
                >
                  <i class="fas fa-newspaper text-orange-400"></i>
                </div>
                <span class="text-gray-300 text-left flex-1">실시간 피드</span>
              </div>
              <div class="flex items-center gap-4 bg-white/5 rounded-xl p-4 backdrop-blur-sm">
                <div class="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <i class="fas fa-medal text-blue-400"></i>
                </div>
                <span class="text-gray-300 text-left flex-1">랭킹 시스템</span>
              </div>
              <div class="flex items-center gap-4 bg-white/5 rounded-xl p-4 backdrop-blur-sm">
                <div
                  class="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center"
                >
                  <i class="fas fa-users text-purple-400"></i>
                </div>
                <span class="text-gray-300 text-left flex-1">커뮤니티</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Page 4: 이제 주변인들과의 경기가 시작됩니다 -->
        <div class="w-full flex-shrink-0 flex flex-col items-center justify-center px-8">
          <div class="text-center space-y-8">
            <!-- 아이콘 -->
            <div class="relative inline-block">
              <div class="absolute inset-0 bg-green-500/30 blur-3xl animate-pulse"></div>
              <div
                class="relative bg-gradient-to-br from-green-400 to-green-600 rounded-full p-8 shadow-2xl"
              >
                <i class="fas fa-play text-6xl text-white"></i>
              </div>
            </div>

            <!-- 제목 -->
            <div class="space-y-4">
              <h1 class="text-4xl font-black text-white">이제 주변인들과의<br />경기가 시작됩니다</h1>
              <p class="text-lg text-gray-300 leading-relaxed">
                당신의 즐거운 경기 경험으로<br />
                우리는 새롭게 이어집니다
              </p>
            </div>

            <!-- 시작 메시지 -->
            <div class="flex flex-col items-center gap-4 py-8">
              <div class="flex items-center gap-3">
                <i class="fas fa-map-marker-alt text-green-400 text-3xl animate-pulse"></i>
                <span class="text-gray-400">주변 사람들과 연결</span>
              </div>
              <div class="w-16 h-1 bg-gray-700 rounded-full"></div>
              <div class="flex items-center gap-3">
                <i class="fas fa-rocket text-green-400 text-3xl animate-pulse"></i>
                <span class="text-gray-400">즐거운 경기 시작</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 페이지 인디케이터 -->
    <div class="flex justify-center gap-2 py-6">
      <div
        v-for="page in 4"
        :key="page"
        class="transition-all duration-300"
        :class="
          currentPage === page - 1
            ? 'w-8 h-2 bg-orange-500 rounded-full'
            : 'w-2 h-2 bg-gray-600 rounded-full'
        "
      ></div>
    </div>

    <!-- 버튼 영역 -->
    <div class="px-8 pb-8 space-y-3">
      <button
        v-if="currentPage === 3"
        @click="complete"
        class="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-lg shadow-2xl active:scale-95 transition-all"
      >
        시작하기
      </button>
      <button
        @click="skip"
        class="w-full py-3 px-6 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-400 font-semibold backdrop-blur-sm active:scale-95 transition-all"
      >
        건너뛰기
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
})

const route = useRoute()
const currentPage = ref(0)

// 터치 슬라이드 관련 상태
const touchStartX = ref(0)
const touchEndX = ref(0)
const isDragging = ref(false)

const emit = defineEmits(['complete'])

const isVisible = computed(() => {
  // / 경로이면서 show가 true일 때만 표시
  return route.path === '/' && props.show
})

// 터치 슬라이드 핸들러
const handleTouchStart = (e) => {
  touchStartX.value = e.touches[0].clientX
  isDragging.value = true
}

const handleTouchMove = (e) => {
  if (!isDragging.value) return
  touchEndX.value = e.touches[0].clientX
}

const handleTouchEnd = () => {
  if (!isDragging.value) return

  const distance = touchStartX.value - touchEndX.value
  const isLeftSwipe = distance > 50  // 왼쪽으로 스와이프 (다음 페이지)
  const isRightSwipe = distance < -50 // 오른쪽으로 스와이프 (이전 페이지)

  if (isLeftSwipe && currentPage.value < 3) {
    currentPage.value++
  } else if (isRightSwipe && currentPage.value > 0) {
    currentPage.value--
  }

  isDragging.value = false
}

const skip = () => {
  complete()
}

const complete = () => {
  localStorage.setItem('feedOnboardingCompleted2', 'true')
  currentPage.value = 0 // 다음 번을 위해 페이지 리셋
  emit('complete')
}
</script>

<style scoped>
.pt-safe {
  padding-top: env(safe-area-inset-top);
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-bounce {
  animation: bounce 2s infinite;
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
