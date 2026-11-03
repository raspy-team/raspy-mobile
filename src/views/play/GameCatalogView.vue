<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar title="앱 게임" back />

    <main class="max-w-xl mx-auto px-4 pt-3 pb-16">
      <UiInput v-model="query" icon="search" placeholder="게임 찾기" />
      <div class="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
        <UiChip :selected="!structure" @click="structure = ''">전체 {{ games.length }}</UiChip>
        <UiChip v-for="s in STRUCTURES" :key="s.value" :selected="structure === s.value" @click="structure = structure === s.value ? '' : s.value">
          {{ s.label }}
        </UiChip>
      </div>
      <p v-if="structure" class="t-caption mt-2">{{ STRUCTURES.find((s) => s.value === structure)?.hint }}</p>

      <div v-if="loading" class="space-y-2 mt-5">
        <UiSkeleton v-for="n in 4" :key="n" class="h-20 w-full" />
      </div>

      <template v-else>
        <!-- 지금 기다리는 사람: 한 번에 붙기 (사람이 적을 때 흩어지지 않게) -->
        <WaitingNow v-if="!query && !structure" class="mt-6" any-button />
        <!-- 최근에 한 게임: 찾지 않고 바로 다시 -->
        <UiSection v-if="recent.length && !query && !structure" title="최근에 한 게임" class="mt-6">
          <!-- 이어 하기 줄: 옆으로 밀어 고른다 -->
          <div class="flex gap-3 -mx-4 px-4 overflow-x-auto no-scrollbar">
            <AppGameTile v-for="g in recent" :key="g.key" :game="g" compact />
          </div>
        </UiSection>

        <UiSection :title="query || structure ? `찾은 게임 ${filtered.length}` : '많이 하는 게임'" class="mt-6">
          <div v-if="filtered.length" class="grid grid-cols-2 gap-3">
            <AppGameTile v-for="g in filtered" :key="g.key" :game="g" />
          </div>
          <UiEmptyState v-else icon="search" title="찾는 게임이 없어요" description="다른 말로 찾아보세요" />
        </UiSection>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
// 모든 앱 게임 (/games). 게임이 100개가 되어도: 검색 + 구조(지금 바로 붙기 / 편할 때 하기) + 최근에 한 게임 + 많이 하는 순
import { ref, computed, onMounted } from 'vue'
import { GET } from '@/api/client'
import type { components } from '@/api/schema'
import { STRUCTURES } from '@/utils/appGame'
import AppGameTile from '../../components/appgame/AppGameTile.vue'
import WaitingNow from '../../components/appgame/WaitingNow.vue'
import { UiChip, UiEmptyState, UiInput, UiSection, UiSkeleton, UiTopBar } from '../../components/ui'

type AppGameSummary = components['schemas']['AppGameSummary']
const games = ref<AppGameSummary[]>([])
const loading = ref(true)
const query = ref('')
const structure = ref('')

const recent = computed(() =>
  games.value
    .filter((g) => g.myLastPlayedAt)
    .sort((a, b) => (b.myLastPlayedAt ?? '').localeCompare(a.myLastPlayedAt ?? ''))
    .slice(0, 3),
)
const filtered = computed(() => {
  const q = query.value.trim()
  return games.value
    .filter((g) => !structure.value || g.playMode === structure.value)
    .filter((g) => !q || g.title.includes(q) || g.summary.includes(q))
    .sort((a, b) => Number(b.available) - Number(a.available) || b.playCount - a.playCount)
})

onMounted(async () => {
  try {
    games.value = (await GET('/api/app-games')).data
  } finally {
    loading.value = false
  }
})
</script>
