<template>
  <!-- 이야기 줄: 기록에서 뽑은 사실 하나 (서버 feed_story가 중요한 순으로 준다). 그림은 결과 칸이 맡는다 -->
  <p v-if="beat" class="flex items-center gap-1.5 t-caption text-fg mb-2">
    <UiIcon :name="ICON[beat.kind] || 'bolt'" class="flex-shrink-0 text-fg-muted" aria-hidden="true" />
    <span class="truncate">{{ beat.text }}</span>
  </p>
</template>

<script setup>
import { computed, defineProps } from 'vue'
import { UiIcon } from '../ui'

const props = defineProps({ story: { type: Object, default: null } })
const beat = computed(() => props.story?.beats?.[0])
const ICON = {
  CHAMPION: 'crown', UPSET: 'bolt', COMEBACK: 'rotate-right', CLOSE: 'swords', RIVAL: 'swords', FIRST_WIN: 'trophy',
  STREAK: 'bolt', STREAK_STOP: 'flag', MILESTONE: 'star', PERSONAL_BEST: 'star', FIRST_GAME: 'user-plus',
}
</script>
