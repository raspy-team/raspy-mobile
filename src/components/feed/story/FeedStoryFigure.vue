<template>
  <!-- 소식 카드의 그림 한 장 (docs/feed-media.md 1겹). 문장은 카드 머리의 이야기 줄이 맡고, 여기는 그림만 -->
  <div v-if="kind" class="mt-4">
    <!-- 왕관: 챔피언이 넘어감 -->
    <div v-if="kind === 'crown' && champ" class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      <span class="rounded-full bg-signal text-signal-on px-2 py-0.5 t-micro font-semibold">{{ champ.area }} 챔피언</span>
      <span class="text-fg-subtle line-through decoration-line-strong">{{ champ.fromName }}</span>
      <span class="text-fg-subtle" aria-hidden="true">→</span>
      <span class="font-semibold text-fg">{{ winnerName }}</span>
      <span v-if="champ.heldDays" class="w-full t-micro">{{ champ.fromName }}은 {{ champ.heldDays }}일 동안 지켰어요</span>
    </div>

    <!-- 이변: 이긴 쪽의 경기 전 이길 확률. 진 쪽 확률은 적지 않는다 -->
    <div v-else-if="kind === 'odds'" class="rounded-xl bg-surface-2 p-3.5">
      <div class="h-2.5 rounded-full bg-line-strong overflow-hidden" role="img" :aria-label="`${winnerName}의 경기 전 이길 확률 ${prob}퍼센트`">
        <i class="block h-full bg-signal rounded-full" :style="{ width: prob + '%' }"></i>
      </div>
      <p class="mt-2 t-micro tabular-nums flex justify-between">
        <span>{{ winnerName }} 이길 확률 {{ prob }}%</span><span>경기 전 실력 점수</span>
      </p>
    </div>

    <!-- 흐름: 이긴 쪽 기준 점수 차. 뒤집은 자리에 볼트 점, 그 뒤 선은 진하게 -->
    <figure v-else-if="kind === 'flow'" class="rounded-xl bg-surface-2 p-3.5">
      <svg :viewBox="`0 0 ${W} ${H}`" class="block w-full h-auto" role="img" :aria-label="flowLabel">
        <line :x1="P" :x2="W - P" :y1="H / 2" :y2="H / 2" class="stroke-line-strong" stroke-dasharray="3 4" fill="none" />
        <path :d="flowPath.all" fill="none" class="stroke-fg-subtle" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
        <path v-if="flowPath.tail" :d="flowPath.tail" fill="none" class="stroke-fg" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" />
        <template v-if="flowPath.low">
          <circle :cx="flowPath.low.x" :cy="flowPath.low.y" r="6" class="fill-signal stroke-surface-2" stroke-width="2" />
          <text :x="flowPath.low.x + (flowPath.low.y > H - 22 ? -10 : 0)" :y="flowPath.low.y + (flowPath.low.y > H - 22 ? 4 : 18)" :text-anchor="flowPath.low.y > H - 22 ? 'end' : 'middle'" font-size="11" class="fill-fg-subtle tabular-nums">{{ flowPath.low.label }}</text>
        </template>
        <circle :cx="flowPath.end.x" :cy="flowPath.end.y" r="4" class="fill-fg" />
      </svg>
      <figcaption class="mt-2 t-micro tabular-nums flex justify-between gap-2">
        <span>{{ flowSet.label }}</span><span>{{ setLine }}</span>
      </figcaption>
    </figure>

    <!-- 라이벌: 같은 둘의 전적, 이긴 쪽 기준 (최근이 오른쪽) -->
    <div v-else-if="kind === 'rival'" class="flex items-center gap-3">
      <span class="flex gap-1.5" role="img" :aria-label="`${winnerName} 기준 ${h2hWins}승 ${h2hLosses}패`">
        <span v-for="(r, i) in h2h" :key="i" class="w-3 h-3 rounded-full" :class="r === 'W' ? (i === h2h.length - 1 ? 'bg-signal ring-1 ring-signal-fg' : 'bg-fg') : r === 'D' ? 'bg-fg-subtle' : 'border border-line-strong'"></span>
      </span>
      <span class="t-caption tabular-nums">{{ winnerName }} {{ h2hWins }}승 {{ h2hLosses }}패</span>
    </div>

    <!-- 기본: 세트 칸. 볼트 칸은 이긴 사람의 세트 -->
    <div v-else-if="kind === 'sets'" class="flex gap-1.5">
      <div
        v-for="(s, i) in sets"
        :key="i"
        class="flex-1 rounded-[10px] py-2.5 text-center flex flex-col gap-0.5 border"
        :class="s.won ? 'bg-signal border-signal text-signal-on' : 'bg-surface border-line'"
      >
        <small class="text-[0.6875rem]" :class="s.won ? 'opacity-70' : 'text-fg-subtle'">{{ i + 1 }}세트</small>
        <b class="text-[1.0625rem] font-semibold tabular-nums">{{ s.text }}</b>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// story(서버 feed_story가 계산한 이야기)의 picked에 맞는 그림 하나. 그 그림에 쓸 기록이 없으면 흐름 → 세트 칸 → 없음 순으로 내려간다
// 이름·점수는 카드가 이미 보여 주니 다시 쓰지 않는다. 진 쪽을 깎는 말·숫자는 넣지 않는다 (docs/feed-media.md)
import { computed } from 'vue'

type FlowPoint = { set: number; a: number; b: number }
type Story = {
  picked?: string
  winProb?: number | null
  flow?: FlowPoint[] | null
  lowIdx?: number | null
  h2h?: { games: number; winsA: number; winsB: number; seq: string[] } | null
  champion?: { area: string; fromName: string; heldDays?: number | null } | null
}

const props = defineProps<{
  story?: Story | null
  /** 두 편의 이름 (카드의 왼쪽·오른쪽) */
  names: string[]
  /** 이긴 편 0·1, 비기면 null */
  winner: number | null
  /** 세트 점수 (카드의 result.setScores) */
  setScores?: { scoreA: number; scoreB: number }[]
}>()

const W = 320
const H = 112
const P = 10

const story = computed<Story>(() => props.story || {})
const champ = computed(() => story.value.champion || null)
const winnerName = computed(() => (props.winner == null ? '' : props.names[props.winner] || ''))
// 서버가 0~1로 주든 %로 주든 받는다
const prob = computed(() => {
  const p = story.value.winProb
  if (p == null) return null
  return Math.round(p <= 1 ? p * 100 : p)
})
// 전적을 이긴 쪽 기준 W·L·D로 (서버 seq는 앞 칸 A·뒤 칸 B·비김 D)
const h2h = computed(() => {
  const seq = story.value.h2h?.seq || []
  const me = props.winner === 1 ? 'B' : 'A'
  return seq.map((r) => (r === 'D' ? 'D' : r === me ? 'W' : 'L'))
})
const h2hWins = computed(() => h2h.value.filter((r) => r === 'W').length)
const h2hLosses = computed(() => h2h.value.filter((r) => r === 'L').length)

const sets = computed(() =>
  (props.setScores || []).map((s) => ({
    text: `${s.scoreA}:${s.scoreB}`,
    won: props.winner === 0 ? s.scoreA > s.scoreB : props.winner === 1 ? s.scoreB > s.scoreA : false,
  })),
)
const setLine = computed(() => (sets.value.length > 1 ? sets.value.map((s) => s.text).join(' · ') : ''))

const hasFlow = computed(() => (story.value.flow?.length || 0) >= 2)

const kind = computed(() => {
  const s = story.value
  const fallback = hasFlow.value ? 'flow' : sets.value.length > 1 ? 'sets' : ''
  if (props.winner == null) return fallback
  switch (s.picked) {
    case 'CHAMPION':
      return s.champion?.fromName ? 'crown' : fallback
    case 'UPSET':
      return prob.value != null ? 'odds' : fallback
    case 'RIVAL':
      return h2h.value.length >= 2 ? 'rival' : fallback
    default:
      return fallback
  }
})

// 흐름은 한 세트만 그린다: 뒤집은 자리가 있는 세트, 없으면 마지막 세트
const flowSet = computed(() => {
  const flow = story.value.flow || []
  const low = story.value.lowIdx
  const setNo = low != null && flow[low] ? flow[low].set : flow[flow.length - 1]?.set
  const start = flow.findIndex((p) => p.set === setNo)
  const pts = flow.filter((p) => p.set === setNo)
  const many = new Set(flow.map((p) => p.set)).size > 1
  return { pts, lowInSet: low != null && low >= start && low < start + pts.length ? low - start : null, label: many ? `${setNo}세트 점수 차` : '점수 차' }
})

const flowLabel = computed(() => {
  const { pts, lowInSet } = flowSet.value
  const end = pts[pts.length - 1]
  const lo = lowInSet != null ? pts[lowInSet] : null
  return lo && end ? `점수 흐름. ${lo.a}대 ${lo.b}에서 ${end.a}대 ${end.b}` : '점수 흐름'
})

const flowPath = computed(() => {
  const { pts, lowInSet } = flowSet.value
  // 이긴 쪽이 위로 가게 (뒤편이 이겼으면 뒤집는다)
  const sign = props.winner === 1 ? -1 : 1
  const series = [{ a: 0, b: 0 }, ...pts]
  const diffs = series.map((p) => sign * (p.a - p.b))
  const maxAbs = Math.max(3, ...diffs.map(Math.abs))
  const x = (i: number) => P + (i / Math.max(1, series.length - 1)) * (W - P * 2)
  const y = (d: number) => H / 2 - (d / maxAbs) * (H / 2 - P)
  const line = (from: number) => diffs.slice(from).map((d, i) => `${i ? 'L' : 'M'}${x(from + i).toFixed(1)} ${y(d).toFixed(1)}`).join(' ')
  const lowAt = lowInSet != null ? lowInSet + 1 : null // series 앞에 0:0을 붙였다
  const last = series.length - 1
  return {
    all: line(0),
    tail: lowAt != null && lowAt < last ? line(lowAt) : '',
    low: lowAt != null ? { x: x(lowAt), y: y(diffs[lowAt]), label: `${series[lowAt].a}:${series[lowAt].b}` } : null,
    end: { x: x(last), y: y(diffs[last]) },
  }
})
</script>
