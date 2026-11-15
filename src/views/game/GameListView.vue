<template>
  <!-- 홈 (목적 판정 11/11 4번): 홈을 다시 여는 사람의 이유는 "하던 판을 이어 가려고"다.
       앱 게임 판을 낸 사람: '내 판'(마지막 판·기다리는 결과·한 판 더) + 동네 경기 한 줄.
       낸 적 없는 사람(동네 경기만): 지금처럼 동네 경기 목록. 지도·경기 만들기는 동네 경기 머리에,
       동호회·내 규칙은 내 정보로 옮겼다. 동네 인증은 필요한 순간에 묻는다 -->
  <UiTopBar title="홈">
    <!-- 사람 찾기를 홈에서 한 번에 (11/14: 내 정보 → 친구 → 사람 찾기로 세 번 눌러야 했다) -->
    <template #right><UiIconButton icon="magnifying-glass" label="사람 찾기" @click="findPeople = true" /><InboxButtons /></template>
  </UiTopBar>
  <UserSearchModal v-if="findPeople" @close="findPeople = false" />

  <main class="px-4 pt-4 pb-32 max-w-xl mx-auto">
    <UiPullIndicator :pull="pull" :refreshing="refreshing" />
    <!-- 위쪽 칸들이 다 도착한 뒤 한 번에 그린다 (quality-rules T-1·T-4: 늦게 온 칸이 '내 판'과 버튼을 아래로 밀었다) -->
    <div v-if="!settled" class="space-y-3" role="status" aria-label="불러오는 중">
      <UiSkeleton class="h-24 w-full rounded-xl" />
      <UiSkeleton class="h-40 w-full rounded-xl" />
      <UiSkeleton class="h-14 w-full rounded-xl" />
      <p class="late-note t-caption text-center pt-2">동네 경기와 소식을 불러오는 중이에요</p>
    </div>
    <div v-show="settled">
    <!-- 홈은 누구에게나 같은 모양이다 (11/15 고병연): 한 판이라도 한 사람의 홈은 잡힌 경기·학교 대항·내 판·접힌 동네 경기가 차례로 쌓여
         막 가입한 사람의 홈과 다른 앱 같았다. 하던 판·잡힌 경기·결과는 '내 경기' 탭에 있고(탭의 숫자가 할 일을 알린다), 홈은 새 판을 찾는 곳이다 -->
    <!-- 받은 '한 판 붙자'는 홈에서 바로 받는다 (11/14 피터로 걷기: 종의 점 하나뿐이라 받은 줄 몰랐다) -->
    <OneGameRequests class="mb-6" />
    <!-- 지금 사람이 있나: 실제 수가 넉넉할 때만 한 줄 (11/14 '빈 식당') -->
    <ImprovPulse variant="home" />

    <!-- 지금 할 것 하나는 주 버튼으로 (11/14 전수 평가: 홈에 흰 버튼이 하나도 없어 눈이 갈 곳이 없었다) -->
    <div class="flex gap-2">
      <UiButton class="flex-1" icon="gamepad" to="/games">앱 게임 한 판</UiButton>
      <UiButton variant="secondary" icon="user-plus" @click="inviteFriend('home')">친구 부르기</UiButton>
    </div>

    <!-- 머리줄은 동네 이름 하나로 (11/14 폰으로 한 바퀴): '동네 경기' 제목과 '합정동 근처 동네 14곳 경기까지' 줄이 같은 말을 두 번 했다.
         접는 화살표도 여기: 펼친 뒤에는 접을 길이 없었다 -->
    <section class="mt-6">
      <div class="flex items-center justify-between gap-2 mb-3">
        <NeighborhoodBar v-if="hasDong" class="min-w-0" @changed="fetchGames(); loadDong()" />
        <h2 v-else class="t-heading">전국 경기</h2>
        <div class="flex items-center -mr-2 shrink-0">
          <UiIconButton icon="map" label="지도로 보기" @click="router.push('/map')" />
          <UiIconButton icon="plus" label="경기 만들기" @click="router.push('/create-game')" />
        </div>
      </div>
      <!-- 동네를 안 정한 사람에게: 작은 밑줄 글 한 줄(동네 줄의 '동네를 고르면…')뿐이라 정하라는 말이 없는 것과 같았다 (11/15 고병연).
           누를 수 있는 한 줄로 바꿨다. 정하고 나면 이 화면으로 돌아온다 -->
      <RouterLink v-if="!hasDong" :to="{ path: '/neighborhood', query: { back: '/' } }" class="mb-3 flex items-center gap-3 rounded-xl bg-surface px-4 py-3 active:bg-surface-2">
        <UiIcon name="location-dot" class="text-signal-fg" aria-hidden="true" />
        <span class="flex-1 min-w-0">
          <span class="block t-label">내 동네를 정해 주세요</span>
          <span class="block t-micro mt-0.5">가까운 경기와 동네 소식이 먼저 보여요</span>
        </span>
        <UiIcon name="chevron-right" class="text-fg-subtle" aria-hidden="true" />
      </RouterLink>
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
          <div class="flex items-center gap-3 mt-4">
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
        <UiEmptyState mascot="match" title="아직 모집 중인 경기가 없어요" description="위의 +로 첫 경기를 열 수 있어요">
          <!-- 버튼은 모두 뺐다: 경기 만들기는 위 '동네 경기'의 +, 범위는 동네 줄, 앱 게임은 맨 위와 겹쳤다 (11/13 고병연) -->
        </UiEmptyState>
      </UiCard>

      <div v-else class="space-y-3 ui-appear">
        <template v-for="(game, i) in games.slice(0, HOME_GAMES)" :key="game.id">
        <!-- 우리 동네 경기가 적으면 서버가 다른 동네 경기를 가까운 순으로 채워 준다: 어디부터인지 한 줄로 (소식과 같은 말) -->
        <p v-if="game.elsewhere && !games[i - 1]?.elsewhere" class="t-caption flex items-center gap-1.5 pt-1">
          <UiIcon name="location-dot" aria-hidden="true" />{{ i === 0 ? '우리 동네 경기가 아직 없어서 가까운 순으로 다른 동네 경기를 보여요' : '우리 동네 경기가 아직 적어서 가까운 순으로 다른 동네 경기도 보여요' }}
        </p>
        <OpenGameCard
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
        </template>
        <!-- 소식에 '모두 보기'가 있듯 경기도 (11/15 고병연): 전국의 모집 중인 경기를 종목·순서로 골라 본다 -->
        <UiButton block variant="secondary" to="/open-games">모두 보기</UiButton>
      </div>
    </section>
    <HomeFeedPeek />
    </div>
  </main>

  <!-- 친구와 둘이 신청 (팀 경기) -->
  <PairApplySheet :game="pairGame" @close="pairGame = null" @done="(g) => { g.isAppliedByMe = true; pairGame = null }" />

  <GameMenuSheets v-model:menu="menuGame" v-model:challengers="challengersGame" :my-id="myId" @comments="(id) => (commentId = id)" />

  <Comment v-if="commentId != 0" :id="commentId" @close="commentId = 0" />
  <MatchRuleModal v-if="ruleGame" :rule="ruleGame.rule" @close="ruleGame = null" />
</template>

<script setup>
import { useSettled } from '@/stores/net'
const settled = useSettled()
import { josa } from '@/utils/format'
// 홈: 앱 게임을 한 사람은 '내 판'이 먼저, 동네 경기만 하는 사람은 동네 경기 목록 (목적 판정 11/11 4번)
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
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
import HomeFeedPeek from '../../components/feed/HomeFeedPeek.vue'
import OneGameRequests from '../../components/game/OneGameRequests.vue'
import { inviteFriend } from '@/utils/inviteFriend'
import UserSearchModal from '../../components/profile/UserSearchModal.vue'
const findPeople = ref(false)
import ImprovPulse from '../../components/appgame/ImprovPulse.vue'
import { collapseWaitingDuels } from '@/utils/appGame'
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
const HOME_GAMES = 5 // 홈에는 몇 개만, 나머지는 '모두 보기'
const duels = ref([])
const myIdNow = ref(null)
// 이 기기에 남은 마지막 판이 없으면 서버에 묻는다 (11/14 피터로 걷기: 인스타 안 브라우저에서 한 판 하고 가입한 사람이
// 앱이나 사파리로 다시 오면 기기가 달라 홈이 '모르는 사람들의 경기 목록'이었다). 들어오는 길이 임기응변이라 그 등급이 있으면 그것을 마지막 판으로
const serverLast = ref(null)
const lastGame = computed(() => (savedLast && (!savedLast.uid || savedLast.uid === myIdNow.value) ? savedLast : serverLast.value))
onMounted(async () => {
  if (savedLast) return
  const g = (await GET('/api/improv/schools', { quiet: true }).catch(() => null))?.data?.myGrade
  if (g) serverLast.value = { key: 'improv', title: '임기응변 등급', line: `${g}등급` }
})
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
  return d.result === 'WIN' ? `${name}에게 이겼어요` : d.result === 'LOSE' ? `${name}에게 졌어요` : `${josa(name, '과/와')} 비겼어요`
}
// 임기응변은 점수 대신 등급이 이 사람의 말이다
function gradeOf(d) {
  const m = d.myFeedback?.match(/^(\d)등급/)
  if (d.key === 'power-level') return '' // 히어로 대결은 점수가 없다
  return m ? `${m[1]}등급` : d.myScore != null ? `${Math.round(d.myScore)}점` : ''
}
// 동네 경기를 펼쳤는지 기억한다 (올 때마다 접혀 다시 눌렀다, 11/11 쌓이는 피로 전수표)
const showLocal = ref((() => { try { return localStorage.getItem('home_show_local') === '1' } catch { return false } })())
watch(showLocal, (v) => { try { localStorage.setItem('home_show_local', v ? '1' : '0') } catch { /* 다음에 접혀 있을 뿐 */ } })

const route = useRoute()
// 동네를 안 고른 사람에게 전국 경기를 '동네 경기'라고 불렀다 (11/13 실제 기기 한 바퀴)
const hasDong = ref(true)
const areaTitle = computed(() => (hasDong.value ? '동네 경기' : '전국 경기'))
async function loadDong() {
  const r = await GET('/api/neighborhoods/me').catch(() => null)
  if (r) hasDong.value = (r.data?.neighborhoods ?? []).length > 0
}
onMounted(loadDong)
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
  const fresh = (await GET('/api/app-games/duels/active').catch(() => ({ data: null }))).data
  duels.value = fresh ? collapseWaitingDuels(fresh) : duels.value
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
    showToast('신청을 취소했어요. 다시 신청할 수 있어요')
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
