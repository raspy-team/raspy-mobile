<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 to-indigo-200 px-4">
    <div class="bg-white rounded-xl shadow-lg p-8 w-full max-w-md transition-all duration-300">
      <h2 class="text-2xl font-bold text-center text-gray-800 mb-6">로그인</h2>

      <form @submit.prevent="handleLogin" class="space-y-5">
        <div>
          <label class="block mb-1 text-sm font-medium text-gray-600">이메일</label>
          <input v-model="email" type="email" placeholder="example@email.com"
                 class="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                 :class="{ 'border-red-500': emailError }" />
          <p v-if="emailError" class="text-red-500 text-sm mt-1">{{ emailError }}</p>
        </div>

        <div>
          <label class="block mb-1 text-sm font-medium text-gray-600">비밀번호</label>
          <div class="relative">
            <input :type="showPassword ? 'text' : 'password'" v-model="password" placeholder="비밀번호 입력"
                   class="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                   :class="{ 'border-red-500': passwordError }" />
            <button type="button" @click="showPassword = !showPassword"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-indigo-500">
              {{ showPassword ? '숨기기' : '보기' }}
            </button>
          </div>
          <p v-if="passwordError" class="text-red-500 text-sm mt-1">{{ passwordError }}</p>
        </div>

        <div class="flex justify-between items-center text-sm text-gray-600">
          <button type="button" @click="goToSignup" class="hover:underline text-indigo-500">
            회원가입
          </button>
          <button type="button" @click="recoverPassword" class="hover:underline text-indigo-500">
            비밀번호 찾기
          </button>
        </div>

        <button type="submit"
                class="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-3 rounded-lg shadow-md transition duration-300">
          로그인
        </button>

        <p v-if="submitError" class="text-center text-red-500 text-sm mt-3 animate-fade">
          {{ submitError }}
        </p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../api/api'

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const emailError = ref('')
const passwordError = ref('')
const submitError = ref('')
const router = useRouter()

const validate = () => {
  emailError.value = ''
  passwordError.value = ''
  let valid = true

  if (!email.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    emailError.value = '올바른 이메일 형식이 필요합니다'
    valid = false
  } else if (email.value.length > 50) {
    emailError.value = '최대 50자까지 입력할 수 있습니다'
    valid = false
  }

  if (!password.value || password.value.length < 8 || password.value.length > 20) {
    passwordError.value = '비밀번호는 8~20자 사이여야 합니다'
    valid = false
  }

  return valid
}

const handleLogin = async () => {
  if (!validate()) return

  try {
    const res = await api.post('/api/auth/login', {
      email: email.value,
      password: password.value,
    })
    localStorage.setItem('accessToken', res.data.token)
    router.push('/game-list')
  } catch (err) {
    submitError.value = '로그인 실패: 이메일 또는 비밀번호를 확인하세요'
  }
}

const goToSignup = () => {
  router.push('/register')
}

const recoverPassword = () => {
  router.push('/recover-password')
}
</script>

<style>
@keyframes fade {
  from { opacity: 0; }
  to { opacity: 1; }
}
.animate-fade {
  animation: fade 0.5s ease-in-out;
}
</style>
