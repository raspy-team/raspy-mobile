<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar title="경기" back="/" />
    <main class="max-w-xl mx-auto px-4 pt-4 pb-16">
      <UiSkeleton v-if="!game && !error" class="h-36 w-full" />
      <UiEmptyState v-else-if="error" class="pt-16" icon="fas fa-triangle-exclamation" :title="error">
        <UiButton to="/">다른 경기 찾기</UiButton>
      </UiEmptyState>
      <template v-else-if="game">
        <OpenGameCard
          :game="game"
          :is-mine="game.ownerId === myId"
          :busy="busy"
          @rule="router.push(`/rules/${game.rule.id}`)"
          @profile="router.push('/profile/' + game.ownerId)"
          @apply="apply"
          @pair="pairOpen = true"
          @cancel="cancel"
          @challengers="() => {}"
          @more="() => {}"
        />
        <PairApplySheet :game="pairOpen ? game : null" @close="pairOpen = false" @done="() => { game.isAppliedByMe = true; pairOpen = false }" />
        <p class="t-caption mt-4">
          <template v-if="game.gameStatus !== 'MATCHING'">{{ game.format && game.format !== 'DUEL' ? '이미 사람이 다 모인 경기예요.' : '이미 상대가 정해진 경기예요.' }}</template>
          <template v-else-if="game.ownerId === myId">신청이 오면 알려 드려요. 내 경기에서 승인해요.</template>
          <template v-else-if="game.isAppliedByMe">신청했어요. {{ game.ownerNickname }}님이 승인하면 알려 드려요.</template>
          <!-- 공유 링크로 다른 동네 경기에 들어온 경우: 누르기 전에 이유를 보여 준다 -->
          <template v-else-if="game.joinBlockedReason">
            <span class="text-danger-fg">{{ game.joinBlockedReason }}</span>
            <RouterLink to="/neighborhood" class="ml-1 underline underline-offset-2">내 동네 설정</RouterLink>
          </template>
          <template v-else>신청하면 {{ game.ownerNickname }}님이 승인하고, 장소와 시간을 함께 정해요.</template>
        </p>
        <!-- 상대가 정해진 남의 경기: 한쪽을 응원 (포인트) -->
        <CheerBar
          v-if="canCheer"
          class="mt-6"
          :game-id="game.id"
          :closed="!['MATCHING', 'SCHEDULED'].includes(game.gameStatus)"
        />
        <UiButton v-if="game.ownerId === myId" block variant="secondary" class="mt-4" to="/game">내 경기에서 보기</UiButton>
        <UiButton v-else block variant="ghost" class="mt-4" to="/">다른 경기 찾기</UiButton>
      </template>
    </main>
  </div>
</template>

<script setup>
// 공유 링크로 들어온 열린 경기 하나 (/games/:gameId). 피드는 끝난 경기만 보여 줘서 예전엔 링크를 받아도 신청할 곳이 없었다
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../api/api'
import { getMyId } from '@/utils/me'
import { feel } from '../../utils/feel'
import { useToast } from '../../composable/useToast'
import OpenGameCard from '../../components/game/OpenGameCard.vue'
import CheerBar from '../../components/point/CheerBar.vue'
import PairApplySheet from '../../components/game/PairApplySheet.vue'
import { UiButton, UiEmptyState, UiSkeleton, UiTopBar } from '../../components/ui'

const route = useRoute()
const router = useRouter()
const { showToast } = useToast()
const game = ref(null)
const error = ref('')
const busy = ref(false)
const pairOpen = ref(false)
const myId = ref(null)
const canCheer = computed(() => {
  const g = game.value
  return g && g.rule?.judge !== 'OUTCOME' && (g.players?.length || 0) >= 2 && !g.players.some((p) => p.id === myId.value)
    && ['MATCHING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED'].includes(g.gameStatus)
})

async function load() {
  try {
    game.value = (await api.get('/api/games/summary', { params: { gameId: route.params.gameId } })).data
  } catch {
    error.value = '경기를 찾지 못했어요'
  }
}

async function apply(team) {
  busy.value = true
  try {
    await api.post(`/api/games/${game.value.id}/apply`, null, { params: team === undefined ? {} : { team } })
    feel('success')
    await load()
  } catch (e) {
    showToast(e.response?.data?.message || '신청하지 못했어요')
  } finally {
    busy.value = false
  }
}

async function cancel() {
  busy.value = true
  try {
    await api.post('/api/games/cancel-request', { gameId: game.value.id })
    await load()
  } catch (e) {
    showToast(e.response?.data?.message || '취소하지 못했어요')
  } finally {
    busy.value = false
  }
}

onMounted(async () => {
  myId.value = await getMyId()
  await load()
})
</script>
