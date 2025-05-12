// src/api.js
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8080', // 백엔드 주소
  withCredentials: true, // 필요시 쿠키도 함께 보낼 수 있음
})

// 요청 인터셉터: 토큰 자동 포함
api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken') // 혹은 쿠키에서 읽어도 됨
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, error => {
  return Promise.reject(error)
})

export default api
