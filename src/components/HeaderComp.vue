<template>
  <header class="fixed top-0 left-0 w-full bg-white shadow z-50">
    <div class="max-w-4xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
      <router-link to="/" class="text-xl font-bold text-indigo-600">GameMatch</router-link>

      <div class="flex items-center space-x-4">
        <router-link to="/notifications" class="text-gray-500 hover:text-indigo-500">
          <i class="fas fa-bell text-lg"></i>
        </router-link>
        <router-link to="/profile" class="flex items-center space-x-2 hover:text-indigo-500 text-sm text-gray-600">
          <img src="https://via.placeholder.com/32" alt="프로필" class="w-8 h-8 rounded-full object-cover" />
          <span>내 정보</span>
        </router-link>
      </div>
    </div>
  </header>
</template>

<script setup>
// 이후 로그인 유저 정보에 따라 profile image, 이름 연동 가능
</script>
