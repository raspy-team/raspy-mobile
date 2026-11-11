<template>
  <!-- 앱 안 브라우저(인스타·카톡)는 내려받기가 저장되지 않는다: 그림을 띄워 길게 눌러 저장하게 한다 (11/11 몸과 시간, ShareSheet와 같은 길) -->
  <UiSheet :model-value="!!src" title="그림 저장" @update:model-value="(v) => !v && emit('close')">
    <div class="flex flex-col items-center">
      <img v-if="src" :src="src" alt="저장할 그림" class="max-h-[70dvh] rounded-2xl" />
      <p class="mt-4 t-body text-center break-keep">그림을 길게 눌러 저장하세요. 링크는 이미 복사했어요</p>
    </div>
  </UiSheet>
</template>

<script setup lang="ts">
import { UiSheet } from '../ui'
defineProps<{ src: string | null }>()
const emit = defineEmits<{ close: [] }>()
</script>
