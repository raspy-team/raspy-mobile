<template>
  <div>
    <div class="flex items-center justify-between">
      <span class="t-caption">숫자는 한 번씩, 다 안 써도 돼요</span>
      <span class="t-mono tabular-nums" :class="remaining <= 20 ? 'text-danger' : 'text-fg-muted'">{{ clock }}</span>
    </div>

    <p class="t-caption text-center mt-6">목표</p>
    <p class="t-display tabular-nums text-center">{{ target }}</p>

    <!-- 지금 식과 그 값. 값은 서버와 같은 규칙(나누어떨어질 때만 ÷)으로 화면이 미리 계산한다 -->
    <div class="mt-5 rounded-xl bg-surface px-4 py-3 min-h-[4.5rem]">
      <p class="t-title t-mono tabular-nums break-all">{{ shown || ' ' }}</p>
      <p class="t-caption mt-1 tabular-nums">
        <template v-if="value === null">{{ tokens.length ? '식을 이어 가세요' : '숫자를 눌러 시작해요' }}</template>
        <template v-else>= {{ value }} · {{ value === target ? '딱 맞아요!' : `${Math.abs(value - target)} 차이` }}</template>
      </p>
    </div>

    <div class="grid grid-cols-5 gap-2 mt-4">
      <button
        v-for="(n, i) in nums"
        :key="i"
        type="button"
        class="h-14 rounded-xl t-title tabular-nums transition-colors"
        :class="used.has(i) ? 'bg-canvas text-fg-subtle' : 'bg-surface-2 text-fg active:bg-surface-3'"
        :disabled="used.has(i) || lastIsNumber || lastIsClose"
        @click="push({ kind: 'num', i })"
      >
        {{ n }}
      </button>
    </div>
    <div class="grid grid-cols-6 gap-2 mt-2">
      <button
        v-for="op in OPS"
        :key="op.v"
        type="button"
        class="h-12 rounded-xl t-title bg-surface active:bg-surface-2 disabled:opacity-35"
        :aria-label="op.label"
        :disabled="!canOp(op.v)"
        @click="push({ kind: 'op', v: op.v })"
      >
        {{ op.text }}
      </button>
    </div>
    <div class="flex gap-2 mt-4">
      <UiButton variant="secondary" icon="rotate-left" :disabled="!tokens.length" @click="tokens.pop()">지우기</UiButton>
      <UiButton class="flex-1" size="lg" :loading="submitting" :disabled="value === null" @click="finish">이 식으로 내기</UiButton>
    </div>
    <p class="t-caption text-center mt-3">딱 맞히면 1000점에 빠를수록 더, 10 차이까지는 가까운 만큼. 오늘은 한 번만</p>
  </div>
</template>

<script setup lang="ts">
// 오늘의 셈 (서버 DailyNumberGame): 문제 "2,3,7,9,25;98", 답은 식 하나 "(25+7)*3+2"
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { UiButton } from '../ui'
import { haptic } from '../../utils/haptics'

const props = defineProps<{ problem: string; timeLimitSeconds: number; submitting: boolean }>()
const emit = defineEmits<{ submit: [answer: string] }>()

type Token = { kind: 'num'; i: number } | { kind: 'op'; v: string }
const OPS = [
  { v: '+', text: '+', label: '더하기' },
  { v: '-', text: '−', label: '빼기' },
  { v: '*', text: '×', label: '곱하기' },
  { v: '/', text: '÷', label: '나누기' },
  { v: '(', text: '(', label: '여는 괄호' },
  { v: ')', text: ')', label: '닫는 괄호' },
]

const nums = computed(() => props.problem.split(';')[0].split(',').map(Number))
const target = computed(() => Number(props.problem.split(';')[1]))
const tokens = ref<Token[]>([])
const used = computed(() => new Set(tokens.value.filter((t) => t.kind === 'num').map((t) => (t as { i: number }).i)))
const last = computed(() => tokens.value[tokens.value.length - 1])
const lastIsNumber = computed(() => last.value?.kind === 'num')
const lastIsClose = computed(() => last.value?.kind === 'op' && last.value.v === ')')
const depth = computed(() => tokens.value.reduce((d, t) => (t.kind === 'op' ? d + (t.v === '(' ? 1 : t.v === ')' ? -1 : 0) : d), 0))

// 숫자나 ')' 뒤에는 연산·')', 처음이나 연산·'(' 뒤에는 '('만
function canOp(v: string) {
  const afterValue = lastIsNumber.value || lastIsClose.value
  if (v === '(') return !afterValue
  if (v === ')') return afterValue && depth.value > 0
  return afterValue
}

function push(t: Token) {
  tokens.value.push(t)
  haptic('select')
}

const expr = computed(() => tokens.value.map((t) => (t.kind === 'num' ? nums.value[t.i] : t.v)).join(''))
const shown = computed(() => tokens.value.map((t) => (t.kind === 'num' ? nums.value[t.i] : OPS.find((o) => o.v === t.v)!.text)).join(' '))

/** 서버와 같은 규칙으로 계산. 덜 끝났거나 나누어떨어지지 않으면 null */
const value = computed<number | null>(() => {
  const s = expr.value
  let i = 0
  const fail = () => {
    throw new Error()
  }
  const factor = (): number => {
    if (s[i] === '(') {
      i++
      const v = sum()
      if (s[i] !== ')') fail()
      i++
      return v
    }
    const m = /^\d+/.exec(s.slice(i))
    if (!m) fail()
    i += m![0].length
    return Number(m![0])
  }
  const product = (): number => {
    let v = factor()
    while (s[i] === '*' || s[i] === '/') {
      const op = s[i++]
      const r = factor()
      if (op === '*') v *= r
      else {
        if (r === 0 || v % r !== 0) fail()
        v /= r
      }
    }
    return v
  }
  const sum = (): number => {
    let v = product()
    while (s[i] === '+' || s[i] === '-') {
      const op = s[i++]
      const r = product()
      v = op === '+' ? v + r : v - r
    }
    return v
  }
  try {
    if (!s) return null
    const v = sum()
    return i === s.length ? v : null
  } catch {
    return null
  }
})

const startedAt = Date.now()
const remaining = ref(props.timeLimitSeconds)
const clock = computed(() => `${Math.floor(remaining.value / 60)}:${String(remaining.value % 60).padStart(2, '0')}`)
let timer: ReturnType<typeof setInterval> | undefined

let done = false
function finish() {
  if (done || props.submitting) return
  done = true
  emit('submit', value.value === null ? '' : expr.value)
}

onMounted(() => {
  timer = setInterval(() => {
    remaining.value = Math.max(0, props.timeLimitSeconds - Math.floor((Date.now() - startedAt) / 1000))
    if (remaining.value === 0) finish()
  }, 500)
})
onBeforeUnmount(() => clearInterval(timer))
</script>
