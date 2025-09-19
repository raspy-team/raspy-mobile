<template>
  <div
    class="w-screen h-screen flex-shrink-0 relative overflow-hidden bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600"
  >
    <!-- 애니메이션 배경 -->
    <div class="absolute inset-0">
      <div class="absolute inset-0 opacity-20">
        <div
          v-for="i in 6"
          :key="i"
          class="absolute rounded-full bg-white animate-float"
          :class="`float-${i}`"
          :style="{
            width: Math.random() * 100 + 50 + 'px',
            height: Math.random() * 100 + 50 + 'px',
            left: Math.random() * 100 + '%',
            top: Math.random() * 100 + '%',
            animationDelay: Math.random() * 3 + 's',
            animationDuration: Math.random() * 3 + 4 + 's',
          }"
        ></div>
      </div>
    </div>

    <!-- 메인 콘텐츠 -->
    <div class="absolute inset-0 flex items-center justify-center z-10 p-6 pointer-events-none">
      <div class="text-center max-w-sm pointer-events-auto">
        <!-- 앱 아이콘/로고 -->
        <div class="mb-8">
          <div
            class="w-24 h-24 bg-white/20 backdrop-blur-md rounded-3xl mx-auto flex items-center justify-center border border-white/30 shadow-2xl"
          >
            <i class="fas fa-user-friends text-white text-4xl"></i>
          </div>
        </div>

        <!-- 메인 텍스트 -->
        <div class="mb-8">
          <h1 class="text-white font-black text-3xl mb-4 leading-tight">
            친구를 초대하고,<br />
            더 많은 컨텐츠를<br />
            확인하세요!
          </h1>
          <p class="text-white/80 text-lg leading-relaxed">
            친구와 함께 경기하고<br />
            더 재미있는 스포츠 라이프를 만들어보세요
          </p>
        </div>

        <!-- 특징 리스트 -->
        <div class="mb-8 space-y-3">
          <div class="flex items-center gap-3 text-white/90">
            <div class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <i class="fas fa-trophy text-sm"></i>
            </div>
            <span class="text-sm font-medium">친구들과 실시간 경기 매칭</span>
          </div>
          <div class="flex items-center gap-3 text-white/90">
            <div class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <i class="fas fa-chart-line text-sm"></i>
            </div>
            <span class="text-sm font-medium">경기 기록 및 통계 관리</span>
          </div>
          <div class="flex items-center gap-3 text-white/90">
            <div class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <i class="fas fa-users text-sm"></i>
            </div>
            <span class="text-sm font-medium">스포츠 커뮤니티 참여</span>
          </div>
        </div>

        <!-- 액션 버튼들 -->
        <div class="space-y-3">
          <button
            @click="$emit('invite')"
            @touchstart.stop
            @touchmove.stop
            @touchend.stop
            @mousedown.stop
            @mousemove.stop
            @mouseup.stop
            class="w-full py-4 bg-white text-purple-600 font-bold text-lg rounded-2xl shadow-2xl hover:bg-gray-50 transition-all duration-200 transform hover:scale-[1.02]"
          >
            친구 초대하기
          </button>
          <button
            @click="$emit('skip')"
            @touchstart.stop
            @touchmove.stop
            @touchend.stop
            @mousedown.stop
            @mousemove.stop
            @mouseup.stop
            class="w-full py-3 text-white/80 font-medium text-sm hover:text-white transition-colors"
          >
            나중에 하기
          </button>
        </div>
      </div>
    </div>

    <!-- 스킵 인디케이터 (작은 점) -->
    <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none">
      <div class="flex items-center gap-2">
        <div class="w-2 h-2 bg-white/50 rounded-full"></div>
        <div class="w-6 h-2 bg-white rounded-full"></div>
        <div class="w-2 h-2 bg-white/50 rounded-full"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineEmits } from 'vue'

defineEmits(['invite', 'skip'])
</script>

<style scoped>
@keyframes float {
  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
    opacity: 0.1;
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
    opacity: 0.3;
  }
}

.animate-float {
  animation: float infinite ease-in-out;
}

.float-1 {
  animation-delay: 0s;
}
.float-2 {
  animation-delay: 1s;
}
.float-3 {
  animation-delay: 2s;
}
.float-4 {
  animation-delay: 0.5s;
}
.float-5 {
  animation-delay: 1.5s;
}
.float-6 {
  animation-delay: 2.5s;
}
</style>
