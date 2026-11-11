<template>
  <div class="min-h-dvh bg-canvas">
    <!-- 경기 만들기에서 왔으면 지금 무엇을 하는 중인지 제목으로 말한다 -->
    <UiTopBar :title="picking ? '어떤 규칙으로 할까요?' : '규칙'" back="/">
      <template #right>
        <UiButton v-if="!picking" variant="ghost" size="sm" to="/rules/my-rules">내 규칙</UiButton>
        <!-- 경기를 만들다 고를 규칙이 없어 만들러 가면, 넘겨 둔 때·장소·방식을 들고 가서 다 만들면 그 경기 만들기로 돌아온다 (목적 판정 6) -->
        <UiIconButton icon="fas fa-plus" label="규칙 만들기" @click="router.push(createTo)" />
      </template>
    </UiTopBar>

    <!-- 검색 + 종류 (스크롤해도 위에 붙어 있다) -->
    <div class="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-header bg-canvas border-b border-line">
      <div class="max-w-2xl mx-auto px-4 pt-3">
        <label class="flex items-center gap-3 h-12 px-4 rounded-full bg-surface border border-line focus-within:border-line-strong">
          <UiIcon name="fas fa-magnifying-glass" class="text-fg-subtle" aria-hidden="true" />
          <input
            v-model="q"
            type="search"
            enterkeyhint="search"
            placeholder="규칙 이름이나 종목으로 찾기"
            aria-label="규칙 찾기"
            class="flex-1 min-w-0 bg-transparent text-base text-fg placeholder:text-fg-subtle outline-none"
          />
          <button v-if="q" type="button" class="-mr-2 w-9 h-9 flex items-center justify-center text-fg-subtle" aria-label="검색어 지우기" @click="q = ''">
            <UiIcon name="fas fa-circle-xmark" aria-hidden="true" />
          </button>
        </label>
      </div>

      <!-- 찾기 상황 네 가지: 누르면 시트에서 고른다 (docs/direction.md '찾기') -->
      <div class="max-w-2xl mx-auto flex gap-2 px-4 pt-3 overflow-x-auto no-scrollbar">
        <UiChip
          v-for="f in SITUATIONS"
          :key="f.key"
          class="flex-shrink-0 whitespace-nowrap"
          :selected="!!route.query[f.key]"
          @click="sheet = f.key"
        >
          {{ labelOf(f.key) || f.question }}
          <UiIcon name="fas fa-chevron-down" class="text-[10px]" aria-hidden="true" />
        </UiChip>
      </div>

      <!-- 잘하려면: 능력 칩 (가로로 넘긴다). 경기에 쓸 규칙을 고르는 중이면 숨긴다: 종목·인원이 이미 정해져 능력으로 찾지 않는다 (목적 판정 6) -->
      <div v-if="options && !picking" class="max-w-2xl mx-auto flex items-center gap-2 px-4 pt-2 pb-3 overflow-x-auto no-scrollbar" role="group" aria-label="잘하려면">
        <span class="t-micro flex-shrink-0">잘하려면</span>
        <UiChip
          v-for="a in options.abilities"
          :key="a.key"
          class="flex-shrink-0 whitespace-nowrap !h-8 !px-3"
          :selected="ability === a.key"
          @click="setQuery({ ability: ability === a.key ? '' : a.key })"
        >
          {{ a.label }}
        </UiChip>
      </div>
    </div>

    <main class="max-w-2xl mx-auto px-4 pb-16">
      <!-- 종류: 모두 · 오프라인 · 앱 게임 · 인기 게임 (경기 열 규칙을 고를 때는 만나서 하는 것과 인기 게임만) -->
      <div class="flex gap-2 pt-4 overflow-x-auto no-scrollbar -mx-4 px-4" role="radiogroup" aria-label="종류">
        <UiChip
          v-for="k in kinds"
          :key="k.value"
          role="radio"
          :aria-checked="kind === k.value"
          class="flex-shrink-0 whitespace-nowrap"
          :selected="kind === k.value"
          @click="setQuery({ kind: k.value === 'ALL' ? '' : k.value })"
        >
          {{ k.label }}
        </UiChip>
      </div>

      <!-- 개수 + 정렬 -->
      <div class="flex items-center justify-between gap-2 pt-4">
        <p class="t-caption flex-shrink-0">{{ loading ? '찾는 중…' : `규칙 ${rules.length}개` }}</p>
        <div class="flex -mr-2" role="radiogroup" aria-label="정렬">
          <button
            v-for="o in SORTS"
            :key="o.value"
            type="button"
            role="radio"
            :aria-checked="sort === o.value"
            class="px-1.5 h-9 text-sm whitespace-nowrap"
            :class="sort === o.value ? 'text-fg font-bold' : 'text-fg-subtle'"
            @click="setQuery({ sort: o.value })"
          >
            {{ o.label }}
          </button>
        </div>
      </div>

      <!-- 목록 -->
      <div v-if="loading && !rules.length" class="divide-y divide-line">
        <div v-for="n in 5" :key="n" class="flex gap-4 py-4">
          <UiSkeleton class="w-16 h-16 rounded-xl" />
          <div class="flex-1 space-y-2 pt-1">
            <UiSkeleton class="h-4 w-1/2" />
            <UiSkeleton class="h-3 w-1/3" />
            <UiSkeleton class="h-3 w-3/4" />
          </div>
        </div>
      </div>

      <!-- 실패를 '맞는 규칙이 없어요'로 보이면 이미 있는 규칙을 또 만들게 된다 (목적 판정 6) -->
      <UiEmptyState v-else-if="loadFailed" class="pt-16" icon="fas fa-wifi" title="규칙을 불러오지 못했어요" description="잠시 뒤 다시 해 주세요">
        <UiButton variant="secondary" @click="load">다시 시도</UiButton>
      </UiEmptyState>

      <UiEmptyState
        v-else-if="!rules.length"
        class="pt-16"
        mascot="match"
        title="맞는 규칙이 없어요"
        :description="filtered ? '검색어나 조건을 바꿔 보거나, 직접 만들어 보세요' : '첫 규칙을 만들어 보세요'"
      >
        <div class="flex gap-2">
          <UiButton v-if="filtered" variant="secondary" @click="clearFilters">조건 지우기</UiButton>
          <UiButton :to="createTo">규칙 만들기</UiButton>
        </div>
      </UiEmptyState>

      <div v-else class="divide-y divide-line ui-appear transition-opacity" :class="{ 'opacity-60': loading }">
        <!-- 경기 만들기에서 고르는 중이면 누르면 바로 돌아간다 (고른 때·방식·인원 그대로) -->
        <RuleListCard v-for="rule in rules" :key="rule.id" :rule="rule" :to="picking ? pickTo(rule) : null" />
      </div>
    </main>

    <!-- 상황 하나 고르기 -->
    <UiSheet :model-value="!!sheet" :title="current?.question" @update:model-value="(v) => !v && (sheet = '')">
      <div v-if="current" class="flex flex-wrap gap-2">
        <UiChip :selected="!route.query[current.key]" @click="pick('')">상관없음</UiChip>
        <UiChip v-for="o in choices(current.key)" :key="o.key" :selected="route.query[current.key] === o.key" @click="pick(o.key)">{{ o.label }}</UiChip>
      </div>
    </UiSheet>
  </div>
</template>

<script setup>
// 규칙 둘러보기: 검색 + 찾기 상황(어디서·몇 명·얼마나·준비물) + 능력 칩 + 목록 (docs/direction.md '카테고리').
// 고른 조건은 주소(?place=&party=&length=&gear=&ability=&q=&sort=&kind=)에 남겨 상세에서 돌아와도, 링크로 공유해도 같은 목록이 나온다
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../api/api'
import { GET } from '@/api/client'
import RuleListCard from '../components/rule/RuleListCard.vue'
import { UiButton, UiChip, UiEmptyState, UiIconButton, UiSheet, UiSkeleton, UiTopBar } from '../components/ui'

// 순위는 별점(평가가 적으면 전체 평균 쪽으로 당김)과 경기 수를 합친 것. 서버 RuleRanking
// 정렬은 둘만: 고를 것을 찾는 사람에게 기준 넷은 많고, '순위순'이 경기 수와 별점을 이미 담는다 (목적 판정 6)
const SORTS = [
  { value: 'rank', label: '순위순' },
  { value: 'recent', label: '최신순' },
]
const KINDS = [
  { value: 'ALL', label: '전체' },
  { value: 'OFFLINE', label: '오프라인' },
  { value: 'APP', label: '앱 게임' },
  // 롤·피파·브롤 같은 게임 안에서 붙는 규칙 (9번)
  { value: 'POPULAR', label: '인기 게임' },
]
// 경기 열 규칙 고르기: 앱 게임은 뺀다
const PICK_KINDS = [
  { value: 'ALL', label: '모두' },
  { value: 'POPULAR', label: '인기 게임' },
]
// 주소 이름 → 질문, category-options의 목록 이름
const SITUATIONS = [
  { key: 'place', question: '어디서?', list: 'places' },
  { key: 'party', question: '몇 명?', list: 'parties' },
  { key: 'length', question: '얼마나?', list: 'lengths' },
  { key: 'gear', question: '준비물?', list: 'gears' },
]
const FILTER_KEYS = [...SITUATIONS.map((f) => f.key), 'ability']

const route = useRoute()
const router = useRouter()
const picking = computed(() => !!route.query.fromGameCreate)
const CARRY = ['when', 'venue', 'format', 'size']
// 규칙 만들기로 갈 때: 고르는 중이면 넘겨받은 값과 '고르는 중' 표시를 그대로
const createTo = computed(() => (picking.value
  ? { path: '/rules/create', query: { fromGameCreate: '1', ...Object.fromEntries(CARRY.filter((k) => route.query[k]).map((k) => [k, String(route.query[k])])) } }
  : '/rules/create'))
const pickTo = (rule) => ({ path: '/create-game', query: { ruleId: String(rule.id), ...Object.fromEntries(CARRY.filter((k) => route.query[k]).map((k) => [k, String(route.query[k])])) } })

const options = ref(null)
const rules = ref([])
const loading = ref(true)
const loadFailed = ref(false)
const sheet = ref('')

const ability = computed(() => route.query.ability || '')
// 예전 주소의 경기순·별점순·popular는 순위순으로 (정렬을 둘로 줄였다)
const sort = computed(() => (route.query.sort === 'recent' ? 'recent' : 'rank'))
const kind = computed(() => route.query.kind || 'ALL')
const kinds = computed(() => (picking.value ? PICK_KINDS : KINDS))
const q = ref(route.query.q || '')
const current = computed(() => SITUATIONS.find((f) => f.key === sheet.value))
const filtered = computed(() => !!route.query.q || FILTER_KEYS.some((k) => route.query[k]))

function choices(key) {
  return options.value?.[SITUATIONS.find((f) => f.key === key).list] ?? []
}
function labelOf(key) {
  const v = route.query[key]
  return v ? choices(key).find((o) => o.key === v)?.label : ''
}
function setQuery(patch) {
  const next = { ...route.query, ...patch }
  Object.keys(next).forEach((k) => !next[k] && delete next[k])
  router.replace({ query: next })
}
function pick(v) {
  setQuery({ [sheet.value]: v })
  sheet.value = ''
}
function clearFilters() {
  q.value = ''
  setQuery(Object.fromEntries([...FILTER_KEYS, 'q'].map((k) => [k, ''])))
}

// 글자를 칠 때마다 부르지 않고 잠깐 멈췄을 때 찾는다
let typing
watch(q, (v) => {
  clearTimeout(typing)
  typing = setTimeout(() => setQuery({ q: v.trim() }), 300)
})

let seq = 0
async function load() {
  const mine = ++seq
  loading.value = true
  loadFailed.value = false
  try {
    // 둘러보기는 앱 게임도 보여 준다. 경기를 열 규칙을 고를 때만 뺀다
    const params = { sort: sort.value, withApp: !picking.value, kind: kind.value }
    FILTER_KEYS.forEach((k) => route.query[k] && (params[k] = route.query[k]))
    if (route.query.q) params.search = route.query.q
    const { data } = await api.get('/api/rules/list', { params })
    if (mine === seq) rules.value = data
  } catch {
    if (mine === seq) {
      rules.value = []
      loadFailed.value = true
    }
  } finally {
    if (mine === seq) loading.value = false
  }
}

watch(() => [...FILTER_KEYS.map((k) => route.query[k]), sort.value, kind.value, route.query.q], load)

onMounted(async () => {
  load()
  options.value = (await GET('/api/rules/category-options').catch(() => ({ data: null }))).data
})
</script>
