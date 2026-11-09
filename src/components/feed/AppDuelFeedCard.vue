<template>
  <article :class="[still ? '' : 'border-b border-line py-5', { 'bg-surface-2/40 -mx-4 px-4 rounded-xl': highlight }]">
    <FeedStoryLine v-if="!voting" :story="post.story" />
    <header class="flex items-center gap-3">
      <span class="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center flex-shrink-0" aria-hidden="true">
        <UiIcon :name="gameIcon(duel.key, duel.icon)" />
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
    <div v-else class="mt-4 mb-1">
      <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <button
          v-for="(side, i) in sides"
          :key="i"
          type="button"
          class="min-w-0 truncate text-[0.9375rem] py-2.5 -my-2.5"
          :class="[i === 0 ? 'text-left order-1' : 'text-right order-3', side.won ? 'text-fg font-semibold' : 'text-fg-muted']"
          @click="emit('profile', side.id)"
        >
          <span :class="side.won ? 'hl' : ''">{{ side.name }}</span><UiAiBadge v-if="side.isBot" />
        </button>
        <span class="order-2 text-[1.75rem] font-semibold leading-none tracking-[-0.04em] tabular-nums">
          <span :class="sides[0].won || isDraw ? 'text-fg' : 'text-fg-subtle'">{{ sides[0].score }}</span><span class="text-fg-subtle mx-1">:</span><span :class="sides[1].won || isDraw ? 'text-fg' : 'text-fg-subtle'">{{ sides[1].score }}</span>
        </span>
      </div>
      <p class="text-center t-micro mt-2">{{ isDraw ? '무승부' : duel.scoreUnit }}</p>
      <!-- 수 기록으로 그린 그림 (낱말 사슬·마지막 판·막대) -->
      <AppVisualFigure
        :visual="story?.appVisual"
        :players="feedPlayers"
        :scores="duel.scores"
        :winner-id="duel.winnerId"
        :unit="duel.scoreUnit"
      />
      <div v-if="sides.some((s) => s.text)" class="mt-4 space-y-2">
        <p v-for="(side, i) in sides.filter((s) => s.text)" :key="i" class="t-body">
          <span class="t-micro block">{{ side.name }}<UiAiBadge v-if="side.isBot" /></span>{{ side.text }}
        </p>
      </div>
    </div>

    <!-- 투표 중에는 이름을 가린 동안이라 사람에게 잇는 행동(또 보고 싶어요·도전해요)을 두지 않는다 -->
    <template v-if="!voting">
      <FeedVoice :post="post" />
      <FeedActions v-if="!still" :post="post" :my-id="myId ?? undefined" @like="emit('like')" @comment="emit('comment')" @watch="(t) => emit('watch', t)" @challenge="(t) => emit('challenge', t)" />
    </template>
  </article>
</template>

<script setup lang="ts">
import { gameIcon } from '@/utils/appGameIcon'
// 피드의 앱 대결 한 장. 끝난 대결은 점수와 승자(+요리 이름·문장), 투표 중인 문장 대결은 그 자리에서 투표
import { ref, computed, onMounted } from 'vue'
import { GET } from '@/api/client'
import type { components } from '@/api/schema'
import VoteCard from '../appgame/VoteCard.vue'
import AppVisualFigure from './story/AppVisualFigure.vue'
import FeedStoryLine from './FeedStoryLine.vue'
import FeedVoice from './FeedVoice.vue'
import FeedActions from './FeedActions.vue'
import { UiAiBadge, UiIcon, UiSkeleton } from '../ui'
import { timeAgo } from '../../utils/format'

type Post = components['schemas']['FeedItemResponse']
const props = defineProps<{ post: Post; highlight?: boolean; myId?: number | null; /** 그림으로 찍을 때: 누르는 것을 빼고 결과만 */ still?: boolean }>()
type Player = { id: number; name: string; isBot?: boolean }
const emit = defineEmits<{ profile: [id?: number]; like: []; comment: []; play: []; watch: [targets: Player[]]; challenge: [targets: Player[]] }>()

const duel = computed(() => props.post.appDuel!)
const voting = computed(() => props.post.type === 'app_vote')
const card = ref<components['schemas']['AppVoteCard'] | null>(null)
const isDraw = computed(() => duel.value.winnerId == null)
const sides = computed(() =>
  [0, 1].map((i) => {
    // OpenAPI 문서에 이름이 같은 PlayerDto가 둘이라 타입이 다른 쪽으로 잡힌다. 피드의 선수는 { id, name, avatar }
    const p = (props.post.players as unknown as Player[] | undefined)?.[i]
    return {
      id: p?.id,
      name: p?.name ?? '',
      isBot: !!p?.isBot,
      score: Math.round(duel.value.scores?.[i] ?? 0),
      text: duel.value.texts?.[i] ?? '',
      won: p != null && p.id === duel.value.winnerId,
    }
  }),
)
const when = computed(() => (props.post.date ? timeAgo(props.post.date) : ''))
// 서버 feed_story가 붙인 이야기 (앱 대결은 수 기록 그림만 쓴다)
const story = computed(() => (props.post as { story?: { appVisual?: any } | null }).story)
const feedPlayers = computed(() => (props.post.players as unknown as { id: number; name: string; isBot?: boolean }[] | undefined) || [])

onMounted(async () => {
  if (!voting.value) return
  try {
    card.value = (await GET('/api/app-games/votes/{gameId}', { path: { gameId: duel.value.gameId } })).data
  } catch {
    card.value = null
  }
})
</script>
