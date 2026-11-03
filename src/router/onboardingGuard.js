// 약관 동의나 첫 설정을 끝내지 않은 사람은 어느 화면으로 들어오든 /welcome으로 보낸다
// (중간에 앱을 닫았거나, 앱의 소셜 로그인으로 설정을 건너뛴 경우)
import api from '../api/api'
import { rememberReturnTo } from '../utils/authRedirect'

const OPEN = ['/init', '/group/login', '/oauth/callback', '/welcome', '/invite', '/invite-fall-back', '/dev', '/club/join', '/s/']
let done = false

export function markOnboarded() {
  done = true
}

export function installOnboardingGuard(router) {
  router.beforeEach(async (to) => {
    if (done || OPEN.some((p) => to.path.startsWith(p))) return true
    // 로그인 전이면 화면을 그리기 전에 시작 화면으로 (보던 주소는 기억)
    if (!localStorage.getItem('raspy_access_token2')) {
      rememberReturnTo(to.fullPath)
      return '/init'
    }
    try {
      // 첫 화면을 그리기 전에 묻는 것이라 짧게 기다린다. 답이 없으면 막지 않고 들여보낸다
      const { data } = await api.get('/api/auth/onboarding', { timeout: 6000 })
      if (data.termsAgreed && data.onboarded) {
        done = true
        return true
      }
      rememberReturnTo(to.fullPath)
      return '/welcome'
    } catch (e) {
      if (e.response?.status === 401) {
        rememberReturnTo(to.fullPath)
        return '/init'
      }
      return true // 서버를 못 부르면 막지 않는다
    }
  })
}
