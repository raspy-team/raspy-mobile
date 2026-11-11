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
// 목록 한 줄: 동네 · 대표 종목 · 멤버 수. 교류전 전적은 들어갈지 고르는 데 쓰지 않아 동호회 화면에만 둔다 (목적 판정 7).
// 승인 가입은 버튼 이름("신청"·"보고 신청")이 말한다
const line = computed(() => {
  const c = props.club
  return [c.dongName, c.mainRuleTitle, `${c.memberCount}명`].filter(Boolean).join(' · ') || c.intro || ''
})
</script>
