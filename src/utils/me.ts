// 내 유저 id. 로그인 토큰(JWT)에 들어 있으니 서버에 묻지 않고 읽는다.
// 화면마다 /api/auth/current-user-id를 부르던 것을 대신한다 (서버 왕복 한 번씩이 줄어든다)
import { GET } from '@/api/client'

const TOKEN_KEY = 'raspy_access_token2'

let cached: { token: string; id: number } | null = null

function idFromToken(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return typeof payload.userId === 'number' ? payload.userId : null
  } catch {
    return null
  }
}

/** 로그인하지 않았으면 null. 토큰에 id가 없으면(예상 밖의 토큰) 서버에 한 번 묻고 기억한다 */
export async function getMyId(): Promise<number | null> {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) return null
  if (cached?.token === token) return cached.id
  const id = idFromToken(token) ?? Number((await GET('/api/auth/current-user-id')).data)
  cached = { token, id }
  return id
}
