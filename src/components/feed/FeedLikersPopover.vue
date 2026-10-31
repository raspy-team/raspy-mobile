<template>
  <div>
    <!-- 전체 화면 투명 오버레이 (클릭 시 모달 닫기) -->
    <div class="fixed inset-0 z-[50]" @click="emit('close')"></div>
  
    <!-- 말풍선 모달 - 좋아요 버튼(맨 위) 바로 왼쪽에 위치 -->
    <div class="fixed right-[72px] bottom-[calc(25%+192px)] z-[51]" @click.stop>
      <div class="relative bg-gray-900 rounded-2xl shadow-2xl w-[280px]">
        <!-- 말풍선 꼬리 (오른쪽 중앙, 좋아요 버튼을 가리킴) -->
        <div
          class="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-gray-900 rotate-45 shadow-md"
        ></div>
  
        <div class="p-4 space-y-3">
          <div class="text-center">
            <div class="text-sm font-medium text-white mb-2">
              {{ likers.totalCount || 0 }}명이 또 보고싶어합니다
            </div>
          </div>
  
          <div
            v-if="likers.recentLikers && likers.recentLikers.length > 0"
            class="space-y-2 max-h-[300px] overflow-y-auto"
          >
            <div
              v-for="liker in likers.recentLikers"
              :key="liker.userId"
              @click="emit('profile', liker.userId)"
              class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-800 active:bg-gray-800 transition cursor-pointer"
            >
              <img
                v-if="liker.profileImageUrl"
                :src="liker.profileImageUrl"
                class="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />
              <div
                v-else
                class="w-8 h-8 rounded-full bg-orange-400 flex items-center justify-center text-white text-xs font-medium flex-shrink-0"
              >
                {{ liker.nickname?.charAt(0) }}
              </div>
              <div class="flex-1 text-sm font-medium text-white truncate">
                {{ liker.nickname }}
              </div>
            </div>
          </div>
  
          <div v-else class="py-4 text-center">
            <p class="text-xs text-gray-400">아직 또 보고싶어요가 없습니다</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// '또 보고싶어요'를 누른 사람들. 좋아요 버튼 옆 말풍선
import { defineProps, defineEmits } from 'vue'
defineProps({ likers: { type: Object, default: () => ({}) } })
const emit = defineEmits(['close', 'profile'])
</script>
