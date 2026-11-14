<template>
  <span class="inline-flex items-center gap-1 h-6 px-2 rounded-md text-xs font-medium whitespace-nowrap" :class="TONES[tone]">
    <UiIcon v-if="icon" :name="icon" aria-hidden="true" />
    <slot />
  </span>
</template>

<script setup>
// 상태 표시 (매칭 중, 확정, 진행 중, 승리 ...). 누를 수 없다
import { defineProps } from 'vue'
defineProps({ tone: { type: String, default: 'neutral' }, icon: { type: String, default: '' } })
const TONES = {
  neutral: 'bg-surface-3 text-fg-muted',
  // 강조 상태. 예전엔 흰 칠이라 주 버튼과 무게가 같았다(내 경기 카드의 '확정' 옆에 흰 버튼). 칠 대신 또렷한 테두리 (11/14 전수 평가)
  primary: 'bg-surface-3 text-fg ring-1 ring-inset ring-fg/45',
  success: 'bg-success-soft text-success-fg',
  danger: 'bg-danger-soft text-danger-fg',
}
</script>
