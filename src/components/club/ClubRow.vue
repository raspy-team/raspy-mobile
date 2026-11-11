<template>
  <UiCard class="flex items-center gap-3 py-3 cursor-pointer active:bg-surface-2" role="button" @click="emit('click')">
    <span class="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center text-fg-muted flex-shrink-0" aria-hidden="true">
      <UiIcon name="users" />
    </span>
    <div class="flex-1 min-w-0">
      <p class="t-heading truncate">{{ club.name }}</p>
      <p class="t-caption truncate">{{ line }}</p>
      <p v-if="club.intro" class="t-caption truncate">{{ club.intro }}</p>
    </div>
    <slot />
  </UiCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { components } from '@/api/schema'
import { UiCard, UiIcon } from '../ui'

const props = defineProps<{ club: components['schemas']['ClubSummary']; hideDong?: boolean }>()
const emit = defineEmits<{ click: [] }>()
// 목록 한 줄: 동네 · 대표 종목 · 멤버 수 · 교류전 전적(있을 때).
// 승인 가입은 버튼 이름("신청"·"보고 신청")이 말한다
// 멤버 수가 늘 있어 소개가 한 번도 안 나왔다 (경로 7 리뷰 K10): 소개는 둘째 줄로 따로. 같은 동네 칸에서 되풀이되는 동네 이름은 hideDong으로 뺀다
const line = computed(() => {
  const c = props.club
  // 교류전 전적은 되살린다: 들어갈 동호회를 고르는 사람에겐 "활발한가·잘하나"(정보), 멤버에겐 자랑(정체성). 한 동기로만 보고 뺐었다 (11/11 목적 다시 보기)
  const r = c.record
  const played = r ? r.wins + r.draws + r.losses : 0
  return [props.hideDong ? '' : c.dongName, c.mainRuleTitle, `${c.memberCount}명`, played ? `교류전 ${r!.wins}승 ${r!.draws ? `${r!.draws}무 ` : ''}${r!.losses}패` : ''].filter(Boolean).join(' · ')
})
</script>
