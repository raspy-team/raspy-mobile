import { ref, onMounted, onBeforeUnmount } from 'vue'
import api from '../api/api'
import { socket } from '../websocket/index'

/**
 * Vue용 WebSocket 채팅 훅 (backend GameWsController과 호환)
 */
export function useChat(gameId) {
  const messages = ref([])
  const isConnected = ref(false)
  const roomId = ref(null)

  // JWT 토큰 로컬스토리지에서 읽기
  const token = localStorage.getItem('raspy_access_token')

  // 1) roomId 조회
  const initRoom = async () => {
    const res = await api.get(`/api/chat-room/by-game/${gameId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    roomId.value = res.data.roomId
  }

  // 2) 과거 채팅 로드
  const loadHistory = async () => {
    const res = await api.get(`/api/chat-room/${roomId.value}/chat-messages`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    messages.value = res.data.map(m => ({
      ...m,
      system: m.type !== 'TALK'
    }))
  }

  // 3) 실시간 메시지 핸들러 등록 및 연결
  onMounted(async () => {
    await initRoom()
    socket.onMessage(data => {
      messages.value.push({ ...data, system: data.type !== 'TALK' })
    })
    socket.connect(roomId.value)
    isConnected.value = true

    setTimeout(async () => { await loadHistory() }, 200)
  })

  // 4) 언마운트 시 연결 해제
  onBeforeUnmount(() => {
    socket.disconnect()
  })

  // 메시지 전송 함수
  const sendMessage = content => {
    socket.sendMessage(roomId.value, content)
  }

  return { messages, isConnected, sendMessage }
}
