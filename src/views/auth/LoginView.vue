<template>
  <!-- 스크롤 없이 한 화면 (애플식) -->
  <div class="h-dvh overflow-hidden bg-canvas flex flex-col">
    <UiTopBar back="/init" />

    <main class="flex-1 min-h-0 w-full max-w-md mx-auto px-4 pt-4 pb-6">
      <h1 class="t-title">{{ isSignup ? '가입' : '로그인' }}</h1>

      <form class="mt-8 space-y-5" novalidate @submit.prevent="submit">
        <UiInput
          v-model="email"
          placeholder="아이디"
          :maxlength="isSignup ? 12 : 50"
          :hint="isSignup ? '영문 소문자·숫자·밑줄로 12자까지. 친구가 나를 찾을 때도 써요' : ''"
          :error="emailError"
          autocomplete="username"
        />
        <div>
          <UiInput
            v-model="password"
            placeholder="비밀번호"
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

        <UiButton type="submit" block size="lg" :loading="busy">{{ isSignup ? '가입' : '로그인' }}</UiButton>
      </form>

      <!-- 아이디 계정은 비밀번호를 되찾을 이메일이 없다. 막다른 길 대신 어떻게 하면 되는지 (11/4 밤샘, 일주일 만에 온 45세) -->
      <div v-if="!isSignup" class="mt-4 text-center">
        <button v-if="!forgotOpen" type="button" class="hit t-caption underline underline-offset-2" @click="forgotOpen = true">비밀번호를 잊었나요?</button>
        <p v-else class="t-caption text-left rounded-xl bg-surface px-4 py-3">
          <!-- 본인인증이 열려 있을 때만 그 길을 보인다. 준비 전에는 가 봐야 "준비 중"뿐이었다 (목적 판정 11/11 부분 1) -->
          <template v-if="resetAvailable">본인인증을 했던 아이디 계정이면 <RouterLink class="hit underline underline-offset-2 text-fg" to="/password-reset">휴대폰 본인인증으로 찾아요</RouterLink>.
          본인인증을 한 적이 없으면</template> <a class="hit underline underline-offset-2 text-fg" :href="forgotMail">{{ CONTACT_EMAIL }}</a>로 아이디를 적어 보내 주세요.
          카카오·구글로 시작했다면 그 버튼으로 다시 들어오면 돼요.
        </p>
      </div>

      <p class="mt-6 text-center t-caption">
        {{ isSignup ? '이미 계정이 있나요?' : '처음이신가요?' }}
        <UiButton variant="ghost" size="sm" @click="toggleMode">{{ isSignup ? '로그인' : '가입' }}</UiButton>
      </p>
    </main>
  </div>
</template>

<script setup>
// 아이디·비밀번호 가입/로그인. 약관·닉네임은 다음 화면(/welcome)에서 받는다
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../api/api'
import { GET } from '@/api/client'
import { UiButton, UiInput, UiTopBar } from '../../components/ui'
import { takeReturnTo } from '../../utils/authRedirect'
import { registerFcmToken } from '../../utils/nativeBridge'
import { trackVisit, claimGuestPlays } from '../../utils/visit'
import { CONTACT_EMAIL, contactMailto } from '../../config/contact'

const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const emailError = ref('')
const passwordError = ref('')
const submitError = ref('')
const forgotOpen = ref(false)
const resetAvailable = ref(false)
GET('/api/auth/password-reset/config').then(({ data }) => (resetAvailable.value = !!data?.available)).catch(() => {})
const forgotMail = contactMailto('비밀번호를 잊었어요')
const busy = ref(false)
const isSignup = ref(route.query.mode === 'signup')

function toggleMode() {
  isSignup.value = !isSignup.value
  emailError.value = ''
  passwordError.value = ''
  submitError.value = ''
  router.replace({ query: isSignup.value ? { mode: 'signup' } : {} })
}

// 가입 아이디는 친구가 찾는 아이디와 같은 규칙. 예전엔 아무 글자나 50자까지 받아, 규칙에 안 맞으면 첫 설정에서 아이디를 또 적어
// 로그인 아이디와 친구가 찾는 아이디가 둘이 됐다 (경로 1 리뷰 N9)
const SIGNUP_ID = /^[a-z0-9_]{1,12}$/
function validate() {
  if (isSignup.value) email.value = email.value.trim().toLowerCase()
  emailError.value = !email.value.trim() ? '아이디를 적어 주세요' : isSignup.value && !SIGNUP_ID.test(email.value) ? '영문 소문자·숫자·밑줄(_)로 12자까지 적어 주세요' : ''
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
        // 너무 많이 가입한 주소(429)면 서버 말 그대로: 언제 다시 하면 되는지가 들어 있다 (3-5 UI U1)
        else if (err.response?.status === 429) submitError.value = err.response?.data?.message || '이 인터넷에서 가입이 많았어요. 15분 뒤 다시 해 주세요'
        // 이유를 말한다: 연결이 끊김 / 서버가 말한 이유(형식 등) (경로 1 리뷰, 경로 전부 훑기 1절)
        else if (!err.response || [502, 503, 504].includes(err.response.status)) submitError.value = '연결이 끊겼어요. 다시 해 주세요'
        else submitError.value = err.response?.data?.message || '가입하지 못했어요. 아이디와 비밀번호를 확인해 주세요'
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
    let noAnswer = false
    try {
      token = (await api.post('/api/auth/login', { email: id, password: password.value })).data?.token
    } catch (err) {
      token = null
      tooMany = err.response?.status === 429 // 15분에 8번 넘게 틀림 (서버 LoginThrottle)
      // 답이 없거나 서버가 뜨는 중이면 비밀번호 탓이 아니다. 맞는 비밀번호를 넣은 사람이 비밀번호를 의심하지 않게 (목적 판정 11/11 부분 1)
      noAnswer = !err.response || [502, 503, 504].includes(err.response.status)
    }
    if (!token) {
      submitError.value = tooMany ? '로그인 시도가 너무 많아요. 15분 뒤 다시 해 주세요' : noAnswer ? '연결이 끊겼어요. 다시 해 주세요' : '아이디나 비밀번호가 맞지 않아요'
      return
    }
    localStorage.setItem('raspy_access_token2', token)
    registerFcmToken(token)
    trackVisit() // 로그인 전에 남긴 방문에 이 사람을 붙인다
    claimGuestPlays() // 가입 전 한 판을 내 기록으로
    // 약관·첫 설정이 남았으면 라우터 가드가 /welcome으로 보낸다
    router.replace(takeReturnTo() || '/')
  } finally {
    busy.value = false
  }
}
</script>
