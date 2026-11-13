<script setup>
import { defineProps } from 'vue'
import { useActiveGamePolling } from '../composables/useActiveGamePolling'
defineProps({ tab: String })

// 상대가 나를 기다리는 일(결과 확인·신청 승인)이 있으면 '내 경기'에 숫자를 단다
const { waitingOnMeCount } = useActiveGamePolling()

// 첫 탭은 '홈': 다시 연 사람이 하던 판을 이어 가는 곳이라 '찾기'는 하는 일과 이름이 달랐다 (목적 판정 11/11 4번).
// 소식 탭은 홈 아래 몇 줄로 합쳤다 (11/13 앱 기능 좁히기: 사람이 적으면 탭 하나가 통째로 비었다)
const tabs = [
  { key: 'home', to: '/', icon: 'home', label: '홈' },
  { key: 'game', to: '/game', icon: 'calendar-check', label: '내 경기' },
  { key: 'profile', to: '/profile/0', icon: 'user', label: '내 정보' },
]
</script>

<template>
  <nav class="fixed bottom-0 left-0 w-full bg-canvas border-t border-line z-nav pb-safe">
    <div class="max-w-xl mx-auto h-16 grid grid-cols-3 text-xs">
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
          <!-- 고른 탭 아이콘이 한 번 톡 튄다 -->
          <span :key="tab === t.key ? 'on' : 'off'" class="block" :class="tab === t.key ? 'feel-pop' : ''"><UiIcon :name="t.icon" class="text-2xl" :strong="tab === t.key" /></span>
          <span
            v-if="t.key === 'game' && waitingOnMeCount"
            :key="waitingOnMeCount"
            class="feel-pop absolute -top-1 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-signal text-signal-on text-[11px] font-semibold leading-[18px] text-center tabular-nums"
            aria-hidden="true"
          >{{ waitingOnMeCount > 9 ? '9+' : waitingOnMeCount }}</span>
        </span>
        <span :class="tab === t.key ? 'font-medium' : ''">{{ t.label }}</span>
      </router-link>
    </div>
  </nav>
</template>
