<template>
  <Header title="설정" :has-referer="true"/>
  <div class="min-h-screen bg-white flex flex-col items-center justify-center px-4">
   

   
    <div class="w-full max-w-xs space-y-8">
              <div class="pt-4 flex flex-col items-center">
        <i class="fas fa-tools text-2xl text-gray-300 mb-2"></i>
        <p class="text-gray-400 text-sm">다른 기능은 <span class="font-semibold text-[var(--point-color)]">준비 중</span>입니다</p>
      </div>

      <button
        @click="logout"
        class="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-[var(--point-color)] text-white font-semibold text-base shadow hover:bg-opacity-90 transition"
      >
        <i class="fas fa-sign-out-alt"></i>
        로그아웃
      </button>


    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import Header from "../components/HeaderComp.vue"
const router = useRouter()
const logout = () => {
  localStorage.removeItem('raspy_access_token')
  router.replace('/init')
}
</script>

<style scoped>
:root {
  --point-color: #ff6f1f;
}
</style>
