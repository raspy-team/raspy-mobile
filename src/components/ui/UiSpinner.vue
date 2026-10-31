<template>
  <svg :width="px" :height="px" viewBox="0 0 24 24" fill="none" class="ui-spinner flex-shrink-0" role="status" :aria-label="label">
    <circle cx="12" cy="12" r="9.5" stroke="currentColor" stroke-opacity="0.2" stroke-width="2.5" />
    <path d="M21.5 12a9.5 9.5 0 0 0-9.5-9.5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
  </svg>
</template>

<script setup>
// 기다리는 동안의 원형 스피너. 색은 글자색(currentColor)을 따른다
// 화면 전체를 기다릴 때는 스피너 대신 UiSkeleton으로 모양을 먼저 보여준다
import { computed, defineProps } from 'vue'
const props = defineProps({
  size: { type: String, default: 'md' }, // sm 16, md 20, lg 32
  label: { type: String, default: '불러오는 중' },
})
const px = computed(() => ({ sm: 16, md: 20, lg: 32 })[props.size] || 20)
</script>

<style scoped>
.ui-spinner {
  animation: ui-spin 0.8s linear infinite;
}
@media (prefers-reduced-motion: reduce) {
  .ui-spinner { animation-duration: 1.6s; }
}
</style>
