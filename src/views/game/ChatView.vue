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
// 도전 요청 데이터 (모든 상태 포함)
const challengeStatus = ref(null)

// 에러 모달 관련
const showErrorModal = ref(false)
const errorMessage = ref('')

// 폴링 인터벌
let statusPollingInterval = null

function updateHeaderPosition() {
  if (window.visualViewport) {
    headerTop.value = window.visualViewport.offsetTop
    scrollToBottom()
  } else {
    headerTop.value = 0
  }
}

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

    // 도전 상태 확인 함수
    const fetchChallengeStatus = async () => {
      try {
        const statusData = await playWithMeTooAPI.getStatusWithUser(targetUserId)
        if (statusData) {
          challengeStatus.value = statusData
        }
      } catch (error) {
        console.error('도전 상태 확인 중 오류:', error)
      }
    }

    // 첫 도전 상태 확인
    await fetchChallengeStatus()

    // 5초마다 도전 상태 폴링 시작
    statusPollingInterval = setInterval(fetchChallengeStatus, 5000)

    const res = await api.get(`/api/chat-room/${roomId.value}/chat-messages`)
    messages.value = res.data
    await nextTick()
    scrollToBottom()
  } catch (e) {
    console.error(e)
    if (e.response?.data?.message?.includes('자기 자신과의 DM')) {
      errorMessage.value = '자기 자신과의 DM은 생성할 수 없습니다.'
      showErrorModal.value = true
    }
  }
})

onBeforeUnmount(() => {
  // 폴링 중지
  if (statusPollingInterval) {
    clearInterval(statusPollingInterval)
    statusPollingInterval = null
    console.log('[ChatView] 도전 상태 폴링 중지')
  }

  // visualViewport 이벤트 리스너 제거
  if (window.visualViewport) {
    window.visualViewport.removeEventListener('resize', updateHeaderPosition)
    window.visualViewport.removeEventListener('scroll', updateHeaderPosition)
  }
})

const messageInput = ref(null)
function keepFocus() {
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
  if (!challengeStatus.value) {
    return { show: false }
  }

  const status = challengeStatus.value.status
  const isRequester = challengeStatus.value.fromUserId === currentUserId.value
  const gameStatus = challengeStatus.value.gameStatus

  // CANCELLED는 표시하지 않음
  if (status === 'CANCELLED') {
    return { show: false }
  }

  // PENDING 상태
  if (status === 'PENDING') {
    if (isRequester) {
      // 내가 도전한 경우
      return {
        show: true,
        type: 'challenge_sent',
        title: '도전 대기 중',
        description: `${targetUserNickname.value}님의 응답을 기다리고 있습니다`,
        showActions: false,
        statusColor: 'gray',
      }
    } else {
      // 상대방이 나에게 도전한 경우
      return {
        show: true,
        type: 'challenge_received',
        title: '도전 요청을 받았습니다',
        description: `${targetUserNickname.value}님이 함께 경기하기를 원합니다`,
        showActions: true,
        actionType: 'accept_reject',
        statusColor: 'orange',
      }
    }
  }

  // ACCEPTED 상태
  if (status === 'ACCEPTED') {
    const gameId = challengeStatus.value.gameId
    if (!gameId) {
      return { show: false }
    }

    // 게임이 완료된 경우
    if (gameStatus === 'COMPLETED') {
      const challengerNickname = isRequester ? '내가' : targetUserNickname.value + '님이'
      return {
        show: true,
        type: 'game_completed',
        title: `${challengerNickname} 도전한 경기가 종료되었습니다`,
        description: '경기 결과를 확인하세요',
        showActions: true,
        actionType: 'view_result',
        gameId,
        statusColor: 'blue',
      }
    }

    // 게임이 진행 중인 경우
    return {
      show: true,
      type: 'game_in_progress',
      title: '경기 진행 중',
      description: '경기 페이지로 이동하여 경기를 진행하세요',
      showActions: true,
      actionType: 'go_to_game',
      gameId,
      statusColor: 'green',
    }
  }

  // REJECTED 상태
  if (status === 'REJECTED') {
    if (isRequester) {
      return {
        show: true,
        type: 'challenge_rejected',
        title: '도전이 거절되었습니다',
        description: `${targetUserNickname.value}님이 도전을 거절했습니다`,
        showActions: false,
        statusColor: 'red',
      }
    } else {
      return {
        show: true,
        type: 'challenge_rejected',
        title: '도전을 거절했습니다',
        description: `${targetUserNickname.value}님의 도전 요청을 거절했습니다`,
        showActions: false,
        statusColor: 'red',
      }
    }
  }

  return { show: false }
})

// 액션 핸들러들
const handleAccept = async () => {
  if (!challengeStatus.value) return

  try {
    await playWithMeTooAPI.acceptRequest(challengeStatus.value.fromUserId)
  } catch (error) {
    console.error('도전 요청 수락 중 오류:', error)
  }
}

const handleReject = async () => {
  if (!challengeStatus.value) return

  try {
    await playWithMeTooAPI.rejectRequest(challengeStatus.value.fromUserId)
    console.log('도전 요청 거절됨')
    challengeStatus.value.status = 'REJECTED'
  } catch (error) {
    console.error('도전 요청 거절 중 오류:', error)
  }
}

const handleGoToGame = () => {
  if (headerInfo.value.gameId) {
    router.push(`/game?id=${headerInfo.value.gameId}`)
  }
}

const handleViewResult = () => {
  if (headerInfo.value.gameId) {
    router.push(`/game?id=${headerInfo.value.gameId}`)
  }
}

// 에러 모달 확인 버튼 클릭 시
const closeErrorModal = () => {
  showErrorModal.value = false
  router.go(-1)
}
</script>

<template>
  <div class="overflow-hidden">
    <!-- 기본 네비게이션 헤더 -->
    <div class="fixed left-0 w-full h-[70px] z-30" :style="{ top: `${headerTop}px` }">
      <div
        class="h-full flex items-center justify-between p-4 bg-gray-900 shadow-sm border-b border-gray-700"
      >
        <div class="flex items-center gap-3">
          <button @click="goBack()" class="text-gray-300 hover:text-gray-100 p-1">
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
              class="w-10 h-10 rounded-full border-2 border-gray-600 object-cover"
            />
            <div class="flex flex-col">
              <span class="font-semibold text-lg text-gray-100">{{ targetUserNickname }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 도전 상태 헤더 -->
    <div
      v-if="headerInfo.show"
      class="fixed left-0 w-full z-20"
      :style="{ top: `${headerTop + 70}px` }"
    >
      <div class="mx-3 my-2">
        <div
          class="bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-lg border border-gray-600 overflow-hidden"
        >
          <!-- 상태 표시 헤더 바 -->
          <div
            class="h-1 w-full"
            :class="{
              'bg-gradient-to-r from-green-400 to-emerald-500': headerInfo.statusColor === 'green',
              'bg-gradient-to-r from-orange-400 to-red-500': headerInfo.statusColor === 'orange',
              'bg-gradient-to-r from-gray-500 to-gray-600': headerInfo.statusColor === 'gray',
              'bg-gradient-to-r from-blue-400 to-blue-600': headerInfo.statusColor === 'blue',
              'bg-gradient-to-r from-red-400 to-red-600': headerInfo.statusColor === 'red',
            }"
          ></div>

          <div class="p-4">
            <!-- 메인 콘텐츠 영역 -->
            <div class="flex items-start gap-4">
              <!-- 경기 정보 카드 -->
              <div
                class="flex-shrink-0 relative group"
                :class="{
                  'animate-pulse': headerInfo.type === 'challenge_received',
                }"
              >
                <div class="relative">
                  <img
                    class="w-12 h-12 rounded-xl object-cover shadow-md"
                    :src="`/category-picture/${challengeStatus?.minorCategory || '미분류'}.png`"
                    :alt="challengeStatus?.minorCategory"
                  />
                  <!-- 상태 배지 -->
                  <div
                    class="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-800 shadow-sm"
                    :class="{
                      'bg-green-500': headerInfo.statusColor === 'green',
                      'bg-orange-500': headerInfo.statusColor === 'orange',
                      'bg-gray-500': headerInfo.statusColor === 'gray',
                      'bg-blue-500': headerInfo.statusColor === 'blue',
                      'bg-red-500': headerInfo.statusColor === 'red',
                    }"
                  ></div>
                </div>
              </div>

              <!-- 정보 및 상태 영역 -->
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between">
                  <div class="flex-1 min-w-0">
                    <!-- 경기 제목 -->
                    <h3 class="text-base font-bold text-gray-100 truncate mb-1">
                      {{ challengeStatus?.ruleTitle || '경기' }}
                    </h3>

                    <!-- 카테고리 -->
                    <div class="flex items-center gap-1 mb-2">
                      <span class="text-xs text-gray-400 font-medium">{{
                        challengeStatus?.majorCategory || '스포츠'
                      }}</span>
                      <i class="fas fa-chevron-right text-gray-500 text-xs"></i>
                      <span
                        class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-500 text-gray-100"
                      >
                        {{ challengeStatus?.minorCategory || '경기' }}
                      </span>
                    </div>

                    <!-- 상태 정보 -->
                    <div class="space-y-1">
                      <div class="flex items-center gap-2">
                        <div
                          class="w-2 h-2 rounded-full animate-pulse"
                          :class="{
                            'bg-green-500': headerInfo.statusColor === 'green',
                            'bg-orange-500': headerInfo.statusColor === 'orange',
                            'bg-gray-500': headerInfo.statusColor === 'gray',
                            'bg-blue-500': headerInfo.statusColor === 'blue',
                            'bg-red-500': headerInfo.statusColor === 'red',
                          }"
                        ></div>
                        <span class="text-sm font-semibold text-gray-100">{{
                          headerInfo.title
                        }}</span>
                      </div>
                      <p class="text-xs text-gray-400 leading-relaxed pl-4">
                        {{ headerInfo.description }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 액션 버튼들 -->
            <div v-if="headerInfo.showActions" class="mt-4 pt-3 border-t border-gray-600">
              <!-- 수락/거절 버튼 (PENDING, 수신자) -->
              <template v-if="headerInfo.actionType === 'accept_reject'">
                <div class="flex gap-3">
                  <button
                    @click.stop="handleReject"
                    class="flex-1 py-2.5 px-4 bg-gray-700 hover:bg-gray-600 text-gray-100 text-sm font-semibold rounded-xl transition-all duration-200 border border-gray-500"
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

              <!-- 경기 바로가기 버튼 (ACCEPTED, 진행 중) -->
              <template v-else-if="headerInfo.actionType === 'go_to_game'">
                <button
                  @click.stop="handleGoToGame"
                  class="w-full py-2.5 px-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.01] flex items-center justify-center gap-2"
                >
                  <i class="fas fa-gamepad text-sm"></i>
                  경기 바로가기
                </button>
              </template>

              <!-- 결과 보기 버튼 (ACCEPTED, COMPLETED) -->
              <template v-else-if="headerInfo.actionType === 'view_result'">
                <button
                  @click.stop="handleViewResult"
                  class="w-full py-2.5 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.01] flex items-center justify-center gap-2"
                >
                  <i class="fas fa-trophy text-sm"></i>
                  경기 결과 보기
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 채팅 영역 -->
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
            <template v-else>
              <div class="mx-auto bg-gray-100 px-3 py-1 rounded text-gray-600 text-xs shadow">
                {{ msg.content }}
              </div>
            </template>
          </div>
        </template>
      </div>
    </div>

    <!-- 메시지 입력 영역 -->
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

    <!-- 에러 모달 -->
    <div
      v-if="showErrorModal"
      class="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full">
        <div class="text-center mb-4">
          <i class="fas fa-exclamation-triangle text-orange-500 text-4xl mb-3"></i>
          <h3 class="text-lg font-bold text-gray-900 mb-2">알림</h3>
          <p class="text-sm text-gray-600">{{ errorMessage }}</p>
        </div>
        <button
          @click="closeErrorModal"
          class="w-full bg-orange-500 text-white font-semibold py-3 rounded-xl hover:bg-orange-600 transition shadow"
        >
          확인
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
