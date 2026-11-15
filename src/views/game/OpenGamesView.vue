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
        <!-- 신청·신청자·더보기는 경기 화면에서: 여기는 고르는 곳이다 -->
        <OpenGameCard
          v-for="game in shown"
          :key="game.id"
          :game="game"
          :is-mine="game.ownerId === myId"
          @rule="open(game)"
          @profile="router.push('/profile/' + game.ownerId)"
          @apply="open(game)"
          @pair="open(game)"
          @cancel="open(game)"
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { GET } from '@/api/client'
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
const sort = ref<(typeof SORTS)[number]['key']>('near')
const kind = ref('')
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

async function load() {
  loadFailed.value = false
  try {
    games.value = (await GET('/api/games/list', { query: { sort: 'latest', scope: 'all' } })).data
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
