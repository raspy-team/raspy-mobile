<template>
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :aria-label="label"
    :disabled="disabled"
    class="relative w-12 h-7 rounded-full transition-colors flex-shrink-0 disabled:opacity-40"
    :class="modelValue ? 'bg-fg' : 'bg-line-strong'"
    @click="emit('update:modelValue', !modelValue)"
  >
    <span class="absolute top-0.5 left-0.5 w-6 h-6 rounded-full transition-transform" :class="modelValue ? 'translate-x-5 bg-canvas' : 'bg-fg'"></span>
  </button>
</template>

<script setup>
// 켜기·끄기. 바로 적용되는 설정에 쓴다 (저장 버튼 없이)
import { defineProps, defineEmits } from 'vue'
defineProps({
  modelValue: { type: Boolean, default: false },
  label: { type: String, required: true },
  disabled: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])
</script>
