<template>
  <!-- 관중 기록: 본 경기·증인이 된 경기 (익명으로 본 건 없다). 둘 다 0이면 보이지 않는다 -->
  <p v-if="record && record.watched" class="t-caption">
    관중으로 {{ record.watched }}경기를 봤어요<template v-if="record.witnessed"> · {{ record.witnessed }}경기의 끝을 지켜봤어요</template>
  </p>
</template>

<script setup lang="ts">
// 관중 기록 (11/3 세션 2, docs/live-spectator-review.md 비판 7): 중계를 본 경기, 결과를 낸 순간 보고 있던 경기(증인)
import { ref, onMounted } from 'vue'
import { GET } from '@/api/client'
import type { components } from '@/api/schema'

const props = defineProps<{ userId: number }>()
const record = ref<components['schemas']['LiveWatchRecord'] | null>(null)
onMounted(async () => {
  record.value = (await GET('/api/users/{userId}/live-record', { path: { userId: props.userId } }).catch(() => ({ data: null }))).data
})
</script>
