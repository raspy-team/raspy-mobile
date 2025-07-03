<template>
  <div>
    <!-- Splash 화면 -->
    <transition name="fade">
      <div v-if="showSplash" class="fixed inset-0 flex items-center justify-center bg-white z-50 ">
        <span class="raspy text-5xl font-extrabold tracking-wider text-orange-500 font-kanit;
">RASPY</span>
      </div>
    </transition>

    <!-- 실제 라우터 뷰 -->
    <RouterView v-if="!showSplash" :key="route.fullPath" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const showSplash = ref(true)
const route = useRoute()

onMounted(() => {
  setTimeout(() => {
    showSplash.value = false
  }, 2000) //
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
