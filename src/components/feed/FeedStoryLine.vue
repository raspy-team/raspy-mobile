<template>
  <!-- 카드의 제목 한 줄 (quality-rules S3-1·S3-3).
       AI 기자 한 줄이 이야기 줄과 같은 사실이면 기자 줄 하나가 제목이다: '…챔피언이 됐어요'와 '…챔피언이 됐다'가 한 카드에서 두 번 나왔다.
       기사체는 'AI 기자' 표시가 붙은 줄에만 쓴다 -->
  <!-- 신문의 꼭지 이름처럼 무슨 소식인지 먼저 한 낱말(이변·역전·챔피언…), 그 밑에 제목 (quality-rules S3: 소식은 경기 소식처럼 읽힌다) -->
  <div v-if="headline" class="mb-2">
    <p class="flex items-center gap-1.5">
      <span v-if="KICKER[beat?.kind]" class="inline-flex items-center gap-1 h-5 px-1.5 rounded t-micro font-bold" :class="beat?.kind === 'CHAMPION' ? 'bg-signal text-signal-on' : 'bg-surface-3 !text-fg'"><UiIcon :name="ICON[beat?.kind] || 'pen'" aria-hidden="true" />{{ KICKER[beat.kind] }}</span>
      <span class="t-micro whitespace-nowrap">AI 기자</span>
    </p>
    <p class="t-heading text-fg mt-1 break-keep">{{ headline }}</p>
  </div>
  <!-- 이야기 줄: 기록에서 뽑은 사실 하나 (서버 feed_story가 중요한 순으로 준다). 그림은 결과 칸이 맡는다 -->
  <p v-else-if="beat" class="flex items-center gap-1.5 t-caption text-fg mb-2">
    <span v-if="KICKER[beat.kind]" class="inline-flex items-center gap-1 h-5 px-1.5 rounded t-micro font-bold flex-shrink-0" :class="beat.kind === 'CHAMPION' ? 'bg-signal text-signal-on' : 'bg-surface-3 !text-fg'"><UiIcon :name="ICON[beat.kind] || 'bolt'" aria-hidden="true" />{{ KICKER[beat.kind] }}</span>
    <UiIcon v-else :name="ICON[beat.kind] || 'bolt'" class="flex-shrink-0 text-fg-muted" aria-hidden="true" />
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
// 꼭지 이름: 이 소식이 무슨 소식인가 (서버 feed_story의 이야깃거리 종류)
const KICKER = {
  CHAMPION: '챔피언', UPSET: '이변', COMEBACK: '역전', CLOSE: '접전', RIVAL: '맞수', FIRST_WIN: '첫 승',
  STREAK: '연승', STREAK_STOP: '연승 저지', MILESTONE: '기록', PERSONAL_BEST: '개인 최고', FIRST_GAME: '데뷔',
}
const ICON = {
  CHAMPION: 'crown', UPSET: 'bolt', COMEBACK: 'rotate-right', CLOSE: 'swords', RIVAL: 'swords', FIRST_WIN: 'trophy',
  STREAK: 'bolt', STREAK_STOP: 'flag', MILESTONE: 'star', PERSONAL_BEST: 'star', FIRST_GAME: 'user-plus',
}
</script>
