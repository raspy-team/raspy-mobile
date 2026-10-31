// 서버에 닿는지. 응답이 없거나(끊김·시간 초과) 서버가 뜨는 중(502·503·504)이면 down.
// 앱 전체에서 띠 하나로 알린다 (화면마다 무한 로딩이 되지 않게)
import { ref } from 'vue'

export const serverDown = ref(false)

export function markServer(error) {
  if (!error) {
    serverDown.value = false
    return
  }
  const status = error.response?.status
  if (!error.response || status === 502 || status === 503 || status === 504) serverDown.value = true
}
