<template>
  <header class="fixed top-0 left-0 w-full z-[30] border border-gray-100 bg-[#fff] raspy-top">
    <div class="max-w-4xl mx-auto px-4 md:px-8 flex items-center justify-between">
      <!-- 좌측: 로고 또는 뒤로가기 -->
      <div class="flex items-center h-14">
        <router-link v-if="props.hasReferer != true" to="/" class="font-bold text-[#f97316]">
          <span class="RASPY mx-1">Match</span>
        </router-link>
        <button v-else @click="goBack" class="text-black text-lg">
          <i class="fas fa-chevron-left"></i>
        </button>
      </div>
      <!-- 중앙: 타이틀 (hasReferer일 때만 표시) -->
      <div
        v-if="props.hasReferer == true"
        class="absolute left-1/2 transform -translate-x-1/2 text-black text-sm py-[50px] font-light"
      >
        {{ props.title }}
      </div>
      <!-- 우측: 알림 + DM -->
      <div class="flex items-center space-x-4 mr-3">
        <!-- DM 버튼 -->
        <router-link
          to="/dm"
          class="w-9 h-9 flex items-center justify-center border-orange-500 rounded-full bg-white hover:bg-orange-50 transition ml-1"
          title="DM"
        >
          <i class="fas fa-paper-plane text-orange-500 text-xl"></i>
        </router-link>

        <!-- 알림 버튼  -->
        <button
          class="w-9 h-9 flex items-center justify-center relative border-orange-500 rounded-full bg-white hover:bg-orange-50 transition"
          @click="toggleNotificationPanel"
        >
          <i class="fas fa-bell text-orange-500 text-xl"></i>
          <span
            v-if="unreadCount > 0"
            class="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full"
          ></span>
        </button>
      </div>
    </div>
    <!-- 알림 패널 (오른쪽 슬라이드) -->
    <transition name="slide">
      <aside
  v-if="showNotificationPanel"
  class="fixed top-0 right-0 h-full w-[350px] max-w-[96vw] bg-white raspy-top border-l z-[100] shadow-lg flex flex-col"
  @touchstart="onPanelDragStart"
  @touchmove="onPanelDragMove"
  @touchend="onPanelDragEnd"
  @mousedown="onPanelDragStart"
  @mousemove="onPanelDragMove"
  @mouseup="onPanelDragEnd"
      >
        <div class="flex items-center justify-between px-6 h-16 border-b">
          <span class="text-base font-bold text-gray-800">알림</span>
          <button
            @click="toggleNotificationPanel"
            class="text-gray-400 hover:text-gray-800 text-xl"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="flex-1 overflow-y-auto">
          <template v-if="notifications.length > 0">
            <ul>
              <li
                v-for="n in notifications"
                :key="n.id"
                class="flex px-5 py-4 border-b group cursor-pointer hover:bg-orange-50/70 transition relative"
                @click="openNotification(n)"
              >
                <div
                  class="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-orange-50 mr-4"
                >
                  <i :class="notificationIcon(n.type)" class="text-xl" />
                </div>
                <div class="flex-1">
                  <div class="flex items-center gap-1">
                    <span class="font-medium text-sm text-black">{{ n.title }}</span>
                    <span
                      v-if="!n.isRead"
                      class="inline-block ml-1 w-2 h-2 rounded-full bg-orange-500 align-middle"
                    ></span>
                  </div>
                  <div class="text-xs text-gray-500 mt-1 truncate">
                    {{ n.message }}
                  </div>
                  <div class="text-[10px] text-gray-400 mt-1">
                    {{ formatDate(n.createdAt) }}
                  </div>
                </div>
              </li>
            </ul>
          </template>
          <template v-else>
            <div class="py-20 text-center text-gray-400 text-sm">알림이 없습니다.</div>
          </template>
        </div>
      </aside>
    </transition>
  </header>
</template>

<script setup>
import { ref, defineProps, onMounted } from 'vue'
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
})

const showNotificationPanel = ref(false)
const notifications = ref([])
const unreadCount = ref(0)

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

const toggleNotificationPanel = async () => {
  showNotificationPanel.value = !showNotificationPanel.value
  if (showNotificationPanel.value && notifications.value.length === 0) {
    await fetchNotifications()
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
