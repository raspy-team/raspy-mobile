<template>
  <div class="flex flex-col items-center text-center py-14 px-6">
    <span v-if="icon" class="w-14 h-14 mb-5 rounded-2xl bg-surface-2 flex items-center justify-center text-fg-muted" aria-hidden="true">
      <UiIcon :name="icon" class="text-[26px]" />
    </span>
    <p class="t-heading">{{ title }}</p>
    <p v-if="description" class="t-caption mt-1.5 max-w-[30ch]">{{ description }}</p>
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
