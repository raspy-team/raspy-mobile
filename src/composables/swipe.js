// 피드 제스처에서 같이 쓰는 도구

// 누른 곳이 버튼·링크·입력칸이면 스와이프로 보지 않는다. data-allow-swipe가 붙은 곳은 예외
export function isOnControl(target, { allowSwipeAttr = false } = {}) {
  if (!target?.closest) return false
  if (allowSwipeAttr && target.closest('[data-allow-swipe]')) return false
  return !!target.closest('button, a, input, textarea, select, label, [data-stop-slide]')
}

// 누른 곳 위로 세로 스크롤이 가능한 영역이 있으면 그 영역(그 안에서는 피드를 넘기지 않는다)
export function findScrollable(el) {
  try {
    let node = el
    while (node && node !== document.body) {
      const st = getComputedStyle(node)
      if ((st.overflowY === 'auto' || st.overflowY === 'scroll') && node.scrollHeight > node.clientHeight) {
        return node
      }
      node = node.parentElement
    }
  } catch {
    // 무시
  }
  return null
}

export function tryVibrate(ms) {
  try {
    if (navigator.vibrate) navigator.vibrate(ms)
  } catch {
    // 무시
  }
}

export const SNAP_TRANSITION = 'transform 380ms cubic-bezier(.22,1,.36,1)'
