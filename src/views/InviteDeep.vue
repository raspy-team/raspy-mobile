<template>
  <div class=" flex flex-col justify-center items-center bg-gradient-to-b from-orange-50 to-white px-5 py-8 relative">
    <!-- Raspy 브랜드 -->
    <div class="flex flex-col items-center mb-12">
      <span class="text-4xl font-extrabold tracking-tight text-orange-500 mb-2">RASPY</span>
      <span class="text-base text-gray-500 font-semibold">스포츠로 연결되는 순간</span>
    </div>

    <!-- 일러스트 (SVG) -->
    <div class="mb-10 animate-fadeInUp">
      <svg width="110" height="110" fill="none" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r="50" fill="#FDBA74" opacity="0.18"/>
        <circle cx="55" cy="55" r="38" fill="#FFEDD5" />
        <path d="M35 63c6-8 34-8 40 0" stroke="#F97316" stroke-width="3" stroke-linecap="round"/>
        <circle cx="45" cy="48" r="5" fill="#F97316"/>
        <circle cx="65" cy="48" r="5" fill="#F97316"/>
      </svg>
    </div>

    <!-- 안내 및 앱 이동 -->
    <div class="w-full max-w-xs bg-white/90 rounded-2xl shadow-xl flex flex-col items-center py-8 px-6 mb-5 border border-orange-100">
      <p class="text-lg font-bold mb-2 text-gray-900">Raspy에서 경기 정보를 확인하세요</p>
      <button
        @click="openApp"
        class="w-full py-3 mb-2 rounded-xl bg-orange-500 text-white font-semibold text-base shadow hover:bg-orange-600 transition"
      >
        Raspy 앱에서 열기
      </button>
      <button
        @click="goToPlayStore"
        class="w-full py-2 rounded-xl border border-orange-200 text-orange-500 font-medium text-sm hover:bg-orange-50 mt-1 transition"
      >
        앱이 설치되지 않았나요?
      </button>
      <p v-if="showTip" class="mt-4 text-xs text-gray-400 text-center">
        앱이 자동으로 열리지 않으면<br>
        위 버튼을 눌러주세요.
      </p>
    </div>

    <!-- 하단: 카피라이트 -->
    <span class="absolute bottom-5 left-0 right-0 text-center text-gray-300 text-xs tracking-wide">
      © 2025 Raspy
    </span>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const gameId = route.params.gameId || ''

const showTip = ref(false)

// 자동 앱 열기 시도 (0.6초 후)
onMounted(() => {
  setTimeout(() => {
    openApp()
    setTimeout(() => { showTip.value = true }, 900)
  }, 600)
})

function openApp() {
  // Android Intent 스킴으로 앱 열기 시도
  const intentUrl =
    `intent://invite/${gameId}#Intent;scheme=raspy;package=com.xhadl.raspy_android;end`
  window.location.href = intentUrl
}

function goToPlayStore() {
  // 앱이 설치 안되어 있을 경우 플레이스토어 이동 (패키지명 꼭 확인!)
  window.location.href =
    'https://play.google.com/store/apps/details?id=com.xhadl.raspy_android'
}
</script>

<style scoped>
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px);}
  to { opacity: 1; transform: translateY(0);}
}
.animate-fadeInUp {
  animation: fadeInUp 0.7s cubic-bezier(.38,1.3,.44,.93);
}
</style>
