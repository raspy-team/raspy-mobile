// 안드로이드 뒤로 버튼 (11/13 실제 기기 한 바퀴: 어느 화면에서 누르든, 시트가 열려 있어도 앱이 통째로 닫혔다).
// 시트·창은 열릴 때 기록 칸을 하나 쌓는다(useOverlay). 그래서 뒤로는 웹의 뒤로와 같게 한다:
// 쌓인 칸이 있으면 한 칸 뒤로(시트가 닫히거나 앞 화면), 없으면 홈으로, 홈에서는 앱을 뒤로 보낸다(닫지 않는다).
// 판을 하는 중이면 그 화면의 '그만둘까요?'(라우터 가드)가 그대로 묻는다.
// 예전 앱(이 플러그인이 없는 빌드)에서는 아무 일도 하지 않는다
import { Capacitor } from '@capacitor/core'
import type { Router } from 'vue-router'

const ROOTS = ['/', '/game', '/profile/0']

export async function setupAndroidBack(router: Router) {
  if (Capacitor.getPlatform() !== 'android' || !Capacitor.isPluginAvailable('App')) return
  const { App } = await import('@capacitor/app')
  App.addListener('backButton', () => {
    const st = history.state as { back?: string | null; __overlay?: unknown } | null
    if (st?.__overlay || st?.back) {
      history.back()
      return
    }
    const path = router.currentRoute.value.path
    if (!ROOTS.includes(path)) {
      router.replace('/')
      return
    }
    App.minimizeApp()
  })
}
