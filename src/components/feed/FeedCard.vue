<template>
  <article class="border-b border-line py-5" :class="{ 'bg-surface-2/40 -mx-4 px-4 rounded-xl': highlight }">
    <FeedStoryLine :story="post.story" />
    <!-- 무엇을 · 어디서 · 언제 (이름은 아래 결과에 한 번만) -->
    <header class="flex items-center gap-3">
      <span class="flex -space-x-2 flex-shrink-0">
        <UiAvatar v-for="pl in players" :key="pl.id" :src="pl.avatar" :name="pl.name" :user-id="pl.id" size="sm" class="ring-2 ring-canvas" />
      </span>
      <button type="button" class="flex-1 min-w-0 text-left" @click="emit('rule')">
        <span class="flex items-center gap-1.5 text-sm font-semibold text-fg truncate">
          <RuleThumb :rule="post.rule" :size="18" bare />{{ post.rule?.ruleTitle }}
        </span>
        <span class="block t-micro truncate">{{ [post.meta?.place, when].filter(Boolean).join(' · ') }}</span>
      </button>
      <UiIconButton icon="fas fa-ellipsis" label="더보기" class="-mr-3 flex-shrink-0" @click="emit('more')" />
    </header>

    <!-- 결과: 이 카드의 주인공. 승자 이름에 형광펜. 카드 안에 상자를 또 두지 않는다 (11/3) -->
    <div class="mt-4 mb-1">
      <!-- 셋 이상이 각자: 등수 줄 -->
      <ol v-if="ranking.length" class="space-y-1.5">
        <li v-for="r in ranking" :key="r.id" class="flex items-center gap-3">
          <span class="t-mono w-8" :class="r.place === 1 ? 'text-fg font-bold' : 'text-fg-subtle'">{{ r.place }}등</span>
          <button type="button" class="min-w-0 truncate text-[0.9375rem] text-left py-2.5 -my-2.5" :class="r.place === 1 ? 'text-fg font-semibold' : 'text-fg-muted'" @click="emit('profile', r.id)">
            <span :class="r.place === 1 ? 'hl' : ''">{{ r.name }}</span>
          </button>
        </li>
      </ol>
      <div v-else class="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <button
          v-for="(side, i) in sides"
          :key="i"
          type="button"
          class="min-w-0 truncate text-[0.9375rem] py-2.5 -my-2.5"
          :class="[i === 0 ? 'text-left order-1' : 'text-right order-3', side.won ? 'text-fg font-semibold' : 'text-fg-muted']"
          @click="emit('profile', sideFirst(i)?.id)"
        >
          <span :class="side.won ? 'hl' : ''">{{ side.name }}</span>
        </button>
        <!-- 세트 점수 없이 승패만 남긴 경기는 0:0 대신 vs -->
        <span v-if="!hasScore" class="order-2 t-mono">vs</span>
        <span v-else class="order-2 text-[2.125rem] font-semibold leading-none tracking-[-0.04em] tabular-nums">
          <span :class="sides[0].won || isDraw ? 'text-fg' : 'text-fg-subtle'">{{ sides[0].score }}</span><span class="text-fg-subtle mx-1">:</span><span :class="sides[1].won || isDraw ? 'text-fg' : 'text-fg-subtle'">{{ sides[1].score }}</span>
        </span>
      </div>
      <!-- 기록으로 그린 그림 하나 (흐름·이변·왕관·전적·세트 칸). 그림이 세트 점수를 보여 주니 세트 줄은 그림이 없을 때만 -->
      <FeedStoryFigure
        v-if="!ranking.length && post.story"
        :story="post.story"
        :names="sides.map((s) => s.name)"
        :winner="winnerIndex"
        :set-scores="post.result?.setScores"
      />
      <p v-else-if="setLine && !ranking.length" class="text-center t-mono normal-case mt-3">{{ setLine }}</p>
      <p v-if="isDraw && !ranking.length" class="text-center t-micro mt-3">무승부</p>
    </div>

    <!-- 사진·영상 (있을 때만) -->
    <div v-if="post.photos?.length" class="mt-3 -mx-4 px-4 flex gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory">
      <template v-for="(m, i) in post.photos" :key="i">
        <video
          v-if="m.mediaType === 'VIDEO'"
          :src="m.url"
          class="snap-start flex-shrink-0 rounded-xl bg-surface-2 object-cover"
          :class="post.photos.length > 1 ? 'w-4/5 aspect-[4/5]' : 'w-full aspect-[4/3]'"
          controls
          muted
          playsinline
          preload="metadata"
        />
        <img
          v-else
          :src="m.url"
          alt="경기 사진"
          loading="lazy"
          data-fallback="1"
          class="snap-start flex-shrink-0 rounded-xl bg-surface-2 object-cover"
          :class="post.photos.length > 1 ? 'w-4/5 aspect-[4/5]' : 'w-full aspect-[4/3]'"
          @error="$event.target.style.display = 'none'"
        />
      </template>
    </div>

    <p v-if="post.caption && post.caption.trim()" class="t-body mt-3 whitespace-pre-line break-words">{{ post.caption }}</p>

    <FeedVoice :post="post" />

    <!-- 반응 + 사람에게 잇는 행동 ('이 규칙으로 한 판'은 더보기에) -->
    <FeedActions :post="post" :my-id="myId" @like="emit('like')" @comment="emit('comment')" @watch="(t) => emit('watch', t)" @challenge="(t) => emit('challenge', t)" />
  </article>
</template>

<script setup>
// 소식의 경기 한 장: 이야기 줄 → 누구 vs 누구 → 결과(점수·승자·규칙) → 사진(있으면) → 오른 점수·한마디(없으면 AI 기자) → 좋아요·댓글·또 보고 싶어요·도전해요. '이 규칙으로 한 판'은 더보기에
// 사진이 없어도 결과가 주인공이라 카드가 비지 않는다
import { computed, defineProps, defineEmits } from 'vue'
import RuleThumb from '../rule/RuleThumb.vue'
import FeedStoryFigure from './story/FeedStoryFigure.vue'
import FeedStoryLine from './FeedStoryLine.vue'
import FeedVoice from './FeedVoice.vue'
import FeedActions from './FeedActions.vue'
import { UiAvatar, UiIconButton } from '../ui'
import { timeAgo } from '../../utils/format'

const props = defineProps({
  post: { type: Object, required: true },
  highlight: { type: Boolean, default: false },
  myId: { type: Number, default: null },
})
const emit = defineEmits(['profile', 'rule', 'like', 'comment', 'watch', 'challenge', 'more', 'photo'])

const players = computed(() => props.post.players || [])
const ranking = computed(() => props.post.result?.ranking || [])
// 칸의 첫 사람. 팀 경기의 선수 목록은 [앞 팀..., 뒤 팀...] 순서다
const sideFirst = (i) => (props.post.result?.sideNames?.length === 2 && i === 1 ? players.value[players.value.length / 2] : players.value[i])
const isDraw = computed(() => !props.post.result?.winner)
const sides = computed(() => {
  const r = props.post.result || {}
  // 팀 경기는 두 팀의 팀원 이름이 한 칸씩 (누르면 그 팀 첫 사람 프로필)
  const [a, b] = r.sideNames?.length === 2 ? r.sideNames.map((name) => ({ name })) : players.value
  // 단판이면 세트 수(1:0) 대신 그 판의 점수(21:15)를 크게
  const single = r.setScores?.length === 1 ? r.setScores[0] : null
  return [
    { name: a?.name || '', score: single ? single.scoreA : r.scoreA ?? 0, won: !!r.winner && r.winner === a?.name },
    { name: b?.name || '', score: single ? single.scoreB : r.scoreB ?? 0, won: !!r.winner && r.winner === b?.name },
  ]
})
const winnerIndex = computed(() => (sides.value[0].won ? 0 : sides.value[1].won ? 1 : null))
// 세트 점수: "1세트 11:7 · 2세트 9:11"
const hasScore = computed(() => (props.post.result?.sets || 0) > 0)
const setLine = computed(() => {
  const s = props.post.result?.setScores || []
  if (s.length < 2) return ''
  return s.map((x) => `${x.scoreA}:${x.scoreB}`).join(' · ') // 고정폭 줄이라 숫자만
})
const when = computed(() => (props.post.date ? timeAgo(props.post.date) : ''))
</script>
