<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 to-indigo-200 px-4">
    <div class="bg-white rounded-xl shadow-lg p-8 w-full max-w-md transition-all duration-300">
      <h2 class="text-2xl font-bold text-center text-gray-800 mb-6">회원가입</h2>

      <form @submit.prevent="handleRegister" class="space-y-5">
        <div>
          <label class="block mb-1 text-sm font-medium text-gray-600">이메일</label>
          <input v-model="email" type="email" placeholder="example@email.com"
                 class="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                 :class="{ 'border-red-500': emailError }" />
          <p v-if="emailError" class="text-red-500 text-sm mt-1">{{ emailError }}</p>
        </div>

        <div>
          <label class="block mb-1 text-sm font-medium text-gray-600">비밀번호</label>
          <input v-model="password" type="password" placeholder="8~20자 입력"
                 class="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                 :class="{ 'border-red-500': passwordError }" />
          <p v-if="passwordError" class="text-red-500 text-sm mt-1">{{ passwordError }}</p>
        </div>

        <div>
          <label class="block mb-1 text-sm font-medium text-gray-600">비밀번호 확인</label>
          <input v-model="passwordConfirm" type="password" placeholder="비밀번호 재입력"
                 class="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                 :class="{ 'border-red-500': passwordConfirmError }" />
          <p v-if="passwordConfirmError" class="text-red-500 text-sm mt-1">{{ passwordConfirmError }}</p>
        </div>

        <div>
          <label class="block mb-1 text-sm font-medium text-gray-600">닉네임</label>
          <input v-model="nickname" type="text" placeholder="2~30자 닉네임"
                 class="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                 :class="{ 'border-red-500': nicknameError }" />
          <p v-if="nicknameError" class="text-red-500 text-sm mt-1">{{ nicknameError }}</p>
        </div>

        <button type="submit"
                class="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-3 rounded-lg shadow-md transition duration-300">
          회원가입 완료
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
const passwordConfirm = ref('')
const nickname = ref('')

const emailError = ref('')
const passwordError = ref('')
const passwordConfirmError = ref('')
const nicknameError = ref('')
const submitError = ref('')

const router = useRouter()

const validate = () => {
  emailError.value = ''
  passwordError.value = ''
  passwordConfirmError.value = ''
  nicknameError.value = ''
  let valid = true

  if (!email.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    emailError.value = '유효한 이메일 주소를 입력해주세요'
    valid = false
  } else if (email.value.length > 50) {
    emailError.value = '이메일은 50자 이하로 입력해주세요'
    valid = false
  }

  if (!password.value || password.value.length < 8 || password.value.length > 20) {
    passwordError.value = '비밀번호는 8자 이상 20자 이하로 설정해주세요'
    valid = false
  }

  if (passwordConfirm.value !== password.value) {
    passwordConfirmError.value = '비밀번호가 일치하지 않습니다'
    valid = false
  }

  if (!nickname.value || nickname.value.length < 2 || nickname.value.length > 30) {
    nicknameError.value = '닉네임은 2~30자 사이여야 합니다'
    valid = false
  }

  return valid
}

const handleRegister = async () => {
  if (!validate()) return

  try {
    await api.post('/api/auth/register', {
      email: email.value,
      password: password.value,
      nickname: nickname.value,
    })
    router.push('/login')
  } catch (err) {
    submitError.value = '회원가입 실패: 이메일이 이미 존재하거나 서버 오류입니다'
  }
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
