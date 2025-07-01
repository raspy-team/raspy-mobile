<template>
<Header :has-referer="true" title="댓글"/>
  <div class="max-w-2xl mx-auto px-4 py-6">
    <h2 class="text-xl font-bold mb-6">-</h2>

    <!-- 댓글 작성 -->
    <div class="mb-8">
      <textarea v-model="newComment" rows="3" placeholder="댓글을 입력하세요..."
        class="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"></textarea>
      <button
        @click="submitComment"
        :disabled="newComment.trim().length === 0"
        class="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
      >
        댓글 작성
      </button>
    </div>

    <!-- 댓글 목록 -->
    <div v-if="comments.length > 0" class="space-y-4">
      <div v-for="comment in comments" :key="comment.id" class="border rounded-lg p-4 bg-white shadow-sm">
        <div class="flex items-center mb-2">
          <img
            :src="comment.authorProfileUrl || defaultProfile"
            class="w-8 h-8 rounded-full mr-3 object-cover"
            alt="프로필"
          />
          <div>
            <p class="text-sm font-semibold text-gray-800">@{{ comment.authorNickname }}</p>
            <p class="text-xs text-gray-500">{{ formatDate(comment.createdAt) }}</p>
          </div>
        </div>
        <p class="text-gray-700 text-sm whitespace-pre-line">{{ comment.content }}</p>
      </div>
    </div>
    <div v-else class="text-gray-400 text-sm text-center mt-12">아직 댓글이 없습니다.</div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import api from '../api/api'
import Header from "../components/HeaderComp.vue"

const route = useRoute()
const gameId = route.params.gameId

const comments = ref([])
const newComment = ref('')
const defaultProfile = 'https://source.boringavatars.com/beam'

const fetchComments = async () => {
  const res = await api.get(`/api/games/${gameId}/comments`)
  comments.value = res.data
}

const submitComment = async () => {
  if (!newComment.value.trim()) return
  await api.post(`/api/games/${gameId}/comments`, { content: newComment.value })
  newComment.value = ''
  await fetchComments()
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })
}

onMounted(fetchComments)
</script>
