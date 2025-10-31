<template>
  <div class="flex flex-col items-center justify-center min-h-screen px-3 bg-neutral-50">
    <div
      class="w-full max-w-sm bg-white rounded-2xl shadow-md px-7 py-10 flex flex-col items-center"
    >
      <i class="fas fa-trophy text-4xl text-orange-400 mb-2 animate-pop"></i>
      <div class="text-2xl font-extrabold text-gray-900 mb-2 text-center tracking-tight">
        경기 생성 완료!
      </div>
      <div class="text-sm text-gray-500 mb-8 text-center">
        이제 새로운 경기를 시작할 수 있습니다.
      </div>

      <button
        @click="goHome"
        class="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 text-lg font-bold rounded-xl transition"
      >
        <i class="fas fa-home mr-2"></i>
        내 경기 화면 가기
      </button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function goHome() {
  router.push('/game')
}
</script>

<style scoped>
.animate-pop {
  animation: popscale 0.22s cubic-bezier(0.24, 1.3, 0.51, 1.14);
}
@keyframes popscale {
  0% {
    transform: scale(0.7);
    opacity: 0;
  }
  60% {
    transform: scale(1.15);
    opacity: 1;
  }
  100% {
    transform: scale(1);
  }
}
</style>
