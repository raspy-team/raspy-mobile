/**
 * 진행 중인 경기 감시
 * 처음 한 번 확인하고, 이후에는 서버의 "바뀜" 신호(내 채널)나 앱으로 돌아왔을 때만 다시 확인한다.
 * 경기가 시작되면 알림을 표시한다. (예전에는 5초마다 서버에 물었다)
 */

import { ref } from 'vue'
import api from '../api/api'
import { openUserChannel, refreshOnChange } from '../websocket/userChannel'


// 전역 상태 (모든 컴포넌트가 공유)
const activeGame = ref(null)
const pendingReviewGameIds = ref([])
// 평가할 경기 { gameId, ruleTitle, opponentNickname } ('내 경기'의 할 일 줄)
const pendingReviews = ref([])
// 상대가 나를 기다리는 경기 수 (결과 확인·신청 승인). 하단 '내 경기' 탭에 숫자로
const waitingOnMeCount = ref(0)
const isPolling = ref(false)
const dismissedGameIds = ref(new Set()) // 사용자가 거부한 게임 ID들
let stopWatching = null

export function useActiveGamePolling() {
  // API 호출 함수
  const checkActiveGame = async (currentPath) => {
    try {
      const response = await api.get('/api/games/active/my')
      const data = response.data
      // pendingReviewGameIds 업데이트
      if (data.pendingReviewGameIds && Array.isArray(data.pendingReviewGameIds)) {
        pendingReviewGameIds.value = data.pendingReviewGameIds
      } else {
        pendingReviewGameIds.value = []
      }

      waitingOnMeCount.value = data.waitingOnMeCount || 0
      pendingReviews.value = data.pendingReviews || []

      const game = data.activeGame

      // 새로운 게임이 감지되었는지 확인
      if (game && game.gameId) {
        // 현재 해당 게임의 플레이 화면에 있는지 확인
        if (currentPath && currentPath.includes(`/games/${game.gameId}/play`)) {
          dismissedGameIds.value.add(game.gameId)
          return
        }

        // 사용자가 이미 거부한 게임인지 확인
        if (dismissedGameIds.value.has(game.gameId)) {
          return
        }

        // 이전에 감지한 게임과 같은지 확인 (중복 알림 방지)
        if (!activeGame.value || activeGame.value.gameId !== game.gameId) {
          activeGame.value = game
        }
      } else {
        // 진행 중인 게임이 없음
        if (activeGame.value) {
          activeGame.value = null
        }
      }
    } catch (error) {
      // 401 Unauthorized 등의 경우 로그인되지 않은 상태
      if (error.response?.status === 401) {
        stopPolling()
      } else {
        console.error('Failed to check active game:', error)
      }
    }
  }

  const startPolling = (getCurrentPath) => {
    if (isPolling.value) return // 이미 폴링 중이면 무시

    isPolling.value = true
    const check = () => checkActiveGame(getCurrentPath ? getCurrentPath() : null)
    check()
    openUserChannel()
    stopWatching = refreshOnChange(check)
  }

  const stopPolling = () => {
    if (stopWatching) {
      stopWatching()
      stopWatching = null
    }
    isPolling.value = false
  }

  // 게임 알림 해제 (사용자가 "참여하지 않을래요" 선택 시 또는 참여 시)
  const dismissActiveGame = () => {
    if (activeGame.value?.gameId) {
      dismissedGameIds.value.add(activeGame.value.gameId)
      activeGame.value = null
    }
  }

  return {
    activeGame,
    pendingReviewGameIds,
    waitingOnMeCount,
    pendingReviews,
    isPolling,
    startPolling,
    stopPolling,
    dismissActiveGame,
  }
}
