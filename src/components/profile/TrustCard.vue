<template>
  <section class="rounded-xl bg-surface p-4" aria-label="만나도 되는 사람인지">
    <div class="flex items-center gap-3">
      <div class="flex-1 min-w-0">
        <p class="t-micro">매치 온도</p>
        <p class="t-title tabular-nums" :class="trust.temperature >= 36.5 ? 'text-signal-fg' : trust.level === 'CAUTION' ? 'text-danger-fg' : ''">{{ trust.temperature.toFixed(1) }}°</p>
      </div>
      <UiBadge :tone="TONE[trust.level]" :icon="trust.level === 'TRUSTED' ? 'shield-halved' : trust.level === 'CAUTION' ? 'triangle-exclamation' : ''">{{ trust.label }}</UiBadge>
    </div>
    <!-- 36.5도에서 시작 (0~99.9). 막대는 30~45도를 보여 준다: 대부분 이 사이 -->
    <div class="h-1.5 rounded-full bg-surface-3 mt-2 overflow-hidden" aria-hidden="true">
      <div class="h-full rounded-full" :class="trust.level === 'CAUTION' ? 'bg-danger' : 'bg-signal'" :style="{ width: `${bar}%` }" />
    </div>

    <ul v-if="!compact" class="mt-4 grid grid-cols-2 gap-y-2 gap-x-3 t-caption">
      <li class="flex items-center gap-1.5"><UiIcon name="handshake" class="w-4 text-center" aria-hidden="true" />만나서 한 경기 <b class="text-fg tabular-nums">{{ trust.offlineGames }}번</b></li>
      <li class="flex items-center gap-1.5"><UiIcon name="star" class="w-4 text-center" aria-hidden="true" />
        <template v-if="trust.mannerCount">매너 <b class="text-fg tabular-nums">{{ trust.mannerAverage }}</b> ({{ trust.mannerCount }}명)</template>
        <template v-else>매너 평가 아직 없음</template>
      </li>
      <li class="flex items-center gap-1.5" :class="trust.disputes ? 'text-danger-fg' : ''"><UiIcon name="scale-unbalanced" class="w-4 text-center" aria-hidden="true" />결과 이견 <b class="tabular-nums">{{ trust.disputes ? `${trust.disputes}명` : '없음' }}</b></li>
      <li class="flex items-center gap-1.5"><UiIcon name="calendar" class="w-4 text-center" aria-hidden="true" />가입 {{ joined }}</li>
      <li class="flex items-center gap-1.5" :class="trust.dongVerified ? '' : 'text-fg-subtle'"><UiIcon :name="trust.dongVerified ? 'circle-check' : 'circle'" class="w-4 text-center" aria-hidden="true" />동네 인증</li>
      <li class="flex items-center gap-1.5" :class="trust.socialVerified ? '' : 'text-fg-subtle'"><UiIcon :name="trust.socialVerified ? 'circle-check' : 'circle'" class="w-4 text-center" aria-hidden="true" />소셜 계정 확인</li>
    </ul>
    <p v-if="!compact" class="t-micro mt-3">온도는 36.5도에서 시작해 매너 평가(평가한 사람마다 한 표), 만나서 겨룬 서로 다른 상대, 결과 이견으로만 오르내려요</p>
  </section>
</template>

<script setup lang="ts">
// 만나도 되는 사람인가 (기능 검토 #1, 11/3): 서버 TrustService가 확인된 사실만 모아 준다.
// 온도는 한눈에 보는 숫자, 아래 목록은 그 근거. compact면 온도와 단계만 (맞붙기 카드)
import { computed } from 'vue'
import type { components } from '@/api/schema'
import { UiBadge, UiIcon } from '../ui'

type Trust = components['schemas']['TrustSummary']
const props = defineProps<{ trust: Trust; compact?: boolean }>()

const TONE: Record<Trust['level'], string> = { NEW: 'neutral', NORMAL: 'neutral', TRUSTED: 'success', CAUTION: 'danger' }
const bar = computed(() => Math.min(100, Math.max(4, ((props.trust.temperature - 30) / 15) * 100)))
const joined = computed(() => {
  const d = props.trust.daysSinceJoined
  return d < 1 ? '오늘' : d < 30 ? `${d}일 전` : d < 365 ? `${Math.floor(d / 30)}개월 전` : `${Math.floor(d / 365)}년 전`
})
</script>
