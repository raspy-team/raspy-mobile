<template>
  <div class="h-full flex-col bg-gray-50 raspy-top">

    <!-- 상단: 상대방 프로필/닉네임 고정 -->
     <div  style="height: calc(var(--real-vh, 1vh) * 10)">
    <div class="h-full flex items-center p-4 bg-white shadow gap-2">
      <button @click="$router.back()" class="mr-2 text-gray-600 hover:text-gray-800">
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
<div  style="height: calc(var(--real-vh, 1vh) * 75)" class=" overflow-auto">
    <!-- 메시지 목록 -->
    <div ref="chatBox" class="h-full overflow-auto space-y-4 pb-2">
      <div v-if="messages.length > 0" class="flex justify-center my-3">
        <div class="bg-gradient-to-r from-orange-100 to-yellow-50 text-orange-600 rounded-full px-4 py-1 text-xs font-bold shadow border border-orange-200 animate-fadein">
          대화의 첫 부분입니다
        </div>
      </div>
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
                ? 'bg-orange-500 text-white rounded-br-none'
                : 'bg-white text-gray-900 rounded-bl-none shadow'
          ]"
        >
          <!-- TALK 메시지에는 닉네임 X -->
          <p>{{ msg.content }}</p>
          <p class="text-[10px] mt-1 text-right" :class="msg.senderId===currentUserId?' text-gray-100 ':' text-gray-400 '">{{ formatTime(msg.timestamp) }}</p>
        </div>
      </div>
    </div>
</div>

<div  style="height: calc(var(--real-vh, 1vh) * 10)">
    <!-- 입력창 -->
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
        class="ml-2 p-2 bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-full shadow hover:scale-105 transition disabled:opacity-50"
      >
        <!-- send 아이콘 -->
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 transform rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import api from '../../api/api'
// import Header from '../../components/HeaderComp.vue'
import { socket } from '../../websocket'

const route = useRoute()
const targetUserId = route.params.targetUserId // URL: /chat/:targetUserId

const newMsg = ref('')
const chatBox = ref(null)
const currentUserId = ref(null)
const roomId = ref('')
const messages = ref([])

// DM 룸 정보 DTO
const targetUserNickname = ref('상대방')
const targetUserProfileUrl = ref('')
const defaultProfileUrl = require('../../assets/default.png') // or import path for Vite
onMounted(async () => {
  try {
    // 현재 유저 ID 조회
    const res1 = await api.get('/api/auth/current-user-id')
    currentUserId.value = res1.data
  } catch (e) {
    console.error('유저 ID 조회 실패', e)
  }

  try {
    // DM 룸 정보 전체 받기
    const { data } = await api.post('/api/chat-room/dm-room', null, {
      params: { targetUserId }
    })

    roomId.value = data.roomId
    targetUserNickname.value = data.targetUserNickname
    targetUserProfileUrl.value = data.targetUserProfileUrl

    // api 응답값에서 roomId 받은 후, 해당 roomId로 메시지 요청
    const res = await api.get(`/api/chat-room/${roomId.value}/chat-messages`)
    messages.value = res.data.filter(msg => msg.messageType === 'TALK')
    console.log(res.data)
    await nextTick()
    scrollToBottom()

    // === 소켓 연결 및 실시간 메시지 처리 ===
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

import {useRouter} from 'vue-router'
const router = useRouter()
function goToProfile() {
  // /profile/:userId로 이동 (Number 변환 or String 그대로)
  router.push(`/profile/${targetUserId}`)
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
  }
</style>
