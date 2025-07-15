<template>
  <div class="min-h-screen flex">
    <!-- 왼쪽: 브랜드 타이틀 & 소개 -->
    <div class="hidden lg:flex w-1/2 bg-[#191919] items-center justify-center">
      <div class="text-center space-y-8 px-8">
        <span class="raspy">RASPY</span>
        <p class="brand-desc">즐기고, 경쟁하는 <span class="text-[var(--point-color)] font-bold">스포츠 플랫폼</span></p>
      </div>
    </div>
    <!-- 오른쪽: 로그인 폼 -->
    <div class="flex flex-col w-full lg:w-1/2 items-center justify-center bg-white px-6 lg:px-24">
      <div class="w-full max-w-md space-y-6">
        <h2 class="text-3xl font-extrabold text-gray-900 mb-2">로그인</h2>
        <form @submit.prevent="handleLogin" class="space-y-5">
          <input
            v-model="email"
            type="email"
            placeholder="이메일 주소"
            class="w-full px-5 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--point-color)] transition"
            :class="{ 'border-red-500': emailError }"
          />
          <p v-if="emailError" class="text-red-500 text-sm">{{ emailError }}</p>

          <div class="relative">
            <input
              :type="showPassword ? 'text' : 'password'"
              v-model="password"
              placeholder="비밀번호"
              class="w-full px-5 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--point-color)] transition"
              :class="{ 'border-red-500': passwordError }"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-[var(--point-color)]">
              {{ showPassword ? '숨기기' : '보기' }}
            </button>
          </div>
          <p v-if="passwordError" class="text-red-500 text-sm">{{ passwordError }}</p>

          <button
            type="submit"
            class="w-full py-3 bg-[var(--point-color)] text-white rounded-lg font-semibold hover:bg-opacity-90 transition">
            로그인
          </button>
          <p v-if="submitError" class="text-red-500 text-center text-sm">{{ submitError }}</p>
        </form>
        <div class="flex items-center justify-between text-sm text-gray-600 pt-4">
          <button @click="goToSignup" class="hover:underline text-[var(--point-color)]">회원가입</button>
          <button @click="recoverPassword" class="hover:underline text-[var(--point-color)]">비밀번호 찾기</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../api/api'

const pointColor = '#ff6f1f'
document.documentElement.style.setProperty('--point-color', pointColor)

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const emailError = ref('')
const passwordError = ref('')
const submitError = ref('')
const router = useRouter()

const validate = () => {
  emailError.value = ''; passwordError.value = ''
  let ok = true
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) { emailError.value = '이메일 형식이 아닙니다'; ok = false }
  if (password.value.length < 8) { passwordError.value = '비밀번호를 8자 이상 입력하세요'; ok = false }
  return ok
}

const handleLogin = async () => {
  if (!validate()) return
  try {
    const res = await api.post('/api/auth/login', { email: email.value, password: password.value })
    localStorage.setItem('raspy_access_token2', res.data.token)
    router.push('/set-profile?init=1')
    window.AndroidApp.registerFcmToken(localStorage.getItem("raspy_access_token2"));
  } catch {
    submitError.value = '로그인 실패: 아이디 또는 비밀번호를 확인하세요'
  }
}

const goToSignup = () => router.push('/register')
const recoverPassword = () => router.push('/recover-password')
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
