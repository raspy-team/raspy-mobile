<template>
  <div
    class="flex flex-col justify-center items-center bg-gradient-to-b from-orange-50 to-white px-5 py-8 relative"
  >
    <!-- Raspy 브랜드 -->
    <div class="flex flex-col items-center mb-12">
      <span class="text-4xl font-extrabold tracking-tight text-orange-500 mb-2">Match</span>
      <span class="text-base text-gray-500 font-semibold">스포츠로 연결되는 순간</span>
    </div>

    <!-- 일러스트 (SVG) -->
    <div class="mb-10 animate-fadeInUp">
      <svg width="110" height="110" fill="none" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r="50" fill="#FDBA74" opacity="0.18" />
        <circle cx="55" cy="55" r="38" fill="#FFEDD5" />
        <path d="M35 63c6-8 34-8 40 0" stroke="#F97316" stroke-width="3" stroke-linecap="round" />
        <circle cx="45" cy="48" r="5" fill="#F97316" />
        <circle cx="65" cy="48" r="5" fill="#F97316" />
      </svg>
    </div>

    <!-- 안내 및 앱 이동 -->
    <div
      class="w-full max-w-xs bg-white/90 rounded-2xl shadow-xl flex flex-col items-center py-8 px-6 mb-5 border border-orange-100"
    >
      <p class="text-lg font-bold mb-2 text-gray-900">Match 경기 정보를 확인하세요</p>
      <button
        @click="openApp"
        class="w-full py-3 mb-2 rounded-xl bg-orange-500 text-white font-semibold text-base shadow hover:bg-orange-600 transition"
      >
        Match 앱에서 열기
      </button>
      <button
        @click="goToStore"
        class="w-full py-2 rounded-xl border border-orange-200 text-orange-500 font-medium text-sm hover:bg-orange-50 mt-1 transition"
      >
        앱이 설치되지 않았나요?
      </button>
      <p v-if="showTip" class="mt-4 text-xs text-gray-400 text-center">
        앱이 자동으로 열리지 않으면<br />
        위 버튼을 눌러주세요.
      </p>
    </div>

    <!-- 하단: 카피라이트 -->
    <span class="absolute bottom-5 left-0 right-0 text-center text-gray-300 text-xs tracking-wide">
      © 2025 Match
    </span>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const gameId = route.params.gameId || ''
const showTip = ref(false)

// 자동 앱 열기 (0.6초 뒤 시도, 0.9초 뒤 안내)
onMounted(() => {
  setTimeout(() => {
    openApp()
    setTimeout(() => {
      showTip.value = true
    }, 900)
  }, 600)
})

function openApp() {
  const ua = navigator.userAgent || navigator.vendor || window.opera
  const isAndroid = /android/i.test(ua)
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream

  if (isAndroid) {
    // 안드로이드 intent 딥링크
    window.location.href = `intent://invite/${gameId}#Intent;scheme=raspy;package=com.xhadl.raspy_android;end`
  } else if (isIOS) {
    // iOS: 우선 커스텀스킴(앱에 raspy:// 세팅되어 있어야 동작)
    window.location.href = `raspy://invite/${gameId}` // it does not means real game ID !!!!!!!!

    // 유니버설 링크도 세팅했다면, 아래 코드로 더 확실한 fallback 가능:
    // window.location.href = `https://raspy-mobile-fork.vercel.app/invite/${gameId}`
    // (단, 유니버설링크 연동을 앱에서 완료해야 위 방식이 동작)
  } else {
    // 기타: PC 등은 안내
    alert('Match 앱은 모바일 기기에서만 열 수 있습니다.')
  }
}

// 안드로이드/아이폰 앱스토어로 이동
function goToStore() {
  const ua = navigator.userAgent || navigator.vendor || window.opera
  const isAndroid = /android/i.test(ua)
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream

  if (isAndroid) {
    window.location.href = 'https://play.google.com/store/apps/details?id=com.xhadl.raspy_android'
  } else if (isIOS) {
    window.location.href = 'https://apps.apple.com/kr/app/match/id6748941318'
    // 위의 idYOUR_IOS_APP_ID 부분을 실제 App Store 앱 ID로 todo
  } else {
    alert('앱 설치는 모바일에서 가능합니다.')
  }
}
</script>

<style scoped>
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fadeInUp {
  animation: fadeInUp 0.7s cubic-bezier(0.38, 1.3, 0.44, 0.93);
}
</style>
