<template>
  <!-- 숫자가 점수판처럼 한 자리씩 아래에서 굴러 올라온다. 화면 읽기에는 값 그대로 -->
  <span class="ui-roll" :aria-label="String(value)">
    <span v-for="(ch, i) in chars" :key="i + ch" class="ui-roll-cell" aria-hidden="true">
      <span class="ui-roll-char" :style="{ animationDelay: delay + i * 70 + 'ms' }">{{ ch }}</span>
    </span>
  </span>
</template>

<script setup>
// 결과 점수·승률처럼 '나온 순간'이 중요한 숫자에 쓴다
import { computed, defineProps } from 'vue'
const props = defineProps({
  value: { type: [Number, String], required: true },
  delay: { type: Number, default: 0 }, // ms
})
const chars = computed(() => String(props.value).split(''))
</script>

<style>
.ui-roll { display: inline-flex; }
.ui-roll-cell { display: inline-block; overflow: hidden; line-height: 1; padding-bottom: 0.04em; }
.ui-roll-char { display: inline-block; animation: ui-roll-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) both; }
@keyframes ui-roll-in {
  from { transform: translateY(105%); }
  to { transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) { .ui-roll-char { animation: none; } }
</style>
