<template>
  <article class="border-b border-line py-5" :class="{ 'bg-surface-2/40 -mx-4 px-4 rounded-xl': highlight }">
    <!-- 누구 vs 누구 · 언제 -->
    <header class="flex items-center gap-3">
      <span class="flex -space-x-2 flex-shrink-0">
        <UiAvatar v-for="pl in players" :key="pl.id" :src="pl.avatar" :name="pl.name" size="sm" class="ring-2 ring-canvas" />
      </span>
      <p class="flex-1 min-w-0 text-sm text-fg truncate">
        <button type="button" class="font-bold" @click="emit('profile', players[0]?.id)">{{ players[0]?.name }}</button>
        <span class="text-fg-subtle"> vs </span>
        <button v-if="players[1]" type="button" class="font-bold" @click="emit('profile', players[1].id)">{{ players[1].name }}</button>
      </p>
      <span class="t-micro flex-shrink-0">{{ when }}</span>
      <UiIconButton icon="fas fa-ellipsis" label="더보기" class="-mr-3 flex-shrink-0" @click="emit('more')" />
    </header>

    <!-- 결과: 이 카드의 주인공 -->
    <button type="button" class="w-full mt-3 rounded-xl bg-surface p-4 text-left" @click="emit('rule')">
      <span class="flex items-center gap-2 t-caption">
        <RuleThumb :rule="post.rule" :size="24" class="!rounded-md" />
        <span class="truncate">{{ post.rule?.ruleTitle }}</span>
        <span v-if="post.meta?.place" class="truncate text-fg-subtle">· {{ post.meta.place }}</span>
      </span>
      <span class="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <span v-for="(side, i) in sides" :key="i" class="min-w-0" :class="i === 0 ? 'text-left order-1' : 'text-right order-3'">
          <span class="block truncate text-sm" :class="side.won ? 'text-fg font-bold' : 'text-fg-muted'">
            {{ side.name }}<UiIcon v-if="side.won" name="crown" class="text-signal text-sm ml-1" aria-label="승리" />
          </span>
        </span>
        <!-- 세트 점수 없이 승패만 남긴 경기는 0:0 대신 vs (승자는 왕관으로) -->
        <span v-if="!hasScore" class="order-2 text-sm text-fg-subtle">vs</span>
        <span v-else class="order-2 text-4xl font-bold tabular-nums tracking-tight text-fg">
          <span :class="sides[0].won || isDraw ? 'text-fg' : 'text-fg-subtle'">{{ sides[0].score }}</span>
          <span class="text-fg-subtle mx-1">:</span>
          <span :class="sides[1].won || isDraw ? 'text-fg' : 'text-fg-subtle'">{{ sides[1].score }}</span>
        </span>
      </span>
      <span v-if="setLine" class="block text-center t-micro mt-2">{{ setLine }}</span>
      <span v-else-if="isDraw" class="block text-center t-micro mt-2">무승부</span>
    </button>

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

    <!-- 반응 + 이어지는 행동 -->
    <footer class="flex items-center mt-2 -ml-3">
      <button type="button" class="h-11 px-3 flex items-center gap-1.5 text-sm" :class="post.isLiked ? 'text-danger' : 'text-fg-muted'" :aria-pressed="post.isLiked" aria-label="좋아요" @click="emit('like')">
        <UiIcon :name="post.isLiked ? 'fas fa-heart' : 'far fa-heart'" class="text-lg" aria-hidden="true" />
        <span v-if="post.likeCount" class="tabular-nums">{{ post.likeCount }}</span>
      </button>
      <button type="button" class="h-11 px-3 flex items-center gap-1.5 text-sm text-fg-muted" aria-label="댓글" @click="emit('comment')">
        <UiIcon name="far fa-comment" class="text-lg" aria-hidden="true" />
        <span v-if="post.commentCount" class="tabular-nums">{{ post.commentCount }}</span>
      </button>
      <div class="flex-1"></div>
      <UiButton size="sm" variant="tonal" @click="emit('play')">이 규칙으로 한 판</UiButton>
    </footer>
  </article>
</template>

<script setup>
// 피드의 경기 한 장: 누구 vs 누구 → 결과(점수·승자·규칙) → 사진(있으면) → 좋아요·댓글 → 이 규칙으로 한 판
// 사진이 없어도 결과가 주인공이라 카드가 비지 않는다
import { computed, defineProps, defineEmits } from 'vue'
import RuleThumb from '../rule/RuleThumb.vue'
import { UiAvatar, UiButton, UiIconButton } from '../ui'
import { timeAgo } from '../../utils/format'

const props = defineProps({
  post: { type: Object, required: true },
  highlight: { type: Boolean, default: false },
})
const emit = defineEmits(['profile', 'rule', 'like', 'comment', 'play', 'more'])

const players = computed(() => props.post.players || [])
const isDraw = computed(() => !props.post.result?.winner)
const sides = computed(() => {
  const r = props.post.result || {}
  const [a, b] = players.value
  return [
    { name: a?.name || '', score: r.scoreA ?? 0, won: !!r.winner && r.winner === a?.name },
    { name: b?.name || '', score: r.scoreB ?? 0, won: !!r.winner && r.winner === b?.name },
  ]
})
// 세트 점수: "1세트 11:7 · 2세트 9:11"
const hasScore = computed(() => (props.post.result?.sets || 0) > 0)
const setLine = computed(() => {
  const s = props.post.result?.setScores || []
  if (s.length < 2) return ''
  return s.map((x) => `${x.set}세트 ${x.scoreA}:${x.scoreB}`).join(' · ')
})
const when = computed(() => (props.post.date ? timeAgo(props.post.date) : ''))
</script>
