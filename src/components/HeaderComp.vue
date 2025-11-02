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
            v-if="unreadCount > 0"
            class="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full"
          ></span>
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
          class="flex items-center justify-between px-6 h-16 border-b border-gray-700 bg-gray-900/80"
        >
          <span class="text-base font-semibold text-gray-100 tracking-tight">알림</span>
          <button
            @click="toggleNotificationPanel"
            class="text-gray-400 hover:text-gray-100 text-xl transition-colors"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="flex-1 overflow-y-auto overflow-x-hidden">
          <template v-if="notifications.length > 0">
            <ul>
              <li
                v-for="n in notifications"
                :key="n.id"
                class="flex px-5 py-4 border-b border-gray-700 group cursor-pointer hover:bg-gray-800/80 transition-colors duration-150 relative overflow-hidden"
                @click="openNotification(n)"
              >
                <div
                  class="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-gray-800 border border-gray-700 mr-4 shadow-inner shadow-black/40"
                >
                  <i :class="notificationIcon(n.type)" class="text-xl text-orange-500" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-1">
                    <span class="font-medium text-sm text-gray-100 truncate">{{ n.title }}</span>
                    <span
                      v-if="!n.isRead"
                      class="inline-block ml-1 w-2 h-2 rounded-full bg-orange-500 align-middle"
                    ></span>
                  </div>
                  <div class="text-xs text-gray-400 mt-1 truncate">
                    {{ n.message }}
                  </div>
                  <div class="text-[10px] text-gray-500 mt-1">
                    {{ formatDate(n.createdAt) }}
                  </div>
                </div>
              </li>
            </ul>
          </template>
          <template v-else>
            <div class="py-20 text-center text-gray-500 text-sm">알림이 없습니다.</div>
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
  showBell: { type: Boolean, default: true },
  showDm: { type: Boolean, default: true },
  customClass: { type: String, default: '' },
  backIconClass: { type: String, default: 'fas fa-chevron-left' },
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
