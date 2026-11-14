// iOS·안드로이드 앱(웹뷰) 쪽으로 보내는 신호
import { Capacitor, registerPlugin } from '@capacitor/core'
import { API_BASE_URL } from '../config/server'

const ua = navigator.userAgent.toLowerCase()
export const isIosApp = ua.includes('raspy-ios')
export const isAndroidApp = ua.includes('raspy-android')

// 인스타·페이스북·카톡·네이버·라인·에타 같은 앱 안 브라우저인지. 구글은 앱 안 웹 화면 로그인을 막는다(403 disallowed_useragent) (경로 1 리뷰 N4)
export const inAppBrowser = /instagram|fban|fbav|kakaotalk|naver\(inapp|line\/|everytime|daumapps|whale.*inapp/.test(ua) && !ua.includes('raspy-')
export const isAndroidUa = ua.includes('android')

/** 앱 안 브라우저에서 같은 주소를 기기 브라우저로 연다. 안드로이드는 크롬으로 바로, 카톡은 카톡의 '외부 브라우저' 길로. 아이폰 인스타는 열 수 없어 false */
export function openInExternalBrowser(url = window.location.href) {
  if (ua.includes('kakaotalk')) {
    window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(url)}`
    return true
  }
  if (isAndroidUa) {
    const u = new URL(url)
    window.location.href = `intent://${u.host}${u.pathname}${u.search}#Intent;scheme=https;package=com.android.chrome;end`
    return true
  }
  return false
}

// Capacitor 앱(11/4~)인지. 옛 앱은 window.AndroidApp·iosBridge로 따로 연결했다
export const isCapacitorApp = Capacitor.isNativePlatform()

// 카카오톡 로그인 플러그인(native/kakao-login)이 든 앱 빌드인지 (안드로이드 versionCode 5·아이폰 빌드 2부터).
// 아이폰 구글 로그인도 같은 빌드부터 된다: 그 전 빌드엔 구글이 돌아올 주소(Info.plist)가 없어 누르면 앱이 꺼진다
export const hasNativeKakao = isCapacitorApp && Capacitor.isPluginAvailable('MatchKakao')

// 인스타 스토리 편집기로 바로 보내는 플러그인(native/instagram-stories)이 든 앱 빌드인지 (안드로이드 versionCode 6·아이폰 빌드 3부터).
// 스포티파이처럼 배경색 + 움직이는 결과 카드 스티커를 넘긴다 (components/feed/story/ShareSheet.vue)
export const hasNativeInstagram = isCapacitorApp && Capacitor.isPluginAvailable('MatchInstagram')
export const MatchInstagram = registerPlugin('MatchInstagram')

// 로그인 뒤 푸시 알림 토큰을 서버에 등록하도록 앱에 알린다
// ask=false(앱을 켤 때)면 이미 허락한 기기만 다시 등록하고 묻지 않는다. 묻는 것은 알림이 쓸모 있는 순간에 askPushPermission으로 (목적 판정 11/11 부분 1:
// 앱을 열고 5초 만에 이유 없는 OS 창이 앞을 막았고, 한 번 거절하면 다시 물을 수 없다)
export function registerFcmToken(jwt, ask = false) {
  if (isCapacitorApp) registerCapacitorPush(ask)
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
        if (u.host === window.location.host || u.hostname === 'matchapp.me') openInApp(u.pathname + u.search)
      } catch {
        // 주소가 아니면 그대로 둔다
      }
    })
    // 앱을 보고 있을 때 온 알림은 안드로이드가 띄우지 않는다. 화면 안에 짧게 보여 준다 (목록은 화면이 신호로 새로 불러온다)
    // 제목만 띄우면 무슨 일인지·어디로 가는지 없었다: 본문까지 보이고, 누르면 그 화면으로 (경로 전부 훑기 1절)
    await PushNotifications.addListener('pushNotificationReceived', async (n) => {
      const { useToast } = await import('../composables/useToast')
      if (!n?.title) return
      let goTo = ''
      try {
        const u = new URL(n.data?.url || '', window.location.origin)
        if (n.data?.url && (u.host === window.location.host || u.hostname === 'matchapp.me')) goTo = u.pathname + u.search
      } catch {
        // 주소가 아니면 누를 곳 없이
      }
      useToast().showToast(n.body ? `${n.title} · ${n.body}` : n.title, goTo)
    })
  } catch {
    listening = false
  }
}

/**
 * 알림을 눌러 연 화면으로 (11/6 b2). 앱이 꺼진 채 알림으로 켜지면 라우터가 첫 화면을 다 열기 전에 신호가 온다:
 * 라우터가 준비될 때까지 기다렸다가(router.isReady가 한 칸 버퍼) 앱 안에서 옮긴다. 예전엔 페이지를 통째로 다시 열었다.
 * 늦게 붙은 리스너도 신호를 받는 근거: 안드로이드 PushNotificationsPlugin.handleOnNewIntent와 iOS PushNotificationsHandler가
 * notifyListeners(..., retainUntilConsumed = true)로 보내 Capacitor Plugin이 리스너가 붙을 때까지 쥐고 있다.
 * 꺼진 상태에서 켜질 때도 BridgeActivity.onCreate가 onNewIntent(getIntent())를 불러 같은 길로 온다 (@capacitor/android 8)
 */
async function openInApp(path) {
  try {
    const { default: router } = await import('../router/router.js')
    await router.isReady()
    await router.push(path)
  } catch {
    window.location.assign(window.location.origin + path)
  }
}

/**
 * 알림이 쓸모 있는 순간(상대를 기다릴 때, 한 판 붙자를 보낸 직후)에 부른다. 웹이면 아무 일도 없다.
 * 시스템 창을 바로 띄우지 않고 앱 안에서 이유를 먼저 묻는다 (11/13 실제 기기 한 바퀴: "왜 알림을 달라는 거지?").
 * '나중에'면 사흘 동안 다시 묻지 않는다
 */
const PUSH_LATER_KEY = 'push_ask_later_until'
// direct: 설정의 '휴대폰 알림 켜기'처럼 사람이 직접 켜려고 누른 때. 앱 안 물음과 '나중에' 사흘을 건너뛰고 바로 시스템 창을 띄운다
// (11/14: 사흘 안에는 아무 일도 안 하면서 화면은 "켰어요"라고 했다)
export async function askPushPermission(reason = '상대가 답하거나 결과가 나오면 바로 알려 드려요', direct = false) {
  if (!isCapacitorApp) return
  if (direct) return registerCapacitorPush(true)
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications')
    const perm = await PushNotifications.checkPermissions()
    if (perm.receive !== 'prompt' && perm.receive !== 'prompt-with-rationale') return registerCapacitorPush(false)
    if (Number(localStorage.getItem(PUSH_LATER_KEY) || 0) > Date.now()) return
    const { confirmDialog } = await import('../composables/useConfirm')
    const yes = await confirmDialog({ title: '알림을 받을까요?', message: reason, confirmText: '알림 받기', cancelText: '나중에' })
    if (!yes) {
      try { localStorage.setItem(PUSH_LATER_KEY, String(Date.now() + 3 * 24 * 3600 * 1000)) } catch { /* 다음에 또 물을 뿐 */ }
      return
    }
  } catch { /* 플러그인을 못 불러도 아래에서 그대로 */ }
  registerCapacitorPush(true)
}

async function registerCapacitorPush(ask) {
  try {
    await setupPushListeners()
    const { PushNotifications } = await import('@capacitor/push-notifications')
    let perm = await PushNotifications.checkPermissions()
    if (ask && (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale')) perm = await PushNotifications.requestPermissions()
    if (perm.receive !== 'granted') return
    await PushNotifications.register()
  } catch {
    // 푸시를 못 켜도 앱은 그대로 쓴다 (앱 안 알림 목록은 남는다)
  }
}

// 구글은 앱 안 웹 화면 로그인을 막는다. 앱이 직접 구글 계정을 고르게 하고, 받은 토큰을 서버에 넘긴다.
// 서버가 웹 로그인과 같은 곳(/oauth/callback)으로 돌려보낸다. 토큰의 aud는 웹 클라이언트 ID다
const GOOGLE_WEB_CLIENT_ID = '241935491220-e9jmpcr15l5dird6rqt6d7nviris7l4q.apps.googleusercontent.com'
// 아이폰 앱용 OAuth 클라이언트 (11/5). 앱 Info.plist에 거꾸로 쓴 주소(com.googleusercontent.apps....)가 있어야 돌아온다.
// iOSServerClientId를 웹 클라이언트로 주어 토큰의 aud가 안드로이드와 같은 웹 클라이언트가 되게 한다
const GOOGLE_IOS_CLIENT_ID = '241935491220-t233q7lgpq134n0a2cmue2af3avpfnk3.apps.googleusercontent.com'

export async function nativeGoogleLogin() {
  const { SocialLogin } = await import('@capgo/capacitor-social-login')
  await SocialLogin.initialize({
    google: {
      webClientId: GOOGLE_WEB_CLIENT_ID,
      iOSClientId: GOOGLE_IOS_CLIENT_ID,
      iOSServerClientId: GOOGLE_WEB_CLIENT_ID,
      skipAuthOnlyAuthorizationAfterSignIn: true,
    },
  })
  const { result } = await SocialLogin.login({ provider: 'google', options: {} })
  if (!result.idToken) throw new Error('no id token')
  window.location.href = `${API_BASE_URL}/login/oauth2/google/token?id_token=${encodeURIComponent(result.idToken)}`
}

// 아이폰 앱의 Apple 로그인 (11/5): 앱이 Apple 창을 띄워 받은 identity token을 서버에 넘긴다.
// 서버(AppleMobileAuthController /login/oauth2/apple/token)가 Apple 공개키로 확인하고(aud = 번들 ID) /oauth/callback으로 돌려보낸다
export async function nativeAppleLogin() {
  const { SocialLogin } = await import('@capgo/capacitor-social-login')
  await SocialLogin.initialize({ apple: {} })
  const { result } = await SocialLogin.login({ provider: 'apple', options: { scopes: ['email', 'name'] } })
  if (!result.idToken) throw new Error('no id token')
  window.location.href = `${API_BASE_URL}/login/oauth2/apple/token?id_token=${encodeURIComponent(result.idToken)}`
}

// 앱의 카카오 로그인 (11/5): 카카오톡 앱으로 로그인하고(없으면 카카오계정 창), 받은 액세스 토큰을 서버에 넘긴다.
// 서버(KakaoMobileAuthController /login/oauth2/kakao/token)가 우리 앱 ID로 받은 토큰인지 보고 /oauth/callback으로 돌려보낸다.
// 플러그인(native/kakao-login)이 없는 옛 앱 빌드나 키 없이 만든 빌드는 'unavailable'로 실패한다 → 부르는 쪽이 웹 로그인으로 간다
export async function nativeKakaoLogin() {
  const MatchKakao = registerPlugin('MatchKakao')
  const { accessToken } = await MatchKakao.login()
  if (!accessToken) throw new Error('no access token')
  window.location.href = `${API_BASE_URL}/login/oauth2/kakao/token?access_token=${encodeURIComponent(accessToken)}`
}
