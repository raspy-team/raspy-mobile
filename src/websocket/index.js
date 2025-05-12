// src/websocket/index.js
import { Client } from '@stomp/stompjs'

const WS_URL = 'ws://localhost:8080/ws'
let stompClient = null

export const socket = {
  /**
   * roomId에 맞춰 STOMP 연결 및 구독을 시작합니다.
   */
  connect(roomId) {
    const token = localStorage.getItem('accessToken')
    stompClient = new Client({
      brokerURL: WS_URL,
      connectHeaders: { token },
      reconnectDelay: 5000,
      onConnect: () => {
        // 백엔드 @SendTo("/topic/ws/{roomId}")와 일치
        stompClient.subscribe(`/topic/ws/${roomId}`, ({ body }) => {
          const data = JSON.parse(body)
          socket._onMessage?.(data)
        })
      },
      onStompError: frame => {
        console.error('STOMP error:', frame.headers['message'], frame.body)
      }
    })
    stompClient.activate()
  },

  /**
   * /app/chat/{roomId} 경로로 메시지를 전송합니다.
   */
  sendMessage(roomId, content) {
    if (stompClient && stompClient.connected) {
      stompClient.publish({
        destination: `/app/chat/${roomId}`,
        body: JSON.stringify({ content })
      })
    }
  },

  /**
   * 수신 콜백을 등록합니다.
   */
  onMessage(cb) {
    socket._onMessage = cb
  },

  /**
   * 연결을 종료합니다.
   */
  disconnect() {
    stompClient?.deactivate()
  }
}
