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
          <p class="t-heading mt-4">상대를 찾고 있어요</p>
          <p class="t-caption mt-1 tabular-nums">{{ waited }}초</p>
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
          <p class="t-caption">나 · {{ who(state.opponent) }} {{ score[1] }}</p>
          <p v-if="counting" class="t-display tabular-nums mt-8">{{ countdown }}</p>
          <p v-else class="t-title mt-8">폰을 흔드세요!</p>
          <!-- 아이폰은 센서를 쓰려면 한 번 눌러 허락을 받아야 한다 -->
          <UiButton v-if="sensor === 'ask'" block size="lg" class="mt-6" @click="askSensor">센서 켜기</UiButton>
          <UiButton v-else-if="sensor === 'none'" block size="lg" class="mt-6" :disabled="counting" @click="sendShake">흔들 수 없으면 눌러서</UiButton>
        </div>
        <UiButton block variant="ghost" class="mt-6" @click="leave">그만두기 (지게 돼요)</UiButton>
      </template>

      <!-- 판: 내 라켓이 늘 아래. 판 위 어디든 손가락을 대고 좌우로 움직인다 -->
      <template v-else-if="state?.status === 'PLAYING'">
        <div class="flex items-center justify-between">
          <span class="t-heading tabular-nums">나 {{ score[0] }} : {{ score[1] }} {{ who(state.opponent) }}</span>
          <span class="t-micro">{{ counting ? '곧 시작해요' : serving ? '서브' : '5점 먼저' }}</span>
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
          <div class="absolute rounded-full bg-signal" :style="ballStyle"></div>
          <p v-if="counting" class="absolute inset-0 flex items-center justify-center t-display tabular-nums">{{ countdown }}</p>
        </div>
        <p v-if="!connected" class="t-caption text-danger mt-2 text-center">연결하는 중이에요</p>
        <UiButton block variant="ghost" class="mt-3" @click="leave">그만두기 (지게 돼요)</UiButton>
      </template>

      <!-- 결과 -->
      <template v-else-if="state">
        <UiCard class="text-center py-8">
          <template v-if="state.status === 'COMPLETED'">
            <BrandFace v-if="state.result === 'WIN'" mood="wow" :size="64" class="mx-auto mb-3" />
            <p class="t-display">{{ state.result === 'WIN' ? '이겼어요' : state.result === 'DRAW' ? '비겼어요' : '졌어요' }}</p>
            <p class="t-caption mt-2">{{ who(state.opponent) }}님과 {{ state.myScore ?? 0 }} : {{ state.opponentScore ?? 0 }}{{ key === 'shake' ? '번' : '' }}</p>
          </template>
          <p v-else class="t-title">대결이 끝났어요</p>
        </UiCard>
        <UiButton block size="lg" class="mt-4" @click="again">한 판 더</UiButton>
        <UiButton block variant="ghost" class="mt-2" :to="`/play/${key}`">돌아가기</UiButton>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import { who } from '@/utils/format'
// 실시간 대전 (/play/:key/battle, 퐁). 서버가 1초에 20번 판을 계산해 웹소켓으로 보내고, 화면은 그대로 그린다.
// 손가락 위치만 보낸다 (라켓을 두고 싶은 x). 라켓이 얼마나 빨리 가는지는 서버가 정한다. 내 쪽(0번이 아니면 판을 뒤집어)이 늘 아래
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Client } from '@stomp/stompjs'
import { GET, POST } from '@/api/client'
import type { components } from '@/api/schema'
import { WS_URL } from '@/config/server'
import { refreshOnChange } from '@/websocket/userChannel'
import { confirmDialog } from '../../composables/useConfirm'
import BrandFace from '../../components/BrandFace.vue'
import { UiButton, UiCard, UiEmptyState, UiSkeleton, UiSpinner, UiTopBar } from '../../components/ui'

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
const key = computed(() => String(route.params.key))
const title = computed(() => ({ pong: '퐁', shake: '흔들기 대결' } as Record<string, string>)[key.value] ?? '실시간 대전')
const state = ref<State | null>(null)
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
function apply(s: State) {
  offset.value = new Date(s.serverNow).getTime() - Date.now()
  state.value = s
  if (s.status === 'PLAYING') connect()
  else disconnect()
}
function message(e: unknown, fallback: string) {
  return (e as { response?: { data?: { message?: string } } }).response?.data?.message || fallback
}
async function join() {
  error.value = ''
  try {
    apply((await POST('/api/app-games/{key}/battle', { path: { key: key.value } })).data)
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
  apply((await POST('/api/app-games/battle/{gameId}/leave', { path: { gameId: state.value.gameId } })).data)
  if (state.value?.status === 'CANCELED') router.replace(`/play/${key.value}`)
}
async function again() {
  state.value = null
  snap.value = null
  await join()
}

let botCalled = false
const timer = setInterval(async () => {
  now.value = Date.now()
  const s = state.value
  if (s?.status === 'WAITING' && !botCalled && waited.value >= s.botAfterSeconds) {
    botCalled = true
    apply((await POST('/api/app-games/battle/{gameId}/bot', { path: { gameId: s.gameId } })).data)
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
  if (state.value?.status === 'WAITING') POST('/api/app-games/battle/{gameId}/leave', { path: { gameId: state.value.gameId } }).catch(() => {})
})
</script>
