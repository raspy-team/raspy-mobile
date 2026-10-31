<script setup>
import { defineProps } from 'vue'
defineProps({ tab: String })

// 앱의 본질은 경기를 하는 것이라 첫 탭은 '경기'(참가할 수 있는 경기). 피드는 결과를 구경하는 곳
const tabs = [
  { key: 'home', to: '/', icon: 'fa-trophy', label: '경기' },
  { key: 'feed', to: '/feed', icon: 'fa-newspaper', label: '피드' },
  { key: 'game', to: '/game', icon: 'fa-calendar-check', label: '내 경기' },
  { key: 'profile', to: '/profile/0', icon: 'fa-user', label: '내 정보' },
]
</script>

<template>
  <nav class="fixed bottom-0 left-0 w-full bg-black border-t border-gray-800 z-40 pb-safe">
    <div class="max-w-4xl mx-auto h-16 grid grid-cols-4 text-xs">
      <router-link
        v-for="t in tabs"
        :key="t.key"
        :to="t.to"
        :aria-label="t.label"
        :aria-current="tab === t.key ? 'page' : undefined"
        class="flex flex-col items-center justify-center gap-1"
        :class="tab === t.key ? 'text-white' : 'text-gray-500'"
      >
        <i class="fas text-xl" :class="[t.icon, tab === t.key ? 'text-orange-500' : '']"></i>
        <span>{{ t.label }}</span>
      </router-link>
    </div>
  </nav>
</template>
