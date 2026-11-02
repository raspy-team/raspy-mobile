<template>
  <div>
    <p v-if="view.note" class="t-heading text-center whitespace-pre-line tabular-nums">{{ view.note }}</p>

    <!-- 보드: 빈칸을 누르면 "행,열"을 낸다 (내 차례이고 누를 수 있는 보드일 때만) -->
    <section v-for="(b, i) in view.boards" :key="i" class="mt-4">
      <p v-if="b.title" class="t-label mb-2">{{ b.title }}</p>
      <div
        class="grid border-l border-t border-line-strong mx-auto"
        :style="{ gridTemplateColumns: `repeat(${b.cols}, minmax(0, 1fr))`, maxWidth: b.cols > 10 ? '100%' : '22rem' }"
      >
        <button
          v-for="(cell, idx) in b.cells"
          :key="idx"
          type="button"
          class="aspect-square flex items-center justify-center bg-surface border-r border-b border-line-strong disabled:cursor-default"
          :class="{ 'active:bg-surface-2': canPlay(b, cell) }"
          :disabled="!canPlay(b, cell)"
          :aria-label="`${Math.floor(idx / b.cols) + 1}행 ${(idx % b.cols) + 1}열 ${LABEL[kind(cell)] || '빈칸'}`"
          @click="emit('move', `${Math.floor(idx / b.cols)},${idx % b.cols}`)"
        >
          <span v-if="kind(cell) === 'me'" class="w-[78%] h-[78%] rounded-full bg-fg" :class="{ 'ring-2 ring-signal': last(cell) }"></span>
          <span v-else-if="kind(cell) === 'op'" class="w-[78%] h-[78%] rounded-full bg-canvas border-2 border-fg" :class="{ 'ring-2 ring-signal': last(cell) }"></span>
          <span v-else-if="kind(cell) === 'ship'" class="w-full h-full bg-surface-3"></span>
          <span v-else-if="kind(cell) === 'hit'" class="w-full h-full flex items-center justify-center bg-danger-soft text-danger-fg" :class="{ 'ring-2 ring-inset ring-signal': last(cell) }"><UiIcon name="xmark" /></span>
          <span v-else-if="kind(cell) === 'miss'" class="w-2 h-2 rounded-full bg-fg-subtle" :class="{ 'ring-2 ring-signal': last(cell) }"></span>
        </button>
      </div>
    </section>

    <!-- 버튼: 가위바위보처럼 고르는 게임 -->
    <div v-if="view.choices?.length" class="grid gap-2 mt-6" :style="{ gridTemplateColumns: `repeat(${view.choices.length}, minmax(0, 1fr))` }">
      <UiButton v-for="c in view.choices" :key="c.value" size="lg" variant="secondary" :icon="c.icon || undefined" :disabled="!myTurn" :loading="sending && picked === c.value" @click="pick(c.value)">
        {{ c.label }}
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
// 서버가 준 판(TurnView)을 게임마다 화면을 만들지 않고 그린다: 보드 격자와 고르는 버튼 (가위바위보·편지 오목·배틀십)
import { ref, defineProps, defineEmits } from 'vue'
import type { components } from '@/api/schema'
import { UiButton, UiIcon } from '../ui'

type TurnView = components['schemas']['TurnView']
type TurnBoard = components['schemas']['TurnBoard']

const props = defineProps<{ view: TurnView; myTurn: boolean; sending: boolean }>()
const emit = defineEmits<{ (e: 'move', move: string): void }>()

const LABEL: Record<string, string> = { me: '내 돌', op: '상대 돌', ship: '내 배', hit: '맞힘', miss: '빗나감' }
const kind = (cell: string) => cell.split(' ')[0]
const last = (cell: string) => cell.includes('last')
const canPlay = (b: TurnBoard, cell: string) => b.playable && props.myTurn && !props.sending && kind(cell) === ''

const picked = ref('')
function pick(value: string) {
  picked.value = value
  emit('move', value)
}
</script>
