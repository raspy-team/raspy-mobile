<template>
  <UiCard :pad="false">
    <!-- 무엇을 · 어디서 언제 -->
    <div class="flex items-start gap-3 p-4 pb-3">
      <button type="button" class="flex-1 min-w-0 flex items-start gap-3 text-left" @click="emit('rule')">
        <RuleThumb :rule="game.rule" :size="40" class="!rounded-lg" />
        <span class="flex-1 min-w-0">
          <span class="block t-heading truncate">{{ game.rule?.ruleTitle }}</span>
          <span class="block t-caption truncate mt-0.5">{{ place(game.matchLocation) }} · {{ matchTime(game.matchDate) }}</span>
        </span>
      </button>
      <!-- 댓글·메시지·공유·신고는 여기로 (카드마다 아이콘 줄을 두지 않는다) -->
      <UiIconButton icon="fas fa-ellipsis" label="더보기" class="-mt-2 -mr-2" @click="emit('more')" />
    </div>

    <!-- 누구와 · 신청 -->
    <div class="flex items-center gap-3 px-4 pb-4">
      <button type="button" class="flex-1 min-w-0 flex items-center gap-2.5 text-left" @click="emit('profile')">
        <UiAvatar :src="game.ownerProfileUrl" :name="game.ownerNickname" size="sm" />
        <span class="min-w-0">
          <span class="block text-sm text-fg truncate">{{ game.ownerNickname }}</span>
          <!-- 아직 안 해 본 사람의 '1500점 · 첫 경기 전'은 정보가 아니라 소음이라 뺀다 -->
          <span class="block t-micro truncate">{{ ownerLine }}</span>
        </span>
      </button>
      <button v-if="applicants" type="button" class="t-micro underline underline-offset-2 flex-shrink-0" @click="emit('challengers')">
        {{ applicants }}명 신청
      </button>
      <UiBadge v-if="isMine">내 경기</UiBadge>
      <UiButton v-else-if="game.isAppliedByMe" size="sm" variant="secondary" :loading="busy" @click="emit('cancel')">신청 취소</UiButton>
      <UiButton v-else size="sm" variant="tonal" :loading="busy" @click="emit('apply')">신청</UiButton>
    </div>
  </UiCard>
</template>

<script setup>
// 홈의 열린 경기 카드: 무엇을(규칙) → 어디서·언제 → 누구와 → 신청
import RuleThumb from '../rule/RuleThumb.vue'
import { computed, defineProps, defineEmits } from 'vue'
import { UiAvatar, UiBadge, UiButton, UiCard, UiIconButton } from '../ui'
import { matchTime, place, ratingLine, timeAgo } from '../../utils/format'

const props = defineProps({
  game: { type: Object, required: true },
  isMine: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
})
const emit = defineEmits(['rule', 'profile', 'apply', 'cancel', 'challengers', 'more'])

const applicants = computed(() => props.game.challengers?.length || 0)
// 올린 지 얼마나 됐는지는 경기 시간보다 덜 중요해서 위 줄이 아니라 여기에
const ownerLine = computed(() =>
  [ratingLine(props.game.ruleStatisticsOfOwner), props.game.createdAt && `${timeAgo(props.game.createdAt)} 올림`].filter(Boolean).join(' · '),
)
</script>
