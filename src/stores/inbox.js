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
  // 셋 다 실패했다: '새 알림이 없어요'로 보이면 푸시를 보고 들어온 사람이 '없다'고 믿는다 (목적 판정 6)
  failed: false,
  // 알림함을 마지막으로 연 때. 종의 점은 그 뒤에 온 안 읽은 알림만 센다 (11/11 쌓이는 피로 전수표: 끝난 알림·주변 소식이
  // 하나라도 남으면 점이 꺼질 날이 없었다). 목록 안의 '안 읽음' 표시는 그대로
  seenAt: (() => { try { return localStorage.getItem('inbox_seen_at') || '' } catch { return '' } })(),
})

/** 알림함을 열었다: 종의 점을 끈다 */
export function markInboxSeen() {
  const now = new Date().toISOString()
  state.seenAt = now
  try { localStorage.setItem('inbox_seen_at', now) } catch { /* 못 남기면 다음에 점이 다시 보일 뿐 */ }
}

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
    state.failed = [n, f, d].every((r) => r.status === 'rejected')
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
  state.failed = false
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
  const seen = () => (state.seenAt ? new Date(state.seenAt).getTime() : 0)
  const unreadNotifications = computed(() => state.notifications.filter((n) => !n.isRead && new Date(n.createdAt).getTime() > seen()).length + state.friendRequests.length)
  return { inbox: state, unreadNotifications, dmUnread: computed(() => state.dmUnread) }
}
