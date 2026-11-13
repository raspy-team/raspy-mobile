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

// 시트를 닫자마자 다른 시트·확인 창을 여는 곳이 20곳 넘게 있다(더보기 → 신고, 더보기 → 차단 확인, 친구 → 사람 찾기 …).
// 예전엔 닫힌 시트의 기록 칸이 남아, 다음 것을 닫은 뒤 뒤로를 한 번 더 눌러야 앞 화면으로 갔다 (가로 훑기 2절, 경로 8 P6).
// 이제 닫힌 시트의 칸은 잠깐(RELEASE_MS) 남겨 두고, 그사이 새 시트가 열리면 그 칸을 넘겨받는다(새로 쌓지 않는다)
// 사용자의 '뒤로'가 방금 있었나. 뒤로가 부른 창(게임 중 나가기 확인 같은 라우터 가드의 확인 창)은 기록 칸을 잡지 않는다:
// 그때는 라우터가 아직 그 이동을 붙들고 있어서, 칸을 쌓으면 앞쪽 기록이 잘리고 라우터의 되돌리기와 엉켜
// 창이 뜨자마자 닫혔다 (11/14: 게임 중 첫 '뒤로'는 아무 일도 없고 두 번째에야 확인 창이 떴다)
let lastUserPopAt = 0
let ownBack = false // 우리가 부른 history.back()의 신호는 사용자의 뒤로가 아니다
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    if (ownBack) ownBack = false
    else lastUserPopAt = Date.now()
  }, true)
}
const AFTER_POP_MS = 800

const RELEASE_MS = 300
let pending = null // { token, timer }: 닫혔지만 아직 걷지 않은 칸
let backInFlight = null // history.back()을 부르고 popstate를 기다리는 중이면 그 Promise

function releaseLater(token) {
  const closedAt = Date.now()
  pending = {
    token,
    timer: setTimeout(() => {
      pending = null
      // 닫은 뒤 다른 화면으로 이동이 시작됐다면 건드리지 않는다 (되돌리면 그 이동이 취소된다)
      if (lastNavAt >= closedAt) return
      if (history.state?.__overlay !== token) return
      backInFlight = new Promise((resolve) => {
        const done = () => {
          window.removeEventListener('popstate', done)
          backInFlight = null
          resolve()
        }
        window.addEventListener('popstate', done)
        // popstate가 오지 않는 환경을 대비해 끝을 둔다
        setTimeout(done, 500)
      })
      ownBack = true
      history.back()
    }, RELEASE_MS),
  }
}

/**
 * 위 막대 '뒤로'처럼 화면을 떠나는 쪽이 부른다: 방금 닫혀 아직 남은 칸이 있으면 걷기를 멈추고 1을 돌려준다.
 * 부른 쪽은 그만큼 더 뒤로 간다(예전엔 시트를 닫고 곧바로 누른 뒤로가 그 칸으로 가서 한 번은 아무 일이 없었다)
 */
export function takePendingOverlay() {
  if (!pending || history.state?.__overlay !== pending.token) return 0
  clearTimeout(pending.timer)
  pending = null
  return 1
}

export function useOverlay(isOpen, close) {
  let token = null // 열려 있는 동안의 내 표
  let claimed = false // 기록 칸을 잡았나 (잡기 전엔 뒤로 신호를 듣지 않는다)

  const onPop = () => {
    if (!token || !claimed) return
    // 시트 위에 시트를 연 경우(일정 정하기 → 공공장소 찾기): 위의 것이 닫히며 기록을 걷어내면 아래 시트의 기록으로 돌아온다.
    // 그때는 아래 시트가 다시 맨 위가 된 것이지 닫힌 것이 아니다 (11/9: 장소를 고르면 일정 시트까지 닫혀 처음부터 다시 했다)
    if (history.state?.__overlay === token) return
    token = null
    close()
  }
  // Esc는 맨 위 시트만 닫는다
  const onKey = (e) => e.key === 'Escape' && history.state?.__overlay === token && close()

  function claimEntry(mine) {
    // 방금 닫힌 시트의 칸이 맨 위에 남아 있으면 그 칸을 넘겨받는다
    if (pending && history.state?.__overlay === pending.token) {
      clearTimeout(pending.timer)
      pending = null
      history.replaceState({ ...history.state, __overlay: mine }, '')
    } else {
      history.pushState({ ...history.state, __overlay: mine }, '')
    }
    claimed = true
  }

  function opened() {
    hookNavigation()
    const mine = Date.now() + Math.random()
    token = mine
    claimed = false
    window.addEventListener('popstate', onPop)
    window.addEventListener('keydown', onKey)
    if (openCount++ === 0) document.body.style.overflow = 'hidden'
    // 같은 순간(같은 갱신)에 닫히는 시트가 먼저 '닫힘'을 마치도록 한 박자 뒤에 칸을 잡는다.
    // 앞 시트의 칸을 걷는 중(history.back)이면 그 뒤에 잡는다
    queueMicrotask(async () => {
      if (backInFlight) await backInFlight
      if (token !== mine) return // 그사이 닫혔다
      if (Date.now() - lastUserPopAt < AFTER_POP_MS) return // 뒤로가 부른 창: 기록을 건드리지 않는다 (버튼으로만 닫는다)
      claimEntry(mine)
    })
  }

  function closed() {
    window.removeEventListener('popstate', onPop)
    window.removeEventListener('keydown', onKey)
    if (--openCount <= 0) {
      openCount = 0
      document.body.style.overflow = ''
    }
    // 화면 안에서 닫았으면 쌓아둔 기록을 걷어낸다. 바로 다음에 다른 시트가 열리면 그 시트가 이 칸을 넘겨받는다
    if (token) {
      const mine = token
      token = null
      if (claimed && history.state?.__overlay === mine) releaseLater(mine)
    }
    claimed = false
  }

  watch(isOpen, (v, old) => {
    if (v && !old) opened()
    else if (!v && old) closed()
  }, { immediate: true })

  onBeforeUnmount(() => isOpen.value && closed())
}
