<template>
  <!-- 한 화면에 다 들어가게, 스크롤 없이 (애플식 시작 화면, 마스코트 없이) -->
  <div class="h-dvh overflow-hidden bg-canvas flex flex-col pt-safe pb-safe">
    <main class="flex-1 min-h-0 w-full max-w-md mx-auto px-6 flex flex-col">
      <!-- 무슨 앱인지 -->
      <div class="flex-1 min-h-0 flex flex-col justify-center py-6">
        <span class="text-[22px] font-semibold leading-none tracking-[-0.055em] text-fg">match</span>
        <!-- 링크로 들어온 사람: 무엇에 불려 왔는지 먼저 (인스타 게임 링크, 친구의 도전장). 가입하면 그 화면으로 돌아간다 -->
        <UiCard v-if="landing" class="mt-8">
          <!-- 방금 손님으로 한 판 한 사람에게 '받은 링크'는 남의 말이다 (3-5 걷기 P5) -->
          <p class="t-caption">{{ guestPlayed ? '방금 한 판' : '받은 링크' }}</p>
          <p class="t-title mt-1">{{ landing.title }}</p>
          <p class="t-caption mt-1">{{ landing.line }}</p>
          <!-- 가입 전에 한 판 하고 '점수 저장하고 상대와 붙기'로 온 사람: 그 점수가 어디 가는지 (first10 검토) -->
          <p class="t-caption text-fg mt-3">{{ guestPlayed ? '시작하면 방금 한 판이 내 기록에 남아요' : '시작하면 바로 이어서 해요' }}</p>
        </UiCard>
        <!-- 상대 구하기를 등록하고 온 사람: 그 등록이 어디로 가는지 -->
        <UiCard v-else-if="fromPartner" class="mt-8">
          <p class="t-title">상대 구하기를 등록했어요</p>
          <p class="t-caption mt-1">시작하면 내 계정에 붙어요. 상대가 생기면 알림으로 알려 드려요</p>
        </UiCard>
        <!-- 게임 링크로 온 사람에게 '종목과 규칙을 정하고'는 다른 앱 이야기다. 받은 게임 이야기로 (3-5 걷기 P5) -->
        <template v-if="landing">
          <h1 class="t-display text-[40px] mt-8">기록 남기고<br /><span class="hl hl-draw">사람과</span> 붙기</h1>
          <p class="t-body text-fg-muted mt-4 max-w-[30ch]">다음 판부터는 모르는 사람과 1:1로 승패를 내요.</p>
        </template>
        <template v-else>
          <h1 class="t-display text-[44px] mt-8">오늘 <span class="hl hl-draw">한 판</span>,<br />붙어볼래요?</h1>
          <p class="t-body text-fg-muted mt-4 max-w-[28ch]">종목과 규칙을 정하고, 상대를 찾고, 점수를 남겨요.</p>
        </template>

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
          <button type="button" class="underline underline-offset-2 px-1 min-h-[44px] inline-flex items-center" @click="openTerm = TERMS[0]">{{ TERMS[0].title }}</button>
          ·
          <button type="button" class="underline underline-offset-2 px-1 min-h-[44px] inline-flex items-center" @click="openTerm = TERMS[1]">{{ TERMS[1].title }}</button>
        </p>
      </div>
    </main>

    <UiSheet :model-value="!!openTerm" :title="openTerm?.title" @update:model-value="openTerm = null">
      <p class="t-caption whitespace-pre-line">{{ openTerm?.body.trim() }}</p>
    </UiSheet>
  </div>
</template>

<script setup>
// 시작 화면: 무슨 앱인지 한눈에 + 소셜로 1초 만에 시작(곧 가입). 약관·닉네임·동네는 가입 뒤 /welcome에서 받는다
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { GET } from '@/api/client'
import { API_BASE_URL } from '@/config/server'
import { TERMS } from '../content/legal'
import { UiButton, UiCard, UiSheet } from '../components/ui'
import { peekReturnTo, takeReturnTo } from '../utils/authRedirect'
import { isAndroidApp, isIosApp, isCapacitorApp, nativeGoogleLogin, nativeAppleLogin, nativeKakaoLogin, hasNativeKakao } from '../utils/nativeBridge'
import { trackEvent } from '../utils/visit'

const router = useRouter()
const route = useRoute()
const openTerm = ref(null)
const pending = ref('')

// 서버에 키가 있는 소셜 로그인 (/api/auth/providers). 앱 안에서는 구글·애플·카카오를 앱이 직접 한다(구글은 앱 안 웹 화면 로그인을 막고,
// 카카오는 웹 화면이면 카카오톡으로 못 넘어가 아이디·비밀번호를 쳐야 한다). 아이폰 앱은 카카오 플러그인이 든 빌드부터 구글을 보인다
const enabled = ref({ google: false, kakao: false, apple: false })
const show = computed(() => ({
  google: isAndroidApp || (isIosApp && hasNativeKakao) || (!isIosApp && enabled.value.google),
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
const guestPlayed = (() => { try { return !!localStorage.getItem('guest_played') } catch { return false } })()

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
// 광고 게임·상대 구하기·받은 링크에서 왔으면 소개를 접고 버튼부터
const fromPartner = route.query.from === 'partner'
const tapPlace = route.query.from === 'guest' ? 'guest' : route.query.from === 'partner' ? 'partner' : 'init'
function tapId() {
  trackEvent('tap_id', tapPlace)
}

function loginWith(provider) {
  pending.value = provider
  trackEvent(`tap_${provider}`, tapPlace)
  if (provider === 'apple' && isIosApp && isCapacitorApp) {
    // 아이폰 앱: 앱이 직접 Apple 로그인 창을 띄운다 (옛 앱의 iosBridge는 이제 없다, 11/5)
    nativeError.value = ''
    nativeAppleLogin().catch((e) => {
      pending.value = ''
      // 창을 닫은 건 오류가 아니다 (ASAuthorizationError 1001 canceled)
      if (!/cancel|1001/i.test(String(e?.message || e))) nativeError.value = LOGIN_ERRORS.failed
    })
    return
  } else if (provider === 'apple' && isIosApp) {
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
  } else if (provider === 'kakao' && hasNativeKakao) {
    nativeError.value = ''
    nativeKakaoLogin().catch((e) => {
      const msg = String(e?.message || e)
      // 플러그인이 없는 옛 앱 빌드·키 없는 빌드는 예전처럼 웹 로그인으로
      if (/unavailable|not implemented/i.test(msg)) {
        window.location.href = `${API_BASE_URL}/oauth2/authorization/kakao`
        return
      }
      pending.value = ''
      if (!/cancel/i.test(msg)) nativeError.value = LOGIN_ERRORS.failed
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
