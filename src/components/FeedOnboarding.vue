<template>
  <div
    v-if="isVisible"
    class="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black z-[99999] flex flex-col"
  >
    <!-- 슬라이드 컨테이너 -->
    <div class="flex-1 relative overflow-hidden">
      <div
        class="absolute inset-0 flex transition-transform duration-500 ease-out"
        :style="{ transform: `translateX(-${currentPage * 100}%)` }"
      >
        <!-- Page 1: 피드 탐색 -->
        <div class="w-full flex-shrink-0 flex flex-col items-center justify-center px-8">
          <div class="text-center space-y-8">
            <!-- 아이콘 -->
            <div class="relative inline-block">
              <div class="absolute inset-0 bg-orange-500/30 blur-3xl animate-pulse"></div>
              <div
                class="relative bg-gradient-to-br from-orange-400 to-orange-600 rounded-full p-8 shadow-2xl"
              >
                <i class="fas fa-newspaper text-6xl text-white"></i>
              </div>
            </div>

            <!-- 제목 -->
            <div class="space-y-4">
              <h1 class="text-4xl font-black text-white">피드 탐색하기</h1>
              <p class="text-lg text-gray-300 leading-relaxed">
                상하로 스와이프하여<br />
                다양한 경기와 초대를 확인하세요
              </p>
            </div>

            <!-- 애니메이션 데모 -->
            <div class="flex flex-col items-center gap-4 py-8">
              <div class="flex items-center gap-3">
                <i class="fas fa-arrow-up text-orange-400 text-3xl animate-bounce"></i>
                <span class="text-gray-400">위로 스와이프</span>
              </div>
              <div class="w-16 h-1 bg-gray-700 rounded-full"></div>
              <div class="flex items-center gap-3">
                <i class="fas fa-arrow-down text-orange-400 text-3xl animate-bounce"></i>
                <span class="text-gray-400">아래로 스와이프</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Page 2: 친구 추가 -->
        <div class="w-full flex-shrink-0 flex flex-col items-center justify-center px-8">
          <div class="text-center space-y-8">
            <!-- 아이콘 -->
            <div class="relative inline-block">
              <div class="absolute inset-0 bg-blue-500/30 blur-3xl animate-pulse"></div>
              <div
                class="relative bg-gradient-to-br from-blue-400 to-blue-600 rounded-full p-8 shadow-2xl"
              >
                <i class="fas fa-user-plus text-6xl text-white"></i>
              </div>
            </div>

            <!-- 제목 -->
            <div class="space-y-4">
              <h1 class="text-4xl font-black text-white">친구 추가하기</h1>
              <p class="text-lg text-gray-300 leading-relaxed">
                프로필을 좌우로 스와이프하여<br />
                친구를 추가하거나 건너뛸 수 있어요
              </p>
            </div>

            <!-- 애니메이션 데모 -->
            <div class="flex items-center justify-center gap-8 py-8">
              <div class="flex flex-col items-center gap-3">
                <i class="fas fa-arrow-left text-red-400 text-3xl animate-pulse"></i>
                <span class="text-gray-400 text-sm">건너뛰기</span>
              </div>
              <div
                class="w-20 h-20 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center shadow-xl"
              >
                <i class="fas fa-user text-3xl text-gray-400"></i>
              </div>
              <div class="flex flex-col items-center gap-3">
                <i class="fas fa-arrow-right text-green-400 text-3xl animate-pulse"></i>
                <span class="text-gray-400 text-sm">친구 추가</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Page 3: 경기 참여 -->
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
              <h1 class="text-4xl font-black text-white">경기 참여하기</h1>
              <p class="text-lg text-gray-300 leading-relaxed">
                초대를 수락하고<br />
                실시간으로 점수를 기록하세요
              </p>
            </div>

            <!-- 기능 리스트 -->
            <div class="space-y-4 py-8">
              <div class="flex items-center gap-4 bg-white/5 rounded-xl p-4 backdrop-blur-sm">
                <div
                  class="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center"
                >
                  <i class="fas fa-camera text-orange-400"></i>
                </div>
                <span class="text-gray-300 text-left flex-1">사진/동영상 촬영</span>
              </div>
              <div class="flex items-center gap-4 bg-white/5 rounded-xl p-4 backdrop-blur-sm">
                <div class="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <i class="fas fa-chart-line text-blue-400"></i>
                </div>
                <span class="text-gray-300 text-left flex-1">실시간 점수 기록</span>
              </div>
              <div class="flex items-center gap-4 bg-white/5 rounded-xl p-4 backdrop-blur-sm">
                <div
                  class="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center"
                >
                  <i class="fas fa-star text-purple-400"></i>
                </div>
                <span class="text-gray-300 text-left flex-1">경기 후 평가</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 페이지 인디케이터 -->
    <div class="flex justify-center gap-2 py-6">
      <div
        v-for="page in 3"
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
        v-if="currentPage < 2"
        @click="nextPage"
        class="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-lg shadow-2xl active:scale-95 transition-all"
      >
        다음
      </button>
      <button
        v-else
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

const emit = defineEmits(['complete'])

const isVisible = computed(() => {
  // / 경로이면서 show가 true일 때만 표시
  return route.path === '/' && props.show
})

const nextPage = () => {
  if (currentPage.value < 2) {
    currentPage.value++
  }
}

const skip = () => {
  complete()
}

const complete = () => {
  // localStorage.setItem('feedOnboardingCompleted', 'true') // TODO: 고병연 구현 완료 시 해제필요
  currentPage.value = 0 // 다음 번을 위해 페이지 리셋
  emit('complete')
}
</script>

<style scoped>
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
