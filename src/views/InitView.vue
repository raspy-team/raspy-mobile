<template>
  <div class="min-h-screen flex flex-col justify-between items-center bg-white px-6">
    <div></div>
    <div class="text-center flex-2 mt-20 fixed left-0 w-full text-center top-[30dvh]">
      <span class="raspy mb-4">RASPY</span>
      <p class="tagline mb-0">
        즐기고 경쟁하는, <span class="text-[var(--point-color)] font-bold">스포츠 플랫폼</span>
      </p>
    </div>
    <div class="oauth-container flex flex-col gap-2 pb-10 w-full max-w-sm">
      <!-- Google Login -->
      <!-- <button class="oauth-btn google" @click="loginWith('google')">
        <div class="icon-text">
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M12 11.99v2.98h4.21c-.18 1.12-.83 2.07-1.78 2.71v2.26h2.88c1.69-1.56 2.67-3.86 2.67-6.61 0-.55-.05-1.09-.14-1.61H12z"/>
            <path fill="#34A853" d="M12 21c2.43 0 4.47-.8 5.96-2.15l-2.88-2.26c-.8.54-1.81.86-3.08.86-2.37 0-4.38-1.6-5.1-3.76H3.9v2.36C5.39 18.97 8.45 21 12 21z"/>
            <path fill="#FBBC05" d="M6.9 13.69a5.997 5.997 0 0 1 0-3.38V7.95H3.9a9.003 9.003 0 0 0 0 8.1l3-2.36z"/>
            <path fill="#EA4335" d="M12 6.58c1.32 0 2.5.45 3.43 1.33l2.57-2.57C16.46 3.83 14.42 3 12 3 8.45 3 5.39 5.03 3.9 7.95l3 2.36C7.62 8.18 9.63 6.58 12 6.58z"/>
          </svg>
          <span>Google로 시작하기</span>
        </div>
      </button> -->

      <div class="fixed  w-[90%] bottom-10 left-[5%]">
      <!-- Kakao Login -->
      <button class="oauth-btn kakao" @click="loginWith('kakao')">
        <div class="icon-text">
          <img src="https://developers.kakao.com/assets/img/about/logos/kakaolink/kakaolink_btn_medium.png" width="24" height="24" alt="Kakao">
          <span>Kakao로 시작하기</span>
        </div>
      </button>

      <!-- Apple Login (only iOS app) -->
      <button v-if="isIosApp" class="oauth-btn apple" @click="loginWith('apple')">
        <div class="icon-text">
          <i class="fab fa-apple"></i>
          <span>Apple로 시작하기</span>
        </div>
      </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()

const goHomeIfLoggedIn = () => {
  if (localStorage.getItem("raspy_access_token2") != undefined) {
    router.push("/")
  }
}
goHomeIfLoggedIn()

const pointColor = '#ff6f1f'
document.documentElement.style.setProperty('--point-color', pointColor)

// 플랫폼 감지 (iOS 웹뷰)
const userAgent = navigator.userAgent.toLowerCase()
const isIosApp = userAgent.includes('iphone') && userAgent.includes('raspy-ios') // TODO: swift에서 agent setting 필요

const loginWith = (provider) => {
  const apiBase = window.location.hostname.endsWith('.vercel.app')
    ? 'https://raspy-be.shop'
    : 'http://localhost:8080'

  window.location.href = `${apiBase}/oauth2/authorization/${provider}`
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Kanit:wght@600&display=swap');

.raspy {
  font-family: 'Kanit', sans-serif;
  font-weight: 600;
  font-size: 2.7rem;
  letter-spacing: 0.04em;
  color: var(--point-color);
}

.tagline {
  font-family: 'Kanit', sans-serif;
  font-size: 1.15rem;
  color: #333;
  text-align: center;
}

.oauth-container {
  display: flex;
  flex-direction: column;
}

.oauth-btn {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  padding: 15px 16px;
  border-radius: 8px;
  font-size: 1rem;
  width: 90%;
  margin:0% 5%;
  transition: background-color 0.2s ease, transform 0.2s ease;
  cursor: pointer;
  border: none;
}

.oauth-btn:hover {
  transform: scale(1.02);
}

.icon-text {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.google {
  background: #fff;
  border: 1px solid #dfdfdf;
  color: #444;
}

.google:hover {
  background: #f7f7f7;
}

.kakao {
  background: #FEE500;
  color: #3C1E1E;
}

.kakao:hover {
  background: #fddc00;
}

.apple {
  background: #000000;
  color: #fff;
}

.apple:hover {
  background: #222;
}
</style>
