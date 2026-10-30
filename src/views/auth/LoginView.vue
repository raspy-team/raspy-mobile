<template>
  <div class="raspy-top">
    <HeaderComp
      :has-referer="true"
      :show-bell="false"
      :show-dm="false"
      custom-class="bg-white border-0"
    />
    <div class="flex pt-20">
      <!-- Left: Brand -->
      <div class="hidden lg:flex w-1/2 bg-[#191919] items-center justify-center">
        <div class="text-center space-y-8 px-8">
          <span class="raspy">Match</span>
          <p class="brand-desc">
            즐기고, 경쟁하는 <span class="text-[var(--point-color)] font-bold">스포츠 플랫폼</span>
          </p>
        </div>
      </div>
      <!-- Right: Login -->
      <div class="flex flex-col w-full lg:w-1/2 items-center justify-center bg-white px-6 lg:px-24">
        <div class="w-full max-w-md space-y-8">
          <h2 class="text-2xl font-bold text-gray-900 text-left">{{ isSignup ? '가입하기' : '로그인' }}</h2>
          <form @submit.prevent="isSignup ? handleSignup() : handleLogin()" class="space-y-4">
            <!-- Email -->
            <div class="relative">
              <i
                class="fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 text-lg"
              ></i>
              <input
                v-model="email"
                type="text"
                placeholder="아이디"
                class="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[var(--point-color)] focus:border-[var(--point-color)] transition text-base bg-gray-50"
                :class="{ 'border-red-500': emailError }"
              />
            </div>
            <p v-if="emailError" class="text-red-500 text-xs ml-1">{{ emailError }}</p>
            <!-- Password -->
            <div class="relative">
              <i
                class="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 text-lg"
              ></i>
              <input
                :type="showPassword ? 'text' : 'password'"
                v-model="password"
                placeholder="비밀번호 (8~20자)"
                class="w-full pl-11 pr-12 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[var(--point-color)] focus:border-[var(--point-color)] transition text-base bg-gray-50"
                :class="{ 'border-red-500': passwordError }"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[var(--point-color)]"
                tabindex="-1"
                aria-label="비밀번호 보기"
              >
                <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
              </button>
            </div>
            <p v-if="passwordError" class="text-red-500 text-xs ml-1">{{ passwordError }}</p>
            <!-- Button -->
            <button
              type="submit"
              class="w-full py-3 bg-[var(--point-color)] text-white rounded-lg font-semibold hover:bg-opacity-90 transition text-base mt-2"
            >
              {{ isSignup ? '가입하고 시작하기' : '로그인' }}
            </button>
            <p v-if="submitError" class="text-red-500 text-center text-xs mt-2">
              {{ submitError }}
            </p>
          </form>
          <!-- 가입/로그인 전환 -->
          <p class="text-center text-sm text-gray-500">
            {{ isSignup ? '이미 계정이 있나요?' : '처음이세요?' }}
            <button type="button" class="font-semibold text-[var(--point-color)] ml-1" @click="toggleMode">
              {{ isSignup ? '로그인' : '가입하기' }}
            </button>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../api/api'
import HeaderComp from '../../components/HeaderComp.vue'

const pointColor = '#ff6f1f'
document.documentElement.style.setProperty('--point-color', pointColor)

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const emailError = ref('')
const passwordError = ref('')
const submitError = ref('')
const router = useRouter()
const route = useRoute()
const isSignup = ref(route.query.mode === 'signup')

const toggleMode = () => {
  isSignup.value = !isSignup.value
  emailError.value = ''
  passwordError.value = ''
  submitError.value = ''
}

const validate = () => {
  emailError.value = ''
  passwordError.value = ''
  let ok = true
  if (!email.value.trim()) {
    emailError.value = '아이디를 입력하세요'
    ok = false
  } else if (email.value.length > 50) {
    emailError.value = '아이디는 50자 이하로 입력하세요'
    ok = false
  }
  if (password.value.length < 8 || password.value.length > 20) {
    passwordError.value = '비밀번호는 8~20자로 입력하세요'
    ok = false
  }
  return ok
}

// 가입 후 바로 로그인한다. 첫 로그인이라 프로필 설정 화면으로 이어진다
const handleSignup = async () => {
  if (!validate()) return
  try {
    await api.post('/api/auth/register', { email: email.value.trim(), password: password.value })
  } catch (err) {
    submitError.value =
      err.response?.status === 409 ? '이미 사용 중인 아이디예요' : '가입에 실패했어요. 잠시 후 다시 시도해주세요'
    return
  }
  email.value = email.value.trim()
  await handleLogin()
}

const handleLogin = async () => {
  if (!validate()) return
  try {
    const res = await api.post('/api/auth/login', { email: email.value, password: password.value })
    localStorage.setItem('raspy_access_token2', res.data.token)
    if (res.data.token == null || res.data.token == undefined) {
      submitError.value = '로그인 실패: 아이디 또는 비밀번호를 확인하세요'
    } else {
      if (res.data.isInitialGroup) {
        router.push('/oauth/callback?isNewUser=true')
      } else {
        router.push('/')
      }
    }
    const token = localStorage.getItem('raspy_access_token2')
    if (window.AndroidApp && window.AndroidApp.registerFcmToken) {
      window.AndroidApp.registerFcmToken(token)
    } else if (
      window.webkit &&
      window.webkit.messageHandlers &&
      window.webkit.messageHandlers.iosBridge
    ) {
      window.webkit.messageHandlers.iosBridge.postMessage({
        action: 'registerFcmToken',
        jwt: token,
      })
    }
  } catch {
    submitError.value = '로그인 실패: 아이디 또는 비밀번호를 확인하세요'
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Kanit:wght@600&display=swap');

.raspy {
  font-family: 'Kanit', sans-serif;
  font-weight: 700;
  font-size: 4rem;
  letter-spacing: 0.05em;
  color: var(--point-color);
  display: block;
}
.brand-desc {
  color: #fff;
  font-family: 'Kanit', sans-serif;
  font-size: 1.18rem;
  letter-spacing: 0.01em;
}
.brand-desc .font-bold {
  font-weight: 700;
}
</style>
