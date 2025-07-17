<template>
<div class="flex w-[100dvw] h-[100dvh] items-center justify-center text-orange-500 text-sm font-light">
    <div>Raspy 앱으로 이동하는 중이에요!</div>
    <div>      앱이 자동으로 실행되지 않으면 버튼을 눌러주세요.
</div>
    <button @click="openApp"  class="bg-orange-500 text-white rounded-xl p-5 m-3">앱에서 열기</button>

</div>
</template>
<script setup>
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const gameId = route.query.gameId || ''  // URL 쿼리에서 gameId 추출

function openApp() {
  window.location.href = `intent://invite/${gameId}#Intent;scheme=raspy;package=com.xhadl.raspy_android;end`
}

onMounted(() => {
  setTimeout(openApp, 1200) // UX 개선을 위해 약간 딜레이
})
</script>
