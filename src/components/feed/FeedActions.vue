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
      <!-- 공유: 인스타 스토리·카톡·링크 (Strava처럼 반응 옆에) -->
      <!-- 앱 밖 공유는 그 경기에 뛴 사람만: 구경한 사람이 올리면 진 사람의 이름·점수가 고르지 않은 곳(인스타)에 나갔다 (11/11 감정과 체면 전수표) -->
      <button v-if="shareable && iPlayed" type="button" class="h-11 px-3 flex items-center text-sm text-fg-muted" aria-label="공유" @click="emit('share')">
        <UiIcon name="share" class="text-lg" aria-hidden="true" />
      </button>
    </template>
    <div class="flex-1"></div>
    <template v-if="targets.length">
      <button
        type="button"
        class="h-11 px-3 max-[359px]:px-2 flex items-center gap-1.5 text-sm whitespace-nowrap"
        :class="watchingAll ? 'text-fg font-semibold' : 'text-fg-muted'"
        :aria-pressed="watchingAll"
        :aria-label="watchingAll ? '다음 경기 알림 받는 중' : '이 사람 다음 경기 알림 받기'"
        @click="emit('watch', targets)"
      >
        <!-- 320px 폰에선 한 줄에 다 안 들어가 '도전해/요'로 꺾였다: 좁으면 눈 아이콘만 (11/5 밤샘 C) -->
        <!-- '또 보고 싶어요'는 누르면 무슨 일이 생기는지(그 사람 경기 알림) 몰랐다 (경로 6 리뷰): 하는 일을 이름으로 -->
        <UiIcon name="eye" class="text-lg" aria-hidden="true" /><span class="max-[359px]:sr-only">{{ watchingAll ? '알림 받는 중' : '다음 경기 알림' }}</span>
      </button>
      <!-- '도전'은 뺐다 (11/13 도전 하나로: '한 판 붙자'는 링크와 프로필 두 곳에서만 보낸다) -->
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
  /** 공유 아이콘 (끝난 경기만) */
  shareable: { type: Boolean, default: false },
})
const emit = defineEmits(['like', 'comment', 'share', 'watch', 'challenge'])

const iPlayed = computed(() => props.myId != null && (props.post.players || []).some((p) => String(p.id) === String(props.myId)))
const targets = computed(() => (props.post.players || []).filter((p) => p.id !== props.myId && !p.isBot))
const watchingAll = computed(() => targets.value.length > 0 && targets.value.every((p) => (props.post.watching || []).includes(p.id)))
</script>
