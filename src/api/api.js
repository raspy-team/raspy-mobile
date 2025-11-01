import axios from 'axios'

let routerInstance = null

export const setRouter = (router) => {
  routerInstance = router
}

const getBaseURL = () => {
  if (process.env.VUE_APP_ENV === 'prod') {
    return 'https://raspy-be.shop'
  } else if (process.env.VUE_APP_ENV === 'dev') {
    return 'http://localhost:8080'
  }
  // 기본값은 dev
  return 'http://localhost:8080'
}

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true
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
  response => response,
  async error => {
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
    if (currentPath && currentPath.startsWith('/invite-fall-back/')) {
        return Promise.reject(error)
    }

    // 그 외 401은 기존대로 처리
    localStorage.removeItem('raspy_access_token2')
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
