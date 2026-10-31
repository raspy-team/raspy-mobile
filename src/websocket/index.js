// websocket.js
import { Client } from '@stomp/stompjs'
import { WS_URL } from '@/config/server'

let stompClient = null
let subscription = null
let currentRoomId = null
let _onMessage = null
let _onConnecting = null
let _onConnected = null
let _onDisconnected = null

export const socket = {
  /**
   * 방 번호가 바뀔 때마다 연결. 같은 방일 때는 재연결X.
   */
  connect(roomId) {
    if (!roomId) {
      console.warn('[stomp] connect() called with empty roomId')
      return
    }
    if (currentRoomId === roomId && stompClient && stompClient.connected) {
      // 이미 같은 방에 연결돼있으면 무시
      if (_onConnected) _onConnected()
      return
    }
    // 방이 바뀌면 기존 소켓과 구독 완전 정리
    this.disconnect({ clearRoomId: false })
    currentRoomId = roomId
    const token = localStorage.getItem('raspy_access_token2')

    if (_onConnecting) _onConnecting()

    stompClient = new Client({
      brokerURL: WS_URL,
      connectHeaders: { token },
      reconnectDelay: 5000,
      // 프레임마다 찍던 디버그 로그(메시지 본문 포함)는 끈다
      debug: () => {},
      onConnect: () => {
        if (_onConnected) _onConnected()
        socket._subscribe(currentRoomId)
      },
      onStompError: frame => {
        console.error('STOMP error:', frame.headers['message'], frame.body)
        if (_onDisconnected) _onDisconnected()
      },
      onWebSocketClose: () => {
        if (_onDisconnected) _onDisconnected()
        if (currentRoomId) {
          // 네트워크 단절 등 재연결
          setTimeout(() => socket.connect(currentRoomId), 2000)
        }
      },
    })
    stompClient.activate()
  },

  /**
   * 구독 (항상 현재 roomId만)
   */
  _subscribe(roomId) {
    if (!stompClient || !stompClient.connected) {
      return
    }
    if (!roomId) {
      console.error('[stomp] subscribe ERROR: roomId is null/undefined!')
      return
    }
    if (subscription) {
      try {
        subscription.unsubscribe()
      } catch {
        // 이미 끊긴 구독이면 그냥 넘어간다
      }
      subscription = null
    }
    subscription = stompClient.subscribe(`/topic/ws/${roomId}`, ({ body }) => {
      if (_onMessage) _onMessage(JSON.parse(body))
    })
  },

  /**
   * 콜백 등록 (실제 메시지 받을 때)
   */
  onMessage(cb) {
    _onMessage = cb
  },

  onConnecting(cb) {
    _onConnecting = cb
  },
  onConnected(cb) {
    _onConnected = cb
  },
  onDisconnected(cb) {
    _onDisconnected = cb
  },

  /**
   * 연결 완전 해제. clearRoomId=true면 roomId까지 클리어.
   */
  disconnect({ clearRoomId = false } = {}) {
    if (subscription) {
      try {
        subscription.unsubscribe()
      } catch {
        // 이미 끊긴 구독이면 그냥 넘어간다
      }
      subscription = null
    }
    if (stompClient) {
      stompClient.deactivate()
      stompClient = null
    }
    if (clearRoomId) {
      currentRoomId = null
    }
    if (_onDisconnected) _onDisconnected()
  },

  sendChat(roomId, content) {
    if (stompClient && stompClient.connected) {
      stompClient.publish({
        destination: `/app/chat/${roomId}`,
        body: JSON.stringify({ content }),
      })
    }
  },
  sendGameEvent(roomId, payload) {
    if (stompClient && stompClient.connected) {
      stompClient.publish({
        destination: `/app/score/${roomId}`,
        body: JSON.stringify(payload),
      })
    }
  },
}
