<template>
  <!-- 킥오프 카드: 왜 이 경기인가. 맞대결·라이벌·챔피언·연승·이길 확률 (docs/live-spectator-review.md E) -->
  <section v-if="data && (data.lines.length || hasRecent)" class="rounded-xl bg-surface p-4">
    <p class="t-micro">왜 이 경기인가</p>
    <ul class="mt-1 space-y-1">
      <li v-for="line in data.lines" :key="line" class="t-body">{{ line }}</li>
    </ul>
    <div v-if="hasRecent" class="mt-3 space-y-1">
      <p v-for="s in data.sides" :key="s.side" class="flex items-center gap-2 t-micro">
        <span class="truncate min-w-0 flex-1">{{ s.label }} 최근</span>
        <span v-if="!s.recent.length">기록 없음</span>
        <span v-for="(r, i) in s.recent" :key="i" class="inline-flex w-5 h-5 items-center justify-center rounded-full tabular-nums" :class="dot(r)">{{ letter(r) }}</span>
      </p>
    </div>
    <p v-if="data.sides.length >= 2 && data.sides.every((s) => s.chance == null)" class="t-micro mt-2">이길 확률: 기록 없음</p>
  </section>
</template>

<script setup lang="ts">
// 시작 전·경기 중 /live 위쪽에 한 장. 한 번만 불러온다 (전적·흐름은 경기 중에 바뀌지 않는다)
import { ref, computed, onMounted } from 'vue'
import { GET } from '@/api/client'
import type { components } from '@/api/schema'

const props = defineProps<{ gameId: number }>()
const data = ref<components['schemas']['LiveContext'] | null>(null)
const hasRecent = computed(() => !!data.value?.sides.some((s) => s.recent.length))

const letter = (r: string) => ({ W: '승', D: '무', L: '패' })[r] ?? r
const dot = (r: string) => (r === 'W' ? 'bg-fg text-canvas' : r === 'L' ? 'bg-line-strong text-fg-muted' : 'bg-surface-3 text-fg-muted')

onMounted(async () => {
  try {
    data.value = (await GET('/api/games/{gameId}/live/context', { path: { gameId: props.gameId } })).data
  } catch {
    // 카드는 덤이라 못 불러오면 그냥 안 보인다
  }
})
</script>
