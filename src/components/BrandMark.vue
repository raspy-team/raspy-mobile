<template>
  <span class="inline-flex items-center gap-2 text-fg" :style="{ fontSize: size }" aria-label="match">
    <!-- 두 사람이 만나 한 판: 겹친 두 원. 아이콘과 같은 선 굵기 -->
    <svg viewBox="0 0 32 20" :height="'1em'" :width="'1.6em'" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8.25" stroke="currentColor" stroke-width="1.75" />
      <circle cx="22" cy="10" r="8.25" stroke="currentColor" stroke-width="1.75" />
      <path d="M16 3.6a8.25 8.25 0 0 1 0 12.8a8.25 8.25 0 0 1 0-12.8z" fill="#d2ff4d" />
    </svg>
    <span v-if="!markOnly" class="font-semibold leading-none tracking-[-0.055em]" aria-hidden="true">match</span>
  </span>
</template>

<script setup>
// 매치 로고: 마크 + 'match' 글자. 크기는 size(글자 크기)로
import { defineProps } from 'vue'
defineProps({ size: { type: String, default: '24px' }, markOnly: { type: Boolean, default: false } })
</script>
