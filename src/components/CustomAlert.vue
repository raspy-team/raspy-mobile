<template>
  <div class="fixed top-24 left-1/2 transform -translate-x-1/2 bg-white border px-6 py-4 shadow-lg z-50 rounded-lg w-[93vw] max-w-xl text-center">
    <p class="text-gray-800 font-medium mb-4">{{ message }}</p>
    <div class="flex justify-center space-x-4">
      <button @click="$emit('confirm')" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">신청</button>
      <button @click="$emit('cancel')" class="bg-gray-300 px-4 py-2 rounded">취소</button>
    </div>
  </div>
</template>

<script setup>
import {defineProps, defineEmits} from 'vue'
defineProps({ message: String })
defineEmits(['confirm', 'cancel'])
</script>
