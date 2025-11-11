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

// 로딩 상태
const isLoadingMessages = ref(true)

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
    isLoadingMessages.value = false
  } catch (e) {
    console.error(e)
    isLoadingMessages.value = false
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
      title: '경기 진행 예정',
      description: '도전자가 바로 경기를 시작할 수 있어요',
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
  <div class="overflow-hidden bg-gray-950">
    <!-- 기본 네비게이션 헤더 -->
    <div class="fixed left-0 w-full h-[83px] z-30" :style="{ top: `${headerTop}px` }">
      <div
        class="h-full flex items-center justify-between px-4 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 backdrop-blur-xl shadow-lg border-b border-white/10"
      >
        <div class="flex items-center gap-3">
          <button
            @click="goBack()"
            class="text-gray-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-all duration-200 active:scale-95"
          >
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
                stroke-width="2.5"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div class="flex items-center gap-3 cursor-pointer" @click="goToProfile">
            <div class="relative">
              <img
                :src="targetUserProfileUrl || defaultProfileUrl"
                alt="상대방 프로필"
                class="w-11 h-11 rounded-full border-2 border-orange-500/30 object-cover ring-2 ring-orange-500/20 shadow-lg"
              />
              <div
                class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-gray-900 rounded-full"
              ></div>
            </div>
            <div class="flex flex-col py-3">
              <span class="font-bold text-lg text-white">{{ targetUserNickname }}</span>
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
          class="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
        >
          <!-- 상태 표시 헤더 바 -->
          <div
            class="h-1.5 w-full"
            :class="{
              'bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500':
                headerInfo.statusColor === 'green',
              'bg-gradient-to-r from-orange-400 via-orange-500 to-red-500':
                headerInfo.statusColor === 'orange',
              'bg-gradient-to-r from-gray-500 via-gray-600 to-gray-700':
                headerInfo.statusColor === 'gray',
              'bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-600':
                headerInfo.statusColor === 'blue',
              'bg-gradient-to-r from-red-400 via-red-500 to-rose-600':
                headerInfo.statusColor === 'red',
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
                  <div
                    class="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl blur-md"
                  ></div>
                  <img
                    class="relative w-14 h-14 rounded-xl object-cover shadow-xl border-2 border-white/10"
                    :src="`/category-picture/${challengeStatus?.minorCategory || '미분류'}.png`"
                    :alt="challengeStatus?.minorCategory"
                  />
                  <!-- 상태 배지 -->
                  <div
                    class="absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-gray-900 shadow-lg animate-pulse"
                    :class="{
                      'bg-gradient-to-br from-green-400 to-emerald-500':
                        headerInfo.statusColor === 'green',
                      'bg-gradient-to-br from-orange-400 to-red-500':
                        headerInfo.statusColor === 'orange',
                      'bg-gradient-to-br from-gray-400 to-gray-500':
                        headerInfo.statusColor === 'gray',
                      'bg-gradient-to-br from-blue-400 to-indigo-500':
                        headerInfo.statusColor === 'blue',
                      'bg-gradient-to-br from-red-400 to-rose-500':
                        headerInfo.statusColor === 'red',
                    }"
                  ></div>
                </div>
              </div>

              <!-- 정보 및 상태 영역 -->
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between">
                  <div class="flex-1 min-w-0">
                    <!-- 경기 제목 -->
                    <h3 class="text-base font-bold text-white truncate mb-1.5">
                      {{ challengeStatus?.ruleTitle || '경기' }}
                    </h3>

                    <!-- 카테고리 -->
                    <div class="flex items-center gap-1.5 mb-2.5">
                      <span class="text-xs text-gray-400 font-medium">{{
                        challengeStatus?.majorCategory || '스포츠'
                      }}</span>
                      <i class="fas fa-chevron-right text-gray-600 text-[10px]"></i>
                      <span
                        class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md"
                      >
                        {{ challengeStatus?.minorCategory || '경기' }}
                      </span>
                    </div>

                    <!-- 상태 정보 -->
                    <div class="space-y-1.5">
                      <div class="flex items-center gap-2">
                        <div
                          class="w-2 h-2 rounded-full animate-pulse"
                          :class="{
                            'bg-green-400 shadow-lg shadow-green-500/50':
                              headerInfo.statusColor === 'green',
                            'bg-orange-400 shadow-lg shadow-orange-500/50':
                              headerInfo.statusColor === 'orange',
                            'bg-gray-400 shadow-lg shadow-gray-500/50':
                              headerInfo.statusColor === 'gray',
                            'bg-blue-400 shadow-lg shadow-blue-500/50':
                              headerInfo.statusColor === 'blue',
                            'bg-red-400 shadow-lg shadow-red-500/50':
                              headerInfo.statusColor === 'red',
                          }"
                        ></div>
                        <span class="text-sm font-bold text-white">{{ headerInfo.title }}</span>
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
            <div v-if="headerInfo.showActions" class="mt-4 pt-3 border-t border-white/10">
              <!-- 수락/거절 버튼 (PENDING, 수신자) -->
              <template v-if="headerInfo.actionType === 'accept_reject'">
                <div class="flex gap-3">
                  <button
                    @click.stop="handleReject"
                    class="flex-1 py-3 px-4 bg-gradient-to-br from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 text-white text-sm font-bold rounded-xl transition-all duration-200 border border-white/10 shadow-lg hover:shadow-xl active:scale-95"
                  >
                    <i class="fas fa-times mr-2"></i>
                    거절
                  </button>
                  <button
                    @click.stop="handleAccept"
                    class="flex-1 py-3 px-4 bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 hover:from-orange-600 hover:via-orange-700 hover:to-red-700 text-white text-sm font-bold rounded-xl transition-all duration-200 shadow-xl hover:shadow-2xl hover:shadow-orange-500/50 active:scale-95"
                  >
                    <i class="fas fa-check mr-2"></i>
                    수락
                  </button>
                </div>
              </template>

              <!-- 경기 바로가기 버튼 (ACCEPTED, 진행 중) -->
              <template v-else-if="headerInfo.actionType === 'go_to_game'">
                <button
                  @click.stop="handleGoToGame"
                  class="w-full py-3 px-4 bg-gradient-to-br from-green-500 via-emerald-600 to-teal-600 hover:from-green-600 hover:via-emerald-700 hover:to-teal-700 text-white text-sm font-bold rounded-xl transition-all duration-200 shadow-xl hover:shadow-2xl hover:shadow-green-500/50 active:scale-95 flex items-center justify-center gap-2"
                >
                  <i class="fas fa-gamepad"></i>
                  경기 바로가기
                </button>
              </template>

              <!-- 결과 보기 버튼 (ACCEPTED, COMPLETED) -->
              <template v-else-if="headerInfo.actionType === 'view_result'">
                <button
                  @click.stop="handleViewResult"
                  class="w-full py-3 px-4 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 hover:from-blue-600 hover:via-indigo-700 hover:to-purple-700 text-white text-sm font-bold rounded-xl transition-all duration-200 shadow-xl hover:shadow-2xl hover:shadow-blue-500/50 active:scale-95 flex items-center justify-center gap-2"
                >
                  <i class="fas fa-trophy"></i>
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
      class="fixed top-0 left-0 w-full pb-[81px] px-3 z-10 bg-gray-950"
      :style="{ paddingTop: `${headerTop + (headerInfo.show ? 190 : 70)}px` }"
    >
      <!-- 로딩 상태 -->
      <div v-if="isLoadingMessages" class="h-full flex items-center justify-center">
        <div class="relative">
          <div class="absolute inset-0 bg-orange-500/20 rounded-full blur-xl animate-pulse"></div>
          <div class="relative flex flex-col items-center gap-3">
            <i class="fas fa-spinner fa-spin text-4xl text-orange-500"></i>
            <p class="text-sm text-gray-400 font-medium">메시지를 불러오는 중...</p>
          </div>
        </div>
      </div>

      <div v-else ref="chatBox" class="h-full overflow-auto space-y-3 pb-2">
        <div v-if="visibleMessages.length > 0" class="flex justify-center py-4">
          <div
            class="bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-sm text-orange-400 rounded-full px-5 py-2 text-xs font-bold shadow-lg border border-orange-500/30"
          >
            대화의 첫 부분입니다
          </div>
        </div>
        <template v-for="(msg, idx) in visibleMessages" :key="msg._key">
          <div v-if="shouldShowDate(idx, visibleMessages)" class="flex justify-center my-3">
            <div
              class="bg-gray-800/60 backdrop-blur-sm border border-white/10 px-4 py-1.5 rounded-full text-xs text-gray-300 shadow-lg font-semibold"
            >
              {{ formatDateOnly(msg.timestamp) }}
            </div>
          </div>
          <div
            class="flex px-2"
            :class="msg.senderId === currentUserId ? 'justify-end' : 'justify-start'"
          >
            <template v-if="msg.messageType === 'TALK'">
              <div v-if="msg.senderId === currentUserId" class="flex items-end gap-2 max-w-[75%]">
                <span class="text-[10px] text-gray-500 mb-1">{{ formatTime(msg.timestamp) }}</span>
                <div
                  class="p-3.5 rounded-2xl break-words bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 text-white rounded-br-md shadow-lg"
                >
                  <p class="whitespace-pre-line leading-relaxed text-sm">{{ msg.content }}</p>
                </div>
              </div>
              <div
                v-else
                class="max-w-[75%] p-3.5 rounded-2xl break-words bg-gradient-to-br from-gray-800 to-gray-700 text-gray-100 rounded-bl-md shadow-lg border border-white/10"
              >
                <p class="whitespace-pre-line leading-relaxed text-sm">{{ msg.content }}</p>
                <p class="text-[10px] mt-1.5 text-gray-400">
                  {{ formatTime(msg.timestamp) }}
                </p>
              </div>
            </template>
            <template v-else>
              <div
                class="mx-auto bg-gray-800/50 backdrop-blur-sm px-3 py-1.5 rounded-lg text-gray-400 text-xs shadow-md border border-white/10"
              >
                {{ msg.content }}
              </div>
            </template>
          </div>
        </template>
      </div>
    </div>

    <!-- 메시지 입력 영역 -->
    <div
      class="fixed bottom-0 w-full z-20 bg-gradient-to-t from-gray-900 via-gray-900 to-gray-900/95 backdrop-blur-xl border-t border-white/10 shadow-2xl"
    >
      <div class="p-3 flex items-center gap-2">
        <form @submit.prevent="sendMsg" class="flex items-center w-full gap-2">
          <div class="flex-1 relative">
            <textarea
              ref="messageInput "
              v-model="newMsg"
              rows="1"
              class="w-full resize-none bg-gray-800 border border-white/10 rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 text-white placeholder-gray-500 shadow-inner transition-all duration-200"
              placeholder="메시지를 입력하세요..."
            />
          </div>
          <button
            type="submit"
            @click="sendMsg"
            @mousedown.prevent="keepFocus"
            :disabled="!newMsg.trim()"
            class="p-3 bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 text-white rounded-full shadow-xl hover:shadow-2xl hover:shadow-orange-500/50 hover:scale-110 active:scale-95 transition-all duration-200 disabled:opacity-40 disabled:hover:scale-100 disabled:shadow-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6 transform rotate-45"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2.5"
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
      class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        class="bg-gradient-to-br from-gray-900 to-gray-800 border border-white/10 rounded-2xl shadow-2xl p-6 max-w-sm w-full"
      >
        <div class="text-center mb-5">
          <div class="mb-4 relative inline-block">
            <div class="absolute inset-0 bg-orange-500/20 rounded-full blur-xl"></div>
            <i class="fas fa-exclamation-triangle text-orange-500 text-5xl mb-3 relative"></i>
          </div>
          <h3 class="text-xl font-bold text-white mb-3">알림</h3>
          <p class="text-sm text-gray-300 leading-relaxed">{{ errorMessage }}</p>
        </div>
        <button
          @click="closeErrorModal"
          class="w-full bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 hover:from-orange-600 hover:via-orange-700 hover:to-red-700 text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-xl hover:shadow-2xl hover:shadow-orange-500/50 active:scale-95"
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

/* 커스텀 스크롤바 - 다크모드 */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(107, 114, 128, 0.3);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.5);
}

/* 부드러운 스크롤 */
* {
  scroll-behavior: smooth;
}
</style>
