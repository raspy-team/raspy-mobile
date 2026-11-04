<template>
  <div class="min-h-dvh bg-canvas flex flex-col pt-safe pb-safe">
    <main class="flex-1 w-full max-w-md mx-auto px-6 flex flex-col">
      <div class="flex-1 flex flex-col justify-center py-10">
        <BrandMark size="22px" />
        <h1 class="t-display text-[40px] mt-10">경기에<br />초대받았어요</h1>
        <p class="t-body text-fg-muted mt-4">앱에서 열면 경기 정보를 바로 볼 수 있어요.</p>
      </div>

      <div class="pb-6 space-y-2">
        <UiButton block size="lg" @click="openApp">앱에서 열기</UiButton>
        <UiButton block variant="ghost" @click="goToStore">앱이 없나요?</UiButton>
        <p v-if="showTip" class="t-micro text-center pt-2">앱이 저절로 열리지 않으면 위 버튼을 눌러 주세요</p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import BrandMark from '../components/BrandMark.vue'
import { UiButton } from '../components/ui'
import { useRoute } from 'vue-router'

const route = useRoute()
// route.params.encodedUrl는 인코딩된 전체 URL
// 예: "https%3A%2F%2Fraspy-mobile-fork.vercel.app%2Ffeed%3FgameId%3D102"
// /invite-fall-back/ 뒤에 오는 URL을 통째로 가져옴
const encodedDeeplink = route.params.encodedUrl || ''

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
    // 안드로이드 intent 딥링크 (encodedDeeplink는 인코딩된 전체 URL)
    window.location.href = `intent://invite/${encodedDeeplink}#Intent;scheme=raspy;package=com.xhadl.raspy_android;end`
  } else if (isIOS) {
    // iOS: 커스텀 스킴 (encodedDeeplink는 인코딩된 전체 URL)
    window.location.href = `raspy://invite/${encodedDeeplink}`

    // 유니버설 링크도 세팅했다면, 아래 코드로 더 확실한 fallback 가능:
    // window.location.href = `https://raspy-mobile-fork.vercel.app/invite/${gameId}`
    // (단, 유니버설링크 연동을 앱에서 완료해야 위 방식이 동작)
  } else {
    // 기타: PC 등은 안내
    alert('Match 앱은 휴대폰에서만 열 수 있어요')
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
    alert('앱 설치는 휴대폰에서 할 수 있어요')
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
