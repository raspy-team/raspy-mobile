<template>
  <div class="absolute inset-0">
    <!-- 배경 미디어 (완료된 경기이고 미디어가 있을 때) -->
    <template
      v-if="post.type === 'game' && post.isCompleted && post.photos?.length > 0"
    >
      <!-- 동영상 -->
      <video
        v-if="(post.photos[0]?.mediaType || 'IMAGE') === 'VIDEO'"
        :src="post.photos[0]?.url || post.photos[0]"
        class="absolute inset-0 w-full h-full object-contain"
        muted
        playsinline
      />
      <!-- 이미지 -->
      <img
        v-else
        :src="post.photos[0]?.url || post.photos[0]"
        class="absolute inset-0 w-full h-full object-contain"
      />
    </template>

    <div
      v-if="
        post.type === 'upcoming_game' || (post.type === 'game' && !post.isCompleted)
      "
      class="absolute inset-0 bg-violet-600/80 "
    ></div>
    <div
      v-else-if="post.type === 'invite'"
      class="absolute inset-0 bg-orange-400 "
    ></div>

    <div
      v-if="post.type !== 'game' || !post.isCompleted"
      class="relative z-10 w-full h-full flex items-center justify-center px-4"
    >
      <div v-if="post.type === 'invite'" class="text-center text-white">
        <div
          class="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center border border-white/30 mb-4"
        >
          <i class="fas fa-user-friends text-white text-2xl"></i>
        </div>
        <div class="text-lg font-bold">친구 초대</div>
        <div class="text-sm text-white/70">더 많은 컨텐츠를 확인하세요</div>
      </div>

      <div
        v-else-if="
          post.type === 'upcoming_game' ||
          (post.type === 'game' && !post.isCompleted)
        "
        class="w-[92%] max-w-xl rounded-2xl p-5 bg-white/10 backdrop-blur-md border border-white/15 shadow-2xl text-white/90"
      >
        <div class="flex items-center justify-between mb-5">
          <div class="text-lg font-bold">예정된 경기</div>
          <div class="text-xs text-blue-300">{{ post.date }}</div>
        </div>
        <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div class="text-center">
            <img
              :src="post.author?.avatar"
              class="w-14 h-14 rounded-full mx-auto mb-2 object-cover border-2 border-blue-400"
            />
            <div class="text-base font-normal text-white">{{ post.author?.name }}</div>
            <div class="text-blue-300 text-xs">주최자</div>
          </div>
          <div class="text-center">
            <div class="text-lg font-bold text-white/90">VS</div>
            <div class="text-xs text-white/60 mt-1">예정</div>
          </div>
          <div class="text-center">
            <div
              class="w-14 h-14 bg-gray-300 rounded-full mx-auto mb-2 flex items-center justify-center border-2 border-white/30"
            >
              <i class="fas fa-user-plus text-gray-400 text-lg"></i>
            </div>
            <div class="text-white/70 text-xs">참가자 모집</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// 피드를 위아래로 넘길 때 미리 보이는 이전·다음 게시물의 배경
import { defineProps } from 'vue'
defineProps({ post: { type: Object, required: true } })
</script>
