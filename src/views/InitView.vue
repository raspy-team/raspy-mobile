<template>
  <div class="min-h-dvh bg-canvas flex flex-col pt-safe pb-safe">
    <main class="flex-1 w-full max-w-md mx-auto px-6 flex flex-col">
      <!-- 무슨 앱인지 -->
      <div class="flex-1 flex flex-col justify-center py-10">
        <BrandMark size="22px" />
        <!-- 링크로 들어온 사람: 무엇에 불려 왔는지 먼저 (인스타 게임 링크, 친구의 도전장). 가입하면 그 화면으로 돌아간다 -->
        <UiCard v-if="landing" class="mt-8">
          <p class="t-caption">받은 링크</p>
          <p class="t-title mt-1">{{ landing.title }}</p>
          <p class="t-caption mt-1">{{ landing.line }}</p>
          <p class="t-caption text-fg mt-3">시작하면 바로 이어서 해요</p>
        </UiCard>
        <h1 class="t-display text-[44px] mt-10">오늘 <span class="hl hl-draw">한 판</span>,<br />붙어볼래요?</h1>
        <p class="t-body text-fg-muted mt-4 max-w-[28ch]">종목과 규칙을 정하고, 상대를 찾고, 점수를 남겨요.</p>

        <!-- 아이콘 상자 대신 번호와 글자로 (장식보다 내용) -->
        <!-- 링크로 온 사람은 하려던 것이 있으니 소개를 접어 시작 버튼이 한 화면에 들어오게 -->
        <ol v-if="!landing" class="mt-12 border-t border-line">
          <li v-for="(f, i) in FEATURES" :key="f.title" class="flex items-baseline gap-4 py-4 border-b border-line">
            <span class="t-mono w-6 flex-shrink-0">{{ String(i + 1).padStart(2, '0') }}</span>
            <span>
              <span class="block text-[0.9375rem] font-semibold text-fg tracking-[-0.02em]">{{ f.title }}</span>
              <span class="block t-caption mt-0.5">{{ f.body }}</span>
            </span>
          </li>
        </ol>
      </div>

      <!-- 시작: 소셜 로그인이 곧 가입이다 (따로 가입 화면 없음). 버튼은 서버에 키가 있는 것만 -->
      <div class="pb-6 space-y-2">
        <p v-if="loginError" class="t-caption text-danger-fg text-center pb-2" role="alert">{{ loginError }}</p>
        <p v-if="anySocial" class="t-caption text-center pb-1">가입 절차 없이 <b class="text-fg">1초 만에</b> 시작해요</p>

        <!-- 카카오: 카카오 버튼 규칙(노란 바탕 #FEE500, 말풍선, 검정 85%) -->
        <button
          v-if="show.kakao"
          type="button"
          class="w-full h-14 rounded-xl flex items-center justify-center gap-2 text-[0.9375rem] font-semibold disabled:opacity-60"
          style="background:#FEE500;color:rgba(0,0,0,.85)"
          :disabled="!!pending"
          @click="loginWith('kakao')"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="#000" d="M12 3C6.48 3 2 6.58 2 11c0 2.85 1.86 5.35 4.66 6.76-.2.74-.74 2.7-.85 3.12-.13.52.19.51.4.37.17-.11 2.6-1.77 3.66-2.49.7.1 1.41.15 2.13.15 5.52 0 10-3.58 10-8S17.52 3 12 3z"/></svg>
          카카오로 계속하기
        </button>

        <!-- 구글: 흰 바탕 + 색 G (구글 버튼 규칙) -->
        <button
          v-if="show.google"
          type="button"
          class="w-full h-14 rounded-xl flex items-center justify-center gap-2 text-[0.9375rem] font-semibold bg-white text-[#1f1f1f] border border-[#dadce0] disabled:opacity-60"
          :disabled="!!pending"
          @click="loginWith('google')"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M12 11.99v2.98h4.21c-.18 1.12-.83 2.07-1.78 2.71v2.26h2.88c1.69-1.56 2.67-3.86 2.67-6.61 0-.55-.05-1.09-.14-1.61H12z"/>
            <path fill="#34A853" d="M12 21c2.43 0 4.47-.8 5.96-2.15l-2.88-2.26c-.8.54-1.81.86-3.08.86-2.37 0-4.38-1.6-5.1-3.76H3.9v2.36C5.39 18.97 8.45 21 12 21z"/>
            <path fill="#FBBC05" d="M6.9 13.69a5.997 5.997 0 0 1 0-3.38V7.95H3.9a9.003 9.003 0 0 0 0 8.1l3-2.36z"/>
            <path fill="#EA4335" d="M12 6.58c1.32 0 2.5.45 3.43 1.33l2.57-2.57C16.46 3.83 14.42 3 12 3 8.45 3 5.39 5.03 3.9 7.95l3 2.36C7.62 8.18 9.63 6.58 12 6.58z"/>
          </svg>
          Google로 계속하기
        </button>

        <!-- 애플 (Sign in with Apple HIG): 문구는 승인된 'Apple로 계속하기'만, 밝은 화면은 검정·어두운 화면은 흰 버튼
             (잉크 토큰 fg/canvas가 정확히 뒤집힌다). 크기는 다른 버튼과 같게. 웹은 OAUTH2_APPLE_SERVICES_ID를 넣으면 보인다 -->
        <button
          v-if="show.apple"
          type="button"
          class="w-full h-14 rounded-xl flex items-center justify-center gap-2 text-[0.9375rem] font-semibold bg-fg text-canvas disabled:opacity-60"
          :disabled="!!pending"
          @click="loginWith('apple')"
        >
          <UiIcon name="fab fa-apple" class="text-lg" aria-hidden="true" />
          Apple로 계속하기
        </button>

        <UiButton block size="lg" :variant="anySocial ? 'ghost' : 'primary'" to="/group/login?mode=signup" @click="tapId">
          {{ anySocial ? '아이디로 시작하기' : '시작하기' }}
        </UiButton>
        <UiButton block variant="ghost" to="/group/login" @click="tapId">이미 계정이 있어요</UiButton>
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
import BrandMark from '../components/BrandMark.vue'
// 시작 화면: 무슨 앱인지 한눈에 + 소셜로 1초 만에 시작(곧 가입). 약관·닉네임·동네는 가입 뒤 /welcome에서 받는다
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { GET } from '@/api/client'
import { API_BASE_URL } from '@/config/server'
import { TERMS } from '../content/legal'
import { UiButton, UiCard, UiSheet } from '../components/ui'
import { peekReturnTo, takeReturnTo } from '../utils/authRedirect'
import { isAndroidApp, isIosApp, isCapacitorApp, nativeGoogleLogin } from '../utils/nativeBridge'
import { trackEvent } from '../utils/visit'

const FEATURES = [
  // 처음 온 사람의 짧은 안내. 한 줄에 한 가지, 실제로 하는 순서대로 (11/3)
  { icon: 'fas fa-user-group', title: '동네에서 상대 찾기', body: '모집 중인 경기에 신청하거나 직접 열어요' },
  // 안전·신뢰 J: 처음 보는 사람과 만나는 앱이라 가장 큰 걱정을 첫 화면에서 푼다 (있는 기능만: 신뢰 온도·보증·위치 공유)
  { icon: 'fas fa-shield-halved', title: '처음 보는 사람과도 안심하고', body: '신뢰 온도와 만나 본 사람의 보증을 보고, 경기 동안 친구에게 위치를 알려요' },
  { icon: 'fas fa-stopwatch', title: '만나서 한 판', body: '점수는 둘이 같은 화면에 함께 남겨요' },
  { icon: 'fas fa-crown', title: '실력 점수가 쌓여요', body: '이기면 오르고, 동네 챔피언에 도전할 수 있어요' },
]

const router = useRouter()
const route = useRoute()
const openTerm = ref(null)
const pending = ref('')

// 서버에 키가 있는 소셜 로그인 (/api/auth/providers). 앱 안에서는 구글·애플을 앱이 직접 하고(구글은 앱 안 웹 화면 로그인을 막는다), 카카오는 웹으로
const enabled = ref({ google: false, kakao: false, apple: false })
const show = computed(() => ({
  google: isAndroidApp || (!isIosApp && enabled.value.google),
  kakao: enabled.value.kakao,
  apple: isIosApp || (!isAndroidApp && enabled.value.apple),
}))
const anySocial = computed(() => show.value.google || show.value.kakao || show.value.apple)

// 소셜 로그인이 막혀 돌아왔을 때 (서버 SocialRedirect.failure)
const LOGIN_ERRORS = {
  id_account: '이 이메일은 아이디로 가입돼 있어요. "이미 계정이 있어요"로 아이디 로그인해 주세요',
  email: '확인된 이메일이 있어야 시작할 수 있어요. 계정의 이메일을 확인해 주세요',
  failed: '로그인하지 못했어요. 다시 해 주세요',
}
const nativeError = ref('')
const loginError = computed(() => nativeError.value || LOGIN_ERRORS[route.query.loginError] || (route.query.loginError ? LOGIN_ERRORS.failed : ''))

if (localStorage.getItem('raspy_access_token2')) router.replace('/')

// 링크로 왔으면 그 링크가 무엇인지 (/api/landing, 로그인 전). 모르는 주소면 비어 있다
const landing = ref(null)

onMounted(async () => {
  const returnTo = peekReturnTo()
  if (returnTo) {
    GET('/api/landing', { query: { path: returnTo } })
      .then(({ data }) => (landing.value = data?.title ? data : null))
      .catch(() => {})
  }
  try {
    enabled.value = (await GET('/api/auth/providers')).data
  } catch {
    // 못 받으면 아이디로 시작만 보인다
  }
})

// 버튼 누름을 센다 (3단계 수요 조사 B): 가입 전 한 판 끝에서 왔으면 guest, 아니면 init
const tapPlace = route.query.from === 'guest' ? 'guest' : 'init'
function tapId() {
  trackEvent('tap_id', tapPlace)
}

function loginWith(provider) {
  pending.value = provider
  trackEvent(`tap_${provider}`, tapPlace)
  if (provider === 'apple' && isIosApp) {
    window.webkit?.messageHandlers?.iosBridge?.postMessage({ action: 'appleLogin' })
  } else if (provider === 'apple') {
    window.location.href = `${API_BASE_URL}/login/oauth2/apple/web/start`
  } else if (provider === 'google' && isCapacitorApp) {
    nativeError.value = ''
    nativeGoogleLogin().catch((e) => {
      pending.value = ''
      // 계정 고르기를 닫은 건 오류가 아니다
      if (!/cancel/i.test(String(e?.message || e))) nativeError.value = LOGIN_ERRORS.failed
    })
    return
  } else if (provider === 'google' && window.AndroidApp?.loginWithGoogle) {
    window.AndroidApp.loginWithGoogle()
  } else {
    window.location.href = `${API_BASE_URL}/oauth2/authorization/${provider}`
  }
  // 돌아오지 않고 머문 경우(창을 닫음 등) 버튼을 다시 쓸 수 있게
  setTimeout(() => (pending.value = ''), 8000)
}

// 앱의 소셜 로그인이 끝나면 앱이 부른다. 첫 설정이 남았으면 라우터 가드가 /welcome으로 보낸다
function onNativeLogin({ token }) {
  localStorage.setItem('raspy_access_token2', token)
  window.location.href = takeReturnTo() || '/'
}
window.onKakaoLoginSuccess = onNativeLogin
window.onGoogleLoginSuccess = onNativeLogin
</script>
