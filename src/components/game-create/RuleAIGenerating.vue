<template>
  <div class="flex flex-col items-center justify-center min-h-full bg-white">
    <div class="ai-circle-loader mb-6"></div>
    <div class="text-lg font-bold text-orange-500 mb-2">AI가 규칙 제목과 카테고리를 생성 중...</div>
    <div class="text-base text-gray-400">최적의 규칙명을 만들고 있어요!</div>
  </div>
</template>
<style scoped>
.ai-circle-loader {
  width: 64px;
  height: 64px;
  border: 6px solid #f3f3f3;
  border-top: 6px solid #f97316;
  border-radius: 50%;
  animation: spin 1.2s linear infinite;
}
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
