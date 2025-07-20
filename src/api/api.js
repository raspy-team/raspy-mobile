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


export default api
