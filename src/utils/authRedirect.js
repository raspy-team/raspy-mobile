// 로그인하러 가기 전 보던 주소를 기억했다가, 가입·설정을 마치면 그리로 돌려보낸다
// (공유 링크로 들어온 사람이 로그인 뒤 홈에 떨어지지 않게)
const KEY = 'returnTo'
const AT_KEY = 'returnTo_at'
// 기억한 주소는 하루만 쓴다. 며칠 전 친구 링크(끝난 도전장 등)가 언제까지나 시작 화면 카드로 남아 가입하면 그리로 갔다 (경로 1 리뷰 N6)
const KEEP_MS = 24 * 3600_000
const SKIP = ['/init', '/group/login', '/oauth/callback', '/welcome']

// 앱 안 주소만 ('/'로 시작하고 '//'·'/\\'가 아닌 것). '//evil.com'은 브라우저가 다른 사이트로 본다 (11/4 밤샘 리뷰 D)
const isAppPath = (p) => typeof p === 'string' && p.startsWith('/') && !p.startsWith('//') && !p.startsWith('/\\')

export function rememberReturnTo(fullPath) {
  if (!isAppPath(fullPath) || fullPath === '/' || SKIP.some((p) => fullPath.startsWith(p))) return
  try {
    localStorage.setItem(KEY, fullPath)
    localStorage.setItem(AT_KEY, String(Date.now()))
  } catch {
    // 저장소를 못 쓰면 홈으로 간다
  }
}

/** 지우지 않고 보기만 (시작 화면이 "무엇에 불려 왔는지"를 보여 줄 때) */
function fresh() {
  const at = Number(localStorage.getItem(AT_KEY))
  // 시각이 없는 옛 기록은 하루 전 것으로 본다
  if (!at || Date.now() - at > KEEP_MS) {
    localStorage.removeItem(KEY)
    localStorage.removeItem(AT_KEY)
    return false
  }
  return true
}

export function peekReturnTo() {
  try {
    if (!fresh()) return null
    const path = localStorage.getItem(KEY)
    return isAppPath(path) ? path : null
  } catch {
    return null
  }
}

export function takeReturnTo() {
  try {
    if (!fresh()) return null
    const path = localStorage.getItem(KEY)
    localStorage.removeItem(KEY)
    localStorage.removeItem(AT_KEY)
    return isAppPath(path) ? path : null
  } catch {
    return null
  }
}
