// 홈 화면에 추가(PWA). 안드로이드·데스크톱 크롬은 설치 창을 띄울 수 있고, 아이폰 사파리는 공유 메뉴로 안내한다
import { ref } from 'vue'

let deferred = null
export const canPrompt = ref(false)

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault() // 브라우저가 멋대로 띄우지 않게 잡아 두고, 사용자가 누를 때 띄운다
  deferred = e
  canPrompt.value = true
})
window.addEventListener('appinstalled', () => {
  deferred = null
  canPrompt.value = false
})

// 이미 홈 화면에서 연 경우 (앱 안 웹뷰 포함)
export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true || /raspy-(ios|android)/i.test(navigator.userAgent)

export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent)

/** 설치 창을 띄운다. 띄웠으면 true */
export async function promptInstall() {
  if (!deferred) return false
  deferred.prompt()
  await deferred.userChoice
  deferred = null
  canPrompt.value = false
  return true
}
