<template>
  <div class="flex flex-col items-center justify-between min-h-screen bg-gray-50 p-6 text-center">
    <i class="fas fa-arrow-left self-start text-xl text-gray-600 mb-4" @click="goBack"></i>


    <div>
    <h1 class=" text-4xl font-extrabold text-gray-800 mb-2">Oops!<br> <span class="text-2xl font-extrabold">페이지를 찾을 수 없어요</span></h1>
    <p class="mt-12 text-gray-500 mb-6 px-4">
      죄송해요, 요청하신 페이지가 없거나 이동되었어요.
      홈으로 다시 가볼까요?
    </p>
</div>
    <div class="w-full">
      <button
        @click="goHome"
        class="w-full justify-center flex items-center bg-orange-500 text-white px-5 py-3 rounded-lg shadow hover:bg-orange-600 transition"
      >
        <i class="fas fa-home mr-2"></i> 홈으로
      </button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()

const goBack = () => history.back()
const goHome = () => router.push('/')
</script>

<style scoped>
</style>
