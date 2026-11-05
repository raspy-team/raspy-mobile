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
          <p class="t-heading mt-4">{{ state.fixture ? '대회 상대를 기다리고 있어요' : '상대를 찾고 있어요' }}</p>
          <p class="t-caption mt-1 tabular-nums">{{ waited }}초</p>
          <!-- 실시간 게임 대기실과 같은 말: 곧 AI 주민이 온다 -->
          <p v-if="!state.fixture && state.botAfterSeconds" class="t-micro mt-2">{{ waitText(state.botAfterSeconds) }} 안에 사람이 안 오면 AI 주민이 상대가 돼요</p>
        </UiCard>
        <!-- 흔들기는 판이 시작되기 전에 센서를 켜 둔다 (시작한 뒤에 누르면 그만큼 손해) -->
        <UiButton v-if="key === 'shake' && sensor === 'ask'" block size="lg" class="mt-4" @click="askSensor">센서 미리 켜기</UiButton>
        <UiButton block variant="ghost" class="mt-4" @click="leave">그만 찾기</UiButton>
      </template>

      <!-- 흔들기 대결: 폰을 흔든 횟수를 서버가 센다 -->
      <template v-else-if="state?.status === 'PLAYING' && key === 'shake'">
        <div class="text-center pt-6">
          <p class="t-caption">{{ counting ? '곧 시작해요' : `${shakeLeft}초 남음` }}</p>
          <p class="t-display tabular-nums mt-4">{{ score[0] }}</p>
          <p class="t-caption flex items-center justify-center min-w-0"><span class="shrink-0">나 ·&nbsp;</span><OpponentName :player="state.opponent" /><span class="shrink-0 tabular-nums">&nbsp;{{ score[1] }}</span></p>
          <p v-if="counting" class="t-display tabular-nums mt-8">{{ countdown }}</p>
          <p v-else class="t-title mt-8">폰을 흔드세요!</p>
          <!-- 아이폰은 센서를 쓰려면 한 번 눌러 허락을 받아야 한다 -->
          <UiButton v-if="sensor === 'ask'" block size="lg" class="mt-6" @click="askSensor">센서 켜기</UiButton>
          <UiButton v-else-if="sensor === 'none'" block size="lg" class="mt-6" :disabled="counting" @click="sendShake">흔들 수 없으면 눌러서</UiButton>
        </div>
        <UiButton block variant="ghost" class="mt-6" @click="leave">그만두기</UiButton>
      </template>

      <!-- 판: 내 라켓이 늘 아래. 판 위 어디든 손가락을 대고 좌우로 움직인다 -->
      <template v-else-if="state?.status === 'PLAYING'">
        <div class="flex items-center justify-between">
          <!-- 점수판: 상대 이름은 좁은 화면(320)에서 줄인다. AI 주민이면 이름 뒤에 AI -->
          <span class="t-heading tabular-nums flex items-center min-w-0"><span class="shrink-0">나 {{ score[0] }} : {{ score[1] }}&nbsp;</span><OpponentName :player="state.opponent" /></span>
          <span class="t-micro shrink-0 ml-2">{{ counting ? '곧 시작해요' : serving ? '서브' : '5점 먼저' }}</span>
        </div>
        <div
          ref="field"
          class="relative mt-3 mx-auto rounded-xl bg-surface overflow-hidden touch-none select-none"
          :style="{ aspectRatio: `1 / ${HEIGHT}`, maxHeight: '70dvh' }"
          @pointerdown="aim"
          @pointermove="aim"
        >
          <div class="absolute inset-x-0 top-1/2 border-t border-dashed border-line-strong"></div>
          <div class="absolute rounded-full bg-fg" :style="paddleStyle(0)"></div>
          <div class="absolute rounded-full bg-fg-muted" :style="paddleStyle(1)"></div>
          <!-- 연두 공은 밝은 판(흰색)에서 잘 안 보여 테두리를 둔다 (11/5 UX) -->
          <div class="absolute rounded-full bg-signal ring-1 ring-fg" :style="ballStyle"></div>
          <p v-if="counting" class="absolute inset-0 flex items-center justify-center t-display tabular-nums">{{ countdown }}</p>
        </div>
        <p v-if="!connected" class="t-caption text-danger mt-2 text-center">연결하는 중이에요</p>
        <UiButton block variant="ghost" class="mt-3" @click="leave">그만두기</UiButton>
      </template>

      <!-- 결과 -->
      <template v-else-if="state">
        <UiCard class="text-center py-8">
          <template v-if="state.status === 'COMPLETED'">
            <!-- 진 순간에도 얼굴이 곁에 있다. 표정만 담담하게 -->
            <MatchMascot who="match" :mood="state.result === 'WIN' ? 'cheer' : state.result === 'DRAW' ? 'smile' : 'sad'" :size="72" class="mx-auto mb-3" />
            <p class="t-display">{{ state.result === 'WIN' ? '이겼어요' : state.result === 'DRAW' ? '비겼어요' : '졌어요' }}</p>
            <p class="t-caption mt-2">{{ who(state.opponent) }}님과 {{ state.myScore ?? 0 }} : {{ state.opponentScore ?? 0 }}{{ key === 'shake' ? '번' : '' }}</p>
            <p v-if="NEXT_ROUND[state.result || '']" class="t-body mt-4">{{ NEXT_ROUND[state.result || ''] }}</p>
          </template>
          <p v-else class="t-title">경기가 끝났어요</p>
        </UiCard>
        <UiButton block size="lg" class="mt-4" @click="again">한 판 더</UiButton>
        <UiButton block variant="ghost" class="mt-2" :to="`/play/${key}`">돌아가기</UiButton>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import { waitText, who } from '@/utils/format'
import OpponentName from '../../components/appgame/OpponentName.vue'
// 실시간 대전 (/play/:key/battle, 퐁). 서버가 1초에 20번 판을 계산해 웹소켓으로 보내고, 화면은 그대로 그린다.
// 손가락 위치만 보낸다 (라켓을 두고 싶은 x). 라켓이 얼마나 빨리 가는지는 서버가 정한다. 내 쪽(0번이 아니면 판을 뒤집어)이 늘 아래
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { Client } from '@stomp/stompjs'
import { GET, POST } from '@/api/client'
import type { components } from '@/api/schema'
import { WS_URL } from '@/config/server'
import { refreshOnChange } from '@/websocket/userChannel'
import { confirmDialog } from '../../composables/useConfirm'
import MatchMascot from '../../components/mascot/MatchMascot.vue'
import { NEXT_ROUND } from '@/utils/verdict'
import { feel } from '@/utils/feel'
import { UiButton, UiCard, UiEmptyState, UiSkeleton, UiSpinner, UiTopBar } from '../../components/ui'
import { useToast } from '../../composable/useToast'

type State = components['schemas']['BattleStateResponse']
// 퐁: b 공, p 라켓, s 점수. 흔들기: c 횟수, left 남은 초
type Snapshot = { b?: [number, number]; p?: [number, number]; s?: [number, number]; c?: [number, number]; left?: number; serve?: boolean; over: boolean }

// 서버 PongGame과 같은 판 크기 (가로 1, 세로 HEIGHT)
const HEIGHT = 1.6
const PADDLE_Y = [1.5, 0.1]
const PADDLE_HALF = 0.12
const BALL_R = 0.02

const route = useRoute()
const router = useRouter()
const { showToast } = useToast()
const key = computed(() => String(route.params.key))
const title = computed(() => ({ pong: '퐁', shake: '흔들기 대결' } as Record<string, string>)[key.value] ?? '실시간 대전')
const state = ref<State | null>(null)
// 게임 중에 뒤로 가기(안드로이드 하드웨어 버튼 포함)로 나가면 한 번 묻는다 (11/6 b2 앱 껍데기 점검).
// 시트 확인창 대신 기본 창: 뒤로 가기 도중에 시트가 기록을 쌓으면 화면 이동이 꼬인다
onBeforeRouteLeave(() => state.value?.status !== 'PLAYING' || window.confirm('게임이 진행 중이에요. 나가면 이 판은 진 것으로 남을 수 있어요. 나갈까요?'))
const error = ref('')
const snap = ref<Snapshot | null>(null)
const connected = ref(false)
const field = ref<HTMLElement | null>(null)
const now = ref(Date.now())
const offset = ref(0)

const flip = computed(() => state.value?.meIndex === 1)
const startsAt = computed(() => (state.value?.startsAt ? new Date(state.value.startsAt).getTime() : 0))
const counting = computed(() => startsAt.value > now.value + offset.value)
const countdown = computed(() => Math.max(1, Math.ceil((startsAt.value - now.value - offset.value) / 1000)))
const serving = computed(() => !!snap.value?.serve)
const waited = computed(() => {
  const since = state.value?.waitingSince ? new Date(state.value.waitingSince).getTime() : now.value
  return Math.max(0, Math.floor((now.value + offset.value - since) / 1000))
})
// 점수: [나, 상대]
const score = computed(() => {
  const s = snap.value?.s ?? snap.value?.c ?? [0, 0]
  return flip.value ? [s[1], s[0]] : [s[0], s[1]]
})

// 판 좌표 → 화면 %. 뒤집으면 위아래와 좌우가 함께 바뀐다 (상대 쪽에서 보는 판)
const px = (x: number) => (flip.value ? 1 - x : x) * 100
const py = (y: number) => ((flip.value ? HEIGHT - y : y) / HEIGHT) * 100
function paddleStyle(who: 0 | 1) {
  // who: 0이 나, 1이 상대
  const idx = flip.value ? 1 - who : who
  const x = snap.value?.p?.[idx] ?? 0.5
  return { left: `${px(x) - PADDLE_HALF * 100}%`, width: `${PADDLE_HALF * 200}%`, top: `calc(${py(PADDLE_Y[idx])}% - 4px)`, height: '8px' }
}
const ballStyle = computed(() => {
  const [x, y] = snap.value?.b ?? [0.5, HEIGHT / 2]
  return { left: `calc(${px(x)}% - ${BALL_R * 100}%)`, top: `calc(${py(y)}% - ${(BALL_R / HEIGHT) * 100}%)`, width: `${BALL_R * 200}%`, aspectRatio: '1' }
})

// ---------- 웹소켓: 판 받기, 손가락 보내기 ----------
let client: Client | null = null
function connect() {
  if (client || !state.value) return
  const s = state.value
  client = new Client({
    brokerURL: WS_URL,
    connectHeaders: { token: localStorage.getItem('raspy_access_token2') || '' },
    reconnectDelay: 2000,
    debug: () => {},
    onConnect: () => {
      connected.value = true
      client?.subscribe(s.topic, ({ body }) => {
        snap.value = JSON.parse(body)
        if (snap.value?.over) setTimeout(reload, 300)
      })
    },
    onWebSocketClose: () => (connected.value = false),
  })
  client.activate()
}
function disconnect() {
  client?.deactivate()
  client = null
  connected.value = false
}

let lastSent = 0
function aim(e: PointerEvent) {
  const el = field.value
  if (!el || !client?.connected || !state.value) return
  const t = Date.now()
  if (t - lastSent < 30) return // 1초에 30번까지만
  lastSent = t
  const rect = el.getBoundingClientRect()
  const x = (e.clientX - rect.left) / rect.width
  client.publish({ destination: `/app/battle/${state.value.gameId}`, body: JSON.stringify({ x: String(flip.value ? 1 - x : x) }) })
}

// ---------- 흔들기: 폰 센서 (기기 실시간 측정) ----------
// 흔들림만 골라 "1"을 보낸다. 너무 촘촘한 흔들기는 서버가 거른다
const shakeLeft = computed(() => Math.ceil(snap.value?.left ?? 10))
type MotionPermission = { requestPermission?: () => Promise<string> }
const sensor = ref<'ask' | 'on' | 'none'>(
  typeof window === 'undefined' || !('DeviceMotionEvent' in window) ? 'none'
    : typeof (window.DeviceMotionEvent as unknown as MotionPermission).requestPermission === 'function' ? 'ask' : 'on',
)
let lastShake = 0
function sendShake() {
  if (!client?.connected || !state.value || counting.value) return
  client.publish({ destination: `/app/battle/${state.value.gameId}`, body: JSON.stringify({ x: '1' }) })
}
function onMotion(e: DeviceMotionEvent) {
  const a = e.accelerationIncludingGravity
  if (!a || a.x == null || a.y == null || a.z == null) return
  // 중력(9.8)을 빼고 크게 흔들렸을 때만, 120ms에 한 번까지
  const force = Math.abs(Math.hypot(a.x, a.y, a.z) - 9.8)
  const t = Date.now()
  if (force > 12 && t - lastShake > 120) {
    lastShake = t
    sendShake()
  }
}
async function askSensor() {
  try {
    const answer = await (window.DeviceMotionEvent as unknown as MotionPermission).requestPermission?.()
    sensor.value = answer === 'granted' ? 'on' : 'none'
  } catch {
    sensor.value = 'none'
  }
  if (sensor.value === 'on') window.addEventListener('devicemotion', onMotion)
}

// ---------- 대기실·결과 ----------
// 끝나는 순간 한 번: 이기면 화음, 지면 부드럽게 내려가는 소리와 진동
watch(
  () => (state.value?.status === 'COMPLETED' ? state.value.result : null),
  (r, before) => r && !before && feel(r === 'WIN' ? 'win' : r === 'DRAW' ? 'success' : 'lose'),
)

function apply(s: State) {
  offset.value = new Date(s.serverNow).getTime() - Date.now()
  state.value = s
  if (s.status === 'PLAYING') connect()
  else disconnect()
}
function message(e: unknown, fallback: string) {
  const r = (e as { response?: { status?: number; data?: { message?: string } } }).response
  // 없는 번호는 서버가 '대결 없음: 123'처럼 개발용 문구를 준다. 사람에게는 풀어서 (도전장 화면과 같은 말)
  if (r?.status === 404) return '없거나 이미 끝난 경기예요'
  return r?.data?.message || fallback
}
// AI 주민 프로필의 '앱 게임 한 판' (?ai=주민): 방을 열자마자 그 주민을 부른다. 한 번만.
// 주소의 ?ai는 들어간 뒤에 지운다. 화면은 주소마다 새로 그려져(App.vue의 key) 먼저 지우면 새 화면이 따로 방을 열고,
// 지우는 순간 이 화면이 내려가며 나가기(leave)를 해 막 연 방이 취소됐다 (11/6 ff가 RealtimeView에서 찾은 것과 같다).
// 주소만 지울 때는 방을 두고, 새로 그려진 화면이 join으로 그 방을 이어 받는다
let aiId = Number(route.query.ai) || null
let keepRoom = false
function clearQuery() {
  if (!route.query.ai) return
  keepRoom = true
  router.replace({ query: {} })
}
async function join() {
  error.value = ''
  try {
    apply((await POST('/api/app-games/{key}/battle', { path: { key: key.value } })).data)
    const ai = aiId
    aiId = null
    if (ai && state.value?.status === 'WAITING') {
      botCalled = true
      apply((await POST('/api/app-games/battle/{gameId}/bot', { path: { gameId: state.value.gameId }, query: { botId: ai } })).data)
    }
    clearQuery()
  } catch (e) {
    error.value = message(e, '들어가지 못했어요')
  }
}
async function reload() {
  if (!state.value) return
  try {
    apply((await GET('/api/app-games/battle/{gameId}', { path: { gameId: state.value.gameId } })).data)
  } catch {
    // 다음 신호 때 다시
  }
}
async function leave() {
  if (!state.value) return
  if (state.value.status === 'PLAYING' && !(await confirmDialog({ title: '그만둘까요?', message: '지금 나가면 이 판은 지게 돼요', confirmText: '그만두기' }))) return
  try {
    apply((await POST('/api/app-games/battle/{gameId}/leave', { path: { gameId: state.value.gameId } })).data)
  } catch (e) {
    showToast(message(e, '나가지 못했어요. 연결을 확인하고 다시 해 주세요'))
    return
  }
  if (state.value?.status === 'CANCELED') router.replace(`/play/${key.value}`)
}
async function again() {
  state.value = null
  snap.value = null
  await join()
}

let botCalled = false
const timer = setInterval(() => {
  now.value = Date.now()
  const s = state.value
  if (s?.status === 'WAITING' && !s.fixture && !botCalled && waited.value >= s.botAfterSeconds) {
    botCalled = true
    // 못 부르면 5초 뒤 다시
    POST('/api/app-games/battle/{gameId}/bot', { path: { gameId: s.gameId } })
      .then(({ data }) => apply(data))
      .catch(() => setTimeout(() => (botCalled = false), 5000))
  }
}, 250)

let stop: (() => void) | undefined
onMounted(async () => {
  if (key.value === 'shake' && sensor.value === 'on') window.addEventListener('devicemotion', onMotion)
  await join()
  stop = refreshOnChange(reload)
})
onBeforeUnmount(() => {
  window.removeEventListener('devicemotion', onMotion)
  clearInterval(timer)
  stop?.()
  disconnect()
  if (state.value?.status === 'WAITING' && !keepRoom) POST('/api/app-games/battle/{gameId}/leave', { path: { gameId: state.value.gameId } }).catch(() => {})
})
</script>
