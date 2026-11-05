<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar title="도전장" back />
    <main class="max-w-xl mx-auto px-4 pt-6 pb-16">
      <UiSkeleton v-if="!info && !error" class="h-48 w-full" />
      <UiEmptyState v-else-if="error" class="pt-16" icon="fas fa-triangle-exclamation" :title="error">
        <UiButton class="mt-4" to="/games">다른 게임 둘러보기</UiButton>
      </UiEmptyState>
      <!-- 같이 두는 실시간 게임의 도전장은 약속: 시간 정하기·들어가기 (11/5) -->
      <AppointmentPanel v-else-if="info?.appointment" :game-id="info.gameId" />
      <template v-else-if="info">
        <UiCard class="text-center py-8">
          <UiAvatar :src="info.challenger.profilePicture" :name="info.challenger.nickname" :user-id="info.challenger.userId" size="lg" class="mx-auto" />
          <p class="t-title mt-4">{{ info.challenger.nickname }}님의 도전장</p>
          <p class="t-heading mt-1">{{ info.title }}</p>
          <p class="t-caption mt-2">{{ info.summary }}. {{ info.live ? '지금 기다리고 있어요. 들어가면 바로 시작해요' : '같은 문제로 겨뤄요' }}</p>
        </UiCard>
        <!-- 실시간 게임은 그 사람만 들어오는 방으로 (RealtimeView ?invite=) -->
        <UiButton v-if="info.open && !info.mine" block size="lg" class="mt-4" :to="info.live ? `/play/${info.key}/live?invite=${info.gameId}` : `/play/${info.key}?challenge=${info.gameId}`">도전 수락</UiButton>
        <p v-else class="t-caption text-center mt-4">{{ closedLine }}</p>
        <UiButton block variant="ghost" class="mt-2" :to="`/play/${info.key}`">이 게임 둘러보기</UiButton>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
// 도전 링크 (/challenge/:gameId). 받으면 같은 문제로 바로 플레이한다 (AppGameView ?challenge=)
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { GET } from '@/api/client'
import type { components } from '@/api/schema'
import { UiAvatar, UiButton, UiCard, UiEmptyState, UiSkeleton, UiTopBar } from '../../components/ui'
import AppointmentPanel from '../../components/appgame/AppointmentPanel.vue'

const route = useRoute()
const info = ref<components['schemas']['AppChallenge'] | null>(null)
const error = ref('')
const closedLine = computed(() => {
  const i = info.value
  if (!i) return ''
  if (i.mine) return '내가 보낸 도전장이에요. 받으면 알림이 가요'
  if (!i.forMe) return '다른 사람에게 보낸 도전장이에요'
  return i.live ? '도전한 사람이 나갔거나 시간이 지났어요' : '이미 누가 받았거나 끝난 도전이에요'
})

onMounted(async () => {
  try {
    info.value = (await GET('/api/app-games/challenges/{gameId}', { path: { gameId: Number(route.params.gameId) } })).data
  } catch (e) {
    // 없는 번호는 서버가 '도전 없음: 123'처럼 개발용 문구를 준다. 사람에게는 풀어서 (11/5 UX)
    const r = (e as { response?: { status?: number; data?: { message?: string } } }).response
    error.value = r?.status === 404 ? '없거나 지워진 도전장이에요' : r?.data?.message || '도전장을 불러오지 못했어요'
  }
})
</script>
