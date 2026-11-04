// 앱 게임을 사람 말로: 구조(docs/direction.md '게임 구조')와 판정
export const STRUCTURES = [
  { value: 'REALTIME', label: '지금 바로 붙기', hint: '상대와 같은 때 들어와 겨뤄요' },
  { value: 'NON_REALTIME', label: '편할 때 하기', hint: '같은 문제를 각자 풀고 비교해요' },
] as const

export function structureLabel(playMode?: string) {
  return STRUCTURES.find((s) => s.value === playMode)?.label ?? ''
}

export function judgeLabel(judge?: string) {
  return ({ APP: '앱이 판정', AI: 'AI 채점', VOTE: '투표', OUTCOME: '실제 결과' } as Record<string, string>)[judge ?? ''] ?? ''
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
