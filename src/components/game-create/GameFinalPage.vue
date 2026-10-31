<template>
  <div class="flex flex-col justify-center min-h-screen px-5 bg-gray-900">
    <i class="fas fa-check text-3xl text-orange-500 mb-4"></i>
    <div class="text-2xl font-bold text-white mb-2">경기가 열렸어요</div>
    <div class="text-base text-gray-400 mb-10">
      상대가 신청하면 알려드려요. 내 경기에서 신청을 받고 장소와 시간을 정하면 돼요.
    </div>
    <button
      @click="goHome"
     class="w-full py-4 bg-orange-500 active:bg-orange-600 text-white text-base font-bold rounded-xl"
    >
      내 경기 보기
    </button>
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
