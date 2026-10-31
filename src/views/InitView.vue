<template>
  <div class="min-h-dvh bg-canvas flex flex-col pt-safe pb-safe">
    <main class="flex-1 w-full max-w-md mx-auto px-6 flex flex-col">
      <!-- 무슨 앱인지 -->
      <div class="flex-1 flex flex-col justify-center py-10">
        <p class="text-primary font-bold text-lg tracking-tight">Match</p>
        <h1 class="t-display mt-3">오늘 한 판,<br />붙어볼래요?</h1>
        <p class="t-body text-fg-muted mt-3">종목과 규칙을 정하고, 상대를 찾고, 점수를 남겨요.</p>

        <ul class="mt-10 space-y-5">
          <li v-for="f in FEATURES" :key="f.title" class="flex items-start gap-4">
            <span class="w-10 h-10 rounded-xl bg-surface-2 text-fg flex items-center justify-center flex-shrink-0" aria-hidden="true">
              <i :class="f.icon"></i>
            </span>
            <span>
              <span class="block t-heading">{{ f.title }}</span>
              <span class="block t-caption mt-0.5">{{ f.body }}</span>
            </span>
          </li>
        </ul>
      </div>

      <!-- 시작 -->
      <div class="pb-6 space-y-2">
        <UiButton v-if="isAndroidApp" block size="lg" variant="secondary" :loading="pending === 'google'" @click="loginWith('google')">
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M12 11.99v2.98h4.21c-.18 1.12-.83 2.07-1.78 2.71v2.26h2.88c1.69-1.56 2.67-3.86 2.67-6.61 0-.55-.05-1.09-.14-1.61H12z"/>
            <path fill="#34A853" d="M12 21c2.43 0 4.47-.8 5.96-2.15l-2.88-2.26c-.8.54-1.81.86-3.08.86-2.37 0-4.38-1.6-5.1-3.76H3.9v2.36C5.39 18.97 8.45 21 12 21z"/>
            <path fill="#FBBC05" d="M6.9 13.69a5.997 5.997 0 0 1 0-3.38V7.95H3.9a9.003 9.003 0 0 0 0 8.1l3-2.36z"/>
            <path fill="#EA4335" d="M12 6.58c1.32 0 2.5.45 3.43 1.33l2.57-2.57C16.46 3.83 14.42 3 12 3 8.45 3 5.39 5.03 3.9 7.95l3 2.36C7.62 8.18 9.63 6.58 12 6.58z"/>
          </svg>
          Google로 시작하기
        </UiButton>
        <UiButton v-if="isIosApp" block size="lg" variant="secondary" icon="fab fa-apple" :loading="pending === 'apple'" @click="loginWith('apple')">
          Apple로 시작하기
        </UiButton>
        <UiButton block size="lg" :variant="hasSocial ? 'secondary' : 'primary'" to="/group/login?mode=signup">
          {{ hasSocial ? '아이디로 시작하기' : '시작하기' }}
        </UiButton>
        <UiButton block variant="ghost" to="/group/login">이미 계정이 있어요</UiButton>

        <p class="pt-2 text-center t-micro">
          <button type="button" class="underline underline-offset-2 px-1 py-2" @click="openTerm = TERMS[0]">{{ TERMS[0].title }}</button>
          ·
          <button type="button" class="underline underline-offset-2 px-1 py-2" @click="openTerm = TERMS[1]">{{ TERMS[1].title }}</button>
        </p>
      </div>
    </main>

    <UiSheet :model-value="!!openTerm" :title="openTerm?.title" @update:model-value="openTerm = null">
      <p class="t-caption whitespace-pre-line">{{ openTerm?.body.trim() }}</p>
    </UiSheet>
  </div>
</template>

<script setup>
// 시작 화면: 무슨 앱인지 한눈에 + 시작하기. 약관 동의는 가입 뒤 /welcome에서 받는다
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { API_BASE_URL } from '@/config/server'
import { TERMS } from '../content/legal'
import { UiButton, UiSheet } from '../components/ui'
import { useToast } from '../composable/useToast'
import { takeReturnTo } from '../utils/authRedirect'
import { isAndroidApp, isIosApp } from '../utils/nativeBridge'

const FEATURES = [
  { icon: 'fas fa-user-group', title: '상대 찾기', body: '열린 경기에 신청하거나, 규칙을 골라 직접 열어요' },
  { icon: 'fas fa-stopwatch', title: '점수는 앱으로', body: '둘이 같은 화면을 보며 세트·점수·시간을 기록해요' },
  { icon: 'fas fa-crown', title: '기록이 쌓여요', body: '규칙마다 레이팅과 랭킹, 챔피언이 있어요' },
]

const router = useRouter()
const { showToast } = useToast()
const openTerm = ref(null)
const pending = ref('')
const hasSocial = isAndroidApp || isIosApp

if (localStorage.getItem('raspy_access_token2')) router.replace('/')

function loginWith(provider) {
  pending.value = provider
  if (provider === 'apple') {
    if (isIosApp) window.webkit?.messageHandlers?.iosBridge?.postMessage({ action: 'appleLogin' })
    else {
      pending.value = ''
      showToast('Apple 로그인은 iOS 앱에서 할 수 있어요')
    }
  } else if (provider === 'google' && window.AndroidApp?.loginWithGoogle) {
    window.AndroidApp.loginWithGoogle()
  } else {
    window.location.href = `${API_BASE_URL}/oauth2/authorization/${provider}`
  }
}

// 앱의 소셜 로그인이 끝나면 앱이 부른다. 첫 설정이 남았으면 라우터 가드가 /welcome으로 보낸다
function onNativeLogin({ token }) {
  localStorage.setItem('raspy_access_token2', token)
  window.location.href = takeReturnTo() || '/'
}
window.onKakaoLoginSuccess = onNativeLogin
window.onGoogleLoginSuccess = onNativeLogin
</script>
