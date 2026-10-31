<template>
  <section
    class="w-screen shrink-0 h-full relative"
  >
    <!-- 동영상 -->
    <video
      v-if="photo && photo.mediaType === 'VIDEO'"
      :src="photo.url"
      class="w-full h-full object-contain bg-black"
      autoplay
      loop
      muted
      playsinline
      webkit-playsinline
      preload="auto"
    />
  
    <!-- 이미지 -->
    <img
      v-else-if="photo"
      :src="photo.url"
      alt="인증샷"
      class="w-full h-full object-contain"
      draggable="false"
    />
    <div class="absolute inset-0 bg-black/20 pointer-events-none" />
  
    <!-- 상단 헤더 -->
    <div class="absolute top-0 left-0 right-0 z-20 p-4 pt-12 sm:pt-16 md:pt-20 lg:pt-24">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <!-- 첫 번째 플레이어 -->
          <div
            v-if="post.players?.[0]"
            class="flex items-center gap-3 cursor-pointer active:scale-95 transition"
            @click="emit('profile', post.players[0].id)"
          >
            <img
              :src="post.players[0].avatar"
              class="w-10 h-10 rounded-full border-2 border-white/30 object-cover"
            />
            <div>
              <div class="text-base font-normal text-white drop-shadow-lg">
                {{ post.players[0].name }}
              </div>
            </div>
          </div>
          <!-- VS 표시 (두 플레이어가 있을 때) -->
          <div
            v-if="post.players?.[0] && post.players?.[1]"
            class="text-white/80 text-sm drop-shadow-lg mx-2"
          >
            VS
          </div>
          <!-- 두 번째 플레이어 -->
          <div
            v-if="post.players?.[1]"
            class="flex items-center gap-3 cursor-pointer active:scale-95 transition"
            @click="emit('profile', post.players[1].id)"
          >
            <img
              :src="post.players[1].avatar"
              class="w-10 h-10 rounded-full border-2 border-white/30 object-cover"
            />
            <div>
              <div class="text-base font-normal text-white drop-shadow-lg">
                {{ post.players[1].name }}
              </div>
            </div>
          </div>
          <!-- author 표시 (플레이어가 없을 때) -->
          <div
            v-if="!post.players?.[0] && post.author"
            class="flex items-center gap-3 cursor-pointer active:scale-95 transition"
            @click="emit('profile', post.author.id)"
          >
            <img
              :src="post.author.avatar"
              class="w-10 h-10 rounded-full border-2 border-white/30 object-cover"
            />
            <div>
              <div class="text-base font-normal text-white drop-shadow-lg">
                {{ post.author.name }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  
    <!-- 하단 정보 -->
    <div
      class="absolute bottom-32 sm:bottom-36 md:bottom-40 lg:bottom-44 left-0 right-0 px-4 z-10"
    >
      <div class="max-w-xl mx-auto">
        <div class="text-center mb-3">
          <div class="text-white/80 text-sm drop-shadow-lg">
            <i class="fas fa-map-marker-alt mr-1"></i>
            {{ post.meta?.place }}
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
// 끝난 경기의 첫 슬라이드: 인증샷과 두 선수
import { defineProps, defineEmits } from 'vue'
defineProps({ post: { type: Object, required: true }, photo: { type: Object, default: null } })
const emit = defineEmits(['profile'])
</script>
