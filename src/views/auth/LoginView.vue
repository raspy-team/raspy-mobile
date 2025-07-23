<template>
  <div class="raspy-top">
  <button @click="goBack" class="text-black text-lg fixed top-5  left-5 raspy-top">
    <i class="fas fa-chevron-left"></i>
  </button>
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
        <h2 class="text-2xl font-bold text-gray-900 text-left">그룹 계정 로그인</h2>
        <form @submit.prevent="handleLogin" class="space-y-4">
          <!-- Email -->
          <div class="relative">
            <i class="fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 text-lg"></i>
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
            <i class="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 text-lg"></i>
            <input
              :type="showPassword ? 'text' : 'password'"
              v-model="password"
              placeholder="비밀번호 (8자 이상)"
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
            로그인
          </button>
          <p v-if="submitError" class="text-red-500 text-center text-xs mt-2">{{ submitError }}</p>
        </form>
        <!-- 안내/신청 방법 -->
        <div class="rounded-lg bg-gray-50 border border-gray-100 p-4 text-gray-600 text-sm text-left leading-relaxed mt-4">
          운영진에게 부여받은 계정만 로그인할 수 있습니다.<br />
          계정이 필요하신 경우 <b class="text-gray-900">xhae000@gmail.com</b> 으로
          단체의 대표자 <b>주민등록증</b> 및 단체를 인증할 수 있는 자료(종류 무관)를 첨부하여
          신청해주세요.
        </div>
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
  if (password.value.length < 8) { passwordError.value = '비밀번호를 8자 이상 입력하세요'; ok = false }
  return ok
}

function goBack() {
  router.back()
}

const handleLogin = async () => {
  if (!validate()) return
  try {
    const res = await api.post('/api/auth/login', { email: email.value, password: password.value })
    localStorage.setItem('raspy_access_token2', res.data.token)
    if(res.data.isInitialGroup) {
      
      router.push("/oauth/callback?isNewUser=true")
    } else {
      router.push("/")
    }
const token = localStorage.getItem("raspy_access_token2");
if (window.AndroidApp && window.AndroidApp.registerFcmToken) {
  window.AndroidApp.registerFcmToken(token);
} else if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.iosBridge) {
  window.webkit.messageHandlers.iosBridge.postMessage({
    action: "registerFcmToken",
    jwt: token
  });
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
