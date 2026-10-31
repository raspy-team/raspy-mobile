<template>
  <component
    :is="to ? 'router-link' : 'button'"
    :to="to"
    :type="to ? undefined : type"
    :disabled="to ? undefined : disabled || loading"
    :aria-busy="loading || undefined"
    class="relative inline-flex items-center justify-center gap-2 rounded-xl select-none transition-[background-color,color,transform] active:scale-[0.98] disabled:pointer-events-none"
    :class="[VARIANTS[variant], SIZES[size], block ? 'w-full' : '', disabled && !loading ? 'opacity-40' : '']"
  >
    <!-- 기다리는 동안 글자 자리는 그대로 두고 그 위에 스피너 (버튼 폭이 흔들리지 않게) -->
    <span v-if="loading" class="absolute inset-0 flex items-center justify-center"><UiSpinner size="sm" /></span>
    <span class="inline-flex items-center justify-center gap-2" :class="{ invisible: loading }">
      <i v-if="icon" :class="icon" aria-hidden="true"></i>
      <slot />
    </span>
  </component>
</template>

<script setup>
import UiSpinner from './UiSpinner.vue'
// 앱의 모든 버튼. 화면에서 버튼 색·크기를 직접 정하지 말고 variant/size로 고른다
// - primary: 화면의 주 행동 (한 화면에 하나)
// - secondary: 나란히 놓이는 보조 행동
// - ghost: 글자만 있는 가벼운 행동 (취소, 더 보기)
// - tonal: 목록 안에서 반복되는 행동 (카드마다 있는 '신청'). 주 행동과 다투지 않게 옅게
// - danger: 되돌릴 수 없는 행동 (삭제, 탈퇴)
import { defineProps } from 'vue'

defineProps({
  variant: { type: String, default: 'primary' },
  size: { type: String, default: 'md' },
  block: { type: Boolean, default: false },
  icon: { type: String, default: '' }, // 예: 'fas fa-plus'
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  type: { type: String, default: 'button' },
  to: { type: [String, Object], default: null },
})

const VARIANTS = {
  primary: 'bg-primary text-white font-bold active:bg-primary-press',
  secondary: 'bg-surface-2 text-fg font-medium active:bg-line-strong',
  ghost: 'bg-transparent text-fg-muted font-medium active:bg-surface-2',
  tonal: 'bg-primary-soft text-primary-fg font-bold active:bg-primary/25',
  danger: 'bg-danger-soft text-danger-fg font-medium active:bg-danger/25',
}
// 높이는 손가락으로 누르기 쉬운 크기 이상 (sm도 36px)
const SIZES = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-base',
  lg: 'h-14 px-5 text-base',
}
</script>
