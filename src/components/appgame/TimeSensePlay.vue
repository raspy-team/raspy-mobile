<template>
  <div class="text-center">
    <div class="flex items-center justify-between text-left">
      <span class="t-caption">{{ Math.min(round + 1, targets.length) }} / {{ targets.length }}번째</span>
      <span class="t-mono tabular-nums" :class="remaining <= 20 ? 'text-danger' : 'text-fg-muted'">{{ clock }}</span>
    </div>

    <p class="t-caption mt-8">이번 목표</p>
    <p class="t-display tabular-nums">{{ targets[Math.min(round, targets.length - 1)].toFixed(1) }}<span class="t-title">초</span></p>

    <!-- 초시계: 처음 1초만 보이고 사라진다. 그다음은 머릿속으로 센다 -->
    <p class="t-display t-mono tabular-nums mt-6 h-16" aria-live="off">
      <template v-if="state === 'running'">{{ shown }}</template>
      <template v-else-if="state === 'stopped' && last">{{ (last.measured / 1000).toFixed(2) }}</template>
      <template v-else>0.00</template>
    </p>
    <p class="t-body h-6" :class="last && last.error <= 50 ? 'text-fg font-semibold' : 'text-fg-muted'">
      <template v-if="state === 'running'">{{ hidden ? '마음속으로 세어 보세요' : '' }}</template>
      <template v-else-if="state === 'stopped' && last">{{ verdict(last.error) }}</template>
    </p>

    <!-- 누르는 순간(pointerdown)에 잰다. 손을 뗄 때 재면 누르고 있던 시간만큼 늦다 -->
    <button
      type="button"
      class="mt-8 w-44 h-44 rounded-full t-title select-none touch-manipulation transition-transform motion-safe:active:scale-95"
      :class="state === 'running' ? 'bg-primary text-primary-on' : 'bg-surface-2 text-fg'"
      :disabled="submitting || state === 'done'"
      @pointerdown.prevent="press"
    >
      {{ state === 'running' ? '멈춤' : state === 'stopped' ? '다음' : '시작' }}
    </button>

    <ol class="mt-8 space-y-1 text-left">
      <li v-for="(r, i) in records" :key="i" class="flex justify-between t-caption tabular-nums">
        <span>{{ targets[i].toFixed(1) }}초</span>
        <span>{{ (r.measured / 1000).toFixed(2) }}초 · {{ (r.error / 1000).toFixed(2) }} 차이</span>
      </li>
    </ol>
  </div>
</template>

<script setup lang="ts">
// 감 잡기 (서버 TimeSenseGame): 문제는 목표 초 셋 "7.5,3.0,11.5", 답은 잰 밀리초 셋 "7512,2987,11630".
// 시간은 화면이 잰다(누른 순간의 event.timeStamp). 서버는 세 값의 합이 자기가 잰 시간 안인지만 본다
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { haptic } from '../../utils/haptics'

const props = defineProps<{ problem: string; timeLimitSeconds: number; submitting: boolean }>()
const emit = defineEmits<{ submit: [answer: string] }>()

const SHOW_MS = 1000
const targets = computed(() => props.problem.split(',').map(Number))
const round = ref(0)
const state = ref<'ready' | 'running' | 'stopped' | 'done'>('ready')
const records = ref<{ measured: number; error: number }[]>([])
const last = computed(() => records.value[records.value.length - 1])

let startStamp = 0
const shown = ref('0.00')
const hidden = ref(false)
let raf = 0
function tick() {
  const ms = performance.now() - startStamp
  hidden.value = ms >= SHOW_MS
  shown.value = hidden.value ? '?.??' : (ms / 1000).toFixed(2)
  raf = requestAnimationFrame(tick)
}

function press(e: PointerEvent) {
  if (state.value === 'running') {
    cancelAnimationFrame(raf)
    const measured = Math.round(e.timeStamp - startStamp)
    const error = Math.abs(measured - Math.round(targets.value[round.value] * 1000))
    records.value.push({ measured, error })
    haptic(error <= 50 ? 'success' : 'tap')
    round.value++
    if (round.value >= targets.value.length) {
      state.value = 'done'
      finish()
    } else state.value = 'stopped'
    return
  }
  // 시작 (처음이거나 다음 판)
  startStamp = e.timeStamp
  state.value = 'running'
  haptic('tap')
  tick()
}

function verdict(error: number) {
  if (error <= 10) return '딱!'
  if (error <= 50) return `아깝다, ${(error / 1000).toFixed(2)}초 차이`
  if (error <= 200) return `${(error / 1000).toFixed(2)}초 차이`
  return `${(error / 1000).toFixed(2)}초나 빗나갔어요`
}

const startedAt = Date.now()
const remaining = ref(props.timeLimitSeconds)
const clock = computed(() => `${Math.floor(remaining.value / 60)}:${String(remaining.value % 60).padStart(2, '0')}`)
let timer: ReturnType<typeof setInterval> | undefined

let done = false
function finish() {
  if (done || props.submitting) return
  done = true
  emit('submit', records.value.map((r) => r.measured).join(','))
}

onMounted(() => {
  timer = setInterval(() => {
    remaining.value = Math.max(0, props.timeLimitSeconds - Math.floor((Date.now() - startedAt) / 1000))
    // 시간이 다 되면 잰 데까지만 낸다 (셋을 못 채우면 서버가 받지 않아 0점)
    if (remaining.value === 0) finish()
  }, 500)
})
onBeforeUnmount(() => {
  clearInterval(timer)
  cancelAnimationFrame(raf)
})
</script>
