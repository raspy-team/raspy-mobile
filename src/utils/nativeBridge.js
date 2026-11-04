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
  if (isCapacitorApp) registerCapacitorPush()
  else if (window.AndroidApp?.registerFcmToken) window.AndroidApp.registerFcmToken(jwt)
  else window.webkit?.messageHandlers?.iosBridge?.postMessage({ action: 'registerFcmToken', jwt })
}

// Capacitor 앱의 푸시 (11/5): 권한을 묻고 FCM 토큰을 받아 서버(/api/push/register)에 등록한다.
// 받은 토큰은 기억해 두어 로그아웃 때 이 기기 것만 지운다 (SettingView). 서버는 그대로
const PUSH_TOKEN_KEY = 'raspy_push_token'
export function pushToken() {
  try {
    return localStorage.getItem(PUSH_TOKEN_KEY)
  } catch {
    return null
  }
}

/**
 * 앱이 켜지자마자 붙인다 (로그인과 상관없이). 알림을 눌러 앱이 켜지면 누른 신호가 먼저 와 있는데,
 * 늦게 붙이면 첫 화면에 머물렀다가 뒤늦게 넘어간다. 서버가 data.url에 넣은 화면으로 간다 (같은 사이트만)
 */
let listening = false
export async function setupPushListeners() {
  if (!isCapacitorApp || listening) return
  listening = true
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications')
    await PushNotifications.addListener('registration', async ({ value }) => {
      try {
        localStorage.setItem(PUSH_TOKEN_KEY, value)
      } catch {
        // 기억하지 못해도 등록은 한다
      }
      const { POST } = await import('../api/client')
      POST('/api/push/register', { body: { token: value } }).catch(() => {})
    })
    await PushNotifications.addListener('pushNotificationActionPerformed', ({ notification }) => {
      const url = notification?.data?.url
      if (!url) return
      try {
        const u = new URL(url, window.location.origin)
        if (u.host === window.location.host || u.hostname === 'matchapp.me') window.location.assign(window.location.origin + u.pathname + u.search)
      } catch {
        // 주소가 아니면 그대로 둔다
      }
    })
    // 앱을 보고 있을 때 온 알림은 안드로이드가 띄우지 않는다. 화면 안에 짧게 보여 준다 (목록은 화면이 신호로 새로 불러온다)
    await PushNotifications.addListener('pushNotificationReceived', async (n) => {
      const { useToast } = await import('../composable/useToast')
      if (n?.title) useToast().showToast(n.title)
    })
  } catch {
    listening = false
  }
}

async function registerCapacitorPush() {
  try {
    await setupPushListeners()
    const { PushNotifications } = await import('@capacitor/push-notifications')
    let perm = await PushNotifications.checkPermissions()
    if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') perm = await PushNotifications.requestPermissions()
    if (perm.receive !== 'granted') return
    await PushNotifications.register()
  } catch {
    // 푸시를 못 켜도 앱은 그대로 쓴다 (앱 안 알림 목록은 남는다)
  }
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
