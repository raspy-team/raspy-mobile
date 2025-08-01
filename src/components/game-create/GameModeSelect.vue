<template>
  <div class="flex flex-col min-h-full px-5 pt-10">
    <div class="text-center mb-7 pt-[10%]">
      <div class="text-lg font-bold text-gray-900 mb-2 mt-7">누구와 플레이할까요?</div>
      <div class="text-gray-500 text-base mb-7">
        친구와 플레이하기는 친구를 지정하여 바로 게임을 시작할 수 있습니다.
      </div>
    </div>
    <div class="flex flex-col gap-2 mb-5">
      <button
        @click="$emit('mode', 'random')"
        class="w-full py-4 bg-white text-orange-500 text-lg font-bold rounded-xl border border-orange-300"
      >
        다른 유저들과 경기하기
      </button>
    </div>
    <div class="w-full">
      <button
        disabled
        class="w-full py-4 bg-orange-200 text-white text-lg font-bold rounded-xl shadow cursor-not-allowed"
      >
        친구와 바로 시작하기
      </button>
      <div class="text-sm text-orange-500 text-left font-light mt-1">준비 중입니다</div>
    </div>
  </div>

    <div class="fixed bottom-10 w-full p-5">
    <button
      @click="router.push('/rules')"
      class="w-full py-4 bg-white text-gray-500 text-lg font-lg rounded-xl border shadow active:scale-98 transition"
    >
      규칙 다시 선택하기
    </button>
  </div>
</template>

<script setup>

import { useRouter } from 'vue-router'

const router = useRouter()

</script>
