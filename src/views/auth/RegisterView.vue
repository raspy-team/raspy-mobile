<template>
  <div class="min-h-screen flex">
    <!-- 왼쪽: 브랜드 타이틀 & 소개 -->
    <div class="hidden lg:flex w-1/2 bg-[#191919] items-center justify-center">
      <div class="text-center space-y-8 px-8">
        <span class="raspy">RASPY</span>
        <p class="brand-desc">함께 만드는 <span class="text-[var(--point-color)] font-bold">아마추어 스포츠 기록</span></p>
      </div>
    </div>
    <!-- 오른쪽: 회원가입 폼 -->
    <div class="flex flex-col w-full lg:w-1/2 items-center justify-center bg-white px-6 lg:px-24">
      <div class="w-full max-w-md space-y-6">
        <h2 class="text-3xl font-extrabold text-gray-900 mb-2">회원가입</h2>
        <form @submit.prevent="handleRegister" class="space-y-5">
          <div>
            <label class="block mb-1 text-sm font-medium text-gray-700">이메일</label>
            <input v-model="email" type="email" placeholder="example@email.com"
              class="w-full px-5 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--point-color)] transition"
              :class="{ 'border-red-500': emailError }" />
            <p v-if="emailError" class="text-red-500 text-sm mt-1">{{ emailError }}</p>
          </div>
          <div>
            <label class="block mb-1 text-sm font-medium text-gray-700">비밀번호</label>
            <input v-model="password" type="password" placeholder="8~20자 입력"
              class="w-full px-5 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--point-color)] transition"
              :class="{ 'border-red-500': passwordError }" />
            <p v-if="passwordError" class="text-red-500 text-sm mt-1">{{ passwordError }}</p>
          </div>
          <div>
            <label class="block mb-1 text-sm font-medium text-gray-700">비밀번호 확인</label>
            <input v-model="passwordConfirm" type="password" placeholder="비밀번호 재입력"
              class="w-full px-5 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--point-color)] transition"
              :class="{ 'border-red-500': passwordConfirmError }" />
            <p v-if="passwordConfirmError" class="text-red-500 text-sm mt-1">{{ passwordConfirmError }}</p>
          </div>
          <div>
            <label class="block mb-1 text-sm font-medium text-gray-700">닉네임</label>
            <input v-model="nickname" type="text" placeholder="2~30자, 한글/영문/숫자"
              class="w-full px-5 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--point-color)] transition"
              :class="{ 'border-red-500': nicknameError }" />
            <p v-if="nicknameError" class="text-red-500 text-sm mt-1">{{ nicknameError }}</p>
          </div>
          <button type="submit"
            class="w-full bg-[var(--point-color)] hover:bg-opacity-90 text-white py-3 rounded-lg font-semibold shadow-md transition duration-200">
            회원가입
          </button>
          <p v-if="submitError" class="text-center text-red-500 text-sm mt-3 animate-fade">
            {{ submitError }}
          </p>
        </form>
        <div class="mt-8 text-center">
          <span class="text-gray-600 text-sm">이미 계정이 있나요?</span>
          <button @click="goToLogin"
            class="ml-2 text-[var(--point-color)] text-sm font-semibold hover:underline transition">
            로그인
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../api/api'

// 포인트 컬러와 배경 변수
const pointColor = '#ff6f1f'
document.documentElement.style.setProperty('--point-color', pointColor)

// form 데이터/에러 상태
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
  const nick = nickname.value.trim()
  if (!nick || nick.length < 2 || nick.length > 30) {
    nicknameError.value = '닉네임은 2~30자 사이여야 합니다'
    valid = false
  } else if (!/^[가-힣a-zA-Z0-9]+$/.test(nick)) {
    nicknameError.value = '닉네임은 한글, 영문, 숫자만 사용 가능합니다'
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
      nickname: nickname.value.trim(),
    })
    router.push('/login')
  } catch (err) {
    if (err.response?.status === 409) {
      const msg = err.response.data?.message || ''
      if (msg.toLowerCase().includes('nickname')) {
        nicknameError.value = '이미 사용 중인 닉네임입니다'
      } else if (msg.toLowerCase().includes('email')) {
        emailError.value = '이미 사용 중인 이메일입니다'
      } else {
        submitError.value = '회원가입 실패: 중복된 항목이 있습니다'
      }
    } else {
      submitError.value = '회원가입 실패: 서버 오류입니다'
    }
  }
}
const goToLogin = () => router.push('/login')
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

@keyframes fade {
  from { opacity: 0; }
  to { opacity: 1; }
}
.animate-fade {
  animation: fade 0.5s ease-in-out;
}
</style>
