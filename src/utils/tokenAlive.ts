// 로그인 토큰이 아직 살아 있나 (11/14): 토큰은 14일쯤 뒤 끝나는데 화면은 '있다'만 보고 로그인한 사람으로 대했다.
// 끝난 토큰으로 친구의 초대 링크를 누르면 가입 화면에 막혔다. 끝났으면 없는 것으로 친다(서버에 묻지 않고 exp만 읽는다)
export function tokenAlive(): boolean {
  try {
    const t = localStorage.getItem('raspy_access_token2')
    if (!t) return false
    const part = t.split('.')[1]
    if (!part) return true
    const exp = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/'))).exp
    return !exp || exp * 1000 > Date.now() + 5000
  } catch {
    return !!localStorage.getItem('raspy_access_token2')
  }
}
