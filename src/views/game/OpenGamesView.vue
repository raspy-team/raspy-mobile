<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar title="모집 중인 경기" back="/" />
    <main class="max-w-xl mx-auto px-4 pt-3 pb-16">
      <UiPullIndicator :pull="pull" :refreshing="refreshing" />
      <!-- 순서 -->
      <div class="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4" role="radiogroup" aria-label="순서">
        <UiChip v-for="s in SORTS" :key="s.key" class="flex-shrink-0 whitespace-nowrap" :selected="sort === s.key" role="radio" :aria-checked="sort === s.key" @click="sort = s.key">{{ s.label }}</UiChip>
      </div>
      <!-- 종목: 지금 모집 중인 경기에 있는 것만 -->
      <div v-if="kinds.length > 1" class="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 mt-2" role="radiogroup" aria-label="종목">
        <UiChip class="flex-shrink-0 whitespace-nowrap" :selected="!kind" role="radio" :aria-checked="!kind" @click="kind = ''">모든 종목</UiChip>
        <UiChip v-for="k in kinds" :key="k" class="flex-shrink-0 whitespace-nowrap" :selected="kind === k" role="radio" :aria-checked="kind === k" @click="kind = k">{{ k }}</UiChip>
      </div>

      <div v-if="loading" class="space-y-3 mt-4" role="status" aria-label="불러오는 중">
        <UiSkeleton v-for="n in 3" :key="n" class="h-36 w-full rounded-xl" />
      </div>
      <UiEmptyState v-else-if="loadFailed" class="pt-12" icon="fas fa-rotate-right" title="경기를 불러오지 못했어요" description="연결이 돌아오면 다시 해 주세요">
        <UiButton variant="secondary" @click="load">다시 시도</UiButton>
      </UiEmptyState>
      <UiEmptyState v-else-if="!shown.length" class="pt-12" mascot="match" :title="games.length ? '이 종목은 모집 중인 경기가 없어요' : '아직 모집 중인 경기가 없어요'">
        <UiButton to="/create-game">경기 만들기</UiButton>
      </UiEmptyState>
      <div v-else class="space-y-3 mt-4 ui-appear">
        <p class="t-caption">{{ shown.length }}개</p>
        <!-- 신청·취소는 여기서 바로 (눌렀는데 경기 화면으로만 넘어가 한 번 더 눌러야 했다). 둘이 신청·신청자·더보기는 경기 화면에서 -->
        <OpenGameCard
          v-for="game in shown"
          :key="game.id"
          :game="game"
          :is-mine="game.ownerId === myId"
          :busy="busyId === game.id"
          @rule="open(game)"
          @profile="router.push('/profile/' + game.ownerId)"
          @apply="(team) => apply(game, team)"
          @pair="open(game)"
          @cancel="cancel(game)"
          @challengers="open(game)"
          @more="open(game)"
        />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
// 모집 중인 경기 모두 보기 (11/15 고병연: 소식에 '모두 보기'가 있듯 경기에도). 동네와 상관없이 전국의 모집 중인 경기를 순서·종목으로 골라 본다.
// 서버는 한 번에 다 준다(scope=all). 순서와 종목은 받은 것 안에서 고른다
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { GET } from '@/api/client'
import api from '@/api/api'
import { feel } from '@/utils/feel'
import { useToast } from '@/composables/useToast'
import type { components } from '@/api/schema'
import { getMyId } from '@/utils/me'
import { usePullToRefresh } from '@/composables/usePullToRefresh'
import { UiButton, UiChip, UiEmptyState, UiPullIndicator, UiSkeleton, UiTopBar } from '../../components/ui'
import OpenGameCard from '../../components/game/OpenGameCard.vue'

type Game = components['schemas']['GameSummaryResponse']
const router = useRouter()
const games = ref<Game[]>([])
const loading = ref(true)
const loadFailed = ref(false)
const myId = ref<number | null>(null)

const SORTS = [
  { key: 'near', label: '가까운 순' },
  { key: 'soon', label: '경기 시간순' },
  { key: 'new', label: '새로 올라온 순' },
] as const
// 고른 순서·종목은 이 화면을 떠났다 와도 그대로다 (경기 하나를 보고 뒤로 오면 '가까운 순·모든 종목'으로 돌아가 다시 골라야 했다)
const kept = (() => { try { return JSON.parse(sessionStorage.getItem('open_games_filter') || '{}') } catch { return {} } })()
const sort = ref<(typeof SORTS)[number]['key']>(SORTS.some((s) => s.key === kept.sort) ? kept.sort : 'near')
const kind = ref<string>(typeof kept.kind === 'string' ? kept.kind : '')
watch([sort, kind], () => { try { sessionStorage.setItem('open_games_filter', JSON.stringify({ sort: sort.value, kind: kind.value })) } catch { /* 못 남기면 다음에 처음부터 */ } })
const kindOf = (g: Game) => g.rule?.ruleTitle || '' // 종목 = 규칙 이름 (러닝·탁구…). 분류(실내·실외)는 고르는 말이 아니다
const kinds = computed(() => [...new Set(games.value.map(kindOf).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ko')))

const time = (v?: string | null) => (v ? new Date(v).getTime() : Number.MAX_SAFE_INTEGER)
const shown = computed(() => {
  const list = games.value.filter((g) => !kind.value || kindOf(g) === kind.value)
  if (sort.value === 'soon') return [...list].sort((a, b) => time(a.matchDate) - time(b.matchDate))
  if (sort.value === 'new') return [...list].sort((a, b) => time(b.createdAt) - time(a.createdAt))
  // 가까운 순: 거리를 모르는 것(동네가 없거나 만나지 않는 경기)은 뒤로
  return [...list].sort((a, b) => (a.distanceM ?? Number.MAX_SAFE_INTEGER) - (b.distanceM ?? Number.MAX_SAFE_INTEGER))
})

const open = (g: Game) => router.push(`/games/${g.id}`)
const busyId = ref<number | null>(null)
const { showToast } = useToast()
async function apply(game: Game, team?: number) {
  busyId.value = game.id
  try {
    await api.post(`/api/games/${game.id}/apply`, null, { params: team === undefined ? {} : { team } })
    game.isAppliedByMe = true
    feel('success')
    showToast('신청했어요. 주최자가 승인하면 알림에 떠요')
  } catch (e) {
    // 동네·본인인증이 필요하면 api.js가 그 화면으로 보낸다 (홈과 같다)
    const err = e as { response?: { status?: number; data?: { message?: string } } }
    const identity = String(err.response?.data?.message || '').includes('휴대폰 본인인증')
    if (err.response?.status !== 428 && !identity) showToast(err.response?.data?.message || '신청하지 못했어요. 잠시 뒤 다시 해 주세요')
  } finally {
    busyId.value = null
  }
}
async function cancel(game: Game) {
  busyId.value = game.id
  try {
    await api.post('/api/games/cancel-request', { gameId: game.id })
    game.isAppliedByMe = false
    showToast('신청을 취소했어요')
  } catch (e) {
    showToast((e as { response?: { data?: { message?: string } } }).response?.data?.message || '취소하지 못했어요. 잠시 뒤 다시 해 주세요')
  } finally {
    busyId.value = null
  }
}

async function load() {
  loadFailed.value = false
  try {
    games.value = (await GET('/api/games/list', { query: { sort: 'latest', scope: 'all' } })).data
    if (kind.value && !kinds.value.includes(kind.value)) kind.value = '' // 기억해 둔 종목의 경기가 이제 없으면 모든 종목으로
  } catch {
    loadFailed.value = true
  } finally {
    loading.value = false
  }
}
const { pull, refreshing } = usePullToRefresh(load)
onMounted(() => {
  load()
  getMyId().then((id) => (myId.value = id)).catch(() => {})
})
</script>
