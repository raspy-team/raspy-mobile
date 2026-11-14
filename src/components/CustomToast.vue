<template>
  <!-- 알림 글. 주 버튼(흰색)과 헷갈리지 않게 떠 있는 어두운 알약으로, 한 줄에 '바로가기'까지 (11/14 전수 평가: 흰 덩어리가 본문 한가운데를 덮어 버튼처럼 보였다) -->
  <div
    v-if="toastMsg"
    class="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-toast w-max max-w-[calc(100%-32px)] flex items-center gap-3 bg-surface-3 text-fg border border-line-strong shadow-[0_8px_24px_rgba(0,0,0,0.35)] pl-4 pr-2 py-1.5 min-h-11 rounded-2xl text-sm animate-toast-in"
    :class="toastGoTo ? '' : 'pr-4'"
    role="status"
  >
    <span class="flex-1 min-w-0 py-1">{{ toastMsg }}</span>
    <button v-if="toastGoTo" type="button" class="hit flex-shrink-0 h-8 px-3 rounded-full bg-surface text-fg font-semibold whitespace-nowrap" @click="navigate">바로가기</button>
  </div>
</template>

<script setup>
import { toastMsg, toastGoTo } from '../composables/useToast'
import { useRouter } from 'vue-router'

const router = useRouter()
const navigate = () => {
  if (toastGoTo.value) {
    router.push(toastGoTo.value)
  }
}
</script>

<style>
@keyframes toast-in {
  0% { opacity: 0; transform: translate(-50%, 30px) scale(0.98);}
  100% { opacity: 1; transform: translate(-50%, 0) scale(1);}
}
.animate-toast-in {
  animation: toast-in 0.35s cubic-bezier(.37,.32,.29,1.22);
}
</style>
