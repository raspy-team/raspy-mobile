// 광장 자리 지키기 (UX ⑤, 11/5): 프로필·꾸미기·메시지처럼 잠깐 다녀오는 화면으로 가면 광장을 나가지 않는다.
// 화면은 닫혀도 신호(ping)만 보내 서버가 내보내지 않게 하고(서버 IDLE_MS 70초), 돌아오면 서버가 그 자리 그대로 다시 넣는다.
// 5분 안에 돌아오지 않으면 그때 나간다. 게임을 하러 가거나 다른 탭으로 가면 이 모듈을 쓰지 않고 바로 나간다
import { publish } from '@/websocket/userChannel'
import { POST } from '@/api/client'

const AWAY_MS = 5 * 60_000
const PING_MS = 25_000
let timer: ReturnType<typeof setInterval> | null = null

/** 잠깐 다녀오는 화면으로 가는 경로 */
export const STAY_ROUTES = [/^\/profile\//, /^\/plaza\/avatar/, /^\/chat\//, /^\/games\/\d+$/, /^\/neighborhood/]

export function keepSpot(instance: string) {
  cameBack()
  const until = Date.now() + AWAY_MS
  timer = setInterval(() => {
    if (Date.now() > until) {
      cameBack()
      POST('/api/plaza/leave').catch(() => {})
      return
    }
    publish(`/app/plaza/${instance}/ping`)
  }, PING_MS)
}

export function cameBack() {
  if (timer) clearInterval(timer)
  timer = null
}
