<template>
  <span class="tabular-nums" :aria-label="String(to)"><span aria-hidden="true">{{ shown }}</span></span>
</template>

<script setup lang="ts">
// 숫자가 from에서 to까지 세어 가다 멈춘다 (등급이 9에서 내려와 내 등급에서 멈춘다, 실력 점수가 전 점수에서 올라간다).
// 처음엔 빠르고 끝에서 느려진다. 움직임 줄이기면 바로 to
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'

const props = withDefaults(defineProps<{ from: number; to: number; duration?: number; delay?: number }>(), { duration: 900, delay: 150 })
const still = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const shown = ref(still ? props.to : props.from)
let raf = 0
let wait: ReturnType<typeof setTimeout> | undefined
function run() {
  cancelAnimationFrame(raf)
  if (still || props.from === props.to) { shown.value = props.to; return }
  const start = performance.now()
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / props.duration)
    const eased = 1 - Math.pow(1 - t, 3)
    shown.value = Math.round(props.from + (props.to - props.from) * eased)
    if (t < 1) raf = requestAnimationFrame(step)
  }
  raf = requestAnimationFrame(step)
}
onMounted(() => { wait = setTimeout(run, props.delay) })
watch(() => props.to, run)
onBeforeUnmount(() => { cancelAnimationFrame(raf); clearTimeout(wait) })
</script>
