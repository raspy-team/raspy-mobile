<template>
  <!-- 셋 이상이 각자: 점수판 없이, 끝나면 등수나 점수를 낸다 -->
  <div v-if="game && game.format === 'FREE_FOR_ALL'" class="min-h-dvh flex flex-col bg-canvas text-fg pt-safe pb-safe">
    <header class="flex items-center gap-1 px-2 h-14 flex-shrink-0">
      <UiIconButton icon="fas fa-chevron-left" label="뒤로" @click="goBack" />
      <h1 class="flex-1 min-w-0 truncate text-base font-semibold tracking-[-0.02em]">{{ game.rule?.ruleTitle }}</h1>
      <UiIconButton icon="fas fa-book-open" label="규칙 보기" @click="game.showRuleDetail = true" />
    </header>
    <main class="flex-1 px-4 pt-6 max-w-xl mx-auto w-full">
      <p class="t-caption">{{ game.sides?.length }}명이 각자 · 시작한 지 {{ elapsedTimeStr }}</p>
      <ul class="mt-4 bg-surface rounded-xl divide-y divide-line">
        <li v-for="s in game.sides" :key="s.key" class="flex items-center gap-3 px-4 py-3">
          <UiAvatar :src="s.members[0].profileUrl" :name="s.members[0].nickname" :user-id="s.members[0].id" size="sm" />
          <span class="text-sm text-fg truncate">{{ s.members[0].nickname }}</span>
        </li>
      </ul>
      <p class="t-caption mt-4">앱 밖에서 겨룬 뒤, 한 사람이 등수나 점수를 내요. 다른 사람 한 명이 확인하면 기록돼요.</p>
    </main>
    <footer class="px-4 pb-4 space-y-2 max-w-xl mx-auto w-full">
      <UiButton block size="lg" icon="fas fa-flag-checkered" @click="showResultEntry = true">결과 내기</UiButton>
      <UiButton block variant="ghost" icon="fas fa-xmark" @click="openConfirm('경기를 취소할까요?', cancelGame, '사람이 다 안 왔거나 못 하게 됐을 때 써요. 기록에 남지 않아요.', '경기 취소')">경기 취소</UiButton>
    </footer>
    <MatchModal v-if="game.showRuleDetail" :rule="game.rule" @close="game.showRuleDetail = false" />
  </div>

  <div v-else-if="game && user1 && user2" class="h-dvh flex flex-col bg-canvas text-fg overflow-hidden pt-safe pb-safe">
    <!-- 위: 뒤로 · 규칙 이름 · 더보기 하나. 이름 없는 아이콘을 늘어놓지 않고, 자주 안 쓰는 일은 이름을 단 목록으로 (11/3) -->
    <header class="flex items-center gap-1 px-2 h-14 flex-shrink-0">
      <UiIconButton icon="fas fa-chevron-left" label="뒤로" @click="goBack" />
      <h1 class="flex-1 min-w-0 truncate text-base font-semibold tracking-[-0.02em]">{{ game.rule?.ruleTitle }}</h1>
      <UiIconButton icon="ellipsis" label="더보기" @click="showMenu = true" />
    </header>
    <!-- 관중: 지금 보는 사람 수 (누르면 중계). 응원은 소리로, 세트가 끝나면 한 장으로 (docs/live-spectator-review.md A·B) -->
    <!-- 보는 사람이 있다는 건 재미라 줄은 남긴다. 누르면 경기 중에 점수판을 떠나 연결이 끊겨 누르는 길은 뺐다 (목적 판정 11/11 5번) -->
    <p v-if="viewers" class="flex-shrink-0 mx-auto -mt-2 mb-1 t-micro tabular-nums inline-flex items-center gap-1">
      <span class="w-1.5 h-1.5 rounded-full bg-danger" aria-hidden="true"></span>관중 {{ viewers }}명이 보고 있어요
    </p>

    <!-- 규칙 요약 한 줄 + 시계 -->
    <section class="flex-shrink-0 text-center px-4">
      <p class="t-caption">
        <!-- '11점 선취 · 세트당 제한 없음'은 낱말이 어렵고 무엇이 없는지 몰랐다. 지금 몇 세트째 · 몇 점 먼저 · (있을 때만) 세트마다 시간 (11/5 밤샘 C) -->
        {{ [
          game.rule?.setsToWin > 1 ? `${currentSet}/${game.rule.setsToWin}세트` : null,
          game.rule?.pointsToWin == -1 ? null : `${game.rule?.pointsToWin}점 먼저`,
          game.limitSeconds != null && game.limitSeconds !== -1 && limitTimeStr ? `세트마다 ${limitTimeStr}` : null,
        ].filter(Boolean).join(' · ') }}
      </p>
      <p class="mt-2 text-4xl font-bold tabular-nums" :class="isOvertime ? 'text-danger-fg' : 'text-fg'">{{ elapsedTimeStr }}</p>
      <p v-if="isOvertime" class="text-sm text-danger-fg mt-1">시간이 지났어요 · 추가 시간</p>
      <!-- 다른 게임 안에서 하는 경기: 그 게임 아이디를 시트로 (9번) -->
      <UiButton v-if="game.rule?.extGame" variant="ghost" size="sm" icon="gamepad" class="mt-1" @click="showExtIds = true">{{ game.rule.extGameLabel || '게임' }} 아이디</UiButton>
    </section>

    <!-- 점수판: 선수 칸 전체가 +1 버튼 (경기 중에 대충 눌러도 되게 크게) -->
    <section class="flex-1 min-h-0 grid grid-cols-2 gap-3 px-4 py-4">
      <div v-for="side in sides" :key="side.idx" class="flex flex-col min-h-0">
        <button
          type="button"
          class="flex-1 min-h-0 flex flex-col items-center justify-center gap-2 rounded-2xl bg-surface active:bg-surface-2 transition-colors disabled:opacity-50"
          :disabled="scoreLocked"
          :aria-label="`${side.user.nickname} 1점 올리기`"
          @click="socket_sendScore(side.idx, 1)"
        >
          <UiAvatar :src="side.user.profileUrl" :name="side.user.nickname" :user-id="side.user.id" size="md" />
          <span class="text-sm text-fg-muted truncate max-w-full px-2">{{ side.user.nickname }}</span>
          <!-- 점수가 바뀌면 숫자가 톡 튄다 (key가 바뀌어 다시 그려진다) -->
          <span :key="side.score" class="font-bold tabular-nums leading-none text-fg feel-pop" style="font-size: clamp(4rem, 14vh, 8rem)">{{ side.score }}</span>
          <!-- 칸 전체가 버튼이라는 걸 첫 점수 전까지만 알린다 -->
          <span v-if="!currentScore1 && !currentScore2" class="t-caption">눌러서 1점</span>
          <span class="flex gap-1" :aria-label="`세트 ${side.sets}개 승리`">
            <span v-for="n in setDots" :key="n" class="w-2 h-2 rounded-full" :class="n <= side.sets ? 'bg-primary' : 'bg-line-strong'"></span>
          </span>
        </button>
        <UiButton
          variant="secondary"
          class="mt-2"
          :disabled="scoreLocked || side.score <= 0"
          :aria-label="`${side.user.nickname} 1점 내리기`"
          @click="socket_sendScore(side.idx, -1)"
        >
          −1
        </UiButton>
      </div>
    </section>

    <!-- 아래: 다음 단계 둘만. 되돌릴 수 없는 '취소·처음부터'는 손이 자주 가는 이 줄에 두지 않고 더보기로 -->
    <footer class="flex-shrink-0 px-4 pb-4 flex gap-2">
      <!-- 한 세트짜리 규칙은 세트를 끝내는 게 곧 경기를 끝내는 것이라 숨긴다 (UX ④) -->
      <UiButton v-if="(game.rule?.setsToWin || 1) > 1 && !isSetOver && !isGameOver && !isCountingDown" size="lg" variant="secondary" class="flex-1" @click="manualFinishSet">세트 끝내기</UiButton>
      <!-- 점수를 내는 동안 주 행동은 점수 칸이다. 경기 끝내기는 승부가 난 뒤에만 채운 버튼으로 (0:0에도 가장 눈에 띄어 잘못 누르기 쉬웠다, 11/5 밤샘 C) -->
      <UiButton size="lg" :variant="isSetOver || isGameOver ? 'primary' : 'secondary'" class="flex-1" @click="isGameOver ? socket_finishGame() : openConfirm('경기를 끝낼까요?', socket_finishGame, `지금 점수로 결과를 내요. ${game.format === 'TEAMS' ? '상대 팀' : user2.nickname + '님'}이 확인하면 기록돼요.`, '경기 끝내기', false)">
        경기 끝내기
      </UiButton>
    </footer>

    <!-- 더보기: 아이콘마다 이름을 붙여 고른다 -->
    <UiSheet v-model="showMenu">
      <UiList>
        <UiListItem icon="book-open" title="규칙 보기" @click="menuThen(() => (game.showRuleDetail = true))" />
        <!-- 점수판을 떠나지 않고 링크만 보낸다 (예전엔 중계 화면으로 가 경기 중 연결이 끊겼다) -->
        <UiListItem icon="eye" title="중계 링크 보내기" subtitle="보내면 친구가 점수를 보며 응원해요" @click="menu(shareLive)" />
        <!-- 중계 끄기를 점수판에서: 예전엔 중계 화면에만 있어 끄려면 경기 중 점수판을 떠나야 했다 (11/11 감정과 체면 전수표, 원칙 2) -->
        <UiListItem icon="eye-slash" :title="watchOff ? '중계 다시 켜기' : '중계 끄기'" :subtitle="watchOff ? '지금은 선수 말고는 이 경기를 볼 수 없어요' : '끄면 선수 말고는 이 경기를 볼 수 없어요'" @click="menu(toggleWatchOff)" />
        <UiListItem icon="volume" :title="soundOn ? '관중 소리 끄기' : '관중 소리 켜기'" subtitle="관중이 응원하면 이 휴대폰에서 박수 소리가 나요" @click="menu(toggleSound)" />
        <UiListItem icon="list" title="경기 기록" subtitle="누가 언제 점수를 냈는지" @click="menuThen(() => (showLogModal = true))" />
        <UiListItem icon="camera" title="사진 찍기" @click="menu(triggerPhotoCapture)" />
        <UiListItem icon="video" title="영상 찍기" @click="menu(triggerVideoCapture)" />
        <UiListItem icon="pen-to-square" title="점수만 적기" subtitle="점수판을 안 쓰고 끝난 점수를 적어요" @click="menuThen(() => (showResultEntry = true))" />
        <UiListItem v-if="!nothingScored" icon="rotate-left" title="처음부터 다시" danger @click="menuThen(() => openConfirm('처음부터 다시 할까요?', socket_resetGame, '모든 점수와 세트가 지워져요.', '처음부터'))" />
        <UiListItem icon="xmark" title="경기 취소" danger @click="menuThen(() => openConfirm('경기를 취소할까요?', cancelGame, '상대가 안 왔거나 못 하게 됐을 때 써요. 기록에 남지 않아요.', '경기 취소'))" />
      </UiList>
    </UiSheet>

    <!-- 세트 사이 라커룸: 그 세트 동안 관중이 보낸 응원 한 장 -->
    <UiSheet :model-value="!!lastBreak" title="관중석에서" @update:model-value="(v) => { if (!v) lastBreak = null }">
      <LiveBreakCard v-if="lastBreak" :data="lastBreak" :game-id="Number(gameId)" player />
    </UiSheet>

    <!-- 세트 시작 전: 화면 전체에서 시작 버튼 하나만 -->
    <div
      v-if="(showStartButton || (isSetOver && !isGameOver) || isCountingDown) && !showResultEntry"
      class="fixed inset-0 z-dialog bg-canvas/90 flex flex-col items-center justify-center px-8 text-center"
    >
      <template v-if="isCountingDown">
        <p class="t-caption">{{ currentSet }}세트 시작까지</p>
        <p class="font-bold text-primary tabular-nums leading-none my-4" style="font-size: 30vw">{{ countdown }}</p>
        <p class="t-caption">준비하세요</p>
      </template>
      <template v-else>
        <p class="t-title">{{ currentSet }}세트</p>
        <p class="t-caption mt-2">{{ currentScore1 || currentScore2 || currentSet > 1 ? `${user1SetsWon} : ${user2SetsWon}` : (game.format === 'TEAMS' ? '두 팀이' : '두 사람이') + ' 준비되면 시작하세요' }}</p>
        <UiButton block size="lg" class="mt-8 max-w-sm" @click="showStartButton ? socket_startSet() : socket_nextSet()">
          {{ currentSet }}세트 시작
        </UiButton>
        <!-- 점수판은 원하는 사람만. 끝나고 점수만 넣어도 된다 -->
        <UiButton v-if="currentSet === 1 && !currentScore1 && !currentScore2" variant="ghost" class="mt-2" @click="showResultEntry = true">점수만 적기</UiButton>
        <UiButton v-if="nothingScored" variant="ghost" class="mt-1 text-fg-muted" @click="openConfirm('경기를 취소할까요?', cancelGame, '상대가 안 왔거나 못 하게 됐을 때 써요. 기록에 남지 않아요.', '경기 취소')">
          경기 취소
        </UiButton>
      </template>
    </div>

    <!-- 연결이 끊겼을 때 -->
    <div v-if="socketStatus !== 'connected'" class="fixed inset-x-0 top-0 z-toast pt-safe">
      <div class="mx-4 mt-2 rounded-xl bg-surface-2 border border-line-strong px-4 py-3 flex items-center gap-3 text-sm">
        <UiSpinner size="sm" class="text-fg-muted" label="다시 연결하는 중" />
        연결이 끊겼어요. 다시 연결되면 두 폰의 점수를 서버 기록으로 맞춰요. 그동안 점수는 잠가 둘게요
      </div>
    </div>

    <MatchModal v-if="game.showRuleDetail" :rule="game.rule" @close="game.showRuleDetail = false" />
  </div>
  <!-- 연결 오류로 못 불러왔으면 모집 카드로 보내지 않고 여기서 다시 (경로 5 리뷰 S5: 경기 중 새로 고침한 사람이 점수판을 잃었다) -->
  <div v-else-if="loadFailed" class="h-dvh flex flex-col items-center justify-center gap-3 bg-canvas pt-safe pb-safe px-8 text-center">
    <p class="t-heading">점수판을 불러오지 못했어요</p>
    <p class="t-caption">연결이 돌아오면 다시 눌러 주세요. 점수는 서버에 남아 있어요</p>
    <UiButton class="mt-2" @click="init">다시 시도</UiButton>
    <UiButton variant="ghost" @click="goBack">뒤로</UiButton>
  </div>
  <!-- 불러오는 동안 빈 화면이었다: '경기 시작'을 누르고 아무것도 없는 화면을 봤다 (목적 판정 11/11 5번) -->
  <div v-else class="h-dvh flex flex-col items-center justify-center gap-3 bg-canvas pt-safe pb-safe" aria-busy="true">
    <UiSpinner />
    <p class="t-caption">점수판을 여는 중이에요</p>
  </div>

  <!-- 숨겨진 카메라·동영상 입력 -->
  <input ref="cameraInputRef" type="file" accept="image/*" capture="environment" class="hidden" @change="onCameraChange" />
  <input ref="videoInputRef" type="file" accept="video/mp4,video/quicktime,video/*" class="hidden" @change="onVideoChange" />

  <UiSheet v-model="showExtIds" :title="game?.rule?.extGameLabel ? `${game.rule.extGameLabel} 아이디` : '게임 아이디'">
    <ExtGamePlayers v-if="showExtIds" :game-id="gameId" />
  </UiSheet>

  <ResultEntrySheet
    v-model="showResultEntry"
    :game-id="gameId"
    :format="game?.format"
    :sides="game?.sides || []"
    :my-side="mySideIndex"
    :my-name="game?.format === 'TEAMS' ? '우리 팀' : '나'"
    :opponent-name="user2?.nickname"
    :set-count="game?.rule?.setsToWin || 1"
    :proof="!!game?.rule?.extGame"
    @submitted="goToResult"
  />

  <!-- 경기 기록 -->
  <UiSheet v-model="showLogModal" title="경기 기록">
    <UiEmptyState v-if="!logs.length" mascot="match" title="아직 기록이 없어요" />
    <ol v-else class="space-y-1">
      <li v-for="(log, i) in logs" :key="i" class="flex gap-3 py-2 border-b border-line last:border-0 text-sm">
        <span class="t-micro tabular-nums w-12 flex-shrink-0 pt-0.5">{{ log.elapsed }}</span>
        <span class="text-fg">{{ log.message }}</span>
      </li>
    </ol>
  </UiSheet>
</template>

<script setup>
import { TEAM_NAMES } from '../../utils/gameFormat'
import { ref, computed, onMounted, onUnmounted, reactive, watch } from 'vue'
import { liveEnd, liveSync } from '../../utils/liveActivity'
import { feel } from '../../utils/feel'
import { useRoute, useRouter } from 'vue-router'
import api from '../../api/api'
import { getMyId } from '@/utils/me'
import { socket } from '../../websocket'
import { subscribeTopic } from '../../websocket/userChannel'
import { GET, POST } from '@/api/client'
import { clap, crowdSoundOn, setCrowdSound } from '../../utils/crowdSound'
import LiveBreakCard from '../../components/live/LiveBreakCard.vue'
import MatchModal from '../../components/MatchModal.vue'
import ResultEntrySheet from '../../components/game/ResultEntrySheet.vue'
import ExtGamePlayers from '../../components/external/ExtGamePlayers.vue'
import { UiAvatar, UiButton, UiEmptyState, UiIconButton, UiList, UiListItem, UiSheet, UiSpinner } from '../../components/ui'
import { confirmDialog } from '../../composables/useConfirm'
import { useToast } from '../../composables/useToast'
import {
  addGamePicture,
  addGameVideo,
  compressVideo,
} from '../../utils/gamePictureStorage'
import { compressImage } from '../../utils/image'
import { shareLink } from '../../utils/share'

const route = useRoute()
const router = useRouter()
const { showToast } = useToast()
const gameId = route.params.gameId

// 관중 (docs/live-spectator-review.md A·B): 중계 채널을 함께 듣는다. 응원은 박수 소리, 세트가 끝나면 한 장
const viewers = ref(0)
const lastBreak = ref(null)
const soundOn = ref(crowdSoundOn())
let offLive
const watchOff = ref(false)
async function loadViewers() {
  const live = (await GET('/api/games/{gameId}/live', { path: { gameId: Number(gameId) } }).catch(() => ({ data: null }))).data
  viewers.value = live?.viewers ?? 0
  watchOff.value = !!live?.watchOff
}
async function toggleWatchOff() {
  try {
    const live = (await POST('/api/games/{gameId}/live/watch-off', { path: { gameId: Number(gameId) }, body: { off: !watchOff.value } })).data
    watchOff.value = !!live?.watchOff
    viewers.value = live?.viewers ?? viewers.value
    showToast(watchOff.value ? '중계를 껐어요' : '중계를 다시 켰어요')
  } catch {
    showToast('바꾸지 못했어요. 다시 해 주세요')
  }
}
function toggleSound() {
  soundOn.value = !soundOn.value
  setCrowdSound(soundOn.value)
  if (soundOn.value) clap(2)
}
function listenCrowd() {
  offLive = subscribeTopic(`/topic/game-live/${gameId}`, (e) => {
    if (e.type === 'REACT') clap(1)
    else if (e.type === 'SHOUT') clap(3)
    else if (e.type === 'BREAK') lastBreak.value = e
    else if (e.type === 'VIEWERS') loadViewers()
  })
  loadViewers()
}

// 소켓 연결 상태
const socketStatus = ref('connected') // 'connected', 'connecting', 'disconnected'

// 카메라 관련 상태
const cameraInputRef = ref(null)
const videoInputRef = ref(null)
const game = reactive({})
const chatRoomId = ref(null)
const currentSet = ref(1)
const currentScore1 = ref(0)
const currentScore2 = ref(0)
const user1SetsWon = ref(0)
const user2SetsWon = ref(0)
const isSetOver = ref(false)
const isGameOver = ref(false)
const showFinishModal = ref(false)
const winner = ref('-')
const elapsedSeconds = ref(0)
const elapsedTimeStr = ref('00:00')
const limitTimeStr = ref('')
const timerRef = ref(null)
// 서버 시각 - 이 폰 시각. 세트 시작 시각(서버 기준)을 이 폰 시계로 바꿔서, 두 폰의 타이머가 같은 순간에 시작하게 한다
let clockOffset = 0
const toLocalMs = (serverTime) => new Date(serverTime).getTime() - clockOffset
let countdownTimer = null
let startedSetIndex = 0 // 이미 시작한 세트. 같은 세트의 시작 신호가 또 와도 점수를 지우지 않는다
const logs = ref([])
const user1 = ref(null)
const user2 = ref(null)
// 서버 sides 안에서 내 편의 자리 (결과 입력이 편 순서로 보낸다)
const mySideIndex = ref(0)
const gameWinner = ref('')
const showLogModal = ref(false)
const showResultEntry = ref(false)
const showExtIds = ref(false)
const showStartButton = ref(false)
const countdown = ref(0)
const isCountingDown = ref(false)
const timeOverNotified = ref(false)

// 되돌리기 어려운 행동(처음부터, 경기 끝내기)은 한 번 더 묻는다
// 되돌릴 수 없는 일(취소·처음부터)은 빨간 글자로, 다음 단계(경기 끝내기)는 보통 글자로 묻는다
async function openConfirm(title, cb, message = '', confirmText = '확인', danger = true) {
  if (await confirmDialog({ title, message, confirmText, danger })) cb()
}

// 더보기에서 고르면 시트를 닫고 바로 한다 (사진·영상은 누른 그 순간에 열어야 폰이 막지 않는다)
const showMenu = ref(false)
function menu(cb) {
  showMenu.value = false
  cb()
}
// 다음 시트·확인 창을 여는 갈래: 더보기 시트의 기록 칸이 걷힌 뒤에 연다. 바로 열면 칸이 남아 닫은 뒤 뒤로를 두 번 눌러야 했다 (경로 5 리뷰 S7)
function menuThen(cb) {
  showMenu.value = false
  let done = false
  const go = () => {
    if (done) return
    done = true
    window.removeEventListener('popstate', go)
    cb()
  }
  window.addEventListener('popstate', go)
  setTimeout(go, 300)
}

// 점수판 두 칸 (왼쪽 user1, 오른쪽 user2)
const sides = computed(() => [
  { idx: 1, user: user1.value, score: currentScore1.value, sets: user1SetsWon.value },
  { idx: 2, user: user2.value, score: currentScore2.value, sets: user2SetsWon.value },
])
// 세트 승리 표시 점 개수: 과반 세트
const setDots = computed(() => Math.floor((game.rule?.setsToWin || 1) / 2) + 1)
// 연결이 끊긴 동안에도 막는다: 누른 점수가 서버로 가지 않고 사라지기 때문
const scoreLocked = computed(() => isSetOver.value || isGameOver.value || isCountingDown.value || showStartButton.value || socketStatus.value !== 'connected')
// 아직 아무 점수도 없다: 이때만 경기를 취소할 수 있다 (상대가 안 왔을 때). 점수가 있으면 '경기 끝내기'로
const nothingScored = computed(() => currentSet.value === 1 && !currentScore1.value && !currentScore2.value && !logs.value.some((l) => l.type === 'SCORE'))
const isOvertime = computed(() => game.limitSeconds !== -1 && game.limitSeconds != null && elapsedSeconds.value >= game.limitSeconds)

// 서버가 정한 시각(startAtMs, 이 폰 시계 기준)에 세트를 시작한다. 그때까지는 두 폰이 같은 카운트다운을 보여준다
function startSet(setIndex, startAtMs) {
  if (setIndex !== startedSetIndex) {
    currentScore1.value = 0
    currentScore2.value = 0
    currentSet.value = setIndex
    startedSetIndex = setIndex
  }
  isSetOver.value = false
  showStartButton.value = false
  showFinishModal.value = false
  winner.value = '-'
  timeOverNotified.value = false

  clearInterval(countdownTimer)
  const tick = () => {
    const left = Math.ceil((startAtMs - Date.now()) / 1000)
    if (left > 0) {
      isCountingDown.value = true
      countdown.value = left
      return
    }
    clearInterval(countdownTimer)
    isCountingDown.value = false
    game.setStartedAt = new Date(startAtMs)
    elapsedSeconds.value = 0
    startTimer()
  }
  tick()
  if (isCountingDown.value) countdownTimer = setInterval(tick, 250)
}

function addScore(userIdx, delta) {
  // 카운트다운 중에 온 점수는 버리지 않는다. 버리면 두 폰의 점수가 달라져 한쪽만 경기가 끝난다
  if (isSetOver.value || isGameOver.value) return

  if (userIdx == user1.value.id) {
    // pointsToWin이 설정되어 있으면 그 이상으로 증가 불가
    if (game.rule.pointsToWin !== -1 && delta > 0 && currentScore1.value >= game.rule.pointsToWin) {
      return
    }
    currentScore1.value = Math.max(0, currentScore1.value + delta)
  } else {
    // pointsToWin이 설정되어 있으면 그 이상으로 증가 불가
    if (game.rule.pointsToWin !== -1 && delta > 0 && currentScore2.value >= game.rule.pointsToWin) {
      return
    }
    currentScore2.value = Math.max(0, currentScore2.value + delta)
  }

  checkSetOver()
}

function checkSetOver() {
  // pointsToWin 도달 시에만 자동으로 세트 종료
  if (game.rule.pointsToWin != -1 && currentScore1.value >= game.rule.pointsToWin) {
    user1SetsWon.value++
    finishSet(1)
    return
  }
  if (game.rule.pointsToWin != -1 && currentScore2.value >= game.rule.pointsToWin) {
    user2SetsWon.value++
    finishSet(2)
    return
  }

  // 제한시간이 지나도 세트를 자동 종료하지 않음 (UI만 빨간색으로 표시)
  // 수동으로 '세트종료' 버튼을 눌러야 다음 세트로 진행
}

// '세트 끝내기'는 서버에 알려 두 폰이 같은 순간 함께 끝낸다. 예전엔 누른 폰에서만 끝나 두 폰의 세트 수가 갈렸다 (경로 5 리뷰, 막힘)
async function manualFinishSet() {
  // 목표 점수 전에 끝내면 무승부 세트다. 말없이 무승부가 됐다 (경로 5 리뷰 S8)
  const draw = game.rule.winBy != 'MOST_SETS_AND_POINTS' || currentScore1.value === currentScore2.value
  if (draw && !(await confirmDialog({
    title: `${currentSet.value}세트를 끝낼까요?`,
    message: game.rule.winBy != 'MOST_SETS_AND_POINTS' && game.rule.pointsToWin != -1
      ? `아직 ${game.rule.pointsToWin}점에 닿은 사람이 없어 이 세트는 무승부가 돼요`
      : '점수가 같아 이 세트는 무승부가 돼요',
    confirmText: '세트 끝내기',
  }))) return
  sendOrWarn({ type: 'END_SET', setIndex: currentSet.value, userId: 0, scoreDelta: 0 })
}

// 서버가 알린 '세트 끝내기'를 두 폰이 같은 규칙으로 처리한다
function applyManualFinishSet() {
  // 수동으로 세트 종료 (시간 초과 시)
  if (game.rule.winBy == 'MOST_SETS_AND_POINTS') {
    if (currentScore1.value > currentScore2.value) {
      user1SetsWon.value++
      finishSet(1)
    } else if (currentScore2.value > currentScore1.value) {
      user2SetsWon.value++
      finishSet(2)
    } else {
      finishSet(0) // 무승부
    }
  } else {
    finishSet(0) // 무승부
  }
}

function finishSet(who) {
  feel('success')
  isSetOver.value = true
  clearInterval(timerRef.value)
  if (who === 1) {
    winner.value = user1.value.nickname
  } else if (who === 2) {
    winner.value = user2.value.nickname
  }
  showFinishModal.value = true
  const setsToWin = game.rule.setsToWin
  const requiredWins = Math.ceil(setsToWin / 2)
  if (user1SetsWon.value >= requiredWins || user2SetsWon.value >= requiredWins) {
    isGameOver.value = true
    isSetOver.value = false
    socket_finishGame()
    goToResult()
  } else {
    currentSet.value++
  }
}

function startTimer() {
  if (isGameOver.value) return
  clearInterval(timerRef.value)
  updateElapsed()
  timerRef.value = setInterval(updateElapsed, 1000)
}

function updateElapsed() {
  if (!game.setStartedAt || isSetOver.value || isCountingDown.value) return
  const startedAt = new Date(game.setStartedAt)
  const now = new Date()
  const elapsed = Math.floor((now - startedAt) / 1000)

  // 제한시간이 있는 경우 시간 계산
  if (game.limitSeconds !== -1) {
    elapsedSeconds.value = elapsed
    // 남은 시간 계산 (0 미만 가능 - 오버타임)
    const remainingSeconds = game.limitSeconds - elapsed
    elapsedTimeStr.value = getTimeStr(Math.abs(remainingSeconds))
    limitTimeStr.value = getTimeStr(game.limitSeconds)
  } else {
    // 제한 없음
    elapsedSeconds.value = elapsed
    elapsedTimeStr.value = getTimeStr(elapsedSeconds.value)
    limitTimeStr.value = '제한 없음'
  }

  if (!isSetOver.value && !isGameOver.value) {
    checkSetOver()
  }

  // 시간 초과 알림
  if (
    game.limitSeconds !== -1 &&
    elapsedSeconds.value >= game.limitSeconds &&
    !timeOverNotified.value
  ) {
    timeOverNotified.value = true
    // 진동
    feel('alert')
    // 소리는 넣지 않는다. 있던 /notification.mp3 파일이 없어 매번 오류만 났다 (진동으로 알린다)
  }
}

function getTimeStr(seconds) {
  if (seconds <= 0) return '00:00'
  const min = Math.floor(seconds / 60)
  const sec = seconds % 60
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(min)}:${pad(sec)}`
}

function goToResult() {
  // 이미 이 경기 점수판을 떠났으면 그대로 둔다 (내가 끝내고 넘어간 뒤 '끝' 신호가 또 올 때)
  if (!router.currentRoute.value.path.endsWith(`/games/${gameId}/play`)) return
  // 결과에서 뒤로 가면 끝난 점수판이 아니라 그 전 화면으로
  router.replace(`/games/${gameId}/result`)
}

// 알림으로 바로 들어와 앱 안 기록이 없으면 갈 곳이 없었다 (경로 전부 훑기 5)
function goBack() {
  if (window.history.state?.back) router.back()
  else router.replace('/game')
}

function handleVisibilityChange() {
  if (document.visibilityState === 'visible') {
    keepScreenOn() // 다른 앱에 다녀오면 화면 켜짐 유지가 풀린다
    // 페이지가 다시 활성화될 때 소켓 연결을 시도합니다.
    // socket.connect 내부 로직에 의해 이미 연결된 상태라면 아무 작업도 수행하지 않습니다.
    socket.connect(chatRoomId.value)

    updateElapsed()
    if (!isSetOver.value && !isGameOver.value) {
      startTimer()
    }
  }
}

function addLog(log) {
  const start = new Date(game.totalGameStartedAt)
  const current = new Date(log.time)
  const diffSec = Math.floor((current - start) / 1000)
  const minutes = String(Math.floor(diffSec / 60)).padStart(2, '0')
  const seconds = String(diffSec % 60).padStart(2, '0')
  const elapsed = `${minutes}:${seconds}`

  // 사람의 말로: '-1점 실점 (변경자 - 김철수)'·'리셋함'·'알 수 없는 이벤트'는 개발자 말이었다 (경로 5 리뷰 S9)
  let message = ''
  const by = log.userSummary?.nickname
  if (log.type === 'SCORE') {
    const target = log.targetId == user1.value.id ? user1.value.nickname : user2.value.nickname
    message = log.delta > 0 ? `${target} +${log.delta}점` : `${target} 점수 ${-log.delta}점 내림`
    if (by && by !== target) message += ` · ${by}님이 눌렀어요`
  } else if (log.type === 'SET') {
    message = `${by ? by + '님이 ' : ''}${log.setIndex ? log.setIndex + '세트를 ' : '세트를 '}시작했어요`
  } else if (log.type === 'END_SET') {
    message = `${by ? by + '님이 ' : ''}${log.setIndex}세트를 끝냈어요`
  } else if (log.type === 'RESET') {
    message = `${by ? by + '님이 ' : ''}처음부터 다시 했어요`
  } else if (log.type === 'FINISH') {
    message = `경기를 끝냈어요`
  } else {
    return
  }

  logs.value.push({
    elapsed,
    message,
    type: log.type,
    user: log.userSummary,
  })
}

const loadFailed = ref(false)
let socketReady = false
onMounted(() => {
  listenCrowd()
  init()
})

async function init() {
  // 옛 안드로이드·iOS 앱의 카메라 콜백은 뺐다: 옛 앱이 없고, Capacitor iOS는 UA에 raspy-ios가 붙어 없는 다리를 부르다 떨어졌다. 파일 입력 하나로 (목적 판정 11/11 5번)

  loadFailed.value = false
  const currentUserId = await getMyId().catch(() => null)

  // 시작 전 경기(신청만 있거나 승인 전)는 점수판이 없다: 경기 화면으로. 끝난 경기는 결과로 (11/4 밤샘)
  const res = await api.get(`/api/games/${gameId}/detail`).catch(() => null)
  if (!res) {
    loadFailed.value = true
    return
  }
  if (res.data.gameStatus != 'IN_PROGRESS') {
    // 결과 확인을 기다리는 경기도 결과로: 확인하러 온 사람이 모집 카드를 봤다 (목적 판정 11/11 5번)
    router.replace(['COMPLETED', 'RESULT_PENDING'].includes(res?.data.gameStatus) ? `/games/${gameId}/result` : `/games/${gameId}`)
    return
  }
  applyDetail(res.data, currentUserId)
  connectSocket()
}

// 서버 기록으로 점수판을 맞춘다 (처음 열 때, 다시 연결됐을 때, 처음부터 다시 신호를 받았을 때)
function applyDetail(data, currentUserId) {
  const res = { data }

  // reactive에 직접 대입 (전체 덮어쓰기)
  Object.assign(game, res.data)
  game.showRuleDetail = false
  if (res.data.serverNow) clockOffset = new Date(res.data.serverNow).getTime() - Date.now()
  if (res.data.setStartedAt) game.setStartedAt = new Date(toLocalMs(res.data.setStartedAt))

  chatRoomId.value = res.data.chatRoomId

  const g = res.data
  if (g.format === 'TEAMS' && g.sides?.length === 2) {
    // 팀 경기: 팀마다 첫 사람에게 점수를 붙이고(서버가 팀으로 합친다) 칸에는 팀 이름을 보인다. 내 팀이 왼쪽
    const mine = g.sides.findIndex((s) => s.members.some((m) => m.id == currentUserId))
    mySideIndex.value = Math.max(0, mine)
    const [left, right] = mySideIndex.value === 0 ? g.sides : [g.sides[1], g.sides[0]]
    const asUser = (side) => ({
      id: side.members[0].id,
      nickname: `${TEAM_NAMES[side.key] || '팀'} · ${side.members.map((m) => m.nickname).join('·')}`,
      profileUrl: side.members[0].profileUrl,
    })
    user1.value = asUser(left)
    user2.value = asUser(right)
    currentScore1.value = left.score
    currentScore2.value = right.score
    user1SetsWon.value = left.sets
    user2SetsWon.value = right.sets
  } else {
    const isLeftUser1 = g.user1.id == currentUserId
    user1.value = isLeftUser1 ? g.user1 : g.user2
    user2.value = isLeftUser1 ? g.user2 : g.user1

    currentScore1.value = isLeftUser1 ? g.score1 : g.score2
    currentScore2.value = isLeftUser1 ? g.score2 : g.score1

    user1SetsWon.value = isLeftUser1 ? g.set1 : g.set2
    user2SetsWon.value = isLeftUser1 ? g.set2 : g.set1
    mySideIndex.value = g.sides?.findIndex((s) => s.members.some((m) => m.id == currentUserId)) ?? 0
  }
  currentSet.value = g.currentSet || 0

  if (game.rule.pointsToWin != -1 && currentScore1.value >= game.rule.pointsToWin) {
    isSetOver.value = true
    isGameOver.value = false
    user1SetsWon.value += 1
    currentSet.value += 1
  } else if (game.rule.pointsToWin != -1 && currentScore2.value >= game.rule.pointsToWin) {
    isSetOver.value = true
    isGameOver.value = false
    user2SetsWon.value += 1
    currentSet.value += 1
  } else if (game.limitSeconds !== -1 && elapsedSeconds.value >= game.limitSeconds) {
    isSetOver.value = true
    isGameOver.value = false
    if (game.rule.winBy == 'MOST_SETS_AND_POINTS') {
      if (currentScore1.value > currentScore2.value) {
        user1SetsWon.value += 1
        currentSet.value += 1
      } else if (currentScore2.value > currentScore1.value) {
        user2SetsWon.value += 1
        currentSet.value += 1
      }
    }
  } else {
    isSetOver.value = false
    isGameOver.value = false
    const startAtMs = game.setStartedAt ? game.setStartedAt.getTime() : Date.now()
    if (g.setStarted === false && game.limitSeconds !== -1) {
      // 시간 제한이 있는 1세트는 둘이 준비되면 시작 버튼으로
      showStartButton.value = true
    } else if (startAtMs > Date.now()) {
      // 카운트다운 중에 새로고침했으면 남은 카운트다운부터
      startSet(currentSet.value, startAtMs)
    } else {
      // 이미 진행 중인 세트면 타이머를 이어서 (새로고침해도 시작 버튼이 다시 뜨지 않게)
      startedSetIndex = currentSet.value
      startTimer()
    }
  }

  // 경기 기록은 덤이다. 못 받아도 점수판·연결은 그대로 연다 (경로 5 리뷰 S6: 기록 실패에 소켓을 아예 붙이지 않아 점수가 안 올라갔다)
  api.get(`/api/games/${gameId}/game-logs`).then(({ data: rawLogs }) => {
    logs.value = []
    rawLogs.forEach((log) => addLog(log))
  }).catch(() => {})
}

// 다시 연결됐을 때: 화면을 처음부터 다시 그리지 않고(다른 앱에 다녀올 때마다 깜빡였다) 서버 기록만 다시 받아 맞춘다
async function resync() {
  const currentUserId = await getMyId().catch(() => null)
  const res = await api.get(`/api/games/${gameId}/detail`).catch(() => null)
  if (!res) return
  if (res.data.gameStatus != 'IN_PROGRESS') {
    router.replace(['COMPLETED', 'RESULT_PENDING'].includes(res.data.gameStatus) ? `/games/${gameId}/result` : `/game`)
    return
  }
  applyDetail(res.data, currentUserId)
}

function connectSocket() {
  if (socketReady) return
  socketReady = true
  // 소켓 핸들러 등록
  socket.onConnecting(() => {
    socketStatus.value = 'connecting'
  })
  let everConnected = false
  socket.onConnected(() => {
    socketStatus.value = 'connected'
    // 끊긴 사이 상대 폰에서 오른 점수를 놓쳤을 수 있다. 다시 연결되면 서버 기록으로 맞춘다
    if (everConnected) resync()
    everConnected = true
  })
  socket.onDisconnected(() => {
    socketStatus.value = 'disconnected'
  })

  socket.onMessage((payload) => {
    if (payload.type === 'SCORE') {
      addScore(payload.targetId, payload.delta)
      addLog(payload)
    } else if (payload.type === 'SET') {
      // 시작 시각은 서버가 정한다. 보낸 시각(time)으로 이 폰 시계와의 차이를 다시 맞춘다
      if (payload.time) clockOffset = new Date(payload.time).getTime() - Date.now()
      startSet(payload.setIndex || currentSet.value, payload.setStartedAt ? toLocalMs(payload.setStartedAt) : Date.now() + 5000)
      addLog(payload)
    } else if (payload.type === 'FINISH') {
      isGameOver.value = true
      addLog(payload)
      const setsToWin = game.rule.setsToWin
      const requiredWins = Math.ceil(setsToWin / 2)
      if (user1SetsWon.value < requiredWins && user2SetsWon.value < requiredWins) {
        if (game.rule.winBy == 'MOST_SETS_AND_POINTS') {
          if (currentScore1.value > currentScore2.value) user1SetsWon.value++
          else if (currentScore2.value > currentScore1.value) user2SetsWon.value++
        }
      }
      if (user1SetsWon.value > user2SetsWon.value) {
        gameWinner.value = '@' + user1.value.nickname
      } else if (user2SetsWon.value > user1SetsWon.value) {
        gameWinner.value = '@' + user2.value.nickname
      } else {
        gameWinner.value = '무승부'
      }
      // 상대가 끝냈어도 결과 화면으로 간다. 거기서 결과를 확인(또는 돌려보내기)하고 평가한다
      // (전엔 점수판에 그대로 남아, 뒤로 가면 확인·평가 기회 없이 나가게 됐다)
      clearInterval(timerRef.value)
      setTimeout(goToResult, 600)
    } else if (payload.type === 'END_SET') {
      if (payload.setIndex === currentSet.value && !isSetOver.value && !isGameOver.value) applyManualFinishSet()
      addLog(payload)
    } else if (payload.type === 'CANCELED') {
      showToast(`${payload.nickname}님이 경기를 취소했어요`)
      router.replace('/game')
    } else if (payload.type === 'RESET') {
      // 처음부터 다시: 화면을 새로 그리지 않고 서버 기록(0:0, 1세트)으로 맞춘다
      startedSetIndex = 0
      resync()
      addLog(payload)
    }
  })
  socket.connect(chatRoomId.value)

  document.addEventListener('visibilitychange', handleVisibilityChange)
  keepScreenOn()
}

function socket_sendScore(userIndex, scoreDelta) {
  const sent = socket.sendGameEvent(chatRoomId.value, {
    type: 'SCORE',
    userId: userIndex === 1 ? user1.value.id : user2.value.id,
    setIndex: currentSet.value,
    scoreDelta: scoreDelta,
  })
  if (sent) return feel(scoreDelta > 0 ? 'score' : 'tap')
  feel('error')
  showToast('연결이 끊겨 점수가 올라가지 않았어요. 연결되면 다시 눌러 주세요')
}

// 시작은 했지만 점수가 하나도 없을 때: 상대가 안 왔거나 못 하게 됐다. 기록에 남지 않는다
async function cancelGame() {
  try {
    await api.post(`/api/games/${gameId}/cancel`)
    showToast('경기를 취소했어요')
    router.replace('/game')
  } catch (e) {
    showToast(e.response?.data?.message || '취소하지 못했어요')
  }
}

// 경기 중 화면이 꺼지지 않게 (점수를 누르는 사이 폰이 잠기면 경기 흐름이 끊긴다)
let wakeLock = null
async function keepScreenOn() {
  try {
    if (document.visibilityState === 'visible' && !wakeLock) {
      wakeLock = await navigator.wakeLock?.request('screen')
      wakeLock?.addEventListener('release', () => (wakeLock = null))
    }
  } catch {
    // 지원하지 않는 기기·저전력 모드는 넘어간다
  }
}

async function shareLive() {
  const msg = await shareLink(`${window.location.origin}/live/${gameId}`, `${game.rule?.ruleTitle || '경기'} 지금 하는 중이에요. 같이 봐요`)
  if (msg) showToast(msg)
}

// 끊긴 동안 누르면 아무 일도 없어 고장 난 줄 알았다: 점수 칸처럼 다시 누르라고 알린다 (목적 판정 11/11 5번)
function sendOrWarn(event) {
  if (socket.sendGameEvent(chatRoomId.value, event)) return true
  feel('error')
  showToast('연결이 끊겼어요. 연결되면 다시 눌러 주세요')
  return false
}

function socket_startSet() {
  sendOrWarn({ type: 'START', setIndex: currentSet.value, userId: 0, scoreDelta: 0 })
}

function socket_nextSet() {
  sendOrWarn({ type: 'SET', setIndex: currentSet.value, userId: 0, scoreDelta: 0 })
}

function socket_finishGame() {
  sendOrWarn({ type: 'FINISH' })
}

function socket_resetGame() {
  sendOrWarn({ type: 'RESET' })
}

// 사진·영상 찍기: 기기의 카메라 입력 하나로
function triggerPhotoCapture() {
  cameraInputRef.value?.click()
}
function triggerVideoCapture() {
  videoInputRef.value?.click()
}

// 카메라 파일 선택 완료
async function onCameraChange(e) {
  const file = e.target.files?.[0]
  if (!file) return

  // File을 base64로 변환
  const reader = new FileReader()

  reader.onload = async (event) => {
    try {
      const dataUrl = event.target.result

      // 이미지 압축 (기본값 사용: 800px, quality 0.3)
      const compressed = await compressImage(dataUrl)

      // IndexedDB에 저장
      await addGamePicture(gameId, compressed)

      // 휴대폰 사진첩이 아니라 이 기기 안에 담아 둔다. 결과 화면에서 골라 올려야 남는다 (경로 5 리뷰 S10)
      showToast('사진을 담아 뒀어요. 경기가 끝나면 결과 화면에서 올려요')
    } catch (error) {
      console.error('사진 저장 실패:', error)
      if (error.message === 'QUOTA_EXCEEDED') {
        showToast('폰 저장 공간이 모자라요. 사진 몇 장을 지우고 다시 해 주세요')
      } else {
        showToast('사진을 저장하지 못했어요')
      }
    }
  }

  reader.onerror = () => {
    console.error('파일 읽기 실패')
    showToast('사진을 저장하지 못했어요')
  }

  reader.readAsDataURL(file)

  // input 초기화 (같은 파일 재선택 가능하도록)
  e.target.value = ''
}

// 동영상 파일 선택 완료
async function onVideoChange(e) {
  const file = e.target.files?.[0]
  if (!file) return

  showToast('동영상 처리 중...')

  try {
    // 동영상 압축 (최대 2분)
    const { dataUrl, duration } = await compressVideo(file, 120)

    // IndexedDB에 저장
    await addGameVideo(gameId, dataUrl, duration)

    showToast(`영상(${Math.floor(duration)}초)을 담아 뒀어요. 경기가 끝나면 결과 화면에서 올려요`)
  } catch (error) {
    console.error('동영상 저장 실패:', error)
    if (error.message === 'QUOTA_EXCEEDED') {
      showToast('폰 저장 공간이 모자라요. 사진·영상 몇 개를 지우고 다시 해 주세요')
    } else {
      showToast('동영상을 저장하지 못했어요')
    }
  }

  // input 초기화
  e.target.value = ''
}

// 아이폰 잠금화면 점수판 (Live Activity, utils/liveActivity.ts): 점수·세트·진행이 바뀔 때마다 맞춘다. 경기가 끝나면 끈다.
// 점수판 화면을 떠나도 경기 중이면 잠금화면에 남는다 (폰을 주머니에 넣고 잠금화면에서 누를 수 있게)
watch(
  () => [user1.value?.id, user2.value?.id, currentSet.value, currentScore1.value, currentScore2.value, user1SetsWon.value, user2SetsWon.value, isSetOver.value, isGameOver.value, isCountingDown.value, showStartButton.value, game.setStartedAt],
  () => {
    if (!user1.value?.id || !user2.value?.id) return
    if (isGameOver.value) return liveEnd(Number(gameId))
    liveSync(
      { gameId: Number(gameId), title: game.rule?.ruleTitle || '경기', user1Id: user1.value.id, user2Id: user2.value.id, name1: user1.value.nickname || '', name2: user2.value.nickname || '' },
      {
        setIndex: currentSet.value,
        score1: currentScore1.value,
        score2: currentScore2.value,
        sets1: user1SetsWon.value,
        sets2: user2SetsWon.value,
        canScore: !isSetOver.value && !isCountingDown.value && !showStartButton.value,
        setStartedAt: game.setStartedAt ? new Date(game.setStartedAt).getTime() : null,
      },
    )
  },
)

onUnmounted(() => {
  clearInterval(timerRef.value)
  clearInterval(countdownTimer)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  wakeLock?.release().catch(() => {})


  offLive?.()
  // 소켓 핸들러 정리. 메시지 처리기와 연결도 끊는다: 남겨 두면 점수판을 떠난 뒤에도 상대의 '경기 취소'·'처음부터 다시'가 지금 화면을 옮겼다 (경로 5 리뷰 S4)
  socket.onConnecting(null)
  socket.onConnected(null)
  socket.onDisconnected(null)
  socket.onMessage(null)
  socket.disconnect({ clearRoomId: true })
})
</script>

<style scoped>
@keyframes fade-in {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes blink {
  0%,
  50%,
  100% {
    opacity: 1;
  }
  25%,
  75% {
    opacity: 0.3;
  }
}
@keyframes vs-jump-blink {
  0% {
    transform: translateY(0);
    opacity: 1;
  }
  25% {
    transform: translateY(3px);
    opacity: 0.7;
  }
  50% {
    transform: translateY(-6px);
    opacity: 1;
  }
  75% {
    transform: translateY(3px);
    opacity: 0.7;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}
@keyframes countdown {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0.9;
  }
}
.vs-jump-blink {
  animation: vs-jump-blink 1.5s ease-in-out infinite;
}
.animate-fade-in {
  animation: fade-in 0.6s ease forwards;
}
.animate-blink {
  animation: blink 2.5s infinite;
}
.animate-countdown {
  animation: countdown 1s ease-in-out;
}
</style>
