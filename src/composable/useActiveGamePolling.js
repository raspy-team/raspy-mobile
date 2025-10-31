/**
 * 진행 중인 게임 폴링 서비스
 * 5초마다 서버에서 내가 참여 중인 게임을 확인하고
 * 게임이 시작되면 알림을 표시합니다.
 */

import { ref } from 'vue'
import api from '../api/api'

const POLLING_INTERVAL = 5000 // 5초

// 전역 상태 (모든 컴포넌트가 공유)
const activeGame = ref(null)
const pendingReviewGameIds = ref([])
const isPolling = ref(false)
const dismissedGameIds = ref(new Set()) // 사용자가 거부한 게임 ID들
let pollingTimer = null

export function useActiveGamePolling() {
  // API 호출 함수
  const checkActiveGame = async (currentPath) => {
    try {
      const response = await api.get('/api/games/active/my')
      const data = response.data
      console.log('🎮 Active game data:', data)

      // pendingReviewGameIds 업데이트
      if (data.pendingReviewGameIds && Array.isArray(data.pendingReviewGameIds)) {
        pendingReviewGameIds.value = data.pendingReviewGameIds
      } else {
        pendingReviewGameIds.value = []
      }

      const game = data.activeGame

      // 새로운 게임이 감지되었는지 확인
      if (game && game.gameId) {
        // 현재 해당 게임의 플레이 화면에 있는지 확인
        if (currentPath && currentPath.includes(`/games/${game.gameId}/play`)) {
          console.log('🎮 Already on game play screen, auto-dismissing:', game.gameId)
          dismissedGameIds.value.add(game.gameId)
          return
        }

        // 사용자가 이미 거부한 게임인지 확인
        if (dismissedGameIds.value.has(game.gameId)) {
          console.log('🎮 Game already dismissed:', game.gameId)
          return
        }

        // 이전에 감지한 게임과 같은지 확인 (중복 알림 방지)
        if (!activeGame.value || activeGame.value.gameId !== game.gameId) {
          console.log('🎮 New active game detected:', game)
          activeGame.value = game
        }
      } else {
        // 진행 중인 게임이 없음
        if (activeGame.value) {
          console.log('🎮 Active game ended')
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
    console.log('🎮 Active game polling started')

    // 즉시 한 번 실행
    checkActiveGame(getCurrentPath ? getCurrentPath() : null)

    // 5초마다 반복
    pollingTimer = setInterval(() => {
      checkActiveGame(getCurrentPath ? getCurrentPath() : null)
    }, POLLING_INTERVAL)
  }

  const stopPolling = () => {
    if (pollingTimer) {
      clearInterval(pollingTimer)
      pollingTimer = null
    }
    isPolling.value = false
    console.log('🎮 Active game polling stopped')
  }

  // 게임 알림 해제 (사용자가 "참여하지 않을래요" 선택 시 또는 참여 시)
  const dismissActiveGame = () => {
    if (activeGame.value?.gameId) {
      console.log('🎮 Dismissing game:', activeGame.value.gameId)
      dismissedGameIds.value.add(activeGame.value.gameId)
      activeGame.value = null
    }
  }

  return {
    activeGame,
    pendingReviewGameIds,
    isPolling,
    startPolling,
    stopPolling,
    dismissActiveGame,
  }
}
