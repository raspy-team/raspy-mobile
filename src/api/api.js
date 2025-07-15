import axios from 'axios'

let routerInstance = null

export const setRouter = (router) => {
  routerInstance = router
}

const isVercel = window.location.hostname.endsWith('.vercel.app')

const api = axios.create({
  baseURL: isVercel ? 'https://raspy-be.shop' : '',
  withCredentials: true
})

// 요청 인터셉터: 토큰 자동 포함
api.interceptors.request.use(config => {
  const token = localStorage.getItem('raspy_access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, error => {
  return Promise.reject(error)
})

const excludeLoginRedirectURLs = [
  '/api/games/in-progress',
  '/api/auth/login',
]

// 응답 인터셉터: 401 처리 + 503 재시도
api.interceptors.response.use(
  response => response,
  async error => {
    const { config, response } = error

    // 503 재시도 로직
    if (response?.status === 503) {
      config.__retryCount = config.__retryCount || 0
      if (config.__retryCount < 3) {
        config.__retryCount += 1
        await new Promise(resolve => setTimeout(resolve, 500))  // 0.5초 대기
        return api(config)  // 재요청
      }
    }

    // 401 로그인 처리
    if (response?.status === 401) {
      const requestURL = config.url
      const isExcluded = excludeLoginRedirectURLs.some(excludedPath =>
        requestURL.includes(excludedPath)
      )

      if (!isExcluded) {
        localStorage.removeItem('raspy_access_token')
        if (routerInstance) {
          routerInstance.push('/login')
        } else {
          window.location.href = '/login'
        }
      }
    }

    return Promise.reject(error)
  }
)

export default api
