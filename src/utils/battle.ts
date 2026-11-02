// 실시간 대전 게임 (서버 AppGameSummary.battle과 같다). 대결 목록처럼 게임 정보가 없는 곳에서 화면 주소를 고를 때 쓴다
export const BATTLE_KEYS = new Set(['pong', 'shake'])

/** 실시간 게임의 화면: 대전은 /battle, 턴제는 /live */
export const liveRoute = (key: string) => `/play/${key}/${BATTLE_KEYS.has(key) ? 'battle' : 'live'}`
