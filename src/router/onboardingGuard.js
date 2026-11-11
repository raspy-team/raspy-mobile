// 약관 동의나 첫 설정을 끝내지 않은 사람은 어느 화면으로 들어오든 /welcome으로 보낸다
// (중간에 앱을 닫았거나, 앱의 소셜 로그인으로 설정을 건너뛴 경우)
import api from '../api/api'
import { rememberReturnTo } from '../utils/authRedirect'
import { GUEST_GAMES } from '../utils/guestGames'

// /live/·/watch/·/vote/: 중계·관전·투표 링크는 로그인 전에도 (경로 5 리뷰 S1, 경로 2 리뷰 N3)
const OPEN = ['/init', '/group/login', '/password-reset', '/oauth/callback', '/welcome', '/dev', '/club/join', '/s/', '/try/', '/live/', '/watch/', '/vote/']
// 확인한 표시는 그 로그인(토큰)에만 붙인다. 로그아웃이 페이지를 새로 열지 않아, 같은 탭에서 첫 설정을 안 끝낸 아이디로 로그인하면
// /welcome을 건너뛰었고, 로그아웃한 사람도 열린 주소처럼 지나갔다 (경로 1 리뷰 N12)
let doneFor = null
const token = () => localStorage.getItem('raspy_access_token2')

export function markOnboarded() {
  doneFor = token()
}

/** 로그인 전(또는 토큰이 끝난) 사람이 갈 곳: 조사의 도착 게임은 가입 없이 한 판부터 (3단계 '로그인을 미룰까' C), 나머지는 시작 화면 */
function toStart(to) {
  const key = to.path.match(/^\/play\/([^/]+)$/)?.[1]
  if (key && GUEST_GAMES[key]) return { path: `/try/${key}`, query: to.query }
  // 없는 주소는 기억하지 않는다: 가입까지 하고 도착한 곳이 '없는 페이지'였다 (목적 판정 11/11 부분 1)
  if (!to.matched.some((r) => r.path.includes(':pathMatch'))) rememberReturnTo(to.fullPath)
  return '/init'
}

export function installOnboardingGuard(router) {
  router.beforeEach(async (to) => {
    if (OPEN.some((p) => to.path.startsWith(p))) return true
    if (doneFor && doneFor === token()) return true
    // 로그인 전이면 화면을 그리기 전에 시작 화면으로 (보던 주소는 기억)
    if (!localStorage.getItem('raspy_access_token2')) return toStart(to)
    try {
      // 첫 화면을 그리기 전에 묻는 것이라 짧게 기다린다. 답이 없으면 막지 않고 들여보낸다
      // 401이면 갈 곳은 여기서 정한다 (api.js가 따로 /init으로 보내지 않게)
      const { data } = await api.get('/api/auth/onboarding', { timeout: 6000, skipAuthRedirect: true })
      if (data.termsAgreed && data.onboarded) {
        doneFor = token()
        return true
      }
      if (!to.matched.some((r) => r.path.includes(':pathMatch'))) rememberReturnTo(to.fullPath)
      return '/welcome'
    } catch (e) {
      // 토큰이 끝났다: 로그인 전과 같이 (광고 링크로 온 사람이 예전 로그인 흔적 때문에 한 판 대신 시작 화면을 보지 않게, 9e)
      if (e.response?.status === 401) return toStart(to)
      return true // 서버를 못 부르면 막지 않는다
    }
  })
}
