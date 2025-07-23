<script setup>
import {defineProps} from 'vue'
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
    case('/') : return props.tab=='home'
    case('/my-games') : return props.tab=='my-game'
    // case('/create-game') : return props.tab=='create-game'
    // case('/inbox') : return props.tab=='inbox'
    case('/profile') : return props.tab=='profile'
  }
}
</script>

<template>
<nav class="fixed bottom-0 px-8 py-2 raspy-bot left-0 w-full bg-white border-t z-10">
    <div class="max-w-4xl mx-auto h-14 px-6 flex justify-between items-center text-[0.72rem]">
      <!-- 홈 -->
      <router-link to="/" class="flex flex-col gap-y-2 items-center" :class="isActive('/') ? 'text-[#f97316]' : 'text-gray-500'">
        <svg width="24" height="24" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clip-path="url(#home)">
            <path d="M13.5 6.94C13.501 6.8012 13.473 6.66372 13.4179 6.53632C13.3628 6.40892 13.2818 6.29438 13.18 6.2L7.00002 0.5L0.820023 6.2C0.718248 6.29438 0.637236 6.40892 0.582143 6.53632C0.52705 6.66372 0.499084 6.8012 0.500023 6.94V12.5C0.500023 12.7652 0.60538 13.0196 0.792916 13.2071C0.980452 13.3946 1.23481 13.5 1.50002 13.5H12.5C12.7652 13.5 13.0196 13.3946 13.2071 13.2071C13.3947 13.0196 13.5 12.7652 13.5 12.5V6.94Z"
              :stroke="isActive('/') ? '#f97316' : '#6B7280'" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M7 13.5V9.5" :stroke="isActive('/') ? '#f97316' : '#6B7280'" stroke-linecap="round" stroke-linejoin="round" />
          </g>
          <defs><clipPath id="home"><rect width="14" height="14" fill="white" /></clipPath></defs>
        </svg>
      </router-link>

      <!-- 내 경기 -->
      <router-link to="/my-games" class="flex flex-col gap-y-2 items-center" :class="isActive('/my-games') ? 'text-[#f97316]' : 'text-gray-500'">
        <svg width="24" height="24" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clip-path="url(#calendar)">
            <path d="M12.3196 6.53564C12.9581 8.08049 13.5175 10.0811 13.5 11.1785C13.4762 12.6588 12.5721 13.4999 11.6435 13.4999C10.8011 13.1036 9.78526 11.1785 8.85786 11.1785H5.14214C4.21474 11.1785 3.19893 13.1036 2.35645 13.4999C1.42788 13.4999 0.52376 12.6588 0.500038 11.1785C0.482451 10.0811 1.0419 8.08049 1.6804 6.53564"
              :stroke="isActive('/my-games') ? '#f97316' : '#6B7280'" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M3.28528 1.42856V4.21426C3.28528 4.72709 3.70101 5.14282 4.21384 5.14282H9.78523C10.2981 5.14282 10.7138 4.72709 10.7138 4.21426V1.42856L8.85664 2.35713L6.99951 0.5L5.14238 2.35713L3.28528 1.42856Z"
              :stroke="isActive('/my-games') ? '#f97316' : '#6B7280'" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M4.5 9.25C5.05228 9.25 5.5 8.80228 5.5 8.25C5.5 7.69772 5.05228 7.25 4.5 7.25C3.94772 7.25 3.5 7.69772 3.5 8.25C3.5 8.80228 3.94772 9.25 4.5 9.25Z"
              :stroke="isActive('/my-games') ? '#f97316' : '#6B7280'" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M9.5 9.25C10.0523 9.25 10.5 8.80228 10.5 8.25C10.5 7.69772 10.0523 7.25 9.5 7.25C8.94772 7.25 8.5 7.69772 8.5 8.25C8.5 8.80228 8.94772 9.25 9.5 9.25Z"
              :stroke="isActive('/my-games') ? '#f97316' : '#6B7280'" stroke-linecap="round" stroke-linejoin="round" />
          </g>
          <defs><clipPath id="calendar"><rect width="14" height="14" fill="white" /></clipPath></defs>
        </svg>
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
      <router-link to="/profile/0" class="flex flex-col gap-y-2 items-center" :class="isActive('/profile') ? 'text-[#f97316]' : 'text-gray-500'">
        <svg width="24" height="24" viewBox="0 0 11 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5.5 6C6.88071 6 8 4.88071 8 3.5C8 2.11929 6.88071 1 5.5 1C4.11929 1 3 2.11929 3 3.5C3 4.88071 4.11929 6 5.5 6Z"
            :stroke="isActive('/profile') ? '#f97316' : '#6B7280'" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M1 13.0001H5.5H10V12.458C9.99204 11.6958 9.79102 10.948 9.41573 10.2846C9.04043 9.62112 8.5031 9.06362 7.85393 8.66413C7.20475 8.26463 6.46491 8.0362 5.70352 8.00015C5.63564 7.99694 5.56778 7.99526 5.5 7.99512C5.43222 7.99526 5.36436 7.99694 5.29648 8.00015C4.53509 8.0362 3.79525 8.26463 3.14607 8.66413C2.4969 9.06362 1.95957 9.62112 1.58427 10.2846C1.20898 10.948 1.00796 11.6958 1 12.458V13.0001Z"
            :stroke="isActive('/profile') ? '#f97316' : '#6B7280'" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </router-link>
    </div>
  </nav>
</template>
