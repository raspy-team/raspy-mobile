// 인스타 스토리 그림 맨 위의 한 줄. 보내는 사람의 입으로 쓴다 (product/growth/viral-structures-adoption.md 3절 ①)
// 이기면 자랑, 아깝게 지면 다음 사람에게 넘기고, 크게 지면 무리를 부른다. 선수가 아닌 사람이 보내면 담담하게.
// 말투(11/12 고병연): 스토리는 선후배·어른도 본다. 도발("너는?", "이길 사람?") 대신 침착맨처럼 — 이기면 겸손하게 웃기고,
// 지면 담담하게 인정하고, 남에게 부탁할 때는 높인다("~실 분")

/** 앱 대결에서 이 비율 안으로 지면 '아깝게' (87 대 81이면 7%) */
const CLOSE_APP = 0.1
/** 만나서 한 경기에서 이 점수 차 안으로 지면 '아깝게' */
const CLOSE_MEET = 2

export function storyLine(post: any, myId: number | null): string {
  const players: { id: number; name?: string }[] = post?.players || []
  const me = myId == null ? -1 : players.findIndex((p) => p.id === myId)

  if (post?.appDuel) {
    const d = post.appDuel
    if (me < 0 || me > 1) return '재밌는 판이 있어서 올려 봄'
    if (d.winnerId == null) return '비겼다. 결판은 다음 판에'
    if (d.winnerId === myId) return '이겼다. 운이 좀 좋았음'
    const [a, b] = (d.scores || []) as (number | null)[]
    const mine = me === 0 ? a : b
    const other = me === 0 ? b : a
    if (mine != null && other != null) {
      const diff = Math.abs(mine - other)
      const top = Math.max(Math.abs(mine), Math.abs(other))
      // 점수 차는 그림 속 카드에 있다. 단위가 '타/분'처럼 어색해서 숫자는 줄에 넣지 않는다
      if (top > 0 && diff / top <= CLOSE_APP) return '아깝게 졌다. 복수해 주실 분'
    }
    return '졌다. 할 말이 없다. 도와주실 분'
  }

  const r = post?.result || {}
  // 셋 이상이 각자: 등수
  const ranking: { id: number; place: number }[] = r.ranking || []
  if (ranking.length) {
    const mine = ranking.find((x) => x.id === myId)
    if (!mine) return '재밌는 판이 있어서 올려 봄'
    return mine.place === 1 ? '1등 했다. 별일이 다 있다' : `${mine.place}등. 다음엔 잘해 보겠습니다`
  }
  if (me < 0) return '재밌는 판이 있어서 올려 봄'
  // 팀 경기는 선수 목록이 [앞 팀..., 뒤 팀...]
  const half = r.sideNames?.length === 2 ? players.length / 2 : 1
  const mySide = me < half ? 0 : 1
  if (r.winner == null) return '비겼다. 결판은 다음 판에'
  const winSide = r.sideNames ? r.sideNames.indexOf(r.winner) : players.findIndex((x) => x.name === r.winner)
  if (winSide === mySide) return '이겼다. 운이 좀 좋았음'
  if (r.scoreA != null && r.scoreB != null && Math.abs(r.scoreA - r.scoreB) <= CLOSE_MEET) return '아깝게 졌다. 복수해 주실 분'
  return '졌다. 할 말이 없다. 도와주실 분'
}
