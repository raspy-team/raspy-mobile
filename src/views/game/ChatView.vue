<template>
  <div class="overflow-hidden">
    <!-- 헤더: visualViewport 반영 (fixed) -->
    <div
      class="fixed left-0 w-full h-[110px] z-20 transition-all duration-100"
      :style="{ top: `${headerTop}px` }"
    >
      <div class="h-full flex items-end p-4 bg-white shadow gap-2 z-20">
        <button @click="goBack()" class="mr-2 pb-2 text-gray-600 hover:text-gray-800">
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

    <!-- 메시지 목록 (fixed) -->
    <div
      style="height: calc( (var(--real-vh, 1vh) * 100))"
      class="fixed top-0 left-0 pt-[110px] w-full pb-[81px] px-1 z-10"
    >
      <div ref="chatBox" class="h-full overflow-auto space-y-4 pb-2">
        <div v-if="messages.length > 0" class="flex justify-center py-3">
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
            <p class="whitespace-pre-line leading-relaxed ">{{ msg.content }}</p>
            <p class="text-[10px] mt-1 text-right" :class="msg.senderId===currentUserId?' text-gray-100 ':' text-gray-400 '">{{ formatTime(msg.timestamp) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 하단 입력창 (fixed) -->
    <div class="fixed bottom-0 w-full h-[81px] bg-white z-20">
      <div class="p-[5px] bg-white flex items-center">
        <textarea
          v-model="newMsg"
          rows="1"
          class="flex-1 resize-none border border-gray-300 rounded-full px-4 py-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="메시지 입력..."
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
const targetUserId = route.params.targetUserId // URL: /chat/:targetUserId

const newMsg = ref('')
const chatBox = ref(null)
const currentUserId = ref(null)
const roomId = ref('')
const messages = ref([])

const headerTop = ref(0)
function updateHeaderPosition() {
  // visualViewport를 지원하는 경우만 적용 (iOS)
  if (window.visualViewport) {
    headerTop.value = window.visualViewport.offsetTop
  } else {
    headerTop.value = 0
  }
}

onMounted(async () => {
  // 헤더 위치 실시간 업데이트
  updateHeaderPosition()
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', updateHeaderPosition)
    window.visualViewport.addEventListener('scroll', updateHeaderPosition)
  }

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

onBeforeUnmount(() => {
  if (window.visualViewport) {
    window.visualViewport.removeEventListener('resize', updateHeaderPosition)
    window.visualViewport.removeEventListener('scroll', updateHeaderPosition)
  }
  socket.disconnect()
})

const router = useRouter()
function goToProfile() {
  router.push(`/profile/${targetUserId}`)
}
function goBack() {
  router.go(-1)
}

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

// 유저 정보
const targetUserNickname = ref('상대방')
const targetUserProfileUrl = ref('')
const defaultProfileUrl = require('../../assets/default.png')
</script>

<style scoped>
textarea {
  overflow: hidden;
}
</style>
