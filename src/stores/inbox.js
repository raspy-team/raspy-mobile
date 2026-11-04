// 알림·친구 요청·안 읽은 메시지를 앱 전체에서 하나로 들고 있는다
// (예전에는 화면마다 헤더가 따로 불러와서 배지 숫자가 화면마다 달랐다)
// 서버의 "바뀜" 신호나 앱으로 돌아올 때 다시 불러온다
import { reactive, computed } from 'vue'
import api from '../api/api'
import { refreshOnChange } from '../websocket/userChannel'

const state = reactive({
  notifications: [],
  friendRequests: [],
  dmUnread: 0,
  loaded: false,
})

let inflight = null
// 계정이 바뀌면(로그아웃·탈퇴) 늘어난다: 앞 계정으로 보낸 요청이 늦게 돌아와도 담지 않는다
let generation = 0
export function refreshInbox() {
  if (!localStorage.getItem('raspy_access_token2')) return Promise.resolve()
  if (inflight) return inflight
  const mine = generation
  inflight = Promise.allSettled([
    api.get('/api/notifications'),
    api.get('/api/friends/my/received'),
    api.get('/api/chat-room/unread-count'),
  ]).then(([n, f, d]) => {
    if (mine !== generation) return
    if (n.status === 'fulfilled') state.notifications = n.value.data
    if (f.status === 'fulfilled') state.friendRequests = f.value.data
    if (d.status === 'fulfilled') state.dmUnread = d.value.data.count || 0
    state.loaded = true
  }).finally(() => (inflight = null))
  return inflight
}

let stop = null
/** 로그인한 동안 한 번만 부른다 (App.vue) */
export function startInbox() {
  if (stop) return
  refreshInbox()
  stop = refreshOnChange(refreshInbox)
}
export function stopInbox() {
  stop?.()
  stop = null
  // 앞 계정의 알림·친구 요청·배지를 비운다. 같은 기기에서 다른 계정으로 들어오면 앞사람 것이 보였다 (SPA라 화면을 새로 띄우지 않는다)
  generation++
  inflight = null
  state.notifications = []
  state.friendRequests = []
  state.dmUnread = 0
  state.loaded = false
}

export async function markNotificationRead(n) {
  if (n.isRead) return
  n.isRead = true
  await api.post(`/api/notifications/${n.id}/read`).catch(() => (n.isRead = false))
}
export async function markAllNotificationsRead() {
  const before = state.notifications.map((n) => n.isRead)
  state.notifications.forEach((n) => (n.isRead = true))
  try {
    await api.post('/api/notifications/read-all')
  } catch {
    state.notifications.forEach((n, i) => (n.isRead = before[i]))
    throw new Error('read-all failed')
  }
}

export function useInbox() {
  const unreadNotifications = computed(() => state.notifications.filter((n) => !n.isRead).length + state.friendRequests.length)
  return { inbox: state, unreadNotifications, dmUnread: computed(() => state.dmUnread) }
}
