// '찾기' 화면 맨 위 한 줄. 매치의 목소리(docs/essence.md 6절 '대중의 말로', product/growth/messages.md)를
// 앱 안으로 들인다. 하루에 하나씩 돌고, mark 낱말에 형광펜. 아직 없는 기능을 약속하는 말은 넣지 않는다
export type BrandLine = { before: string; mark: string; after: string }

const LINES: BrandLine[] = [
  { before: '할 말 없어도 괜찮아요. ', mark: '한 판', after: '이면 충분하니까요' },
  { before: '오늘은 보는 거 말고, ', mark: '하는 거', after: '' },
  { before: '나이도 직함도 떼고, ', mark: '한 판', after: '' },
  { before: '오늘은 어디서 ', mark: '한 판', after: ' 붙어 볼까요?' },
  { before: '다 잘할 필요 없어요. ', mark: '하나', after: '만 잘하면 돼요' },
  { before: '어딘가엔 내가 ', mark: '1등', after: '인 게임이 있어요' },
  { before: '이기려면 ', mark: '상대', after: '가 있어야 해요' },
]

/** 오늘의 한 줄 (날짜로 고른다: 하루 동안 같은 말) */
export function todayBrandLine(now = new Date()): BrandLine {
  const day = Math.floor((now.getTime() - now.getTimezoneOffset() * 60000) / 86400000)
  return LINES[day % LINES.length]
}
