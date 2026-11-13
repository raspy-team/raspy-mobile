<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar title="한 판 붙자" back />
    <main class="max-w-xl mx-auto px-4 pt-6 pb-16">
      <UiSkeleton v-if="!info && !error" class="h-48 w-full" />
      <UiEmptyState v-else-if="error" class="pt-16" icon="fas fa-triangle-exclamation" :title="error">
        <UiButton class="mt-4" to="/games">다른 게임 둘러보기</UiButton>
      </UiEmptyState>
      <template v-else-if="info">
        <UiCard class="text-center py-8">
          <UiAvatar :src="info.challenger.profilePicture" :name="info.challenger.nickname" :user-id="info.challenger.userId" size="lg" class="mx-auto" />
          <p class="t-title mt-4">{{ info.challenger.nickname }}님이 한 판 붙자고 해요</p>
          <p class="t-heading mt-1">{{ info.title }}</p>
          <!-- '지금 기다리고 있어요'는 열린 초대에만: 끝난 초대에 아래 '나갔거나 시간이 지났어요'와 함께 떠 서로 어긋났다 (11/11 두 계정 확인) -->
          <p class="t-caption mt-2">{{ info.summary }}. {{ info.live && info.open ? '지금 기다리고 있어요. 들어가면 바로 시작해요' : `같은 ${info.key === 'improv' ? '상황으로' : '문제로'} 겨뤄요` }}</p>
        </UiCard>
        <!-- 실시간 게임은 그 사람만 들어오는 방으로 (RealtimeView ?invite=) -->
        <UiButton v-if="info.open && !info.mine" block size="lg" class="mt-4" :to="info.live ? `/play/${info.key}/live?invite=${info.gameId}` : `/play/${info.key}?challenge=${info.gameId}`">받기</UiButton>
        <!-- 받을 수 있는 도전장에서는 '이 게임 둘러보기'를 뺐다: 수락하러 온 사람을 도전장 밖으로 뺐다. 지났거나 내 것이면 그 게임 한 판으로 (목적 판정 11/11 부분 2) -->
        <template v-else>
          <p class="t-caption text-center mt-4">{{ closedLine }}</p>
          <UiButton block class="mt-3" :to="`/play/${info.key}`">{{ info.title }} 한 판 하기</UiButton>
        </template>
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

const route = useRoute()
const info = ref<components['schemas']['AppChallenge'] | null>(null)
const error = ref('')
const closedLine = computed(() => {
  const i = info.value
  if (!i) return ''
  if (i.mine) return '내가 보낸 한 판이에요. 받으면 알림이 가요'
  if (!i.forMe) return '다른 사람에게 보낸 한 판이에요'
  return i.live ? '보낸 사람이 나갔거나 시간이 지났어요' : '이미 누가 받았거나 끝난 한 판이에요'
})

onMounted(async () => {
  try {
    info.value = (await GET('/api/app-games/challenges/{gameId}', { path: { gameId: Number(route.params.gameId) } })).data
  } catch (e) {
    // 없는 번호는 서버가 '도전 없음: 123'처럼 개발용 문구를 준다. 사람에게는 풀어서 (11/5 UX)
    const r = (e as { response?: { status?: number; data?: { message?: string } } }).response
    error.value = r?.status === 404 ? '없거나 지워진 한 판이에요' : r?.data?.message || '불러오지 못했어요'
  }
})
</script>
