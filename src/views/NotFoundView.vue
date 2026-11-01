<template>
  <div style="min-height: calc(var(--real-vh, 1vh) * 100)" class="flex flex-col items-center justify-between  bg-gray-800 p-6 text-center">
    <UiIcon name="fas fa-arrow-left" class="self-start text-xl text-gray-400 mb-4" @click="goBack" />


    <div>
    <h1 class=" text-4xl font-bold text-gray-100 mb-2">Oops!<br> <span class="text-2xl font-bold">페이지를 찾을 수 없어요</span></h1>
    <p class="mt-12 text-gray-500 mb-6 px-4">
      죄송해요, 요청하신 페이지가 없거나 이동되었어요.
      홈으로 다시 가볼까요?
    </p>
</div>
    <div class="w-full">
      <button
        @click="goHome"
        class="w-full justify-center flex items-center bg-primary text-primary-on px-5 py-3 rounded-lg shadow hover:bg-primary-press transition"
      >
        <UiIcon name="fas fa-home" class="mr-2" /> 홈으로
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
