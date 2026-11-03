<template>
  <div
    @click.stop="true"
    :class="[
      'flex gap-3 pt-3 group transition relative',
      { 'pl-4': isReply, 'pl-0': !isReply }, // 대댓글은 16px(4)만 들여쓰기
    ]"
  >
    <!-- 신고 버튼 (우측 상단) -->
    <button
      class="absolute text-xs right-0 top-2 z-10 text-fg-muted hover:text-primary p-1"
      @click.stop="openReportModal"
      title="댓글 신고"
    >
      신고하기
    </button>

    <!-- 프로필 링크 -->
    <router-link :to="`/profile/${comment.author.id}`" class="w-9 h-9 flex-shrink-0" tabindex="-1">
      <img
        :src="comment.author.profileImageUrl || defaultProfile"
        class="w-9 h-9 rounded-full object-cover bg-surface-2 border"
        alt="profile"
      />
    </router-link>

    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2">
        <router-link
          :to="`/profile/${comment.author.id}`"
         class="font-medium text-base hover:underline focus:underline focus:outline-none"
        >
          {{ comment.author.nickname }}
        </router-link>
        <span class="text-fg-muted text-xs select-none">
          {{ timeAgo(comment.createdAt) }}
        </span>
        <span v-if="comment.editedAt" class="text-xs text-fg-muted ml-1">(수정됨)</span>
        <span v-if="comment.deleted" class="t-caption ml-1">지운 댓글</span>
      </div>
      <div class="whitespace-pre-wrap break-all text-base mt-1 leading-snug">
        <span
          v-if="comment.mentionUserNickname"
          class="inline-block px-2 py-0.5 bg-surface-3 text-fg font-medium rounded-full mr-1 text-sm align-middle"
        >
          {{ comment.mentionUserNickname }}
        </span>
        <span v-html="autoLink(comment.content)" />
      </div>
      <div v-if="comment.imageUrl" class="mt-1">
        <img
          :src="comment.imageUrl"
          class="max-w-[140px] max-h-[140px] rounded-xl border cursor-pointer hover:brightness-95 transition"
          @click="emitImgClick(comment.imageUrl)"
        />
      </div>
      <div class="flex items-center gap-2 mt-2 text-fg-subtle text-sm">
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
        <span v-if="comment.likeCount > 0" class="min-w-[16px] text-sm select-none">{{
          comment.likeCount
        }}</span>
        <button
          v-if="!isReply"
          class="text-sm hover:underline focus:underline ml-1 px-1"
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

    <ReportSheet v-model="reportModal" title="댓글을 신고할까요?" target-type="COMMENT" :target-id="comment.id" />
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref } from 'vue'
import CommentItem from './CommentItem.vue'
import ReportSheet from './safety/ReportSheet.vue'

const props = defineProps({
  comment: { type: Object, required: true },
  currentUserId: { type: [String, Number], required: false },
  replyingId: { type: [String, Number], required: false },
  isReply: { type: Boolean, default: false },
})
const emit = defineEmits(['reply', 'like', 'img-click'])

const defaultProfile = '/default-profile.svg'

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

const reportModal = ref(false)
function openReportModal() {
  reportModal.value = true
}
</script>
