<template>
  <div class="flex flex-col items-center justify-center h-screen bg-gray-50">
    <div class="flex flex-col items-center gap-4">
      <i class="fas fa-spinner fa-spin text-4xl text-orange-500"></i>
      <p class="text-gray-600 text-lg">페이지로 이동 중...</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

onMounted(() => {
  // route.params.gameId는 실제로는 인코딩된 딥링크 URL
  // 예: "https://raspy-mobile-fork.vercel.app/feed?gameId=123"가 인코딩된 형태
  const encodedDeeplink = route.params.gameId

  try {
    // URL 디코딩
    const decodedUrl = decodeURIComponent(encodedDeeplink)
    const url = new URL(decodedUrl)

    // pathname과 query params를 합쳐서 라우터로 이동
    const targetPath = url.pathname + url.search

    // 즉시 해당 경로로 리다이렉트
    router.replace(targetPath)
  } catch (e) {
    console.error('Deeplink decoding failed:', e)
    // 디코딩 실패 시 홈으로 이동
    router.replace('/')
  }
})
</script>

<style scoped>
/* 로딩 스피너 애니메이션은 FontAwesome에서 제공 */
</style>
