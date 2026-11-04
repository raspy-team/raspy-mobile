<template>
  <div class="text-center">
    <div class="flex items-center justify-between text-left">
      <span class="t-caption">{{ Math.min(round + 1, rounds.length) }} / {{ rounds.length }}판 · 박자 {{ current.length }}개</span>
      <span class="t-mono tabular-nums" :class="remaining <= 20 ? 'text-danger' : 'text-fg-muted'">{{ clock }}</span>
    </div>

    <p class="t-heading mt-8 h-7">{{ headline }}</p>
    <p class="t-caption h-5">{{ subline }}</p>

    <!-- 듣는 동안은 박자마다 원이 켜진다. 두드리는 동안은 원이 버튼이 된다. 누르는 순간(pointerdown)에 잰다 -->
    <button
      type="button"
      class="mt-8 mx-auto block w-52 h-52 rounded-full t-title select-none touch-manipulation transition-[background-color,transform] duration-75"
      :class="padClass"
      :disabled="submitting || state === 'done'"
      :aria-label="state === 'tap' ? '두드리기' : state === 'listen' ? '듣는 중' : '들어 보기'"
      @pointerdown.prevent="press"
      @keydown.enter.prevent="!$event.repeat && press($event)"
      @keydown.space.prevent="!$event.repeat && press($event)"
    >
      {{ state === 'tap' ? `${taps.length} / ${current.length}` : state === 'listen' ? '' : state === 'scored' ? '다음 판' : '들어 보기' }}
    </button>

    <ol class="mt-8 flex justify-center gap-2">
      <li v-for="(s, i) in scores" :key="i" class="t-caption tabular-nums px-2 py-1 rounded-md bg-surface">{{ s }}%</li>
    </ol>
  </div>
</template>

<script setup lang="ts">
// 박자 따라 하기 (서버 RhythmCopyGame): 문제는 판마다 박자 시각(첫 박 0, ms)을 ','로, 판은 '|'로. 답도 같은 꼴(첫 두드림 0).
// 점수 식은 서버와 같다 (30ms 안 = 맞음, 300ms = 0). 화면은 판마다 미리 보여 주기만 하고, 점수는 서버가 다시 낸다
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { haptic } from '../../utils/haptics'

const props = defineProps<{ problem: string; timeLimitSeconds: number; submitting: boolean }>()
const emit = defineEmits<{ submit: [answer: string] }>()

const PERFECT_MS = 30
const ZERO_MS = 300
/** 마지막 두드림 뒤 이만큼 더 없으면 그 판을 끝낸다 (박자 수보다 적게 두드렸을 때) */
const IDLE_MS = 1500

const rounds = computed(() => props.problem.split('|').map((r) => r.split(',').map(Number)))
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)])
const state = ref<'ready' | 'listen' | 'tap' | 'scored' | 'done'>('ready')
const lit = ref(false)
const taps = ref<number[]>([])
const answers: number[][] = []
const scores = ref<number[]>([])
let firstStamp = 0
let timers: ReturnType<typeof setTimeout>[] = []
let idle: ReturnType<typeof setTimeout> | undefined

const headline = computed(() => {
  if (state.value === 'listen') return '잘 들어 보세요'
  if (state.value === 'tap') return '같은 박자로 두드려요'
  if (state.value === 'scored') return `${scores.value[scores.value.length - 1]}%`
  if (state.value === 'done') return '다 했어요'
  return round.value === 0 ? '박자를 듣고 따라 두드려요' : '다음 박자'
})
const subline = computed(() => {
  if (state.value !== 'scored') return ''
  const s = scores.value[scores.value.length - 1]
  return s >= 95 ? '딱 맞았어요' : s >= 80 ? '조금만 더' : '박자가 흔들렸어요'
})
const padClass = computed(() => {
  if (state.value === 'listen') return lit.value ? 'bg-primary text-primary-on scale-105' : 'bg-surface-2 text-fg'
  if (state.value === 'tap') return 'bg-fg text-canvas motion-safe:active:scale-95'
  // '들어 보기'·'다음 판'은 화면의 주 행동이라 채운 색 (C 검토: 감 잡기와 같게)
  return 'bg-primary text-primary-on'
})

// 소리: 첫 누름(사용자 동작) 때 만든다. iOS는 그 전에는 소리를 낼 수 없다
let audio: AudioContext | null = null
function beep() {
  try {
    if (!audio) return
    const o = audio.createOscillator()
    const g = audio.createGain()
    o.frequency.value = 880
    g.gain.setValueAtTime(0.15, audio.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.08)
    o.connect(g).connect(audio.destination)
    o.start()
    o.stop(audio.currentTime + 0.09)
  } catch {
    // 소리를 못 내도 빛과 진동으로 한다
  }
}

function listen() {
  if (!audio) {
    try {
      audio = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    } catch {
      audio = null
    }
  }
  state.value = 'listen'
  const LEAD = 600
  timers = current.value.map((t) =>
    setTimeout(() => {
      lit.value = true
      beep()
      haptic('tap')
      setTimeout(() => (lit.value = false), 120)
    }, LEAD + t),
  )
  timers.push(setTimeout(() => {
    taps.value = []
    state.value = 'tap'
  }, LEAD + current.value[current.value.length - 1] + 700))
}

function roundScore(target: number[], got: number[]) {
  if (!got.length) return 0
  const per = target.map((t, i) => {
    if (got[i] == null) return 0
    const err = Math.abs(got[i] - t)
    return err <= PERFECT_MS ? 1 : err >= ZERO_MS ? 0 : (ZERO_MS - err) / (ZERO_MS - PERFECT_MS)
  })
  const extra = Math.max(0, got.length - target.length)
  return Math.round((Math.max(0, per.reduce((a, b) => a + b, 0) - extra) / target.length) * 100)
}

function endRound() {
  clearTimeout(idle)
  answers.push(taps.value.slice(0, 16))
  scores.value.push(roundScore(current.value, taps.value))
  haptic(scores.value[scores.value.length - 1] >= 95 ? 'success' : 'select')
  round.value++
  if (round.value >= rounds.value.length) {
    state.value = 'done'
    finish()
  } else state.value = 'scored'
}

function press(e: Event) {
  if (state.value === 'ready' || state.value === 'scored') return listen()
  if (state.value !== 'tap') return
  if (!taps.value.length) firstStamp = e.timeStamp
  taps.value = [...taps.value, Math.round(e.timeStamp - firstStamp)]
  beep()
  clearTimeout(idle)
  if (taps.value.length >= current.value.length) endRound()
  else idle = setTimeout(endRound, IDLE_MS)
}

const startedAt = Date.now()
const remaining = ref(props.timeLimitSeconds)
const clock = computed(() => `${Math.floor(remaining.value / 60)}:${String(remaining.value % 60).padStart(2, '0')}`)
let timer: ReturnType<typeof setInterval> | undefined

let done = false
function finish() {
  if (done || props.submitting) return
  done = true
  emit('submit', answers.map((a) => a.join(',')).join('|'))
}

onMounted(() => {
  timer = setInterval(() => {
    remaining.value = Math.max(0, props.timeLimitSeconds - Math.floor((Date.now() - startedAt) / 1000))
    // 시간이 다 되면 끝낸 판까지만 낸다
    if (remaining.value === 0) finish()
  }, 500)
})
onBeforeUnmount(() => {
  clearInterval(timer)
  clearTimeout(idle)
  timers.forEach(clearTimeout)
  audio?.close().catch(() => {})
})
</script>
