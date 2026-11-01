<template>
  <span class="rounded-xl bg-surface-2 flex items-center justify-center flex-shrink-0" :style="{ width: size + 'px', height: size + 'px' }">
    <img :src="categoryImage(rule || { minorCategory: minor })" alt="" :style="{ width: size * 0.62 + 'px', height: size * 0.62 + 'px' }" />
  </span>
</template>

<script setup>
// 규칙 종목 그림. 앱 전체가 이것 하나를 쓴다. 그림은 있는 것 중에서만 고르므로 깨지지 않는다
import { defineProps } from 'vue'
import { categoryImage } from '../../utils/rule'
defineProps({
  rule: { type: Object, default: null },
  minor: { type: String, default: '' },
  size: { type: Number, default: 44 },
})
</script>
