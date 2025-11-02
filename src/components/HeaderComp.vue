<template>
  <header
    :class="[
      'fixed top-0 left-0 w-full z-[30] border-b border-gray-200 bg-black/90 backdrop-blur-md raspy-top ',
      props.customClass,
    ]"
  >
    <div class="max-w-4xl mx-auto px-4 md:px-8 flex items-center justify-between text-gray-200">
      <!-- 좌측: 로고 또는 뒤로가기 -->
      <div class="flex items-center h-14 text-gray-300">
        <button v-if="props.hasReferer" @click="goBack" class="text-gray-200 text-lg">
          <i :class="props.backIconClass"></i>
        </button>
        <slot name="left"></slot>
      </div>
      <!-- 중앙: 타이틀 (hasReferer일 때만 표시) -->
      <div
        v-if="props.hasReferer == true && props.title"
        class="absolute left-1/2 transform -translate-x-1/2 text-gray-100 text-sm py-[50px] font-light"
      >
        {{ props.title }}
      </div>
      <slot name="center"></slot>

      <!-- 우측: 알림 + DM -->
      <div class="flex items-center space-x-4 mr-3">
        <slot name="right-before"></slot>

        <!-- DM 버튼 -->
        <router-link
          v-if="props.showDm"
          to="/dm"
          class="w-10 h-10 flex items-center justify-center rounded-full ml-1 focus:outline-none"
          title="DM"
        >
          <i class="fas fa-paper-plane text-orange-400 text-xl"></i>
        </router-link>

        <!-- 알림 버튼  -->
        <button
          v-if="props.showBell"
          class="w-10 h-10 flex items-center justify-center relative rounded-full focus:outline-none"
          @click="toggleNotificationPanel"
        >
          <i class="fas fa-bell text-orange-400 text-xl"></i>
          <span
            v-if="totalUnreadCount > 0"
            class="absolute top-0 right-0 min-w-[18px] h-[18px] bg-orange-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-gray-900"
          >
            {{ totalUnreadCount > 9 ? '9+' : totalUnreadCount }}
          </span>
        </button>

        <slot name="right-after"></slot>
      </div>
    </div>
    <!-- 알림 패널 (오른쪽 슬라이드) -->
    <transition name="slide">
      <aside
        v-if="showNotificationPanel"
        class="fixed top-14 right-0 h-[calc(100vh-3.5rem)] w-full max-w-[350px] sm:max-w-[400px] bg-gray-900/95 raspy-top border-l border-gray-700 z-[100] shadow-2xl shadow-black/60 flex flex-col"
        @touchstart="onPanelDragStart"
        @touchmove="onPanelDragMove"
        @touchend="onPanelDragEnd"
        @mousedown="onPanelDragStart"
        @mousemove="onPanelDragMove"
        @mouseup="onPanelDragEnd"
      >
        <div
          class="notification-header flex items-center justify-between px-4 h-14 border-b border-gray-700 bg-gray-900/80"
        >
          <span class="notification-title text-sm font-semibold text-gray-100 tracking-tight">알림</span>
          <div class="flex items-center gap-2">
            <button
              v-if="notifications.length > 0"
              @click="clearAllNotifications"
              :disabled="clearingNotifications"
              class="clear-all-btn text-[11px] font-semibold text-gray-400 hover:text-orange-400 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              title="알림 모두 지우기"
            >
              <i v-if="clearingNotifications" class="fas fa-spinner fa-spin mr-1 text-[10px]"></i>
              <i v-else class="fas fa-trash-alt mr-1 text-[10px]"></i>
              모두 지우기
            </button>
            <button
              @click="toggleNotificationPanel"
              class="close-btn text-gray-400 hover:text-gray-100 text-lg transition-colors"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        <div class="flex-1 overflow-y-auto overflow-x-hidden">
          <!-- 친구 요청 섹션 -->
          <div v-if="friendRequests.length > 0" class="border-b-2 border-orange-500/30 bg-gray-800/50">
            <div class="px-4 py-2.5 border-b border-gray-700">
              <h3 class="text-xs font-bold text-orange-400 flex items-center gap-1.5">
                <i class="fas fa-user-plus text-[10px]"></i>
                친구 요청 ({{ friendRequests.length }})
              </h3>
            </div>
            <ul>
              <li
                v-for="request in friendRequests"
                :key="request.id"
                class="px-4 py-3 border-b border-gray-700/50 hover:bg-gray-800/80 transition-colors"
              >
                <div class="flex items-center gap-2.5">
                  <!-- 프로필 이미지 -->
                  <img
                    :src="request.avatar || '/default-avatar.png'"
                    :alt="request.nickname"
                    class="w-10 h-10 rounded-full border-2 border-orange-400 object-cover flex-shrink-0"
                  />

                  <!-- 사용자 정보 -->
                  <div class="flex-1 min-w-0">
                    <div class="font-semibold text-xs text-gray-100 truncate">
                      {{ request.nickname }}
                    </div>
                    <div class="text-[10px] text-gray-400 truncate">
                      @{{ request.username }}
                    </div>
                    <div v-if="request.intro" class="text-[10px] text-gray-500 mt-0.5 truncate">
                      {{ request.intro }}
                    </div>
                  </div>

                  <!-- 액션 버튼 또는 상태 -->
                  <div class="flex-shrink-0">
                    <!-- 처리 전 버튼 -->
                    <div v-if="!request.status" class="flex gap-1.5">
                      <button
                        @click.stop="acceptFriendRequest(request.id)"
                        :disabled="request.processing"
                        class="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-[11px] font-bold rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <i v-if="request.processing" class="fas fa-spinner fa-spin mr-0.5 text-[9px]"></i>
                        수락
                      </button>
                      <button
                        @click.stop="rejectFriendRequest(request.id)"
                        :disabled="request.processing"
                        class="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-[11px] font-semibold rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        거절
                      </button>
                    </div>

                    <!-- 수락됨 상태 -->
                    <div v-else-if="request.status === 'accepted'" class="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-500/20 border border-green-500/50 rounded-lg">
                      <i class="fas fa-check-circle text-green-400 text-[10px]"></i>
                      <span class="text-[10px] font-semibold text-green-300">친구가 되었습니다</span>
                    </div>

                    <!-- 거절됨 상태 -->
                    <div v-else-if="request.status === 'rejected'" class="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-700/50 border border-gray-600 rounded-lg">
                      <i class="fas fa-times-circle text-gray-400 text-[10px]"></i>
                      <span class="text-[10px] font-semibold text-gray-400">거절됨</span>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </div>

          <!-- 일반 알림 섹션 -->
          <template v-if="notifications.length > 0">
            <ul>
              <li
                v-for="n in notifications"
                :key="n.id"
                class="flex px-4 py-3 border-b border-gray-700 group cursor-pointer hover:bg-gray-800/80 transition-colors duration-150 relative overflow-hidden"
                @click="openNotification(n)"
              >
                <div
                  class="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 border border-gray-700 mr-3 shadow-inner shadow-black/40"
                >
                  <i :class="notificationIcon(n.type)" class="text-base text-orange-500" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-1">
                    <span class="font-medium text-xs text-gray-100 truncate">{{ n.title }}</span>
                    <span
                      v-if="!n.isRead"
                      class="inline-block ml-1 w-1.5 h-1.5 rounded-full bg-orange-500 align-middle"
                    ></span>
                  </div>
                  <div class="text-[10px] text-gray-400 mt-0.5 truncate">
                    {{ n.message }}
                  </div>
                  <div class="text-[9px] text-gray-500 mt-0.5">
                    {{ formatDate(n.createdAt) }}
                  </div>
                </div>
              </li>
            </ul>
          </template>
          <template v-else-if="friendRequests.length === 0">
            <div class="py-20 text-center text-gray-500 text-sm">알림이 없습니다.</div>
          </template>
        </div>
      </aside>
    </transition>
  </header>
</template>

<script setup>
import { ref, defineProps, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api/api'

// 드래그 관련 상태
const dragStartX = ref(null)
const dragging = ref(false)

// 실제로는 pinia, useUser 등에서 user 정보 받아올 것.
const router = useRouter()
const props = defineProps({
  hasReferer: { type: Boolean, default: false },
  title: { type: String, default: '' },
  showBell: { type: Boolean, default: true },
  showDm: { type: Boolean, default: true },
  customClass: { type: String, default: '' },
  backIconClass: { type: String, default: 'fas fa-chevron-left' },
})

const showNotificationPanel = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
const friendRequests = ref([])
const clearingNotifications = ref(false)

// 총 미읽음 카운트 (일반 알림 + 친구 요청)
const totalUnreadCount = computed(() => {
  return unreadCount.value + friendRequests.value.filter(r => !r.status).length
})

const goBack = () => {
  const { origin } = window.location
  // referrer가 없거나, 우리 서비스가 아니면 메인으로
  if (!document.referrer || !document.referrer.startsWith(origin)) {
    router.replace('/') // replace로 기록 남기지 않음 (권장)
  } else {
    router.back()
  }
}

const fetchNotifications = async () => {
  const res = await api.get('/api/notifications')
  notifications.value = res.data
  console.log(res.data)
  unreadCount.value = notifications.value.filter((n) => !n.isRead).length
}

const fetchFriendRequests = async () => {
  try {
    const res = await api.get('/api/friends/my/received')
    friendRequests.value = res.data.map(request => ({
      ...request,
      processing: false,
      status: null // null, 'accepted', 'rejected'
    }))
  } catch (error) {
    console.error('Failed to fetch friend requests:', error)
    friendRequests.value = []
  }
}

const toggleNotificationPanel = async () => {
  showNotificationPanel.value = !showNotificationPanel.value
  if (showNotificationPanel.value && notifications.value.length === 0) {
    await fetchNotifications()
    await fetchFriendRequests()
  }
}

const acceptFriendRequest = async (requesterId) => {
  const request = friendRequests.value.find(r => r.id === requesterId)
  if (!request) return

  request.processing = true
  try {
    await api.post(`/api/friends/accept/${requesterId}`)
    request.status = 'accepted'

    // 2초 후 리스트에서 제거 (애니메이션 효과를 위해)
    setTimeout(() => {
      friendRequests.value = friendRequests.value.filter(r => r.id !== requesterId)
    }, 2000)
  } catch (error) {
    console.error('Failed to accept friend request:', error)
    alert('친구 요청 수락에 실패했습니다.')
  } finally {
    request.processing = false
  }
}

const rejectFriendRequest = async (requesterId) => {
  const request = friendRequests.value.find(r => r.id === requesterId)
  if (!request) return

  request.processing = true
  try {
    await api.post(`/api/friends/reject/${requesterId}`)
    request.status = 'rejected'

    // 1.5초 후 리스트에서 제거
    setTimeout(() => {
      friendRequests.value = friendRequests.value.filter(r => r.id !== requesterId)
    }, 1500)
  } catch (error) {
    console.error('Failed to reject friend request:', error)
    alert('친구 요청 거절에 실패했습니다.')
  } finally {
    request.processing = false
  }
}

const clearAllNotifications = async () => {
  if (clearingNotifications.value) return

  clearingNotifications.value = true
  try {
    // 서버에 삭제 요청
    await api.post('/api/notifications/clear')

    // 즉시 프론트에서 알림 목록 비우기
    notifications.value = []
    unreadCount.value = 0
  } catch (error) {
    console.error('Failed to clear notifications:', error)
    alert('알림 삭제에 실패했습니다.')
  } finally {
    clearingNotifications.value = false
  }
}

const openNotification = async (n) => {
  if (!n.isRead) {
    await api.post(`/api/notifications/${n.id}/read`)
    n.isRead = true
    unreadCount.value = notifications.value.filter((x) => !x.isRead).length
  }
  // url 존재 시 해당 링크로 이동
  if (n.url) {
    try {
      // 1. 완전한 URL이면, pathname + search + hash 만 추출
      const parsed = new URL(n.url, window.location.origin)
      const internalPath = parsed.pathname + parsed.search + parsed.hash
      router.push(internalPath)
    } catch (e) {
      // 2. 이미 상대경로면 그대로 push
      router.push(n.url)
    }
  }
}

const notificationIcon = (type) => {
  switch (type) {
    case 'GAME_START':
      return 'fas fa-play-circle text-orange-400'
    case 'GAME_END':
      return 'fas fa-flag-checkered text-gray-500'
    case 'GAME_COMMENT':
      return 'fas fa-comment-dots text-blue-400'
    case 'COMMENT_REPLY':
      return 'fas fa-comment-dots text-blue-400'
    case 'INBOX':
      return 'fas fa-inbox text-pink-400'
    case 'MY_GAME':
      return 'fas fa-calendar-alt text-green-500'
    default:
      return 'fas fa-bell text-orange-400'
  }
}

const formatDate = (dt) => {
  const d = new Date(dt)
  const now = new Date()
  const diff = (now - d) / 1000
  if (diff < 60) return '방금 전'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

// 알림 패널 드래그 핸들러
function onPanelDragStart(e) {
  dragging.value = true
  if (e.type === 'touchstart') {
    dragStartX.value = e.touches[0].clientX
  } else if (e.type === 'mousedown') {
    dragStartX.value = e.clientX
  }
}

function onPanelDragMove(e) {
  if (!dragging.value || dragStartX.value === null) return
  let currentX
  if (e.type === 'touchmove') {
    currentX = e.touches[0].clientX
  } else if (e.type === 'mousemove') {
    currentX = e.clientX
  }
  // 드래그 방향: 오른쪽으로 80px 이상 이동 시 닫기
  if (currentX - dragStartX.value > 80) {
    dragging.value = false
    dragStartX.value = null
    toggleNotificationPanel()
  }
}

function onPanelDragEnd() {
  dragging.value = false
  dragStartX.value = null
}

onMounted(() => {
  fetchNotifications()
  fetchFriendRequests()
})
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
.slide-enter-to,
.slide-leave-from {
  transform: translateX(0);
}
</style>
