<template>
  <div class="h-full">
    <!-- Splash 화면 (anroid는 네이티브 위임, ios일때만 보임.) -->
    <transition name="fade" >
      <div class="overflow-hidden">
        <div v-if="false && isIos && showSplash" class="fixed overflow-hidden inset-0 flex items-center justify-center bg-black z-[100] ">
          <span class="raspy text-5xl font-extrabold tracking-wider text-orange-500 font-kanit;
  ">
        <img class="w-[50dvw]" :src="MatchLogo" />
        </span>
        </div>
      </div>
    </transition>

    <!-- 실제 라우터 뷰 -->
    <RouterView class="h-full" :key="route.fullPath" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import MatchLogo from "./assets/Match.png"

const showSplash = ref(true)
const route = useRoute()
    
const isIos = ref(false)
    const ua = navigator.userAgent.toLowerCase()
    if (ua.includes('raspy-ios')) {
        isIos.value = true;
    }
onMounted(() => {
  setTimeout(() => {
    showSplash.value = false
  }, 2000) //

  try{
const token = localStorage.getItem("raspy_access_token2");
if (window.AndroidApp && window.AndroidApp.registerFcmToken) {
  window.AndroidApp.registerFcmToken(token);
} else if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.iosBridge) {
  window.webkit.messageHandlers.iosBridge.postMessage({
    action: "registerFcmToken",
    jwt: token
  });
}
  } catch(e) {
    console.log("welcome [web] user")
  }
})

window.addEventListener('error', (event) => {
  console.error('Uncaught Error:', event.error)
  alert(`준비 중입니다.`)
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Kanit:wght@600&display=swap');


/* Kanit 폰트 클래스 추가 */
@font-face {
  font-family: 'Kanit';
  font-style: normal;
  font-weight: 600;
  src: local('Kanit SemiBold'), local('Kanit-SemiBold'),
       url('https://fonts.gstatic.com/s/kanit/v20/nKKLRXYHTvRiG61aDCxHo_zY.woff2') format('woff2');
}

/* fade transition */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.4s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
