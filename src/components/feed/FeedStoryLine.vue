<template>
  <!-- 카드의 제목 한 줄 (quality-rules S3-1·S3-3).
       AI 기자 한 줄이 이야기 줄과 같은 사실이면 기자 줄 하나가 제목이다: '…챔피언이 됐어요'와 '…챔피언이 됐다'가 한 카드에서 두 번 나왔다.
       기사체는 'AI 기자' 표시가 붙은 줄에만 쓴다 -->
  <p v-if="headline" class="flex items-start gap-1.5 t-body text-fg mb-2 break-keep">
    <UiIcon :name="ICON[beat?.kind] || 'pen'" class="flex-shrink-0 mt-[3px]" :class="beat?.kind === 'CHAMPION' ? 'text-signal-fg' : 'text-fg-muted'" aria-hidden="true" />
    <span class="min-w-0"><span class="t-micro mr-1 whitespace-nowrap">AI 기자</span>{{ headline }}</span>
  </p>
  <!-- 이야기 줄: 기록에서 뽑은 사실 하나 (서버 feed_story가 중요한 순으로 준다). 그림은 결과 칸이 맡는다 -->
  <p v-else-if="beat" class="flex items-center gap-1.5 t-caption text-fg mb-2">
    <UiIcon :name="ICON[beat.kind] || 'bolt'" class="flex-shrink-0" :class="beat.kind === 'CHAMPION' ? 'text-signal-fg' : 'text-fg-muted'" aria-hidden="true" />
    <span class="truncate">{{ beat.text }}</span>
  </p>
</template>

<script setup>
import { computed, defineProps } from 'vue'
import { UiIcon } from '../ui'
import { reporterIsHeadline } from './story/headline'

const props = defineProps({ story: { type: Object, default: null } })
const beat = computed(() => props.story?.beats?.[0])
// 기자 줄이 이야기 줄과 같은 사실을 말할 때만 제목으로 올린다 (story/headline.js)
const headline = computed(() => (reporterIsHeadline(props.story) ? props.story.aiSummary : ''))
const ICON = {
  CHAMPION: 'crown', UPSET: 'bolt', COMEBACK: 'rotate-right', CLOSE: 'swords', RIVAL: 'swords', FIRST_WIN: 'trophy',
  STREAK: 'bolt', STREAK_STOP: 'flag', MILESTONE: 'star', PERSONAL_BEST: 'star', FIRST_GAME: 'user-plus',
}
</script>
