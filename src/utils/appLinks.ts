// matchapp.me 링크로 앱이 열렸을 때 그 주소로 간다 (11/14).
// 앱 껍데기(안드로이드 intent-filter, 아이폰 associated-domains)가 링크를 앱으로 넘기면 Capacitor가 appUrlOpen을 준다.
// 예전엔 카카오톡에서 친구 링크를 누르면 브라우저가 열려, 앱에 로그인돼 있어도 손님이 됐다.
// 껍데기가 바뀌는 일이라 새 앱 빌드부터 된다. 웹 쪽 짝은 public/.well-known/ (애플·구글이 서명을 확인한다)
import type { Router } from 'vue-router'
import { isCapacitorApp } from './nativeBridge'

export async function installAppLinks(router: Router) {
  if (!isCapacitorApp) return
  try {
    const { App } = await import('@capacitor/app')
    App.addListener('appUrlOpen', ({ url }) => {
      try {
        const u = new URL(url)
        if (u.host !== 'matchapp.me' && u.host !== 'www.matchapp.me') return
        router.push(u.pathname + u.search + u.hash)
      } catch {
        // 모르는 주소는 그냥 둔다
      }
    })
  } catch {
    // 플러그인이 없는 옛 빌드
  }
}
