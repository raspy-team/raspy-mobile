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
