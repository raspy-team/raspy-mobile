// 눌렀다·끝났다는 느낌을 짧은 진동으로 준다. 진동 길이는 여기서만 정한다. 소리와 함께 쓰려면 utils/feel의 feel()
// - 안드로이드(웹·앱 웹뷰): navigator.vibrate
// - 아이폰 앱(웹뷰): 앱에 'haptic' 신호 (앱이 UIImpactFeedbackGenerator로 낸다)
// - 아이폰 사파리: vibrate가 없다. iOS 18부터 '스위치' 입력(<input switch>)을 누르면 시스템 햅틱이 나서, 숨긴 스위치를 대신 눌러 준다
import { isIosApp } from './nativeBridge'

const PATTERNS = {
  tap: 8, // 점수 올리기, 좋아요처럼 자주 누르는 것
  select: 6, // 탭·칩·별 고르기
  light: 6,
  success: [12, 60, 24], // 신청, 결과 확인, 세트·경기 끝
  alert: 400, // 세트 시간이 다 됨
  error: [40, 60, 40], // 눌렀는데 안 됐다 (연결 끊김)
}
// 아이폰 앱은 패턴 대신 종류 하나 (앱 쪽 이름)
const IOS_STYLE = { tap: 'light', select: 'selection', light: 'light', success: 'success', alert: 'warning', error: 'error' }

let iosSwitch = null
function iosWebHaptic() {
  if (!iosSwitch) {
    const label = document.createElement('label')
    label.setAttribute('aria-hidden', 'true')
    label.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none'
    const input = document.createElement('input')
    input.type = 'checkbox'
    input.setAttribute('switch', '')
    input.tabIndex = -1
    label.appendChild(input)
    document.body.appendChild(label)
    iosSwitch = label
  }
  iosSwitch.click()
}

const isIosWeb = !isIosApp && /iphone|ipad|ipod/i.test(navigator.userAgent)

export function haptic(kind = 'tap') {
  try {
    if (isIosApp) return window.webkit?.messageHandlers?.iosBridge?.postMessage({ action: 'haptic', style: IOS_STYLE[kind] ?? 'light' })
    if (navigator.vibrate) return navigator.vibrate(PATTERNS[kind] ?? PATTERNS.tap)
    if (isIosWeb) iosWebHaptic()
  } catch {
    // 막힌 환경(iframe 등)에서는 무시
  }
}
