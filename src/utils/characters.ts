// 꾸민 캐릭터가 그 사람의 얼굴이다 (quality-rules G7-3·S1-4). 예전엔 프로필 한 곳에서만 그랬고 소식·순위·결과·대화는 글자 원이었다.
// 얼굴 자리(UiAvatar)가 사용자 번호를 주면, 한 화면의 번호를 모아 한 번에 묻고(0.03초 모음) 이 세션 동안 기억한다.
// 꾸민 적 없는 사람은 null: 사진이나 이름 첫 글자를 그대로 쓴다
import { API_BASE_URL } from '@/config/server'

const known = new Map<number, string | null>()
const waiting = new Map<number, ((key: string | null) => void)[]>()
let timer: ReturnType<typeof setTimeout> | null = null

async function flush() {
  timer = null
  const ids = [...waiting.keys()].slice(0, 100)
  const resolvers = ids.map((id) => [id, waiting.get(id)!] as const)
  ids.forEach((id) => waiting.delete(id))
  if (waiting.size) timer = setTimeout(flush, 30)
  let found: Record<string, string> = {}
  try {
    // 앱의 공통 요청(api)을 거치지 않는다: 실패(옛 서버·401)가 로그인 화면으로 보내거나 '서버 연결' 띠를 띄우면 안 되는, 없어도 되는 꾸밈이다
    const res = await fetch(`${API_BASE_URL}/api/plaza/characters?ids=${ids.join(',')}`)
    if (!res.ok) throw new Error(String(res.status))
    found = (await res.json()) || {}
  } catch {
    // 못 받으면 이번에는 사진·글자로. 기억하지 않아 다음 화면에서 다시 묻는다
    resolvers.forEach(([, list]) => list.forEach((r) => r(null)))
    return
  }
  for (const [id, list] of resolvers) {
    const key = found[id] ?? null
    known.set(id, key)
    list.forEach((r) => r(key))
  }
}

export function characterOf(userId: number): Promise<string | null> {
  if (known.has(userId)) return Promise.resolve(known.get(userId) ?? null)
  return new Promise((resolve) => {
    const list = waiting.get(userId)
    if (list) list.push(resolve)
    else waiting.set(userId, [resolve])
    if (!timer) timer = setTimeout(flush, 30)
  })
}
/** 이미 아는 값 (없으면 undefined). 그리기 전에 깜빡임 없이 쓰려고 */
export const knownCharacter = (userId: number) => known.get(userId)
/** 꾸미기를 저장하면 그 사람 것을 잊는다: 다음에 다시 묻는다 */
export const forgetCharacter = (userId: number) => known.delete(userId)
