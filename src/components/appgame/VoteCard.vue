<template>
  <UiCard>
    <div class="flex items-center justify-between gap-2">
      <div v-if="card.key === 'sentence'" class="flex flex-wrap gap-1.5">
        <UiBadge v-for="w in card.problem.split(', ')" :key="w">{{ w }}</UiBadge>
      </div>
      <p v-else class="t-label break-keep">{{ card.problem }}</p>
      <span class="t-micro flex-shrink-0">{{ card.closed ? '마감' : `${until(card.votingEndsAt)}까지` }}</span>
    </div>

    <div class="space-y-2 mt-3">
      <button
        v-for="(o, i) in card.options"
        :key="o.playId"
        type="button"
        class="w-full text-left rounded-xl px-4 py-3 transition-colors"
        :class="card.myVote === o.playId ? 'bg-fg text-canvas' : 'bg-surface-2 active:bg-surface-3'"
        :disabled="!canVote || voting"
        :aria-pressed="card.myVote === o.playId"
        @click="vote(o.playId)"
      >
        <span class="t-micro block" :class="card.myVote === o.playId ? 'text-canvas' : ''">{{ i === 0 ? 'A' : 'B' }}</span>
        <span class="t-body block mt-0.5 whitespace-pre-line break-keep">{{ o.text }}</span>
      </button>
    </div>

    <p class="t-caption mt-3">
      <template v-if="card.isMine">내 경기라 투표할 수 없어요</template>
      <template v-else-if="card.myVote">투표했어요. 결과는 마감 뒤에 나와요</template>
      <template v-else-if="card.closed">투표가 끝났어요</template>
      <template v-else>더 마음이 가는 글을 눌러 주세요. 한 번만 할 수 있어요</template>
    </p>
    <p v-if="error" class="t-caption text-danger mt-1">{{ error }}</p>
  </UiCard>
</template>

<script setup lang="ts">
// 투표 카드: 같은 제시어로 쓴 두 문장. 쓴 사람과 표 수는 마감 전까지 가린다 (순서도 보는 사람마다 서버가 섞는다)
import { ref, computed } from 'vue'
import { POST } from '@/api/client'
import type { components } from '@/api/schema'
import { UiBadge, UiCard } from '../ui'

type Card = components['schemas']['AppVoteCard']
// visitorId: 로그인 전에 투표 링크를 연 사람이면 기기 번호로 한 표 (경로 2 리뷰 N3)
const props = defineProps<{ card: Card; visitorId?: string }>()
const emit = defineEmits<{ voted: [card: Card] }>()

const voting = ref(false)
const error = ref('')
const canVote = computed(() => !props.card.isMine && !props.card.myVote && !props.card.closed)

function until(at?: string) {
  if (!at) return ''
  const d = new Date(at)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

async function vote(playId: number) {
  if (!canVote.value) return
  voting.value = true
  error.value = ''
  try {
    emit('voted', props.visitorId
      ? (await POST('/api/app-games/votes/{gameId}/guest', { path: { gameId: props.card.gameId }, body: { playId, visitorId: props.visitorId } })).data
      : (await POST('/api/app-games/votes/{gameId}', { path: { gameId: props.card.gameId }, body: { playId } })).data)
  } catch (e) {
    error.value = (e as { response?: { data?: { message?: string } } }).response?.data?.message || '투표하지 못했어요'
  } finally {
    voting.value = false
  }
}
</script>
