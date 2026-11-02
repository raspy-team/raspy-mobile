<template>
  <UiSection v-if="games.length" title="앱 게임">
    <div class="space-y-2">
      <UiCard v-for="g in games" :key="g.key" :to="`/play/${g.key}`" interactive class="flex items-center gap-3">
        <span class="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center flex-shrink-0" aria-hidden="true">
          <UiIcon :name="ICON[g.key] || 'play'" />
        </span>
        <span class="flex-1 min-w-0">
          <span class="block t-heading">{{ g.title }}</span>
          <span class="block t-caption mt-0.5">{{ g.summary }}</span>
        </span>
        <span class="text-right flex-shrink-0">
          <span class="block t-mono">{{ g.myRating }}</span>
          <span class="block t-micro">레이팅</span>
        </span>
      </UiCard>
    </div>
  </UiSection>
</template>

<script setup lang="ts">
// 홈의 앱 게임 칸: 상대를 기다리지 않고 바로 한 판 하는 게임들
import { ref, onMounted } from 'vue'
import { GET } from '@/api/client'
import type { components } from '@/api/schema'
import { UiCard, UiIcon, UiSection } from '../ui'

type AppGameSummary = components['schemas']['AppGameSummary']

const ICON: Record<string, string> = { typing: 'keyboard' }
const games = ref<AppGameSummary[]>([])

onMounted(async () => {
  try {
    games.value = (await GET('/api/app-games')).data
  } catch {
    games.value = [] // 앱 게임을 못 불러와도 열린 경기 목록은 그대로 보인다
  }
})
</script>
