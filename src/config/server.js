// 백엔드 주소. VUE_APP_API_URL이 있으면 그 값을 쓰고, 없으면 환경에 따라 기본값을 쓴다.
const PROD_API_URL = 'https://raspy-api.fly.dev'
const DEV_API_URL = 'http://localhost:8080'

export const API_BASE_URL = (
  import.meta.env.VUE_APP_API_URL ||
  (import.meta.env.VUE_APP_ENV === 'prod' ? PROD_API_URL : DEV_API_URL)
).replace(/\/$/, '')

// http → ws, https → wss
export const WS_URL = API_BASE_URL.replace(/^http/, 'ws') + '/ws'
