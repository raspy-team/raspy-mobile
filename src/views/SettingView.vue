<template>
  <Header title="설정" :has-referer="true"/>
  <div class="min-h-screen bg-white flex flex-col items-center justify-center px-4">
    <div class="w-full max-w-xs space-y-8">
      <div class="pt-4 flex flex-col items-center">
        <i class="fas fa-tools text-2xl text-gray-300 mb-2"></i>
        <p class="text-gray-400 text-sm">다른 기능은 <span class="font-semibold text-[var(--point-color)]">준비 중</span>입니다</p>
      </div>

      <!-- 프로필 설정 버튼 -->
      <button
        @click="goToSetProfile"
        class="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-[var(--point-color)] text-[var(--point-color)] font-semibold text-base bg-white shadow hover:bg-[var(--point-color)] hover:text-white transition"
      >
        <i class="fas fa-user-cog"></i>
        프로필 설정
      </button>

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
import api from '../api/api'

const router = useRouter()
const logout = async() => {
  router.replace('/init')

  try {
    await api.post('/api/push/remove-device')
    localStorage.removeItem('raspy_access_token')
  } catch (err) {
    console.log(err)
  }
}
// /set-profile로 이동하는 함수
const goToSetProfile = () => {
  router.push('/set-profile')
}
</script>

<style scoped>
:root {
  --point-color: #ff6f1f;
}
</style>
