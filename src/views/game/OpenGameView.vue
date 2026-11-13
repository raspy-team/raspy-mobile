<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar title="경기" back="/" />
    <main class="max-w-xl mx-auto px-4 pt-4 pb-16">
      <UiSkeleton v-if="!game && !error" class="h-36 w-full" />
      <!-- 연결 오류도 "경기를 찾지 못했어요"로 굳었다: 연결 오류는 다시 시도 (가로 훑기 5) -->
      <UiEmptyState v-else-if="error" class="pt-16" icon="fas fa-triangle-exclamation" :title="error" :description="offline ? '연결이 돌아오면 다시 해 주세요' : ''">
        <UiButton v-if="offline" @click="retry">다시 시도</UiButton>
        <UiButton :variant="offline ? 'ghost' : 'primary'" :class="offline ? 'mt-2' : ''" to="/">다른 경기 찾기</UiButton>
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
          @challengers="challengersGame = game"
          @more="menuGame = game"
        />
        <!-- 장소가 있으면 카카오맵으로 (UX 리뷰 ⑦) -->
        <UiButton v-if="placeMapLink(game)" block variant="secondary" icon="map" class="mt-2" @click="openMap">지도에서 보기</UiButton>
        <!-- 롤·피파처럼 다른 게임 안에서 하는 경기: 선수들의 그 게임 아이디 (선수·신청자·연 사람만, 9번) -->
        <ExtGamePlayers v-if="game.rule?.extGame && (game.ownerId === myId || game.isAppliedByMe || game.players?.some((p) => p.id === myId))" :game-id="game.id" class="mt-2 border-b border-line" />
        <!-- 더보기·신청자: 홈 목록과 같은 시트 (예전엔 눌러도 아무 일이 없었다) -->
        <GameMenuSheets v-model:menu="menuGame" v-model:challengers="challengersGame" :my-id="myId" @comments="(id) => (commentId = id)" />
        <Comment v-if="commentId" :id="commentId" @close="commentId = 0" />
        <PairApplySheet :game="pairOpen ? game : null" @close="pairOpen = false" @done="() => { game.isAppliedByMe = true; pairOpen = false }" />
        <p class="t-caption mt-4">
          <template v-if="game.gameStatus !== 'MATCHING'">{{ game.format && game.format !== 'DUEL' ? '이미 사람이 다 모인 경기예요.' : '이미 상대가 정해진 경기예요.' }}</template>
          <template v-else-if="game.ownerId === myId">신청이 오면 알림에 떠요. 내 경기에서 승인해요.</template>
          <template v-else-if="game.isAppliedByMe">신청했어요. {{ game.ownerNickname }}님이 승인하면 알림에 떠요.</template>
          <!-- 공유 링크로 다른 동네 경기에 들어온 경우: 누르기 전에 이유를 보여 준다 -->
          <template v-else-if="game.joinBlockedReason">
            <span class="text-fg-muted">{{ game.joinBlockedReason }}</span>
          </template>
          <template v-else>{{ applyHint }}</template>
        </p>
        <!-- 인증하고 이 경기로 돌아온다 (11/4 밤샘: 링크로 온 동료가 인증 뒤 경기를 다시 찾아야 했다).
             예전엔 글 끝의 작은 밑줄 글씨(51×18)라 누르기 어려웠다 (11/5 c6 320 검토) -->
        <UiButton
          v-if="game.gameStatus === 'MATCHING' && game.ownerId !== myId && !game.isAppliedByMe && game.joinBlockedReason"
          block
          icon="location-dot"
          class="mt-3"
          :to="{ path: '/neighborhood', query: { back: route.fullPath } }"
        >동네 고르기</UiButton>
        <!-- 팀 경기 단톡방: 승인된 둘 이상이면 (11/5 C) -->
        <!-- 보조 행동은 글자 버튼으로 (애플식: 꽉 찬 버튼은 화면의 주된 행동 하나만, UX 버튼 크기) -->
        <div class="mt-4 flex flex-wrap justify-center gap-x-2">
          <UiButton v-if="teamChatOpen(game, myId)" variant="ghost" icon="far fa-comment" :to="`/games/${game.id}/chat`">단톡방</UiButton>
          <UiButton v-if="game.ownerId === myId || game.players?.some((p) => p.id === myId)" variant="ghost" to="/game">내 경기에서 보기</UiButton>
          <!-- 신청할 수 있는 경기에선 '신청'과 나란히 다른 데로 가는 길이 됐다: 찼거나 끝난 경기에만 (목적 판정 11/11 4번) -->
          <UiButton v-else-if="game.gameStatus !== 'MATCHING' || game.joinBlockedReason" variant="ghost" to="/">다른 경기 찾기</UiButton>
        </div>
      </template>
    </main>
  </div>
</template>

<script setup>
import { askPushPermission } from '@/utils/nativeBridge'
// 공유 링크로 들어온 열린 경기 하나 (/games/:gameId). 피드는 끝난 경기만 보여 줘서 예전엔 링크를 받아도 신청할 곳이 없었다
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { refreshOnChange } from '../../websocket/userChannel'
import { placeMapLink } from '../../utils/kakaoMap'
import ExtGamePlayers from '../../components/external/ExtGamePlayers.vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../api/api'
import { getMyId } from '@/utils/me'
import { feel } from '../../utils/feel'
import { useToast } from '../../composables/useToast'
import OpenGameCard from '../../components/game/OpenGameCard.vue'
import PairApplySheet from '../../components/game/PairApplySheet.vue'
import GameMenuSheets from '../../components/game/GameMenuSheets.vue'
import Comment from '../GameCommentView.vue'
import { UiButton, UiEmptyState, UiSkeleton, UiTopBar } from '../../components/ui'
import { teamChatOpen, isRemote } from '../../utils/gameFormat'

const route = useRoute()
const router = useRouter()
const { showToast } = useToast()
const game = ref(null)
const error = ref('')
const busy = ref(false)
const pairOpen = ref(false)
const menuGame = ref(null)
const challengersGame = ref(null)
const commentId = ref(0)
const myId = ref(null)
// 신청 전 한 줄: 승인 뒤에 무엇이 남았나
const applyHint = computed(() => {
  const g = game.value
  const remote = isRemote(g.venue)
  const decided = !!g.matchDate && (remote || !!g.matchLocation)
  const base = decided ? `${g.ownerNickname}님이 승인하면 확정돼요.` : `${g.ownerNickname}님이 승인하면 ${remote ? '시간을' : '시간·장소를'} 함께 정해요.`
  // 처음 만나는 사이의 '앱 게임 한 판 먼저'는 강제에서 권장으로 바꿨다 (11/13). 신청 전 문구에서 뺀다
  return base
})

// 앱 안 웹뷰에서도 밖(카카오맵 앱·브라우저)으로 연다
function openMap() { window.open(placeMapLink(game.value), '_blank', 'noopener') }

async function load() {
  try {
    const g = (await api.get('/api/games/summary', { params: { gameId: route.params.gameId } })).data
    // AI 주민의 경기는 끝난 결과만 보인다 (docs/ai-residents.md 6). 연 사람 카드(온도)·응원 칸 대신 결과로
    if (g.ownerIsBot) return router.replace(`/games/${g.id}/result`)
    game.value = g
    error.value = ''
    offline.value = false
  } catch (e) {
    offline.value = !e?.response || e.response.status >= 500
    // 보던 중 다시 부르기만 실패하면 화면을 덮지 않는다
    if (offline.value && game.value) return
    error.value = offline.value ? '경기를 불러오지 못했어요' : (e.response?.data?.message || '경기를 찾지 못했어요')
  }
}
const offline = ref(false)
function retry() {
  error.value = ''
  load()
}

async function apply(team) {
  busy.value = true
  try {
    await api.post(`/api/games/${game.value.id}/apply`, null, { params: team === undefined ? {} : { team } })
    askPushPermission('신청이 받아들여지면 바로 알려 드려요')
    feel('success')
    await load()
  } catch (e) {
    if (e.response?.status !== 428) showToast(e.response?.data?.message || '신청하지 못했어요') // 428은 내 동네 화면이 말한다
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

// 연 채로 승인·마감돼도 그대로였다: 서버의 바뀜 신호로 다시 불러온다 (폴링 없이)
let stopWatching = null
onMounted(async () => {
  myId.value = await getMyId()
  await load()
  stopWatching = refreshOnChange(() => load())
})
onBeforeUnmount(() => stopWatching?.())
</script>
