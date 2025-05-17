<template>
  <nav class="fixed bottom-0 left-0 w-full bg-white border-t z-50">
    <div class="max-w-4xl mx-auto h-14 px-6 flex justify-between items-center text-xs text-gray-500">
      <router-link to="/" class="flex flex-col items-center hover:text-indigo-600">
        <i class="fas fa-home text-lg"></i>
        <span>홈</span>
      </router-link>
      <router-link to="/upcoming-games" class="flex flex-col items-center hover:text-indigo-600">
        <i class="fas fa-calendar-alt text-lg"></i>
        <span>내 경기</span>
      </router-link>
      <router-link to="/create-game" class="flex flex-col items-center hover:text-indigo-600">
        <i class="fas fa-plus-circle text-lg"></i>
        <span>생성</span>
      </router-link>
      <router-link to="/notifications" class="flex flex-col items-center hover:text-indigo-600">
        <i class="fas fa-bell text-lg"></i>
        <span>알림</span>
      </router-link>
      <router-link to="/profile" class="flex flex-col items-center hover:text-indigo-600">
        <i class="fas fa-user text-lg"></i>
        <span>프로필</span>
      </router-link>
    </div>
  </nav>
</template>

<script setup>
// 아이콘은 fontawesome 또는 heroicons로 대체 가능
</script>
