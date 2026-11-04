<template>
  <UiTopBar title="내 경기">
    <template #right><InboxButtons /></template>
  </UiTopBar>

  <main class="px-4 pt-4 pb-32 max-w-xl mx-auto space-y-8">
    <UiPullIndicator :pull="pull" :refreshing="refreshing" />

    <div v-if="loading" class="space-y-3">
      <UiCard v-for="n in 2" :key="n">
        <div class="flex gap-3">
          <UiSkeleton class="w-10 h-10" />
          <div class="flex-1 space-y-2">
            <UiSkeleton class="h-4 w-2/3" />
            <UiSkeleton class="h-3 w-1/2" />
          </div>
        </div>
        <UiSkeleton class="h-11 w-full mt-4" />
      </UiCard>
    </div>

    <!-- 아직 경기가 없을 때: 무엇을 하면 되는지 순서로 -->
    <section v-else-if="!allGames.length && !appDuels.length && !pendingReviews.length" class="pt-6">
      <h2 class="t-title">첫 경기를 잡아볼까요</h2>
      <p class="t-caption mt-2">잡힌 경기는 여기에 모여요. 할 일이 생기면 맨 위에 보여요.</p>
      <ol class="mt-8 bg-surface rounded-xl divide-y divide-line">
        <li v-for="(s, i) in FIRST_STEPS" :key="s.title" class="flex items-baseline gap-4 px-4 py-4">
          <span class="t-mono w-6 flex-shrink-0">{{ String(i + 1).padStart(2, '0') }}</span>
          <span>
            <span class="block text-[0.9375rem] font-semibold text-fg">{{ s.title }}</span>
            <span class="block t-caption mt-0.5">{{ s.body }}</span>
          </span>
        </li>
      </ol>
      <div class="flex gap-2 mt-6">
        <UiButton class="flex-1" to="/">경기 찾기</UiButton>
        <UiButton class="flex-1" variant="secondary" to="/create-game">경기 만들기</UiButton>
      </div>
    </section>

    <template v-else>
      <!-- 앱 게임에서 아직 안 끝난 대결: 게임마다 흩어지지 않게 여기 모은다 -->
      <UiSection v-if="appDuels.length" :title="`앱 게임 ${appDuels.length}`">
        <AppDuelList :duels="appDuels" />
      </UiSection>
      <UiSection v-if="pendingReviews.length" :title="`평가 남기기 ${pendingReviews.length}`">
        <UiList>
          <UiListItem
            v-for="r in pendingReviews"
            :key="r.gameId"
            icon="star"
            :title="r.ruleTitle"
            :subtitle="r.opponentNickname ? `${r.opponentNickname}님과 규칙을 평가해 주세요` : '상대와 규칙을 평가해 주세요'"
            chevron
            @click="router.push(`/games/${r.gameId}/result`)"
          />
        </UiList>
      </UiSection>
      <UiSection v-for="g in groups" :key="g.key" :title="`${g.title} ${g.items.length}`">
        <div class="space-y-3">
          <div v-for="game in g.items" :key="game.type + game.id" class="space-y-2">
            <MyGameCard
              :game="game"
              :me="me"
              @profile="(id) => id && router.push('/profile/' + id)"
              @play="router.push(`/games/${game.id}/play`)"
              @result="router.push(`/games/${game.id}/result`)"
              @start="openStart(game)"
              @applicants="applicantsGame = game"
              @share="share(game)"
              @cancel-request="cancelRequest(game)"
              @more="menuGame = game"
              @schedule="openSchedule(game)"
            />
            <!-- 만나서 하는 경기: 도착·끝 확인, 노쇼, 위치 공유 (안전·신뢰 C) -->
            <MeetSafetyCard v-if="needsMeetCard(game)" :game-id="game.id" />
          </div>
        </div>
      </UiSection>
    </template>
  </main>

  <!-- 신청자: 한 명을 승인하면 경기가 확정된다 -->
  <UiSheet :model-value="!!applicantsGame" :title="`신청자 ${applicantsGame?.applicants?.length || 0}명`" @update:model-value="applicantsGame = null">
    <p class="t-caption mb-4">{{ applicantsHint(applicantsGame) }}</p>
    <UiList v-if="applicantsGame?.applicants?.length">
      <UiListItem
        v-for="a in applicantsGame.applicants"
        :key="a.userId"
        :title="a.applicantNickname"
        :subtitle="(a.team != null ? TEAM_NAMES[a.team] + ' · ' : '') + (a.temperature != null ? `${a.temperature.toFixed(1)}° ${a.trustLabel} · ` : '') + (ratingLine(a.applicantGameStatisticsDTO) || '첫 경기를 앞두고 있어요')"
        plain
      >
        <template #leading>
          <button type="button" :aria-label="`${a.applicantNickname} 프로필`" @click="router.push('/profile/' + a.userId)"><UiAvatar :src="a.applicantProfileUrl" :name="a.applicantNickname" size="sm" /></button>
        </template>
        <template #trailing>
          <UiButton v-if="a.approved" size="sm" variant="secondary" :loading="busy" @click.stop="cancelApproval(applicantsGame, a)">승인 취소</UiButton>
          <!-- 처음 보는 사람과 만나서 하는 1:1은 앱 게임 한 판이 먼저 (안전·신뢰 D) -->
          <UiButton v-else-if="a.needsAppGameFirst" size="sm" variant="secondary" icon="paper-plane" @click.stop="ladderFor = a">앱 게임 한 판</UiButton>
          <UiButton v-else size="sm" :disabled="!canApprove(applicantsGame, a)" :loading="busy" @click.stop="approve(applicantsGame, a)">승인</UiButton>
        </template>
      </UiListItem>
    </UiList>
    <UiEmptyState v-else icon="fas fa-user-group" title="아직 신청한 사람이 없어요" description="링크를 공유하면 더 빨리 모여요" />
  </UiSheet>

  <!-- 신뢰 사다리: 처음 보는 사람과 1:1로 만나기 전에 앱 게임 한 판 (안전·신뢰 D) -->
  <UiSheet :model-value="!!ladderFor" title="먼저 앱 게임 한 판" @update:model-value="ladderFor = null">
    <p class="t-caption mb-4">{{ ladderFor?.applicantNickname }}님과는 처음 만나요. 앱 게임을 한 판 같이 하면 승인할 수 있어요. 내가 먼저 하면 같은 문제로 도전장이 메시지로 가고, 상대가 하면 끝나요</p>
    <UiList>
      <UiListItem v-for="g in LADDER_GAMES" :key="g.key" :icon="g.icon" :title="g.title" :subtitle="g.sub" chevron @click="startLadder(g.key)" />
    </UiList>
  </UiSheet>

  <!-- 더보기 -->
  <UiSheet :model-value="!!menuGame" @update:model-value="menuGame = null">
    <UiList v-if="menuGame">
      <UiListItem icon="fas fa-book-open" title="규칙 보기" @click="openRule(menuGame)" />
      <UiListItem v-if="needsSafety(menuGame)" icon="shield-halved" title="만나기 전 안전 수칙" @click="openSafety(menuGame)" />
      <UiListItem v-if="canReschedule(menuGame)" icon="pen" title="시간·장소 바꾸기" subtitle="바꾸면 상대에게 알려요" @click="openScheduleFromMenu(menuGame)" />
      <UiListItem v-if="dmTarget(menuGame)" icon="far fa-paper-plane" :title="`${dmTarget(menuGame).name}에게 메시지`" @click="router.push('/chat/' + dmTarget(menuGame).id)" />
      <UiListItem v-if="menuGame.type === 'my-game' && menuGame.status === 'MATCHING'" icon="fas fa-share" title="링크 공유하기" @click="share(menuGame)" />
      <UiListItem v-if="canTellFriend(menuGame)" icon="shield-halved" title="친구에게 일정 알리기" subtitle="누구와 언제 어디서 만나는지 보내 둬요" @click="tellFriend(menuGame)" />
      <UiListItem v-if="canDelete(menuGame)" icon="fas fa-trash" title="경기 삭제" danger @click="removeGame(menuGame)" />
      <UiListItem v-if="canLeave(menuGame)" icon="fas fa-right-from-bracket" title="이 경기에서 빠지기" subtitle="연 사람과 남은 사람에게 알려요" danger @click="leaveGame(menuGame)" />
    </UiList>
  </UiSheet>

  <!-- 경기 3시간 안에 빠지기: 이유를 고르면 상대에게 보이고, 이유 없이 빠지면 노쇼로 기록된다 (11/5 사용자 결정) -->
  <UiSheet :model-value="!!lateLeave" title="왜 빠지나요?" @update:model-value="lateLeave = null">
    <p class="t-caption mb-4">경기가 곧이라 상대가 이미 움직이고 있을 수 있어요. 이유를 고르면 상대에게 함께 알려요. 이유 없이 빠지면 노쇼로 기록돼요.</p>
    <div class="flex flex-wrap gap-2">
      <UiChip v-for="r in LATE_REASONS" :key="r" :selected="leaveReason === r" @click="leaveReason = r">{{ r }}</UiChip>
    </div>
    <UiInput v-if="leaveReason === '기타'" v-model="leaveOther" class="mt-3" :maxlength="100" placeholder="이유를 짧게 적어 주세요" />
    <UiButton block size="lg" class="mt-5" :disabled="!lateReasonText" @click="confirmLateLeave(lateReasonText)">이유를 알리고 빠지기</UiButton>
    <UiButton block variant="ghost" class="mt-2 text-danger" @click="confirmLateLeave('')">이유 없이 빠지기</UiButton>
  </UiSheet>

  <SafetyTipsSheet
    :model-value="!!safetyGame"
    :opponent="safetyGame ? dmTarget(safetyGame)?.name || '' : ''"
    :can-tell-friend="!!safetyGame && canTellFriend(safetyGame)"
    @update:model-value="(v) => !v && closeSafety()"
    @tell-friend="tellFriend(safetyGame)"
  />

  <!-- 시간·장소 정하기 (시작 전 언제든, 두 선수 모두). 보낸 칸만 바뀌고 상대에게 알림이 간다 -->
  <UiSheet :model-value="!!scheduleGame" :title="isRemote(scheduleGame?.venue) ? '언제 할까요?' : '언제, 어디서 할까요?'" @update:model-value="scheduleGame = null">
    <div class="space-y-5">
      <!-- 정하기 전에 상대와 이야기할 수 있게 (예전엔 시트를 닫고 채팅을 따로 찾아가야 했다) -->
      <div v-if="scheduleGame && dmTarget(scheduleGame)" class="flex items-center gap-3 rounded-xl bg-surface px-4 py-3">
        <p class="flex-1 t-caption">{{ dmTarget(scheduleGame).name }}님과 먼저 맞춰 보세요</p>
        <UiButton size="sm" variant="secondary" icon="far fa-paper-plane" @click="router.push('/chat/' + dmTarget(scheduleGame).id)">메시지</UiButton>
      </div>
      <div>
        <p class="t-label mb-2">시간</p>
        <div class="flex flex-wrap gap-2 mb-2">
          <UiChip v-for="w in quick" :key="w.label" :selected="schedTime === w.date()" @click="schedTime = w.date()">{{ w.label }}</UiChip>
        </div>
        <UiInput v-model="schedTime" type="datetime-local" />
      </div>
      <!-- 화상·다른 게임은 주소 대신 어디서인지만 -->
      <div v-if="isRemote(scheduleGame?.venue)">
        <p class="t-label mb-2">어디서</p>
        <UiInput v-model="schedPlace" :placeholder="VENUES.find((v) => v.value === scheduleGame?.venue)?.placeholder" />
      </div>
      <div v-else>
        <p class="t-label mb-2">장소</p>
        <!-- 이미 정한 곳이면 그대로 두고(시간만 바꿀 때 장소가 바뀌지 않게), 처음이면 내 동네(시·군·구 + 동, 도는 뺀다), 다른 곳이면 직접 -->
        <button v-if="placeMode === 'keep'" type="button" class="w-full flex items-center gap-3 h-12 px-4 rounded-xl bg-surface border border-line text-left" @click="placeMode = myArea ? 'mine' : 'other'">
          <UiIcon name="location-dot" aria-hidden="true" />
          <span class="flex-1 t-body truncate">{{ scheduleGame?.matchLocation }}</span>
          <span class="t-micro underline underline-offset-2 flex-shrink-0">장소 바꾸기</span>
        </button>
        <!-- 검색으로 고른 공공장소 (안전·신뢰 G) -->
        <button v-else-if="placeMode === 'picked'" type="button" class="w-full flex items-center gap-3 min-h-12 py-2 px-4 rounded-xl bg-surface border border-line text-left" @click="pickerOpen = true">
          <UiIcon name="location-dot" aria-hidden="true" />
          <span class="flex-1 min-w-0"><span class="block t-body truncate">{{ pickedPlace.name }}</span><span class="block t-micro truncate">{{ pickedPlace.roadAddress || pickedPlace.address }}</span></span>
          <span class="t-micro underline underline-offset-2 flex-shrink-0">다시 찾기</span>
        </button>
        <template v-else>
          <UiButton v-if="placeSearchOn" block variant="secondary" icon="magnifying-glass" class="mb-2" @click="pickerOpen = true">공공장소 찾기</UiButton>
          <p v-if="placeSearchOn" class="t-micro mb-2">처음 만나는 상대와는 찾아서 고른 공공장소에서만 정할 수 있어요</p>
          <button v-if="placeMode === 'mine'" type="button" class="w-full flex items-center gap-3 h-12 px-4 rounded-xl bg-surface border border-line text-left" @click="placeMode = 'other'">
            <UiIcon name="location-dot" aria-hidden="true" />
            <span class="flex-1 t-body">{{ myArea.shortName }}</span>
            <span class="t-micro underline underline-offset-2">다른 곳</span>
          </button>
          <div v-else class="grid grid-cols-2 gap-2">
            <UiSelect v-model="schedRegion1" :options="region1Options" placeholder="시·도" />
            <UiSelect v-model="schedRegion2" :options="schedRegion2Options" placeholder="구·시·군" :disabled="!schedRegion1" />
          </div>
          <UiInput v-model="schedPlace" class="mt-2" :placeholder="`장소 이름 (예: ${myArea?.name || '동네'} 주민센터 체육관)`" />
        </template>
      </div>
      <PlacePickerSheet v-model="pickerOpen" :near="myArea?.lat ? { lat: myArea.lat, lon: myArea.lon } : null" @picked="(p) => { pickedPlace = p; placeMode = 'picked' }" />
      <p class="t-micro">정하면 상대에게 알려요. 정한 뒤에도 경기 시작 전까지 두 사람 모두 언제든 바꿀 수 있어요.</p>
    </div>
    <template #footer>
      <UiButton block :disabled="!canSubmitSchedule" :loading="busy" @click="submitSchedule">{{ scheduleDecided(scheduleGame) ? '바꾸기' : '정하기' }}</UiButton>
    </template>
  </UiSheet>

  <!-- 경기 시작 ① 정해둔 장소가 있으면 그대로 시작할지 -->
  <UiSheet v-model="showPlaceConfirm" title="이 장소에서 하나요?">
    <UiCard class="flex items-center gap-3">
      <UiIcon name="fas fa-location-dot" class="text-fg-muted" aria-hidden="true" />
      <span class="t-body">{{ startGame?.matchLocation }}</span>
    </UiCard>
    <template #footer>
      <div class="flex gap-2">
        <UiButton variant="secondary" block @click="openPlaceForm">장소 바꾸기</UiButton>
        <UiButton block @click="goCamera">이 장소로 시작</UiButton>
      </div>
    </template>
  </UiSheet>

  <!-- 경기 시작 ② 장소 정하기: 지역(챔피언 단위) + 장소 이름. Google 자동완성은 키가 있을 때 덤 -->
  <UiSheet v-model="showPlaceForm" title="어디서 하나요?">
    <div class="space-y-4">
      <div v-if="!selectedPlace" class="grid grid-cols-2 gap-2">
        <UiSelect v-model="manualRegion1" :options="region1Options" placeholder="시·도" />
        <UiSelect v-model="manualRegion2" :options="region2Options" placeholder="구·시·군" :disabled="!manualRegion1" />
      </div>
      <UiInput ref="placeInput" v-model="searchQuery" label="장소 이름" placeholder="예: 관악구민체육센터" icon="fas fa-location-dot" />
      <UiCard v-if="selectedPlace" class="flex items-start gap-3">
        <div class="flex-1 min-w-0">
          <p class="t-body truncate">{{ selectedPlace.name }}</p>
          <p class="t-micro truncate">{{ selectedPlace.address }}</p>
        </div>
        <UiIconButton icon="fas fa-xmark" label="다시 고르기" @click="clearSelection" />
      </UiCard>
      <UiInput v-model="detailedPlace" label="자세한 위치" optional placeholder="예: 3층, A코트" />
    </div>
    <template #footer>
      <UiButton block :disabled="!canSubmitPlace" :loading="busy" @click="submitPlace">다음</UiButton>
    </template>
  </UiSheet>

  <!-- 경기 시작 ③ 인증샷 (선택). 사진을 고르거나 '사진 없이 시작'을 누르면 바로 시작한다 (한 번 더 묻지 않는다) -->
  <CameraCapture
    :is-visible="showCameraModal"
    title="경기 시작 인증샷"
    :subtitle="`${startMessage} 사진은 소식에 보여요.`"
    allow-skip
    @capture="onPhotoCapture"
    @skip="onPhotoCapture(null)"
    @cancel="showCameraModal = false"
  />

  <MatchRuleModal v-if="ruleGame" :rule="ruleGame.rule" @close="ruleGame = null" />
</template>

<script setup>
// 내 경기: 할 일(시작·승인·참여) / 기다리는 중 / 끝난 경기로 나눠 보여준다
import { TEAM_NAMES, VENUES, isRemote } from '../../utils/gameFormat'
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../api/api'
import InboxButtons from '../../components/inbox/InboxButtons.vue'
import MatchRuleModal from '../../components/MatchModal.vue'
import CameraCapture from '../../components/CameraCapture.vue'
import MyGameCard from '../../components/game/MyGameCard.vue'
import AppDuelList from '../../components/appgame/AppDuelList.vue'
import SafetyTipsSheet from '../../components/game/SafetyTipsSheet.vue'
import MeetSafetyCard from '../../components/safety/MeetSafetyCard.vue'
import PlacePickerSheet from '../../components/map/PlacePickerSheet.vue'
import { GET } from '@/api/client'
import {
  UiAvatar, UiButton, UiCard, UiChip, UiEmptyState, UiIconButton, UiInput, UiList, UiListItem,
  UiPullIndicator, UiSection, UiSelect, UiSheet, UiSkeleton, UiTopBar
} from '../../components/ui'
import regionMap from '../../assets/regionMap.json'
import { useToast } from '../../composable/useToast'
import { usePullToRefresh } from '../../composables/usePullToRefresh'
import { confirmDialog } from '../../composables/useConfirm'
import { refreshOnChange } from '../../websocket/userChannel'
import { feel } from '../../utils/feel'
import { useActiveGamePolling } from '../../composable/useActiveGamePolling'
import { parseRegion } from '../../utils/regionParser'
import { compressImage, dataUrlToFile } from '../../utils/gamePictureStorage'
import { copyText } from '../../utils/clipboard'
import { shareLink } from '../../utils/share'
import { matchTime, place, ratingLine } from '../../utils/format'
import { venuePlace } from '../../utils/gameFormat'
import { quickTimes } from '../../utils/when'

const FIRST_STEPS = [
  { title: '모집 중인 경기에 신청하거나 직접 열기', body: '규칙을 고르면 누구나 신청할 수 있게 올라가요' },
  { title: '상대가 정해지면 장소·시간 맞추기', body: '채팅으로 정하고, 그날 경기 화면에서 시작해요' },
  { title: '끝나면 결과 남기기', body: '상대가 확인하면 실력 점수와 챔피언에 반영돼요' },
]

const router = useRouter()
const route = useRoute()
const { showToast } = useToast()

const loading = ref(true)
const busy = ref(false)
const sentGames = ref([])
const myGames = ref([])
const applicantsMap = ref({})
const appDuels = ref([])
const me = ref({ name: '나' })
const applicantsGame = ref(null)
const menuGame = ref(null)
const ruleGame = ref(null)

// ---------- 목록 ----------

// 평가를 아직 안 남긴 끝난 경기 (앱 전체가 변경 신호마다 받아 두는 값). 창으로 묻지 않고 여기 할 일로 둔다
const { pendingReviews } = useActiveGamePolling()
const allGames = computed(() => [
  ...myGames.value.map((g) => ({ ...g, type: 'my-game', applicants: applicantsMap.value[g.id] || []})),
  ...sentGames.value.map((g) => ({ ...g, type: 'sent' })),
])

// 할 일: 진행 중, 상대가 낸 결과 확인, 내가 시작해야 하는 확정 경기, 승인 기다리는 신청자가 있는 경기
function bucket(g) {
  if (g.status === 'IN_PROGRESS' || g.gameStatus === 'IN_PROGRESS') return 'todo'
  // 결과 확인: 상대가 낸 결과는 내 할 일, 내가 낸 결과는 기다리는 중
  if (g.status === 'RESULT_PENDING' || g.gameStatus === 'RESULT_PENDING') {
    return g.resultSubmittedById === (g.myId ?? me.value.id) ? 'waiting' : 'todo'
  }
  if (g.type === 'my-game') {
    if (g.status === 'COMPLETED' || g.status === 'CANCELED') return 'done'
    if (g.status === 'SCHEDULED' && g.isOwner !== false) return 'todo'
    if (g.status === 'MATCHING' && g.applicants.some((a) => !a.approved)) return 'todo'
    return 'waiting'
  }
  return g.status === 'REJECTED' ? 'done' : 'waiting'
}
const byTime = (a, b) => new Date(a.matchDate || a.startedAt || 0) - new Date(b.matchDate || b.startedAt || 0)
const groups = computed(() =>
  [
    { key: 'todo', title: '할 일' },
    { key: 'waiting', title: '기다리는 중' },
    { key: 'done', title: '끝난 경기' },
  ]
    .map((g) => ({ ...g, items: allGames.value.filter((x) => bucket(x) === g.key).sort(byTime) }))
    .filter((g) => g.items.length),
)

async function fetchGames() {
  try {
    const [applicantsRes, sentRes, myRes, duels] = await Promise.all([
      api.get('/api/games/my-games/applicants'),
      api.get('/api/games/my-requests'),
      api.get('/api/games/my-games'),
      // 앱 대결은 못 불러와도 오프라인 경기 목록은 보여 준다
      GET('/api/app-games/duels/active').then(({ data }) => data).catch(() => null),
    ])
    if (duels) appDuels.value = duels
    applicantsMap.value = Object.fromEntries(applicantsRes.data.map((g) => [g.gameId, g.applicants || []]))
    sentGames.value = sentRes.data
    myGames.value = myRes.data
    // 열려 있는 신청자 시트도 새 값으로
    if (applicantsGame.value) applicantsGame.value = allGames.value.find((g) => g.type === 'my-game' && g.id === applicantsGame.value.id) || null
  } finally {
    loading.value = false
  }
}
const { pull, refreshing } = usePullToRefresh(fetchGames)

// ---------- 신청·승인 ----------

const isMulti = (game) => !!game?.format && game.format !== 'DUEL'
// 승인할 자리가 남았나. 1:1은 한 명, 여럿은 다 찰 때까지 (팀 경기는 그 팀 자리)
function canApprove(game, a) {
  const players = game.players || []
  if (!isMulti(game)) return !(game.applicants || []).some((x) => x.approved)
  if (players.length >= game.maxPlayers) return false
  if (game.format === 'TEAMS') return players.filter((p) => p.team === a.team).length < game.maxPlayers / 2
  return true
}
function applicantsHint(game) {
  // 승인 버튼 대신 '앱 게임 한 판'만 보이면 왜 승인이 안 되는지 먼저 말한다 (11/4 밤샘: 처음 연 경기에서 승인 버튼을 못 찾았다)
  const ladder = (game?.applicants || []).some((a) => a.needsAppGameFirst && !a.approved)
    ? ' 처음 만나는 사람은 앱 게임을 한 판 같이 한 뒤에 승인할 수 있어요.'
    : ''
  if (!isMulti(game)) return '한 명을 승인하면 경기가 확정되고, 나머지 신청은 자동으로 마감돼요.' + ladder
  const n = (game.players || []).length
  return `${game.maxPlayers}명이 모이면 경기가 확정돼요. 지금 ${n}명이에요.` + ladder
}

async function approve(game, a) {
  busy.value = true
  try {
    await api.post('/api/games/approve', { gameId: game.id, userId: a.userId })
    const full = !isMulti(game) || (game.players || []).length + 1 >= game.maxPlayers
    feel('success')
    showToast(full ? `${a.applicantNickname}님과 경기가 확정됐어요` : `${a.applicantNickname}님을 승인했어요`)
    applicantsGame.value = null
    await fetchGames()
  } catch (e) {
    showToast(e.response?.data?.message || '승인하지 못했어요')
  } finally {
    busy.value = false
  }
}

async function cancelApproval(game, a) {
  busy.value = true
  try {
    await api.post('/api/games/cancel-approve', { gameId: game.id, userId: a.userId })
    showToast('승인을 취소했어요. 다시 신청을 받아요')
    await fetchGames()
  } finally {
    busy.value = false
  }
}

async function cancelRequest(game) {
  if (!(await confirmDialog({ title: '신청을 취소할까요?', confirmText: '신청 취소' }))) return
  await api.post('/api/games/cancel-request', { gameId: game.id })
  sentGames.value = sentGames.value.filter((g) => g.id !== game.id)
  showToast('신청을 취소했어요')
}

// ---------- 더보기 ----------

function dmTarget(g) {
  if (g.type === 'sent') return { id: g.ownerId, name: g.ownerNickname }
  if (g.opponentId) return { id: g.opponentId, name: g.opponentNickname }
  return null
}
// 만나기 전 안전 수칙: 만나서 하는 경기에 상대가 정해지면 한 번 저절로 (경기마다), 그 뒤엔 더보기에서
const safetyGame = ref(null)
// 신뢰 사다리 (안전·신뢰 D): 신청자에게 보낼 앱 게임. 도전장은 메시지로 가니 각자 편할 때 하는 게임만 된다.
// 실시간 게임(암산·퀴즈·숫자 야구)은 대기실에서 아무나·봇과 붙어 도전장이 안 나가 무한 반복이었다 (11/4, 서버 TrustLadderTest)
const LADDER_GAMES = [
  { key: 'typing', title: '타자 대결', sub: '2분 · 같은 글을 빨리 정확하게', icon: 'keyboard' },
]
const ladderFor = ref(null)
function startLadder(key) {
  const a = ladderFor.value
  ladderFor.value = null
  applicantsGame.value = null
  router.push({ path: `/play/${key}`, query: { to: a.userId, toName: a.applicantNickname } })
}

// 경기 시간이 잡힌 만나서 하는 경기 (앞뒤 하루). 카드 안에서 서버가 지금 할 일이 있는지 정한다
// 결과를 낸 뒤(확인 기다림·끝·취소)에는 '도착했어요'·노쇼 안내를 거둔다 (11/4 밤샘: 결과 확인 카드 밑에 도착 칸이 남았다)
const OVER = ['REQUESTED', 'REJECTED', 'RESULT_PENDING', 'COMPLETED', 'CANCELED']
const needsMeetCard = (g) => !!g && !isRemote(g.venue) && !!g.matchDate && !!dmTarget(g) && Math.abs(Date.now() - new Date(g.matchDate).getTime()) < 86_400_000 && !OVER.includes(g.status) && !OVER.includes(g.gameStatus)
const needsSafety = (g) => !!g && !isRemote(g.venue) && !!dmTarget(g) && canReschedule(g)
const safetySeen = (() => {
  try { return JSON.parse(localStorage.getItem('safetyTipsSeen') || '[]') } catch { return [] }
})()
function openSafety(g) {
  menuGame.value = null
  safetyGame.value = g
}
function closeSafety() {
  const g = safetyGame.value
  if (g && !safetySeen.includes(g.id)) {
    safetySeen.push(g.id)
    try { localStorage.setItem('safetyTipsSeen', JSON.stringify(safetySeen.slice(-100))) } catch { /* 이번만 닫힌다 */ }
  }
  safetyGame.value = null
}
watch(allGames, (list) => {
  // 시간·장소를 정하러 왔으면(채팅 위 경기 칸) 그 시트가 먼저. 수칙은 다음에 볼 때
  if (safetyGame.value || scheduleGame.value || Number(route.query.schedule)) return
  const g = list.find((x) => needsSafety(x) && !safetySeen.includes(x.id))
  if (g) safetyGame.value = g
})

// 시작 전이면 두 선수 모두 바꿀 수 있다 (MyGameCard의 canSchedule과 같은 기준)
const canReschedule = (g) => g.type === 'my-game' ? ['MATCHING', 'SCHEDULED'].includes(g.status) : g.status === 'APPROVED' && ['MATCHING', 'SCHEDULED'].includes(g.gameStatus)
function openScheduleFromMenu(g) {
  menuGame.value = null
  openSchedule(g)
}
const canDelete = (g) => g.type === 'my-game' && g.isOwner !== false && ['MATCHING', 'SCHEDULED'].includes(g.status)

function openRule(g) {
  menuGame.value = null
  ruleGame.value = g
}

async function share(g) {
  menuGame.value = null
  try {
    const { data } = await api.post('/api/invite', null, { params: { gameId: g.id } })
    const msg = await shareLink(data.url, `'${g.rule?.ruleTitle ?? '경기'}' 같이 한 판 해요`)
    if (msg) showToast(msg === '링크를 복사했어요' ? '링크를 복사했어요. 같이 할 사람에게 보내 보세요' : msg)
  } catch {
    showToast('링크를 만들지 못했어요')
  }
}

// 친구에게 일정 알리기 (기능 검토 #1, 처음 보는 사람을 만날 때): 누구와·언제·어디서를 한 문장으로 카톡 등에 보낸다
const canTellFriend = (g) => !!dmTarget(g) && !!g.matchDate && !['COMPLETED', 'CANCELED', 'REJECTED', 'REQUESTED'].includes(g.status)
async function tellFriend(g) {
  menuGame.value = null
  const who = dmTarget(g)
  const where = venuePlace(g, place)
  const text = `나 ${matchTime(g.matchDate)}에 ${where ? where + '에서 ' : ''}${who.name}님이랑 '${g.rule?.ruleTitle ?? '경기'}' 하기로 했어. 혹시 연락 안 되면 확인해 줘 (Match)`
  if (navigator.share) {
    try {
      await navigator.share({ text })
      return
    } catch (e) {
      if (e.name === 'AbortError') return
    }
  }
  showToast((await copyText(text)) ? '일정을 복사했어요. 친구에게 붙여 넣어 보내세요' : '복사하지 못했어요')
}

async function removeGame(g) {
  menuGame.value = null
  const ok = await confirmDialog({
    title: '경기를 삭제할까요?',
    message: '함께하기로 한 사람과 신청한 사람에게 취소됐다고 알려요.',
    confirmText: '삭제',
    danger: true,
  })
  if (!ok) return
  try {
    await api.delete(`/api/games/${g.id}/delete`)
    myGames.value = myGames.value.filter((x) => x.id !== g.id)
    showToast('경기를 삭제했어요')
  } catch (e) {
    showToast(e.response?.data?.message || '삭제하지 못했어요')
  }
}

// 승인된 뒤 시작 전이면 빠질 수 있다 (내가 연 경기는 삭제). 전에는 빠지는 길이 없어 노쇼가 되거나 주최자에게 부탁했다 (11/4 밤샘)
const BEFORE_START = ['MATCHING', 'SCHEDULED']
const canLeave = (g) => !!g && (g.type === 'sent'
  ? g.status === 'APPROVED' && BEFORE_START.includes(g.gameStatus)
  : g.type === 'my-game' && g.isOwner === false && BEFORE_START.includes(g.status))
// 만나서 하는 경기 3시간 안 (서버 MeetService.LATE_LEAVE와 같게)
const LATE_LEAVE_MS = 3 * 3600_000
const LATE_REASONS = ['아파요', '급한 일이 생겼어요', '날씨가 안 좋아요', '기타']
const lateLeave = ref(null)
const leaveReason = ref('')
const leaveOther = ref('')
const lateReasonText = computed(() => (leaveReason.value === '기타' ? leaveOther.value.trim() : leaveReason.value))
const isLate = (g) => !isRemote(g.venue) && !!g.matchDate && new Date(g.matchDate).getTime() - Date.now() < LATE_LEAVE_MS

async function leaveGame(g) {
  menuGame.value = null
  if (isLate(g)) {
    leaveReason.value = ''
    leaveOther.value = ''
    lateLeave.value = g
    return
  }
  const ok = await confirmDialog({ title: '이 경기에서 빠질까요?', message: '연 사람과 남은 사람에게 빠졌다고 알려요. 경기는 다시 모집 중이 돼요.', confirmText: '빠지기', danger: true })
  if (!ok) return
  await doLeave(g, '')
}
async function confirmLateLeave(reason) {
  const g = lateLeave.value
  lateLeave.value = null
  if (g) await doLeave(g, reason)
}
async function doLeave(g, reason) {
  try {
    await api.delete(`/api/games/${g.id}/leave`, { params: reason ? { reason } : {} })
    sentGames.value = sentGames.value.filter((x) => x.id !== g.id)
    myGames.value = myGames.value.filter((x) => x.id !== g.id)
    showToast('경기에서 빠졌어요')
  } catch (e) {
    showToast(e.response?.data?.message || '빠지지 못했어요')
  }
}

// ---------- 경기 시작: 장소 → 인증샷(선택) → 확인 ----------

const startGame = ref(null)
const showPlaceConfirm = ref(false)
const showPlaceForm = ref(false)
const showCameraModal = ref(false)
const capturedPhotoFile = ref(null)
const searchQuery = ref('')
const detailedPlace = ref('')
const selectedPlace = ref(null)
const placeInput = ref(null)
// ---------- 시간·장소 정하기 ----------
const scheduleGame = ref(null)
const quick = quickTimes()
const schedTime = ref('')
const schedRegion1 = ref('')
const schedRegion2 = ref('')
const schedPlace = ref('')
const schedRegion2Options = computed(() => (regionMap[schedRegion1.value] || []).filter((r) => r !== '전체'))
watch(schedRegion1, () => (schedRegion2.value = ''))

// 장소 기본값: 내 지금 동네 (시·군·구 + 동). 한 번만 불러 둔다
const myArea = ref(null)
// keep: 이미 정한 장소 그대로 / mine: 내 동네 / other: 시·도와 구를 직접
const placeMode = ref('mine')
async function loadMyArea() {
  if (myArea.value) return
  const mine = await api.get('/api/neighborhoods/me').then((r) => r.data).catch(() => null)
  myArea.value = mine?.neighborhoods?.find((n) => n.active) || null
}
// 공공장소 찾기 (안전·신뢰 G): 서버에 장소 검색이 켜져 있을 때만 버튼을 보인다
const pickerOpen = ref(false)
const pickedPlace = ref(null)
const placeSearchOn = ref(false)
GET('/api/places/available').then((r) => (placeSearchOn.value = !!r.data)).catch(() => {})
const canSubmitSchedule = computed(() => {
  const g = scheduleGame.value
  if (!g) return false
  if (placeMode.value === 'picked') return !!pickedPlace.value
  if (isRemote(g.venue)) return !!schedTime.value || !!schedPlace.value.trim()
  if (placeMode.value === 'keep') return !!schedTime.value
  return !!schedTime.value || (placeMode.value === 'mine' && !!myArea.value) || (schedRegion1.value && schedRegion2.value)
})

function openSchedule(g) {
  // 시트를 먼저 연다 (동네를 불러오는 사이 다른 시트가 끼어들지 않게). 동네가 오면 기본 장소를 채운다
  scheduleGame.value = g
  pickedPlace.value = null
  placeMode.value = g.matchLocation && !isRemote(g.venue) ? 'keep' : myArea.value ? 'mine' : 'other'
  if (!myArea.value) loadMyArea().then(() => { if (scheduleGame.value?.id === g.id && placeMode.value === 'other' && myArea.value) placeMode.value = 'mine' })
  schedTime.value = g.matchDate ? String(g.matchDate).slice(0, 16) : ''
  const parsed = g.matchLocation ? parseRegion(g.matchLocation) : null
  schedRegion1.value = parsed?.region1 || ''
  nextTick(() => (schedRegion2.value = parsed?.region2 || ''))
  schedPlace.value = isRemote(g.venue) ? g.matchLocation || '' : ''
}

// 시간·장소가 둘 다 정해져 있었을 때만 '바꾸기'. 하나라도 미정이면 처음 정하는 것
const scheduleDecided = (g) => !!g?.matchDate && !!g?.matchLocation

async function submitSchedule() {
  busy.value = true
  try {
    const remote = isRemote(scheduleGame.value.venue)
    // 내 동네를 쓰면 주소는 '서울특별시 동대문구 회기동'(서버 지역 판정용), 화면에는 장소 이름이 먼저 보인다
    const mode = placeMode.value
    const area = remote || mode === 'keep' || mode === 'picked' ? null : mode === 'mine' ? myArea.value.fullName : schedRegion1.value && schedRegion2.value ? `${schedRegion1.value} ${schedRegion2.value}` : null
    const hasPlace = !!area
    await api.post(`/api/games/${scheduleGame.value.id}/schedule`, {
      matchDate: schedTime.value ? (schedTime.value.length === 16 ? `${schedTime.value}:00` : schedTime.value) : null,
      roadAddress: area,
      // 화상·다른 게임은 어디서인지만 보낸다 (서버가 주소 없이 받는다)
      detailAddress: remote ? schedPlace.value.trim() || null : hasPlace ? schedPlace.value.trim() || (mode === 'mine' ? myArea.value.shortName : null) : null,
      place: mode === 'picked' ? { kakaoId: pickedPlace.value.kakaoId, name: pickedPlace.value.name, lat: pickedPlace.value.lat, lon: pickedPlace.value.lon } : null,
    })
    const changed = scheduleDecided(scheduleGame.value)
    scheduleGame.value = null
    feel('success')
    showToast(changed ? '바꿨어요. 상대에게 알렸어요' : '정했어요. 상대에게 알렸어요')
    await fetchGames()
  } catch (e) {
    showToast(e.response?.data?.message || '정하지 못했어요')
  } finally {
    busy.value = false
  }
}

const manualRegion1 = ref('')
const manualRegion2 = ref('')
const region1Options = Object.keys(regionMap).filter((r) => r !== '전국')
const region2Options = computed(() => (regionMap[manualRegion1.value] || []).filter((r) => r !== '전체'))
watch(manualRegion1, () => (manualRegion2.value = ''))
const canSubmitPlace = computed(
  () => !!selectedPlace.value || !!(manualRegion1.value && manualRegion2.value && searchQuery.value.trim()),
)

const startMessage = computed(() => {
  const dur = startGame.value?.rule?.duration
  const time = !dur || dur < 0 ? '시간 제한 없이' : `${Math.floor(dur / 60) ? Math.floor(dur / 60) + '분 ' : ''}${dur % 60 ? (dur % 60) + '초 ' : ''}동안`
  return `${time} 진행돼요. 시작하면 상대에게도 바로 보여요.`
})

function openStart(game) {
  startGame.value = game
  // 화상·다른 게임은 장소를 묻지 않는다
  if (isRemote(game.venue)) return goCamera()
  if (game.matchLocation && game.matchLocation.trim()) showPlaceConfirm.value = true
  else openPlaceForm()
}

function openPlaceForm() {
  showPlaceConfirm.value = false
  searchQuery.value = ''
  detailedPlace.value = ''
  selectedPlace.value = null
  manualRegion1.value = ''
  showPlaceForm.value = true
  nextTick(initGoogleAutocomplete)
}

// Google 장소 자동완성 (키가 있을 때만). 고르면 지역까지 자동으로 정해진다
function initGoogleAutocomplete() {
  const el = placeInput.value?.el
  if (!window.google?.maps?.places || !el) return
  const ac = new window.google.maps.places.Autocomplete(el, {
    componentRestrictions: { country: 'kr' },
    fields: ['formatted_address', 'name', 'geometry'],
    types: ['establishment', 'geocode'],
  })
  ac.addListener('place_changed', () => {
    const p = ac.getPlace()
    const parsed = p.formatted_address && parseRegion(p.formatted_address)
    if (!parsed) return showToast('지역을 알 수 없는 주소예요. 지역을 직접 골라 주세요')
    selectedPlace.value = { name: p.name || '', address: parsed.fullAddress }
  })
}

function clearSelection() {
  selectedPlace.value = null
  searchQuery.value = ''
}

async function submitPlace() {
  const placeInfo = selectedPlace.value || {
    name: searchQuery.value.trim(),
    address: `${manualRegion1.value} ${manualRegion2.value}`,
  }
  busy.value = true
  try {
    await api.post(`/api/games/${startGame.value.id}/set-region`, {
      roadAddress: placeInfo.address,
      detailAddress: detailedPlace.value ? `${placeInfo.name} ${detailedPlace.value}` : placeInfo.name,
    })
    showPlaceForm.value = false
    goCamera()
  } catch (e) {
    showToast(e.response?.data?.message || '장소를 저장하지 못했어요')
  } finally {
    busy.value = false
  }
}

function goCamera() {
  showPlaceConfirm.value = false
  capturedPhotoFile.value = null
  showCameraModal.value = true
}

function onPhotoCapture(file) {
  capturedPhotoFile.value = file
  confirmStart()
}

async function confirmStart() {
  if (busy.value) return
  busy.value = true
  try {
    const form = new FormData()
    if (capturedPhotoFile.value) form.append('photo', capturedPhotoFile.value)
    await api.post(`/api/games/${startGame.value.id}/start`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
    showCameraModal.value = false
    feel('success')
    router.push(`/games/${startGame.value.id}/play`)
  } catch (e) {
    showToast(e.response?.data?.message || '경기를 시작하지 못했어요')
  } finally {
    busy.value = false
  }
}

// iOS 앱의 네이티브 카메라는 결과를 전역 콜백으로 돌려준다
async function handleNativeCamera(base64Image) {
  try {
    onPhotoCapture(dataUrlToFile(await compressImage(base64Image), 'camera-photo.jpg'))
  } catch {
    showToast('사진을 저장하지 못했어요')
  }
}

// ---------- 시작·정리 ----------

let stopWatching = null
onMounted(async () => {
  window.onCameraResult = handleNativeCamera
  window.onGameViewCameraResult = handleNativeCamera
  api.get('/api/user-profile/0').then(({ data }) => (me.value = { id: data.id, name: data.nickname, avatar: data.avatar })).catch(() => {})
  await fetchGames()
  // 채팅 위 경기 칸에서 '시간·장소 정하기'로 왔으면 그 경기의 시트를 바로 연다
  const want = Number(route.query.schedule)
  if (want) {
    const g = allGames.value.find((x) => x.id === want && x.type !== 'app-duel')
    // 주소에서 ?schedule만 조용히 뺀다. router.replace를 쓰면 화면이 주소 전체를 열쇠로 다시 만들어져 시트가 사라진다
    history.replaceState(history.state, '', route.path)
    if (g) openSchedule(g)
  }
  // 신청·승인·시작·종료 신호가 오거나 앱으로 돌아왔을 때 다시 불러온다
  stopWatching = refreshOnChange(fetchGames)
})
onBeforeUnmount(() => {
  stopWatching?.()
  if (window.onCameraResult === handleNativeCamera) window.onCameraResult = null
  if (window.onGameViewCameraResult === handleNativeCamera) window.onGameViewCameraResult = null
})
</script>
