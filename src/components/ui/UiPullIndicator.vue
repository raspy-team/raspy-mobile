<template>
  <div class="overflow-hidden flex items-end justify-center transition-[height] duration-150" :style="{ height: (refreshing ? 52 : pull) + 'px' }" aria-live="polite">
    <!-- 당기는 만큼 매치 얼굴이 돌고, 새로고침하는 동안 굴러간다 -->
    <span
      v-if="refreshing || pull > 8"
      class="mb-3 text-fg"
      :class="refreshing ? 'pull-face-spin' : ''"
      :style="refreshing ? {} : { transform: `rotate(${Math.min(pull, 90) * 4}deg)`, opacity: Math.min(1, pull / 60) }"
      :aria-label="refreshing ? '새로고침 중' : undefined"
    >
      <BrandFace :size="26" :mood="pull >= 70 || refreshing ? 'smile' : 'neutral'" />
    </span>
  </div>
</template>

<script setup>
// usePullToRefresh와 짝. 목록 맨 위에 둔다
import { defineProps } from 'vue'
import BrandFace from '../BrandFace.vue'
defineProps({ pull: { type: Number, default: 0 }, refreshing: { type: Boolean, default: false } })
</script>

<style>
.pull-face-spin { display: inline-block; animation: pull-face-roll 0.9s cubic-bezier(0.45, 0, 0.55, 1) infinite; }
@keyframes pull-face-roll { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .pull-face-spin { animation-duration: 2.4s; } }
</style>
