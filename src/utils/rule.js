// 규칙을 사람 말로: 카드·상세·시트가 같은 문구를 쓴다

// 서버 값: duration은 초, 없으면 -1. pointsToWin도 없으면 -1. setsToWin은 전체 세트 수(과반을 이기면 승리)
export function durationText(sec) {
  if (!sec || sec < 0) return ''
  if (sec < 60) return `${sec}초`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return s ? `${m}분 ${s}초` : `${m}분`
}

// 한 줄 요약: "11점 · 3세트" / "10분 · 3세트"
export function winSummary(rule) {
  const parts = []
  if (rule.pointsToWin > 0) parts.push(`${rule.pointsToWin}점`)
  else if (rule.duration > 0) parts.push(durationText(rule.duration))
  if (rule.setsToWin > 1) parts.push(`${rule.setsToWin}세트`)
  else if (rule.setsToWin === 1) parts.push('단판')
  return parts.join(' · ')
}

// 핵심 정보 (아이콘 + 제목 + 설명). 값이 없는 줄은 빼서 돌려준다
export function ruleFacts(rule) {
  const sets = rule.setsToWin || 1
  const need = Math.floor(sets / 2) + 1
  return [
    rule.pointsToWin > 0 && {
      icon: 'fas fa-bullseye',
      title: `세트마다 ${rule.pointsToWin}점 먼저`,
      body: '정한 점수에 먼저 닿으면 그 세트를 가져가요',
    },
    rule.duration > 0 && {
      icon: 'fas fa-stopwatch',
      title: `세트당 ${durationText(rule.duration)}`,
      body: rule.pointsToWin > 0 ? '시간이 끝나면 점수가 높은 쪽이 세트 승리' : '시간이 끝났을 때 점수가 높으면 세트 승리',
    },
    {
      icon: 'fas fa-layer-group',
      title: sets > 1 ? `${sets}세트 중 ${need}세트 먼저` : '한 판 승부',
      body: sets > 1 ? '과반 세트를 먼저 이기면 경기 승리예요' : '한 세트로 승부를 내요',
    },
  ].filter(Boolean)
}

// 글로 적힌 항목. 빈 칸과 자동으로 채운 뜻 없는 문구는 숨긴다
const SECTIONS = [
  ['ruleGoal', '어떤 경기인가요'],
  ['ruleScoreDefinition', '점수 얻는 법'],
  ['rulePreparation', '준비물'],
  ['ruleOrder', '진행 순서'],
  ['ruleDecision', '판정'],
  ['ruleFoul', '반칙'],
  ['ruleExtraInfo', '그 밖에'],
]
const EMPTY = /^(없음|기타 사항 없음|-|x|없습니다\.?)$/i
export function ruleSections(rule) {
  return SECTIONS.map(([key, title]) => ({ key, title, body: (rule[key] || '').trim() })).filter(
    (s) => s.body && !EMPTY.test(s.body),
  )
}

export function ratingText(rule) {
  return rule.ratingCount > 0 && rule.rating > 0 ? rule.rating.toFixed(1) : ''
}

// 종목 아이콘이 있는 이름 (components/rule/sportIcons.js). 없는 이름이면 제목·큰 분류에서 찾고, 끝내 없으면 '기타'
const PICTURES = new Set(['간단', '검도', '균형', '근력', '기존 스포츠', '기타', '논리·추리력', '농구', '당구', '두뇌', '라크로스', '런닝', '미식축구', '배드민턴', '복싱', '볼링', '상식', '속도', '속도·반응', '수영', '순발력', '술게임', '신체', '심리·블러핑', '심폐지구력', '아이스브레이킹', '암기력', '야구', '유도', '유연성', '전략·계획', '정확성', '즉흥 공연', '창의성', '축구', '커플 게임', '크로스핏', '클라이밍', '탁구', '태권도', '테니스', '펜싱', '표현력'])
// 종목 이름이 제목에만 있는 규칙(예: '탁구 11점')을 위해 제목 안에서도 찾는다. 분류 이름(두뇌·신체 ...)은 빼고
const CATEGORY_LEVEL = new Set(['기존 스포츠', '두뇌', '신체', '기타', '간단'])

// 종목 이름 고르기: 세부 종목 → 제목 → 큰 분류 → 기타 순서 (아이콘·그림이 있는 이름 중에서)
export function categoryKey(rule) {
  const exact = [rule?.minorCategory, rule?.ruleTitle, rule?.majorCategory]
    .map((n) => n?.trim())
    .find((n) => n && PICTURES.has(n))
  const inTitle = !exact && rule?.ruleTitle
    ? [...PICTURES].find((n) => !CATEGORY_LEVEL.has(n) && rule.ruleTitle.includes(n))
    : null
  return exact || inTitle || '기타'
}


/** 이름 아래 한 줄의 종류: 분류한 규칙은 바탕 종목 · 능력, 아직이면 예전 종목 분류 (docs/direction.md '카테고리') */
export function ruleKind(rule, withMajor = false) {
  const c = rule?.category
  const parts = c ? [c.sport, ...c.abilities.map((a) => a.label)] : [withMajor && rule?.majorCategory, rule?.minorCategory]
  return parts.filter(Boolean).join(' · ')
}
