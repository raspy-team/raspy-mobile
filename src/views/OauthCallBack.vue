<template>
  <div class="min-h-dvh bg-canvas flex items-center justify-center">
    <UiSpinner size="lg" class="text-fg-muted" label="로그인 중" />
  </div>
</template>

<script setup>
// 소셜 로그인에서 돌아오는 곳(/oauth/callback?token=). 토큰만 저장하고 넘긴다
// 약관·첫 설정이 남았으면 라우터 가드가 /welcome으로 보낸다
import { onMounted } from 'vue'
import { UiSpinner } from '../components/ui'
import { useRoute, useRouter } from 'vue-router'
import { takeReturnTo } from '../utils/authRedirect'
import { registerFcmToken } from '../utils/nativeBridge'
import { trackVisit } from '../utils/visit'

const route = useRoute()
const router = useRouter()

onMounted(() => {
  // 토큰은 주소 뒤 #에 온다(방문 기록·서버 로그에 남지 않게). 예전 앱은 ?token=으로 보낸다
  const hash = new URLSearchParams(window.location.hash.slice(1))
  const fromUrl = hash.get('token') || route.query.token
  if (fromUrl) {
    localStorage.setItem('raspy_access_token2', fromUrl)
    window.history.replaceState(null, '', window.location.pathname) // 주소창에서 토큰을 지운다
  }
  const token = localStorage.getItem('raspy_access_token2')
  if (!token) return router.replace('/init')
  registerFcmToken(token)
  trackVisit() // 로그인 전에 남긴 방문에 이 사람을 붙인다
  router.replace(takeReturnTo() || '/')
})
</script>
