// 아이폰 '글자 크기' 설정(Dynamic Type)을 따른다 (11/3).
// iOS는 -apple-system-body로 사용자가 고른 본문 크기를 준다(기본 17px). 그 비율만큼 html 글자 크기를 바꾸면
// rem으로 쓴 글자·간격이 함께 커진다. 기본 설정에서는 지금과 같은 16px.
// 손쉬운 사용의 아주 큰 크기(최대 53px)까지 그대로 따르면 화면이 깨져서 1.4배에서 멈춘다.
// 맥 사파리도 -apple-system-body를 알지만 13px라 작아지므로 iOS(-webkit-touch-callout을 아는 곳)만.
const BASE = 16
const IOS_DEFAULT_BODY = 17
const MAX_SCALE = 1.4

const isIos = typeof CSS !== 'undefined' && CSS.supports('font', '-apple-system-body') && CSS.supports('-webkit-touch-callout', 'none')

function apply() {
  const probe = document.createElement('span')
  probe.style.font = '-apple-system-body'
  probe.style.position = 'absolute'
  probe.style.visibility = 'hidden'
  document.body.appendChild(probe)
  const body = parseFloat(getComputedStyle(probe).fontSize)
  probe.remove()
  if (!body) return
  const scale = Math.min(MAX_SCALE, Math.max(1, body / IOS_DEFAULT_BODY))
  document.documentElement.style.fontSize = `${BASE * scale}px`
}

/** 앱이 뜰 때 한 번, 그리고 앱으로 돌아올 때마다 (설정에서 글자 크기를 바꾸고 돌아오는 경우) */
export function followIosTextSize() {
  if (!isIos) return
  apply()
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && apply())
}
