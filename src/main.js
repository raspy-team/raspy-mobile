import { createApp } from 'vue'
import UiIcon from './components/ui/UiIcon.vue'
// 설치 창 신호(beforeinstallprompt)는 앱이 뜨자마자 오므로 처음부터 듣는다
import './utils/install'
// 유입 측정: 첫 화면 주소(utm 꼬리표)를 라우터가 바꾸기 전에 잡는다
import { trackVisit, claimGuestPlays } from './utils/visit'
import App from './App.vue'
import './assets/tailwind.css'
import { followIosTextSize } from './utils/textSize'
import router from './router/router.js'
import { setupPushListeners } from './utils/nativeBridge'
// 알림을 눌러 앱이 켜졌을 때의 신호를 가장 먼저 받는다 (App이 뜨기 전, 11/6 b2). 앱이 아니면 아무것도 하지 않는다
setupPushListeners()
import  { setRouter } from './api/api'
import autocomplete from './utils/autocomplete'

import DefaultAvatar from './assets/default.png'
import { useToast } from './composables/useToast'

setRouter(router) // api.js에 router 주입
followIosTextSize() // 아이폰 글자 크기 설정을 따른다

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

trackVisit()
claimGuestPlays() // 가입 전 한 판을 하고 앱 로그인(새로 열림)으로 들어온 사람
