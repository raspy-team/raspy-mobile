<script setup>
import { defineProps } from 'vue'
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
      <router-link
        to="/"
        aria-label="피드"
        class="nav-item flex flex-col gap-y-2 items-center px-3 py-1 rounded-xl transition-colors relative"
        :class="isActive('/') ? 'nav-item-active text-white' : 'text-white/70 hover:text-white'"
      >
        <i
          class="fas fa-newspaper text-2xl"
          :class="isActive('/') ? 'text-orange-500' : 'text-gray-400'"
        ></i>
      </router-link>

      <router-link
        to="/game"
        aria-label="진행"
        class="nav-item flex flex-col gap-y-2 items-center px-3 py-1 rounded-xl transition-colors relative"
        :class="isActive('/game') ? 'nav-item-active text-white' : 'text-white/70 hover:text-white'"
      >
        <i
          class="fas fa-gamepad text-2xl"
          :class="isActive('/game') ? 'text-orange-500' : 'text-gray-400'"
        ></i>
      </router-link>



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
  filter: none;
}
</style>
