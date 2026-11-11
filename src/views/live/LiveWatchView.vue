<template>
  <div class="min-h-dvh bg-canvas overflow-hidden">
    <UiTopBar :title="live?.title || '경기 중계'" back />
    <main class="max-w-xl mx-auto px-4 pt-4 pb-56 relative">
      <UiSkeleton v-if="!live && !error" class="h-48 w-full" />
      <!-- 볼 수 없는 중계에서 누를 것이 없었다 (목적 판정 11/11 5번) -->
      <UiEmptyState v-else-if="error" class="pt-16" icon="fas fa-eye-slash" :title="error">
        <UiButton variant="secondary" to="/">홈으로</UiButton>
      </UiEmptyState>
      <template v-else-if="live">
        <p class="t-caption text-center">
          <span v-if="live.status === 'IN_PROGRESS'" class="inline-flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-signal-fg motion-safe:animate-pulse" aria-hidden="true"></span>LIVE · {{ live.setIndex ? `${live.setIndex}세트` : '곧 시작' }}</span>
          <span v-else>{{ STATUS[live.status] || '끝난 경기' }}</span>
        </p>

        <!-- 킥오프 카드: 왜 이 경기인가 (match-28, 전적·흐름·이길 확률·라이벌·챔피언). 내용이 없으면 안 보인다 -->
        <LiveKickoffCard class="mt-4" :game-id="gameId" />

        <!-- 같이 보는 사람: 수와 얼굴 (익명은 수에만) -->
        <!-- 끝난 경기에 '아직 관중이 없어요'는 어색하다: 지금 보는 사람이 없으면 줄을 숨긴다 (끝을 본 사람은 아래 증인 줄) -->
        <div v-if="live.viewers || live.status === 'IN_PROGRESS' || live.status === 'SCHEDULED'" class="flex items-center justify-center gap-2 mt-2">
          <div v-if="live.viewerFaces.length" class="flex -space-x-2">
            <UiAvatar v-for="p in live.viewerFaces.slice(0, 6)" :key="p.userId" :src="p.profilePicture || undefined" :name="p.nickname" :user-id="p.userId" size="xs" />
          </div>
          <span class="t-micro tabular-nums">{{ live.viewers ? `관중 ${live.viewers}명` : '아직 관중이 없어요' }}</span>
        </div>

        <!-- 점수판: 편마다 이름·세트·지금 점수 -->
        <div class="grid gap-3 mt-4" :style="{ gridTemplateColumns: `repeat(${live.sides.length}, minmax(0, 1fr))` }">
          <UiCard v-for="s in live.sides" :key="s.side" class="text-center py-5" :class="{ 'ring-2 ring-signal': live.myCheer === s.side }">
            <div class="flex justify-center -space-x-2">
              <UiAvatar v-for="p in s.players" :key="p.userId" :src="p.profilePicture || undefined" :name="p.nickname" :user-id="p.userId" size="sm" />
            </div>
            <p class="t-label mt-2 truncate">{{ s.players.map((p) => p.nickname).join(' · ') }}</p>
            <UiRollNumber class="t-display tabular-nums mt-2 block" :value="s.score" />
            <p class="t-micro tabular-nums">세트 {{ s.setsWon }}</p>
            <!-- 편은 한 번 고르면 바꾸지 않는다 -->
            <UiButton
              v-if="!live.isPlayer && canAct && (live.myCheer == null || live.myCheer === s.side)"
              size="sm"
              class="mt-3"
              :variant="live.myCheer === s.side ? 'primary' : 'secondary'"
              :disabled="live.myCheer === s.side"
              :loading="cheering === s.side"
              @click="cheer(s.side)"
            >{{ live.myCheer === s.side ? '내 편' : '이 편 응원' }} {{ s.cheers }}</UiButton>
            <p v-else class="t-micro mt-3 tabular-nums">응원 {{ s.cheers }}</p>
          </UiCard>
        </div>
        <p v-if="!live.isPlayer && canAct && live.myCheer == null" class="t-micro text-center mt-2">한 번 고른 편은 바꿀 수 없어요</p>

        <!-- 세트 사이 한 장, 선수의 고마워요 -->
        <LiveBreakCard v-if="lastBreak" class="mt-5" :data="lastBreak" :game-id="gameId" :player="live.isPlayer" />
        <p v-if="thanksFrom" class="t-body text-center mt-3">🙏 {{ thanksFrom }}님이 관중에게 고마워해요</p>

        <!-- 끝난 경기: 증인 -->
        <p v-if="live.witnesses" class="t-caption text-center mt-5">관중 {{ live.witnesses }}명이 이 경기의 끝을 지켜봤어요</p>

        <!-- 관중 사진·영상 (match-34, 비판 6: 장면이 없다). 사진 신호는 /topic/game-media로 따로 듣는다 -->
        <LiveMediaStrip class="mt-5" :game-id="gameId" />

        <!-- 선수: 구경 링크 보내기, 구경 끄기 -->
        <template v-if="live.isPlayer">
          <UiButton block variant="secondary" icon="share" class="mt-5" @click="share">중계 링크 공유</UiButton>
          <UiButton block variant="ghost" class="mt-2" :loading="toggling" @click="toggleWatch">{{ live.watchOff ? '중계 다시 켜기' : '중계 끄기' }}</UiButton>
          <!-- 버튼에 괄호 설명을 넣지 않고 아래 한 줄로 (ui/README 문구) -->
          <p class="t-caption text-center mt-1">{{ live.watchOff ? '지금은 선수 말고는 이 경기를 볼 수 없어요' : '끄면 선수 말고는 이 경기를 볼 수 없어요' }}</p>
        </template>
        <!-- 관중: 익명으로 보기 (수에는 들지만 얼굴·기록은 남지 않는다) -->
        <label v-else class="flex items-center justify-center gap-2 t-caption mt-6">
          <input v-model="anon" type="checkbox" class="accent-current" @change="resubscribe" />
          익명으로 보기 (얼굴과 관중 기록이 남지 않아요)
        </label>
      </template>

      <!-- 날아오르는 반응·응원 글 (저장하지 않고 지나간다) -->
      <span v-for="f in floating" :key="f.id" class="float-emoji" :class="{ 'float-text bg-surface text-fg': f.text }" :style="{ left: `${f.x}%` }" aria-hidden="true">{{ f.emoji }}</span>
    </main>

    <!-- 반응·응원 글 보내기 -->
    <div v-if="live && canAct && !live.isPlayer" class="fixed inset-x-0 bottom-0 bg-canvas/95 border-t border-line px-4 py-3" style="padding-bottom: max(0.75rem, env(safe-area-inset-bottom))">
      <div class="max-w-xl mx-auto">
        <div class="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1" role="group" aria-label="응원 글">
          <UiChip v-for="(t, i) in live.shouts" :key="t" class="flex-shrink-0" @click="shout(i)">{{ t }}</UiChip>
        </div>
        <div class="flex justify-between">
          <button v-for="e in REACTIONS" :key="e" type="button" class="w-14 h-14 rounded-full bg-surface text-2xl active:scale-90 transition-transform" :aria-label="`${e} 보내기`" @click="react(e)">{{ e }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 경기 중계 (/live/:gameId): 만나서 하는 경기의 점수를 선수가 아닌 사람도 실시간으로 본다.
// 관중 보완 (11/3 세션 2, docs/live-spectator-review.md): 같이 보는 사람, 편 고정, 정해진 응원 글, 세트 사이 한 장(BREAK)과 선수의 고마워요, 증인, 익명으로 보기
// 점수는 /topic/game-live/{id}의 신호에만 다시 불러온다 (폴링하지 않는다)
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { GET, POST } from '@/api/client'
import type { components } from '@/api/schema'
import { subscribeTopic } from '@/websocket/userChannel'
import { shareLink } from '@/utils/share'
import { useToast } from '@/composables/useToast'
import { UiAvatar, UiButton, UiCard, UiChip, UiEmptyState, UiRollNumber, UiSkeleton, UiTopBar } from '../../components/ui'
import LiveBreakCard, { type LiveBreak } from '../../components/live/LiveBreakCard.vue'
import LiveMediaStrip from '../../components/live/LiveMediaStrip.vue'
import LiveKickoffCard from '../../components/live/LiveKickoffCard.vue'

const REACTIONS = ['👏', '🔥', '😮', '😂', '💪']
const STATUS: Record<string, string> = { SCHEDULED: '곧 시작해요', RESULT_PENDING: '경기 끝 · 결과 확인 중', COMPLETED: '끝난 경기', CANCELED: '취소된 경기' }
const ANON_KEY = 'live.anonymous'
const route = useRoute()
const { showToast } = useToast()
const gameId = Number(route.params.gameId)
const live = ref<components['schemas']['LiveGame'] | null>(null)
const error = ref('')
const cheering = ref(-1)
const toggling = ref(false)
const lastBreak = ref<LiveBreak | null>(null)
const thanksFrom = ref('')
const anon = ref(readAnon())
const canAct = computed(() => live.value?.status === 'IN_PROGRESS' || live.value?.status === 'SCHEDULED')

function readAnon() {
  try { return localStorage.getItem(ANON_KEY) === 'true' } catch { return false }
}

async function load() {
  try {
    live.value = (await GET('/api/games/{gameId}/live', { path: { gameId } })).data
    error.value = ''
  } catch (e) {
    // 보던 중에 선수가 구경을 끄면 판도 반응 칸도 내린다
    live.value = null
    error.value = (e as { response?: { data?: { message?: string } } }).response?.data?.message || '볼 수 없는 경기예요'
  }
}

async function cheer(side: number) {
  cheering.value = side
  try {
    live.value = (await POST('/api/games/{gameId}/live/cheer', { path: { gameId }, body: { side } })).data
  } catch (e) {
    showToast((e as { response?: { data?: { message?: string } } }).response?.data?.message || '응원하지 못했어요')
  } finally {
    cheering.value = -1
  }
}

// 반응·응원 글: 서버가 보는 사람 모두에게 흘려보낸다 (내 것도 그 신호로 뜬다)
const floating = ref<{ id: number; emoji: string; x: number; text?: boolean }[]>([])
let seq = 0
let lastSent = 0
let lastShout = 0
function fly(emoji: string, text = false) {
  const f = { id: ++seq, emoji, x: 10 + Math.random() * (text ? 50 : 80), text }
  floating.value.push(f)
  setTimeout(() => { floating.value = floating.value.filter((x) => x.id !== f.id) }, 1800)
}
function react(emoji: string) {
  const now = Date.now()
  if (now - lastSent < 1000) return
  lastSent = now
  POST('/api/games/{gameId}/live/react', { path: { gameId }, body: { emoji } }).catch(() => {})
}
function shout(index: number) {
  const now = Date.now()
  if (now - lastShout < 3000) return showToast('조금 있다 다시 보내요')
  lastShout = now
  POST('/api/games/{gameId}/live/shout', { path: { gameId }, body: { index } }).catch(() => {})
}

async function share() {
  const msg = await shareLink(`${window.location.origin}/live/${gameId}`, `${live.value?.title || '경기'} 하는 중! 실시간으로 보고 응원해 주세요`)
  if (msg) showToast(msg)
}

async function toggleWatch() {
  if (!live.value) return
  toggling.value = true
  try {
    live.value = (await POST('/api/games/{gameId}/live/watch-off', { path: { gameId }, body: { off: !live.value.watchOff } })).data
  } catch (e) {
    // 실패해도 말이 없어 끈 줄 알았다 (사생활)
    showToast((e as { response?: { data?: { message?: string } } })?.response?.data?.message || '바꾸지 못했어요. 다시 해 주세요')
  } finally {
    toggling.value = false
  }
}

type LiveEvent = { type: string; emoji?: string; text?: string; nickname?: string } & Partial<LiveBreak>
let off: (() => void) | undefined
function subscribe() {
  off?.()
  off = subscribeTopic(`/topic/game-live/${gameId}`, (e: LiveEvent) => {
    if (e.type === 'REACT' && e.emoji) fly(e.emoji)
    else if (e.type === 'SHOUT' && e.text) fly(e.text, true)
    else if (e.type === 'BREAK') lastBreak.value = e as LiveBreak
    else if (e.type === 'THANKS' && e.nickname) thanksFrom.value = e.nickname
    else load()
  }, anon.value ? { anon: 'true' } : {})
}
function resubscribe() {
  try { localStorage.setItem(ANON_KEY, String(anon.value)) } catch { /* 이번만 따른다 */ }
  subscribe()
}

const onVisible = () => document.visibilityState === 'visible' && load()
onMounted(() => {
  load()
  subscribe()
  document.addEventListener('visibilitychange', onVisible)
})
onBeforeUnmount(() => {
  off?.()
  document.removeEventListener('visibilitychange', onVisible)
})
</script>

<style scoped>
.float-emoji {
  position: fixed;
  bottom: 9rem;
  font-size: 2rem;
  pointer-events: none;
  animation: float-up 1.8s ease-out forwards;
}
.float-text {
  font-size: 0.95rem;
  font-weight: 700;
  white-space: nowrap;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
}
@keyframes float-up {
  from { transform: translateY(0) scale(0.8); opacity: 1; }
  to { transform: translateY(-50vh) scale(1.2); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) { .float-emoji { animation: none; opacity: 0; } }
</style>
