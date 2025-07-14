<template>
  <div
    :class="[
      'flex gap-3 pt-3 group transition',
      { 'pl-4': isReply, 'pl-0': !isReply }, // 대댓글은 16px(4)만 들여쓰기
    ]"
  >
    <router-link
      :to="`/profile/${comment.author.id}`"
      class="w-9 h-9 flex-shrink-0"
      tabindex="-1"
    >
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
          @{{ comment.mentionUserNickname }}
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
          class="focus:outline-none  transition flex items-center justify-center"
          style="height:26px;width:26px"
          @click="emitLike(comment.id)"
        >
          <i
            :class="[
              'fa-heart fa-lg align-middle',
              comment.myLikeType === 'LIKE'
                ? 'fas text-pink-500'
                : 'far text-gray-400',
            ]"
          ></i>
        </button>
        <span
          v-if="comment.likeCount > 0"
          class="min-w-[16px] text-[14px] select-none"
        >{{ comment.likeCount }}</span>
        <button
          v-if="!isReply"
          class="text-[13px] hover:underline focus:underline ml-1 px-1"
          @click="emitReply(comment.id, comment.author.nickname)"
        >답글</button>
      </div>
      <div
        v-if="comment.children && comment.children.length"
        class="mt-1"
      >
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
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'
import CommentItem from './CommentItem.vue'

defineProps({
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
  if (diff < 60) return `${diff}초 전`
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  return `${date.getMonth() + 1}/${date.getDate()}`
}
function autoLink(text) {
  if (!text) return ''
  return text.replace(
    /((http|https):\/\/[^\s]+)/g,
    '<a class="text-blue-500 hover:underline" href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  )
}
function emitLike(commentId) { emit('like', commentId) }
function emitReply(commentId, nickname) { emit('reply', commentId, nickname) }
function emitImgClick(imageUrl) { emit('img-click', imageUrl) }
</script>
