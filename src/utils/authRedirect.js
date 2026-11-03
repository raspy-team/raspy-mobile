// 로그인하러 가기 전 보던 주소를 기억했다가, 가입·설정을 마치면 그리로 돌려보낸다
// (공유 링크로 들어온 사람이 로그인 뒤 홈에 떨어지지 않게)
const KEY = 'returnTo'
const SKIP = ['/init', '/group/login', '/oauth/callback', '/welcome']

export function rememberReturnTo(fullPath) {
  if (!fullPath || fullPath === '/' || SKIP.some((p) => fullPath.startsWith(p))) return
  try {
    localStorage.setItem(KEY, fullPath)
  } catch {
    // 저장소를 못 쓰면 홈으로 간다
  }
}

/** 지우지 않고 보기만 (시작 화면이 "무엇에 불려 왔는지"를 보여 줄 때) */
export function peekReturnTo() {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function takeReturnTo() {
  try {
    const path = localStorage.getItem(KEY)
    localStorage.removeItem(KEY)
    return path || null
  } catch {
    return null
  }
}
