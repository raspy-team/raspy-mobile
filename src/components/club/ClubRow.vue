<template>
  <UiCard class="flex items-center gap-3 py-3 cursor-pointer active:bg-surface-2" role="button" @click="emit('click')">
    <span class="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center text-fg-muted flex-shrink-0" aria-hidden="true">
      <UiIcon name="users" />
    </span>
    <div class="flex-1 min-w-0">
      <p class="t-heading truncate">{{ club.name }}</p>
      <p class="t-caption truncate">{{ line }}</p>
    </div>
    <slot />
  </UiCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { components } from '@/api/schema'
import { UiCard, UiIcon } from '../ui'

const props = defineProps<{ club: components['schemas']['ClubSummary'] }>()
const emit = defineEmits<{ click: [] }>()
// 동호회의 얼굴: 동네 · 대표 종목 · 멤버 수 · 교류전 전적 · 승인 가입
const line = computed(() => {
  const c = props.club
  const r = c.record
  const played = r ? r.wins + r.draws + r.losses : 0
  return [c.dongName, c.mainRuleTitle, `${c.memberCount}명`, played ? `교류전 ${r!.wins}승 ${r!.draws ? `${r!.draws}무 ` : ''}${r!.losses}패` : '', c.joinMode === 'APPROVAL' ? '승인 가입' : '']
    .filter(Boolean).join(' · ') || c.intro || ''
})
</script>
