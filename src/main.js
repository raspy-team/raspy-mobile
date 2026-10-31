import { createApp } from 'vue'
import App from './App.vue'
import './assets/tailwind.css'
import router from './router/router.js'
import  { setRouter } from './api/api'
import autocomplete from './utils/autocomplete'

import DefaultAvatar from './assets/default.png'
import { useToast } from './composable/useToast'

setRouter(router) // api.js에 router 주입

// 깨진 이미지가 alt 글자로 화면에 새지 않게: 동그란 프로필 이미지는 기본 아바타로, 나머지는 숨긴다
window.addEventListener(
  'error',
  (e) => {
    const img = e.target
    if (!(img instanceof HTMLImageElement) || img.dataset.fallback) return
    img.dataset.fallback = '1'
    img.alt = ''
    if (img.classList.contains('rounded-full')) img.src = DefaultAvatar
    else img.style.visibility = 'hidden'
  },
  true,
)

// 브라우저 기본 알림창("…vercel.app 내용:")은 흐름을 끊는다. 앱 안의 한 줄 알림으로 바꾼다
const { showToast } = useToast()
window.alert = (msg) => showToast(msg)

createApp(App)
  .use(router) 
  .directive('autocomplete', autocomplete)
  .mount('#app')