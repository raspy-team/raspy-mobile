// 아이폰 잠금화면·다이내믹 아일랜드 점수판 (Live Activity, ios/App/App/LiveActivity·ios/App/MatchLiveActivity).
// 경기 중 점수판(GamePlayView)이 켜고, 점수·세트가 바뀔 때마다 바꾸고, 경기가 끝나면 끈다.
// 잠금화면의 −1·+1은 앱이 뒤에 있어도 서버(POST /api/games/{id}/live-score)로 점수를 내므로, 로그인 토큰과 서버 주소를 함께 넘긴다
import { Capacitor, registerPlugin } from '@capacitor/core'
import { API_BASE_URL } from '../config/server'
import { isCapacitorApp, pushToken } from './nativeBridge'

const MatchLiveActivity = registerPlugin<any>('MatchLiveActivity')

/** 잠금화면 점수판이 든 아이폰 앱(빌드 4부터)인지 */
export const hasLiveActivity = isCapacitorApp && Capacitor.isPluginAvailable('MatchLiveActivity')

export type LiveScoreState = {
  setIndex: number
  score1: number
  score2: number
  sets1: number
  sets2: number
  /** 세트가 진행 중일 때만 잠금화면에 점수 버튼 */
  canScore: boolean
  /** 세트 시작 시각(ms) */
  setStartedAt?: number | null
}

export type LiveScoreGame = { gameId: number; title: string; user1Id: number; user2Id: number; name1: string; name2: string }

let started: number | null = null

/** 켜져 있지 않으면 켜고, 켜져 있으면 바꾼다. 실패는 조용히 넘긴다 (설정에서 실시간 현황을 끈 사람 등) */
export function liveSync(game: LiveScoreGame, state: LiveScoreState) {
  if (!hasLiveActivity) return
  const s = { ...state, setStartedAt: state.setStartedAt ?? undefined }
  if (started === game.gameId) {
    MatchLiveActivity.update({ gameId: game.gameId, ...s }).catch(() => null)
    return
  }
  started = game.gameId
  let token = ''
  try {
    token = localStorage.getItem('raspy_access_token2') || ''
  } catch {
    // 저장소를 못 읽으면 잠금화면 버튼만 안 된다
  }
  // fcmToken: 서버가 상대 폰의 점수를 이 잠금화면에 바로 보낼 때 쓴다 (FCM Live Activity 푸시는 앱의 FCM 토큰도 필요하다)
  MatchLiveActivity.start({ ...game, ...s, apiBase: API_BASE_URL, token, fcmToken: pushToken() || '' }).catch(() => {
    started = null
  })
}

export function liveEnd(gameId?: number) {
  if (!hasLiveActivity) return
  if (gameId == null || started === gameId) started = null
  MatchLiveActivity.end(gameId == null ? {} : { gameId }).catch(() => null)
}
