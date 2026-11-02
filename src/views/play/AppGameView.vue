<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar :title="game?.title || '게임'" back />

    <main class="max-w-xl mx-auto px-4 pt-4 pb-16">
      <!-- 플레이 중: 게임마다 다른 판 -->
      <template v-if="play">
        <TypingPlay
          v-if="key === 'typing'"
          :problem="play.problem"
          :time-limit-seconds="secondsLeft(play)"
          :submitting="submitting"
          @submit="submit"
        />
        <p v-if="submitError" class="t-caption text-danger mt-3">{{ submitError }}</p>
      </template>

      <!-- 방금 끝낸 판 -->
      <template v-else-if="result">
        <UiCard class="text-center py-8">
          <template v-if="result.status === 'COMPLETED'">
            <BrandFace v-if="result.result === 'WIN'" mood="wow" :size="64" class="mx-auto mb-3" />
            <p class="t-display">{{ VERDICT[result.result || 'DRAW'] }}</p>
            <p class="t-caption mt-2">{{ result.opponent?.nickname }}님과 대결</p>
            <div class="flex items-center justify-center gap-6 mt-6">
              <span>
                <UiRollNumber class="t-title tabular-nums" :value="result.myScore ?? 0" />
                <span class="block t-micro">나</span>
              </span>
              <span class="t-caption">:</span>
              <span>
                <span class="block t-title tabular-nums text-fg-muted">{{ result.opponentScore ?? 0 }}</span>
                <span class="block t-micro">상대</span>
              </span>
            </div>
            <p v-if="result.ratingChange != null" class="t-mono mt-4">
              레이팅 {{ result.ratingAfter }} ({{ result.ratingChange >= 0 ? '+' : '' }}{{ result.ratingChange }})
            </p>
          </template>
          <template v-else>
            <UiRollNumber class="t-display tabular-nums" :value="result.myScore ?? 0" />
            <p class="t-caption">{{ game?.scoreUnit }}</p>
            <p class="t-heading mt-6">상대를 찾고 있어요</p>
            <p class="t-caption mt-1">같은 문장을 다른 사람이 치면 승패가 나요. 결과가 나오면 알려 드릴게요</p>
          </template>
        </UiCard>
        <UiButton block size="lg" class="mt-4" :loading="starting" @click="start">한 판 더</UiButton>
        <UiButton block variant="ghost" class="mt-2" @click="closeResult">돌아가기</UiButton>
      </template>

      <!-- 게임 첫 화면 -->
      <template v-else>
        <div v-if="!game" class="space-y-3">
          <UiSkeleton class="h-28 w-full" />
          <UiSkeleton class="h-14 w-full" />
        </div>
        <template v-else>
          <UiCard>
            <p class="t-caption">{{ game.summary }}</p>
            <div class="grid grid-cols-3 gap-2 mt-4 text-center">
              <span>
                <span class="block t-title tabular-nums">{{ game.myRating }}</span>
                <span class="block t-micro">레이팅</span>
              </span>
              <span>
                <span class="block t-title tabular-nums">{{ game.myWins }}<span class="t-caption">승</span> {{ game.myLosses }}<span class="t-caption">패</span></span>
                <span class="block t-micro">전적</span>
              </span>
              <span>
                <span class="block t-title tabular-nums">{{ game.myBest ?? '-' }}</span>
                <span class="block t-micro">최고 기록</span>
              </span>
            </div>
          </UiCard>
          <UiButton block size="lg" class="mt-4" :loading="starting" @click="start">대결 시작</UiButton>
          <p class="t-caption text-center mt-2">기다리는 사람이 있으면 바로 붙고, 없으면 다음 사람을 기다려요</p>
          <p v-if="startError" class="t-caption text-danger text-center mt-2">{{ startError }}</p>

          <UiSection title="내 대결" class="mt-8">
            <UiList v-if="duels.length">
              <UiListItem
                v-for="d in duels"
                :key="d.gameId"
                :title="duelTitle(d)"
                :subtitle="duelSubtitle(d)"
                @click="result = d"
              >
                <template #trailing>
                  <UiBadge :tone="d.result === 'WIN' ? 'primary' : 'neutral'">{{ duelBadge(d) }}</UiBadge>
                </template>
              </UiListItem>
            </UiList>
            <UiEmptyState v-else icon="fas fa-trophy" title="아직 대결이 없어요" description="첫 판을 해 보세요" />
          </UiSection>

          <UiSection v-if="game.recordable" title="기록 순위" class="mt-8">
            <UiTabs v-model="period" :options="PERIODS" class="mb-3" />
            <UiList v-if="board?.entries.length">
              <UiListItem
                v-for="e in board.entries"
                :key="e.player.userId"
                :title="e.player.userId === board.mine?.player.userId ? `${e.player.nickname} (나)` : e.player.nickname"
                @click="router.push('/profile/' + e.player.userId)"
              >
                <template #leading>
                  <span class="w-6 t-mono text-center">{{ e.rank }}</span>
                  <UiAvatar :src="e.player.profilePicture" :name="e.player.nickname" size="sm" />
                </template>
                <template #trailing><span class="t-mono">{{ e.score }}{{ game.scoreUnit }}</span></template>
              </UiListItem>
            </UiList>
            <UiEmptyState v-else icon="fas fa-ranking-star" title="아직 기록이 없어요" description="첫 기록의 주인공이 되어 보세요" />
            <p v-if="board?.mine && !board.entries.some((e) => e.player.userId === board?.mine?.player.userId)" class="t-caption mt-3">
              내 순위 {{ board.mine.rank }}위 · {{ board.mine.score }}{{ game.scoreUnit }}
            </p>
          </UiSection>
        </template>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
// 앱 게임 한 개 (/play/:key): 대결 시작 → 플레이 → 결과. 아래에 내 대결과 기록 순위
// 대결 결과 알림을 누르면 ?duel={id}로 들어와 그 결과를 바로 보여준다
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { GET, POST } from '@/api/client'
import type { components } from '@/api/schema'
import { refreshOnChange } from '@/websocket/userChannel'
import BrandFace from '../../components/BrandFace.vue'
import TypingPlay from '../../components/appgame/TypingPlay.vue'
import {
  UiAvatar, UiBadge, UiButton, UiCard, UiEmptyState, UiList, UiListItem, UiRollNumber, UiSection, UiSkeleton, UiTabs, UiTopBar,
} from '../../components/ui'

type Schemas = components['schemas']
type Duel = Schemas['AppDuelResponse']
type Play = Schemas['AppPlayResponse']

const VERDICT = { WIN: '이겼어요', LOSE: '졌어요', DRAW: '비겼어요' } as const
const PERIODS = [
  { value: 'WEEK', label: '이번 주' },
  { value: 'ALL', label: '전체' },
]

const route = useRoute()
const router = useRouter()
const key = computed(() => String(route.params.key))
const game = ref<Schemas['AppGameSummary'] | null>(null)
const duels = ref<Duel[]>([])
const board = ref<Schemas['AppRecordBoard'] | null>(null)
const period = ref<'WEEK' | 'ALL'>('WEEK')
const play = ref<Play | null>(null)
const result = ref<Duel | null>(null)
const starting = ref(false)
const submitting = ref(false)
const startError = ref('')
const submitError = ref('')

async function load() {
  const [games, mine] = await Promise.all([
    GET('/api/app-games'),
    GET('/api/app-games/{key}/duels', { path: { key: key.value } }),
  ])
  game.value = games.data.find((g) => g.key === key.value) ?? null
  duels.value = mine.data
  // 결과 화면을 보고 있는 대결이 끝났으면 바로 바꿔 보여준다
  if (result.value) result.value = duels.value.find((d) => d.gameId === result.value?.gameId) ?? result.value
  if (game.value?.recordable) await loadBoard()
}

async function loadBoard() {
  board.value = (await GET('/api/app-games/{key}/records', { path: { key: key.value }, query: { period: period.value } })).data
}

function errorMessage(e: unknown, fallback: string) {
  return (e as { response?: { data?: { message?: string } } }).response?.data?.message || fallback
}

async function start() {
  starting.value = true
  startError.value = ''
  try {
    play.value = (await POST('/api/app-games/{key}/plays', { path: { key: key.value } })).data
    result.value = null
    submitError.value = ''
  } catch (e) {
    startError.value = errorMessage(e, '시작하지 못했어요. 잠시 뒤 다시 해 주세요')
  } finally {
    starting.value = false
  }
}

async function submit(answer: string) {
  if (!play.value) return
  submitting.value = true
  try {
    result.value = (await POST('/api/app-games/plays/{playId}/submit', { path: { playId: play.value.playId }, body: { answer } })).data
    play.value = null
    load()
  } catch (e) {
    submitError.value = errorMessage(e, '내지 못했어요')
    play.value = null
    load()
  } finally {
    submitting.value = false
  }
}

/** 이어서 하는 판은 서버의 마감까지 남은 만큼만 */
function secondsLeft(p: Play) {
  const left = Math.floor((new Date(p.deadlineAt).getTime() - Date.now()) / 1000)
  return Math.max(1, Math.min(p.timeLimitSeconds, left))
}

function closeResult() {
  result.value = null
  if (route.query.duel) router.replace({ query: {} })
}

function duelTitle(d: Duel) {
  return d.opponent ? `${d.opponent.nickname}님과` : '상대를 찾는 중'
}
function duelSubtitle(d: Duel) {
  const unit = game.value?.scoreUnit ?? ''
  if (d.status === 'COMPLETED') return `${d.myScore ?? 0} : ${d.opponentScore ?? 0}${unit}`
  if (d.status === 'CANCELED') return '시간 안에 내지 않아 취소됐어요'
  return d.myScore != null ? `내 기록 ${d.myScore}${unit}` : '아직 내지 않았어요'
}
function duelBadge(d: Duel) {
  if (d.status === 'COMPLETED') return VERDICT[d.result || 'DRAW']
  if (d.status === 'CANCELED') return '취소'
  return '기다리는 중'
}

watch(period, loadBoard)

let stop: (() => void) | undefined
onMounted(async () => {
  await load()
  const duelId = Number(route.query.duel)
  if (duelId) {
    result.value = duels.value.find((d) => d.gameId === duelId)
      ?? (await GET('/api/app-games/duels/{gameId}', { path: { gameId: duelId } })).data
  }
  // 상대가 플레이해서 결과가 나오면 서버가 신호를 보낸다
  stop = refreshOnChange(() => {
    if (!play.value) load()
  })
})
onBeforeUnmount(() => stop?.())
</script>
