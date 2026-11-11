<template>
  <div>
    <!-- 첫 줄(점수)은 굵게, 나머지(지난 결과 등)는 보통 -->
    <template v-if="view.note">
      <p class="t-heading text-center tabular-nums">{{ noteLines[0] }}</p>
      <p v-if="noteLines.length > 1" class="t-body text-fg-muted text-center whitespace-pre-line tabular-nums mt-1">{{ noteLines.slice(1).join('\n') }}</p>
    </template>

    <!-- 문제 (퀴즈). 짧으면(초성·주사위처럼) 크게 -->
    <p v-if="view.prompt" class="text-center mt-6 break-keep whitespace-pre-line" :class="shortPrompt ? 't-display' : 't-title'">{{ view.prompt }}</p>

    <!-- 글로 답하기 (퀴즈) -->
    <!-- 긴 글(두 진실 한 거짓의 문장 셋)은 여러 줄 칸으로. 한 줄 칸이면 320px에서 앞 문장이 가려졌다. 줄을 바꿔 쓰면 ' / '로 나눠 보낸다 -->
    <form v-if="view.input" class="mt-4 flex gap-2" :class="longInput ? 'flex-col' : ''" @submit.prevent="answer">
      <UiInput ref="field" v-model="text" class="flex-1" :multiline="longInput" :rows="3" :maxlength="view.inputMax ?? 30" :placeholder="myTurn ? view.input : '다음 문제를 기다려요'" :disabled="!myTurn" />
      <UiButton :disabled="!myTurn || !text.trim()" :loading="sending" @click="answer">내기</UiButton>
    </form>

    <!-- 보드: 빈칸을 누르면 "행,열"을 낸다 (내 차례이고 누를 수 있는 보드일 때만) -->
    <section v-for="(b, i) in view.boards" :key="i" class="mt-4">
      <p v-if="b.title" class="t-label mb-2" :class="{ 'text-center': b.small }">{{ b.title }}</p>
      <div class="grid mx-auto" :class="b.lattice ? '' : 'border-l border-t border-line-strong'" :style="boardStyle(b)">
        <button
          v-for="(cell, idx) in b.cells"
          :key="idx"
          type="button"
          class="flex items-center justify-center disabled:cursor-default"
          :class="[
            b.lattice ? 'w-full h-full' : 'aspect-square bg-surface border-r border-b border-line-strong',
            { 'active:bg-surface-2': canPlay(b, cell), 'opacity-40': cell.includes('fade') },
          ]"
          :disabled="!canPlay(b, cell)"
          :aria-label="`${Math.floor(idx / b.cols) + 1}행 ${(idx % b.cols) + 1}열 ${/^n\d$/.test(kind(cell)) ? `숫자 ${kind(cell).slice(1)}` : LABEL[kind(cell)] || '빈칸'}`"
          @click="emit('move', `${Math.floor(idx / b.cols)},${idx % b.cols}`)"
        >
          <span v-if="kind(cell) === 'me'" class="w-[78%] h-[78%] rounded-full bg-fg" :class="{ 'ring-2 ring-signal': last(cell) }"></span>
          <span v-else-if="kind(cell) === 'op'" class="w-[78%] h-[78%] rounded-full bg-canvas border-2 border-fg" :class="{ 'ring-2 ring-signal': last(cell) }"></span>
          <!-- 내 배: 빈칸과 거의 같은 색이라 안 보였다 (UX ⑤). 밝은 칸으로 -->
          <span v-else-if="kind(cell) === 'ship'" class="w-[86%] h-[86%] rounded-md bg-fg-subtle"></span>
          <span v-else-if="kind(cell) === 'hit'" class="w-full h-full flex items-center justify-center bg-danger-soft text-danger-fg" :class="{ 'ring-2 ring-inset ring-signal': last(cell) }"><UiIcon name="xmark" /></span>
          <span v-else-if="kind(cell) === 'mine'" class="w-full h-full flex items-center justify-center bg-surface-3 text-fg-muted"><UiIcon name="bomb" /></span>
          <span v-else-if="kind(cell) === 'miss'" class="w-2 h-2 rounded-full bg-fg-subtle" :class="{ 'ring-2 ring-signal': last(cell) }"></span>
          <span v-else-if="kind(cell) === 'hint'" class="rounded-full border-2 border-fg-subtle" :class="b.lattice ? 'w-2 h-2' : 'w-[30%] h-[30%]'" aria-hidden="true"></span>
          <span v-else-if="kind(cell) === 'closed'" class="w-full h-full bg-surface-3" aria-hidden="true"></span>
          <span v-else-if="kind(cell) === 'open'" class="w-full h-full bg-canvas" aria-hidden="true"></span>
          <span v-else-if="kind(cell) === 'fill'" class="w-full h-full bg-fg" aria-hidden="true"></span>
          <span v-else-if="kind(cell) === 'line'" class="w-full h-full bg-fg rounded-sm" :class="{ 'ring-2 ring-signal': last(cell) }" aria-hidden="true"></span>
          <span v-else-if="/^n\d$/.test(kind(cell))" class="w-full h-full flex items-center justify-center bg-canvas t-heading tabular-nums">{{ kind(cell).slice(1) }}</span>
        </button>
      </div>
    </section>

    <!-- 버튼: 가위바위보처럼 고르는 게임. 못 고르는 수는 흐리게 -->
    <div v-if="view.choices?.length" class="grid gap-2 mt-6" :style="{ gridTemplateColumns: `repeat(${choiceCols}, minmax(0, 1fr))` }">
      <UiButton v-for="c in view.choices" :key="c.value" size="lg" variant="secondary" :icon="c.icon || undefined" :disabled="!myTurn || c.disabled || (sending && picked !== c.value)" :loading="sending && picked === c.value" @click="pick(c.value)">
        {{ c.label }}
      </UiButton>
    </div>

    <p v-if="view.hint" class="t-caption text-fg-subtle text-center mt-4 whitespace-pre-line">{{ view.hint }}</p>
  </div>
</template>

<script setup lang="ts">
// 서버가 준 판(TurnView)을 게임마다 화면을 만들지 않고 그린다: 보드 격자와 고르는 버튼 (가위바위보·편지 오목·배틀십)
import { computed, ref, watch, nextTick, defineProps, defineEmits } from 'vue'
import type { components } from '@/api/schema'
import { UiButton, UiIcon, UiInput } from '../ui'

type TurnView = components['schemas']['TurnView']
type TurnBoard = components['schemas']['TurnBoard']

const props = defineProps<{ view: TurnView; myTurn: boolean; sending: boolean }>()
const emit = defineEmits<{ (e: 'move', move: string): void }>()

const LABEL: Record<string, string> = { me: '내 돌', op: '상대 돌', ship: '내 배', hit: '맞힘', miss: '빗나감', mine: '지뢰', hint: '둘 수 있는 곳', open: '열린 칸', line: '그은 선', closed: '안 연 칸', fill: '찬 칸' }
const kind = (cell: string) => cell.split(' ')[0]
const last = (cell: string) => cell.includes('last')
// 빈칸과 '둘 수 있는 곳'(뒤집기)만 누를 수 있다
const canPlay = (b: TurnBoard, cell: string) => b.playable && props.myTurn && !props.sending && ['', 'hint', 'closed'].includes(kind(cell))

const noteLines = computed(() => (props.view.note ?? '').split('\n'))
const shortPrompt = computed(() => !!props.view.prompt && props.view.prompt.length <= 10 && !props.view.prompt.includes('\n'))

// 보드 크기: 작은 보드(미리보기), 점과 선 보드(짝수 줄은 좁게), 보통
function boardStyle(b: TurnBoard) {
  const maxWidth = b.small ? `${b.cols * 1.5}rem` : b.cols > 10 ? '100%' : '22rem'
  if (!b.lattice) return { gridTemplateColumns: `repeat(${b.cols}, minmax(0, 1fr))`, maxWidth }
  const track = (n: number) => Array.from({ length: n }, (_, i) => (i % 2 === 0 ? 'minmax(0, 0.28fr)' : 'minmax(0, 1fr)')).join(' ')
  const weight = (n: number) => Array.from({ length: n }, (_, i) => (i % 2 === 0 ? 0.28 : 1)).reduce((x, y) => x + y, 0)
  return { gridTemplateColumns: track(b.cols), gridTemplateRows: track(b.rows), aspectRatio: `${weight(b.cols)} / ${weight(b.rows)}`, maxWidth }
}

const text = ref('')
const field = ref<{ focus: () => void } | null>(null)
const longInput = computed(() => (props.view.inputMax ?? 30) > 60)
// 엔터는 폼 제출 한 길로만 온다(칸의 enter까지 받으면 한 번에 두 번 나갔다). 보내는 중에도 막는다 (목적 판정 8)
function answer() {
  if (!props.myTurn || props.sending || !text.value.trim()) return
  const t = longInput.value ? text.value.split('\n').map((l) => l.trim()).filter(Boolean).join(' / ') : text.value
  emit('move', t.trim())
}
// 낸 말은 받아들여져 차례가 넘어가거나 새 문제가 나올 때 지운다. 거절되면 그대로 두어 고쳐 낼 수 있게 (11/5 UX)
watch(() => props.myTurn, (mine) => { if (!mine) text.value = '' })
// 새 문제가 나오면 바로 칠 수 있게
watch(() => props.view.prompt, async () => {
  text.value = ''
  await nextTick()
  if (props.myTurn) field.value?.focus()
})

// 버튼 칸 수: 이름이 길면(5자 넘게) 두 칸, 아니면 넷까지 한 줄, 그 이상은 세 칸
const choiceCols = computed(() => {
  const cs = props.view.choices ?? []
  if (cs.length <= 2) return cs.length
  if (cs.some((c) => c.label.length > 5)) return 2
  return cs.length > 4 ? 3 : cs.length
})

const picked = ref('')
// 보내는 중에는 다른 버튼을 막는다 (예전엔 스피너는 고른 버튼에만 돌고 다른 버튼이 눌렸다, 경로 8 P9)
function pick(value: string) {
  if (props.sending) return
  picked.value = value
  emit('move', value)
}
</script>
