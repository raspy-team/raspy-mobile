<template>
  <!-- 홈 (목적 판정 11/11 4번): 홈을 다시 여는 사람의 이유는 "하던 판을 이어 가려고"다.
       앱 게임 판을 낸 사람: '내 판'(마지막 판·기다리는 결과·한 판 더) + 동네 경기 한 줄.
       낸 적 없는 사람(동네 경기만): 지금처럼 동네 경기 목록. 지도·경기 만들기는 동네 경기 머리에,
       동호회·내 규칙은 내 정보로 옮겼다. 동네 인증은 필요한 순간에 묻는다 -->
  <UiTopBar title="홈">
    <template #right><InboxButtons /></template>
  </UiTopBar>

  <main class="px-4 pt-4 pb-32 max-w-xl mx-auto">
    <UiPullIndicator :pull="pull" :refreshing="refreshing" />

    <template v-if="appPlayer">
      <UiSection title="내 판">
        <UiCard v-if="lastGame">
          <p class="t-micro">마지막 판</p>
          <p class="t-heading mt-0.5 truncate">{{ lastGame.title }}<span v-if="lastGame.line" class="t-body text-fg-muted ml-2">{{ lastGame.line }}</span></p>
          <div class="grid grid-cols-2 gap-2 mt-4">
            <!-- '한 판 더'는 게임 첫 화면을 거치지 않고 바로 판으로 (경로 4 리뷰 G3, again=1은 게임 화면이 받아 바로 시작) -->
            <UiButton :to="`/play/${lastGame.key}?again=1`">한 판 더</UiButton>
            <UiButton variant="secondary" to="/games">다른 게임</UiButton>
          </div>
        </UiCard>
        <!-- 막 끝난 결과: 이겼나 졌나. 대결이 끝나는 순간 아래 목록에서 빠져 홈에서 결과를 볼 길이 없었다 (경로 4 리뷰 G1, 시나리오 T7) -->
        <ul v-if="recentResults.length" class="mt-3 rounded-xl bg-surface divide-y divide-line">
          <li v-for="d in recentResults" :key="d.gameId">
            <RouterLink :to="`/play/${d.key}?duel=${d.gameId}`" class="flex items-center gap-3 px-4 py-3 active:bg-surface-2">
              <span class="flex-1 min-w-0">
                <span class="block t-body text-fg truncate">{{ resultLine(d) }}</span>
                <span class="block t-micro truncate">{{ d.title }}<template v-if="gradeOf(d)"> · {{ gradeOf(d) }}</template></span>
              </span>
              <UiIcon name="chevron-right" class="text-fg-subtle" aria-hidden="true" />
            </RouterLink>
          </li>
        </ul>
        <!-- 결과가 나왔나·내 차례인가·상대를 기다리나: 다시 연 이유 그 자체 -->
        <AppDuelList v-if="duels.length" :duels="duels.slice(0, 3)" :class="lastGame ? 'mt-3' : ''" />
        <RouterLink v-if="duels.length > 3" to="/game" class="block t-caption text-center mt-2 py-2">{{ duels.length - 3 }}개 더 보기</RouterLink>
        <UiButton v-if="!lastGame" block variant="secondary" class="mt-3" to="/games">다른 게임</UiButton>
      </UiSection>

      <button v-if="!showLocal" type="button" class="mt-6 w-full flex items-center justify-between rounded-xl bg-surface px-4 py-3.5 active:bg-surface-2" @click="showLocal = true">
        <span class="t-heading">동네 경기</span>
        <span class="t-caption flex items-center gap-1">{{ games.length ? `${games.length}개` : '' }}<UiIcon name="chevron-right" class="text-fg-subtle" aria-hidden="true" /></span>
      </button>
    </template>

    <template v-if="!appPlayer || showLocal">
    <!-- 앱 게임을 아직 안 한 사람에게 하나: 가입 없이도 되는 한 판 (예전 '갈 곳 셋' 중 이것만 남겼다) -->
    <RouterLink v-if="!appPlayer" to="/games" class="flex items-center gap-3 rounded-xl bg-surface px-4 py-3 active:bg-surface-2">
      <UiIcon name="gamepad" class="text-fg-muted" aria-hidden="true" />
      <span class="flex-1 t-heading">앱 게임 한 판</span>
      <UiIcon name="chevron-right" class="text-fg-subtle" aria-hidden="true" />
    </RouterLink>

    <UiSection title="동네 경기" :class="appPlayer ? 'mt-6' : 'mt-6'">
      <template #action>
        <span v-if="games.length" class="t-micro mr-1">{{ games.length }}개</span>
        <!-- 동네 경기를 보러 온 사람이 동네 동호회도 여기서 찾는다 (경로 7 K4: 내 정보 속 버튼 하나뿐이었다) -->
        <UiIconButton icon="users" label="동네 동호회" @click="router.push('/clubs')" />
        <UiIconButton icon="map" label="지도로 보기" @click="router.push('/map')" />
        <UiIconButton icon="plus" label="경기 만들기" @click="router.push('/create-game')" />
      </template>
      <NeighborhoodBar class="mb-3" @changed="fetchGames" />
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
        <UiEmptyState mascot="match" title="아직 모집 중인 경기가 없어요">
          <UiButton to="/create-game">경기 만들기</UiButton>
          <!-- 동네에 아직 사람이 없을 때 바로 할 수 있는 것: 범위 넓히기(동네 경기 화면이라 먼저), 전국 앱 게임 (11/4 밤샘, 제주에서 온 사람. 문구·모양 C) -->
          <div class="flex flex-wrap justify-center gap-2 mt-2">
            <UiButton size="sm" variant="secondary" to="/neighborhood">범위 넓히기</UiButton>
            <UiButton size="sm" variant="ghost" to="/games">앱 게임</UiButton>
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
          @rule="router.push(`/games/${game.id}`)"
          @profile="router.push('/profile/' + game.ownerId)"
          @apply="(team) => apply(game, team)"
          @pair="pairGame = game"
          @cancel="cancelApply(game)"
          @challengers="challengersGame = game"
          @more="menuGame = game"
        />
      </div>
    </UiSection>
    </template>
  </main>

  <!-- 친구와 둘이 신청 (팀 경기) -->
  <PairApplySheet :game="pairGame" @close="pairGame = null" @done="(g) => { g.isAppliedByMe = true; pairGame = null }" />

  <GameMenuSheets v-model:menu="menuGame" v-model:challengers="challengersGame" :my-id="myId" @comments="(id) => (commentId = id)" />

  <Comment v-if="commentId != 0" :id="commentId" @close="commentId = 0" />
  <MatchRuleModal v-if="ruleGame" :rule="ruleGame.rule" @close="ruleGame = null" />
</template>

<script setup>
// 홈: 앱 게임을 한 사람은 '내 판'이 먼저, 동네 경기만 하는 사람은 동네 경기 목록 (목적 판정 11/11 4번)
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../api/api'
import { getMyId } from '@/utils/me'

// 최근 2주 안에 낸 앱 게임 (AppGameView가 판을 낼 때 남긴다). 같은 폰에서 계정을 바꾸면 앞 사람 것이 떴다:
// 남긴 사람(uid)이 있으면 지금 계정과 맞을 때만 (경로 4 리뷰 G4)
const savedLast = (() => {
  try {
    const v = JSON.parse(localStorage.getItem('last_app_game') || 'null')
    return v?.key && Date.now() - v.at < 14 * 24 * 3600_000 ? v : null
  } catch {
    return null
  }
})()
import InboxButtons from '../../components/inbox/InboxButtons.vue'
import MatchRuleModal from '../../components/MatchModal.vue'
import OpenGameCard from '../../components/game/OpenGameCard.vue'
import PairApplySheet from '../../components/game/PairApplySheet.vue'
import GameMenuSheets from '../../components/game/GameMenuSheets.vue'
import NeighborhoodBar from '../../components/neighborhood/NeighborhoodBar.vue'
import AppDuelList from '../../components/appgame/AppDuelList.vue'
import { GET } from '@/api/client'
import Comment from '../GameCommentView.vue'
import {
  UiButton, UiCard, UiEmptyState, UiIcon, UiIconButton, UiPullIndicator, UiSection, UiSkeleton, UiTopBar,
} from '../../components/ui'
import { useToast } from '../../composables/useToast'
import { usePullToRefresh } from '../../composables/usePullToRefresh'
import { refreshOnChange } from '../../websocket/userChannel'
import { feel } from '../../utils/feel'

// 아직 안 끝난 앱 대결 (내 경기 화면과 같은 자료)
const duels = ref([])
const myIdNow = ref(null)
const lastGame = computed(() => (savedLast && (!savedLast.uid || savedLast.uid === myIdNow.value) ? savedLast : null))
const appPlayer = computed(() => !!lastGame.value || duels.value.length > 0)

// 막 끝난 대결 (하루 안). 마지막 판 게임의 내 대결에서 결과가 난 것
const recentResults = ref([])
async function fetchRecentResults() {
  const key = lastGame.value?.key
  if (!key) return
  const list = (await GET('/api/app-games/{key}/duels', { path: { key } }).catch(() => ({ data: null }))).data
  if (!list) return
  const dayAgo = Date.now() - 24 * 3600_000
  recentResults.value = list.filter((d) => d.result && new Date(d.createdAt).getTime() > dayAgo).slice(0, 2)
}
function resultLine(d) {
  const name = d.opponent?.nickname ? `${d.opponent.nickname}님` : '상대'
  return d.result === 'WIN' ? `${name}에게 이겼어요` : d.result === 'LOSE' ? `${name}에게 졌어요` : `${name}와 비겼어요`
}
// 임기응변은 점수 대신 등급이 이 사람의 말이다
function gradeOf(d) {
  const m = d.myFeedback?.match(/^(\d)등급/)
  return m ? `${m[1]}등급` : d.myScore != null ? `${Math.round(d.myScore)}점` : ''
}
const showLocal = ref(false)

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
async function fetchDuels() {
  duels.value = (await GET('/api/app-games/duels/active').catch(() => ({ data: null }))).data ?? duels.value
  fetchRecentResults()
}
async function fetchGames() {
  fetchDuels()
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
    showToast('신청했어요. 주최자가 승인하면 알림에 떠요')
  } catch (e) {
    // 428(동네 인증 필요)은 api.js가 내 동네 화면으로 보내며 같은 말을 맨 위에 보인다. 토스트로 두 번 말하지 않는다 (first10 검토)
    // 본인인증이 필요하면(400 '휴대폰 본인인증') api.js가 인증 화면으로 보낸다. 거기서도 토스트를 띄우지 않는다 (경로 전부 훑기 4)
    const identity = String(e.response?.data?.message || '').includes('휴대폰 본인인증')
    if (e.response?.status !== 428 && !identity) showToast(e.response?.data?.message || '신청하지 못했어요. 잠시 뒤 다시 해 주세요')
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
  myIdNow.value = myId.value
  fetchGames()
  // 신청·승인 같은 변화가 생기면 다시 불러온다
  stopWatching = refreshOnChange(fetchGames)
  // 링크로 들어온 댓글 (/?commentId=)
  const q = Number(route.query.commentId)
  if (q) commentId.value = q
})
onBeforeUnmount(() => stopWatching?.())
</script>
