<template>
  <!-- 프로필에는 숫자와 단계만. 근거와 계산은 눌러서 본다 (점진적 공개) -->
  <button type="button" class="block w-full rounded-xl bg-surface p-4 text-left active:bg-surface-2 transition-[background-color,transform] motion-safe:active:scale-[0.98]" :aria-label="`신뢰 온도 ${temp}도, ${trust.label}. 자세히 보기`" @click="open = true">
    <span class="flex items-center gap-1 t-label">신뢰 온도<UiIcon name="info-circle" class="text-fg-subtle" /></span>
    <span class="block t-title tabular-nums mt-1" :class="tone">{{ temp }}°</span>
    <span class="block t-caption mt-0.5">{{ trust.label }}<template v-if="trust.vouched"> · 보증받은 사람</template></span>
  </button>

  <UiSheet v-model="open" title="신뢰 온도">
    <div class="flex items-end justify-between">
      <p class="t-display tabular-nums" :class="tone">{{ temp }}°</p>
      <UiBadge :tone="TONE[trust.level]" :icon="trust.level === 'TRUSTED' ? 'shield-halved' : ['CAUTION', 'SUSPENDED'].includes(trust.level) ? 'triangle-exclamation' : ''">{{ trust.label }}</UiBadge>
    </div>
    <!-- 36.5도에서 시작 (0~99.9). 막대는 30~45도를 보여 준다: 대부분 이 사이 -->
    <div class="h-1.5 rounded-full bg-surface-3 mt-3 overflow-hidden" aria-hidden="true">
      <div class="h-full rounded-full" :class="['CAUTION', 'SUSPENDED'].includes(trust.level) ? 'bg-danger' : 'bg-signal'" :style="{ width: `${bar}%` }" />
    </div>

    <!-- 한 문장에 한 가지. 오르는 때와 내리는 때를 나눠 읽게 -->
    <div class="mt-5 space-y-3 t-body">
      <p>처음 만나도 괜찮은 사람인지 보여 주는 숫자예요. 누구나 36.5도에서 시작해요.</p>
      <p><b>올라가요.</b> 상대가 매너를 좋게 평가하거나, 처음 보는 사람과 만나서 경기하면요.</p>
      <p><b>내려가요.</b> 매너 평가가 나쁘거나, 경기 결과가 맞지 않아 다투거나, 약속에 나오지 않으면(노쇼)요.</p>
      <p>평가는 둘 다 남기거나 7일이 지나야 반영돼요. '또 만나고 싶은지'도 남몰래 반영돼요.</p>
    </div>

    <UiList class="mt-5">
      <UiListItem icon="handshake" title="만나서 한 경기" :subtitle="`${trust.offlineGames}번`" />
      <UiListItem icon="star" title="매너 평가" :subtitle="trust.mannerCount ? `평균 ${trust.mannerAverage}점 (${trust.mannerCount}명)` : '아직 없어요'" />
      <UiListItem icon="scale-unbalanced" title="결과 다툼" :subtitle="trust.disputes ? `${trust.disputes}명과 결과가 맞지 않았어요` : '없어요'" :danger="!!trust.disputes" />
      <UiListItem icon="user-check" title="보증" :subtitle="trust.vouches ? `만나 본 ${trust.vouches}명이 보증했어요${trust.vouched ? ' · 보증받은 사람' : ''}` : '아직 없어요'" />
      <UiListItem v-if="trust.meetAgainCount" icon="user-group" title="또 만나고 싶대요" :subtitle="`${trust.meetAgainCount}명`" />
      <UiListItem v-if="trust.noShows" icon="triangle-exclamation" title="노쇼" :subtitle="`${trust.noShows}번 약속에 나오지 않았어요`" danger />
      <UiListItem icon="calendar" title="가입" :subtitle="joined" />
      <UiListItem :icon="trust.dongVerified ? 'circle-check' : 'circle'" title="동네 인증" :subtitle="trust.dongVerified ? '했어요' : '안 했어요'" />
      <UiListItem :icon="trust.socialVerified ? 'circle-check' : 'circle'" title="카카오·구글 계정 연결" :subtitle="trust.socialVerified ? '했어요' : '안 했어요'" />
    </UiList>

    <!-- 보증해요 (안전·신뢰 E, 카우치서핑 방식): 만나서 경기해 본 사람만. 보증받은 사람의 보증이 더 무겁다 -->
    <div v-if="vouch && (vouch.canVouch || vouch.mine)" class="mt-5 rounded-xl bg-surface px-4 py-3">
      <p class="t-body">{{ vouch.mine ? '내가 보증했어요' : '만나 보니 믿을 만했나요?' }}</p>
      <p class="t-caption mt-0.5">보증은 이름과 함께 남아요. 보증받은 사람의 보증일수록 무겁게 쳐요</p>
      <UiButton v-if="!vouch.mine" size="sm" class="mt-3" icon="user-check" :loading="vouching" @click="toggleVouch">보증</UiButton>
      <UiButton v-else size="sm" variant="ghost" class="mt-3" :loading="vouching" @click="toggleVouch">보증 취소</UiButton>
    </div>
  </UiSheet>
</template>

<script setup lang="ts">
// 만나도 되는 사람인가 (기능 검토 #1, 11/3): 서버 TrustService가 확인된 사실만 모아 준다.
// 프로필에는 온도·단계만 작게 두고, 근거와 오르내리는 이유는 눌러서 연다 (애플 HIG 점진적 공개, 11/3)
import { computed, ref, watch } from 'vue'
import type { components } from '@/api/schema'
import { GET, POST, DELETE } from '@/api/client'
import { useToast } from '@/composables/useToast'
import { UiBadge, UiButton, UiIcon, UiList, UiListItem, UiSheet } from '../ui'

type Trust = components['schemas']['TrustSummary']
const props = defineProps<{ trust: Trust; userId?: number; isMe?: boolean }>()

const { showToast } = useToast()
const open = ref(false)
// 보증 (안전·신뢰 E): 남의 프로필에서 시트를 열 때만 묻는다
const vouch = ref<components['schemas']['VouchState'] | null>(null)
const vouching = ref(false)
watch(open, async (o) => {
  if (!o || !props.userId || props.isMe) return
  vouch.value = (await GET('/api/vouch/{userId}', { path: { userId: props.userId } }).catch(() => ({ data: null }))).data
})
async function toggleVouch() {
  if (!props.userId || !vouch.value) return
  vouching.value = true
  try {
    const path = { userId: props.userId }
    vouch.value = (vouch.value.mine ? await DELETE('/api/vouch/{userId}', { path }) : await POST('/api/vouch/{userId}', { path })).data
  } catch (e) {
    // 실패해도 말이 없어 됐는지 몰랐다 (목적 판정 6)
    showToast((e as { response?: { data?: { message?: string } } }).response?.data?.message || '반영하지 못했어요. 잠시 뒤 다시 해 주세요')
  } finally {
    vouching.value = false
  }
}
const TONE: Record<Trust['level'], string> = { NEW: 'neutral', NORMAL: 'neutral', TRUSTED: 'success', CAUTION: 'danger', SUSPENDED: 'danger' }
const temp = computed(() => props.trust.temperature.toFixed(1))
const tone = computed(() => (['CAUTION', 'SUSPENDED'].includes(props.trust.level) ? 'text-danger-fg' : props.trust.temperature >= 36.5 ? 'text-signal-fg' : ''))
const bar = computed(() => Math.min(100, Math.max(4, ((props.trust.temperature - 30) / 15) * 100)))
const joined = computed(() => {
  const d = props.trust.daysSinceJoined
  return d < 1 ? '오늘' : d < 30 ? `${d}일 전` : d < 365 ? `${Math.floor(d / 30)}개월 전` : `${Math.floor(d / 365)}년 전`
})
</script>
