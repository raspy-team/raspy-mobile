<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar :title="title" back />

    <main class="max-w-xl mx-auto px-4 pt-4 pb-16">
      <UiSkeleton v-if="!state && !error" class="h-40 w-full" />
      <UiEmptyState v-else-if="error && !state" class="pt-16" icon="fas fa-triangle-exclamation" :title="error">
        <UiButton variant="secondary" @click="join">다시 들어가기</UiButton>
        <!-- 공유 판이 아닌 주소·끝난 판으로 온 사람에게 되풀이만 주었다: 같은 게임을 새로 (경로 2 리뷰) -->
        <UiButton class="mt-2" variant="ghost" :to="`/play/${route.params.key}`">이 게임 한 판</UiButton>
      </UiEmptyState>

      <template v-else-if="state">
        <!-- 언제 끝나고, 언제 또 둘 수 있나 -->
        <div class="flex items-center justify-between">
          <span class="t-heading">{{ headline }}</span>
          <span class="t-micro">{{ state.status === 'PLAYING' ? `${until(state.endsAt)} 끝` : '' }}</span>
        </div>
        <p class="t-caption mt-1">{{ state.players.length }}/{{ state.maxPlayers }}명 · {{ state.players.map((p, i) => `${i + 1}번 ${p.nickname}${i === state!.meIndex ? '(나)' : ''}`).join(' · ') }}</p>

        <TurnViewPanel class="mt-4" :view="state.view" :my-turn="canMove" :sending="sending" @move="move" />
        <p v-if="moveError" class="t-caption text-danger mt-2 text-center">{{ moveError }}</p>
        <p v-if="state.status === 'PLAYING'" class="t-caption mt-4">한 시간에 한 칸, 내 땅에 붙은 칸을 가져가요(남의 땅도). 사흘 뒤 가진 칸이 많은 순서로 등수가 매겨져요.</p>
        <UiButton v-if="state.status !== 'PLAYING'" block size="lg" class="mt-4" @click="again">새 판 들어가기</UiButton>
        <!-- 다 끝났으면 홈으로 한 번에 (탭이 없는 화면이라 뒤로를 여러 번 눌렀다, 11/11) -->
        <UiButton v-if="state.status !== 'PLAYING'" block variant="ghost" icon="home" class="mt-2" to="/">홈으로</UiButton>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
// 비동기 공유 판 (/play/:key/board, 땅따먹기 판). 여럿이 며칠 동안 아무 때나 같은 판을 바꾼다.
// 판이 바뀌면 서버가 신호를 보내고 그때 다시 불러온다 (폴링하지 않는다)
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { GET, POST } from '@/api/client'
import type { components } from '@/api/schema'
import { refreshOnChange } from '@/websocket/userChannel'
import TurnViewPanel from '../../components/appgame/TurnViewPanel.vue'
import { UiButton, UiEmptyState, UiSkeleton, UiTopBar } from '../../components/ui'

type State = components['schemas']['SharedBoardState']

const route = useRoute()
const key = computed(() => String(route.params.key))
const title = computed(() => ({ 'land-grab': '땅따먹기 판' } as Record<string, string>)[key.value] ?? '공유 판')
const state = ref<State | null>(null)
const error = ref('')
const moveError = ref('')
const sending = ref(false)
const now = ref(Date.now())
const offset = ref(0)

const serverNow = computed(() => now.value + offset.value)
const nextAt = computed(() => (state.value?.nextMoveAt ? new Date(state.value.nextMoveAt).getTime() : 0))
const canMove = computed(() => state.value?.status === 'PLAYING' && nextAt.value <= serverNow.value)
const headline = computed(() => {
  const s = state.value
  if (!s) return ''
  if (s.status === 'COMPLETED') return s.myPlace ? `끝났어요 · ${s.myPlace}등` : '끝났어요'
  if (s.status === 'CANCELED') return '모이기 전에 닫힌 판이에요 · 기록에 남지 않아요'
  if (canMove.value) return '한 칸 가져가세요'
  const min = Math.ceil((nextAt.value - serverNow.value) / 60000)
  return `${min}분 뒤에 또 둘 수 있어요`
})

function until(at: string) {
  const ms = new Date(at).getTime() - serverNow.value
  const h = Math.max(0, Math.floor(ms / 3600000))
  return h >= 24 ? `${Math.floor(h / 24)}일 ${h % 24}시간 뒤` : `${h}시간 뒤`
}
function message(e: unknown, fallback: string) {
  const r = (e as { response?: { status?: number; data?: { message?: string } } }).response
  // 없는 번호는 서버가 '대결 없음: 123'처럼 개발용 문구를 준다. 사람에게는 풀어서 (도전장 화면과 같은 말)
  if (r?.status === 404) return '없거나 이미 끝난 경기예요'
  return r?.data?.message || fallback
}
function apply(s: State) {
  offset.value = new Date(s.serverNow).getTime() - Date.now()
  state.value = s
}
async function join() {
  error.value = ''
  try {
    apply((await POST('/api/app-games/{key}/board', { path: { key: key.value } })).data)
  } catch (e) {
    error.value = message(e, '들어가지 못했어요')
  }
}
async function reload() {
  if (!state.value) return
  try {
    apply((await GET('/api/app-games/board/{gameId}', { path: { gameId: state.value.gameId } })).data)
  } catch {
    // 다음 신호 때 다시
  }
}
async function move(cell: string) {
  if (!state.value || sending.value) return
  sending.value = true
  moveError.value = ''
  try {
    apply((await POST('/api/app-games/board/{gameId}/move', { path: { gameId: state.value.gameId }, body: { text: cell } })).data)
  } catch (e) {
    moveError.value = message(e, '두지 못했어요')
  } finally {
    sending.value = false
  }
}
async function again() {
  state.value = null
  await join()
}

const timer = setInterval(() => (now.value = Date.now()), 15000)
let stop: (() => void) | undefined
onMounted(async () => {
  await join()
  stop = refreshOnChange(reload)
})
onBeforeUnmount(() => {
  clearInterval(timer)
  stop?.()
})
</script>
