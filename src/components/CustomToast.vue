<!-- ModernToast.vue -->
<template>
  <div
    v-if="toastMsg"
    class="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white px-5 py-3 rounded-xl shadow-md z-50 animate-toast-in w-[92vw] max-w-sm text-base font-semibold text-center"
  >
    {{ toastMsg }}
  </div>
</template>

<script setup>
import { toastMsg } from '../composable/useToast'
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
