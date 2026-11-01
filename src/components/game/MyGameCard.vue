<template>
  <UiCard :pad="false">
    <div class="flex items-start gap-3 p-4 pb-3">
      <RuleThumb :rule="game.rule" :size="40" class="!rounded-lg" />
      <div class="flex-1 min-w-0">
        <p class="t-heading truncate">{{ game.rule?.ruleTitle }}</p>
        <p class="t-caption truncate mt-0.5">{{ place(game.matchLocation) }} · {{ matchTime(game.matchDate) }}</p>
      </div>
      <UiBadge :tone="state.tone" class="mt-0.5">{{ state.label }}</UiBadge>
    </div>

    <!-- 나 vs 상대 -->
    <div class="flex items-center gap-3 px-4 pb-4">
      <button type="button" class="flex items-center gap-2 min-w-0 flex-1" @click="emit('profile', me.id)">
        <UiAvatar :src="me.avatar" :name="me.name" size="sm" />
        <span class="text-sm text-fg truncate">{{ me.name }}</span>
      </button>
      <span class="t-micro">vs</span>
      <button
        v-if="opponent"
        type="button"
        class="flex items-center justify-end gap-2 min-w-0 flex-1"
        @click="emit('profile', opponent.id)"
      >
        <span class="text-sm text-fg truncate">{{ opponent.name }}</span>
        <UiAvatar :src="opponent.avatar" :name="opponent.name" size="sm" />
      </button>
      <span v-else class="flex-1 flex items-center justify-end gap-2 min-w-0">
        <span class="t-caption truncate">상대 구하는 중</span>
        <span class="w-8 h-8 rounded-full border border-dashed border-line-strong flex-shrink-0" aria-hidden="true"></span>
      </span>
    </div>

    <!-- 지금 이 경기에서 할 일 하나 + 더보기 -->
    <div class="flex items-center gap-2 px-4 pb-4">
      <UiButton v-if="state.action" block :variant="state.actionVariant" @click="emit(state.action)">{{ state.actionLabel }}</UiButton>
      <p v-else class="flex-1 t-caption">{{ state.hint }}</p>
      <UiIconButton icon="fas fa-ellipsis" label="더보기" class="flex-shrink-0" @click="emit('more')" />
    </div>
  </UiCard>
</template>

<script setup>
// 내 경기 카드. 상태에 따라 배지 하나와 '지금 할 일' 버튼 하나만 보여준다
import RuleThumb from '../rule/RuleThumb.vue'
import { computed, defineProps, defineEmits } from 'vue'
import { UiAvatar, UiBadge, UiButton, UiCard, UiIconButton } from '../ui'
import { matchTime, place } from '../../utils/format'

const props = defineProps({
  game: { type: Object, required: true },
  me: { type: Object, default: () => ({ name: '나' }) }, // { id, name, avatar }
})
const emit = defineEmits(['profile', 'play', 'start', 'applicants', 'share', 'cancel-request', 'result', 'more'])

const isMine = computed(() => props.game.type === 'my-game')
const approved = computed(() => (props.game.applicants || []).find((a) => a.approved))

// 내 경기 응답에는 내 정보(my*)가 있고, 신청한 경기 응답에는 없어서 화면이 넘겨준다
const me = computed(() =>
  isMine.value ? { id: props.game.myId, name: props.game.myNickname, avatar: props.game.myProfileUrl } : props.me,
)

const opponent = computed(() => {
  const g = props.game
  if (!isMine.value) return { id: g.ownerId, name: g.ownerNickname, avatar: g.ownerProfileUrl }
  if (g.opponentNickname) return { id: g.opponentId, name: g.opponentNickname, avatar: g.opponentProfileUrl }
  if (approved.value) return { id: approved.value.userId, name: approved.value.applicantNickname, avatar: approved.value.applicantProfileUrl }
  return null
})

// 상태 → 배지 + 할 일 (한 곳에서 정한다)
// 주황(primary)은 진행 중인 경기로 돌아가기만. 나머지 할 일은 tonal로 옅게 (카드마다 주황이 반복되지 않게)
const state = computed(() => {
  const g = props.game
  const live = g.status === 'IN_PROGRESS' || g.gameStatus === 'IN_PROGRESS'
  if (live) return { label: '진행 중', tone: 'success', action: 'play', actionLabel: '경기로 돌아가기', actionVariant: 'primary' }
  if (g.status === 'RESULT_PENDING' || g.gameStatus === 'RESULT_PENDING') {
    return g.resultSubmittedById === me.value?.id
      ? { label: '확인 대기', tone: 'neutral', hint: '상대가 확인하면 기록돼요', action: 'result', actionLabel: '낸 결과 보기', actionVariant: 'secondary' }
      : { label: '결과 확인', tone: 'primary', action: 'result', actionLabel: '결과 확인하기', actionVariant: 'tonal' }
  }
  if (isMine.value) {
    const n = (g.applicants || []).length
    if (g.status === 'COMPLETED') return { label: '끝남', tone: 'neutral', action: 'result', actionLabel: '결과 보기', actionVariant: 'secondary' }
    if (g.status === 'CANCELED') return { label: '취소됨', tone: 'neutral', hint: '취소된 경기예요' }
    if (g.status === 'SCHEDULED') {
      return g.isOwner === false
        ? { label: '확정', tone: 'primary', hint: '주최자가 시작하면 알려드려요' }
        : { label: '확정', tone: 'primary', action: 'start', actionLabel: '경기 시작', actionVariant: 'tonal' }
    }
    if (n > 0) return { label: `신청 ${n}명`, tone: 'primary', action: 'applicants', actionLabel: '신청자 보고 승인하기', actionVariant: 'tonal' }
    return { label: '상대 구하는 중', tone: 'neutral', action: 'share', actionLabel: '링크 공유하기', actionVariant: 'secondary' }
  }
  if (g.status === 'REQUESTED') return { label: '승인 대기', tone: 'neutral', action: 'cancel-request', actionLabel: '신청 취소', actionVariant: 'secondary' }
  if (g.status === 'APPROVED') return { label: '확정', tone: 'primary', hint: '주최자가 시작하면 알려드려요' }
  if (g.status === 'REJECTED') return { label: '거절됨', tone: 'danger', hint: '다른 경기를 찾아보세요' }
  return { label: '대기', tone: 'neutral', hint: '' }
})
</script>
