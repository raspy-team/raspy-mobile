<template>
  <div class="pt-20 px-4 min-h-screen bg-gray-100">
    <h2 class="text-xl font-semibold text-center mb-6">로그인</h2>

    <form @submit.prevent="handleLogin" class="space-y-4">
      <input v-model="email" type="email" placeholder="이메일"
             class="w-full p-3 border rounded focus:outline-none"
             :class="{ 'border-red-500': emailError }" />
      <p v-if="emailError" class="text-red-500 text-sm">{{ emailError }}</p>

      <input v-model="password" type="password" placeholder="비밀번호"
             class="w-full p-3 border rounded focus:outline-none"
             :class="{ 'border-red-500': passwordError }" />
      <p v-if="passwordError" class="text-red-500 text-sm">{{ passwordError }}</p>

      <button type="submit"
              class="w-full bg-indigo-500 text-white py-3 rounded shadow">
        로그인
      </button>

      <p v-if="submitError" class="text-center text-red-500 text-sm mt-2">
        {{ submitError }}
      </p>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../api/api'

const email = ref('')
const password = ref('')
const emailError = ref('')
const passwordError = ref('')
const submitError = ref('')
const router = useRouter()

const validate = () => {
  emailError.value = ''
  passwordError.value = ''
  let valid = true

  if (!email.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    emailError.value = '올바른 이메일 형식'
    valid = false
  } else if (email.value.length > 50) {
    emailError.value = '최대 50자까지 입력 가능'
    valid = false
  }

  if (!password.value || password.value.length < 8 || password.value.length > 20) {
    passwordError.value = '비밀번호는 8~20자 사이여야 함'
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
    submitError.value = '로그인 실패: 확인 필요'
  }
}
</script>
