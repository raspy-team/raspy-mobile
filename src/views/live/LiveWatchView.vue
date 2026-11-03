<template>
  <div class="min-h-dvh bg-canvas overflow-hidden">
    <UiTopBar :title="live?.title || '경기 중계'" back />
    <main class="max-w-xl mx-auto px-4 pt-4 pb-40 relative">
      <UiSkeleton v-if="!live && !error" class="h-48 w-full" />
      <UiEmptyState v-else-if="error" class="pt-16" icon="fas fa-eye-slash" :title="error" />
      <template v-else-if="live">
        <p class="t-caption text-center">
          <span v-if="live.status === 'IN_PROGRESS'" class="inline-flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-danger animate-pulse"></span>LIVE · {{ live.setIndex ? `${live.setIndex}세트` : '곧 시작' }}</span>
          <span v-else>{{ STATUS[live.status] || '끝난 경기' }}</span>
        </p>

        <!-- 점수판: 편마다 이름·세트·지금 점수 -->
        <div class="grid gap-3 mt-4" :style="{ gridTemplateColumns: `repeat(${live.sides.length}, minmax(0, 1fr))` }">
          <UiCard v-for="s in live.sides" :key="s.side" class="text-center py-5" :class="{ 'ring-2 ring-signal': live.myCheer === s.side }">
            <div class="flex justify-center -space-x-2">
              <UiAvatar v-for="p in s.players" :key="p.userId" :src="p.profilePicture || undefined" :name="p.nickname" :user-id="p.userId" size="sm" />
            </div>
            <p class="t-label mt-2 truncate">{{ s.players.map((p) => p.nickname).join(' · ') }}</p>
            <UiRollNumber class="t-display tabular-nums mt-2 block" :value="s.score" />
            <p class="t-micro tabular-nums">세트 {{ s.setsWon }}</p>
            <UiButton
              v-if="!live.isPlayer && canAct"
              size="sm"
              class="mt-3"
              :variant="live.myCheer === s.side ? 'primary' : 'secondary'"
              :loading="cheering === s.side"
              @click="cheer(s.side)"
            >{{ live.myCheer === s.side ? '응원 중' : '응원' }} {{ s.cheers }}</UiButton>
            <p v-else class="t-micro mt-3 tabular-nums">응원 {{ s.cheers }}</p>
          </UiCard>
        </div>

        <!-- 선수: 구경 링크 보내기, 구경 끄기 -->
        <template v-if="live.isPlayer">
          <UiButton block variant="secondary" icon="share" class="mt-5" @click="share">구경 링크 보내기</UiButton>
          <UiButton block variant="ghost" class="mt-2" :loading="toggling" @click="toggleWatch">{{ live.watchOff ? '구경 다시 켜기' : '구경 끄기 (선수만 봐요)' }}</UiButton>
          <p v-if="live.watchOff" class="t-caption text-center mt-1">지금은 선수 말고는 이 경기를 볼 수 없어요</p>
        </template>
      </template>

      <!-- 날아오르는 반응 (저장하지 않고 지나간다) -->
      <span v-for="f in floating" :key="f.id" class="float-emoji" :style="{ left: `${f.x}%` }" aria-hidden="true">{{ f.emoji }}</span>
    </main>

    <!-- 반응 보내기 -->
    <div v-if="live && canAct" class="fixed inset-x-0 bottom-0 bg-canvas/95 border-t border-line px-4 py-3" style="padding-bottom: max(0.75rem, env(safe-area-inset-bottom))">
      <div class="max-w-xl mx-auto flex justify-between">
        <button v-for="e in REACTIONS" :key="e" type="button" class="w-14 h-14 rounded-full bg-surface text-2xl active:scale-90 transition-transform" :aria-label="`${e} 보내기`" @click="react(e)">{{ e }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 경기 중계 (/live/:gameId): 만나서 하는 경기의 점수를 선수가 아닌 사람도 실시간으로 본다. 응원은 한 편에 한 번, 반응은 흘려보낸다
// 점수는 /topic/game-live/{id}의 "바뀜" 신호에만 다시 불러온다 (폴링하지 않는다)
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { GET, POST } from '@/api/client'
import type { components } from '@/api/schema'
import { subscribeTopic } from '@/websocket/userChannel'
import { shareLink } from '@/utils/share'
import { useToast } from '@/composable/useToast'
import { UiAvatar, UiButton, UiCard, UiEmptyState, UiRollNumber, UiSkeleton, UiTopBar } from '../../components/ui'

const REACTIONS = ['👏', '🔥', '😮', '😂', '💪']
const STATUS: Record<string, string> = { SCHEDULED: '곧 시작해요', RESULT_PENDING: '경기 끝 · 결과 확인 중', COMPLETED: '끝난 경기', CANCELED: '취소된 경기' }
const route = useRoute()
const { showToast } = useToast()
const gameId = Number(route.params.gameId)
const live = ref<components['schemas']['LiveGame'] | null>(null)
const error = ref('')
const cheering = ref(-1)
const toggling = ref(false)
const canAct = computed(() => live.value?.status === 'IN_PROGRESS' || live.value?.status === 'SCHEDULED')

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
  } catch {
    showToast('응원하지 못했어요')
  } finally {
    cheering.value = -1
  }
}

// 반응: 내 화면에는 바로 띄우고 서버로 보낸다 (다른 사람에게는 서버가 흘려보낸다)
const floating = ref<{ id: number; emoji: string; x: number }[]>([])
let seq = 0
let lastSent = 0
function fly(emoji: string) {
  const f = { id: ++seq, emoji, x: 10 + Math.random() * 80 }
  floating.value.push(f)
  setTimeout(() => { floating.value = floating.value.filter((x) => x.id !== f.id) }, 1800)
}
function react(emoji: string) {
  const now = Date.now()
  if (now - lastSent < 1000) return
  lastSent = now
  POST('/api/games/{gameId}/live/react', { path: { gameId }, body: { emoji } }).catch(() => {})
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
  } finally {
    toggling.value = false
  }
}

let off: (() => void) | undefined
const onVisible = () => document.visibilityState === 'visible' && load()
onMounted(() => {
  load()
  off = subscribeTopic(`/topic/game-live/${gameId}`, (e: { type: string; emoji?: string }) => {
    if (e.type === 'REACT' && e.emoji) fly(e.emoji)
    else load()
  })
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
  bottom: 6rem;
  font-size: 2rem;
  pointer-events: none;
  animation: float-up 1.8s ease-out forwards;
}
@keyframes float-up {
  from { transform: translateY(0) scale(0.8); opacity: 1; }
  to { transform: translateY(-50vh) scale(1.2); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) { .float-emoji { animation: none; opacity: 0; } }
</style>
