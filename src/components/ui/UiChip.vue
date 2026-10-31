<template>
  <button
    type="button"
    :aria-pressed="selected"
    class="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-sm transition-colors"
    :class="selected ? 'bg-fg text-canvas font-medium' : 'bg-surface text-fg-muted border border-line active:bg-surface-2'"
  >
    <i v-if="icon" :class="icon" class="text-xs" aria-hidden="true"></i>
    <slot />
  </button>
</template>

<script setup>
// 고를 수 있는 작은 알약 (카테고리, 필터). 선택되면 흰색으로 뒤집힌다
import { defineProps } from 'vue'
defineProps({ selected: { type: Boolean, default: false }, icon: { type: String, default: '' } })
</script>
