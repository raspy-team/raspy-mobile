<script setup>
import { defineProps } from 'vue'
defineProps({ tab: String })

// 앱의 본질은 경기를 하는 것이라 첫 탭은 '경기'(참가할 수 있는 경기). 피드는 결과를 구경하는 곳
const tabs = [
  { key: 'home', to: '/', icon: 'swords', label: '경기' },
  { key: 'feed', to: '/feed', icon: 'activity', label: '피드' },
  { key: 'game', to: '/game', icon: 'calendar-check', label: '내 경기' },
  { key: 'profile', to: '/profile/0', icon: 'user', label: '내 정보' },
]
</script>

<template>
  <nav class="fixed bottom-0 left-0 w-full bg-canvas border-t border-line z-nav pb-safe">
    <div class="max-w-4xl mx-auto h-16 grid grid-cols-4 text-xs">
      <router-link
        v-for="t in tabs"
        :key="t.key"
        :to="t.to"
        :aria-label="t.label"
        :aria-current="tab === t.key ? 'page' : undefined"
        class="flex flex-col items-center justify-center gap-1 transition-colors"
        :class="tab === t.key ? 'text-fg' : 'text-fg-subtle'"
      >
        <UiIcon :name="t.icon" class="text-2xl" :strong="tab === t.key" />
        <span :class="tab === t.key ? 'font-medium' : ''">{{ t.label }}</span>
      </router-link>
    </div>
  </nav>
</template>
