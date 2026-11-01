<template>
  <div class="min-h-dvh bg-canvas">
    <!-- 경기 만들기에서 왔으면 지금 무엇을 하는 중인지 제목으로 말한다 -->
    <UiTopBar :title="picking ? '어떤 규칙으로 할까요?' : '규칙'" back="/">
      <template #right>
        <UiButton v-if="!picking" variant="ghost" size="sm" to="/rules/my-rules">내 규칙</UiButton>
        <UiIconButton icon="fas fa-plus" label="규칙 만들기" @click="router.push('/rules/create')" />
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

      <!-- 종류: 아이콘 탭 (가로로 넘긴다) -->
      <div class="max-w-2xl mx-auto flex gap-6 px-4 mt-1 overflow-x-auto no-scrollbar" role="tablist" aria-label="종류">
        <button
          v-for="m in ['', ...majors]"
          :key="m || 'all'"
          type="button"
          role="tab"
          :aria-selected="major === m"
          class="flex flex-col items-center gap-1 pt-3 pb-2.5 border-b-2 flex-shrink-0 transition-colors"
          :class="major === m ? 'border-fg text-fg' : 'border-transparent text-fg-subtle'"
          @click="pickMajor(m)"
        >
          <CategoryIcon v-if="m" :name="m" />
          <UiIcon v-else name="border-all" class="text-2xl" />
          <span class="text-xs font-medium whitespace-nowrap">{{ m || '전체' }}</span>
        </button>
      </div>
    </div>

    <main class="max-w-2xl mx-auto px-4 pb-16">
      <!-- 세부 종목 -->
      <div v-if="major && minors.length" class="flex gap-2 pt-4 overflow-x-auto no-scrollbar -mx-4 px-4">
        <UiChip class="flex-shrink-0 whitespace-nowrap" :selected="!minor" @click="pickMinor('')">전체</UiChip>
        <UiChip v-for="n in minors" :key="n" class="flex-shrink-0 whitespace-nowrap" :selected="minor === n" @click="pickMinor(n)">{{ n }}</UiChip>
      </div>

      <!-- 개수 + 정렬 -->
      <div class="flex items-center justify-between pt-4">
        <p class="t-caption">{{ loading ? '찾는 중…' : `규칙 ${rules.length}개` }}</p>
        <div class="flex -mr-2" role="radiogroup" aria-label="정렬">
          <button
            v-for="o in SORTS"
            :key="o.value"
            type="button"
            role="radio"
            :aria-checked="sort === o.value"
            class="px-2 h-9 text-sm"
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

      <UiEmptyState
        v-else-if="!rules.length"
        class="pt-16"
        icon="fas fa-magnifying-glass"
        title="맞는 규칙이 없어요"
        :description="q || major ? '검색어나 종류를 바꿔보거나, 직접 만들어보세요' : '첫 규칙을 만들어보세요'"
      >
        <div class="flex gap-2">
          <UiButton v-if="q || major" variant="secondary" @click="clearFilters">조건 지우기</UiButton>
          <UiButton to="/rules/create">규칙 만들기</UiButton>
        </div>
      </UiEmptyState>

      <div v-else class="divide-y divide-line ui-appear transition-opacity" :class="{ 'opacity-60': loading }">
        <RuleListCard v-for="rule in rules" :key="rule.id" :rule="rule" />
      </div>
    </main>
  </div>
</template>

<script setup>
// 규칙 둘러보기: 검색 + 종류 탭 + 목록. 고른 조건은 주소(?major=&minor=&q=&sort=)에 남겨
// 상세에서 돌아와도, 링크로 공유해도 같은 목록이 나온다
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../api/api'
import RuleListCard from '../components/rule/RuleListCard.vue'
import CategoryIcon from '../components/rule/CategoryIcon.vue'
import { UiButton, UiChip, UiEmptyState, UiIconButton, UiSkeleton, UiTopBar } from '../components/ui'

const SORTS = [
  { value: 'popular', label: '인기순' },
  { value: 'recent', label: '최신순' },
]

const route = useRoute()
const router = useRouter()
const picking = computed(() => !!route.query.fromGameCreate)

const majors = ref([])
const minors = ref([])
const rules = ref([])
const loading = ref(true)

const major = computed(() => route.query.major || '')
const minor = computed(() => route.query.minor || '')
const sort = computed(() => route.query.sort || 'popular')
const q = ref(route.query.q || '')

function setQuery(patch) {
  const next = { ...route.query, ...patch }
  Object.keys(next).forEach((k) => !next[k] && delete next[k])
  router.replace({ query: next })
}
function pickMajor(m) {
  setQuery({ major: m, minor: '' })
}
function pickMinor(n) {
  setQuery({ minor: n })
}
function clearFilters() {
  q.value = ''
  setQuery({ major: '', minor: '', q: '' })
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
  try {
    const params = { sort: sort.value }
    if (major.value) params.major = major.value
    if (minor.value) params.minor = minor.value
    if (route.query.q) params.search = route.query.q
    const { data } = await api.get('/api/rules/list', { params })
    if (mine === seq) rules.value = data
  } catch {
    if (mine === seq) rules.value = []
  } finally {
    if (mine === seq) loading.value = false
  }
}

watch(major, async (m) => {
  minors.value = m ? (await api.get(`/api/rules/categories/${m}`).catch(() => ({ data: [] }))).data : []
}, { immediate: true })
watch(() => [major.value, minor.value, sort.value, route.query.q], load)

onMounted(async () => {
  load()
  majors.value = (await api.get('/api/rules/categories').catch(() => ({ data: {} }))).data.majors || []
})
</script>
