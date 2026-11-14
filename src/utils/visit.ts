// 유입 측정: 어느 채널로 와서 → 가입 → 첫 경기 → 다시 왔는지 (관리자 > 유입).
// 기기마다 무작위 id를 하나 만들어 두고, 하루 한 번 서버에 방문을 남긴다. 로그인 전에 남겼으면 로그인 뒤 한 번 더 (그 사람을 붙인다).
// 홍보 링크에는 ?utm_source=instagram&utm_campaign=1105 처럼 꼬리표를 단다
import { NOTICE } from './notice'
import { GET, POST } from '../api/client'
import api from '../api/api'
import { peekReturnTo, rememberReturnTo } from './authRedirect'
import { isStandalone } from './install'
import { useToast } from '../composables/useToast'

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
        // 크리에이터마다 utm_content로 나눈다(README 3-6 플랜 B). 따로 받는 칸이 없어 캠페인 뒤에 붙인다: 'suneung/creatorA'.
        // 예전엔 utm_content를 버려 크리에이터끼리 견줄 수 없었다 (11/14 숫자 끝까지 시험)
        campaign: [q.get('utm_campaign'), q.get('utm_content')].filter(Boolean).join('/') || undefined,
        referrer,
        landingPath: landing.pathname,
        standalone: isStandalone(),
        share: q.get('r') ?? undefined, // 공유 링크로 왔으면 그 번호 (utils/shareRef.ts)
      },
    })
    localStorage.setItem(SENT_KEY, mark)
  } catch {
    // 측정이 실패해도 앱 사용은 막지 않는다. 다음에 열 때 다시 보낸다
  }
}

// ── 가입 전 한 판·로그인 버튼 누름 (3단계 수요 조사 '로그인을 미룰까' C + B, 11/5) ──
// 개인정보 없이 위의 무작위 기기 번호만 쓴다. 측정이 실패해도 화면은 막지 않는다

/** 이 기기의 무작위 번호 (가입 전 한 판도 이 번호로 남는다). 저장소를 못 쓰면 null */
export function getVisitorId() {
  return visitorId()
}

/** 로그인 버튼 누름 등 행동 하나. place: init(시작 화면), guest(가입 전 한 판 끝 화면) */
export function trackEvent(event: 'tap_kakao' | 'tap_google' | 'tap_apple' | 'tap_id' | 'challenge', place: 'init' | 'guest' | 'partner' | 'nunchi' | 'improv') {
  const id = visitorId()
  if (!id) return
  POST('/api/track/event', { body: { visitorId: id, event, place } }).catch(() => {})
}

const GUEST_KEY = 'guest_played' // 가입 전에 한 판 했다 (로그인하면 기록으로 옮긴다)
const PARTNER_KEY = 'partner_registered' // 가입 전에 상대 구하기를 등록했다 (로그인하면 계정에 붙인다)

const PARTNER_INFO_KEY = 'partner_info' // 무엇을 등록했나: 다시 오면 '등록했어요'부터, 가입 뒤 온보딩·알림 문구에 쓴다

export type PartnerInfo = { sport: string; sportLabel: string; dongName: string; timeLabels: string[]; at: number }

export function markPartnerRegistered(info?: Omit<PartnerInfo, 'at'>) {
  try {
    localStorage.setItem(PARTNER_KEY, '1')
    if (info) localStorage.setItem(PARTNER_INFO_KEY, JSON.stringify({ ...info, at: Date.now() }))
  } catch {
    // 못 남기면 붙이지 못할 뿐이다
  }
}

/** 이 기기에서 등록한 상대 구하기 (2주가 지나면 잊는다) */
export function readPartnerInfo(): PartnerInfo | null {
  try {
    const v = JSON.parse(localStorage.getItem(PARTNER_INFO_KEY) || 'null') as PartnerInfo | null
    if (!v?.dongName || Date.now() - v.at > 14 * 24 * 3600_000) return null
    return v
  } catch {
    return null
  }
}

export function forgetPartnerInfo() {
  try {
    localStorage.removeItem(PARTNER_INFO_KEY)
  } catch {
    // 지우지 못하면 2주 뒤 저절로 잊는다
  }
}

export function markGuestPlayed() {
  try {
    localStorage.setItem(GUEST_KEY, '1')
  } catch {
    // 못 남기면 옮기지 못할 뿐이다
  }
}

/** 방금 부른 옮기기의 결과 (옮긴 수, 실패면 -1). 막 가입한 화면이 '기록에 남았어요'를 옮기기가 된 때만 말하게 (경로 2 리뷰 N12) */
let lastClaim: Promise<number> | null = null
/** 가입하며 친구의 도전장 대결에 붙은 판들 (그 친구와 승패가 났다, 11/13) */
export let claimedDuels: { gameId: number; key: string; opponent: string; result: string }[] = []
export function guestClaimResult(): Promise<number> {
  return lastClaim ?? Promise.resolve(localStorage.getItem(GUEST_KEY) ? -1 : 0)
}

/** 로그인한 뒤: 이 기기의 가입 전 판을 내 기록으로 옮긴다. 옮긴 수를 돌려준다 (할 게 없으면 0, 실패면 -1) */
export function claimGuestPlays(): Promise<number> {
  lastClaim = claimNow()
  return lastClaim
}
async function claimNow(): Promise<number> {
  const id = visitorId()
  if (!id || !localStorage.getItem('raspy_access_token2')) return 0
  // 상대 구하기 등록(H2)도 함께 붙인다
  if (localStorage.getItem(PARTNER_KEY)) {
    POST('/api/partner-requests/claim', { body: { visitorId: id } })
      .then(() => {
        localStorage.removeItem(PARTNER_KEY)
        // 가입하면 등록이 사라진 것처럼 보였다: 붙였다고 한 번 알린다
        const info = readPartnerInfo()
        useToast().showToast(info ? `${info.dongName} ${info.sportLabel} 상대 구하기를 내 계정에 붙였어요. 상대가 생기면 ${NOTICE}` : `상대 구하기를 내 계정에 붙였어요. 상대가 생기면 ${NOTICE}`)
      })
      .catch(() => {})
  }
  if (!localStorage.getItem(GUEST_KEY)) return 0
  try {
    // 첫 설정(닉네임)을 마친 뒤에 옮긴다: 친구의 도전장 판은 옮기는 순간 그 친구에게 결과 알림이 가는데,
    // 그 전엔 이름이 자동 닉네임이라 친구가 '화려한 하마님과의 경기'를 받았다 (11/13). 첫 설정 화면이 끝나면 다시 부른다
    const ob = (await GET('/api/auth/onboarding')).data
    if (!(ob.termsAgreed && ob.onboarded)) return 0
    const { data } = await POST('/api/guest/plays/claim', { body: { visitorId: id } })
    localStorage.removeItem(GUEST_KEY)
    claimedDuels = data.duels ?? []
    return data.claimed
  } catch {
    return -1 // 다음에 열 때 다시
  }
}

// ── 다른 브라우저로 넘어가기 (11/14) ──
// 인스타·에타 앱 안 브라우저에서 한 판 하고 '브라우저로 열기'로 사파리·크롬에 가서 가입하면 저장소가 달라
// 방금 등급도 친구의 초대도 사라졌다. 15분짜리 표(?h=)에 이 기기의 번호를 실어 넘기고, 새 브라우저가 그 번호를 이어 쓴다.
// 그러면 가입할 때 방금 판이 내 기록으로 옮겨진다 (서버 ShareKey.handoff)

/** 넘길 표를 받는다 (가입 전에 한 판 한 기기만). 못 받으면 빈 글 */
export async function handoffCode(): Promise<string> {
  try {
    if (!localStorage.getItem(GUEST_KEY)) return ''
    const id = visitorId()
    if (!id) return ''
    return (await api.post('/api/guest/plays/handoff', { visitorId: id })).data?.code ?? ''
  } catch {
    return ''
  }
}

/** 주소에 표(?h=)가 있으면 그 기기 번호를 이어 쓴다. 앱이 뜰 때 방문 기록보다 먼저 부른다 */
export async function adoptHandoff(): Promise<void> {
  try {
    const url = new URL(window.location.href)
    const code = url.searchParams.get('h')
    if (!code || !/^[0-9a-zA-Z-]{8,64}\.\d+\.[\w-]+$/.test(code)) return
    url.searchParams.delete('h')
    history.replaceState(history.state, '', url.pathname + url.search + url.hash)
    // 이 브라우저에서 이미 한 판 했으면 그대로 둔다 (남의 표로 내 판을 잃지 않게)
    if (localStorage.getItem(GUEST_KEY) || localStorage.getItem('raspy_access_token2')) return
    const id = (await api.post('/api/guest/plays/handoff/take', { code })).data?.visitorId
    if (!id) return
    localStorage.setItem(ID_KEY, id)
    localStorage.setItem(GUEST_KEY, '1')
    // 가입하면 방금 판이 있는 게임 화면으로 (이 브라우저에는 가던 곳이 적혀 있지 않다)
    if (!peekReturnTo()) rememberReturnTo('/play/improv')
  } catch {
    // 못 넘겨받으면 새 방문자로 시작할 뿐이다
  }
}
