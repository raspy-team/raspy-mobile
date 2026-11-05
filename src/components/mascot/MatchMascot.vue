<template>
  <svg :width="size" :height="size" :viewBox="`0 0 ${N} ${N}`" class="match-mascot" shape-rendering="crispEdges" role="img" :aria-label="NAMES[who] || '매치'">
    <!-- 발밑 그림자 (광장의 LimeZu 물건처럼) -->
    <ellipse cx="12" cy="22.6" rx="7" ry="1.2" fill="#000" opacity=".22" />
    <!-- 다크 바탕에서는 짙은 외곽선이 바탕에 묻힌다(돌돌은 몸까지). 바깥 한 칸을 옅게 밝혀 모양을 살린다. 라이트에서는 투명 -->
    <path class="match-mascot-halo" :d="art.halo" />
    <rect v-for="(r, i) in art.runs" :key="i" :x="r[0]" :y="r[1]" :width="r[2] + 0.02" height="1.02" :fill="MASCOT_PALETTE[r[3]]" />
  </svg>
</template>

<script setup lang="ts">
// 매치 공식 캐릭터 다섯의 픽셀판 (11/6, docs/mascots.md). 광장의 LimeZu 그림과 한 세계에 서도록 24×24 칸으로 그렸다.
// 그림 데이터는 mascotPixels.ts: ~/match/tools/instagram/pixel.py에서 mascot_export.py로 만든다 (서버 공유 그림도 같은 데이터)
// mood: smile(기본) · wow(놀람·새 소식) · sad(담담: 졌을 때·못 불러옴. 우는 얼굴은 없다) · cheer(이겼을 때·응원)
// variant는 예전 선 그림(line)·색 그림(color) 구분이었다. 이제 한 가지 픽셀판만 그리고, 예전 호출을 위해 받기만 한다
import { computed } from 'vue'
import { MASCOT_PALETTE, MASCOT_PIXELS, MASCOT_SIZE } from './mascotPixels'

type Who = keyof typeof MASCOT_PIXELS
type Mood = 'smile' | 'wow' | 'sad' | 'cheer'
const props = withDefaults(defineProps<{ who?: Who | string; mood?: Mood | string; size?: number | string; variant?: 'line' | 'color' }>(), {
  who: 'match',
  mood: 'smile',
  size: 64,
  variant: 'line',
})

const N = MASCOT_SIZE
const NAMES: Record<string, string> = { match: '매치', kok: '콕이', tong: '통통', dol: '돌돌', bibi: '비비' }
const CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

type Art = { runs: [number, number, number, number][]; halo: string }
const cache = new Map<string, Art>()

/** 같은 색이 가로로 이어진 칸은 사각형 하나로 (칸마다 하나면 400개 가까이 된다) + 바깥 한 칸 테두리 */
function build(whoIn: string, moodIn: string): Art {
  const who = (whoIn in MASCOT_PIXELS ? whoIn : 'match') as Who
  const mood = (moodIn in MASCOT_PIXELS[who] ? moodIn : 'smile') as Mood
  const key = `${who}-${mood}`
  const hit = cache.get(key)
  if (hit) return hit
  const rows: readonly string[] = MASCOT_PIXELS[who][mood]
  const runs: Art['runs'] = []
  rows.forEach((row, y) => {
    let x = 0
    while (x < N) {
      const c = row[x]
      if (c === '.') { x++; continue }
      let w = 1
      while (x + w < N && row[x + w] === c) w++
      runs.push([x, y, w, CHARS.indexOf(c)])
      x += w
    }
  })
  const filled = (x: number, y: number) => x >= 0 && y >= 0 && x < N && y < N && rows[y][x] !== '.'
  let halo = ''
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (filled(x, y)) continue
      let near = false
      for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1; dx++) if (filled(x + dx, y + dy)) { near = true; break }
      if (near) halo += `M${x} ${y}h1v1h-1z`
    }
  }
  const art = { runs, halo }
  cache.set(key, art)
  return art
}

const art = computed(() => build(props.who, props.mood))
</script>

<style scoped>
.match-mascot { image-rendering: pixelated; flex-shrink: 0; }
.match-mascot-halo { fill: var(--mascot-halo, transparent); }
</style>
