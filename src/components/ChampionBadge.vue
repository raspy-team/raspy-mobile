<template>
  <span
    class="relative flex items-center rounded-full shadow-md px-3 py-1 space-x-1 overflow-hidden"
    title="챔피언"
  >
    <!-- 변화하는 그라데이션 배경 -->
    <span class="absolute inset-0 bg-gradient-animate"></span>

    <!-- 아이콘 + 텍스트 -->
    <i class="fas fa-crown text-white text-sm z-10"></i>
    <span class="text-xs font-semibold text-white z-10 animate-pulse-slow">
      챔피언
    </span>
  </span>
</template>

<script setup>
// 별도 스크립트 없음
</script>

<style scoped>
/* 배경 그라데이션 애니메이션 */
@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.bg-gradient-animate {
  background: linear-gradient(90deg, #f97316, #fbbf24, #f97316);
  background-size: 200% 200%;
  animation: gradientShift 4s ease-in-out infinite;
}

/* 텍스트 펄스 애니메이션 유지 */
@keyframes pulse-slow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.85; }
}
.animate-pulse-slow {
  animation: pulse-slow 2s ease-in-out infinite;
}
</style>
