// 스코어 맞히기의 문제(실제 경기)를 화면 말로. 서버 ScorePredictGame이 Fixture를 JSON으로 준다
export type Fixture = { id: string; league: string; home: string; away: string; kickoff: string }

export function fixtureOf(problem: string): Fixture {
  try {
    return JSON.parse(problem)
  } catch {
    return { id: '', league: '', home: '홈', away: '원정', kickoff: '' }
  }
}

/** '11월 8일 (토) 21:00' */
export function kickoffLabel(at: string) {
  if (!at) return ''
  const d = new Date(at)
  const day = '일월화수목금토'[d.getDay()]
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${day}) ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** 결과를 기다리는 대결 한 줄: '한강 FC 2:1 북악 유나이티드 예상 · 11월 8일 (토) 21:00 경기' */
export function predictionLine(problem: string, answer?: string | null) {
  const f = fixtureOf(problem)
  const [h, a] = (answer ?? '').split('-')
  return `${f.home} ${h ?? '?'}:${a ?? '?'} ${f.away}`
}
