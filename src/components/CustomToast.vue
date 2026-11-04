<template>
  <div
    v-if="toastMsg"
    class="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-toast w-[calc(100%-32px)] max-w-sm bg-fg text-canvas font-medium px-4 py-3 rounded-xl text-sm text-center animate-toast-in"
    role="status"
  >
    <div>{{ toastMsg }}</div>
    <button
      v-if="toastGoTo"
      @click="navigate"
      class="mt-2 underline underline-offset-2 font-semibold"
    >
      바로가기
    </button>
  </div>
</template>

<script setup>
import { toastMsg, toastGoTo } from '../composable/useToast'
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
