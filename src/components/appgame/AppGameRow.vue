<template>
  <UiCard :to="`/play/${game.key}`" interactive class="flex items-center gap-3">
    <span class="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center flex-shrink-0" aria-hidden="true">
      <UiIcon :name="game.icon" />
    </span>
    <span class="flex-1 min-w-0">
      <span class="block t-heading truncate">{{ game.title }}</span>
      <span class="block t-caption truncate mt-0.5">{{ game.summary }}</span>
      <span class="block t-micro mt-1">{{ [structureLabel(game.playMode), judgeLabel(game.judge)].filter(Boolean).join(' · ') }}</span>
    </span>
    <UiBadge v-if="!game.available">준비 중</UiBadge>
    <span v-else class="text-right flex-shrink-0">
      <span class="block t-mono">{{ game.myRating }}</span>
      <span class="block t-micro">레이팅</span>
    </span>
  </UiCard>
</template>

<script setup lang="ts">
// 앱 게임 한 줄 (홈·모든 게임 화면이 같이 쓴다)
import type { components } from '@/api/schema'
import { judgeLabel, structureLabel } from '@/utils/appGame'
import { UiBadge, UiCard, UiIcon } from '../ui'

defineProps<{ game: components['schemas']['AppGameSummary'] }>()
</script>
