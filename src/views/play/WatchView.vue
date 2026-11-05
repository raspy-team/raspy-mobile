<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar title="중계 보기" back="/" />
    <main class="max-w-xl mx-auto px-4 pt-4 pb-16">
      <UiSkeleton v-if="!state && !error" class="h-40 w-full" />
      <UiEmptyState v-else-if="error && !state" class="pt-16" icon="fas fa-triangle-exclamation" :title="error">
        <UiButton class="mt-4" to="/games">게임 둘러보기</UiButton>
      </UiEmptyState>

      <template v-else-if="state">
        <p class="t-title">주제: {{ state.subject }}</p>
        <p class="t-caption mt-1">{{ state.status === 'PLAYING' ? '하는 중이에요. 더 잘하는 쪽을 응원하세요' : state.status === 'COMPLETED' ? '끝났어요' : '아직 시작 전이에요' }}</p>

        <!-- 두 사람과 응원 -->
        <div class="grid grid-cols-2 gap-3 mt-4">
          <button
            v-for="(p, side) in state.players"
            :key="p.userId"
            type="button"
            class="rounded-2xl bg-surface p-4 text-center disabled:opacity-60"
            :class="state.myVote === side ? 'ring-2 ring-signal' : ''"
            :disabled="!canCheer || busy"
            @click="cheer(side)"
          >
            <UiAvatar :src="p.profilePicture" :name="p.nickname" :user-id="p.userId" size="md" class="mx-auto" />
            <p class="t-heading mt-2 truncate">{{ p.nickname }}<UiAiBadge v-if="p.isBot" /></p>
            <p class="t-display tabular-nums mt-1">{{ state.votes[side] ?? 0 }}</p>
            <p class="t-micro">{{ state.winnerId === p.userId ? '승리' : state.myVote === side ? '내가 응원 중' : canCheer ? '눌러서 응원' : '응원' }}</p>
          </button>
        </div>
        <p v-if="state.player" class="t-caption mt-2 text-center">선수는 응원할 수 없어요</p>

        <!-- 마디 -->
        <ol class="mt-6 space-y-2">
          <li v-for="(m, i) in state.moves" :key="i" class="flex" :class="m.userId === state.players[0]?.userId ? 'justify-start' : 'justify-end'">
            <p class="max-w-[80%] rounded-2xl px-4 py-2.5 t-body bg-surface">{{ m.word }}</p>
          </li>
        </ol>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
// 실시간 심사 관전 (/watch/:gameId, 말 배틀). 선수가 아니어도 보고, 하는 중에 한쪽을 응원한다 (한 사람 한 표, 바꿀 수 있다).
// 마디·응원이 바뀌면 서버가 /topic/watch/{gameId}로 신호를 보내고 그때 다시 불러온다 (폴링하지 않는다)
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { Client } from '@stomp/stompjs'
import { GET, POST } from '@/api/client'
import type { components } from '@/api/schema'
import { WS_URL } from '@/config/server'
import { feel } from '../../utils/feel'
import { UiAiBadge, UiAvatar, UiButton, UiEmptyState, UiSkeleton, UiTopBar } from '../../components/ui'

type State = components['schemas']['WatchState']

const route = useRoute()
const gameId = Number(route.params.gameId)
const state = ref<State | null>(null)
const error = ref('')
const busy = ref(false)
const canCheer = computed(() => state.value?.status === 'PLAYING' && !state.value.player)

async function load() {
  try {
    state.value = (await GET('/api/app-games/realtime/{gameId}/watch', { path: { gameId } })).data
  } catch (e) {
    const r = (e as { response?: { status?: number; data?: { message?: string } } }).response
    error.value = r?.status === 404 ? '없거나 지워진 판이에요' : r?.data?.message || '볼 수 없는 판이에요'
  }
}
async function cheer(side: number) {
  busy.value = true
  try {
    state.value = (await POST('/api/app-games/realtime/{gameId}/cheer', { path: { gameId }, body: { side } })).data
    feel('tap')
  } catch {
    await load()
  } finally {
    busy.value = false
  }
}

let client: Client | null = null
onMounted(async () => {
  await load()
  client = new Client({
    brokerURL: WS_URL,
    connectHeaders: { token: localStorage.getItem('raspy_access_token2') || '' },
    reconnectDelay: 3000,
    debug: () => {},
    onConnect: () => client?.subscribe(`/topic/watch/${gameId}`, () => load()),
  })
  client.activate()
})
onBeforeUnmount(() => client?.deactivate())
</script>
