<script setup>
import { defineProps } from 'vue'
/**
 * home
 * my-game
 * create-game
 * inbox
 * profile
 */
const props = defineProps({ tab: String })

function isActive(pathPrefix) {
  switch (pathPrefix) {
    case '/':
      return props.tab == 'feed'
    case '/game-list':
      return props.tab == 'home'
    case '/game':
      return props.tab == 'game'
    case '/profile':
      return props.tab == 'profile'
  }
}
</script>

<template>
  <nav
    class="fixed bottom-0 px-6 py-2 left-0 w-full bg-black/80 backdrop-blur-md border-t border-white/10 z-10"
  >
    <div class="max-w-4xl mx-auto h-14 px-4 flex justify-between items-center text-[0.72rem]">
      <!-- 피드 (신규) -->
      <router-link
        to="/"
        aria-label="피드"
        class="nav-item flex flex-col gap-y-2 items-center px-3 py-1 rounded-xl transition-colors relative"
        :class="isActive('/') ? 'nav-item-active text-white' : 'text-white/70 hover:text-white'"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <!-- 심플: 재생 삼각형 + 라운드 사각형 -->
          <rect
            x="1"
            y="2"
            width="12"
            height="10"
            rx="2"
            :stroke="isActive('/') ? '#f97316' : '#9CA3AF'"
            stroke-width="1.6"
          />
          <path d="M6 5.3L9 7L6 8.7V5.3Z" :fill="isActive('/') ? '#f97316' : '#9CA3AF'" />
        </svg>
        <span v-if="isActive('/')" class="indicator" />
      </router-link>

      <!-- 게임 -->
      <router-link
        to="/game"
        aria-label="게임"
        class="nav-item flex flex-col gap-y-2 items-center px-3 py-1 rounded-xl transition-colors relative"
        :class="isActive('/game') ? 'nav-item-active text-white' : 'text-white/70 hover:text-white'"
      >
        <i
          class="fas fa-gamepad text-2xl"
          :class="isActive('/game') ? 'text-orange-500' : 'text-gray-400'"
        ></i>
        <span v-if="isActive('/game')" class="indicator" />
      </router-link>

      <!-- 생성 -->
      <!-- <router-link to="/create-game" class="flex flex-col gap-y-2 items-center" :class="isActive('/create-game') ? 'text-[#f97316]' : 'text-gray-500'">
        <svg width="24" height="24" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clip-path="url(#plus)">
            <path d="M12.5 0.5H1.5C0.947715 0.5 0.5 0.947715 0.5 1.5V12.5C0.5 13.0523 0.947715 13.5 1.5 13.5H12.5C13.0523 13.5 13.5 13.0523 13.5 12.5V1.5C13.5 0.947715 13.0523 0.5 12.5 0.5Z"
              :stroke="isActive('/create-game') ? '#f97316' : '#6B7280'" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M0.5 3.5H13.5" :stroke="isActive('/create-game') ? '#f97316' : '#6B7280'" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M9.5 8.5H4.5" :stroke="isActive('/create-game') ? '#f97316' : '#6B7280'" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M7 6V11" :stroke="isActive('/create-game') ? '#f97316' : '#6B7280'" stroke-linecap="round" stroke-linejoin="round" />
          </g>
          <defs><clipPath id="plus"><rect width="14" height="14" fill="white" /></clipPath></defs>
        </svg>
        <span>생성</span>
      </router-link> -->

      <!-- 인박스 -->
      <!-- <router-link to="/inbox" class="flex flex-col gap-y-2 items-center" :class="isActive('/inbox') ? 'text-[#f97316]' : 'text-gray-500'">
        <svg width="24" height="24" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clip-path="url(#bell)">
            <path d="M13.5 8H10C9.73478 8 9.48043 8.10536 9.29289 8.29289C9.10536 8.48043 9 8.73478 9 9C9 9.53043 8.78929 10.0391 8.41421 10.4142C8.03914 10.7893 7.53043 11 7 11C6.46957 11 5.96086 10.7893 5.58579 10.4142C5.21071 10.0391 5 9.53043 5 9C5 8.73478 4.89464 8.48043 4.70711 8.29289C4.51957 8.10536 4.26522 8 4 8H0.5V12.5C0.5 12.7652 0.605357 13.0196 0.792893 13.2071C0.98043 13.3946 1.23478 13.5 1.5 13.5H12.5C12.7652 13.5 13.0196 13.3946 13.2071 13.2071C13.3946 13.0196 13.5 12.7652 13.5 12.5V8Z"
              :stroke="isActive('/inbox') ? '#f97316' : '#6B7280'" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M4.5 4L7 6.5L9.5 4" :stroke="isActive('/inbox') ? '#f97316' : '#6B7280'" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M7 0.5V6.5" :stroke="isActive('/inbox') ? '#f97316' : '#6B7280'" stroke-linecap="round" stroke-linejoin="round" />
          </g>
          <defs><clipPath id="bell"><rect width="14" height="14" fill="white" /></clipPath></defs>
        </svg>
        <span>인박스</span>
      </router-link> -->

      <!-- 프로필 -->
      <router-link
        to="/profile/0"
        aria-label="프로필"
        class="nav-item flex flex-col gap-y-2 items-center px-3 py-1 rounded-xl transition-colors relative"
        :class="
          isActive('/profile') ? 'nav-item-active text-white' : 'text-white/70 hover:text-white'
        "
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <!-- 심플 프로필: 머리 + 어깨 -->
          <circle
            cx="7"
            cy="5"
            r="2.2"
            :stroke="isActive('/profile') ? '#f97316' : '#9CA3AF'"
            stroke-width="1.6"
          />
          <path
            d="M2.8 12c1.2-2 3.0-2.8 4.2-2.8s3.0 0.8 4.2 2.8"
            :stroke="isActive('/profile') ? '#f97316' : '#9CA3AF'"
            stroke-width="1.6"
            stroke-linecap="round"
          />
        </svg>
        <span v-if="isActive('/profile')" class="indicator" />
      </router-link>
    </div>
  </nav>
</template>

<style scoped>
.nav-item svg {
  transition:
    transform 160ms ease,
    filter 160ms ease;
}
.nav-item-active svg {
  transform: scale(1.06);
  filter: drop-shadow(0 0 6px rgba(249, 115, 22, 0.35));
}
.indicator {
  position: absolute;
  top: 0;
  width: 18px;
  height: 3px;
  border-radius: 9999px;
  background: linear-gradient(90deg, #fbbf24 0%, #f97316 60%, #ec4899 100%);
}
</style>
