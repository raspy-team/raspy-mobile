<!-- CustomToast.vue -->
<template>
  <div
    v-if="toastMsg"
    class="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-black text-white px-4 py-2 rounded shadow z-50 animate-fadein w-[93vw] max-w-md text-center"
  >
    {{ toastMsg }}
  </div>
</template>

<script setup>
import { toastMsg } from '../composable/useToast'
</script>

<style>
@keyframes fadein {
  0% { opacity: 0; transform: translate(-50%, 10px); }
  100% { opacity: 1; transform: translate(-50%, 0); }
}
.animate-fadein {
  animation: fadein 0.3s ease-out;
}
</style>
