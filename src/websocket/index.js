import { Client } from '@stomp/stompjs'

const hostname = window.location.hostname


// 환경별 WS URL 분기
const WS_URL = isLocalhostClient
  ? 'ws://localhost:8080/ws'        // 로컬 개발
  : 'wss://raspy-be.shop/ws'        // 프로덕션

  let stompClient = null
let currentRoomId = null

export const socket = {
   subscribe(roomId) {
      if (!stompClient || !stompClient.connected) return
      stompClient.subscribe(`/topic/ws/${roomId}`, ({ body }) => {
        const data = JSON.parse(body)
        socket._onMessage?.(data)
      })
    }
    ,
    connect(roomId, onConnected) {
      const token = localStorage.getItem('raspy_access_token2')
      currentRoomId = roomId
      console.log('Connecting to room:', currentRoomId)

      stompClient = new Client({
        brokerURL: WS_URL,
        connectHeaders: { "token": token },
        reconnectDelay: 5000,

        onConnect: () => {
          if (onConnected) onConnected()
        },

        onStompError: frame => {
          console.error('STOMP error:', frame.headers['message'], frame.body)
        }
      })

      stompClient.activate()
    },


  /**
   * 일반 채팅 메시지 전송
   * @param {string} roomId
   * @param {string} content
   */
  sendChat(roomId, content) {
    if (stompClient && stompClient.connected) {
      stompClient.publish({
        destination: `/app/chat/${roomId}`,
        body: JSON.stringify({ content })
      })
    }
  },

  /**
   * 점수/세트/종료 메시지 전송
   * @param {string} roomId
   * @param {object} payload
   */
  sendGameEvent(roomId, payload) {
    console.log("📤 payload", JSON.stringify(payload))

    if (stompClient && stompClient.connected) {
      stompClient.publish({
        destination: `/app/score/${roomId}`,
        body: JSON.stringify(payload)
      })
    }
  },

  /**
   * 수신 메시지 콜백 등록
   * @param {(msg: any) => void} cb
   */
  onMessage(cb) {
    socket._onMessage = cb
  },

  /**
   * WebSocket 연결 종료
   */
  disconnect() {
    stompClient?.deactivate()
    currentRoomId = null
  }
}
