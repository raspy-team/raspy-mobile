// 로그인한 동안 내 채널(/topic/user/{내 id})을 하나 열어둔다.
// 서버가 "바뀜" 신호(type, gameId)를 보내면 구독한 화면이 필요한 것만 다시 불러온다. 몇 초마다 묻는 폴링을 대신한다.
import { Client } from '@stomp/stompjs'
import { WS_URL } from '@/config/server'
import api from '@/api/api'

let client = null
const listeners = new Set()

export async function openUserChannel() {
  if (client) return
  const token = localStorage.getItem('raspy_access_token2')
  if (!token) return
  let myId
  try {
    myId = (await api.get('/api/auth/current-user-id')).data
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
