<template>
  <span class="inline-flex items-center gap-1 h-6 px-2 rounded-md text-xs font-medium whitespace-nowrap" :class="TONES[tone]">
    <i v-if="icon" :class="icon" aria-hidden="true"></i>
    <slot />
  </span>
</template>

<script setup>
// 상태 표시 (매칭 중, 확정, 진행 중, 승리 ...). 누를 수 없다
import { defineProps } from 'vue'
defineProps({ tone: { type: String, default: 'neutral' }, icon: { type: String, default: '' } })
const TONES = {
  neutral: 'bg-surface-2 text-fg-muted',
  primary: 'bg-primary-soft text-primary-fg',
  success: 'bg-success-soft text-success-fg',
  danger: 'bg-danger-soft text-danger-fg',
}
</script>
