<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar back="/init" />

    <main class="max-w-md mx-auto px-4 pt-4 pb-12">
      <h1 class="t-title">{{ isSignup ? '가입하기' : '로그인' }}</h1>
      <p class="t-body text-fg-muted mt-2">
        {{ isSignup ? '아이디와 비밀번호만 있으면 돼요.' : '다시 만나서 반가워요.' }}
      </p>

      <form class="mt-8 space-y-5" novalidate @submit.prevent="submit">
        <UiInput
          v-model="email"
          label="아이디"
          :maxlength="50"
          :hint="isSignup ? '로그인할 때 써요' : ''"
          :error="emailError"
          autocomplete="username"
        />
        <div>
          <UiInput
            v-model="password"
            label="비밀번호"
            :type="showPassword ? 'text' : 'password'"
            :maxlength="20"
            :hint="isSignup ? '8~20자' : ''"
            :error="passwordError"
            :autocomplete="isSignup ? 'new-password' : 'current-password'"
          />
          <UiButton variant="ghost" size="sm" class="-ml-2 mt-1" @click="showPassword = !showPassword">
            <UiIcon :name="showPassword ? 'far fa-eye-slash' : 'far fa-eye'" aria-hidden="true" />
            {{ showPassword ? '비밀번호 숨기기' : '비밀번호 보기' }}
          </UiButton>
        </div>

        <p v-if="submitError" class="text-sm text-danger" role="alert">{{ submitError }}</p>

        <UiButton type="submit" block size="lg" :loading="busy">{{ isSignup ? '가입하기' : '로그인' }}</UiButton>
      </form>

      <!-- 아이디 계정은 비밀번호를 되찾을 이메일이 없다. 막다른 길 대신 어떻게 하면 되는지 (11/4 밤샘, 일주일 만에 온 45세) -->
      <div v-if="!isSignup" class="mt-4 text-center">
        <button v-if="!forgotOpen" type="button" class="t-caption underline underline-offset-2" @click="forgotOpen = true">비밀번호를 잊었나요?</button>
        <p v-else class="t-caption text-left rounded-xl bg-surface px-4 py-3">
          아이디로 가입한 계정은 비밀번호를 되찾을 이메일이 없어요. 아이디를 적어
          <a class="underline underline-offset-2 text-fg" :href="forgotMail">yeonkoh@protonmail.com</a>으로 보내 주시면 본인인지 확인한 뒤 도와 드려요.
          카카오·구글로 시작했다면 그 버튼으로 다시 들어오면 돼요.
        </p>
      </div>

      <p class="mt-6 text-center t-caption">
        {{ isSignup ? '이미 계정이 있나요?' : '처음이신가요?' }}
        <UiButton variant="ghost" size="sm" @click="toggleMode">{{ isSignup ? '로그인' : '가입하기' }}</UiButton>
      </p>
    </main>
  </div>
</template>

<script setup>
// 아이디·비밀번호 가입/로그인. 약관·닉네임은 다음 화면(/welcome)에서 받는다
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../api/api'
import { UiButton, UiInput, UiTopBar } from '../../components/ui'
import { takeReturnTo } from '../../utils/authRedirect'
import { registerFcmToken } from '../../utils/nativeBridge'
import { trackVisit } from '../../utils/visit'

const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const emailError = ref('')
const passwordError = ref('')
const submitError = ref('')
const forgotOpen = ref(false)
const forgotMail = 'mailto:yeonkoh@protonmail.com?subject=' + encodeURIComponent('[Match] 비밀번호를 잊었어요')
const busy = ref(false)
const isSignup = ref(route.query.mode === 'signup')

function toggleMode() {
  isSignup.value = !isSignup.value
  emailError.value = ''
  passwordError.value = ''
  submitError.value = ''
  router.replace({ query: isSignup.value ? { mode: 'signup' } : {} })
}

function validate() {
  emailError.value = email.value.trim() ? '' : '아이디를 적어 주세요'
  passwordError.value = password.value.length >= 8 && password.value.length <= 20 ? '' : '비밀번호는 8~20자로 적어 주세요'
  submitError.value = ''
  return !emailError.value && !passwordError.value
}

async function submit() {
  if (!validate()) return
  busy.value = true
  const id = email.value.trim()
  try {
    if (isSignup.value) {
      try {
        await api.post('/api/auth/register', { email: id, password: password.value })
      } catch (err) {
        if (err.response?.status === 409) emailError.value = '이미 누가 쓰는 아이디예요. 다른 걸 적어 주세요'
        else submitError.value = '가입하지 못했어요. 잠시 뒤 다시 해 주세요'
        return
      }
      // 첫 설정의 '아이디' 칸에 다시 묻지 않고 채워 둔다 (OnboardingView)
      try {
        sessionStorage.setItem('signup_id', id)
      } catch {
        // 저장소를 못 쓰면 첫 설정에서 다시 적으면 된다
      }
    }
    let token
    let tooMany = false
    try {
      token = (await api.post('/api/auth/login', { email: id, password: password.value })).data?.token
    } catch (err) {
      token = null
      tooMany = err.response?.status === 429 // 15분에 8번 넘게 틀림 (서버 LoginThrottle)
    }
    if (!token) {
      submitError.value = tooMany ? '로그인 시도가 너무 많아요. 15분 뒤 다시 해 주세요' : '아이디나 비밀번호가 맞지 않아요'
      return
    }
    localStorage.setItem('raspy_access_token2', token)
    registerFcmToken(token)
    trackVisit() // 로그인 전에 남긴 방문에 이 사람을 붙인다
    // 약관·첫 설정이 남았으면 라우터 가드가 /welcome으로 보낸다
    router.replace(takeReturnTo() || '/')
  } finally {
    busy.value = false
  }
}
</script>
