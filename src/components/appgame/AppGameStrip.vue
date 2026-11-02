<template>
  <UiSection v-if="games.length" title="앱 게임">
    <template #action>
      <UiButton size="sm" variant="ghost" to="/games">모두 보기{{ games.length > SHOWN ? ` ${games.length}` : '' }}</UiButton>
    </template>
    <div class="space-y-2">
      <AppGameRow v-for="g in shown" :key="g.key" :game="g" />
    </div>
  </UiSection>
</template>

<script setup lang="ts">
// 홈의 앱 게임 칸: 게임이 많아져도 세 개만. 할 수 있는 게임 중 최근에 한 것 먼저, 그다음 많이 하는 것. 나머지는 '모두 보기'
import { ref, computed, onMounted } from 'vue'
import { GET } from '@/api/client'
import type { components } from '@/api/schema'
import AppGameRow from './AppGameRow.vue'
import { UiButton, UiSection } from '../ui'

type AppGameSummary = components['schemas']['AppGameSummary']
const SHOWN = 3
const games = ref<AppGameSummary[]>([])
const shown = computed(() =>
  [...games.value]
    .sort((a, b) => Number(b.available) - Number(a.available) || (b.myLastPlayedAt ?? '').localeCompare(a.myLastPlayedAt ?? '') || b.playCount - a.playCount)
    .slice(0, SHOWN),
)

onMounted(async () => {
  try {
    games.value = (await GET('/api/app-games')).data
  } catch {
    games.value = [] // 앱 게임을 못 불러와도 열린 경기 목록은 그대로 보인다
  }
})
</script>
