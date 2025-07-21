<template>
  <div class="flex flex-col h-screen bg-white raspy-bot"> 
    <!-- 상단 고정 헤더 -->
    <div class="flex-none z-20 shadow bg-white">
      <div class="h-[110px] flex items-end p-4 gap-2">
        <button @click="goBack" class="mr-2 pb-2 text-gray-600 hover:text-gray-800">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div class="flex items-center gap-2" @click="goToProfile">
          <img
            :src="targetUserProfileUrl || defaultProfileUrl"
            alt="상대방 프로필"
            class="w-10 h-10 rounded-full border object-cover"
          />
          <span class="font-bold text-lg text-gray-900">{{ targetUserNickname }}</span>
        </div>
      </div>
    </div>

    <!-- 메시지 목록: 채팅창 -->
    <div ref="chatBox" class="flex-1 overflow-auto px-1 pt-2 pb-2">
      <div v-if="messages.length > 0" class="flex justify-center py-3">
        <div class="bg-gradient-to-r from-orange-100 to-yellow-50 text-orange-600 rounded-full px-4 py-1 text-xs font-bold shadow border border-orange-200 animate-fadein">
          대화의 첫 부분입니다
        </div>
      </div>
      <div
        v-for="(msg, idx) in messages"
        :key="idx"
        class="flex mb-2"
        :class="msg.messageType !== 'TALK' ? 'justify-center' : (msg.senderId === currentUserId ? 'justify-end' : 'justify-start')"
      >
        <div
          :class="[ 'max-w-xs p-3 rounded-xl break-words',
            msg.messageType !== 'TALK'
              ? 'bg-gray-200 text-gray-700'
              : msg.senderId === currentUserId
                ? 'bg-orange-500 text-white rounded-br-none'
                : 'bg-white text-gray-900 rounded-bl-none shadow'
          ]"
        >
          <p class="whitespace-pre-line leading-relaxed ">{{ msg.content }}</p>
          <p class="text-[10px] mt-1 text-right" :class="msg.senderId===currentUserId?' text-gray-100 ':' text-gray-400 '">{{ formatTime(msg.timestamp) }}</p>
        </div>
      </div>
    </div>

    <!-- 하단 입력창 -->
    <div class="flex-none z-20 bg-white" style="box-shadow: 0 -2px 8px 0 rgba(0,0,0,0.03)">
      <div class="p-[5px] flex items-center">
        <textarea
          v-model="newMsg"
          rows="1"
          class="flex-1 resize-none border border-gray-300 rounded-full px-4 py-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="메시지 입력..."
          @keydown.enter.exact.prevent="sendMsg"
        />
        <button
          @click="sendMsg"
          :disabled="!newMsg.trim()"
          class="ml-2 p-[5px] bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-full shadow hover:scale-105 transition disabled:opacity-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-[24px] w-[24px] transform rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../api/api'
import { socket } from '../../websocket'

const route = useRoute()
const targetUserId = route.params.targetUserId

const newMsg = ref('')
const chatBox = ref(null)
const currentUserId = ref(null)
const roomId = ref('')
const messages = ref([])

const targetUserNickname = ref('상대방')
const targetUserProfileUrl = ref('')
const defaultProfileUrl = require('../../assets/default.png')

onMounted(async () => {
  try {
    const res1 = await api.get('/api/auth/current-user-id')
    currentUserId.value = res1.data
  } catch (e) {
    console.error('유저 ID 조회 실패', e)
  }
  try {
    const { data } = await api.post('/api/chat-room/dm-room', null, {
      params: { targetUserId }
    })
    roomId.value = data.roomId
    targetUserNickname.value = data.targetUserNickname
    targetUserProfileUrl.value = data.targetUserProfileUrl

    const res = await api.get(`/api/chat-room/${roomId.value}/chat-messages`)
    messages.value = res.data.filter(msg => msg.messageType === 'TALK')
    await nextTick()
    scrollToBottom()

    socket.connect(roomId.value, () => {
      socket.subscribe(roomId.value)
    })
    socket.onMessage(msg => {
      if (msg.messageType !== "TALK") return
      messages.value.push(msg)
      scrollToBottom()
    })
  } catch (e) {
    console.error('채팅방 연결 실패', e)
  }
})

const router = useRouter()
function goToProfile() {
  router.push(`/profile/${targetUserId}`)
}
function goBack() {
  router.go(-1)
}
onBeforeUnmount(() => {
  socket.disconnect()
})

function sendMsg() {
  if (!newMsg.value.trim()) return
  socket.sendChat(roomId.value, newMsg.value)
  newMsg.value = ''
}

function scrollToBottom() {
  nextTick(() => {
    if (chatBox.value) chatBox.value.scrollTop = chatBox.value.scrollHeight
  })
}

const formatTime = ts =>
  new Date(ts).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
</script>

<style scoped>
textarea {
  overflow: hidden;
  /* 안드로이드/ios 모두에서 자연스러운 줄바꿈 지원 */
}
</style>
