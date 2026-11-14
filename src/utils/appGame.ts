// 앱 게임을 사람 말로: 구조(docs/direction.md '게임 구조')와 판정
export const STRUCTURES = [
  // '지금 바로 붙기'·'편할 때 하기'는 게임을 구조로 나눈 말이라 무슨 게임인지 읽히지 않았다. 하는 모양으로 (경로 전부 훑기 2절)
  { value: 'REALTIME', label: '실시간 대결', hint: '상대와 같은 때 들어와 겨뤄요' },
  { value: 'NON_REALTIME', label: '따로 풀고 비교', hint: '같은 문제를 각자 풀고 비교해요' },
] as const

export function structureLabel(playMode?: string) {
  return STRUCTURES.find((s) => s.value === playMode)?.label ?? ''
}

export function judgeLabel(judge?: string) {
  // '실제 결과'는 무엇인지 몰랐다: 실제 경기 결과로 채점한다는 뜻 (경로 전부 훑기 2절)
  return ({ APP: '앱이 판정', AI: 'AI 채점', VOTE: '투표', OUTCOME: '실제 경기로 채점' } as Record<string, string>)[judge ?? ''] ?? ''
}

/**
 * 내지 않은 따로 하기 판을 이어서 할 수 있나 (마감 전이고, 아직 답을 내지 않았다).
 * 마감만 보면 빨리 낸 판도 '이어서 하기'로 보였고, 누르면 이어 할 판이 없어 새 판이 열렸다 (11/5 9e)
 */
export function canResumeDuel(
  d: { playMode?: string; status?: string; myScore?: number | null; myAnswer?: string | null; myJudging?: boolean; deadlineAt?: string | null },
  now = Date.now(),
) {
  return (
    d.playMode !== 'REALTIME' &&
    d.status !== 'CANCELED' &&
    d.status !== 'COMPLETED' &&
    d.myScore == null &&
    !d.myAnswer &&
    !d.myJudging &&
    !!d.deadlineAt &&
    new Date(d.deadlineAt).getTime() > now
  )
}

/**
 * 사람을 기다리는 판(낸 뒤 상대가 없는 따로 푸는 대결)은 게임마다 한 줄로 접는다 (11/14 폰으로 한 바퀴:
 * AI가 대신 풀어 닫아 주지 않게 된 뒤 '상대 찾는 중'이 판마다 한 줄씩 쌓여 내 경기가 끝없이 길어졌다).
 * 가장 최근 판 하나를 남기고 몇 판이 기다리는지를 waitingCount로 단다. 할 일이 있는 판(이어서 하기·채점 중·상대 있음)은 그대로 둔다
 */
export function collapseWaitingDuels<T extends { key: string; playMode?: string; status?: string; myScore?: number | null; myJudging?: boolean; opponent?: unknown }>(duels: T[]): (T & { waitingCount?: number })[] {
  const idle = (d: T) => d.playMode !== 'REALTIME' && d.status === 'WAITING' && d.myScore != null && !d.myJudging && !d.opponent
  const first = new Map<string, T & { waitingCount?: number }>()
  const out: (T & { waitingCount?: number })[] = []
  for (const d of duels) {
    if (!idle(d)) { out.push(d); continue }
    const kept = first.get(d.key)
    if (kept) { kept.waitingCount = (kept.waitingCount ?? 1) + 1; continue }
    const row = { ...d, waitingCount: 1 }
    first.set(d.key, row); out.push(row)
  }
  return out
}

// 사람을 기다리는 판은 연 지 7일 뒤 닫힌다 (서버 AppDuelService.WAITING_LIMIT). 남은 날을 말한다 (11/14 고병연: '7일 뒤 끝' 대신 '만료까지 n일')
const WAITING_DAYS = 7
export function expiryLine(createdAt?: string): string {
  if (!createdAt) return ''
  const left = Math.ceil((new Date(createdAt).getTime() + WAITING_DAYS * 86400_000 - Date.now()) / 86400_000)
  return left <= 1 ? '오늘 만료' : `만료까지 ${left}일`
}
