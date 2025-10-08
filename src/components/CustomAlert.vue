<template>
  <div class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
    <div class="modal-content bg-white border border-gray-200 px-8 py-6 rounded-2xl w-[92vw] max-w-md text-center animate-modal-in">
      <p class="text-gray-900 text-lg font-semibold mb-6">{{ message }}</p>
      <div class="flex justify-center gap-3">
        <button
          @click="$emit('confirm')"
          class="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white px-6 py-2 rounded-xl font-medium transition-all"
        >{{ confirmText }}</button>
        <button
          @click="$emit('cancel')"
          class="bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-800 px-6 py-2 rounded-xl font-medium border border-gray-200 transition-all"
        >{{ cancelText }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'
defineProps({
  message: String,
  confirmText: {
    type: String,
    default: '신청',
  },
  cancelText: {
    type: String,
    default: '취소',
  },
})
defineEmits(['confirm', 'cancel'])
</script>

<style>

.modal-content {
  animation: modal-in 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}
</style>
