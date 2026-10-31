<template>
  <div
    v-if="toastMsg"
    class="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-gray-800 border border-gray-700 text-white px-5 py-3 rounded-xl z-[10000000] animate-toast-in w-[92vw] max-w-sm text-sm text-center"
    role="status"
  >
    <div>{{ toastMsg }}</div>
    <button
      v-if="toastGoTo"
      @click="navigate"
      class="mt-2 text-orange-400 font-medium"
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
