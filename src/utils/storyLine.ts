// 인스타 스토리 그림 맨 위의 한 줄. 보내는 사람의 입으로 쓴다 (product/growth/viral-structures-adoption.md 3절 ①)
// 이기면 자랑, 지면 다음 사람에게 넘긴다(아깝게 졌든 크게 졌든 같은 말, 11/12 고병연). 선수가 아닌 사람이 보내면 담담하게

export function storyLine(post: any, myId: number | null): string {
  const players: { id: number; name?: string }[] = post?.players || []
  const me = myId == null ? -1 : players.findIndex((p) => p.id === myId)

  if (post?.appDuel) {
    const d = post.appDuel
    if (me < 0 || me > 1) return '한 판 끝. 너도 붙어 볼래?'
    if (d.winnerId == null) return '비김. 다시 붙자'
    if (d.winnerId === myId) return '이김. 너는?'
    return '졌다. 누가 대신 이겨 줘'
  }

  const r = post?.result || {}
  // 셋 이상이 각자: 등수
  const ranking: { id: number; place: number }[] = r.ranking || []
  if (ranking.length) {
    const mine = ranking.find((x) => x.id === myId)
    if (!mine) return '한 판 끝. 너도 붙어 볼래?'
    return mine.place === 1 ? '1등. 너는?' : `${mine.place}등. 이길 사람?`
  }
  if (me < 0) return '한 판 끝. 너도 붙어 볼래?'
  // 팀 경기는 선수 목록이 [앞 팀..., 뒤 팀...]
  const half = r.sideNames?.length === 2 ? players.length / 2 : 1
  const mySide = me < half ? 0 : 1
  if (r.winner == null) return '비김. 다시 붙자'
  const winSide = r.sideNames ? r.sideNames.indexOf(r.winner) : players.findIndex((x) => x.name === r.winner)
  if (winSide === mySide) return '이김. 너는?'
  return '졌다. 누가 대신 이겨 줘'
}
