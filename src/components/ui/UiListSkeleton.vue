<template>
  <div class="divide-y divide-line" role="status" aria-label="불러오는 중">
    <div v-for="n in rows" :key="n" class="flex items-center gap-3 py-3">
      <UiSkeleton :class="shape === 'tile' ? 'w-12 h-12 rounded-xl' : 'w-10 h-10 rounded-full'" class="flex-shrink-0" />
      <div class="flex-1 space-y-2">
        <UiSkeleton class="h-3.5" :style="{ width: `${55 - (n % 3) * 12}%` }" />
        <UiSkeleton class="h-3" :style="{ width: `${35 + (n % 2) * 15}%` }" />
      </div>
    </div>
  </div>
</template>

<script setup>
// 목록을 불러오는 동안: 실제 줄과 같은 모양(아바타·그림 + 두 줄)의 자리 표시. 줄 길이를 조금씩 달리해 자연스럽게
import { defineProps } from 'vue'
import UiSkeleton from './UiSkeleton.vue'
defineProps({
  rows: { type: Number, default: 4 },
  shape: { type: String, default: 'avatar' }, // avatar(사람) | tile(규칙·경기)
})
</script>
