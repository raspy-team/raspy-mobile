<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../api/api'
import { socket } from '../../websocket'

const route = useRoute()
const targetUserId = Number(route.params.targetUserId)
const newMsg = ref('')
const chatBox = ref(null)
const currentUserId = ref(null)
const roomId = ref('')
const messages = ref([])
const headerTop = ref(0)

function updateHeaderPosition() {
  // visualViewport를 지원하는 경우만 적용 (for iOS)
  if (window.visualViewport) {
    headerTop.value = window.visualViewport.offsetTop
  } else {
    headerTop.value = 0
  }
}
// 헤더 위치 실시간 업데이트
updateHeaderPosition()
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', updateHeaderPosition)
  window.visualViewport.addEventListener('scroll', updateHeaderPosition)
}

const visibleMessages = computed(() => {
  return messages.value
    .filter(
      (m) =>
        m.messageType !== 'ENTER' &&
        m.messageType !== 'LEAVE' &&
        !(m.content?.includes('입장하였습니다') || m.content?.includes('퇴장하였습니다')),
    )
    .map((m, i) => ({
      ...m,
      _key: m.timestamp + '-' + m.senderId + '-' + i,
    }))
})

onMounted(async () => {
  try {
    const { data } = await api.post('/api/chat-room/dm-room', null, {
      params: { targetUserId },
    })

    socket.connect(roomId.value, () => socket.subscribe(roomId.value))

    const res1 = await api.get('/api/auth/current-user-id')
    currentUserId.value = res1.data

    roomId.value = data.roomId
    targetUserNickname.value = data.targetUserNickname
    targetUserProfileUrl.value = data.targetUserProfileUrl
    const res = await api.get(`/api/chat-room/${roomId.value}/chat-messages`)
    messages.value = res.data
    await nextTick()
    scrollToBottom()
    socket.onMessage((msg) => {
      messages.value.push(msg)
      scrollToBottom()
    })
  } catch (e) {
    console.error(e)
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

const msgInput = ref(null)

function sendMsg() {
  if (!newMsg.value.trim()) return
  socket.sendChat(roomId.value, newMsg.value)
  newMsg.value = ''
  setTimeout(() => {
    msgInput.value?.focus()
  })
}
function scrollToBottom() {
  nextTick(() => {
    if (chatBox.value) chatBox.value.scrollTop = chatBox.value.scrollHeight
  })
}
const formatTime = (ts) =>
  new Date(ts).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
function shouldShowDate(idx, arr) {
  if (idx === 0) return true
  const prev = arr[idx - 1]
  const cur = arr[idx]
  return formatDateOnly(prev.timestamp) !== formatDateOnly(cur.timestamp)
}
function formatDateOnly(ts) {
  const d = new Date(ts)
  const weekDay = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()]
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${weekDay})`
}
const targetUserNickname = ref('상대방')
const targetUserProfileUrl = ref('')
const defaultProfileUrl = require('../../assets/default.png')
</script>

<template>
  <div class="overflow-hidden">
    <div class="fixed left-0 w-full h-[110px] z-20" :style="{ top: `${headerTop}px` }">
      <div class="h-full flex items-end p-4 bg-white shadow gap-2 z-20">
        <button @click="goBack()" class="mr-2 pb-2 text-gray-600 hover:text-gray-800">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
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
    <div
      style="height: 100%"
      class="fixed top-0 left-0 w-full pb-[81px] px-1 z-10"
      :style="{ paddingTop: `${headerTop + 110}px` }"
    >
      <div ref="chatBox" class="h-full overflow-auto space-y-4 pb-2">
        <div v-if="visibleMessages.length > 0" class="flex justify-center py-3">
          <div
            class="bg-gradient-to-r from-orange-100 to-yellow-50 text-orange-600 rounded-full px-4 py-1 text-xs font-bold shadow border border-orange-200 animate-fadein"
          >
            대화의 첫 부분입니다
          </div>
        </div>
        <template v-for="(msg, idx) in visibleMessages" :key="msg._key">
          <div v-if="shouldShowDate(idx, visibleMessages)" class="flex justify-center mb-1">
            <div
              class="bg-white border px-4 py-1 rounded-full text-xs text-gray-500 shadow-sm font-medium"
            >
              {{ formatDateOnly(msg.timestamp) }}
            </div>
          </div>
          <div
            class="flex"
            :class="msg.senderId === currentUserId ? 'justify-end' : 'justify-start'"
          >
            <template v-if="msg.messageType === 'TALK'">
              <div v-if="msg.senderId === currentUserId" class="flex items-end gap-2">
                <div
                  class="max-w-xs p-3 rounded-xl break-words flex-row-reverse bg-orange-500 text-white rounded-br-none flex flex-col"
                >
                  <p class="whitespace-pre-line leading-relaxed flex-1">{{ msg.content }}</p>
                  <p class="text-[10px] ml-2 mt-1 text-right text-gray-100">
                    {{ formatTime(msg.timestamp) }}
                  </p>
                </div>
              </div>
              <div
                v-else
                class="max-w-xs p-3 rounded-xl break-words bg-white text-gray-900 rounded-bl-none shadow flex flex-col items-start"
              >
                <p class="whitespace-pre-line leading-relaxed flex-1">{{ msg.content }}</p>
                <p class="text-[10px] mt-1 text-right text-gray-400">
                  {{ formatTime(msg.timestamp) }}
                </p>
              </div>
            </template>
            <template v-else>
              <div class="mx-auto bg-gray-100 px-3 py-1 rounded text-gray-600 text-xs shadow">
                {{ msg.content }}
              </div>
            </template>
          </div>
        </template>
      </div>
    </div>
    <div class="fixed bottom-0 w-full h-[81px] bg-white z-20">
      <div class="p-[5px] bg-white flex items-center">
        <textarea
          v-model="newMsg"
          ref="msgInput"
          rows="1"
          class="flex-1 resize-none border border-gray-300 rounded-full px-4 py-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="메시지 입력..."
        />
        <button
          @click="sendMsg"
          :disabled="!newMsg.trim()"
          class="ml-2 p-[5px] bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-full shadow hover:scale-105 transition disabled:opacity-50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-[24px] w-[24px] transform rotate-45"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 12h14M12 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
textarea {
  overflow: hidden;
}
</style>
