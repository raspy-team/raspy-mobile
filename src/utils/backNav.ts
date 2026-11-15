// 뒤로 가기가 엉뚱해지는 길 셋을 한 곳에서 막는다 (11/15 고병연: "뒤로를 눌렀을 때 열받는 것들").
//
// 1) 돌아가기 (returnBack): 다른 화면에 잠깐 다녀와 '온 곳'으로 돌아갈 때, 온 곳이 바로 앞 화면이면 뒤로 간다.
//    그 주소로 갈아 끼우면(replace) 같은 화면이 기록에 두 번 남아, 돌아온 화면에서 뒤로를 눌러도 같은 화면이 한 번 더 나왔다.
// 2) 묻고 나가기 (confirmLeave): 판·글쓰기 중에 나가려 하면 한 번 묻는다. 뒤로 가다 물었으면 '나가기' 뒤에도 뒤로 간다.
//    예전엔 앞으로 가는 이동(push)으로 나가서, 나온 화면에서 뒤로를 누르면 방금 나온 판으로 다시 들어갔다.
// 3) 다녀오기 (markDetour · 라우터의 landDetour): 경기 만들기 → 규칙 고르기 → 경기 만들기처럼 고르러 다녀오는 길은
//    돌아올 때 다녀온 화면들을 기록에서 걷는다. 예전엔 [만들기, 규칙 목록, 만들기]가 쌓여 뒤로를 누르면 규칙 목록 → 옛 만들기 화면이 차례로 나왔다
import { onBeforeRouteLeave, type RouteLocationNormalized, type Router } from 'vue-router'

const pos = () => (window.history.state?.position as number | undefined) ?? 0

export function returnBack(router: Router, back: string) {
  if (window.history.state?.back === back) router.back()
  else router.replace(back).catch(() => {})
}

export function confirmLeave(router: Router, needsAsk: () => boolean, ask: () => Promise<boolean>) {
  const mine = pos()
  let ok = false
  onBeforeRouteLeave((to) => {
    if (ok || !needsAsk()) return true
    // 뒤로 가는 중이면 브라우저 기록은 이미 그 화면에 가 있다 (라우터가 곧 되돌린다)
    const target = pos()
    const goingBack = target < mine
    setTimeout(async () => {
      if (!(await ask())) return
      ok = true
      if (goingBack) router.go(target - mine)
      else router.push(to.fullPath)
    }, 80)
    return false
  })
}

const KEY = 'detour_'
/** 고르러 떠나기 직전에: 돌아올 자리(지금 화면)를 적어 둔다 */
export function markDetour(name: string) {
  try { sessionStorage.setItem(KEY + name, String(pos())) } catch { /* 적지 못하면 예전처럼 쌓일 뿐 */ }
}

/** 라우터 beforeEach: 고르고 돌아오는 이동이면 다녀온 화면들을 걷고 떠났던 자리를 새 주소로 바꾼다 */
export function landDetour(router: Router, name: string, path: string, to: RouteLocationNormalized, from: RouteLocationNormalized) {
  let at = NaN
  try { at = Number(sessionStorage.getItem(KEY + name) ?? NaN) } catch { return true }
  if (!Number.isFinite(at)) return true
  const now = pos()
  // 떠났던 자리보다 앞으로 돌아갔으면(뒤로 가서 그만뒀으면) 표시는 버린다: 나중의 다른 이동을 엉뚱하게 걷지 않게
  if (now <= at && from.path !== path) { try { sessionStorage.removeItem(KEY + name) } catch { /* */ } return true }
  if (to.path !== path || from.path === path || now <= at) return true
  try { sessionStorage.removeItem(KEY + name) } catch { /* */ }
  // 기록이 떠났던 자리로 돌아간 뒤(popstate)에 그 자리를 새 주소로 바꾼다. afterEach는 지금 막는 이 이동에도 불려서 쓸 수 없다
  const landed = () => { window.removeEventListener('popstate', landed); setTimeout(() => router.replace(to.fullPath).catch(() => {}), 30) }
  window.addEventListener('popstate', landed)
  router.go(at - now)
  return false
}
