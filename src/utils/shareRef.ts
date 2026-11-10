// 공유 번호 (3단계 수요 조사 '공유를 잴 수 있게', 11/10).
// 우리 주소를 보낼 때 ?r=번호를 달고, 같은 번호를 서버에 등록한다. 받은 사람이 그 링크로 들어오면 방문에 번호가 남아
// 보낸 사람의 처음 채널로 센다 (raspy-api AcquisitionService). 기기 번호는 손님 판의 열쇠라 링크에 싣지 않는다.
// 번호는 여기서 바로 만든다: 서버를 기다리면 누른 뒤 공유 창을 여는 시간이 늦어져 사파리가 막는다
import { POST } from '../api/client'
import { getVisitorId } from './visit'

const OUR_HOSTS = ['matchapp.me', 'www.matchapp.me']

export function newShareCode(): string {
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => (b % 36).toString(36)).join('') + Date.now().toString(36).slice(-2)
}

/** 번호를 서버에 남긴다. 기다리지 않는다 (측정이 실패해도 공유는 막지 않는다) */
export function registerShare(code: string, path: string) {
  const visitorId = getVisitorId()
  if (!visitorId) return
  POST('/api/track/share', { body: { visitorId, code, path: path.slice(0, 200) } }).catch(() => {})
}

/** 우리 주소면 ?r=번호를 달아 돌려준다. code를 주면 그 번호를(한 시트에서 여러 곳으로 보낼 때), 없으면 새로 만든다 */
export function withShareRef(url: string, code?: string): string {
  if (!url) return url
  let u: URL
  try {
    u = new URL(url, window.location.origin)
  } catch {
    return url
  }
  if (u.origin !== window.location.origin && !OUR_HOSTS.includes(u.hostname)) return url
  if (u.searchParams.has('r')) return url
  const c = code ?? newShareCode()
  u.searchParams.set('r', c)
  if (!code) registerShare(c, u.pathname)
  return u.toString()
}
