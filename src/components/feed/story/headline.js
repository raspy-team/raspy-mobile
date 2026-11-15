// 소식 카드에서 같은 사실을 두 번 말하지 않는다 (quality-rules S3-3).
// 이야기 줄(기록에서 뽑은 사실, 해요체)과 AI 기자 한 줄(기사체)이 같은 사실이면 기자 줄 하나를 제목으로 올리고 이야기 줄은 뺀다.
// 다른 사실이면 둘 다 둔다: 이야기 줄이 위, 기자 줄이 아래 (기자가 챔피언을 말하지 않았는데 이야기 줄을 빼면 '챔피언이 됐어요'가 사라진다)
const SAME = {
  CHAMPION: /챔피언/, STREAK: /연승/, STREAK_STOP: /연승/, FIRST_WIN: /첫 승/, CLOSE: /접전|차로/, COMEBACK: /역전|뒤집/, UPSET: /뒤집|이변/,
  RIVAL: /번째/, MILESTONE: /실력 점수/, PERSONAL_BEST: /최고/, FIRST_GAME: /첫 경기/,
}
/** 기자 줄이 제목 자리를 맡나 */
export function reporterIsHeadline(story) {
  const ai = story?.aiSummary
  const beat = story?.beats?.[0]
  if (!ai || story?.quotes?.length || !beat) return false
  return !!SAME[beat.kind]?.test(ai)
}
