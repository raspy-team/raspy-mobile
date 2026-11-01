<template>
  <!-- 바탕 위(목록·상세)에서는 회색 칸, 카드·목록 상자 안에서는 칸 없이 아이콘만 (상자 안에 상자를 두지 않게) -->
  <span
    class="flex items-center justify-center flex-shrink-0 text-fg"
    :class="bare ? '' : 'rounded-xl bg-surface-3'"
    :style="{ width: size + 'px', height: size + 'px' }"
  >
    <CategoryIcon :rule="rule || { minorCategory: minor }" :size="size * (bare ? 0.7 : 0.56) + 'px'" />
  </span>
</template>

<script setup>
// 규칙 종목 그림. 앱 전체가 이것 하나를 쓴다
import { defineProps } from 'vue'
import CategoryIcon from './CategoryIcon.vue'
defineProps({
  rule: { type: Object, default: null },
  minor: { type: String, default: '' },
  size: { type: Number, default: 44 },
  bare: { type: Boolean, default: false },
})
</script>
