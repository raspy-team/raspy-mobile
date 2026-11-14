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
      <!-- 투표 카드를 못 받으면 회색 틀이 그대로 남았다 (경로 6 리뷰 P10) -->
      <p v-if="cardFailed" class="t-caption py-6 text-center">투표를 불러오지 못했어요 · <button type="button" class="hit underline underline-offset-2" @click="loadCard">다시 시도</button></p>
      <UiSkeleton v-else-if="!card" class="h-40 w-full rounded-xl" />
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
          <span :class="side.won ? 'hl' : ''">{{ side.name }}</span>
        </button>
        <span class="order-2 text-[1.75rem] font-semibold leading-none tracking-[-0.04em] tabular-nums">
          <span :class="sides[0].won || isDraw ? 'text-fg' : 'text-fg-subtle'">{{ sides[0].score }}</span><span class="text-fg-subtle mx-1">:</span><span :class="sides[1].won || isDraw ? 'text-fg' : 'text-fg-subtle'">{{ sides[1].score }}</span>
        </span>
      </div>
      <p class="text-center t-micro mt-2">{{ isDraw ? '무승부' : graded ? '등급' : duel.scoreUnit }}</p>
      <!-- 수 기록으로 그린 그림 (낱말 사슬·마지막 판·막대) -->
      <AppVisualFigure
        :visual="story?.appVisual"
        :players="feedPlayers"
        :scores="duel.scores"
        :winner-id="duel.winnerId"
        :unit="duel.scoreUnit"
      />
      <!-- 카드에는 짧게, 세부는 눌러서 창으로 (11/14 고병연: 글 전부를 카드에 펼치니 소식이 글로 뒤덮였다).
           글이 있는 자리 전체가 누르는 곳이다. 세부가 없는 게임은 누를 수 없는 글 그대로 -->
      <component
        :is="hasDetail && !still ? 'button' : 'div'"
        v-if="sides.some((s) => s.text)"
        :type="hasDetail && !still ? 'button' : undefined"
        class="mt-4 block w-full text-left space-y-2"
        :class="hasDetail && !still ? 'rounded-xl bg-surface-2/60 px-3.5 py-3 active:bg-surface-2' : ''"
        @click="hasDetail && !still && (detailOpen = true)"
      >
        <!-- 그림으로 찍을 때(still)는 세 줄까지: 긴 대답이 카드를 늘려 스토리 그림의 꼬리(주소)가 밀려났다 (3-5 P6 나머지 F1) -->
        <p v-for="(side, i) in sides.filter((s) => s.text)" :key="i" class="t-body line-clamp-3">
          <span class="t-micro block">{{ side.name }}</span>{{ side.text }}
        </p>
        <span v-if="hasDetail && !still" class="flex items-center justify-end gap-1 t-micro">쓴 글과 AI 심사 보기 <UiIcon name="chevron-right" class="text-xs" /></span>
      </component>
    </div>

    <!-- 세부: 문제, 각자 쓴 글 전부, AI의 한마디 -->
    <UiSheet v-if="hasDetail && !still" v-model="detailOpen" :title="duel.title">
      <p v-if="sharedProblem" class="t-caption break-keep whitespace-pre-line mb-4">{{ sharedProblem }}</p>
      <div v-for="(side, i) in sides" :key="i" class="py-4 border-t border-line first:border-t-0 first:pt-0">
        <div class="flex items-baseline justify-between gap-3">
          <span class="t-label truncate" :class="side.won ? 'text-fg' : 'text-fg-muted'"><span :class="side.won ? 'hl' : ''">{{ side.name }}</span></span>
          <span class="t-label tabular-nums flex-shrink-0">{{ graded ? `${side.score}등급` : `${side.score}${duel.scoreUnit.length > 1 ? " " : ""}${duel.scoreUnit}` }}</span>
        </div>
        <template v-if="details[i]">
          <p class="t-body whitespace-pre-line break-words mt-2">{{ details[i]!.answer }}</p>
          <p v-if="details[i]!.feedback && !graded" class="t-caption whitespace-pre-line break-keep mt-3"><span class="t-micro block">AI 심사</span>{{ details[i]!.feedback }}</p>
        </template>
        <p v-else class="t-caption mt-2">{{ side.text || '쓴 글은 공개하지 않아요' }}</p>
      </div>
      <template #footer>
        <UiButton block @click="detailOpen = false; emit('play')">나도 한 판</UiButton>
      </template>
    </UiSheet>

    <!-- 투표 중에는 이름을 가린 동안이라 사람에게 잇는 행동(또 보고 싶어요·도전해요)을 두지 않는다 -->
    <template v-if="!voting">
      <FeedVoice :post="post" />
      <FeedActions v-if="!still" :post="post" :my-id="myId ?? undefined" shareable @like="emit('like')" @comment="emit('comment')" @share="emit('share')" @watch="(t) => emit('watch', t)" @challenge="(t) => emit('challenge', t)" />
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
import { UiButton, UiIcon, UiSheet, UiSkeleton } from '../ui'
import { timeAgo } from '../../utils/format'

type Post = components['schemas']['FeedItemResponse']
const props = defineProps<{ post: Post; highlight?: boolean; myId?: number | null; /** 그림으로 찍을 때: 누르는 것을 빼고 결과만 */ still?: boolean }>()
type Player = { id: number; name: string; isBot?: boolean }
const emit = defineEmits<{ profile: [id?: number]; like: []; comment: []; share: []; play: []; watch: [targets: Player[]]; challenge: [targets: Player[]] }>()

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
      name: p?.isBot ? 'AI' : p?.name ?? '',
      isBot: !!p?.isBot,
      // 임기응변은 큰 숫자도 등급으로: 점수(47 : 39)가 크고 등급은 아래 글에만 있었다 (경로 6 리뷰 P11)
      score: gradeOf(duel.value.texts?.[i]) ?? Math.round(duel.value.scores?.[i] ?? 0),
      text: duel.value.texts?.[i] ?? '',
      won: p != null && p.id === duel.value.winnerId,
    }
  }),
)
const when = computed(() => (props.post.date ? timeAgo(props.post.date) : ''))
// 서버 feed_story가 붙인 이야기 (앱 대결은 수 기록 그림만 쓴다)
const story = computed(() => (props.post as { story?: { appVisual?: any } | null }).story)
// 눌러서 보는 세부 (서버 AppDuelFeedItems.detail): 문제·쓴 글 전부·AI 한마디. 한쪽이라도 있으면 누를 수 있다
const details = computed(() => duel.value.details ?? [])
const hasDetail = computed(() => details.value.some((d) => !!d))
const sharedProblem = computed(() => details.value.find((d) => d?.problem)?.problem ?? '')
const detailOpen = ref(false)
const feedPlayers = computed(() => (props.post.players as unknown as { id: number; name: string; isBot?: boolean }[] | undefined) || [])

function gradeOf(text?: string): number | null {
  const m = duel.value.key === 'improv' ? text?.match(/^(\d)등급/) : null
  return m ? Number(m[1]) : null
}
const graded = computed(() => duel.value.key === 'improv' && (duel.value.texts ?? []).some((t) => gradeOf(t) != null))

const cardFailed = ref(false)
async function loadCard() {
  cardFailed.value = false
  try {
    card.value = (await GET('/api/app-games/votes/{gameId}', { path: { gameId: duel.value.gameId } })).data
  } catch {
    card.value = null
    cardFailed.value = true
  }
}
onMounted(() => {
  if (voting.value) loadCard()
})
</script>
