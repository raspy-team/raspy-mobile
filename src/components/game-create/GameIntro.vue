<template>
  <div class="flex flex-col items-center justify-center h-full pt-7 px-5">
    <div class="text-center pb-14">
      <h1 class="text-2xl font-extrabold mb-3 text-gray-900">게임을 생성해볼까요?</h1>
      <p class="text-base text-gray-500">
        원하는 규칙으로 게임을 직접 만들어볼 수 있습니다.<br />
        지금 바로 새로운 경기를 시작하세요!
      </p>
    </div>
    <button
      @click="$emit('next')"
      class="w-full py-4 mb-4 bg-orange-500 text-white text-lg font-bold rounded-xl shadow active:scale-98 transition"
    >
      게임 생성 시작
    </button>

    <button
      @click="router.go(-1)"
      class="w-full py-4 bg-white text-gray-500 text-lg font-lg rounded-xl border shadow active:scale-98 transition"
    >
      뒤로 가기
    </button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
</script>
