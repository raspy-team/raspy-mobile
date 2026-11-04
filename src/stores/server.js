// 서버에 닿는지. 응답이 없거나(끊김·시간 초과) 서버가 뜨는 중(502·503·504)이면 down.
// 앱 전체에서 띠 하나로 알린다 (화면마다 무한 로딩이 되지 않게)
import { ref } from 'vue'

export const serverDown = ref(false)

// 휴대폰이 인터넷에 안 붙어 있나. 끊겼는데 '서버에 연결하지 못했어요'로 보이면 서버 탓으로 읽힌다 (11/6 b2 앱 껍데기 점검)
export const offline = ref(typeof navigator !== 'undefined' && navigator.onLine === false)
if (typeof window !== 'undefined') {
  window.addEventListener('offline', () => {
    offline.value = true
  })
  // 다시 붙으면 띠를 거두고, 보던 화면이 다시 불러오게 (refreshOnChange가 visibilitychange처럼 받는 신호는 없어 띠만 거둔다)
  window.addEventListener('online', () => {
    offline.value = false
    serverDown.value = false
  })
}

export function markServer(error) {
  if (!error) {
    serverDown.value = false
    return
  }
  const status = error.response?.status
  if (typeof navigator !== 'undefined' && navigator.onLine === false) offline.value = true
  if (!error.response || status === 502 || status === 503 || status === 504) serverDown.value = true
}
