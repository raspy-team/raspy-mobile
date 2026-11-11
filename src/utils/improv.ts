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

/** 채점 기준 이름을 사람이 한 행동으로 (경로 10 훑기: "잘한 것 관계"가 무엇을 잘했다는 건지 몰랐다). 서버 이름은 improv/ImprovScore.CRITERIA */
const LABEL: Record<string, string> = {
  '상황 읽기': '분위기 읽기',
  관계: '상대 대하기',
  '나 지키기': '내 입장 말하기',
  재치: '재치',
  자연스러움: '말이 자연스러움',
}

/** 기준마다 다음 판에 해 볼 한 줄 (아쉬운 것에 붙인다) */
const TIP: Record<string, string> = {
  '상황 읽기': '상대가 진짜 묻는 게 뭔지 한 번 더 생각해 보기',
  관계: '상대 체면도 살려 주는 한마디 붙이기',
  '나 지키기': '얼버무리지 말고 내 입장도 솔직하게 한마디',
  재치: '웃음 포인트 하나 넣어 보기',
  자연스러움: '실제로 그 자리에서 할 법한 말로 짧게',
}

/**
 * 한마디 읽기. 첫 줄 "7등급 · 100명 중 86등"(11/11 전 판은 "상위 86%"), 둘째 줄이 "잘한 것: …"이면 왜 그 등급인지, 나머지는 인물 반응
 */
/** 등급이 나오지 않은 판의 서버 한마디 (improv/ImprovGame.kt NO_ANSWER, 마감 넘김). 이때도 임기응변 결과 틀로 보여 준다 */
export const IMPROV_NO_GRADE = ['대답이 없어 등급이 안 나왔어요', '시간 안에 내지 않았어요']

export function improvFeedback(feedback?: string | null): { grade: number; rank: number; strong?: string; weak?: string; tip?: string; next?: string; best?: number; reactions: string[]; empty?: string } | null {
  const [head, ...rest] = (feedback || '').split('\n')
  // 등급이 없는 판: 다른 게임의 점수 화면으로 바뀌지 않게 '빈 등급'으로 돌려준다 (목적 판정: 빈 답 결과가 갑자기 다른 모양이었다)
  if (IMPROV_NO_GRADE.includes(head.trim())) return { grade: 0, rank: 0, reactions: [], empty: head.trim() }
  const m = head.match(/(\d)등급 · (?:100명 중 (\d+)등|상위 (\d+)%)/)
  if (!m) return null
  // 둘째 줄부터: '잘한 것: …'(있으면), '다음 등급: N등급까지 n점'(1등급이 아니면), 나머지는 '인물: 반응'
  // 잘한 것이 없는 판은 '아쉬운 것: …'만 온다 (서버 ImprovGame.WEAK_ONLY_PREFIX, 11/11): 칭찬은 지어내지 않고 다음 할 일은 준다
  const whyLine = rest.find((l) => l.startsWith('잘한 것: ') || l.startsWith('아쉬운 것: '))
  const nextLine = rest.find((l) => l.startsWith('다음 등급: '))
  // 가장 높게 매겨진 대답의 상황 번호 (서버 ImprovGame.BEST_PREFIX). 11/11 전 판엔 없다
  const bestLine = rest.find((l) => l.startsWith('가장 잘한 대답: '))
  const why = whyLine?.match(/^잘한 것: (.+) · 아쉬운 것: (.+)$/) ?? whyLine?.match(/^아쉬운 것: ()(.+)$/)
  const reactions = rest.filter((l) => l !== whyLine && l !== nextLine && l !== bestLine).map((l) => l.replace(/^[^:]+:\s*/, ''))
  const best = bestLine ? Number(bestLine.replace('가장 잘한 대답: ', '')) - 1 : undefined
  return {
    grade: Number(m[1]), rank: Number(m[2] ?? m[3]),
    strong: why?.[1] ? LABEL[why[1]] ?? why[1] : undefined, weak: why ? LABEL[why[2]] ?? why[2] : undefined,
    tip: why ? TIP[why[2]] : undefined, next: nextLine?.replace('다음 등급: ', ''),
    best: best != null && best >= 0 ? best : undefined, reactions,
  }
}

/**
 * 보내는 사람의 입으로 쓴 한 줄. 이기면 자랑, 지면 놀릴 거리로 넘긴다 (단톡은 농담 따먹기).
 * 진 사람도 보내게 하는 것이 목적이다 (viral-structures-adoption.md 3절 ①)
 */
export function improvShareLine(grade: number): string {
  if (grade <= 2) return `임기응변 ${grade}등급. 대학 갈 준비 끝났다`
  if (grade <= 4) return `임기응변 ${grade}등급. 너는 몇 등급 나와?`
  if (grade <= 6) return `임기응변 ${grade}등급… 누가 나보다 잘하나 보자.`
  return `임기응변 ${grade}등급 ㅋㅋ 이길 사람?`
}

/**
 * 기록에 무엇이 남나. 기록(내 정보·기록 순위)엔 가장 좋은 판만 남는다(UserStatsService.bests).
 * 4등급(서울대 의대생 등급)까지는 '이 등급이 남는다'가 자랑이고, 5등급부터는 같은 말이 '이 등급이 박힌다'로 들려
 * 가입을 망설이게 한다. 사실 그대로 '가장 좋은 등급만'을 말한다 (11/11 감정과 체면)
 */
export function improvKeepLine(grade: number): string {
  return grade && grade <= 4 ? '이 등급이 내 기록에 남아요' : '내 기록엔 가장 좋은 등급만 남아요'
}

/** 송현(서울대 의대생)이 실제로 해서 나온 등급. 해 보기 전에는 null이고, 그동안 숫자를 지어내지 않는다 */
export const SONGHYUN_GRADE: number | null = 4

/** 게임 소개 한 줄 (고병연 문구, 송현 등급이 정해지면 숫자가 들어간다) */
export const IMPROV_LINE = SONGHYUN_GRADE
  ? `서울대 의대생도 ${SONGHYUN_GRADE}등급 맞은 시험. 나는 대학생이 될 준비가 됐을까? 난처한 상황 셋, 상황마다 45초`
  : '국영수 점수 말고, 난처한 상황에서 나는 몇 등급일까? 교수님·선배·동기, 상황마다 45초'
