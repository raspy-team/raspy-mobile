<template>
  <div
    @click.stop="true"
    :class="[
      'flex gap-3 pt-3 group transition relative',
      { 'pl-4': isReply, 'pl-0': !isReply }, // 대댓글은 16px(4)만 들여쓰기
    ]"
  >
    <!-- 신고는 오른쪽 위 더보기로 (댓글마다 '신고하기' 글자가 떠 있으면 시끄럽다, 11/5 밤샘 C) -->
    <button type="button" aria-label="댓글 신고" class="absolute -right-3 -top-1 w-11 h-11 flex items-center justify-center text-fg-subtle" @click.stop="openReportModal"><UiIcon name="fas fa-ellipsis" aria-hidden="true" /></button>

    <!-- 프로필 링크 -->
    <router-link :to="`/profile/${comment.author.id}`" class="flex-shrink-0" tabindex="-1">
      <UiAvatar :src="comment.author.profileImageUrl" :name="comment.author.nickname" :user-id="comment.author.id" size="sm" />
    </router-link>

    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2">
        <router-link
          :to="`/profile/${comment.author.id}`"
         class="text-[0.9375rem] font-semibold text-fg hover:underline focus:underline focus:outline-none"
        >
          {{ comment.author.nickname }}
        </router-link>
        <span class="t-micro select-none">
          {{ timeAgo(comment.createdAt) }}
        </span>
        <span v-if="comment.editedAt" class="t-micro">수정됨</span>
        <span v-if="comment.deleted" class="t-micro">지운 댓글</span>
      </div>
      <div class="t-body whitespace-pre-wrap break-words mt-0.5">
        <span
          v-if="comment.mentionUserNickname"
          class="inline-block px-2 py-0.5 bg-surface-3 text-fg font-medium rounded-full mr-1 t-micro align-middle"
        >
          {{ comment.mentionUserNickname }}
        </span>
        <span v-html="autoLink(comment.content)" />
      </div>
      <div v-if="comment.imageUrl" class="mt-1">
        <button type="button" class="block rounded-xl" aria-label="댓글 사진 크게 보기" @click="emitImgClick(comment.imageUrl)">
          <img :src="comment.imageUrl" alt="" loading="lazy" class="max-w-[140px] max-h-[140px] rounded-xl hover:brightness-95 transition" />
        </button>
      </div>
      <div class="flex items-center gap-2 mt-1.5 t-micro">
        <button
          class="-m-2.5 w-11 h-11 transition flex items-center justify-center"
          :aria-label="comment.myLikeType === 'LIKE' ? '좋아요 취소' : '좋아요'"
          :aria-pressed="comment.myLikeType === 'LIKE'"
          @click="emitLike(comment.id)"
        >
          <UiIcon
            name="heart"
            :filled="comment.myLikeType === 'LIKE'"
            class="text-lg align-middle"
            :class="comment.myLikeType === 'LIKE' ? 'text-danger-fg' : 'text-fg-muted'"
          />
        </button>
        <span v-if="comment.likeCount > 0" class="min-w-[16px] tabular-nums select-none">{{
          comment.likeCount
        }}</span>
        <button
          v-if="!isReply"
          class="hover:underline focus:underline ml-1 px-1 py-2.5 -my-2.5"
          @click="emitReply(comment.id, comment.author.nickname)"
        >
          답글
        </button>
      </div>
      <div v-if="comment.children && comment.children.length" class="mt-1">
        <CommentItem
          v-for="child in comment.children"
          :key="child.id"
          :comment="child"
          :current-user-id="currentUserId"
          :replying-id="replyingId"
          is-reply
          @reply="emitReply"
          @like="emitLike"
          @img-click="emitImgClick"
        />
      </div>
    </div>

    <ReportSheet v-model="reportModal" title="댓글을 신고할까요?" target-type="COMMENT" :reasons="COMMENT_REASONS" :target-id="comment.id" />
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref } from 'vue'
import CommentItem from './CommentItem.vue'
import ReportSheet from './safety/ReportSheet.vue'
import { UiAvatar } from './ui'

const props = defineProps({
  comment: { type: Object, required: true },
  currentUserId: { type: [String, Number], required: false },
  replyingId: { type: [String, Number], required: false },
  isReply: { type: Boolean, default: false },
})
const emit = defineEmits(['reply', 'like', 'img-click'])

function timeAgo(isoString) {
  if (!isoString) return ''
  const date = typeof isoString === 'string' ? new Date(isoString) : isoString
  const now = new Date()
  const diff = Math.floor((now - date) / 1000)
  if (diff < 60) return `방금 전`
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  return `${date.getMonth() + 1}/${date.getDate()}`
}
// 댓글 글자를 HTML로 그리기 전에 먼저 이스케이프한다. 예전엔 그대로 v-html이라 댓글에 심은 스크립트가 보는 사람의 로그인 토큰을 가져갈 수 있었다 (11/3 밤 리뷰)
function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
}
function autoLink(text) {
  if (!text) return ''
  // 이스케이프한 뒤 http(s) 주소만 링크로. 주소 안의 따옴표·꺾쇠는 이미 바뀌어 속성을 깨지 못한다
  return escapeHtml(text).replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer nofollow" class="text-fg underline underline-offset-2 break-all">$1</a>',
  )
}
function emitLike(commentId) {
  emit('like', commentId)
}
function emitReply(commentId, nickname) {
  emit('reply', commentId, nickname)
}
function emitImgClick(imageUrl) {
  emit('img-click', imageUrl)
}

// 댓글에는 노쇼·사칭 대신 댓글에서 생기는 일 (11/5 리뷰 D)
const COMMENT_REASONS = ['욕설·비방', '성희롱·불쾌한 말', '광고·도배', '기타']
const reportModal = ref(false)
function openReportModal() {
  reportModal.value = true
}
</script>
