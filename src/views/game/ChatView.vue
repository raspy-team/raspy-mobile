<template>
  <Header :has-referer="true" title="채팅"/>
  <div class="flex flex-col h-screen bg-gray-50">
    <!-- Header -->
    <div class="flex items-center p-4 bg-white shadow">
      <button @click="$router.back()" class="mr-2 text-gray-600 hover:text-gray-800">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 class="text-lg font-semibold">{{ chatTitle }}</h1>
    </div>

    <!-- Messages -->
    <div ref="chatBox" class="flex-1 overflow-y-auto p-4 space-y-4">
      <div
        v-for="(msg, idx) in messages"
        :key="idx"
        class="flex"
        :class="msg.messageType !== 'TALK' ? 'justify-center' : (msg.senderId === currentUserId ? 'justify-end' : 'justify-start')"
      >
        <div
          :class="[
            'max-w-xs p-3 rounded-xl break-words',
            msg.messageType !== 'TALK'
              ? 'bg-gray-200 text-gray-700'
              : msg.senderId === currentUserId
              ? 'bg-blue-500 text-white rounded-br-none'
              : 'bg-white text-gray-900 rounded-bl-none shadow'
          ]"
        >
          <p v-if="msg.messageType === 'TALK'" class="text-xs text-gray-200 mb-1">{{ msg.sender }}</p>
          <p>{{ msg.content }}</p>
          <p class="text-[10px] text-gray-400 mt-1 text-right">{{ formatTime(msg.timestamp) }}</p>
        </div>
      </div>
    </div>

    <!-- Input -->
    <div class="p-4 bg-white flex items-center">
      <textarea
        v-model="newMsg"
        rows="1"
        class="flex-1 resize-none border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        placeholder="메시지 입력..."
        @keyup.enter.exact.prevent="sendMsg"
      />
      <button
        @click="sendMsg"
        :disabled="!newMsg.trim()"
        class="ml-2 p-2 bg-gradient-to-r from-blue-400 to-purple-500 text-white rounded-full disabled:opacity-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v14m7-7H5" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import api from '../../api/api'
import Header from "../../components/HeaderComp.vue"
import { useChat } from '../../composable/useChat'

const route = useRoute()
const gameId = route.params.gameId

const newMsg = ref('')
const chatBox = ref(null)
const chatTitle = ref('')
const currentUserId = ref(null)

// 1) 현재 유저 ID 조회
onMounted(async () => {
  try {
    const res = await api.get('/api/auth/current-user-id')
    currentUserId.value = res.data
  } catch (e) {
    console.error('유저 ID 조회 실패', e)
  }
})

// useChat 훅: roomId 로딩 후 역사, 구독, 자동연결 처리
const { messages, sendMessage } = useChat(gameId)

// 채팅방 제목 로드 (after room init)
onMounted(async () => {
  try {
    const res = await api.get(`/api/games/summary?gameId=${gameId}`)
    chatTitle.value = res.data.title
  } catch {console.log("제목로드실패")}
})

// 자동 스크롤
onMounted(() => {
  const observer = new MutationObserver(() => {
    if (chatBox.value) chatBox.value.scrollTop = chatBox.value.scrollHeight
  })
  observer.observe(chatBox.value, { childList: true })
  onBeforeUnmount(() => observer.disconnect())
})

// 메시지 전송
function sendMsg() {
  if (!newMsg.value.trim()) return
  sendMessage(newMsg.value)
  newMsg.value = ''
}

// 시간 포맷
const formatTime = ts => new Date(ts).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
</script>

<style scoped>
textarea { overflow: hidden; }
</style>
