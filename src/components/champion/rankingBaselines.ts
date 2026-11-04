// AI 기준선 (docs/ai-residents.md 2·7): 앱 게임 순위 사이에 'AI 고수 1800'·'AI 보통 1500' 줄을 끼운다.
// 줄은 사람이 아니다: 순위 번호·왕관에 들어가지 않는다. 사람이 FOLD_AT명을 넘으면 접고 'AI 기준 보기'로 편다
export type Baseline = { label: string; rating: number }
export type RankRow<T> = { kind: 'user'; row: T } | { kind: 'ai'; line: Baseline }

export const FOLD_AT = 20

/**
 * 점수 순 목록에 기준선을 끼운다. 기준선은 그보다 점수가 낮은 첫 사람 바로 위에.
 * complete가 false면(목록을 잘라 보이는 중) 목록 끝보다 낮은 기준선은 넣지 않는다 (잘린 뒤쪽 어딘가에 있으니)
 */
export function withBaselines<T extends { rating: number }>(rows: T[], baselines: Baseline[] = [], complete = true): RankRow<T>[] {
  const lines = [...baselines].sort((a, b) => b.rating - a.rating)
  const out: RankRow<T>[] = []
  let i = 0
  for (const row of rows) {
    while (i < lines.length && lines[i].rating > row.rating) out.push({ kind: 'ai', line: lines[i++] })
    out.push({ kind: 'user', row })
  }
  if (complete) while (i < lines.length) out.push({ kind: 'ai', line: lines[i++] })
  return out
}
