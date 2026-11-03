<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar title="도전장" back />
    <main class="max-w-xl mx-auto px-4 pt-6 pb-16">
      <UiSkeleton v-if="!info && !error" class="h-48 w-full" />
      <UiEmptyState v-else-if="error" class="pt-16" icon="fas fa-triangle-exclamation" :title="error" />
      <template v-else-if="info">
        <UiCard class="text-center py-8">
          <UiAvatar :src="info.challenger.profilePicture" :name="info.challenger.nickname" :user-id="info.challenger.userId" size="lg" class="mx-auto" />
          <p class="t-title mt-4">{{ info.challenger.nickname }}님의 도전장</p>
          <p class="t-heading mt-1">{{ info.title }}</p>
          <p class="t-caption mt-2">{{ info.summary }}. 같은 문제로 겨뤄요</p>
        </UiCard>
        <UiButton v-if="info.open && !info.mine" block size="lg" class="mt-4" :to="`/play/${info.key}?challenge=${info.gameId}`">도전 받기</UiButton>
        <p v-else class="t-caption text-center mt-4">
          {{ info.mine ? '내가 보낸 도전장이에요. 친구가 받으면 알림이 가요' : '이미 누가 받았거나 끝난 도전이에요' }}
        </p>
        <UiButton block variant="ghost" class="mt-2" :to="`/play/${info.key}`">이 게임 둘러보기</UiButton>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
// 도전 링크 (/challenge/:gameId). 받으면 같은 문제로 바로 플레이한다 (AppGameView ?challenge=)
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { GET } from '@/api/client'
import type { components } from '@/api/schema'
import { UiAvatar, UiButton, UiCard, UiEmptyState, UiSkeleton, UiTopBar } from '../../components/ui'

const route = useRoute()
const info = ref<components['schemas']['AppChallenge'] | null>(null)
const error = ref('')

onMounted(async () => {
  try {
    info.value = (await GET('/api/app-games/challenges/{gameId}', { path: { gameId: Number(route.params.gameId) } })).data
  } catch (e) {
    error.value = (e as { response?: { data?: { message?: string } } }).response?.data?.message || '도전장을 불러오지 못했어요'
  }
})
</script>
