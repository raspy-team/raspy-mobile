// iOS·안드로이드 앱(웹뷰) 쪽으로 보내는 신호
import { Capacitor } from '@capacitor/core'
import { API_BASE_URL } from '../config/server'

const ua = navigator.userAgent.toLowerCase()
export const isIosApp = ua.includes('raspy-ios')
export const isAndroidApp = ua.includes('raspy-android')

// Capacitor 앱(11/4~)인지. 옛 앱은 window.AndroidApp·iosBridge로 따로 연결했다
export const isCapacitorApp = Capacitor.isNativePlatform()

// 로그인 뒤 푸시 알림 토큰을 서버에 등록하도록 앱에 알린다
export function registerFcmToken(jwt) {
  if (window.AndroidApp?.registerFcmToken) window.AndroidApp.registerFcmToken(jwt)
  else window.webkit?.messageHandlers?.iosBridge?.postMessage({ action: 'registerFcmToken', jwt })
}

// 구글은 앱 안 웹 화면 로그인을 막는다. 앱이 직접 구글 계정을 고르게 하고, 받은 토큰을 서버에 넘긴다.
// 서버가 웹 로그인과 같은 곳(/oauth/callback)으로 돌려보낸다. 토큰의 aud는 웹 클라이언트 ID다
const GOOGLE_WEB_CLIENT_ID = '241935491220-e9jmpcr15l5dird6rqt6d7nviris7l4q.apps.googleusercontent.com'

export async function nativeGoogleLogin() {
  const { SocialLogin } = await import('@capgo/capacitor-social-login')
  await SocialLogin.initialize({ google: { webClientId: GOOGLE_WEB_CLIENT_ID, skipAuthOnlyAuthorizationAfterSignIn: true } })
  const { result } = await SocialLogin.login({ provider: 'google', options: {} })
  if (!result.idToken) throw new Error('no id token')
  window.location.href = `${API_BASE_URL}/login/oauth2/google/token?id_token=${encodeURIComponent(result.idToken)}`
}
