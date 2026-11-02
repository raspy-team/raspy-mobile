// 누가 겨루나: 1:1(DUEL), 팀 대 팀(TEAMS), 셋 이상이 각자(FREE_FOR_ALL). 서버 GameFormat과 같은 값
export const FORMATS = [
  { value: 'DUEL', label: '1:1', description: '한 사람과 겨뤄요' },
  { value: 'TEAMS', label: '팀 대 팀', description: '두 팀으로 나눠 겨뤄요. 팀원 모두 레이팅이 바뀌어요' },
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
