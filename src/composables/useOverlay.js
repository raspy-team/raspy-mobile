// 시트·다이얼로그가 열려 있는 동안의 공통 동작
// - 뒤로가기를 누르면 화면을 떠나지 않고 이것만 닫힌다
// - Esc로 닫힌다
// - 뒤 화면이 스크롤되지 않는다
import { watch, onBeforeUnmount } from 'vue'
import router from '../router/router'

let openCount = 0 // 여러 개가 겹쳐 열려도 스크롤 잠금은 한 번만

// 마지막으로 화면 이동이 시작된 시각. 닫자마자 다른 화면으로 가는 경우(확인 → 이동)를 알아챈다
// 라우터 → 화면 → 시트 → 여기 → 라우터로 import가 돌기 때문에, 처음 열릴 때 등록한다
let lastNavAt = 0
let navHooked = false
function hookNavigation() {
  if (navHooked) return
  navHooked = true
  router.beforeEach(() => {
    lastNavAt = Date.now()
  })
}

export function useOverlay(isOpen, close) {
  let token = null

  const onPop = () => {
    if (!token) return
    // 시트 위에 시트를 연 경우(일정 정하기 → 공공장소 찾기): 위의 것이 닫히며 기록을 걷어내면 아래 시트의 기록으로 돌아온다.
    // 그때는 아래 시트가 다시 맨 위가 된 것이지 닫힌 것이 아니다 (11/9: 장소를 고르면 일정 시트까지 닫혀 처음부터 다시 했다)
    if (history.state?.__overlay === token) return
    token = null
    close()
  }
  // Esc는 맨 위 시트만 닫는다
  const onKey = (e) => e.key === 'Escape' && history.state?.__overlay === token && close()

  function opened() {
    hookNavigation()
    token = Date.now() + Math.random()
    history.pushState({ ...history.state, __overlay: token }, '')
    window.addEventListener('popstate', onPop)
    window.addEventListener('keydown', onKey)
    if (openCount++ === 0) document.body.style.overflow = 'hidden'
  }

  function closed() {
    window.removeEventListener('popstate', onPop)
    window.removeEventListener('keydown', onKey)
    if (--openCount <= 0) {
      openCount = 0
      document.body.style.overflow = ''
    }
    // 화면 안에서 닫았으면 쌓아둔 기록을 걷어낸다.
    // 닫은 뒤 다른 화면으로 이동이 시작됐다면 건드리지 않는다 (되돌리면 그 이동이 취소된다)
    if (token) {
      const mine = token
      const closedAt = Date.now()
      token = null
      setTimeout(() => {
        if (lastNavAt >= closedAt) return
        if (history.state?.__overlay === mine) history.back()
      }, 60)
    }
  }

  watch(isOpen, (v, old) => {
    if (v && !old) opened()
    else if (!v && old) closed()
  }, { immediate: true })

  onBeforeUnmount(() => isOpen.value && closed())
}
