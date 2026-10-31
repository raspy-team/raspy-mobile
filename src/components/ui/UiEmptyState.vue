<template>
  <div class="flex flex-col items-center text-center py-14 px-6">
    <i v-if="icon" :class="icon" class="text-3xl text-fg-subtle mb-4" aria-hidden="true"></i>
    <p class="t-heading">{{ title }}</p>
    <p v-if="description" class="t-caption mt-1.5">{{ description }}</p>
    <div v-if="$slots.default" class="mt-6"><slot /></div>
  </div>
</template>

<script setup>
// 비어 있을 때: 무엇이 없는지 + 다음에 할 일(버튼)
import { defineProps } from 'vue'
defineProps({
  icon: { type: String, default: '' },
  title: { type: String, required: true },
  description: { type: String, default: '' },
})
</script>
