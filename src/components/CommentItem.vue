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
      class="absolute text-red-500 text-xs right-0 top-2 z-10 text-fg-muted hover:text-primary p-1"
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
        <span v-if="comment.deleted" class="text-xs text-red-400 ml-1">[삭제됨]</span>
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
          class="focus:outline-none transition flex items-center justify-center"
          style="height: 26px; width: 26px"
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

    <!-- 신고 모달 -->
    <transition name="fade">
      <div
        v-if="reportModal"
        class="fixed inset-0 z-[10000] bg-black/30 flex items-center justify-center"
        @click.self="closeReportModal"
        @click.stop
      >
        <div
          class="bg-gray-900 rounded-2xl shadow-lg px-6 py-6 w-full max-w-xs flex flex-col items-stretch"
          @click.stop
        >
          <div class="font-bold text-lg mb-2 text-fg">댓글 신고하기</div>
          <div class="text-fg-subtle text-sm mb-3 leading-snug">
            신고는 <b>24시간 내에 처리</b>되며, 신고해주셔서 감사합니다.
          </div>
          <textarea
            v-model="reportReason"
            class="border rounded p-2 w-full mb-3 text-base"
            rows="3"
            maxlength="100"
            placeholder="신고 사유를 적어 주세요"
            autofocus
            @keydown.enter.exact.prevent="submitReport"
            @click.stop
          />
          <button
            @click.stop="submitReport"
            :disabled="!reportReason.trim() || reportLoading"
           class="w-full bg-danger text-white py-2 rounded-xl font-bold mt-1 disabled:opacity-40"
          >
            {{ reportLoading ? '신고 중...' : '신고하기' }}
          </button>
          <button @click.stop="closeReportModal" class="w-full mt-2 text-fg-muted text-sm">
            취소
          </button>
          <p v-if="reportError" class="text-red-500 mt-2 text-sm text-center">{{ reportError }}</p>
          <p v-if="reportSuccess" class="text-green-600 mt-2 text-sm text-center">
            {{ reportSuccess }}
          </p>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref } from 'vue'
import CommentItem from './CommentItem.vue'
import api from '../api/api'

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

// ----- 신고 모달 관련 -----
const reportModal = ref(false)
const reportReason = ref('')
const reportLoading = ref(false)
const reportError = ref('')
const reportSuccess = ref('')

function openReportModal() {
  reportModal.value = true
  reportReason.value = ''
  reportError.value = ''
  reportSuccess.value = ''
}
function closeReportModal() {
  reportModal.value = false
  reportReason.value = ''
  reportError.value = ''
  reportSuccess.value = ''
}
async function submitReport() {
  if (!reportReason.value.trim()) return
  reportLoading.value = true
  reportError.value = ''
  reportSuccess.value = ''
  try {
    await api.post('/api/reports', {
      targetId: props.comment.id,
      targetType: 'COMMENT',
      reason: reportReason.value.trim(),
    })
    reportSuccess.value = '신고가 접수됐어요. 운영진이 바로 확인하고 조치해요'
    setTimeout(closeReportModal, 1300)
  } catch (e) {
    const msg = e?.response?.data?.message || '신고하지 못했어요. 다시 해 주세요'
    reportError.value = msg
  }
  reportLoading.value = false
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
