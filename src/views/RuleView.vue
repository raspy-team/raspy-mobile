<template>
  <HeaderComp
    :has-referer="true"
    :show-bell="false"
    :show-dm="false"
    custom-class="bg-gray-900 z-[444444]"
    :customGoBack="handleGoBack"
  >
    <template #right-after>
      <button
        @click="onMyRulesClick"
        class="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold shadow transition"
      >
        내 규칙
      </button>
      <button
        @click="onPlusClick"
        class="ml-2 w-10 h-10 px-2 py-2 rounded-lg bg-orange-400 hover:bg-orange-500 text-white font-bold shadow transition flex items-center justify-center"
        aria-label="규칙 생성"
      >
        <span class="text-xl font-bold">+</span>
      </button>
    </template>
  </HeaderComp>

  <!-- 규칙 리스트가 표시될 때만 검색/필터 -->
  <nav
    v-if="major && minor"
    class="bg-gray-900 border-b border-gray-700 px-4 pb-3 flex items-center mt-14 pt-5 gap-3 raspy-top sticky top-0 z-50"
  >
    <input
      v-model="search"
      type="search"
      placeholder="검색어"
      class="filter-input border border-gray-600 rounded-lg px-4 py-2 w-40 focus:border-orange-400 transition"
      aria-label="검색"
      @keyup.enter="onSubmitSearch"
      autocomplete="off"
      style="margin-right: 12px"
    />
    <button
      @click="onSubmitSearch"
      class="ml-1 px-3 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold shadow transition flex items-center justify-center"
      aria-label="검색"
    >
      <i class="fas fa-search"></i>
    </button>
    <div class="relative flex items-center gap-2">
      <button
        @click="toggleSort"
        class="filter-sort flex items-center px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300"
        :aria-expanded="showSortOptions"
      >
        <i class="fas fa-sort text-orange-400 mr-1"></i>
        <span>{{ selectedSortLabel }}</span>
      </button>
      <ul
        v-if="showSortOptions"
        class="sort-menu absolute left-0 mt-2 bg-gray-800 rounded-xl shadow-lg border border-gray-600 py-2 px-1 min-w-[120px]"
      >
        <li
          v-for="o in sortOptions"
          :key="o.value"
          @click="selectSort(o.value)"
          class="sort-option px-4 py-2 cursor-pointer rounded-lg font-semibold text-gray-300 hover:bg-gray-700 transition"
          :aria-selected="sort === o.value"
          :style="sort === o.value ? 'color:#fb923c;background:#fff7ed;' : ''"
        >
          <i class="fas fa-check mr-2" v-if="sort === o.value"></i>
          {{ o.label }}
        </li>
      </ul>
    </div>
  </nav>

  <!-- Step 1: Major Category Fullscreen -->
  <div
    v-if="!major"
    class="fixed inset-0 bg-gray-900 z-40 flex flex-col items-center justify-center"
  >
    <div class="text-lg text-white font-bold mb-6">메인 카테고리를 선택하세요.</div>
    <div v-if="loadingMajors" class="py-32 text-center text-orange-500">
      <i class="fas fa-spinner fa-spin text-3xl"></i>
      <div class="mt-4 text-base">로딩 중입니다…</div>
    </div>
    <div v-else class="flex flex-col gap-4 w-full px-6">
      <div
        v-for="m in majors"
        :key="m"
        @click="selectMajor(m)"
        class="flex flex-row items-center cursor-pointer px-4 py-4 hover:bg-gray-700 rounded-xl transition justify-center"
        :class="major === m ? 'border-4 border-orange-400' : ''"
        style="min-width: 90px"
      >
        <img :src="`/category-picture/${m}.png`" alt="카테고리 아이콘" class="w-14 h-14 mr-4" />
        <span class="text-base font-semibold text-gray-300">{{ m }}</span>
      </div>
    </div>
  </div>

  <!-- Step 2: Minor Category Fullscreen -->
  <div
    v-else-if="!minor"
    class="fixed inset-0 bg-gray-900 z-40 flex flex-col items-center justify-center"
  >
    <button
      @click="major = ''"
      class="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-gray-800/90 hover:bg-gray-700 text-gray-300 border border-gray-600 rounded-full px-6 py-3 shadow font-bold text-lg flex items-center gap-2"
    >
      <i class="fas fa-arrow-left"></i>
      <span>뒤로</span>
    </button>
    <div class="text-lg text-white font-bold mb-6">서브 카테고리를 선택하세요.</div>
    <div v-if="loadingMinors" class="py-32 text-center text-orange-500">
      <i class="fas fa-spinner fa-spin text-3xl"></i>
      <div class="mt-4 text-base">로딩 중입니다…</div>
    </div>
    <div v-else class="flex flex-col gap-4 w-full px-6 overflow-y-auto" style="max-height: 60vh">
      <div
        v-for="n in minors"
        :key="n"
        @click="selectMinor(n)"
        class="flex flex-row items-center cursor-pointer px-4 py-4 hover:bg-gray-700 rounded-xl transition justify-center"
        :class="minor === n ? 'border-4 border-orange-400' : ''"
        style="min-width: 90px"
      >
        <img :src="`/category-picture/${n}.png`" alt="서브카테고리 아이콘" class="w-14 h-14 mr-4" />
        <span class="text-base font-semibold text-gray-300">{{ n }}</span>
      </div>
    </div>
  </div>

  <!-- Step 3: Rule List (below search/filter bar) -->
  <div v-else class="max-w-2xl mx-auto bg-gray-900 px-5 pt-6 flex flex-col gap-0 min-h-screen">
    <button
      @click="minor = ''"
      class="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-gray-800/90 hover:bg-gray-700 text-gray-300 border border-gray-600 rounded-full px-6 py-3 shadow font-bold text-lg flex items-center gap-2"
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
    <div v-else class="py-32 text-center text-gray-500">조건에 맞는 규칙이 없습니다 😥</div>
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
import api from '../api/api'
import HeaderComp from '../components/HeaderComp.vue'
import RuleCard from '../components/RuleCard.vue'

import { useRouter } from 'vue-router'
import { useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const showScrollTop = ref(false)
const majors = ref([])
const minors = ref([])
const rules = ref([])
const loading = ref(false)
const loadingMajors = ref(false)
const loadingMinors = ref(false)
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

const handleGoBack = () => {
  // fromGameCreate 쿼리 파라미터가 있으면 GameListView로 이동
  if (route.query.fromGameCreate === 'true') {
    router.push('/game-list')
  }
  // 규칙 생성에서 돌아온 경우 피드로 이동
  else if (route.query.fromRuleCreate === 'true') {
    router.push('/')
  }
  else {
    // 히스토리 길이가 1 이하면 (첫 페이지) 피드로 이동
    if (window.history.length <= 1) {
      router.push('/');
    } else {
      router.back();
    }
  }
}

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
  loadingMajors.value = true
  try {
    const res = await api.get('/api/rules/categories')
    majors.value = res.data.majors
  } finally {
    loadingMajors.value = false
  }
}
async function fetchMinors() {
  if (!major.value) {
    minors.value = []
    minor.value = ''
    return
  }
  loadingMinors.value = true
  try {
    const res = await api.get(`/api/rules/categories/${major.value}`)
    minors.value = res.data
  } finally {
    loadingMinors.value = false
  }
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
const onPlusClick = () => {
  router.push('/rules/create')
}
const onMyRulesClick = () => {
  router.push('/rules/my-rules')
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
</script>
