// 경기가 끝난 순간의 말. 이긴 쪽만 축하하고 진 쪽을 회색으로 두지 않는다 (docs/essence.md: 지면 낙오가 아니라 다음 판)
export const NEXT_ROUND: Record<string, string> = {
  LOSE: '진 판도 기록이에요. 다음 판에서 갚아요',
  DRAW: '승부는 다음 판에서 가려요',
}
