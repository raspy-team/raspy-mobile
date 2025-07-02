<template>
  <Header :has-referer="true" title="댓글" />
  <div class="max-w-2xl mx-auto px-4 py-6 mt-20">
    <!-- 댓글 입력 -->
    <div class="flex items-center space-x-3 mb-10">
      <input
        v-model="newComment"
        type="text"
        placeholder="댓글 달기..."
        class="flex-1 text-sm border-b border-gray-300 focus:border-orange-500 focus:outline-none py-2"
        @keyup.enter="submitComment"
      />
      <button
        @click="submitComment"
        :disabled="!canSubmit"
        class="text-sm font-semibold text-orange-500 disabled:text-gray-300"
      >
        게시
      </button>
    </div>

    <!-- 댓글 목록 -->
    <div v-if="comments.length" class="space-y-6">
      <div
        v-for="comment in comments"
        :key="comment.id"
        class="flex items-start space-x-3"
      >
        <img
          :src="comment.authorProfileUrl || defaultProfile"
          class="w-8 h-8 rounded-full object-cover"
        />
        <div class="flex-1">
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold text-gray-800">
              @{{ comment.authorNickname }}
            </p>
            <p class="text-xs text-gray-500">{{ relativeTime(comment.createdAt) }}</p>
          </div>
          <p class="text-sm text-gray-800 mt-1">{{ comment.content }}</p>
        </div>
      </div>
    </div>

    <p v-else class="text-gray-400 text-center text-sm mt-12">
      첫 댓글을 작성해보세요.
    </p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../api/api'
import Header from '../components/HeaderComp.vue'

const route = useRoute()
const gameId = route.params.gameId

const comments = ref([])
const newComment = ref('')

const canSubmit = computed(() => newComment.value.trim().length > 0)

// 댓글 가져오기
const fetchComments = async () => {
  const res = await api.get(`/api/games/${gameId}/comments`)
  comments.value = res.data
}

// 댓글 등록
const submitComment = async () => {
  if (!canSubmit.value) return
  await api.post(`/api/games/${gameId}/comments`, {
    content: newComment.value.trim()
  })
  newComment.value = ''
  fetchComments()
}

// 순수 JS 상대시간 계산
const relativeTime = (dateStr) => {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60) return '방금 전'
  if (diff < 3600) return `${Math.floor(diff/60)}분 전`
  if (diff < 86400) return `${Math.floor(diff/3600)}시간 전`
  if (diff < 2592000) return `${Math.floor(diff/86400)}일 전`
  if (diff < 31536000) return `${Math.floor(diff/2592000)}개월 전`
  return `${Math.floor(diff/31536000)}년 전`
}

onMounted(fetchComments)
</script>
