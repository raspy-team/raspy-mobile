<template>
  <!-- 앱 대결 카드의 그림 (서버 feed_story/AppVisual). 대결이 남긴 수 기록으로만 그린다 -->
  <div v-if="visual" class="mt-4">
    <!-- 낱말 사슬: 끝낸 낱말에만 볼트 -->
    <div v-if="visual.kind === 'CHAIN'" class="rounded-xl bg-surface-2 p-3.5">
      <p class="flex flex-wrap items-center gap-x-1 gap-y-1.5 text-sm">
        <template v-for="(w, i) in shownWords" :key="i">
          <span v-if="w === null" class="text-fg-subtle px-1" aria-label="중간 생략">…</span>
          <span
            v-else
            class="px-2 py-0.5 rounded-lg border"
            :class="w.last ? 'bg-signal border-signal text-signal-on font-semibold' : w.first ? 'bg-surface border-line-strong' : 'bg-surface border-line'"
          >{{ w.text }}</span>
          <span v-if="i < shownWords.length - 1" class="text-fg-subtle text-[0.6875rem]" aria-hidden="true">›</span>
        </template>
      </p>
      <p class="mt-2 t-micro tabular-nums">{{ visual.words.length }}개 이어짐</p>
    </div>

    <!-- 마지막 판: 격자 턴제 게임. 먼저 둔 사람이 흑. 마지막 수에 볼트 점 -->
    <figure v-else-if="visual.kind === 'BOARD'" class="rounded-xl bg-surface-2 p-3.5">
      <svg :viewBox="`0 0 ${size.w} ${size.h}`" class="block w-full h-auto max-w-[17rem] mx-auto" role="img" :aria-label="`마지막 판, ${stones.length}수`">
        <template v-if="gridLines">
          <line v-for="r in visual.rows" :key="'r' + r" :x1="pad" :x2="size.w - pad" :y1="pad + (r - 1) * gap" :y2="pad + (r - 1) * gap" class="stroke-line-strong" stroke-width="1" fill="none" />
          <line v-for="c in visual.cols" :key="'c' + c" :y1="pad" :y2="size.h - pad" :x1="pad + (c - 1) * gap" :x2="pad + (c - 1) * gap" class="stroke-line-strong" stroke-width="1" fill="none" />
        </template>
        <template v-else>
          <rect v-for="(cell, i) in visual.cells" :key="'b' + i" :x="pad + (i % visual.cols) * gap - gap / 2 + 1" :y="pad + Math.floor(i / visual.cols) * gap - gap / 2 + 1" :width="gap - 2" :height="gap - 2" rx="3" class="fill-surface" />
        </template>
        <circle
          v-for="s in stones"
          :key="s.i"
          :cx="s.x"
          :cy="s.y"
          :r="gap * 0.42"
          :class="s.owner === 'a' ? 'fill-fg stroke-fg' : 'fill-surface stroke-fg-subtle'"
          stroke-width="1"
        />
        <circle v-for="s in stones.filter((t) => t.last)" :key="'l' + s.i" :cx="s.x" :cy="s.y" :r="gap * 0.15" class="fill-signal" />
      </svg>
      <figcaption class="mt-2 t-micro flex justify-between">
        <span>마지막 판 · {{ stones.length }}수</span><span v-if="firstName">흑 {{ firstName }}</span>
      </figcaption>
    </figure>

    <!-- 막대: 기록 게임. 점수는 카드 위에 있으니 크기만, 개인 최고를 깨면 한 줄 -->
    <div v-else-if="visual.kind === 'BARS' && bars.length === 2" class="rounded-xl bg-surface-2 p-3.5 flex flex-col gap-2.5">
      <div v-for="b in bars" :key="b.id" class="grid grid-cols-[3.25rem_minmax(0,1fr)_3.5rem] gap-2.5 items-center text-[0.8125rem] tabular-nums">
        <span class="truncate">{{ b.name }}</span>
        <span class="h-3.5 rounded bg-line overflow-hidden"><i class="block h-full" :class="b.won ? 'bg-fg' : 'bg-fg-subtle'" :style="{ width: b.pct + '%' }"></i></span>
        <span class="text-right">{{ b.text }}</span>
      </div>
      <p v-if="bestNames.length" class="t-micro">{{ bestNames.join(', ') }} 개인 최고 기록</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type Visual = { kind: 'CHAIN' | 'BOARD' | 'BARS'; firstUserId?: number | null; words: string[]; rows: number; cols: number; cells: string[]; bests: number[] }

const props = defineProps<{
  visual?: Visual | null
  /** 카드의 두 사람 (점수 순서와 같다) */
  players: { id: number; name: string }[]
  scores?: (number | null)[]
  winnerId?: number | null
  unit?: string
}>()

const firstName = computed(() => props.players.find((p) => p.id === props.visual?.firstUserId)?.name || '')

// 사슬은 길면 앞 셋 … 뒤 다섯만 (끝낸 낱말이 이야기)
const shownWords = computed(() => {
  const words = props.visual?.words || []
  const items = words.map((text, i) => ({ text, first: i % 2 === 0, last: i === words.length - 1 }))
  if (items.length <= 10) return items
  return [...items.slice(0, 3), null, ...items.slice(-5)]
})

// 격자: 바둑판처럼 선 위에 두는 게임(칸이 많을 때)과 칸 안에 두는 게임(사목 등)
const gridLines = computed(() => (props.visual?.rows || 0) >= 9)
const gap = 20
const pad = computed(() => (gridLines.value ? 12 : gap / 2 + 2))
const size = computed(() => ({
  w: pad.value * 2 + ((props.visual?.cols || 1) - 1) * gap,
  h: pad.value * 2 + ((props.visual?.rows || 1) - 1) * gap,
}))
const stones = computed(() =>
  (props.visual?.cells || [])
    .map((cell, i) => ({ i, owner: cell.split(' ')[0], last: cell.endsWith('last') }))
    .filter((s) => s.owner === 'a' || s.owner === 'b')
    .map((s) => ({ ...s, x: pad.value + (s.i % (props.visual?.cols || 1)) * gap, y: pad.value + Math.floor(s.i / (props.visual?.cols || 1)) * gap })),
)

const bars = computed(() => {
  const scores = props.scores || []
  const max = Math.max(1, ...scores.map((s) => s || 0))
  return props.players.map((p, i) => {
    const v = scores[i] || 0
    return { id: p.id, name: p.name, pct: Math.max(4, (v / max) * 100), text: `${Number.isInteger(v) ? v : v.toFixed(1)}${props.unit || ''}`, won: p.id === props.winnerId }
  })
})
const bestNames = computed(() => props.players.filter((p) => props.visual?.bests?.includes(p.id)).map((p) => p.name))
</script>
