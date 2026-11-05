// 순위는 겨룬 사람이 이만큼 있을 때만 보인다. 혼자 1위('1위 / 1명')는 뜻이 없다 (UX 리뷰 ⑥)
export const MIN_RANKED = 3
export const showRank = (rank, people) => !!rank && (people || 0) >= MIN_RANKED
