// 유입 측정: 어느 채널로 와서 → 가입 → 첫 경기 → 다시 왔는지 (관리자 > 유입).
// 기기마다 무작위 id를 하나 만들어 두고, 하루 한 번 서버에 방문을 남긴다. 로그인 전에 남겼으면 로그인 뒤 한 번 더 (그 사람을 붙인다).
// 홍보 링크에는 ?utm_source=instagram&utm_campaign=1105 처럼 꼬리표를 단다
import { POST } from '../api/client'
import { isStandalone } from './install'

const ID_KEY = 'visitor_id'
const SENT_KEY = 'visit_sent' // '날짜|로그인했는지'

// 첫 화면 주소는 라우터가 바꾸기 전에 잡아 둔다
const landing = new URL(window.location.href)

function visitorId() {
  try {
    let id = localStorage.getItem(ID_KEY)
    if (!id) {
      id = crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`
      localStorage.setItem(ID_KEY, id)
    }
    return id
  } catch {
    return null // 저장소를 못 쓰는 브라우저(일부 비공개 모드)는 세지 않는다
  }
}

export async function trackVisit() {
  const id = visitorId()
  if (!id) return
  const today = new Date().toLocaleDateString('sv') // YYYY-MM-DD (현지 날짜)
  const loggedIn = !!localStorage.getItem('raspy_access_token2')
  const mark = `${today}|${loggedIn ? 1 : 0}`
  const sent = localStorage.getItem(SENT_KEY)
  // 오늘 이미 남겼으면 끝. 단, 로그인 전에 남긴 뒤 로그인했으면 한 번 더
  if (sent === mark || (sent === `${today}|1` && !loggedIn)) return

  const q = landing.searchParams
  const referrer = document.referrer && new URL(document.referrer).origin !== window.location.origin ? document.referrer : undefined
  try {
    await POST('/api/track/visit', {
      body: {
        visitorId: id,
        source: q.get('utm_source') ?? undefined,
        medium: q.get('utm_medium') ?? undefined,
        campaign: q.get('utm_campaign') ?? undefined,
        referrer,
        landingPath: landing.pathname,
        standalone: isStandalone(),
      },
    })
    localStorage.setItem(SENT_KEY, mark)
  } catch {
    // 측정이 실패해도 앱 사용은 막지 않는다. 다음에 열 때 다시 보낸다
  }
}
