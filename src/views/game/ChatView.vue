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

// 더미 데이터 및 케이스 테스트용 변수들
const testCase = ref('request_received') // 테스트 케이스 변경용
// 가능한 케이스들: 'request_received', 'request_sent', 'challenge_received', 'game_scheduled', 'game_pre_match', 'no_relation'

const targetUserNickname = ref('김민수')
const targetUserProfileUrl = ref('')
const isFriend = ref(false)

// 더미 게임 데이터
const gameData = ref({
  gameId: 123,
  sport: '탁구',
  location: '강남 탁구장',
  dateTime: '2024-12-25 14:00',
  status: 'scheduled', // 'pending', 'accepted', 'scheduled', 'completed'
  rule: {
    ruleTitle: '빠른 3세트 매치',
    majorCategory: '라켓 스포츠',
    minorCategory: '탁구',
  },
})

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
  switch (testCase.value) {
    case 'request_received':
      return {
        show: true,
        type: 'request_received',
        title: '경기 요청을 받았습니다',
        description: `${targetUserNickname.value}님이 ${gameData.value.rule.ruleTitle} 경기를 제안했습니다`,
        showActions: true,
        actionType: 'accept_reject',
      }
    case 'request_sent':
      return {
        show: true,
        type: 'request_sent',
        title: '경기 요청을 보냈습니다',
        description: `${gameData.value.rule.ruleTitle} 경기 요청 대기 중`,
        showActions: false,
      }
    case 'challenge_received':
      return {
        show: true,
        type: 'challenge_received',
        title: '"나랑도 해" 요청을 받았습니다',
        description: `${targetUserNickname.value}님이 함께 경기하기를 원합니다`,
        showActions: true,
        actionType: 'accept_reject',
      }
    case 'game_scheduled':
      return {
        show: true,
        type: 'game_scheduled',
        title: '경기가 예정되어 있습니다',
        description: `${gameData.value.rule.ruleTitle} • ${gameData.value.dateTime}`,
        showActions: false,
        isClickable: false,
      }
    case 'game_pre_match':
      return {
        show: true,
        type: 'game_pre_match',
        title: '경기 준비중',
        description: `${gameData.value.rule.ruleTitle} • ${gameData.value.location}`,
        showActions: false,
        isClickable: false,
      }
    case 'no_relation':
    default:
      return {
        show: false,
      }
  }
})

// 액션 핸들러들
const handleAccept = () => {
  console.log('수락됨')
  // API 호출 로직
}

const handleReject = () => {
  console.log('거절됨')
  // API 호출 로직
}

const handleEditGame = () => {
  console.log('경기 정보 수정')
  // 경기 정보 수정 모달 또는 페이지로 이동
}

const handleAddFriend = () => {
  console.log('친구 요청')
  isFriend.value = true
  // API 호출 로직
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
              'bg-gradient-to-r from-blue-400 to-indigo-500': headerInfo.type === 'game_pre_match',
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
                    :src="`/category-picture/${gameData.rule.minorCategory || '미분류'}.png`"
                    :alt="gameData.rule.minorCategory"
                  />
                  <!-- 상태 배지 -->
                  <div
                    class="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm"
                    :class="{
                      'bg-green-500': headerInfo.type === 'game_scheduled',
                      'bg-blue-500': headerInfo.type === 'game_pre_match',
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
                      {{ gameData.rule.ruleTitle }}
                    </h3>

                    <!-- 카테고리 -->
                    <div class="flex items-center gap-1 mb-2">
                      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        {{ gameData.rule.majorCategory }}
                      </span>
                      <i class="fas fa-chevron-right text-gray-300 text-xs"></i>
                      <span class="text-xs text-gray-600 font-medium">{{ gameData.rule.minorCategory }}</span>
                    </div>

                    <!-- 상태 정보 -->
                    <div class="space-y-1">
                      <div class="flex items-center gap-2">
                        <div
                          class="w-2 h-2 rounded-full animate-pulse"
                          :class="{
                            'bg-green-500': headerInfo.type === 'game_scheduled',
                            'bg-blue-500': headerInfo.type === 'game_pre_match',
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
      class="fixed top-0 left-0 w-full pb-[170px] px-1 z-10"
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
    <!-- 테스트 케이스 변경 UI (개발용) -->
    <div class="fixed bottom-[81px] left-0 w-full bg-gray-100 border-t p-2 z-30">
      <div class="text-xs font-semibold text-gray-700 mb-2">테스트 케이스 (개발용):</div>
      <div class="flex gap-1 overflow-x-auto pb-2">
        <button
          v-for="(case_name, case_key) in {
            request_received: '요청받음',
            request_sent: '요청보냄',
            challenge_received: '나랑도해',
            game_scheduled: '경기예정',
            game_pre_match: '경기준비',
            no_relation: '관계없음',
          }"
          :key="case_key"
          @click="testCase = case_key"
          :class="[
            'px-2 py-1 text-xs rounded whitespace-nowrap',
            testCase === case_key ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 border',
          ]"
        >
          {{ case_name }}
        </button>
        <button
          @click="isFriend = !isFriend"
          :class="[
            'px-2 py-1 text-xs rounded whitespace-nowrap ml-2',
            isFriend ? 'bg-green-500 text-white' : 'bg-white text-gray-600 border',
          ]"
        >
          {{ isFriend ? '친구임' : '친구아님' }}
        </button>
      </div>

      <!-- 스포츠 종목 변경 -->
      <div class="text-xs font-semibold text-gray-700 mb-1">스포츠 종목:</div>
      <div class="flex gap-1 overflow-x-auto">
        <button
          v-for="sport in [
            { name: '탁구', major: '라켓 스포츠', minor: '탁구', title: '빠른 3세트 매치' },
            {
              name: '배드민턴',
              major: '라켓 스포츠',
              minor: '배드민턴',
              title: '배드민턴 토너먼트',
            },
            { name: '테니스', major: '라켓 스포츠', minor: '테니스', title: '테니스 단식 경기' },
            { name: '축구', major: '구기 스포츠', minor: '축구', title: '풋살 매치' },
            { name: '농구', major: '구기 스포츠', minor: '농구', title: '3대3 농구' },
          ]"
          :key="sport.minor"
          @click="
            gameData.rule = {
              ruleTitle: sport.title,
              majorCategory: sport.major,
              minorCategory: sport.minor,
            }
          "
          :class="[
            'px-2 py-1 text-xs rounded whitespace-nowrap',
            gameData.rule.minorCategory === sport.minor
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-600 border',
          ]"
        >
          {{ sport.name }}
        </button>
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
