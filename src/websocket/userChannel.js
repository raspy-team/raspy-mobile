// 로그인한 동안 내 채널(/topic/user/{내 id})을 하나 열어둔다.
// 서버가 "바뀜" 신호(type, gameId)를 보내면 구독한 화면이 필요한 것만 다시 불러온다. 몇 초마다 묻는 폴링을 대신한다.
import { Client } from '@stomp/stompjs'
import { WS_URL } from '@/config/server'
import { getMyId } from '@/utils/me'

let client = null
const listeners = new Set()
const lobbyListeners = new Set()
// 화면이 잠깐 듣는 공개 채널 (예: 경기 중계 /topic/game-live/{id}). 연결이 다시 붙으면 다시 구독한다
const topics = new Map() // destination → { cb, sub, headers }

export async function openUserChannel() {
  if (client) return
  const token = localStorage.getItem('raspy_access_token2')
  if (!token) return
  let myId
  try {
    myId = await getMyId()
  } catch {
    return
  }
  client = new Client({
    brokerURL: WS_URL,
    connectHeaders: { token },
    reconnectDelay: 5000,
    onConnect: () => {
      client.subscribe(`/topic/user/${myId}`, ({ body }) => {
        const event = JSON.parse(body)
        listeners.forEach((cb) => cb(event))
      })
      // 지금 기다리는 사람 목록이 바뀌었다 (모두에게 같은 신호). 목록을 보는 화면만 다시 불러온다
      client.subscribe('/topic/lobbies', () => lobbyListeners.forEach((cb) => cb()))
      topics.forEach((t, destination) => { t.sub = client.subscribe(destination, ({ body }) => t.cb(JSON.parse(body)), t.headers) })
      // 끊겨 있던 사이 놓친 신호가 있을 수 있으니 다시 붙으면 한 번 새로고침하게 알린다
      listeners.forEach((cb) => cb({ type: 'RECONNECTED' }))
    },
  })
  client.activate()
}

export function closeUserChannel() {
  client?.deactivate()
  client = null
}

/** 신호를 받을 함수를 등록한다. 돌려받은 함수를 부르면 해제된다 */
export function onUserEvent(cb) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

/**
 * 화면에서 쓰는 형태: 신호가 오거나, 앱으로 다시 돌아왔을 때(탭 전환·잠금 해제) refresh를 부른다.
 * 돌려받은 함수로 정리한다.
 */
export function refreshOnChange(refresh) {
  const off = onUserEvent(() => refresh())
  const onVisible = () => document.visibilityState === 'visible' && refresh()
  document.addEventListener('visibilitychange', onVisible)
  return () => {
    off()
    document.removeEventListener('visibilitychange', onVisible)
  }
}

/** 지금 기다리는 사람 목록이 바뀔 때. 돌려받은 함수로 해제한다 */
export function onLobbyChange(cb) {
  lobbyListeners.add(cb)
  return () => lobbyListeners.delete(cb)
}

/** 공개 채널 하나를 듣는다. headers는 구독 머리글(예: 중계를 익명으로 볼 때 { anon: 'true' }). 돌려받은 함수로 그만 듣는다 */
export function subscribeTopic(destination, cb, headers = {}) {
  const t = { cb, sub: null, headers }
  topics.set(destination, t)
  if (client?.connected) t.sub = client.subscribe(destination, ({ body }) => cb(JSON.parse(body)), headers)
  openUserChannel()
  return () => {
    t.sub?.unsubscribe()
    topics.delete(destination)
  }
}
