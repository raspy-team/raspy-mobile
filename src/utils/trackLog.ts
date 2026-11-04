// 수요 조사 원본 기록 (11/5, "잴 수 있는 건 다 모은다"). 문제마다 답·시간, 그만둔 곳, 버튼 하나하나, 상대 구하기 단계마다.
// 사람 정보는 보내지 않는다: 무작위 기기 번호와 이름·번호·짧은 값·경로뿐. 채널·꼬리표는 서버가 같은 기기의 방문과 잇는다.
// 모아 두었다가 2초마다, 화면을 떠날 때는 sendBeacon으로 보낸다 (그만둔 순간도 남게)
import { API_BASE_URL } from '@/config/server'
import { getVisitorId } from './visit'

type Item = { name: string; gameKey?: string; step?: number; value?: string; path?: string }

const queue: Item[] = []
let timer: ReturnType<typeof setTimeout> | null = null
const URL_LOG = `${API_BASE_URL}/api/track/log`

export function track(name: string, extra: Omit<Item, 'name' | 'path'> = {}) {
  queue.push({ name, ...extra, path: window.location.pathname })
  if (queue.length >= 30) flush()
  else if (!timer) timer = setTimeout(flush, 2000)
}

/** 지금 쌓인 것을 보낸다. beacon: 화면을 떠나는 중 (fetch가 끊길 수 있다) */
export function flush(beacon = false) {
  if (timer) clearTimeout(timer)
  timer = null
  const id = getVisitorId()
  if (!id || !queue.length) return
  const items = queue.splice(0, 40)
  // 다른 주소로 JSON을 보내면 브라우저가 먼저 묻는데(CORS), sendBeacon은 그걸 못 한다. 그래서 글(text/plain)로 보낸다
  const body = JSON.stringify({ visitorId: id, items })
  try {
    if (beacon && navigator.sendBeacon?.(URL_LOG, new Blob([body], { type: 'text/plain' }))) return
    fetch(URL_LOG, { method: 'POST', body, headers: { 'Content-Type': 'text/plain' }, keepalive: true }).catch(() => {})
  } catch {
    // 측정이 실패해도 화면은 막지 않는다
  }
  if (queue.length) flush(beacon)
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => flush(true))
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush(true)
  })
}
