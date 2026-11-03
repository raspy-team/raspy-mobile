<script setup>
import { defineProps } from 'vue'
import { useActiveGamePolling } from '../composable/useActiveGamePolling'
defineProps({ tab: String })

// 상대가 나를 기다리는 일(결과 확인·신청 승인)이 있으면 '내 경기'에 숫자를 단다
const { waitingOnMeCount } = useActiveGamePolling()

// 첫 탭은 참가할 경기를 '찾는' 곳. '경기'와 '내 경기'는 글자 하나 차이라 헷갈려 이름을 갈랐다 (11/3)
const tabs = [
  { key: 'home', to: '/', icon: 'search', label: '찾기' },
  { key: 'feed', to: '/feed', icon: 'feed', label: '소식' },
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
        :aria-label="t.key === 'game' && waitingOnMeCount ? `${t.label}, 할 일 ${waitingOnMeCount}개` : t.label"
        :aria-current="tab === t.key ? 'page' : undefined"
        class="flex flex-col items-center justify-center gap-1 transition-colors"
        :class="tab === t.key ? 'text-fg' : 'text-fg-subtle'"
      >
        <span class="relative">
          <UiIcon :name="t.icon" class="text-2xl" :strong="tab === t.key" />
          <span
            v-if="t.key === 'game' && waitingOnMeCount"
            class="absolute -top-1 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-signal text-signal-on text-[11px] font-semibold leading-[18px] text-center tabular-nums"
            aria-hidden="true"
          >{{ waitingOnMeCount > 9 ? '9+' : waitingOnMeCount }}</span>
        </span>
        <span :class="tab === t.key ? 'font-medium' : ''">{{ t.label }}</span>
      </router-link>
    </div>
  </nav>
</template>
