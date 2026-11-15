<template>
  <!-- 판의 남은 시간 한 벌 (quality-rules G3-1). 끝이 가까우면 빨개지고, 그 순간 한 번 알리고, 마지막 10초는 초마다 숫자가 튄다 -->
  <span :key="tick" class="tabular-nums whitespace-nowrap" :class="[near ? 'text-danger-fg' : muted ? 'text-fg-muted' : '', remaining <= 10 && remaining > 0 ? 'feel-pop inline-block' : '']" role="timer">
    <slot :clock="clock">{{ clock }}</slot>
  </span>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { feel } from '../../utils/feel'

// warn: 이 초부터 '끝이 가깝다'. 한 마디 20~30초 판은 10, 몇 분짜리 판은 30
const props = withDefaults(defineProps<{ remaining: number; warn?: number; muted?: boolean }>(), { warn: 10, muted: false })
const near = computed(() => props.remaining <= props.warn)
const clock = computed(() => `${Math.floor(props.remaining / 60)}:${String(props.remaining % 60).padStart(2, '0')}`)
// 마지막 10초만 초마다 새로 그려 튀게 한다 (그 전에는 같은 요소 그대로)
const tick = computed(() => (props.remaining <= 10 ? props.remaining : -1))
// 넘어가는 순간 한 번. 새 상황으로 시간이 다시 차면 다음에 또 알린다
watch(near, (now, before) => { if (now && !before && props.remaining > 0) feel('alert') })
</script>
