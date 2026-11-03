<template>
  <div class="flex flex-col items-center justify-center py-20 text-center" role="timer" aria-live="assertive">
    <p v-if="opponent" class="t-caption">{{ opponent }}님과 경기</p>
    <!-- key가 바뀔 때마다 숫자가 새로 튀어나온다 -->
    <span :key="count" class="countdown-pop block text-[96px] leading-none font-semibold tabular-nums tracking-[-0.05em] text-fg mt-4">{{ count }}</span>
    <p class="t-caption mt-6 max-w-xs">{{ hint || '곧 시작해요' }}</p>
  </div>
</template>

<script setup lang="ts">
// 판 시작 전 3·2·1. 시작 시각은 서버가 정한다(until: 서버 시각 ms, offset: 서버 시각 - 기기 시각). 끝나면 done
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { feel } from '../../utils/feel'

// hint: 게임 한 줄 설명 ('아무거나'로 처음 하는 게임이 걸려도 시작 전에 알게)
const props = defineProps<{ until: number; offset: number; opponent?: string; hint?: string }>()
const emit = defineEmits<{ done: [] }>()

const left = () => props.until - (Date.now() + props.offset)
const count = ref(Math.max(1, Math.ceil(left() / 1000)))
let timer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  feel('tap')
  timer = setInterval(() => {
    const ms = left()
    if (ms <= 0) {
      clearInterval(timer)
      feel('success')
      emit('done')
      return
    }
    const next = Math.ceil(ms / 1000)
    if (next !== count.value) {
      count.value = next
      feel('tap')
    }
  }, 50)
})
onBeforeUnmount(() => clearInterval(timer))
</script>

<style scoped>
.countdown-pop {
  animation: countdown-pop 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) both;
}
@keyframes countdown-pop {
  0% { opacity: 0; transform: scale(1.6); }
  25% { opacity: 1; transform: scale(1); }
  80% { opacity: 1; }
  100% { opacity: 0.6; transform: scale(0.94); }
}
@media (prefers-reduced-motion: reduce) {
  .countdown-pop { animation: none; }
}
</style>
