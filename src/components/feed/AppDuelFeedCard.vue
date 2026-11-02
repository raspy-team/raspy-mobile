<template>
  <article class="border-b border-line py-5" :class="{ 'bg-surface-2/40 -mx-4 px-4 rounded-xl': highlight }">
    <header class="flex items-center gap-3">
      <span class="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center flex-shrink-0" aria-hidden="true">
        <UiIcon :name="duel.icon" />
      </span>
      <button type="button" class="flex-1 min-w-0 text-left" @click="emit('play')">
        <span class="block text-sm font-semibold text-fg truncate">{{ duel.title }}</span>
        <span class="block t-micro truncate">앱 게임 · {{ voting ? '투표 중' : when }}</span>
      </button>
    </header>

    <!-- 투표 중: 쓴 사람을 가린 채 그 자리에서 투표 -->
    <div v-if="voting" class="mt-3">
      <UiSkeleton v-if="!card" class="h-40 w-full rounded-xl" />
      <VoteCard v-else :card="card" @voted="card = $event" />
    </div>

    <!-- 끝난 대결: 누가 몇 점(표·타)으로 이겼나 -->
    <div v-else class="mt-3 rounded-xl bg-surface px-4 py-5">
      <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <button
          v-for="(side, i) in sides"
          :key="i"
          type="button"
          class="min-w-0 truncate text-[15px]"
          :class="[i === 0 ? 'text-left order-1' : 'text-right order-3', side.won ? 'text-fg font-semibold' : 'text-fg-muted']"
          @click="emit('profile', side.id)"
        >
          <span :class="side.won ? 'hl' : ''">{{ side.name }}</span>
        </button>
        <span class="order-2 font-mono text-[28px] leading-none tracking-[-0.05em] tabular-nums">
          <span :class="sides[0].won || isDraw ? 'text-fg' : 'text-fg-subtle'">{{ sides[0].score }}</span><span class="text-fg-subtle mx-1">:</span><span :class="sides[1].won || isDraw ? 'text-fg' : 'text-fg-subtle'">{{ sides[1].score }}</span>
        </span>
      </div>
      <p class="text-center t-micro mt-2">{{ isDraw ? '무승부' : duel.scoreUnit }}</p>
      <div v-if="sides.some((s) => s.text)" class="mt-4 space-y-2">
        <p v-for="(side, i) in sides.filter((s) => s.text)" :key="i" class="t-body">
          <span class="t-micro block">{{ side.name }}</span>{{ side.text }}
        </p>
      </div>
    </div>

    <footer class="flex items-center mt-2 -ml-3">
      <template v-if="!voting">
        <button type="button" class="h-11 px-3 flex items-center gap-1.5 text-sm" :class="post.isLiked ? 'text-danger' : 'text-fg-muted'" :aria-pressed="post.isLiked" aria-label="좋아요" @click="emit('like')">
          <UiIcon :name="post.isLiked ? 'fas fa-heart' : 'far fa-heart'" class="text-lg" aria-hidden="true" />
          <span v-if="post.likeCount" class="tabular-nums">{{ post.likeCount }}</span>
        </button>
        <button type="button" class="h-11 px-3 flex items-center gap-1.5 text-sm text-fg-muted" aria-label="댓글" @click="emit('comment')">
          <UiIcon name="far fa-comment" class="text-lg" aria-hidden="true" />
          <span v-if="post.commentCount" class="tabular-nums">{{ post.commentCount }}</span>
        </button>
      </template>
      <div class="flex-1"></div>
      <UiButton size="sm" variant="tonal" @click="emit('play')">나도 한 판</UiButton>
    </footer>
  </article>
</template>

<script setup lang="ts">
// 피드의 앱 대결 한 장. 끝난 대결은 점수와 승자(+요리 이름·문장), 투표 중인 문장 대결은 그 자리에서 투표
import { ref, computed, onMounted } from 'vue'
import { GET } from '@/api/client'
import type { components } from '@/api/schema'
import VoteCard from '../appgame/VoteCard.vue'
import { UiButton, UiIcon, UiSkeleton } from '../ui'
import { timeAgo } from '../../utils/format'

type Post = components['schemas']['FeedItemResponse']
const props = defineProps<{ post: Post; highlight?: boolean }>()
const emit = defineEmits<{ profile: [id?: number]; like: []; comment: []; play: [] }>()

const duel = computed(() => props.post.appDuel!)
const voting = computed(() => props.post.type === 'app_vote')
const card = ref<components['schemas']['AppVoteCard'] | null>(null)
const isDraw = computed(() => duel.value.winnerId == null)
const sides = computed(() =>
  [0, 1].map((i) => {
    // OpenAPI 문서에 이름이 같은 PlayerDto가 둘이라 타입이 다른 쪽으로 잡힌다. 피드의 선수는 { id, name, avatar }
    const p = (props.post.players as unknown as { id: number; name: string }[] | undefined)?.[i]
    return {
      id: p?.id,
      name: p?.name ?? '',
      score: Math.round(duel.value.scores?.[i] ?? 0),
      text: duel.value.texts?.[i] ?? '',
      won: p != null && p.id === duel.value.winnerId,
    }
  }),
)
const when = computed(() => (props.post.date ? timeAgo(props.post.date) : ''))

onMounted(async () => {
  if (!voting.value) return
  try {
    card.value = (await GET('/api/app-games/votes/{gameId}', { path: { gameId: duel.value.gameId } })).data
  } catch {
    card.value = null
  }
})
</script>
