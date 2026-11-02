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
        <UiButton block variant="ghost" class="mt-4" @click="leave">그만 찾기</UiButton>
      </template>

      <!-- 짝이 지어지면 3·2·1 (첫 차례 시간은 그 뒤부터) -->
      <AppCountdown
        v-else-if="state?.status === 'PLAYING' && counting"
        :until="startsAt"
        :offset="offset"
        :opponent="state.opponent?.nickname"
        @done="now = Date.now()"
      />

      <!-- 판 -->
      <template v-else-if="state?.status === 'PLAYING'">
        <div class="flex items-center justify-between">
          <span class="t-heading">{{ myTurn ? '내 차례' : `${state.opponent?.nickname}님 차례` }}</span>
          <span class="t-mono tabular-nums" :class="left <= 5 ? 'text-danger' : 'text-fg-muted'">{{ left }}s</span>
        </div>
        <div class="h-1 rounded-full bg-surface-3 mt-2 overflow-hidden">
          <div class="h-full bg-fg transition-[width] duration-200" :style="{ width: `${(left / state.turnSeconds) * 100}%` }" />
        </div>

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
              <span class="t-micro">{{ m.userId === state.me.userId ? '나' : state.opponent?.nickname }}</span>
            </li>
          </ol>
        </UiCard>

        <form class="mt-4" @submit.prevent="send">
          <UiInput ref="input" v-model="word" :maxlength="6" :placeholder="myTurn ? `'${lastChar}'(으)로 시작하는 낱말` : '상대가 생각하는 중'" @enter="send" />
          <p v-if="moveError" class="t-caption text-danger mt-1">{{ moveError }}</p>
          <UiButton block size="lg" class="mt-3" :disabled="!myTurn || !word.trim()" :loading="sending" @click="send">내기</UiButton>
        </form>
        <UiButton block variant="ghost" class="mt-2" @click="leave">그만두기 (지게 돼요)</UiButton>
      </template>

      <!-- 결과 -->
      <template v-else-if="state">
        <UiCard class="text-center py-8">
          <template v-if="state.status === 'COMPLETED'">
            <BrandFace v-if="state.result === 'WIN'" mood="wow" :size="64" class="mx-auto mb-3" />
            <p class="t-display">{{ state.result === 'WIN' ? '이겼어요' : '졌어요' }}</p>
            <p class="t-caption mt-2">{{ state.opponent?.nickname }}님과 {{ state.moves.length }}번 이었어요</p>
          </template>
          <p v-else class="t-title">대결이 끝났어요</p>
        </UiCard>
        <UiCard v-if="state.moves.length" class="mt-3">
          <p class="t-caption">{{ [state.startWord, ...state.moves.map((m) => m.word)].join(' → ') }}</p>
        </UiCard>
        <UiButton block size="lg" class="mt-4" @click="again">한 판 더</UiButton>
        <UiButton block variant="ghost" class="mt-2" :to="`/play/${key}`">돌아가기</UiButton>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
// 실시간 대결 (/play/:key/live). 대기실 → 3·2·1 → 판 → 결과가 한 화면에서 바뀐다.
// 상태는 서버가 '바뀜' 신호를 보낼 때만 다시 불러온다 (폴링하지 않는다). 남은 시간은 서버 시각 기준으로 센다
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { GET, POST } from '@/api/client'
import type { components } from '@/api/schema'
import { refreshOnChange } from '@/websocket/userChannel'
import { confirmDialog } from '../../composables/useConfirm'
import BrandFace from '../../components/BrandFace.vue'
import AppCountdown from '../../components/appgame/AppCountdown.vue'
import { UiButton, UiCard, UiEmptyState, UiInput, UiSkeleton, UiSpinner, UiTopBar } from '../../components/ui'

type State = components['schemas']['RealtimeState']

const route = useRoute()
const router = useRouter()
const key = computed(() => String(route.params.key))
const title = computed(() => (key.value === 'wordchain' ? '끝말잇기' : '실시간 대결'))
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
const waited = computed(() => {
  const since = state.value?.waitingSince ? new Date(state.value.waitingSince).getTime() : serverNow.value
  return Math.max(0, Math.floor((serverNow.value - since) / 1000))
})

function message(e: unknown, fallback: string) {
  return (e as { response?: { data?: { message?: string } } }).response?.data?.message || fallback
}

function apply(s: State) {
  offset.value = new Date(s.serverNow).getTime() - Date.now()
  state.value = s
}

async function join() {
  error.value = ''
  try {
    apply((await POST('/api/app-games/{key}/realtime', { path: { key: key.value } })).data)
  } catch (e) {
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
  if (s.status === 'WAITING' && !botCalled && waited.value >= s.botAfterSeconds) {
    botCalled = true
    apply((await POST('/api/app-games/realtime/{gameId}/bot', { path: { gameId: s.gameId } })).data)
  }
  if (s.status === 'PLAYING' && left.value === 0 && timeoutSentFor !== s.moves.length) {
    timeoutSentFor = s.moves.length
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
  if (state.value?.status === 'WAITING') POST('/api/app-games/realtime/{gameId}/leave', { path: { gameId: state.value.gameId } }).catch(() => {})
})
</script>
