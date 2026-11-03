// 홈의 상황 줄 ("지금 폰만 있으면 · 친구랑 둘이 …"). 값은 규칙 둘러보기 주소(?place=&party=&length=)와 같다.
// 걸리는 규칙이 하나도 없는 줄은 누르면 '맞는 규칙이 없어요'만 나오므로 홈에서 뺀다.
// 규칙 목록은 앱을 켠 동안 한 번만 받는다 (분류는 자주 바뀌지 않는다)
import { GET } from '@/api/client'
import type { components } from '@/api/schema'

type Rule = components['schemas']['FullRuleResponse']
export type Situation = { label: string; icon: string; query: { place?: string; party?: string; length?: string } }

export const SITUATIONS: Situation[] = [
  { label: '지금 폰만 있으면', icon: 'bolt', query: { place: 'PHONE' } },
  { label: '친구랑 둘이', icon: 'user-group', query: { party: 'DUO' } },
  { label: '술자리·모임에서', icon: 'users', query: { place: 'GATHERING' } },
  { label: '1분이면', icon: 'stopwatch', query: { length: 'MINUTE' } },
  { label: '집에서', icon: 'home', query: { place: 'HOME' } },
]

function matches(rule: Rule, q: Situation['query']): boolean {
  const c = rule.category
  if (!c) return false // 분류 안 한 규칙은 필터에 걸리지 않는다 (서버 RuleRepository와 같다)
  if (q.place && !c.places.some((p) => p.key === q.place)) return false
  if (q.party && !c.parties.some((p) => p.key === q.party)) return false
  if (q.length && c.length.key !== q.length) return false
  return true
}

let cached: Promise<Situation[]> | null = null

/** 걸리는 규칙이 있는 상황만. 못 불러오면 전부 보여 준다 (막지 않는다) */
export function availableSituations(): Promise<Situation[]> {
  cached ??= GET('/api/rules/list', { query: { withApp: true } })
    .then(({ data }) => SITUATIONS.filter((s) => (data ?? []).some((r) => matches(r, s.query))))
    .catch(() => {
      cached = null
      return SITUATIONS
    })
  return cached
}
