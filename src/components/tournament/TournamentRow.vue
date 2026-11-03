<template>
  <UiCard class="flex items-center gap-3 py-3 cursor-pointer active:bg-surface-2" role="button" @click="emit('click')">
    <span class="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center text-fg-muted flex-shrink-0" aria-hidden="true">
      <UiIcon :name="t.status === 'COMPLETED' ? 'trophy' : 'swords'" />
    </span>
    <div class="flex-1 min-w-0">
      <p class="t-heading truncate">{{ t.title }}</p>
      <p class="t-caption truncate">{{ line }}</p>
    </div>
    <span class="t-micro flex-shrink-0">{{ STATUS[t.status] }}</span>
  </UiCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { components } from '@/api/schema'
import { UiCard, UiIcon } from '../ui'

const props = defineProps<{ t: components['schemas']['TournamentSummary'] }>()
const emit = defineEmits<{ click: [] }>()
const STATUS: Record<string, string> = { RECRUITING: '모집 중', RUNNING: '진행 중', COMPLETED: '끝남', CANCELED: '취소' }
const line = computed(() => {
  const t = props.t
  const d = new Date(t.startsAt)
  return [t.ruleTitle, t.format === 'LEAGUE' ? '리그' : '토너먼트', t.entrantType === 'CLUB' ? '동호회 대항' : '', t.hostName,
    t.status === 'COMPLETED' && t.winnerName ? `우승 ${t.winnerName}` : `${t.entryCount}/${t.maxEntrants} · ${d.getMonth() + 1}월 ${d.getDate()}일 시작`]
    .filter(Boolean).join(' · ')
})
</script>
