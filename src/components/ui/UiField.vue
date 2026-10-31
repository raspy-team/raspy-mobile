<template>
  <label class="block">
    <span v-if="label" class="t-label block mb-2">
      {{ label }}<span v-if="optional" class="text-fg-subtle font-normal"> (선택)</span>
    </span>
    <slot />
    <span v-if="error" class="block mt-1.5 text-sm text-danger-fg">{{ error }}</span>
    <span v-else-if="hint" class="block mt-1.5 t-micro">{{ hint }}</span>
  </label>
</template>

<script setup>
// 입력칸을 감싸는 틀: 이름, (선택) 표시, 도움말 또는 오류 한 줄
import { defineProps } from 'vue'
defineProps({
  label: { type: String, default: '' },
  hint: { type: String, default: '' },
  error: { type: String, default: '' },
  optional: { type: Boolean, default: false },
})
</script>
