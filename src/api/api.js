import axios from 'axios'

let routerInstance = null

export const setRouter = (router) => {
  routerInstance = router
}

const isVercel = window.location.hostname.endsWith('.vercel.app');

const api = axios.create({
  baseURL: isVercel
    ? 'https://raspy-be.shop'  // 배포된 버셀에서 호출할 때
    : ''                        // 로컬 개발 (devServer.proxy 이용)
    ,
    withCredentials: true
  });
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
]


api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {    
      const requestURL = error.config.url

      const isExcluded = excludeLoginRedirectURLs.some(excludedPath =>
        requestURL.includes(excludedPath)
      )

      if (!isExcluded) {
        alert("로그인이 필요한 서비스입니다.\n로그인 페이지로 이동합니다.")
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
