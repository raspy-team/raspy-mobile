<template>
  <div>
    <div class="flex items-center justify-between">
      <span class="t-caption">{{ over ? '끝' : `${level}개` }} · 남은 기회 {{ LIVES - strikes }}</span>
      <span class="t-mono tabular-nums" :class="remaining <= 20 ? 'text-danger' : 'text-fg-muted'">{{ clock }}</span>
    </div>
    <p class="t-caption mt-1 h-5">{{ hint }}</p>

    <!-- 5×8 판. 1을 누르면 나머지 숫자가 가려진다 -->
    <div class="grid grid-cols-5 gap-1.5 mt-3 select-none touch-manipulation" role="group" aria-label="숫자 판">
      <button
        v-for="cell in CELLS"
        :key="`${round}-${cell}`"
        type="button"
        class="aspect-square rounded-xl t-title tabular-nums flex items-center justify-center transition-colors"
        :class="cellClass(cell - 1)"
        :disabled="over || pausing || tapped.includes(cell - 1)"
        :aria-label="label(cell - 1)"
        @pointerdown.prevent="tap(cell - 1)"
        @keydown.enter.prevent="!$event.repeat && tap(cell - 1)"
        @keydown.space.prevent="!$event.repeat && tap(cell - 1)"
      >
        {{ showNumber(cell - 1) }}
      </button>
    </div>
    <p class="t-caption text-center mt-3">가장 많이 외운 개수가 점수예요. 틀려도 세 번까지는 이어 가요</p>
  </div>
</template>

<script setup lang="ts">
// 숫자 자리 (서버 NumberSpotsGame). 문제는 씨앗 수, 답은 시도마다 "단계:누른 칸,..."를 '|'로.
// 판은 서버와 똑같이 그린다: layout()을 고치면 NumberSpotsGame.layout도 함께 고친다
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { haptic } from '../../utils/haptics'

const props = defineProps<{ problem: string; timeLimitSeconds: number; submitting: boolean }>()
const emit = defineEmits<{ submit: [answer: string] }>()

const COLS = 5
const CELLS = COLS * 8
const START = 4
const MAX_LEVEL = 30
const LIVES = 3

function layout(seed: number, level: number, strike: number): number[] {
  let a = (seed + level * 7919 + strike * 104729) | 0
  const next = () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const c = [...Array(CELLS).keys()]
  for (let i = c.length - 1; i >= 1; i--) {
    const j = Math.floor(next() * (i + 1))
    ;[c[i], c[j]] = [c[j], c[i]]
  }
  return c.slice(0, level)
}

const seed = Number(props.problem.trim())
const level = ref(START)
const strikes = ref(0)
const round = ref(0) // 판이 바뀔 때마다 칸을 새로 그린다
const board = ref(layout(seed, START, 0))
const tapped = ref<number[]>([])
const attempts: string[] = []
const pausing = ref(false)
const missedAt = ref<number | null>(null)
const over = ref(false)

// 1을 누르기 전에는 숫자가 보이고, 누른 뒤에는 가려진다. 틀리면 잠깐 답을 보여 준다
const hidden = computed(() => tapped.value.length > 0 && missedAt.value === null)
const hint = computed(() => {
  if (over.value) return ''
  if (missedAt.value !== null) return '아깝다. 자리를 보고 새 판으로 다시'
  if (!tapped.value.length) return '자리를 외우고 1부터 눌러요'
  return ''
})

function showNumber(cell: number) {
  const n = board.value.indexOf(cell)
  if (n < 0 || tapped.value.includes(cell)) return ''
  return hidden.value ? '' : n + 1
}
function cellClass(cell: number) {
  if (missedAt.value === cell) return 'bg-danger text-white'
  if (tapped.value.includes(cell)) return 'bg-canvas'
  if (board.value.includes(cell)) return hidden.value ? 'bg-fg text-canvas' : 'bg-surface-3 text-fg'
  return 'bg-surface'
}
function label(cell: number) {
  const n = board.value.indexOf(cell)
  return n >= 0 && !hidden.value ? `${n + 1}` : `칸 ${cell + 1}`
}

function tap(cell: number) {
  if (over.value || pausing.value) return
  const want = board.value[tapped.value.length]
  tapped.value = [...tapped.value, cell]
  if (cell !== want) return miss(cell)
  haptic('tap')
  if (tapped.value.length === level.value) clear()
}

function record() {
  attempts.push(`${level.value}:${tapped.value.join(',')}`)
}

function nextBoard(delay: number) {
  pausing.value = true
  setTimeout(() => {
    missedAt.value = null
    tapped.value = []
    board.value = layout(seed, level.value, strikes.value)
    round.value++
    pausing.value = false
  }, delay)
}

function clear() {
  record()
  haptic('success')
  if (level.value >= MAX_LEVEL) return finish()
  level.value++
  nextBoard(350)
}

function miss(cell: number) {
  record()
  haptic('error')
  missedAt.value = cell
  tapped.value = tapped.value.slice(0, -1)
  strikes.value++
  if (strikes.value >= LIVES) {
    pausing.value = true
    setTimeout(finish, 900)
    return
  }
  nextBoard(1100)
}

let done = false
function finish() {
  if (done || props.submitting) return
  done = true
  over.value = true
  emit('submit', attempts.join('|'))
}

const startedAt = Date.now()
const remaining = ref(props.timeLimitSeconds)
const clock = computed(() => `${Math.floor(remaining.value / 60)}:${String(remaining.value % 60).padStart(2, '0')}`)
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  timer = setInterval(() => {
    remaining.value = Math.max(0, props.timeLimitSeconds - Math.floor((Date.now() - startedAt) / 1000))
    // 시간이 다 되면 그때까지의 시도만 낸다 (하던 판은 세지 않는다)
    if (remaining.value === 0) finish()
  }, 500)
})
onBeforeUnmount(() => clearInterval(timer))
</script>
