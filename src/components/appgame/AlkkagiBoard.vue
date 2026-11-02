<template>
  <div>
    <svg
      ref="svg"
      viewBox="-0.02 -0.02 1.04 1.04"
      class="block w-full aspect-square select-none touch-none rounded-xl bg-surface"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="aim = null"
    >
      <!-- 판: 가는 격자, 밖으로 나가면 떨어진다 -->
      <rect x="0" y="0" width="1" height="1" class="fill-surface-2 stroke-line" stroke-width="0.006" rx="0.02" />
      <line v-for="i in 7" :key="'h' + i" x1="0" x2="1" :y1="i / 8" :y2="i / 8" class="stroke-line" stroke-width="0.003" />
      <line v-for="i in 7" :key="'v' + i" y1="0" y2="1" :x1="i / 8" :x2="i / 8" class="stroke-line" stroke-width="0.003" />

      <!-- 겨누는 중: 당긴 줄과 날아갈 방향 -->
      <template v-if="aim">
        <line :x1="aimFrom.x" :y1="aimFrom.y" :x2="aim.px" :y2="aim.py" class="stroke-fg-subtle" stroke-width="0.006" stroke-dasharray="0.015 0.012" />
        <line :x1="aimFrom.x" :y1="aimFrom.y" :x2="aimFrom.x + Math.cos(aim.angle) * aim.power * 0.4" :y2="aimFrom.y + Math.sin(aim.angle) * aim.power * 0.4" class="stroke-signal" stroke-width="0.014" stroke-linecap="round" />
      </template>

      <circle
        v-for="s in shown.filter((b) => b.alive)"
        :key="s.id"
        :cx="s.x"
        :cy="s.y"
        :r="RADIUS"
        :class="[s.mine ? 'fill-fg' : 'fill-canvas stroke-fg', canShoot && s.mine ? 'cursor-grab' : '', aim?.stone === s.id ? 'stroke-signal' : '']"
        :stroke-width="aim?.stone === s.id ? 0.012 : 0.006"
        @pointerdown="onDown($event, s)"
      />
    </svg>
    <div class="flex items-center justify-between mt-3 t-caption tabular-nums">
      <span>내 돌 {{ count(true) }}</span>
      <span>{{ hint }}</span>
      <span>상대 돌 {{ count(false) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
// 알까기 판. 판 좌표는 먼저 둔 사람이 아래쪽 기준이라, 나중 사람은 뒤집어 그린다(flip) → 언제나 내 돌이 아래.
// 내 돌을 눌러 뒤로 당겼다 놓으면 반대쪽으로 튕긴다 (멀리 당길수록 세게). 새 수가 오면 같은 물리로 움직임을 그린 뒤 서버 자리에 맞춘다
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import type { components } from '@/api/schema'
import { RADIUS, DT, simulate, parseShot, formatShot, type Body } from '@/utils/alkkagi'

type Stone = components['schemas']['RealtimeStone']
const props = defineProps<{ stones: Stone[]; flip: boolean; myTurn: boolean; lastMove?: string; moveCount: number; sending: boolean }>()
const emit = defineEmits<{ shoot: [move: string] }>()

const PULL = 0.32 // 이만큼 당기면 최대 힘
const svg = ref<SVGSVGElement | null>(null)
const toScreen = (b: Body): Body => (props.flip ? { ...b, x: 1 - b.x, y: 1 - b.y } : b)
const shown = ref<Body[]>(props.stones.map(toScreen))
const animating = ref(false)
const canShoot = computed(() => props.myTurn && !animating.value && !props.sending)
const hint = computed(() => (animating.value ? '' : canShoot.value ? '내 돌을 뒤로 당겼다 놓아요' : '상대 차례'))
const count = (mine: boolean) => props.stones.filter((s) => s.mine === mine && s.alive).length

// 새 판이 오면: 한 수만 늘었으면 그 수를 움직임으로 보여 주고, 아니면 바로 맞춘다
let prev: Stone[] = props.stones
let prevCount = props.moveCount
let raf = 0
watch(
  () => props.stones,
  (next) => {
    const shot = props.lastMove ? parseShot(props.lastMove) : null
    const stepped = props.moveCount === prevCount + 1 && shot
    const from = prev
    prev = next
    prevCount = props.moveCount
    cancelAnimationFrame(raf)
    if (!stepped) {
      animating.value = false
      shown.value = next.map(toScreen)
      return
    }
    const frames = simulate(from, shot)
    animating.value = true
    const begin = performance.now()
    const tick = (now: number) => {
      // 첫 프레임 시각은 begin보다 조금 이를 수 있다
      const i = Math.max(0, Math.floor((now - begin) / 1000 / DT))
      if (i >= frames.length - 1) {
        animating.value = false
        shown.value = next.map(toScreen)
        return
      }
      shown.value = frames[i].map(toScreen)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
  },
)
onBeforeUnmount(() => cancelAnimationFrame(raf))

// 겨누기
const aim = ref<{ stone: number; px: number; py: number; angle: number; power: number } | null>(null)
const aimFrom = computed(() => shown.value.find((b) => b.id === aim.value?.stone) ?? { x: 0, y: 0 })

function point(e: PointerEvent) {
  const r = svg.value!.getBoundingClientRect()
  // viewBox가 -0.02에서 1.04칸
  return { x: ((e.clientX - r.left) / r.width) * 1.04 - 0.02, y: ((e.clientY - r.top) / r.height) * 1.04 - 0.02 }
}
function onDown(e: PointerEvent, s: Body) {
  if (!canShoot.value || !s.mine) return
  svg.value?.setPointerCapture(e.pointerId)
  aim.value = { stone: s.id, px: s.x, py: s.y, angle: 0, power: 0 }
}
function onMove(e: PointerEvent) {
  if (!aim.value) return
  const p = point(e)
  const from = aimFrom.value
  const dx = from.x - p.x
  const dy = from.y - p.y
  aim.value = { ...aim.value, px: p.x, py: p.y, angle: Math.atan2(dy, dx), power: Math.min(1, Math.hypot(dx, dy) / PULL) }
}
function onUp() {
  const a = aim.value
  aim.value = null
  if (!a || a.power < 0.08 || !canShoot.value) return
  // 화면 방향을 판 방향으로 (뒤집어 그렸으면 반 바퀴)
  emit('shoot', formatShot({ stone: a.stone, angle: props.flip ? a.angle + Math.PI : a.angle, power: a.power }))
}
</script>
