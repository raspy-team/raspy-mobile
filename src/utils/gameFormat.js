// 누가 겨루나: 1:1(DUEL), 팀 대 팀(TEAMS), 셋 이상이 각자(FREE_FOR_ALL). 서버 GameFormat과 같은 값
export const FORMATS = [
  { value: 'DUEL', label: '1:1', description: '한 사람과 겨뤄요' },
  { value: 'TEAMS', label: '팀 대 팀', description: '두 팀으로 나눠 겨뤄요. 팀원 모두 실력 점수가 바뀌어요' },
  { value: 'FREE_FOR_ALL', label: '여럿이 각자', description: '셋 이상이 각자 겨뤄 등수를 매겨요' },
]

// 팀 경기는 팀마다 몇 명 (2:2 ~ 11:11), 각자 경기는 모두 몇 명 (3 ~ 12). 서버 TEAM_PLAYERS·FREE_FOR_ALL_PLAYERS와 맞춘다
export const TEAM_SIZES = [2, 3, 4, 5, 6, 11]
export const GROUP_SIZES = [3, 4, 5, 6, 8, 10, 12]

// 규칙의 '몇 명' 분류로 열 수 있는 형식. 아직 분류하지 않은 규칙은 모두 연다 (서버 allowsFormat과 같다)
export function allowedFormats(rule) {
  const parties = (rule?.category?.parties || []).map((p) => p.key)
  if (!parties.length) return FORMATS
  return FORMATS.filter((f) => f.value === 'DUEL'
    || (f.value === 'TEAMS' && parties.includes('TEAM'))
    || (f.value === 'FREE_FOR_ALL' && parties.includes('GROUP')))
}

// "2:2", "셋이서" 같은 짧은 이름
export function formatLabel(format, maxPlayers) {
  if (format === 'TEAMS') return `${maxPlayers / 2}:${maxPlayers / 2}`
  if (format === 'FREE_FOR_ALL') return `${maxPlayers}명이 각자`
  return '1:1'
}

export const TEAM_NAMES = ['A팀', 'B팀']

// 앱 밖 경기를 어디서 하나 (서버 GameVenue). 화상·다른 게임은 동네가 없고 어디서인지(디스코드 등)만 적는다
export const VENUES = [
  { value: 'IN_PERSON', label: '만나서', placeholder: '' },
  { value: 'VIDEO', label: '화상으로', placeholder: '예: 디스코드, 페이스타임' },
  { value: 'ONLINE', label: '다른 게임에서', placeholder: '예: 롤 사용자 설정 게임, 체스닷컴' },
]
export const isRemote = (venue) => !!venue && venue !== 'IN_PERSON'

// 카드에 보일 장소: 만나서는 장소, 화상·다른 게임은 "화상 · 디스코드"
export function venuePlace(game, place) {
  if (!isRemote(game?.venue)) return place(game?.matchLocation)
  const label = VENUES.find((v) => v.value === game.venue)?.label
  return game.matchLocation ? `${label} · ${game.matchLocation}` : label
}

/**
 * 팀 경기 단톡방이 열렸는지 (서버 TeamChatService.isOpen과 같은 기준): 1:1이 아니고, 승인된 사람이 둘 이상이고, 내가 그중 하나.
 * players는 승인된 사람 목록 (내 경기는 id, 경기 하나는 userId)
 */
export function teamChatOpen(game, myId) {
  if (!game || !game.format || game.format === 'DUEL' || game.gameStatus === 'DELETED') return false
  const ids = (game.players || []).map((p) => p.id ?? p.userId)
  return ids.length >= 2 && myId != null && ids.includes(myId)
}
