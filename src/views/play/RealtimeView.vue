<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar :title="title" back />

    <main class="max-w-xl mx-auto px-4 pt-4 pb-16">
      <UiSkeleton v-if="!state && !error" class="h-40 w-full" />
      <UiEmptyState v-else-if="error && !state" class="pt-16" icon="fas fa-triangle-exclamation" :title="error">
        <UiButton variant="secondary" @click="join">다시 들어가기</UiButton>
      </UiEmptyState>

      <!-- 대기실 -->
      <template v-else-if="state?.status === 'WAITING'">
        <UiCard class="text-center py-10">
          <UiSpinner class="mx-auto" />
          <p class="t-heading mt-4">{{ state.invitee ? `${state.invitee.nickname}님을 기다리고 있어요` : state.fixture ? '대회 상대를 기다리고 있어요' : '상대를 찾고 있어요' }}</p>
          <!-- 초대 방: 그 사람만 들어온다. 봇·친구 부르기·다른 게임은 두지 않는다 -->
          <template v-if="state.invitee">
            <p class="t-caption mt-1">메시지로 도전장을 보냈어요. 들어오면 바로 시작해요</p>
            <p v-if="inviteLeft" class="t-micro mt-2 tabular-nums">{{ inviteLeft }} 남음 · 이 화면을 나가면 도전이 취소돼요</p>
          </template>
          <p v-else-if="state.fixture" class="t-caption mt-1">상대에게 알렸어요. 상대가 들어오면 바로 시작해요</p>
          <p v-else-if="longLobby" class="t-caption mt-1">상대가 오면 알려 드려요. 이 화면을 닫아도 돼요</p>
          <p v-else class="t-caption mt-1 tabular-nums">{{ waited }}초</p>
          <!-- 처음 온 사람이 기다리다 나가지 않게: 곧 연습 상대가 온다고 말해 둔다 (세션 B 흐름 검토) -->
          <p v-if="!longLobby && !state.fixture && !state.invitee && state.botAfterSeconds" class="t-micro mt-2">{{ state.botAfterSeconds }}초 안에 사람이 없으면 연습 상대(봇)와 붙어요</p>
        </UiCard>
        <!-- 하루 기다리는 게임은 봇을 저절로 부르지 않는다: 원하면 바로 봇과 -->
        <UiButton v-if="longLobby && !state.fixture && !state.invitee" block variant="secondary" class="mt-4" :disabled="waited < state.botAfterSeconds" @click="callBot">
          {{ waited < state.botAfterSeconds ? `${state.botAfterSeconds - waited}초 뒤 봇과 할 수 있어요` : '기다리지 않고 봇과 하기' }}
        </UiButton>
        <UiButton v-if="!called && !state.fixture && !state.invitee" block variant="secondary" class="mt-2" icon="user-group" :loading="calling" @click="callFriends">친구 부르기</UiButton>
        <p v-else class="t-caption text-center mt-2">{{ called }}</p>
        <UiButton block variant="ghost" class="mt-2" @click="leave">{{ state.invitee ? '도전 취소' : '그만 찾기' }}</UiButton>
        <!-- 다른 게임에서 기다리는 사람이 있으면 그쪽으로 붙는 게 빠르다 -->
        <WaitingNow v-if="!state.invitee" class="mt-6" title="다른 게임에서 기다리는 사람" :exclude-game-id="state.gameId" />
      </template>

      <!-- 짝이 지어지면 3·2·1 (첫 차례 시간은 그 뒤부터) -->
      <AppCountdown
        v-else-if="state?.status === 'PLAYING' && counting"
        :until="startsAt"
        :offset="offset"
        :opponent="who(state.opponent)"
        :hint="state.summary"
        @done="now = Date.now()"
      />

      <!-- 판 -->
      <template v-else-if="state?.status === 'PLAYING'">
        <div class="flex items-center justify-between">
          <span class="t-heading">{{ turnLine }}</span>
          <span class="t-mono tabular-nums" :class="left <= 5 ? 'text-danger' : 'text-fg-muted'">{{ leftText }}</span>
        </div>
        <div class="h-1 rounded-full bg-surface-3 mt-2 overflow-hidden">
          <div class="h-full bg-fg transition-[width] duration-200" :style="{ width: `${(left / state.turnSeconds) * 100}%` }" />
        </div>

        <!-- 서버가 준 판 (가위바위보·편지 오목·배틀십) -->
        <template v-if="state.view">
          <TurnViewPanel class="mt-4" :view="state.view" :my-turn="myTurn && !counting" :sending="sending" @move="shoot" />
          <p v-if="moveError" class="t-caption text-danger mt-2 text-center">{{ moveError }}</p>
        </template>

        <!-- 알까기: 판 -->
        <template v-else-if="state.stones">
        <AlkkagiBoard
          class="mt-4"
          :stones="state.stones"
          :flip="!state.meFirst"
          :my-turn="myTurn"
          :last-move="state.moves[state.moves.length - 1]?.word"
          :move-count="state.moves.length"
          :sending="sending"
          @shoot="shoot"
        />
        <p v-if="moveError" class="t-caption text-danger mt-1">{{ moveError }}</p>
        </template>

        <!-- 끝말잇기: 이은 낱말과 입력칸 -->
        <template v-else>
        <UiCard class="mt-4">
          <ol class="space-y-1.5">
            <li class="t-caption">시작: {{ state.startWord }}</li>
            <li
              v-for="(m, i) in state.moves"
              :key="i"
              class="flex items-center justify-between"
              :class="i === state.moves.length - 1 ? 't-heading' : 't-body text-fg-muted'"
            >
              <span>{{ m.word }}</span>
              <span class="t-micro">{{ m.userId === state.me.userId ? '나' : who(state.opponent) }}</span>
            </li>
          </ol>
        </UiCard>

        <form class="mt-4" @submit.prevent="send">
          <UiInput ref="input" v-model="word" :maxlength="6" :placeholder="myTurn ? `'${lastChar}'(으)로 시작하는 낱말` : '상대가 생각하는 중'" @enter="send" />
          <p v-if="moveError" class="t-caption text-danger mt-1">{{ moveError }}</p>
          <UiButton block size="lg" class="mt-3" :disabled="!myTurn || !word.trim()" :loading="sending" @click="send">내기</UiButton>
        </form>
        </template>
        <!-- 실시간 심사: 보는 사람들이 응원해 승패가 정해진다 -->
        <UiButton v-if="state.liveJudged" block variant="secondary" icon="share" class="mt-4" @click="shareWatch">구경 링크 보내기</UiButton>
        <p v-if="state.liveJudged" class="t-caption text-center mt-1">보는 사람들의 응원으로 승패가 정해져요</p>
        <UiButton block variant="ghost" class="mt-2" @click="leave">그만두기</UiButton>
      </template>

      <!-- 결과 -->
      <template v-else-if="state">
        <UiCard class="text-center py-8">
          <template v-if="state.status === 'COMPLETED'">
            <!-- 진 순간에도 얼굴이 곁에 있다. 표정만 담담하게 -->
            <BrandFace :mood="state.result === 'WIN' ? 'wow' : 'neutral'" :size="64" class="mx-auto mb-3" />
            <p class="t-display">{{ state.result === 'WIN' ? '이겼어요' : state.result === 'DRAW' ? '비겼어요' : '졌어요' }}</p>
            <p v-if="state.view" class="t-caption mt-2 whitespace-pre-line">{{ who(state.opponent) }}님과 · {{ state.view.note }}</p>
            <p v-else-if="state.stones" class="t-caption mt-2">{{ who(state.opponent) }}님과 · 쳐낸 돌 {{ knocked(false) }} : {{ knocked(true) }}</p>
            <p v-else class="t-caption mt-2">{{ resultCount }}</p>
            <p v-if="NEXT_ROUND[state.result || '']" class="t-body mt-4">{{ NEXT_ROUND[state.result || ''] }}</p>
          </template>
          <p v-else class="t-title">경기가 끝났어요</p>
        </UiCard>
        <TurnViewPanel v-if="state.view?.boards?.length" class="mt-3" :view="{ ...state.view, note: undefined, choices: [] }" :my-turn="false" :sending="false" />
        <UiCard v-if="state.moves.length && !state.stones && !state.view" class="mt-3">
          <p class="t-caption">{{ [state.startWord, ...state.moves.map((m) => m.word)].join(' → ') }}</p>
        </UiCard>
        <UiButton block size="lg" class="mt-4" @click="again">한 판 더</UiButton>
        <UiButton block variant="ghost" class="mt-2" :to="`/play/${key}`">돌아가기</UiButton>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import { who } from '@/utils/format'
// 실시간 대결 (/play/:key/live). 대기실 → 3·2·1 → 판 → 결과가 한 화면에서 바뀐다.
// 상태는 서버가 '바뀜' 신호를 보낼 때만 다시 불러온다 (폴링하지 않는다). 남은 시간은 서버 시각 기준으로 센다
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { GET, POST } from '@/api/client'
import type { components } from '@/api/schema'
import { refreshOnChange } from '@/websocket/userChannel'
import { confirmDialog } from '../../composables/useConfirm'
import BrandFace from '../../components/BrandFace.vue'
import { NEXT_ROUND } from '@/utils/verdict'
import { feel } from '@/utils/feel'
import AppCountdown from '../../components/appgame/AppCountdown.vue'
import AlkkagiBoard from '../../components/appgame/AlkkagiBoard.vue'
import TurnViewPanel from '../../components/appgame/TurnViewPanel.vue'
import WaitingNow from '../../components/appgame/WaitingNow.vue'
import { shareLink } from '../../utils/share'
import { useToast } from '../../composable/useToast'
import { UiButton, UiCard, UiEmptyState, UiInput, UiSkeleton, UiSpinner, UiTopBar } from '../../components/ui'

type State = components['schemas']['RealtimeState']

const route = useRoute()
const { showToast } = useToast()
const router = useRouter()
const key = computed(() => String(route.params.key))
const TITLES: Record<string, string> = { wordchain: '끝말잇기', alkkagi: '알까기', rps: '가위바위보', 'letter-gomoku': '편지 오목', battleship: '배틀십', 'quiz-race': '퀴즈 먼저 맞히기', 'word-battle': '말 배틀', 'thirty-one': '서른하나', 'last-stone': '마지막 돌', 'card-duel': '숫자 카드 대결', auction: '칩 경매', 'drop-four': '사목 떨어뜨리기', flip: '뒤집기', 'number-baseball': '숫자 야구', 'number-bomb': '숫자 폭탄', 'math-race': '암산 먼저', chosung: '초성 먼저' }
const title = computed(() => TITLES[key.value] ?? '실시간 경기')
const state = ref<State | null>(null)
const error = ref('')
const word = ref('')
const moveError = ref('')
const sending = ref(false)
const input = ref<{ focus: () => void } | null>(null)
const now = ref(Date.now())
const offset = ref(0) // 서버 시각 - 기기 시각

const myTurn = computed(() => state.value?.turnUserId === state.value?.me.userId)
const lastChar = computed(() => {
  const moves = state.value?.moves ?? []
  return (moves[moves.length - 1]?.word ?? state.value?.startWord ?? '').slice(-1)
})
const serverNow = computed(() => now.value + offset.value)
const startsAt = computed(() => (state.value?.startsAt ? new Date(state.value.startsAt).getTime() : 0))
const counting = computed(() => startsAt.value > serverNow.value)
const left = computed(() => {
  const end = state.value?.turnEndsAt ? new Date(state.value.turnEndsAt).getTime() : 0
  return Math.max(0, Math.ceil((end - serverNow.value) / 1000))
})
// 남은 시간: 15초짜리는 초로, 하루짜리(편지 오목)는 "23시간 12분"으로
const leftText = computed(() => {
  const l = left.value
  if (l < 120) return `${l}초`
  const h = Math.floor(l / 3600)
  const m = Math.floor((l % 3600) / 60)
  return h ? `${h}시간 ${m}분` : `${m}분`
})
// 결과 한 줄. 같이 내기는 한 판에 두 수가 쌓여 판 수로 센다. 0이면 '0번'이 어색해 따로 (11/5 밤샘 C)
const resultCount = computed(() => {
  const s = state.value
  const n = s?.moves?.length ?? 0
  if (!s || !n) return '첫 수 전에 끝났어요'
  return `${who(s.opponent)}님과 ` + (s.simultaneous ? `${s.round ?? Math.ceil(n / 2)}판 겨뤘어요` : `${n}번 주고받았어요`)
})

// 같이 내는 게임(가위바위보)은 '골라 주세요' / '상대가 고르는 중'
const turnLine = computed(() => {
  const s = state.value
  if (!s) return ''
  if (s.race) return myTurn.value ? '먼저 맞히세요' : '다음 문제를 기다려요'
  if (s.simultaneous) return myTurn.value ? `${(s.round ?? 0) + 1}판 · 골라 주세요` : `${who(s.opponent)}님이 고르는 중`
  return myTurn.value ? '내 차례' : `${who(s.opponent)}님 차례`
})
const longLobby = computed(() => (state.value?.lobbySeconds ?? 30) > 120)

async function shareWatch() {
  if (!state.value) return
  const msg = await shareLink(`${window.location.origin}/watch/${state.value.gameId}`, `${title.value} 하는 중! 보고 응원해 주세요`)
  if (msg) showToast(msg)
}

// 친구 부르기: 수락한 친구에게 푸시. 대기실마다 한 번
const calling = ref(false)
const called = ref('')
async function callFriends() {
  if (!state.value) return
  calling.value = true
  try {
    const n = (await POST('/api/app-games/realtime/{gameId}/call', { path: { gameId: state.value.gameId } })).data.called
    called.value = n ? `친구 ${n}명에게 알렸어요` : '아직 친구가 없어요. 친구를 맺으면 부를 수 있어요'
  } catch (e) {
    called.value = message(e, '부르지 못했어요')
  } finally {
    calling.value = false
  }
}

// 다른 게임에서 기다리는 사람에게 붙으러 가면 같은 화면이 다시 쓰인다: 지금 대기실은 닫고 새 게임에 들어간다
watch(key, async (_, before) => {
  const old = state.value
  if (old?.status === 'WAITING') await POST('/api/app-games/realtime/{gameId}/leave', { path: { gameId: old.gameId } }).catch(() => {})
  state.value = null
  botCalled = false
  called.value = ''
  if (before) await join()
})

async function callBot() {
  const s = state.value
  if (!s) return
  apply((await POST('/api/app-games/realtime/{gameId}/bot', { path: { gameId: s.gameId } })).data)
}

const waited = computed(() => {
  const since = state.value?.waitingSince ? new Date(state.value.waitingSince).getTime() : serverNow.value
  return Math.max(0, Math.floor((serverNow.value - since) / 1000))
})

function message(e: unknown, fallback: string) {
  return (e as { response?: { data?: { message?: string } } }).response?.data?.message || fallback
}

// 끝나는 순간 한 번: 이기면 화음, 지면 부드럽게 내려가는 소리와 진동
watch(
  () => (state.value?.status === 'COMPLETED' ? state.value.result : null),
  (r, before) => r && !before && feel(r === 'WIN' ? 'win' : r === 'DRAW' ? 'success' : 'lose'),
)

function apply(s: State) {
  offset.value = new Date(s.serverNow).getTime() - Date.now()
  state.value = s
}

// 정한 사람과 한 판 (11/4): ?to=사람 이면 그 사람만 들어오는 방을 열고, ?invite=경기 면 받은 초대로 들어간다. 한 번만 쓴다 (다시 한 판은 보통 대기실)
let inviteTo = Number(route.query.to) || null
let inviteId = Number(route.query.invite) || null
if (inviteTo || inviteId) router.replace({ query: {} })

const inviteLeft = computed(() => {
  const until = state.value?.inviteUntil ? new Date(state.value.inviteUntil).getTime() : 0
  const left = Math.max(0, Math.floor((until - serverNow.value) / 1000))
  return left ? `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}` : ''
})

async function join() {
  error.value = ''
  const to = inviteTo, invite = inviteId
  try {
    inviteTo = inviteId = null
    if (invite) return apply((await POST('/api/app-games/realtime/{gameId}/accept', { path: { gameId: invite } })).data)
    if (to) return apply((await POST('/api/app-games/{key}/realtime/invite', { path: { key: key.value }, query: { to } })).data)
    apply((await POST('/api/app-games/{key}/realtime', { path: { key: key.value } })).data)
  } catch (e) {
    // 다시 들어가기가 아무나 붙는 대기실로 가지 않게
    inviteTo = to
    inviteId = invite
    error.value = message(e, '들어가지 못했어요')
  }
}

async function reload() {
  if (!state.value) return
  try {
    apply((await GET('/api/app-games/realtime/{gameId}', { path: { gameId: state.value.gameId } })).data)
  } catch {
    // 다음 신호 때 다시 불러온다
  }
}

async function send() {
  if (!state.value || !myTurn.value || !word.value.trim() || sending.value) return
  sending.value = true
  moveError.value = ''
  try {
    apply((await POST('/api/app-games/realtime/{gameId}/move', { path: { gameId: state.value.gameId }, body: { word: word.value.trim() } })).data)
    word.value = ''
  } catch (e) {
    moveError.value = message(e, '내지 못했어요')
  } finally {
    sending.value = false
  }
}

/** 알까기: 튕긴 수를 낸다 */
async function shoot(move: string) {
  if (!state.value || !myTurn.value || sending.value) return
  sending.value = true
  moveError.value = ''
  try {
    apply((await POST('/api/app-games/realtime/{gameId}/move', { path: { gameId: state.value.gameId }, body: { word: move } })).data)
  } catch (e) {
    moveError.value = message(e, '내지 못했어요')
  } finally {
    sending.value = false
  }
}

/** 알까기: 쳐낸 돌 수 (mine=true면 상대가 쳐낸 내 돌) */
function knocked(mine: boolean) {
  return (state.value?.stones ?? []).filter((s) => s.mine === mine && !s.alive).length
}

async function leave() {
  if (!state.value) return
  if (state.value.status === 'PLAYING' && !(await confirmDialog({ title: '그만둘까요?', message: '지금 나가면 이 판은 지게 돼요', confirmText: '그만두기' }))) return
  apply((await POST('/api/app-games/realtime/{gameId}/leave', { path: { gameId: state.value.gameId } })).data)
  if (state.value?.status === 'CANCELED') router.replace(`/play/${key.value}`)
}

async function again() {
  state.value = null
  await join()
}

// 대기실에서 봇을 부를 때와 차례 시간이 끝났을 때, 한 번씩만 서버에 알린다
let botCalled = false
let timeoutSentFor = -1
const timer = setInterval(async () => {
  now.value = Date.now()
  const s = state.value
  if (!s) return
  if (s.status === 'WAITING' && !s.fixture && !s.invitee && !botCalled && !longLobby.value && waited.value >= s.botAfterSeconds) {
    botCalled = true
    apply((await POST('/api/app-games/realtime/{gameId}/bot', { path: { gameId: s.gameId } })).data)
  }
  // 마감 시각마다 한 번 (레이스·같이 내기는 moves가 그대로여도 판이 바뀐다)
  const due = s.turnEndsAt ? new Date(s.turnEndsAt).getTime() : -1
  if (s.status === 'PLAYING' && left.value === 0 && timeoutSentFor !== due) {
    timeoutSentFor = due
    // 서버는 1초 여유를 둔다
    setTimeout(async () => {
      if (state.value?.gameId === s.gameId) apply((await POST('/api/app-games/realtime/{gameId}/timeout', { path: { gameId: s.gameId } })).data)
    }, 1500)
  }
}, 250)

// 내 차례가 되거나, 내 차례로 3·2·1이 끝나면 입력칸에 바로 친다
watch([myTurn, counting], async ([mine, waiting]) => {
  if (mine && !waiting) {
    moveError.value = ''
    await nextTick()
    input.value?.focus()
  }
})

let stop: (() => void) | undefined
onMounted(async () => {
  await join()
  stop = refreshOnChange(reload)
})
onBeforeUnmount(() => {
  clearInterval(timer)
  stop?.()
  // 대기실에 둔 채 나가면 방을 닫는다 (하는 중이면 돌아와서 이어 할 수 있게 그대로 둔다)
  // 하루 기다리는 게임(편지 오목)은 닫지 않는다: 상대가 오면 알림이 간다
  if (state.value?.status === 'WAITING' && !longLobby.value) POST('/api/app-games/realtime/{gameId}/leave', { path: { gameId: state.value.gameId } }).catch(() => {})
})
</script>
