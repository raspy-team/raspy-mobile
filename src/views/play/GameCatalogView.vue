<template>
  <div class="min-h-dvh bg-canvas">
    <!-- 검색은 위 막대의 돋보기로 접었다: 처음 온 사람의 첫 칸이 검색이었다. 구조 칩(지금 바로 붙기·편할 때 하기)은 뺐다: 사람은 '구조'로 게임을 고르지 않고,
         칸마다 이미 배지가 있다. 고르는 길이 한 화면에 다섯이었다 (목적 판정 11/11 부분 2) -->
    <UiTopBar title="앱 게임" back>
      <template #right>
        <!-- 게임이 몇 개 안 되면 찾을 일이 없다 (11/13 앱 기능 좁히기로 여섯) -->
        <UiIconButton v-if="games.length > 8" icon="search" label="게임 찾기" @click="toggleSearch" />
        <!-- 광장 입구 (UX ⑤: 홈의 '앱 게임'이 목록으로 바로 오고, 광장은 여기서). '지도' 모양은 다른 화면에서 동네 경기 지도라 사람들 모양으로 (경로 2 리뷰 N7) -->
        <UiIconButton icon="users" label="광장" @click="router.push('/plaza')" />
      </template>
    </UiTopBar>

    <main class="max-w-xl mx-auto px-4 pt-3 pb-16">
      <UiInput v-if="searching" ref="searchInput" v-model="query" icon="search" placeholder="게임 찾기" />

      <div v-if="loading" class="space-y-2 mt-5">
        <UiSkeleton v-for="n in 4" :key="n" class="h-20 w-full" />
      </div>

      <!-- 목록을 못 받으면 '찾는 게임이 없어요'(검색 결과처럼) 대신 다시 불러오기 -->
      <UiEmptyState v-else-if="loadFailed" class="pt-12" icon="fas fa-triangle-exclamation" title="게임 목록을 불러오지 못했어요" description="연결을 확인하고 다시 해 주세요">
        <UiButton variant="secondary" @click="load">다시 시도</UiButton>
      </UiEmptyState>

      <template v-else>
        <!-- 지금 기다리는 사람: 한 번에 붙기 (사람이 적을 때 흩어지지 않게) -->
        <!-- 실시간 게임이 목록에 있을 때만: 목록이 따로 푸는 게임뿐이면 '아무거나 바로 붙기'·오늘 밤의 게임이 목록에 없는 게임으로 데려갔다 (11/14) -->
        <WaitingNow v-if="!query && games.some((g) => g.playMode === 'REALTIME')" class="mt-6" any-button />
        <!-- 최근에 한 게임: 찾지 않고 바로 다시 -->
        <UiSection v-if="recent.length && !query" title="최근에 한 게임" class="mt-6">
          <!-- 이어 하기 줄: 옆으로 밀어 고른다 -->
          <div class="flex gap-3 -mx-4 px-4 overflow-x-auto no-scrollbar">
            <AppGameTile v-for="g in recent" :key="g.key" :game="g" compact :again="g.available && g.playMode !== 'REALTIME' && g.dailyLimit !== 1" />
          </div>
        </UiSection>

        <UiSection :title="query ? `찾은 게임 ${filtered.length}` : shown.length < filtered.length ? '많이 하는 게임' : '모든 게임'" class="mt-6">
          <div v-if="filtered.length" class="grid grid-cols-2 gap-3">
            <AppGameTile v-for="g in shown" :key="g.key" :game="g" />
          </div>
          <!-- 처음엔 많이 하는 8개만 (UX ⑤: 56개가 한 줄로 길었다). 찾거나 고르면 모두 -->
          <UiButton v-if="shown.length < filtered.length" block variant="secondary" class="mt-3" @click="all = true">모두 보기 {{ filtered.length }}</UiButton>
          <!-- 예전엔 '모두 보기'의 v-else라 게임이 다 보일 때마다 '찾는 게임이 없어요'가 붙었다 (11/13 실제 기기 한 바퀴) -->
          <UiEmptyState v-if="!filtered.length" mascot="dol" title="찾는 게임이 없어요" description="다른 말로 찾아보세요" />
        </UiSection>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
// 모든 앱 게임 (/games). 게임이 100개가 되어도: 검색 + 구조(지금 바로 붙기 / 편할 때 하기) + 최근에 한 게임 + 많이 하는 순
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { GET } from '@/api/client'
import type { components } from '@/api/schema'
import AppGameTile from '../../components/appgame/AppGameTile.vue'
import WaitingNow from '../../components/appgame/WaitingNow.vue'
import { UiButton, UiEmptyState, UiIconButton, UiInput, UiSection, UiSkeleton, UiTopBar } from '../../components/ui'

type AppGameSummary = components['schemas']['AppGameSummary']
const router = useRouter()
const games = ref<AppGameSummary[]>([])
const loading = ref(true)
const query = ref('')
const searching = ref(false)
// 지금 홍보하는 게임은 판 수와 상관없이 맨 위 (임기응변이 판 수 순서라 처음엔 안 보였다, 목적 판정 11/11 부분 2)
const PROMO = 'improv'

const recent = computed(() =>
  games.value
    .filter((g) => g.myLastPlayedAt)
    .sort((a, b) => (b.myLastPlayedAt ?? '').localeCompare(a.myLastPlayedAt ?? ''))
    .slice(0, 3),
)
const all = ref(false)
const shown = computed(() => (all.value || query.value.trim() ? filtered.value : filtered.value.slice(0, 8)))
const filtered = computed(() => {
  const q = query.value.trim()
  // 준비 중(할 수 없는) 게임은 목록에 섞지 않는다 (경로 전부 훑기 2절)
  return games.value
    .filter((g) => g.available)
    .filter((g) => !q || g.title.includes(q) || g.summary.includes(q))
    .sort((a, b) => Number(b.available) - Number(a.available) || Number(b.key === PROMO) - Number(a.key === PROMO) || b.playCount - a.playCount)
})

// 돋보기를 누르면 칸에 바로 초점 (칸을 한 번 더 눌러야 키보드가 떴다, 경로 2 리뷰 N6)
const searchInput = ref<{ focus?: () => void } | null>(null)
function toggleSearch() {
  searching.value = !searching.value
  if (searching.value) nextTick(() => searchInput.value?.focus?.())
}

const loadFailed = ref(false)
async function load() {
  loading.value = true
  loadFailed.value = false
  try {
    games.value = (await GET('/api/app-games')).data
  } catch {
    loadFailed.value = true
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>
