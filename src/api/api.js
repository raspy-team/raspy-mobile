import { rememberReturnTo } from '../utils/authRedirect'
import axios from 'axios'
import { markServer } from '../stores/server'
import { API_BASE_URL } from '@/config/server'

let routerInstance = null

export const setRouter = (router) => {
  routerInstance = router
}

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  // 서버가 다시 켜지는 동안 요청이 끝없이 기다리지 않게 (배포 직후 등)
  timeout: 15000,
})

// 요청 인터셉터: 토큰 자동 포함
api.interceptors.request.use(config => {
  const token = localStorage.getItem('raspy_access_token2')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, error => {
  return Promise.reject(error)
})


api.interceptors.response.use(
  response => {
    markServer(null)
    return response
  },
  async error => {
    markServer(error)
    const config = error.config

    // 재시도 횟수 제한
    config.__retryCount = config.__retryCount || 0
    const maxRetries = 3

    const isRetryable503 =
      (error.response && error.response.status === 503) ||
      (error.code === 'ERR_FAILED' && error.message.includes('503'))

    if (isRetryable503 && config.__retryCount < maxRetries) {
      config.__retryCount += 1
      await new Promise(resolve => setTimeout(resolve, 500))
      return api(config)
    }

  // 428: 동네 인증이 필요하다 (경기 열기·신청). 내 동네 화면으로 보내고, 인증하면 보던 화면으로 돌아온다
  if (error.response && error.response.status === 428 && routerInstance) {
    const here = routerInstance.currentRoute.value
    if (here.path !== '/neighborhood') {
      routerInstance.push({ path: '/neighborhood', query: { back: here.fullPath, reason: error.response.data?.message } })
    }
  }

  // 만나서 하는 경기에 본인인증이 필요하다 (안전·신뢰 H, 서버 IdentityService.REQUIRED_MESSAGE). 인증 화면으로 보내고 끝나면 돌아온다
  if (error.response?.status === 400 && String(error.response.data?.message || '').includes('휴대폰 본인인증') && routerInstance) {
    const here = routerInstance.currentRoute.value
    if (here.path !== '/verify') routerInstance.push({ path: '/verify', query: { back: here.fullPath } })
  }

  // 401 처리
  if (error.response && error.response.status === 401) {
    // 요청 URL 추출
    const requestUrl = error.config && error.config.url

    // 현재 페이지 경로 확인
    const currentPath = window.location.pathname

    // /api/auth/login 또는 /invite-fall-back/ 페이지면 라우터 변경하지 않음
    if (requestUrl && requestUrl.includes('/api/auth/login')) {
        // 로그인 API에서 401은 라우터 변경하지 않음
        localStorage.removeItem('raspy_access_token2')
        return Promise.reject(error)
    }

    // /invite-fall-back/ 페이지에서의 모든 401은 무시
    if (currentPath && 
      currentPath.startsWith('/invite-fall-back/') || 
    currentPath.startsWith('/group/login'))  {
        return Promise.reject(error)
    }

    // 그 외 401은 시작 화면으로. 보던 주소는 기억해 두고 로그인 뒤 돌려보낸다
    localStorage.removeItem('raspy_access_token2')
    rememberReturnTo(routerInstance?.currentRoute.value.fullPath || window.location.pathname + window.location.search)
    if (routerInstance) {
      routerInstance.push('/init')
    } else {
      window.location.href = '/init'
    }
}

    return Promise.reject(error)
  }
)


// 나랑도해 API
export const playWithMeTooAPI = {
  // 나랑도해 요청 보내기
  async sendRequest(targetUserId, ruleId) {
    const response = await api.post('/api/play-with-me-too/request', null, {
      params: {
        targetUserId,
        ruleId
      }
    })
    return response.data
  },

  // 나랑도해 요청 취소
  async cancelRequest(targetUserId) {
    const response = await api.delete('/api/play-with-me-too/request', {
      params: { targetUserId }
    })
    return response.data
  },

  // 나랑도해 요청 수락
  async acceptRequest(requesterId) {
    const response = await api.post('/api/play-with-me-too/accept', null, {
      params: {
        requesterId
      }
    })
    return response.data
  },

  // 나랑도해 요청 거절
  async rejectRequest(requesterId) {
    const response = await api.post('/api/play-with-me-too/reject', null, {
      params: {
        requesterId
      }
    })
    return response.data
  },

  // 나랑도해 요청 확인
  async checkRequest(fromUserId) {
    const response = await api.get('/api/play-with-me-too/check-request', {
      params: { fromUserId }
    })
    return response.data
  },

  // 받은 요청들 조회
  async getReceivedRequests() {
    const response = await api.get('/api/play-with-me-too/received-requests')
    return response.data
  },

  // 보낸 요청들 조회
  async getSentRequests() {
    const response = await api.get('/api/play-with-me-too/sent-requests')
    return response.data
  },

  // 특정 유저와의 도전 상태 확인 (모든 상태 포함, 게임 정보 포함)
  async getStatusWithUser(otherUserId) {
    const response = await api.get('/api/play-with-me-too/status-with-user', {
      params: { otherUserId }
    })
    return response.data
  }
}

// 또 보고싶어요 API
export const likeAPI = {
  // 또 보고싶어요 토글
  async toggleLike(gameId) {
    const response = await api.post(`/api/games/${gameId}/like`)
    return response.data
  },

  // 좋아요 상태 조회
  async getLikeStatus(gameId) {
    const response = await api.get(`/api/games/${gameId}/like`)
    return response.data
  },

  // 좋아요한 사용자 전체 목록
  async getLikers(gameId) {
    const response = await api.get(`/api/games/${gameId}/like/users`)
    return response.data
  }
}

export default api
