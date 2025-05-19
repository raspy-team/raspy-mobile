<template>
  <header class="fixed top-0 left-0 w-full bg-[#222] shadow z-50">
    <div class="max-w-4xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
      <router-link to="/" class="text-xl font-bold text-indigo-600">
        <img class="h-[5rem]" :src="Logo">
      </router-link>

      <div class="flex items-center space-x-4">
        <router-link to="/notifications" class="text-gray-500 hover:text-indigo-500">
          <i class="fas fa-bell text-lg"></i>
        </router-link>

          <span @click="goAlert" class="px-1">
            <span v-if="hasAlert">
              <svg width="24" height="24" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clip-path="url(#clip0_4418_4)">
              <path d="M10.75 5.5C12.1307 5.5 13.25 4.38071 13.25 3C13.25 1.61929 12.1307 0.5 10.75 0.5C9.36929 0.5 8.25 1.61929 8.25 3C8.25 4.38071 9.36929 5.5 10.75 5.5Z" fill="#F65151"/>
              <path d="M9.93264 8V9.53357C9.93264 9.92469 10.088 10.2998 10.3646 10.5764C10.6411 10.8529 11.1089 11.0083 11.5 11.0083H0.5C0.891124 11.0083 1.35888 10.8529 1.63545 10.5764C1.91201 10.2998 2.06739 9.92469 2.06739 9.53357L2.06738 5.93262C2.06738 4.88963 2.48171 3.88935 3.21922 3.15184C3.95673 2.41433 4.95701 2 6 2" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M5 13.5H7" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
              </g>
              <defs>
              <clipPath id="clip0_4418_4">
              <rect width="14" height="14" fill="white"/>
              </clipPath>
              </defs>
              </svg>
            </span>
            <span v-else>
              <svg width="24" height="24" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 13.25H8" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M11 5.75C11 4.68913 10.5786 3.67172 9.82843 2.92157C9.07828 2.17143 8.06087 1.75 7 1.75C5.93913 1.75 4.92172 2.17143 4.17157 2.92157C3.42143 3.67172 3 4.68913 3 5.75V9.25C3 9.64782 2.84196 10.0294 2.56066 10.3107C2.27936 10.592 1.89782 10.75 1.5 10.75H12.5C12.1022 10.75 11.7206 10.592 11.4393 10.3107C11.158 10.0294 11 9.64782 11 9.25V5.75Z" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>

            </span>

          </span>
      </div>
    </div>
  </header>
</template>

<script setup>
import Logo from "../assets/raspy-logo.png"
import {ref} from 'vue'

const goAlert = () => {
  alert("알림 기능 준비 중")
}
const hasAlert = ref(false)
</script>
