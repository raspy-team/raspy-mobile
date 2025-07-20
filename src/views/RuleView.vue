<template>
        <HeaderComp :has-referer="true" title="규칙 탐색" />

  <main style="min-height: calc(var(--real-vh, 1vh) * 100)" class="bg-gray-50  pb-14">
    <!-- 필터 바 -->
    <nav class="fixed top-0 z-30 bg-white/95 pt-20 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex flex-wrap gap-2 sm:gap-4">
      <select
        v-model="major"
        @change="fetchMinors"
        class="filter-select"
        aria-label="주 카테고리 선택"
      >
        <option value="">주 카테고리</option>
        <option v-for="m in majors" :key="m">{{ m }}</option>
      </select>
      <select
        v-model="minor"
        :disabled="!major"
        class="filter-select"
        aria-label="보조 카테고리 선택"
      >
        <option value="">보조 카테고리</option>
        <option v-for="n in minors" :key="n">{{ n }}</option>
      </select>
      <input
        v-model="search"
        type="search"
        placeholder="검색어"
        class="filter-input"
        aria-label="검색"
        @keyup.enter="onSubmitSearch"
        autocomplete="off"
      />
      <div class="relative">
        <button
          @click="toggleSort"
          class="filter-sort"
          :aria-expanded="showSortOptions"
        >
          <i class="fas fa-sort text-orange-400 mr-1"></i>
          {{ selectedSortLabel }}
        </button>
        <ul
          v-if="showSortOptions"
          class="sort-menu"
        >
          <li
            v-for="o in sortOptions"
            :key="o.value"
            @click="selectSort(o.value)"
            class="sort-option"
            :aria-selected="sort === o.value"
          >
            {{ o.label }}
          </li>
        </ul>
      </div>
    </nav>
    <!-- 카드 리스트 -->
    <div class="max-w-2xl mx-auto px-2 mt-8 flex flex-col gap-8">
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
      <div v-else class="py-32 text-center text-gray-400">
        조건에 맞는 규칙이 없습니다 😥
      </div>
    </div>
    <!-- Toaster -->
    <transition name="fade">
      <div
        v-if="toastMsg"
        class="fixed left-1/2 bottom-10 z-[90] -translate-x-1/2 bg-orange-500 text-white px-6 py-2 rounded-xl shadow-lg font-semibold"
        aria-live="polite"
      >
        {{ toastMsg }}
      </div>
    </transition>
  </main>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import api from '../api/api'
import HeaderComp from '../components/HeaderComp.vue'
import RuleCard from '../components/RuleCard.vue'

const majors = ref([])
const minors = ref([])
const rules = ref([])
const loading = ref(false)
const showSortOptions = ref(false)
const menuOpen = ref(null)
const major = ref('')
const minor = ref('')
const search = ref('')
const sort = ref('popular')
const sortOptions = [
  { label: '최신순', value: 'recent' },
  { label: '인기순', value: 'popular' }
]
const copiedId = ref(null)
const expanded = ref([])
const toastMsg = ref('')

const selectedSortLabel = computed(() =>
  sortOptions.find(o => o.value === sort.value)?.label || '정렬'
)

const fetchMajors = async () => {
  const res = await api.get('/api/rules/categories')
  majors.value = res.data.majors
}
const fetchMinors = async () => {
  if (!major.value) {
    minors.value = []
    minor.value = ''
    return
  }
  const res = await api.get(`/api/rules/categories/${major.value}`)
  minors.value = res.data
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
const toggleSort = () => { showSortOptions.value = !showSortOptions.value }
const selectSort = (v) => {
  sort.value = v
  showSortOptions.value = false
  onSubmitSearch()
}
const showToast = (msg) => {
  toastMsg.value = msg
  setTimeout(() => { toastMsg.value = '' }, 1200)
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
    expanded.value = expanded.value.filter(e => e !== id)
  } else {
    expanded.value.push(id)
  }
}
const openMenu = (id) => {
  menuOpen.value = menuOpen.value === id ? null : id
}
onMounted(() => {
  fetchMajors()
  onSubmitSearch()
})
watch([major, minor, sort], onSubmitSearch)
watch(search, onSubmitSearch)
</script>

<style scoped>
.filter-select {
  background: #f5f5f8;
  border: none;
  border-radius: 0.7rem;
  padding: 0.55rem 1.1rem;
  font-size: 16px;
  width:45%;
  transition: box-shadow 0.15s;
  outline: none;
}
.filter-select:focus, .filter-input:focus {
  box-shadow: 0 0 0 2px #fb923c33;
}
.filter-input {
  background: #f5f5f8;
  border: none;
  border-radius: 0.7rem;
  padding: 0.55rem 1.1rem;
  font-size: 16px;
  min-width: 120px;
}
.filter-sort {
  background: #fff;
  border: 1.5px solid #e6e4e9;
  border-radius: 0.7rem;
  padding: 0.55rem 1.1rem;
  font-size: 16px;
  transition: border 0.15s;
}
.filter-sort:focus {
  border-color: #fb923c;
}
.sort-menu {
  position: absolute;
  z-index: 40;
  top: 120%;
  left: 0;
  width: 8rem;
  background: #fff;
  border: 1px solid #f4f4f4;
  border-radius: 0.7rem;
  box-shadow: 0 2px 16px 0 rgba(251,146,60,0.07);
  padding: 0.3rem 0;
}
.sort-option {
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background 0.15s;
  border-radius: 0.6rem;
}
.sort-option:hover, .sort-option[aria-selected="true"] {
  background: #fff7ed;
  color: #f97316;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.4s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
