<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api, { playWithMeTooAPI } from '../../api/api'
import { socket } from '../../websocket'

const route = useRoute()
const targetUserId = Number(route.params.targetUserId)
const newMsg = ref('')
const chatBox = ref(null)
const currentUserId = ref(null)
const roomId = ref('')
const messages = ref([])
const headerTop = ref(0)

const targetUserNickname = ref('')
const targetUserProfileUrl = ref('')
const isFriend = ref(false)

// 나랑도해 요청 데이터
const playWithMeRequest = ref(null) // 받은 나랑도해 요청 정보

function updateHeaderPosition() {
  // visualViewport를 지원하는 경우만 적용 (for iOS)
  if (window.visualViewport) {
    headerTop.value = window.visualViewport.offsetTop
    scrollToBottom()
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
    roomId.value = data.roomId
    socket.onMessage((msg) => {
      messages.value.push(msg)
      scrollToBottom()
    })

    socket.connect(roomId.value)

    const res1 = await api.get('/api/auth/current-user-id')
    currentUserId.value = res1.data

    targetUserNickname.value = data.targetUserNickname
    targetUserProfileUrl.value = data.targetUserProfileUrl

    // 나랑도해 요청 확인
    try {
      const playWithMeData = await playWithMeTooAPI.checkRequest(targetUserId)
      if (playWithMeData) {
        playWithMeRequest.value = playWithMeData
      }
    } catch (error) {
      console.error('나랑도해 요청 확인 중 오류:', error)
    }

    const res = await api.get(`/api/chat-room/${roomId.value}/chat-messages`)
    messages.value = res.data
    await nextTick()
    scrollToBottom()
  } catch (e) {
    console.error(e)
  }
})

onBeforeUnmount(() => {
  if (window.visualViewport) {
    window.visualViewport.removeEventListener('resize', updateHeaderPosition)
    window.visualViewport.removeEventListener('scroll', updateHeaderPosition)
  }
})

const messageInput = ref(null)
function keepFocus() {
  // 마우스를 누르는 순간 바로 포커스 주기
  if (messageInput.value == null) return
  messageInput.value.focus()
}
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
const defaultProfileUrl = require('../../assets/default.png')

// 헤더 표시 조건을 계산하는 computed
const headerInfo = computed(() => {
  if (playWithMeRequest.value) {
    return {
      show: true,
      type: 'challenge_received',
      title: '"나랑도 해" 요청을 받았습니다',
      description: `${targetUserNickname.value}님이 함께 경기하기를 원합니다`,
      showActions: true,
      actionType: 'accept_reject',
    }
  }

  return {
    show: false,
  }
})

// 액션 핸들러들
const handleAccept = async () => {
  if (!playWithMeRequest.value) return

  try {
    const gameId = await playWithMeTooAPI.acceptRequest(targetUserId)
    console.log('나랑도해 요청 수락됨, 게임 ID:', gameId)
    // 게임 생성 완료, 요청 상태 초기화
    playWithMeRequest.value = null
    // 게임 페이지로 이동하거나 성공 메시지 표시
    router.push(`/games/${gameId}`)
  } catch (error) {
    console.error('나랑도해 요청 수락 중 오류:', error)
  }
}

const handleReject = async () => {
  if (!playWithMeRequest.value) return

  try {
    await playWithMeTooAPI.rejectRequest(playWithMeRequest.value.fromUserId)
    console.log('나랑도해 요청 거절됨')
    playWithMeRequest.value = null
  } catch (error) {
    console.error('나랑도해 요청 거절 중 오류:', error)
  }
}

const handleAddFriend = () => {
  console.log('친구 요청')
  isFriend.value = true
  // TODO: 친구 요청 API 호출
}
</script>

<template>
  <div class="overflow-hidden">
    <!-- 기본 네비게이션 헤더 -->
    <div class="fixed left-0 w-full h-[70px] z-30" :style="{ top: `${headerTop}px` }">
      <div
        class="h-full flex items-center justify-between p-4 bg-white shadow-sm border-b border-gray-100"
      >
        <div class="flex items-center gap-3">
          <button @click="goBack()" class="text-gray-600 hover:text-gray-800 p-1">
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
          <div class="flex items-center gap-3" @click="goToProfile">
            <img
              :src="targetUserProfileUrl || defaultProfileUrl"
              alt="상대방 프로필"
              class="w-10 h-10 rounded-full border-2 border-gray-200 object-cover"
            />
            <div class="flex flex-col">
              <span class="font-semibold text-lg text-gray-900">{{ targetUserNickname }}</span>
            </div>
          </div>
        </div>

        <!-- 친구 요청 버튼 -->
        <div v-if="!isFriend" class="flex items-center">
          <button
            @click="handleAddFriend"
            class="px-3 py-1.5 bg-orange-500 text-white text-sm font-medium rounded-full hover:bg-orange-600 transition-colors"
          >
            친구 요청
          </button>
        </div>
      </div>
    </div>

    <!-- 진보된 스타일 상태 헤더 -->
    <div
      v-if="headerInfo.show"
      class="fixed left-0 w-full z-20"
      :style="{ top: `${headerTop + 70}px` }"
    >
      <div class="mx-3 my-2">
        <div
          class="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 overflow-hidden"
          :class="{ 'cursor-pointer': headerInfo.isClickable }"
          @click="headerInfo.isClickable && handleEditGame()"
        >
          <!-- 상태 표시 헤더 바 -->
          <div
            class="h-1 w-full"
            :class="{
              'bg-gradient-to-r from-green-400 to-emerald-500': headerInfo.type === 'game_scheduled',
              'bg-gradient-to-r from-orange-400 to-red-500': headerInfo.type === 'request_received' || headerInfo.type === 'challenge_received',
              'bg-gradient-to-r from-gray-300 to-gray-400': headerInfo.type === 'request_sent'
            }"
          ></div>

          <div class="p-4">
            <!-- 메인 콘텐츠 영역 -->
            <div class="flex items-start gap-4">
              <!-- 경기 정보 카드 -->
              <div
                class="flex-shrink-0 relative group"
                :class="{
                  'animate-pulse': headerInfo.type === 'request_received'
                }"
              >
                <div class="relative">
                  <img
                    class="w-12 h-12 rounded-xl object-cover shadow-md"
                    :src="`/category-picture/${playWithMeRequest?.minorCategory || '미분류'}.png`"
                    :alt="playWithMeRequest?.minorCategory"
                  />
                  <!-- 상태 배지 -->
                  <div
                    class="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm"
                    :class="{
                      'bg-green-500': headerInfo.type === 'game_scheduled',
                      'bg-orange-500': headerInfo.type === 'request_received' || headerInfo.type === 'challenge_received',
                      'bg-gray-400': headerInfo.type === 'request_sent'
                    }"
                  ></div>
                </div>
              </div>

              <!-- 정보 및 상태 영역 -->
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between">
                  <div class="flex-1 min-w-0">
                    <!-- 경기 제목 -->
                    <h3 class="text-base font-bold text-gray-900 truncate mb-1">
                      {{ playWithMeRequest?.ruleTitle || '경기' }}
                    </h3>

                    <!-- 카테고리 -->
                    <div class="flex items-center gap-1 mb-2">
                      <span class="text-xs text-gray-600 font-medium">{{ playWithMeRequest?.majorCategory || '스포츠' }}</span>
                      <i class="fas fa-chevron-right text-gray-300 text-xs"></i>
                      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        {{ playWithMeRequest?.minorCategory || '경기' }}
                      </span>
                    </div>

                    <!-- 상태 정보 -->
                    <div class="space-y-1">
                      <div class="flex items-center gap-2">
                        <div
                          class="w-2 h-2 rounded-full animate-pulse"
                          :class="{
                            'bg-green-500': headerInfo.type === 'game_scheduled',
                            'bg-orange-500': headerInfo.type === 'request_received' || headerInfo.type === 'challenge_received',
                            'bg-gray-400': headerInfo.type === 'request_sent'
                          }"
                        ></div>
                        <span class="text-sm font-semibold text-gray-900">{{ headerInfo.title }}</span>
                        <i
                          v-if="headerInfo.isClickable"
                          class="fas fa-external-link-alt text-gray-400 text-xs ml-auto"
                        ></i>
                      </div>
                      <p class="text-xs text-gray-600 leading-relaxed pl-4">{{ headerInfo.description }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 액션 버튼들 -->
            <div v-if="headerInfo.showActions" class="mt-4 pt-3 border-t border-gray-100">
              <template v-if="headerInfo.actionType === 'accept_reject'">
                <div class="flex gap-3">
                  <button
                    @click.stop="handleReject"
                    class="flex-1 py-2.5 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl transition-all duration-200 border border-gray-200"
                  >
                    <i class="fas fa-times mr-2 text-xs"></i>
                    거절
                  </button>
                  <button
                    @click.stop="handleAccept"
                    class="flex-1 py-2.5 px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                  >
                    <i class="fas fa-check mr-2 text-xs"></i>
                    수락
                  </button>
                </div>
              </template>
              <template v-else-if="headerInfo.actionType === 'edit_game'">
                <button
                  @click.stop="handleEditGame"
                  class="w-full py-2.5 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.01] flex items-center justify-center gap-2"
                >
                  <i class="fas fa-edit text-sm"></i>
                  경기 정보 수정
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div
      style="height: 100%"
      class="fixed top-0 left-0 w-full pb-[81px] px-1 z-10"
      :style="{ paddingTop: `${headerTop + (headerInfo.show ? 190 : 70)}px` }"
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
            <template v-else-if="msg.messageType === 'PLAY_WITH_ME_TOO'">
              <div class="w-full max-w-sm mx-auto">
                <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 shadow-md">
                  <div class="flex items-center gap-3 mb-3">
                    <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <i class="fas fa-gamepad text-white text-sm"></i>
                    </div>
                    <div class="flex-1">
                      <h4 class="text-sm font-bold text-gray-900">나랑도 해 알림</h4>
                      <p class="text-xs text-gray-600">{{ formatTime(msg.timestamp) }}</p>
                    </div>
                  </div>
                  <div class="bg-white/70 rounded-lg p-3 border border-blue-100">
                    <p class="text-sm text-gray-800 leading-relaxed text-center">{{ msg.content }}</p>
                  </div>
                </div>
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
        <form @submit.prevent="sendMsg" class="flex items-center w-full">
          <textarea
            ref="messageInput "
            v-model="newMsg"
            rows="1"
            class="flex-1 resize-none border border-gray-300 rounded-full px-4 py-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="메시지 입력..."
          />
          <button
            type="submit"
            @click="sendMsg"
            @mousedown.prevent="keepFocus"
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
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
textarea {
  overflow: hidden;
}
</style>
