<template>
  <UiCard :pad="false">
    <!-- 무엇을 · 어디서 언제 -->
    <button type="button" class="w-full flex items-start gap-3 p-4 pb-3 text-left" @click="emit('rule')">
      <img
        v-if="!imageFailed"
        :src="categoryImage"
        alt=""
        data-fallback="1"
        class="w-10 h-10 rounded-lg bg-surface-2 p-1.5 flex-shrink-0"
        @error="imageFailed = true"
      />
      <span v-else class="w-10 h-10 rounded-lg bg-surface-2 flex items-center justify-center flex-shrink-0" aria-hidden="true">
        <i class="fas fa-trophy text-fg-subtle"></i>
      </span>
      <span class="flex-1 min-w-0">
        <span class="block t-heading truncate">{{ game.rule?.ruleTitle }}</span>
        <span class="block t-caption truncate mt-0.5">{{ place(game.matchLocation) }} · {{ matchTime(game.matchDate) }}</span>
      </span>
      <span class="t-micro flex-shrink-0 mt-1">{{ timeAgo(game.createdAt) }}</span>
    </button>

    <!-- 누구와 · 신청 -->
    <div class="flex items-center gap-3 px-4 pb-4">
      <button type="button" class="flex-1 min-w-0 flex items-center gap-2.5 text-left" @click="emit('profile')">
        <UiAvatar :src="game.ownerProfileUrl" :name="game.ownerNickname" size="sm" />
        <span class="min-w-0">
          <span class="block text-sm text-fg truncate">{{ game.ownerNickname }}</span>
          <span class="block t-micro truncate">
            {{ game.ruleStatisticsOfOwner?.ruleRating || 1500 }}점 · {{ record(game.ruleStatisticsOfOwner) }}
          </span>
        </span>
      </button>
      <UiBadge v-if="isMine">내 경기</UiBadge>
      <UiButton v-else-if="game.isAppliedByMe" size="sm" variant="secondary" :loading="busy" @click="emit('cancel')">신청 취소</UiButton>
      <UiButton v-else size="sm" variant="tonal" :loading="busy" @click="emit('apply')">신청</UiButton>
    </div>

    <!-- 보조 행동 -->
    <div class="flex items-center gap-1 px-2 h-12 border-t border-line">
      <UiButton size="sm" variant="ghost" @click="emit('challengers')">신청자 {{ game.challengers?.length || 0 }}명</UiButton>
      <div class="flex-1"></div>
      <UiIconButton icon="far fa-comment" label="댓글" @click="emit('comment')" />
      <UiIconButton v-if="!isMine" icon="far fa-paper-plane" label="주최자에게 메시지" @click="emit('dm')" />
      <UiIconButton icon="fas fa-ellipsis" label="더보기" @click="emit('more')" />
    </div>
  </UiCard>
</template>

<script setup>
// 홈의 열린 경기 카드: 무엇을(규칙) → 어디서·언제 → 누구와 → 신청
import { ref, computed, defineProps, defineEmits } from 'vue'
import { UiAvatar, UiBadge, UiButton, UiCard, UiIconButton } from '../ui'
import { matchTime, place, record, timeAgo } from '../../utils/format'

const props = defineProps({
  game: { type: Object, required: true },
  isMine: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
})
const emit = defineEmits(['rule', 'profile', 'apply', 'cancel', 'challengers', 'comment', 'dm', 'more'])
// 카테고리 그림이 없으면 같은 자리에 기본 아이콘 (제목 줄이 카드마다 어긋나지 않게)
const imageFailed = ref(false)
const categoryImage = computed(() => `/category-picture/${props.game.rule?.minorCategory || '기타'}.png`)
</script>
