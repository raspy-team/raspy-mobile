// 임기응변 등급 (3단계 첫 게임): 결과 한마디(첫 줄 "3등급 · 상위 18%", 그 아래 인물 반응)를 읽고, 등급마다 공유 한 줄을 고른다

export type ImprovShown = { id: string; slot: string; who: string; context: string; line: string }

export function improvSituations(problem?: string | null): ImprovShown[] {
  try {
    return JSON.parse(problem || '').situations ?? []
  } catch {
    return []
  }
}

export function improvAnswers(answer?: string | null): string[] {
  try {
    const a = JSON.parse(answer || '')
    return Array.isArray(a) ? a.map(String) : []
  } catch {
    return []
  }
}

/** 한마디에서 등급·상위 %·반응 셋 */
export function improvFeedback(feedback?: string | null): { grade: number; topPercent: number; reactions: string[] } | null {
  const [head, ...rest] = (feedback || '').split('\n')
  const m = head.match(/(\d)등급 · 상위 (\d+)%/)
  if (!m) return null
  return { grade: Number(m[1]), topPercent: Number(m[2]), reactions: rest.map((l) => l.replace(/^[^:]+:\s*/, '')) }
}

/**
 * 보내는 사람의 입으로 쓴 한 줄. 이기면 자랑, 지면 놀릴 거리로 넘긴다 (단톡은 농담 따먹기).
 * 진 사람도 보내게 하는 것이 목적이다 (viral-structures-adoption.md 3절 ①)
 */
export function improvShareLine(grade: number): string {
  if (grade <= 2) return `임기응변 ${grade}등급. 대학 갈 준비 끝났다`
  if (grade <= 4) return `임기응변 ${grade}등급. 너는 몇 등급 나와?`
  if (grade <= 6) return `임기응변 ${grade}등급… 누가 나보다 잘하나 보자`
  return `임기응변 ${grade}등급 ㅋㅋ 이길 사람?`
}

/** 송현(서울대 의대생)이 실제로 해서 나온 등급. 해 보기 전에는 null이고, 그동안 숫자를 지어내지 않는다 */
export const SONGHYUN_GRADE: number | null = 4

/** 게임 소개 한 줄 (고병연 문구, 송현 등급이 정해지면 숫자가 들어간다) */
export const IMPROV_LINE = SONGHYUN_GRADE
  ? `서울대 의대생도 ${SONGHYUN_GRADE}등급 맞은, 우리 중 누가 가장 대학생이 될 준비가 됐을까? 난처한 상황 셋, 상황마다 45초`
  : '국영수 점수 말고, 난처한 상황에서 나는 몇 등급일까? 교수님·선배·동기, 상황마다 45초'
