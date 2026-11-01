import { createApp } from 'vue'
import UiIcon from './components/ui/UiIcon.vue'
import App from './App.vue'
import './assets/tailwind.css'
import router from './router/router.js'
import  { setRouter } from './api/api'
import autocomplete from './utils/autocomplete'

import DefaultAvatar from './assets/default.png'
import { useToast } from './composable/useToast'

setRouter(router) // api.js에 router 주입

// 장소 자동완성(Google Places). 키가 있을 때만 불러온다. 쓰는 쪽은 window.google이 생겼는지 확인한다
const placesKey = import.meta.env.VUE_APP_GOOGLE_PLACES_API_KEY
if (placesKey) {
  const script = document.createElement('script')
  script.src = `https://maps.googleapis.com/maps/api/js?key=${placesKey}&libraries=places&language=ko`
  script.async = true
  document.head.appendChild(script)
}

// 깨진 이미지가 alt 글자로 화면에 새지 않게: 동그란 프로필 이미지는 기본 아바타로, 나머지는 자리까지 접는다
window.addEventListener(
  'error',
  (e) => {
    const img = e.target
    if (!(img instanceof HTMLImageElement) || img.dataset.fallback) return
    img.dataset.fallback = '1'
    img.alt = ''
    if (img.classList.contains('rounded-full')) img.src = DefaultAvatar
    else img.style.display = 'none'
  },
  true,
)

// 브라우저 기본 알림창("…vercel.app 내용:")은 흐름을 끊는다. 앱 안의 한 줄 알림으로 바꾼다
const { showToast } = useToast()
window.alert = (msg) => showToast(msg)

const app = createApp(App)
// 아이콘은 어디서나 쓰므로 화면마다 불러오지 않게 앱 전체에 등록한다
app.component('UiIcon', UiIcon)

// 운영 에러 추적. VITE_SENTRY_DSN이 있을 때만 켠다
// 켤 때만 불러와서 첫 화면 번들에 싣지 않는다
if (import.meta.env.VITE_SENTRY_DSN) {
  import('@sentry/vue').then((Sentry) =>
    Sentry.init({
      app,
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      integrations: [Sentry.browserTracingIntegration({ router })],
      tracesSampleRate: 0.1,
    }),
  )
}

app
  .use(router) 
  .directive('autocomplete', autocomplete)
  .mount('#app')