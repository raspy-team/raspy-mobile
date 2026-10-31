<template>
  <div class="absolute z-40 right-4 bottom-[22%] flex flex-col items-center gap-4">
    <button
      v-if="post.type === 'game' && post.isCompleted"
      @click="emit('like')"
      @touchstart="emit('like-press-start', $event)"
      @touchend="emit('like-press-end')"
      @mousedown="emit('like-press-start', $event)"
      @mouseup="emit('like-press-end')"
      @mouseleave="emit('like-press-end')"
      class="flex flex-col items-center active:scale-95 transition"
    >
      <span
        class="w-8 h-8 flex items-center justify-center text-2xl"
        :class="[post?.isLiked ? 'text-red-500' : '', likeBump ? 'like-bump' : '']"
      >
        <i :class="post?.isLiked ? 'fas fa-heart' : 'far fa-heart'"></i>
      </span>
      <span class="text-xs mt-1">
        {{ post.likeCount }}
      </span>
    </button>
    <button
      v-if="post.type === 'game' && post.isCompleted"
      @click="emit('challenge')"
      class="flex flex-col items-center active:scale-95 transition"
    >
      <span class="w-8 h-8 flex items-center justify-center text-2xl"><i class="fas fa-trophy"></i></span>
      <span class="text-xs mt-1">도전</span>
    </button>
    <button
      v-if="post.type !== 'invite' && post.type !== 'friend-invite'"
      @click="emit('comment')"
      class="flex flex-col items-center active:scale-95 transition"
    >
      <span class="w-8 h-8 flex items-center justify-center text-2xl"><i class="far fa-comment"></i></span>
      <span class="text-xs mt-1">{{ post.commentCount || 0 }}</span>
    </button>
    <button
      v-if="post.type !== 'invite' && post.type !== 'friend-invite'"
      @click="emit('share')"
      class="flex flex-col items-center active:scale-95 transition"
    >
      <span class="w-8 h-8 flex items-center justify-center text-2xl"><i class="fas fa-share"></i></span>
      <span class="text-xs mt-1">공유</span>
    </button>
    <button
      v-if="post.type !== 'invite' && post.type !== 'friend-invite'"
      @click="emit('report')"
      class="flex flex-col items-center active:scale-95 transition"
      :class="{ 'opacity-50': reported }"
    >
      <span class="w-8 h-8 flex items-center justify-center text-2xl"><i class="far fa-flag"></i></span>
      <span class="text-xs mt-1">신고</span>
    </button>
  </div>
</template>

<script setup>
// 피드 오른쪽 세로 버튼 줄: 또 보고싶어요(길게 누르면 누른 사람들), 도전, 댓글, 공유, 신고
import { defineProps, defineEmits } from 'vue'
defineProps({
  post: { type: Object, required: true },
  likeBump: { type: Boolean, default: false },
  reported: { type: Boolean, default: false },
})
const emit = defineEmits(['like', 'like-press-start', 'like-press-end', 'challenge', 'comment', 'share', 'report'])
</script>

<style scoped>
@keyframes like-bump-kf {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.12);
  }
  100% {
    transform: scale(1);
  }
}
.like-bump {
  animation: like-bump-kf 240ms ease;
}
</style>
