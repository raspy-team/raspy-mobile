<script setup>
import RuleThumb from '../../components/rule/RuleThumb.vue'
import { UiAvatar, UiBadge, UiButton, UiChip, UiDialog, UiEmptyState, UiIconButton, UiSkeleton } from '../../components/ui'
import { refreshOnChange } from '../../websocket/userChannel'
import { refreshInbox } from '../../stores/inbox'
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api, { playWithMeTooAPI } from '../../api/api'
import { getMyId } from '@/utils/me'
import { socket } from '../../websocket'
import { useToast } from '../../composable/useToast'

const route = useRoute()
const { showToast } = useToast()
const targetUserId = Number(route.params.targetUserId)
const newMsg = ref('')
const chatBox = ref(null)
const currentUserId = ref(null)
const roomId = ref('')
const messages = ref([])
const headerTop = ref(0)
// 위(상대·도전 카드)와 아래(입력칸) 높이. 도전 카드 유무·글자 크기에 따라 달라서 직접 잰다
const topRef = ref(null)
const bottomRef = ref(null)
const topHeight = ref(56)
const bottomHeight = ref(64)
const STATUS_TONE = { green: 'success', orange: 'primary', red: 'danger', gray: 'neutral', blue: 'neutral' }
let sizeObserver = null

const targetUserNickname = ref('')
const targetUserProfileUrl = ref('')
// 도전 요청 데이터 (모든 상태 포함)
const challengeStatus = ref(null)

// 에러 모달 관련
const showErrorModal = ref(false)
const errorMessage = ref('')

// 로딩 상태
const isLoadingMessages = ref(true)

// 도전 상태 변경 신호 구독 해제
let stopWatchingStatus = null
let fetchChallengeStatus = async () => {}

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
  sizeObserver = new ResizeObserver(() => {
    topHeight.value = topRef.value?.offsetHeight || 56
    bottomHeight.value = bottomRef.value?.offsetHeight || 64
  })
  if (topRef.value) sizeObserver.observe(topRef.value)
  if (bottomRef.value) sizeObserver.observe(bottomRef.value)
  try {
    const { data } = await api.post('/api/chat-room/dm-room', null, {
      params: { targetUserId },
    })
    roomId.value = data.roomId
    socket.onMessage((msg) => {
      messages.value.push(msg)
      // 보고 있는 방에 온 메시지는 바로 읽음으로 (목록·배지에 안 읽음으로 남지 않게)
      if (msg.senderId !== currentUserId.value) api.post(`/api/chat-room/${roomId.value}/read`).catch(() => {})
      scrollToBottom()
      // 도전 신청·수락·거절은 이 방에 메시지로 온다. 그때 상태를 다시 불러온다
      if (msg.messageType === 'PLAY_WITH_ME_TOO') fetchChallengeStatus()
    })

    socket.connect(roomId.value)

    currentUserId.value = await getMyId()

    targetUserNickname.value = data.targetUserNickname
    targetUserProfileUrl.value = data.targetUserProfileUrl

    // 도전 상태 확인 함수
    fetchChallengeStatus = async () => {
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

    // 그 밖의 변경(내 채널 신호)이나 앱으로 돌아왔을 때도 다시 불러온다 (예전엔 5초마다)
    stopWatchingStatus = refreshOnChange(fetchChallengeStatus)

    const res = await api.get(`/api/chat-room/${roomId.value}/chat-messages`)
    messages.value = res.data
    await nextTick()
    scrollToBottom()
    isLoadingMessages.value = false
  } catch (e) {
    console.error(e)
    isLoadingMessages.value = false
    if (e.response?.data?.message?.includes('자기 자신과의 DM')) {
      errorMessage.value = '나에게는 메시지를 보낼 수 없어요'
      showErrorModal.value = true
    } else {
      showToast('메시지를 불러오지 못했어요')
    }
  }
})

// 엔터로 보내기 (줄바꿈은 Shift+엔터). 한글 조합 중의 엔터는 글자 확정이라 보내지 않는다
function onEnter(e) {
  if (e.isComposing || e.keyCode === 229) return
  e.preventDefault()
  sendMsg()
}

onBeforeUnmount(() => {
  sizeObserver?.disconnect()
  refreshInbox() // 나가면 메시지 배지를 다시 센다
  stopWatchingStatus?.()
  stopWatchingStatus = null

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

const QUICK_REPLIES = ['안녕하세요! 반가워요', '한 판 하실래요?', '언제 시간 괜찮으세요?', '어디서 할까요?']
function sendQuick(text) {
  newMsg.value = text
  sendMsg()
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
        description: `${targetUserNickname.value}님의 답을 기다리고 있어요`,
        showActions: false,
        statusColor: 'gray',
      }
    } else {
      // 상대방이 나에게 도전한 경우
      return {
        show: true,
        type: 'challenge_received',
        title: '도전 요청을 받았어요',
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
        title: `${challengerNickname} 도전한 경기가 끝났어요`,
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
        title: '도전이 거절됐어요',
        description: `${targetUserNickname.value}님이 도전을 거절했어요`,
        showActions: false,
        statusColor: 'red',
      }
    } else {
      return {
        show: true,
        type: 'challenge_rejected',
        title: '도전을 거절했어요',
        description: `${targetUserNickname.value}님의 도전 요청을 거절했어요`,
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
    showToast(error.response?.data?.message || '수락하지 못했어요. 다시 시도해 주세요')
  }
}

const handleReject = async () => {
  if (!challengeStatus.value) return

  try {
    await playWithMeTooAPI.rejectRequest(challengeStatus.value.fromUserId)
    challengeStatus.value.status = 'REJECTED'
  } catch (error) {
    console.error('도전 요청 거절 중 오류:', error)
    showToast(error.response?.data?.message || '거절하지 못했어요. 다시 시도해 주세요')
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
  <div class="overflow-hidden bg-canvas">
    <!-- 위: 상대 + (있으면) 도전 카드. 키보드가 올라와도 화면 위에 붙어 있게 visualViewport 기준으로 둔다 -->
    <div ref="topRef" class="fixed left-0 w-full z-header bg-canvas" :style="{ top: `${headerTop}px` }">
      <header class="h-14 flex items-center gap-1 px-2 border-b border-line pt-safe box-content">
        <UiIconButton icon="fas fa-chevron-left" label="뒤로" @click="goBack()" />
        <button type="button" class="flex items-center gap-3 min-w-0" @click="goToProfile">
          <UiAvatar :src="targetUserProfileUrl" :name="targetUserNickname" size="sm" />
          <span class="t-heading truncate">{{ targetUserNickname }}</span>
        </button>
      </header>

      <!-- 도전 상태 -->
      <div v-if="headerInfo.show" class="px-3 py-2 border-b border-line">
        <div class="flex items-start gap-3">
          <RuleThumb :rule="{ minorCategory: challengeStatus?.minorCategory, ruleTitle: challengeStatus?.ruleTitle }" :size="44" class="!rounded-lg" />
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <p class="t-body font-medium text-fg truncate">{{ challengeStatus?.ruleTitle || '경기' }}</p>
              <UiBadge :tone="STATUS_TONE[headerInfo.statusColor] || 'neutral'">{{ headerInfo.title }}</UiBadge>
            </div>
            <p class="t-caption mt-0.5">{{ headerInfo.description }}</p>
          </div>
        </div>

        <div v-if="headerInfo.showActions" class="flex gap-2 mt-3">
          <template v-if="headerInfo.actionType === 'accept_reject'">
            <UiButton variant="secondary" size="sm" class="flex-1" @click="handleReject">거절</UiButton>
            <UiButton size="sm" class="flex-1" @click="handleAccept">수락</UiButton>
          </template>
          <UiButton v-else-if="headerInfo.actionType === 'go_to_game'" size="sm" block icon="fas fa-play" @click="handleGoToGame">경기로 가기</UiButton>
          <UiButton v-else-if="headerInfo.actionType === 'view_result'" variant="secondary" size="sm" block icon="fas fa-trophy" @click="handleViewResult">결과 보기</UiButton>
        </div>
      </div>
    </div>

    <!-- 대화 -->
    <div
      class="fixed top-0 left-0 w-full h-full px-3 bg-canvas"
      :style="{ paddingTop: `${headerTop + topHeight}px`, paddingBottom: `${bottomHeight}px` }"
    >
      <!-- 말풍선 모양 자리 표시 (주고받는 모양 그대로) -->
      <div v-if="isLoadingMessages" class="h-full flex flex-col justify-end gap-3 pb-4" role="status" aria-label="메시지 불러오는 중">
        <UiSkeleton
          v-for="(w, i) in [48, 62, 36, 54, 40]"
          :key="i"
          class="h-10 rounded-2xl"
          :class="i % 2 ? 'self-end' : 'self-start'"
          :style="{ width: w + '%' }"
        />
      </div>

      <div v-else-if="!visibleMessages.length" class="h-full flex flex-col items-center justify-center">
        <UiEmptyState icon="far fa-comment" :title="`${targetUserNickname || '상대'}님과 첫 대화예요`" description="첫마디가 어려우면 하나 골라 보내보세요" />
        <!-- 빠른 첫마디: 누르면 바로 보낸다 -->
        <div class="flex flex-wrap justify-center gap-2 px-6 -mt-6">
          <UiChip v-for="q in QUICK_REPLIES" :key="q" @click="sendQuick(q)">{{ q }}</UiChip>
        </div>
      </div>

      <div v-else ref="chatBox" class="h-full overflow-auto space-y-2 pb-2" role="log" aria-live="polite">
        <p class="text-center t-micro py-4">대화의 시작이에요</p>
        <template v-for="(msg, idx) in visibleMessages" :key="msg._key">
          <p v-if="shouldShowDate(idx, visibleMessages)" class="text-center t-micro py-2">{{ formatDateOnly(msg.timestamp) }}</p>

          <template v-if="msg.messageType === 'TALK'">
            <div v-if="msg.senderId === currentUserId" class="flex justify-end items-end gap-1.5 pl-12">
              <span class="t-micro pb-1 flex-shrink-0">{{ formatTime(msg.timestamp) }}</span>
              <p class="px-3.5 py-2.5 rounded-2xl rounded-br-md bg-primary text-primary-on text-sm whitespace-pre-line break-words">{{ msg.content }}</p>
            </div>
            <div v-else class="flex justify-start items-end gap-1.5 pr-12">
              <p class="px-3.5 py-2.5 rounded-2xl rounded-bl-md bg-surface-2 text-fg text-sm whitespace-pre-line break-words">{{ msg.content }}</p>
              <span class="t-micro pb-1 flex-shrink-0">{{ formatTime(msg.timestamp) }}</span>
            </div>
          </template>
          <p v-else class="text-center t-micro py-1">{{ msg.content }}</p>
        </template>
      </div>
    </div>

    <!-- 입력 -->
    <div ref="bottomRef" class="fixed bottom-0 w-full z-header bg-canvas border-t border-line pb-safe">
      <form class="px-3 py-2 flex items-end gap-2" @submit.prevent="sendMsg">
        <textarea
          v-model="newMsg"
          rows="1"
          class="ui-control py-3 resize-none flex-1"
          placeholder="메시지 보내기"
          enterkeyhint="send"
          aria-label="메시지"
          @keydown.enter.exact="onEnter"
        />
        <button
          type="submit"
          aria-label="보내기"
          :disabled="!newMsg.trim()"
          class="w-12 h-12 flex-shrink-0 rounded-full bg-primary text-primary-on flex items-center justify-center active:bg-primary-press disabled:bg-surface-2 disabled:text-fg-subtle transition-colors"
          @mousedown.prevent="keepFocus"
        >
          <UiIcon name="fas fa-paper-plane" aria-hidden="true" />
        </button>
      </form>
    </div>

    <UiDialog
      :model-value="showErrorModal"
      title="메시지를 보낼 수 없어요"
      :message="errorMessage"
      confirm-text="돌아가기"
      cancel-text=""
      @confirm="closeErrorModal"
      @update:model-value="(v) => !v && closeErrorModal()"
    />
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
