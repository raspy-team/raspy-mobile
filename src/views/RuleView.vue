<template>
  <!-- Floating + button at bottom right -->
  <button
    class="fixed bottom-8 right-8 z-[99] bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-xl w-14 h-14 flex items-center justify-center text-3xl font-bold transition"
    aria-label="추가"
    @click="onPlusClick"
  >
    <span>+</span>
  </button>
  <!-- 헤더 -->
  <HeaderComp :has-referer="true" :title="headerTitle" class="z-[5000]" />
  <!-- 항상 상단에 검색/필터 -->
  <nav
    class="bg-white border-b border-gray-100 px-4 pb-3 flex items-center mt-14 pt-5 gap-3 raspy-top sticky top-0 z-50"
  >
    <input
      v-model="search"
      type="search"
      placeholder="검색어"
      class="filter-input border border-gray-300 rounded-lg px-4 py-2 w-40 focus:border-orange-400 transition"
      aria-label="검색"
      @keyup.enter="onSubmitSearch"
      autocomplete="off"
      style="margin-right: 12px"
    />
    <div class="relative flex items-center gap-2">
      <button
        @click="toggleSort"
        class="filter-sort flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-orange-50 text-gray-700"
        :aria-expanded="showSortOptions"
      >
        <i class="fas fa-sort text-orange-400 mr-1"></i>
        <span>{{ selectedSortLabel }}</span>
      </button>
      <ul
        v-if="showSortOptions"
        class="sort-menu absolute left-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 py-2 px-1 min-w-[120px]"
      >
        <li
          v-for="o in sortOptions"
          :key="o.value"
          @click="selectSort(o.value)"
          class="sort-option px-4 py-2 cursor-pointer rounded-lg font-semibold text-gray-700 hover:bg-orange-100 transition"
          :aria-selected="sort === o.value"
          :style="sort === o.value ? 'color:#fb923c;background:#fff7ed;' : ''"
        >
          <i class="fas fa-check mr-2" v-if="sort === o.value"></i>
          {{ o.label }}
        </li>
      </ul>
      <button
        @click="onMyRulesClick"
        class="ml-2 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold shadow transition"
      >
        내 규칙
      </button>
    </div>
  </nav>

  <!-- Step 1: Major Category Fullscreen -->
  <div v-if="!major" class="fixed inset-0 bg-white z-40 flex flex-col items-center justify-center">
    <div class="text-lg font-bold mb-6">메인 카테고리를 선택하세요.</div>
    <div class="flex flex-col gap-4 w-full px-6">
      <div
        v-for="m in majors"
        :key="m"
        @click="selectMajor(m)"
        class="flex flex-row items-center cursor-pointer px-4 py-4 hover:bg-orange-50 rounded-xl transition justify-center"
        :class="major === m ? 'border-4 border-orange-400' : ''"
        style="min-width: 90px"
      >
        <img :src="`/category-picture/${m}.png`" alt="카테고리 아이콘" class="w-14 h-14 mr-4" />
        <span class="text-base font-semibold text-gray-700">{{ m }}</span>
      </div>
    </div>
  </div>

  <!-- Step 2: Minor Category Fullscreen -->
  <div
    v-else-if="!minor"
    class="fixed inset-0 bg-white z-40 flex flex-col items-center justify-center"
  >
    <button
      @click="major = ''"
      class="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-white/90 hover:bg-orange-100 text-gray-700 border border-gray-200 rounded-full px-6 py-3 shadow font-bold text-lg flex items-center gap-2"
    >
      <i class="fas fa-arrow-left"></i>
      <span>뒤로</span>
    </button>
    <div class="text-lg font-bold mb-6">서브 카테고리를 선택하세요.</div>
    <div class="flex flex-col gap-4 w-full px-6 overflow-y-auto" style="max-height: 60vh">
      <div
        v-for="n in minors"
        :key="n"
        @click="selectMinor(n)"
        class="flex flex-row items-center cursor-pointer px-4 py-4 hover:bg-orange-50 rounded-xl transition justify-center"
        :class="minor === n ? 'border-4 border-orange-400' : ''"
        style="min-width: 90px"
      >
        <img :src="`/category-picture/${n}.png`" alt="서브카테고리 아이콘" class="w-14 h-14 mr-4" />
        <span class="text-base font-semibold text-gray-700">{{ n }}</span>
      </div>
    </div>
  </div>

  <!-- Step 3: Rule List (below search/filter bar) -->
  <div v-else class="max-w-2xl mx-auto px-5 pt-6 flex flex-col gap-0">
    <button
      @click="minor = ''"
      class="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-white/90 hover:bg-orange-100 text-gray-700 border border-gray-200 rounded-full px-6 py-3 shadow font-bold text-lg flex items-center gap-2"
    >
      <i class="fas fa-arrow-left"></i>
      <span>뒤로</span>
    </button>
    <div v-if="loading" class="py-32 text-center text-orange-500">
      <i class="fas fa-spinner fa-spin text-3xl"></i>
      <div class="mt-4 text-base">로딩 중입니다…</div>
    </div>
    <template v-else-if="rules.length">
      <RuleCard
        v-for="rule in rules"
        :key="rule.id"
        :rule="rule"
        :search="search"
        :copiedId="copiedId"
        :expanded="expanded"
        :menuOpen="menuOpen"
        @toggleExpand="toggleExpand"
        @copyDescription="copyDescription"
        @openMenu="openMenu"
      />
    </template>
    <div v-else class="py-32 text-center text-gray-400">조건에 맞는 규칙이 없습니다 😥</div>
    <div class="h-10"><br /></div>
    <!-- Toaster -->
    <transition name="fade">
      <div
        v-if="toastMsg"
        class="fixed left-1/2 bottom-10 z-[120] -translate-x-1/2 bg-orange-500 text-white px-6 py-2 rounded-xl shadow-lg font-semibold"
        aria-live="polite"
      >
        {{ toastMsg }}
      </div>
    </transition>
  </div>

  <!-- 맨 위로 버튼 -->
  <button
    v-if="showScrollTop"
    @click="scrollToTop"
    class="fixed z-[99] bottom-20 right-6 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-xl w-12 h-12 flex items-center justify-center transition"
    aria-label="맨 위로"
    style="box-shadow: 0 6px 18px 0 rgba(255, 115, 0, 0.12)"
  >
    <i class="fas fa-arrow-up text-xl"></i>
  </button>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '../api/api'
import HeaderComp from '../components/HeaderComp.vue'
import RuleCard from '../components/RuleCard.vue'

const router = useRouter()
const route = useRoute()

// 헤더 타이틀: fromGameCreate 파라미터가 있으면 "새로운 경기 생성"
const headerTitle = computed(() => {
  return route.query.fromGameCreate === 'true' ? '새로운 경기 생성' : '규칙 탐색'
})

// const showHeader = ref(true)
const showScrollTop = ref(false)
const majors = ref([])
const minors = ref([])
const rules = ref([])
const loading = ref(false)
const showSortOptions = ref(false)
const major = ref('')
const minor = ref('')
const search = ref('')
const sort = ref('popular')
const sortOptions = [
  { label: '최신순', value: 'recent' },
  { label: '인기순', value: 'popular' },
]
const copiedId = ref(null)
const expanded = ref([])
const toastMsg = ref('')

const selectedSortLabel = computed(
  () => sortOptions.find((o) => o.value === sort.value)?.label || '정렬',
)

const handleScroll = () => {
  showScrollTop.value = window.scrollY > 120
}
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  fetchMajors()
  onSubmitSearch()
})
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

const fetchMajors = async () => {
  const res = await api.get('/api/rules/categories')
  majors.value = res.data.majors
}
async function fetchMinors() {
  if (!major.value) {
    minors.value = []
    minor.value = ''
    return
  }
  const res = await api.get(`/api/rules/categories/${major.value}`)
  minors.value = res.data
}

function selectMajor(m) {
  major.value = m
  minor.value = ''
  fetchMinors()
}

function selectMinor(n) {
  minor.value = n
  onSubmitSearch()
}
const onSubmitSearch = async () => {
  loading.value = true
  try {
    const params = { sort: sort.value }
    if (major.value) params.major = major.value
    if (minor.value) params.minor = minor.value
    if (search.value) params.search = search.value
    const res = await api.get('/api/rules/list', { params })
    rules.value = res.data
  } finally {
    loading.value = false
  }
}
const toggleSort = () => {
  showSortOptions.value = !showSortOptions.value
}
const selectSort = (v) => {
  sort.value = v
  showSortOptions.value = false
  onSubmitSearch()
}
const showToast = (msg) => {
  toastMsg.value = msg
  setTimeout(() => {
    toastMsg.value = ''
  }, 1200)
}
const copyDescription = async (rule) => {
  try {
    await navigator.clipboard.writeText(rule.ruleDescription)
    copiedId.value = rule.id
    showToast('복사되었습니다!')
  } catch {
    showToast('복사 실패')
  }
}
const toggleExpand = (id) => {
  if (expanded.value.includes(id)) {
    expanded.value = expanded.value.filter((e) => e !== id)
  } else {
    expanded.value.push(id)
  }
}

const onPlusClick = () => {
  router.push('/rules/create')
}
</script>
