// '찾기' 화면 맨 위 한 줄. 매치의 목소리(docs/essence.md 6절 '대중의 말로', product/growth/messages.md)를
// 앱 안으로 들인다. 하루에 하나씩 돌고, mark 낱말에 형광펜. 아직 없는 기능을 약속하는 말은 넣지 않는다
export type BrandLine = { before: string; mark: string; after: string }

const LINES: BrandLine[] = [
  { before: '할 말 없어도 돼요. ', mark: '한 판', after: ' 하면 되니까' },
  { before: '보는 거 말고, ', mark: '하는 거', after: '' },
  { before: '계급장 떼고 ', mark: '한 판', after: '' },
  { before: '줄 말고 ', mark: '판', after: '. 오늘은 어디서 붙어 볼까요?' },
  { before: '육각형 말고, 뾰족한 ', mark: '꼭짓점 하나', after: '' },
  { before: '누구나 어딘가의 ', mark: '1등', after: '이에요' },
  { before: '매치에서 ', mark: '1등', after: '은 혼자 될 수 없어요' },
]

/** 오늘의 한 줄 (날짜로 고른다: 하루 동안 같은 말) */
export function todayBrandLine(now = new Date()): BrandLine {
  const day = Math.floor((now.getTime() - now.getTimezoneOffset() * 60000) / 86400000)
  return LINES[day % LINES.length]
}
