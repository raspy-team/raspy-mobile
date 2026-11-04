import type { CapacitorConfig } from '@capacitor/cli'

// 앱은 운영 웹(matchapp.me)을 그대로 띄운다. 화면을 고치면 스토어 심사 없이 바로 바뀌고,
// 로그인·공유 링크·서버 주소가 웹과 같아서 따로 맞출 게 없다 (11/4)
const config: CapacitorConfig = {
  appId: 'com.songostudio.match',
  appName: 'match',
  webDir: 'dist',
  backgroundColor: '#121214',
  server: {
    url: 'https://matchapp.me',
    // 이 주소 밖은 시스템 브라우저로 연다. 카카오 로그인은 앱 안에서 끝나야 해서 넣는다
    allowNavigation: ['raspy-api.fly.dev', 'kauth.kakao.com', 'accounts.kakao.com', 'logins.daum.net', 'appleid.apple.com'],
  },
  // 웹이 앱 안인지 알아보는 표시 (src/utils/nativeBridge.js)
  android: { appendUserAgent: 'raspy-android' },
  ios: { appendUserAgent: 'raspy-ios' },
  plugins: {
    // 앱 안 로그인은 구글만 쓴다(카카오·애플은 웹). 페이스북 SDK는 광고 ID(AD_ID) 권한과
    // 앱 이벤트 전송을 끌고 와서 Play 데이터 보안 '공유 안 함'과 어긋나므로 뺀다 (11/5)
    SocialLogin: { providers: { google: true, facebook: false, apple: true, twitter: false } },
  },
}

export default config
