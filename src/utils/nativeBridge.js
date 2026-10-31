// iOS·안드로이드 앱(웹뷰) 쪽으로 보내는 신호

const ua = navigator.userAgent.toLowerCase()
export const isIosApp = ua.includes('raspy-ios')
export const isAndroidApp = ua.includes('raspy-android')

// 로그인 뒤 푸시 알림 토큰을 서버에 등록하도록 앱에 알린다
export function registerFcmToken(jwt) {
  if (window.AndroidApp?.registerFcmToken) window.AndroidApp.registerFcmToken(jwt)
  else window.webkit?.messageHandlers?.iosBridge?.postMessage({ action: 'registerFcmToken', jwt })
}
