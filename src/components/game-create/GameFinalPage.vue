<template>
  <div class="flex flex-col items-center justify-center min-h-screen px-3 bg-neutral-50">
    <div
      class="w-full max-w-sm bg-white rounded-2xl shadow-md px-7 py-10 flex flex-col items-center"
    >
      <i class="fas fa-trophy text-4xl text-orange-400 mb-2 animate-pop"></i>
      <div class="text-2xl font-extrabold text-gray-900 mb-2 text-center tracking-tight">
        게임 생성 완료!
      </div>
      <div class="text-sm text-gray-500 mb-8 text-center">
        이제 새로운 경기를 시작할 수 있습니다.
      </div>
      <button
        v-if="game.friendId"
        @click="startGame"
        class="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white text-lg font-bold rounded-xl transition shadow mb-2"
      >
        <i class="fas fa-play-circle mr-2"></i>
        바로 시작하기
      </button>
      <button
        v-else
        @click="goHome"
        class="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 text-lg font-bold rounded-xl transition"
      >
        <i class="fas fa-home mr-2"></i>
        홈으로 가기
      </button>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../api/api' // api 인스턴스 경로에 맞게 조정

const props = defineProps(['game'])
const router = useRouter()

async function startGame() {
  try {
    // 서버에 경기 시작 요청 (POST)
    await api.post(`/api/games/${props.game.id}/start`)
    // 경기 플레이 페이지로 이동
    router.push(`/games/${props.game.id}/play`)
  } catch (e) {
    alert('경기 시작 실패: ' + (e.response?.data?.message ?? e.message))
  }
}

function goHome() {
  router.push('/')
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
