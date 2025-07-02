<template>
  <header class="fixed top-0 left-0 w-full bg-[#fff] shadow z-50">
    <div class="max-w-4xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">

      <!-- 좌측: 로고 또는 뒤로가기 -->
      <div class="flex items-center">
        <router-link v-if="props.hasReferer != true" to="/" class="text-xl font-bold text-[#f97316]">
          <span class="RASPY">RASPY</span>
        </router-link>
        <button v-else @click="goBack" class="text-black text-lg">
          <i class="fas fa-chevron-left"></i>
        </button>
      </div>

      <!-- 중앙: 타이틀 (hasReferer일 때만 표시) -->
      <div v-if="props.hasReferer == true" class="absolute left-1/2 transform -translate-x-1/2 text-black text-sm font-light">
        {{ props.title }}
      </div>

      <!-- 우측: 알림, DM -->
      <div class="flex items-center space-x-3">
        

       <!--
      <button @click="goDM" class="w-9 h-9 flex items-center justify-center  border-orange-500 rounded-full bg-white hover:bg-orange-50 transition">
        <i class="fas fa-paper-plane text-orange-500 text-base"></i>
      </button>
      <button @click="goAlert" class="w-9 h-9 flex items-center justify-center  border-orange-500 rounded-full bg-white hover:bg-orange-50 transition">
        <i class="fas fa-bell text-orange-500 text-base"></i>
      </button>
    -->



      </div>

    </div>
  </header>
</template>

<script setup>
import { defineProps } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const props = defineProps({
  hasReferer: { type: Boolean, default: false },
  title: { type: String, default: '' }
})

const goBack = () => {
  router.back()
}

// const goAlert = () => {
//   router.push('/notifications')
// }

// const goDM = () => {
//   router.push('/dm')
// }
</script>
