<template>
  <button
    type="button"
    :aria-pressed="selected"
    @click="feel('select')"
    class="hit inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-sm whitespace-nowrap flex-shrink-0 transition-[background-color,color,transform] motion-safe:active:scale-95 disabled:opacity-35"
    :class="selected ? 'bg-surface-3 text-fg font-semibold border border-fg' : 'bg-transparent text-fg-muted border border-line-strong active:bg-surface-2'"
  >
    <UiIcon v-if="icon" :name="icon" class="text-xs" aria-hidden="true" />
    <slot />
  </button>
</template>

<script setup>
// 고를 수 있는 작은 알약 (카테고리, 필터). 고르면 테두리가 또렷해지고 글자가 굵어진다.
// 예전엔 흰색으로 뒤집혀 주 버튼과 같은 색이었다 (quality-rules H-3)
import { defineProps } from 'vue'
import { feel } from '../../utils/feel'
defineProps({ selected: { type: Boolean, default: false }, icon: { type: String, default: '' } })
</script>
