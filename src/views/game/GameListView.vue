<template>
  <UiTopBar title="경기">
    <template #right><InboxButtons /></template>
  </UiTopBar>

  <main class="px-4 pt-4 pb-32 max-w-xl mx-auto">
    <UiPullIndicator :pull="pull" :refreshing="refreshing" />

    <!-- 첫 설정을 막 마친 사람에게 한 번 -->
    <UiCard v-if="route.query.welcome" class="mb-4 flex items-start gap-3">
      <span class="w-10 h-10 rounded-full bg-primary-soft text-primary flex items-center justify-center flex-shrink-0" aria-hidden="true">
        <UiIcon name="fas fa-hand" />
      </span>
      <div class="flex-1 min-w-0">
        <p class="t-heading">준비됐어요!</p>
        <p class="t-caption mt-0.5">아래 열린 경기에 신청하거나, 원하는 규칙으로 직접 경기를 열어보세요.</p>
      </div>
      <UiIconButton icon="fas fa-xmark" label="닫기" class="-mt-2 -mr-2" @click="router.replace({ query: {} })" />
    </UiCard>

    <!-- 지금 동네 (경기 목록이 이 동네 범위를 따른다) -->
    <NeighborhoodBar class="mb-3" @changed="fetchGames" />

    <!-- 주 행동은 경기 만들기 하나. 화면에서 가장 밝은 덩어리가 내용보다 앞서지 않게 작게 -->
    <!-- 버튼이 늘어 한 줄에 다 안 들어가면 옆으로 민다 (줄바꿈하면 '동호/회'처럼 깨진다) -->
    <div class="flex items-center gap-1 -mx-4 px-4 overflow-x-auto no-scrollbar [&>*]:flex-shrink-0 [&>*]:whitespace-nowrap">
      <UiButton size="sm" icon="plus" to="/create-game">경기 만들기</UiButton>
      <UiButton size="sm" variant="ghost" to="/rules">규칙</UiButton>
      <UiButton size="sm" variant="ghost" to="/match">맞붙기 카드</UiButton>
      <UiButton size="sm" variant="ghost" to="/clubs">동호회</UiButton>
    </div>

    <!-- 지금 상황으로 찾기 (docs/direction.md '찾기': 홈에는 자주 쓰는 조합을 줄로) -->
    <div class="flex gap-2 mt-5 -mx-4 px-4 overflow-x-auto no-scrollbar" role="group" aria-label="상황으로 찾기">
      <UiChip v-for="s in SITUATIONS" :key="s.label" class="flex-shrink-0 whitespace-nowrap" :icon="s.icon" @click="router.push({ path: '/rules', query: s.query })">{{ s.label }}</UiChip>
    </div>

    <!-- 누가 지금 앱 게임에서 상대를 기다리면 홈에서 바로 붙는다 (없으면 안 보인다) -->
    <WaitingNow class="mt-6" />
    <AppGameStrip class="mt-6" />

    <UiSection title="열린 경기" class="mt-6">
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
        <UiEmptyState icon="fas fa-rotate-right" title="경기를 불러오지 못했어요" description="연결이 돌아오면 다시 시도해 주세요">
          <UiButton variant="secondary" @click="retry">다시 시도</UiButton>
        </UiEmptyState>
      </UiCard>

      <UiCard v-else-if="!games.length">
        <UiEmptyState icon="fas fa-trophy" title="아직 열린 경기가 없어요" description="첫 경기를 만들면 동네 사람들에게 보여요">
          <UiButton to="/create-game">경기 만들기</UiButton>
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

  <!-- 신청자 -->
  <UiSheet :model-value="!!challengersGame" :title="`신청자 ${challengersGame?.challengers?.length || 0}명`" @update:model-value="challengersGame = null">
    <UiList v-if="challengersGame?.challengers?.length">
      <UiListItem
        v-for="c in challengersGame.challengers"
        :key="c.userId"
        :title="c.applicantNickname"
        :subtitle="ratingLine(c.applicantGameStatisticsDTO) || '첫 경기를 앞두고 있어요'"
        chevron
        @click="router.push('/profile/' + c.userId)"
      >
        <template #leading><UiAvatar :src="c.applicantProfileUrl" :name="c.applicantNickname" size="sm" /></template>
      </UiListItem>
    </UiList>
    <UiEmptyState v-else icon="fas fa-user-group" title="아직 신청한 사람이 없어요" />
  </UiSheet>

  <!-- 더보기 -->
  <UiSheet :model-value="!!menuGame" @update:model-value="menuGame = null">
    <UiList>
      <UiListItem icon="far fa-comment" title="댓글" @click="openComments(menuGame)" />
      <UiListItem v-if="menuGame?.ownerId !== myId" icon="far fa-paper-plane" title="주최자에게 메시지" @click="router.push('/chat/' + menuGame.ownerId)" />
      <UiListItem icon="fas fa-arrow-up-from-bracket" title="공유하기" subtitle="링크를 복사해요" @click="share(menuGame)" />
      <UiListItem v-if="menuGame?.ownerId !== myId" icon="far fa-flag" title="신고하기" danger @click="openReport(menuGame)" />
    </UiList>
  </UiSheet>

  <!-- 신고 -->
  <UiSheet :model-value="!!reportGame" title="이 경기를 신고할까요?" @update:model-value="reportGame = null">
    <p class="t-caption mb-4">어떤 문제인지 알려주시면 확인 후 조치할게요.</p>
    <div class="flex flex-wrap gap-2 mb-4">
      <UiChip v-for="r in REPORT_REASONS" :key="r" :selected="reportReason === r" @click="reportReason = r">{{ r }}</UiChip>
    </div>
    <UiInput v-if="reportReason === '기타'" v-model="reportDetail" multiline :rows="3" placeholder="자세히 적어주세요" />
    <template #footer>
      <UiButton
        block
        variant="danger"
        :disabled="!reportReason || (reportReason === '기타' && !reportDetail.trim())"
        :loading="reporting"
        @click="submitReport"
      >
        신고하기
      </UiButton>
    </template>
  </UiSheet>

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
import AppGameStrip from '../../components/appgame/AppGameStrip.vue'
import WaitingNow from '../../components/appgame/WaitingNow.vue'
import NeighborhoodBar from '../../components/neighborhood/NeighborhoodBar.vue'
import Comment from '../GameCommentView.vue'
import {
  UiAvatar, UiButton, UiCard, UiChip, UiEmptyState, UiIconButton, UiInput, UiList, UiListItem,
  UiPullIndicator, UiSection, UiSheet, UiSkeleton, UiTopBar,
} from '../../components/ui'
import { useToast } from '../../composable/useToast'
import { usePullToRefresh } from '../../composables/usePullToRefresh'
import { refreshOnChange } from '../../websocket/userChannel'
import { ratingLine } from '../../utils/format'
import { copyText } from '../../utils/clipboard'
import { haptic } from '../../utils/haptics'

const REPORT_REASONS = ['욕설·비방', '거짓 경기', '광고·스팸', '기타']
// 홈의 상황 줄. 값은 규칙 둘러보기 주소(?place=&party=&length=)와 같다
const SITUATIONS = [
  { label: '지금 폰만 있으면', icon: 'bolt', query: { place: 'PHONE' } },
  { label: '친구랑 둘이', icon: 'user-group', query: { party: 'DUO' } },
  { label: '술자리·모임에서', icon: 'users', query: { place: 'GATHERING' } },
  { label: '1분이면', icon: 'stopwatch', query: { length: 'MINUTE' } },
  { label: '집에서', icon: 'home', query: { place: 'HOME' } },
]

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
const reportGame = ref(null)
const reportReason = ref('')
const reportDetail = ref('')
const reporting = ref(false)

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
    haptic('success')
    showToast('신청했어요. 주최자가 승인하면 알려드려요')
  } catch (e) {
    showToast(e.response?.data?.message || '신청하지 못했어요. 잠시 뒤 다시 시도해주세요')
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

async function share(game) {
  menuGame.value = null
  try {
    const { data } = await api.post('/api/invite', null, { params: { gameId: game.id } })
    showToast((await copyText(data.url)) ? '링크를 복사했어요' : '복사하지 못했어요')
  } catch {
    showToast('링크를 만들지 못했어요')
  }
}

function openReport(game) {
  menuGame.value = null
  reportReason.value = ''
  reportDetail.value = ''
  reportGame.value = game
}

async function submitReport() {
  reporting.value = true
  try {
    const reason = reportReason.value === '기타' ? reportDetail.value.trim() : reportReason.value
    await api.post('/api/reports', { targetType: 'GAME', targetId: reportGame.value.id, reason })
    showToast('신고를 접수했어요. 확인 후 조치할게요')
  } catch (e) {
    showToast(e.response?.data?.message || '이미 신고한 경기예요')
  } finally {
    reporting.value = false
    reportGame.value = null
  }
}

function openComments(game) {
  menuGame.value = null
  commentId.value = game.id
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
