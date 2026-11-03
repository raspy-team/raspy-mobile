<template>
  <!-- 프로필에는 숫자와 단계만. 근거와 계산은 눌러서 본다 (점진적 공개) -->
  <button type="button" class="block w-full rounded-xl bg-surface p-4 text-left active:bg-surface-2 transition-[background-color,transform] motion-safe:active:scale-[0.98]" :aria-label="`신뢰 온도 ${temp}도, ${trust.label}. 자세히 보기`" @click="open = true">
    <span class="flex items-center gap-1 t-label">신뢰 온도<UiIcon name="info-circle" class="text-fg-subtle" /></span>
    <span class="block t-title tabular-nums mt-1" :class="tone">{{ temp }}°</span>
    <span class="block t-caption mt-0.5">{{ trust.label }}</span>
  </button>

  <UiSheet v-model="open" title="신뢰 온도">
    <div class="flex items-end justify-between">
      <p class="t-display tabular-nums" :class="tone">{{ temp }}°</p>
      <UiBadge :tone="TONE[trust.level]" :icon="trust.level === 'TRUSTED' ? 'shield-halved' : trust.level === 'CAUTION' ? 'triangle-exclamation' : ''">{{ trust.label }}</UiBadge>
    </div>
    <!-- 36.5도에서 시작 (0~99.9). 막대는 30~45도를 보여 준다: 대부분 이 사이 -->
    <div class="h-1.5 rounded-full bg-surface-3 mt-3 overflow-hidden" aria-hidden="true">
      <div class="h-full rounded-full" :class="trust.level === 'CAUTION' ? 'bg-danger' : 'bg-signal'" :style="{ width: `${bar}%` }" />
    </div>

    <!-- 한 문장에 한 가지. 오르는 때와 내리는 때를 나눠 읽게 -->
    <div class="mt-5 space-y-3 t-body">
      <p>처음 만나도 괜찮은 사람인지 보여 주는 숫자예요. 누구나 36.5도에서 시작해요.</p>
      <p><b>올라가요.</b> 상대가 매너를 좋게 평가하거나, 처음 보는 사람과 만나서 경기하면요.</p>
      <p><b>내려가요.</b> 매너 평가가 나쁘거나, 경기 결과가 맞지 않아 다투면요.</p>
    </div>

    <UiList class="mt-5">
      <UiListItem icon="handshake" title="만나서 한 경기" :subtitle="`${trust.offlineGames}번`" />
      <UiListItem icon="star" title="매너 평가" :subtitle="trust.mannerCount ? `평균 ${trust.mannerAverage}점 (${trust.mannerCount}명)` : '아직 없어요'" />
      <UiListItem icon="scale-unbalanced" title="결과 다툼" :subtitle="trust.disputes ? `${trust.disputes}명과 결과가 맞지 않았어요` : '없어요'" :danger="!!trust.disputes" />
      <UiListItem icon="calendar" title="가입" :subtitle="joined" />
      <UiListItem :icon="trust.dongVerified ? 'circle-check' : 'circle'" title="동네 인증" :subtitle="trust.dongVerified ? '했어요' : '안 했어요'" />
      <UiListItem :icon="trust.socialVerified ? 'circle-check' : 'circle'" title="카카오·구글 계정 연결" :subtitle="trust.socialVerified ? '했어요' : '안 했어요'" />
    </UiList>

  </UiSheet>
</template>

<script setup lang="ts">
// 만나도 되는 사람인가 (기능 검토 #1, 11/3): 서버 TrustService가 확인된 사실만 모아 준다.
// 프로필에는 온도·단계만 작게 두고, 근거와 오르내리는 이유는 눌러서 연다 (애플 HIG 점진적 공개, 11/3)
import { computed, ref } from 'vue'
import type { components } from '@/api/schema'
import { UiBadge, UiIcon, UiList, UiListItem, UiSheet } from '../ui'

type Trust = components['schemas']['TrustSummary']
const props = defineProps<{ trust: Trust }>()

const open = ref(false)
const TONE: Record<Trust['level'], string> = { NEW: 'neutral', NORMAL: 'neutral', TRUSTED: 'success', CAUTION: 'danger' }
const temp = computed(() => props.trust.temperature.toFixed(1))
const tone = computed(() => (props.trust.level === 'CAUTION' ? 'text-danger-fg' : props.trust.temperature >= 36.5 ? 'text-signal-fg' : ''))
const bar = computed(() => Math.min(100, Math.max(4, ((props.trust.temperature - 30) / 15) * 100)))
const joined = computed(() => {
  const d = props.trust.daysSinceJoined
  return d < 1 ? '오늘' : d < 30 ? `${d}일 전` : d < 365 ? `${Math.floor(d / 30)}개월 전` : `${Math.floor(d / 365)}년 전`
})
</script>
