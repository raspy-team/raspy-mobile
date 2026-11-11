<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar :title="card ? TITLES[card.key] || '어느 쪽이 더 좋은가요?' : '투표'" back />
    <main class="max-w-xl mx-auto px-4 pt-4 pb-16">
      <UiSkeleton v-if="!card && !error" class="h-48 w-full" />
      <UiEmptyState v-else-if="error" class="pt-16" icon="fas fa-triangle-exclamation" :title="error">
        <UiButton class="mt-4" to="/games">게임 둘러보기</UiButton>
      </UiEmptyState>
      <template v-else-if="card">
        <VoteCard :card="card" :visitor-id="guestId" @voted="card = $event" />
        <UiButton block variant="secondary" class="mt-4" :to="`/play/${card.key}`">나도 한 판 쓰기</UiButton>
        <!-- 손님: 한 표는 가입 없이. 결과를 받아 보려면 가입 (경로 2 리뷰 N3) -->
        <p v-if="guestId" class="t-caption text-center mt-3">가입하면 이 투표 결과를 알림함에서 받아요</p>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
// 투표 공유 링크 (/vote/:gameId). 친구에게 보내 투표를 받는다
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { GET } from '@/api/client'
import { getVisitorId } from '@/utils/visit'
import type { components } from '@/api/schema'
import VoteCard from '../../components/appgame/VoteCard.vue'
import { UiButton, UiEmptyState, UiSkeleton, UiTopBar } from '../../components/ui'

const route = useRoute()
const card = ref<components['schemas']['AppVoteCard'] | null>(null)
const error = ref('')
// 로그인 전에 투표 링크를 연 사람: 기기 번호로 한 표 (가입 벽에 표가 모이지 않아 판이 멈췄다, 경로 2 리뷰 N3)
const loggedIn = (() => { try { return !!localStorage.getItem('raspy_access_token2') } catch { return false } })()
const guestId = loggedIn ? undefined : getVisitorId() || undefined
const TITLES: Record<string, string> = { sentence: '어느 문장이 더 감동적인가요?', excuse: '어느 변명이 더 그럴듯한가요?', balance: '어느 쪽이 더 설득력 있나요?' }

onMounted(async () => {
  try {
    const gameId = Number(route.params.gameId)
    card.value = guestId
      ? (await GET('/api/app-games/votes/{gameId}/guest', { path: { gameId }, query: { visitorId: guestId } })).data
      : (await GET('/api/app-games/votes/{gameId}', { path: { gameId } })).data
  } catch (e) {
    const r = (e as { response?: { status?: number; data?: { message?: string } } }).response
    error.value = r?.status === 404 ? '없거나 지워진 투표예요' : r?.data?.message || '투표를 불러오지 못했어요'
  }
})
</script>
