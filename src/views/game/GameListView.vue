<template>
  <UiTopBar title="찾기">
    <template #right><UiIconButton icon="map" label="지도" @click="router.push('/map')" /><InboxButtons /></template>
  </UiTopBar>

  <main class="px-4 pt-4 pb-32 max-w-xl mx-auto">
    <UiPullIndicator :pull="pull" :refreshing="refreshing" />

    <!-- 브랜드 한 줄 (docs/essence.md: 줄 말고 판). 하루에 하나. 제목처럼 외치지 않고 본문 크기로 조용히, 핵심 낱말만 진하게 볼트 밑줄 (11/3) -->
    <p class="t-body text-fg-muted">
      {{ brandLine.before }}<span class="font-semibold text-fg underline decoration-signal decoration-[0.14em] underline-offset-[0.22em]">{{ brandLine.mark }}</span>{{ brandLine.after }}
    </p>

    <!-- 지금 동네 (경기 목록이 이 동네 범위를 따른다) -->
    <NeighborhoodBar class="mt-5 mb-3" @changed="fetchGames" />

    <!-- 위쪽 버튼은 두 가지만: 채운 주 행동 하나 + 같은 모양의 갈 곳 셋 (11/3) -->
    <UiButton block size="lg" icon="plus" to="/create-game">경기 만들기</UiButton>
    <nav class="mt-3 grid grid-cols-3 gap-2" aria-label="둘러보기">
      <RouterLink v-for="d in DESTINATIONS" :key="d.to" :to="d.to" class="flex flex-col items-center gap-1.5 rounded-xl bg-surface py-3.5 active:bg-surface-2 transition-[background-color,transform] motion-safe:active:scale-[0.98]">
        <UiIcon :name="d.icon" class="text-xl text-fg-muted" />
        <span class="t-label text-fg">{{ d.label }}</span>
      </RouterLink>
    </nav>

    <UiSection title="모집 중인 경기" class="mt-8">
      <template #action>
        <span v-if="games.length" class="t-micro">{{ games.length }}개</span>
      </template>

      <!-- 불러오는 중 -->
      <div v-if="loading && !games.length" class="space-y-3">
        <UiCard v-for="n in 3" :key="n">
          <div class="flex gap-3">
            <UiSkeleton class="w-10 h-10" />
            <div class="flex-1 space-y-2">
              <UiSkeleton class="h-4 w-2/3" />
              <UiSkeleton class="h-3 w-1/2" />
            </div>
          </div>
          <div class="flex items-center gap-2.5 mt-4">
            <UiSkeleton class="w-8 h-8 rounded-full" />
            <UiSkeleton class="h-3 w-24" />
          </div>
        </UiCard>
      </div>

      <UiCard v-else-if="loadFailed && !games.length">
        <UiEmptyState icon="fas fa-rotate-right" title="경기를 불러오지 못했어요" description="연결이 돌아오면 다시 해 주세요">
          <UiButton variant="secondary" @click="retry">다시 시도</UiButton>
        </UiEmptyState>
      </UiCard>

      <UiCard v-else-if="!games.length">
        <UiEmptyState mascot="match" title="아직 모집 중인 경기가 없어요" description="앱 게임은 전국 누구와도 바로 할 수 있어요">
          <UiButton to="/create-game">경기 만들기</UiButton>
          <!-- 동네에 아직 사람이 없을 때 바로 할 수 있는 것: 범위 넓히기(동네 경기 화면이라 먼저), 전국 앱 게임 (11/4 밤샘, 제주에서 온 사람. 문구·모양 C) -->
          <div class="flex flex-wrap justify-center gap-2 mt-2">
            <UiButton size="sm" variant="secondary" to="/neighborhood">범위 넓히기</UiButton>
            <UiButton size="sm" variant="ghost" to="/games">앱 게임 하기</UiButton>
          </div>
        </UiEmptyState>
      </UiCard>

      <div v-else class="space-y-3 ui-appear">
        <OpenGameCard
          v-for="game in games"
          :key="game.id"
          :game="game"
          :is-mine="game.ownerId === myId"
          :busy="busyId === game.id"
          @rule="ruleGame = game"
          @profile="router.push('/profile/' + game.ownerId)"
          @apply="(team) => apply(game, team)"
          @pair="pairGame = game"
          @cancel="cancelApply(game)"
          @challengers="challengersGame = game"
          @more="menuGame = game"
        />
      </div>
    </UiSection>
  </main>

  <!-- 친구와 둘이 신청 (팀 경기) -->
  <PairApplySheet :game="pairGame" @close="pairGame = null" @done="(g) => { g.isAppliedByMe = true; pairGame = null }" />

  <GameMenuSheets v-model:menu="menuGame" v-model:challengers="challengersGame" :my-id="myId" @comments="(id) => (commentId = id)" />

  <Comment v-if="commentId != 0" :id="commentId" @close="commentId = 0" />
  <MatchRuleModal v-if="ruleGame" :rule="ruleGame.rule" @close="ruleGame = null" />
</template>

<script setup>
// 첫 화면: 참가할 수 있는 열린 경기 목록. 주 행동은 '경기 만들기' 하나
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../api/api'
import { getMyId } from '@/utils/me'
import InboxButtons from '../../components/inbox/InboxButtons.vue'
import MatchRuleModal from '../../components/MatchModal.vue'
import OpenGameCard from '../../components/game/OpenGameCard.vue'
import PairApplySheet from '../../components/game/PairApplySheet.vue'
import GameMenuSheets from '../../components/game/GameMenuSheets.vue'
import NeighborhoodBar from '../../components/neighborhood/NeighborhoodBar.vue'
import Comment from '../GameCommentView.vue'
import {
  UiButton, UiCard, UiEmptyState, UiIconButton, UiPullIndicator, UiSection, UiSkeleton, UiTopBar,
} from '../../components/ui'
import { useToast } from '../../composable/useToast'
import { usePullToRefresh } from '../../composables/usePullToRefresh'
import { refreshOnChange } from '../../websocket/userChannel'
import { feel } from '../../utils/feel'
import { todayBrandLine } from '@/utils/brandLines'

// 갈 곳 셋: 같은 모양으로. 앱 게임은 주인공이 아니라 갈 곳 중 하나 (사용자 11/3)
const DESTINATIONS = [
  // 앱 게임은 목록으로 바로 (UX ⑤: 광장의 캐릭터 만들기부터 나와 게임을 찾지 못했다). 광장은 목록 맨 위 입구로
  { to: '/games', icon: 'gamepad', label: '앱 게임' },
  { to: '/rules', icon: 'book-open', label: '규칙' },
  { to: '/clubs', icon: 'users', label: '동호회' },
]
const brandLine = todayBrandLine()

const route = useRoute()
const router = useRouter()
const { showToast } = useToast()

const games = ref([])
const loading = ref(true)
const myId = ref(null)
const busyId = ref(null)
const pairGame = ref(null)
const commentId = ref(0)
const ruleGame = ref(null)
const challengersGame = ref(null)
const menuGame = ref(null)

// 못 불러온 것과 비어 있는 것을 구분한다 (서버가 꺼졌는데 '열린 경기가 없어요'로 보이지 않게)
const loadFailed = ref(false)
async function fetchGames() {
  try {
    const { data } = await api.get('/api/games/list', { params: { sort: 'latest' } })
    games.value = data
    loadFailed.value = false
  } catch {
    loadFailed.value = true
  } finally {
    loading.value = false
  }
}

const { pull, refreshing } = usePullToRefresh(fetchGames)
function retry() {
  loading.value = true
  fetchGames()
}

async function apply(game, team) {
  busyId.value = game.id
  try {
    await api.post(`/api/games/${game.id}/apply`, null, { params: team === undefined ? {} : { team } })
    game.isAppliedByMe = true
    feel('success')
    showToast('신청했어요. 주최자가 승인하면 알려 드려요')
  } catch (e) {
    // 428(동네 인증 필요)은 api.js가 내 동네 화면으로 보내며 같은 말을 맨 위에 보인다. 토스트로 두 번 말하지 않는다 (first10 검토)
    if (e.response?.status !== 428) showToast(e.response?.data?.message || '신청하지 못했어요. 잠시 뒤 다시 해 주세요')
  } finally {
    busyId.value = null
  }
}

async function cancelApply(game) {
  busyId.value = game.id
  try {
    await api.post('/api/games/cancel-request', { gameId: game.id })
    game.isAppliedByMe = false
    showToast('신청을 취소했어요')
  } catch (e) {
    showToast(e.response?.data?.message || '취소하지 못했어요')
  } finally {
    busyId.value = null
  }
}

let stopWatching = null
onMounted(async () => {
  myId.value = await getMyId().catch(() => null)
  fetchGames()
  // 신청·승인 같은 변화가 생기면 다시 불러온다
  stopWatching = refreshOnChange(fetchGames)
  // 링크로 들어온 댓글 (/?commentId=)
  const q = Number(route.query.commentId)
  if (q) commentId.value = q
})
onBeforeUnmount(() => stopWatching?.())
</script>
