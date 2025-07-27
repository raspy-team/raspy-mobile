// websocket.js
import { Client } from '@stomp/stompjs'

const isLocalhostClient = window.location.hostname === 'localhost' && window.location.port === '8081'
const WS_URL = isLocalhostClient
  ? 'ws://localhost:8080/ws'
  : 'wss://raspy-be.shop/ws'

let stompClient = null
let subscription = null
let currentRoomId = null
let _onMessage = null

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
      console.log('[stomp] already connected to', roomId)
      return
    }
    // 방이 바뀌면 기존 소켓과 구독 완전 정리
    this.disconnect({ clearRoomId: false })
    currentRoomId = roomId
    const token = localStorage.getItem('raspy_access_token2')

    stompClient = new Client({
      brokerURL: WS_URL,
      connectHeaders: { token },
      reconnectDelay: 5000,
      debug: str => console.log('[stomp-debug]', str),
      onConnect: () => {
        socket._subscribe(currentRoomId)
      },
      onStompError: frame => { console.error('STOMP error:', frame.headers['message'], frame.body) },
      onWebSocketClose: () => {
        if (currentRoomId) {
          // 네트워크 단절 등 재연결
          setTimeout(() => socket.connect(currentRoomId), 2000)
        }
      }
    })
    stompClient.activate()
  },

  /**
   * 구독 (항상 현재 roomId만)
   */
  _subscribe(roomId) {
    if (!stompClient || !stompClient.connected) {
      console.log('[stomp] subscribe SKIPPED (no client or not connected)')
      return
    }
    if (!roomId) {
      console.error('[stomp] subscribe ERROR: roomId is null/undefined!')
      return
    }
    if (subscription) {
      try {
        subscription.unsubscribe()
        console.log('[stomp] previous subscription cleaned')
      } catch (e) {console.log("failed to unsubcribe")}
      subscription = null
    }
    subscription = stompClient.subscribe(`/topic/ws/${roomId}`, ({ body }) => {
      console.log('[stomp] message RECEIVED', body)
      if (_onMessage) _onMessage(JSON.parse(body))
    })
    console.log('[stomp] subscribed', roomId, subscription)
  },

  /**
   * 콜백 등록 (실제 메시지 받을 때)
   */
  onMessage(cb) {
    _onMessage = cb
  },

  /**
   * 연결 완전 해제. clearRoomId=true면 roomId까지 클리어.
   */
  disconnect({ clearRoomId = false } = {}) {
    if (subscription) {
      try { subscription.unsubscribe() } catch (e) {console.log("failed to unsubcribe")}
      subscription = null
    }
    if (stompClient) {
      stompClient.deactivate()
      stompClient = null
    }
    if (clearRoomId) {
      currentRoomId = null
    }
    console.log('[stomp] disconnected')
  },

  sendChat(roomId, content) {
    if (stompClient && stompClient.connected) {
      stompClient.publish({
        destination: `/app/chat/${roomId}`,
        body: JSON.stringify({ content })
      })
    }
  },
  sendGameEvent(roomId, payload) {
    if (stompClient && stompClient.connected) {
      stompClient.publish({
        destination: `/app/score/${roomId}`,
        body: JSON.stringify(payload)
      })
    }
  }
}
