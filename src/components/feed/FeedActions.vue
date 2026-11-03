<template>
  <!-- 반응 + 사람에게 잇는 행동: 또 보고 싶어요(그 선수를 따라간다) · 도전해요(나랑 한 판) -->
  <footer class="flex items-center mt-2 -ml-3">
    <template v-if="reactions">
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
    <template v-if="targets.length">
      <button
        type="button"
        class="h-11 px-3 flex items-center gap-1.5 text-sm"
        :class="watchingAll ? 'text-fg font-semibold' : 'text-fg-muted'"
        :aria-pressed="watchingAll"
        @click="emit('watch', targets)"
      >
        <UiIcon name="eye" class="text-lg" aria-hidden="true" />{{ watchingAll ? '보는 중' : '또 보고 싶어요' }}
      </button>
      <UiButton size="sm" variant="tonal" icon="swords" @click="emit('challenge', targets)">도전해요</UiButton>
    </template>
  </footer>
</template>

<script setup>
// 대상: 이 카드의 선수 중 나와 봇을 뺀 사람. 여럿이면 소식 화면이 고르게 한다
import { computed, defineProps, defineEmits } from 'vue'
import { UiButton, UiIcon } from '../ui'

const props = defineProps({
  post: { type: Object, required: true },
  myId: { type: Number, default: null },
  reactions: { type: Boolean, default: true },
})
const emit = defineEmits(['like', 'comment', 'watch', 'challenge'])

const targets = computed(() => (props.post.players || []).filter((p) => p.id !== props.myId && !p.isBot))
const watchingAll = computed(() => targets.value.length > 0 && targets.value.every((p) => (props.post.watching || []).includes(p.id)))
</script>
