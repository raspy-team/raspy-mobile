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
      class="absolute text-red-500 text-[0.7rem] right-0 top-2 z-10 text-gray-300 hover:text-orange-500 p-1"
      @click.stop="openReportModal"
      title="댓글 신고"
    >
      신고하기
    </button>

    <!-- 프로필 링크 -->
    <router-link :to="`/profile/${comment.author.id}`" class="w-9 h-9 flex-shrink-0" tabindex="-1">
      <img
        :src="comment.author.profileImageUrl || defaultProfile"
        class="w-9 h-9 rounded-full object-cover bg-gray-200 border"
        alt="profile"
      />
    </router-link>

    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2">
        <router-link
          :to="`/profile/${comment.author.id}`"
          class="font-semibold text-[15px] hover:underline focus:underline focus:outline-none"
        >
          {{ comment.author.nickname }}
        </router-link>
        <span class="text-gray-400 text-xs select-none">
          {{ timeAgo(comment.createdAt) }}
        </span>
        <span v-if="comment.editedAt" class="text-xs text-gray-400 ml-1">(수정됨)</span>
        <span v-if="comment.deleted" class="text-xs text-red-400 ml-1">[삭제됨]</span>
      </div>
      <div class="whitespace-pre-wrap break-all text-[15px] mt-1 leading-snug">
        <span
          v-if="comment.mentionUserNickname"
          class="inline-block px-2 py-0.5 bg-blue-100 text-blue-600 font-semibold rounded-full mr-1 text-[14px] align-middle"
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
      <div class="flex items-center gap-2 mt-2 text-gray-500 text-[14px]">
        <button
          class="focus:outline-none transition flex items-center justify-center"
          style="height: 26px; width: 26px"
          @click="emitLike(comment.id)"
        >
          <i
            :class="[
              'fa-heart fa-lg align-middle',
              comment.myLikeType === 'LIKE' ? 'fas text-pink-500' : 'far text-gray-400',
            ]"
          ></i>
        </button>
        <span v-if="comment.likeCount > 0" class="min-w-[16px] text-[14px] select-none">{{
          comment.likeCount
        }}</span>
        <button
          v-if="!isReply"
          class="text-[13px] hover:underline focus:underline ml-1 px-1"
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
          class="bg-white rounded-2xl shadow-lg px-6 py-6 w-full max-w-xs flex flex-col items-stretch"
          @click.stop
        >
          <div class="font-bold text-lg mb-2 text-gray-900">댓글 신고하기</div>
          <div class="text-gray-500 text-sm mb-3 leading-snug">
            신고는 <b>24시간 내에 처리</b>되며, 신고해주셔서 감사합니다.
          </div>
          <textarea
            v-model="reportReason"
            class="border rounded p-2 w-full mb-3 text-[15px]"
            rows="3"
            maxlength="100"
            placeholder="신고 사유를 입력해주세요"
            autofocus
            @keydown.enter.exact.prevent="submitReport"
            @click.stop
          />
          <button
            @click.stop="submitReport"
            :disabled="!reportReason.trim() || reportLoading"
            class="w-full bg-red-500 text-white py-2 rounded-xl font-bold mt-1 disabled:bg-gray-300"
          >
            {{ reportLoading ? '신고 중...' : '신고하기' }}
          </button>
          <button @click.stop="closeReportModal" class="w-full mt-2 text-gray-400 text-sm">
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
function autoLink(text) {
  if (!text) return ''
  return text.replace(
    /((http|https):\/\/[^\s]+)/g,
    '<a class="text-blue-500 hover:underline" href="$1" target="_blank" rel="noopener noreferrer">$1</a>',
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
    reportSuccess.value = '신고가 접수되었습니다.'
    setTimeout(closeReportModal, 1300)
  } catch (e) {
    const msg = e?.response?.data?.message || '신고 처리 중 오류가 발생했습니다.'
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
