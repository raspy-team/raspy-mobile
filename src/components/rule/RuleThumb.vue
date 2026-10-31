<template>
  <span class="rounded-xl bg-surface-2 flex items-center justify-center flex-shrink-0" :style="{ width: size + 'px', height: size + 'px' }">
    <img v-if="!failed" :src="`/category-picture/${minor || '기타'}.png`" alt="" data-fallback="1" :style="{ width: size * 0.62 + 'px', height: size * 0.62 + 'px' }" @error="failed = true" />
    <i v-else class="fas fa-trophy text-fg-subtle" :style="{ fontSize: size * 0.4 + 'px' }" aria-hidden="true"></i>
  </span>
</template>

<script setup>
// 규칙 종목 그림. 그림이 없으면 같은 자리에 트로피 (깨진 그림 아이콘이 보이지 않게)
import { ref, defineProps } from 'vue'
defineProps({ minor: { type: String, default: '' }, size: { type: Number, default: 44 } })
const failed = ref(false)
</script>
