<template>
  <div class="min-h-dvh bg-canvas flex items-center justify-center">
    <span class="w-8 h-8 rounded-full border-2 border-line-strong border-t-primary animate-spin" role="status" aria-label="로그인 중"></span>
  </div>
</template>

<script setup>
// 소셜 로그인에서 돌아오는 곳(/oauth/callback?token=). 토큰만 저장하고 넘긴다
// 약관·첫 설정이 남았으면 라우터 가드가 /welcome으로 보낸다
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { takeReturnTo } from '../utils/authRedirect'
import { registerFcmToken } from '../utils/nativeBridge'

const route = useRoute()
const router = useRouter()

onMounted(() => {
  if (route.query.token) localStorage.setItem('raspy_access_token2', route.query.token)
  const token = localStorage.getItem('raspy_access_token2')
  if (!token) return router.replace('/init')
  registerFcmToken(token)
  router.replace(takeReturnTo() || '/')
})
</script>
