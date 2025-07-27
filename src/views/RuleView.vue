<template>
  <HeaderComp v-if="showHeader" :has-referer="true" title="규칙 탐색" class="z-40" />
  <nav
    class="z-10 bg-white border-b border-gray-100 px-4 pb-3 flex flex-wrap gap-2 sm:gap-4 pt-20 raspy-top"
  >
    <!-- Major Custom Select -->
    <div class="flex w-full gap-3">
      <div
        class="custom-select flex-1"
        @keydown.enter.prevent="toggleMajorDropdown"
        tabindex="0"
        :aria-expanded="majorDropdownOpen"
      >
        <button
          class="select-btn"
          :class="{ active: majorDropdownOpen }"
          @click="toggleMajorDropdown"
          aria-haspopup="listbox"
          :aria-expanded="majorDropdownOpen"
        >
          <span>{{ majorLabel }}</span>
          <i
            class="fas fa-chevron-down text-sm ml-2 transition"
            :class="{ 'rotate-180': majorDropdownOpen }"
          ></i>
        </button>
        <ul v-show="majorDropdownOpen" class="select-list" role="listbox" @mousedown.prevent>
          <li
            v-for="m in majors"
            :key="m"
            @click="selectMajor(m)"
            class="select-option"
            :aria-selected="major === m"
          >
            {{ m }}
          </li>
        </ul>
      </div>

      <!-- Minor Custom Select -->
      <div
        class="custom-select flex-1"
        :class="{ disabled: !major }"
        tabindex="0"
        :aria-expanded="minorDropdownOpen"
      >
        <button
          class="select-btn"
          :disabled="!major"
          :class="{ active: minorDropdownOpen, disabled: !major }"
          @click="toggleMinorDropdown"
          aria-haspopup="listbox"
          :aria-expanded="minorDropdownOpen"
        >
          <span>{{ minorLabel }}</span>
          <i
            class="fas fa-chevron-down text-sm ml-2 transition"
            :class="{ 'rotate-180': minorDropdownOpen }"
          ></i>
        </button>
        <ul
          v-show="minorDropdownOpen && major"
          class="select-list"
          role="listbox"
          @mousedown.prevent
        >
          <li
            v-for="n in minors"
            :key="n"
            @click="selectMinor(n)"
            class="select-option"
            :aria-selected="minor === n"
          >
            {{ n }}
          </li>
        </ul>
      </div>
    </div>

    <!-- 검색창 -->
    <input
      v-model="search"
      type="search"
      placeholder="검색어"
      class="filter-input"
      aria-label="검색"
      @keyup.enter="onSubmitSearch"
      autocomplete="off"
    />

    <!-- 정렬버튼 -->
    <div class="relative mt-2">
      <button @click="toggleSort" class="filter-sort" :aria-expanded="showSortOptions">
        <i class="fas fa-sort text-orange-400 mr-1"></i>
        {{ selectedSortLabel }}
      </button>
      <ul v-if="showSortOptions" class="sort-menu">
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

  <main class="pb-14">
    <!-- 이하 동일 -->
    <div class="max-w-2xl mx-auto h-full px-5 mt-3 flex flex-col gap-0">
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
    </div>
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
  </main>

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
import { ref, computed, onMounted, watch, onUnmounted, nextTick } from 'vue'
import api from '../api/api'
import HeaderComp from '../components/HeaderComp.vue'
import RuleCard from '../components/RuleCard.vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const showHeader = ref(true)
const showScrollTop = ref(false)
const handleScroll = () => {
  showScrollTop.value = window.scrollY > 120
}
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
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
  { label: '인기순', value: 'popular' },
]
const copiedId = ref(null)
const expanded = ref([])
const toastMsg = ref('')

const majorDropdownOpen = ref(false)
const minorDropdownOpen = ref(false)

const majorLabel = computed(() => (major.value ? major.value : '주 카테고리'))
const minorLabel = computed(() => (minor.value ? minor.value : '보조 카테고리'))

const selectedSortLabel = computed(
  () => sortOptions.find((o) => o.value === sort.value)?.label || '정렬',
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
const openMenu = (id) => {
  menuOpen.value = menuOpen.value === id ? null : id
}

// --- Custom Select 관련 ---
function toggleMajorDropdown() {
  majorDropdownOpen.value = !majorDropdownOpen.value
}
function toggleMinorDropdown() {
  if (!major.value) return
  minorDropdownOpen.value = !minorDropdownOpen.value
}
async function selectMajor(m) {
  major.value = m
  minor.value = ''
  majorDropdownOpen.value = false
  await fetchMinors()
  // UX: 메이저 선택시 자동 마이너 오픈
  nextTick(() => {
    if (minors.value.length > 0) minorDropdownOpen.value = true
  })
}
function selectMinor(n) {
  minor.value = n
  minorDropdownOpen.value = false
}
function closeDropdowns(e) {
  if (!e.target.closest('.custom-select')) {
    majorDropdownOpen.value = false
    minorDropdownOpen.value = false
  }
}
onMounted(() => {
  fetchMajors()
  onSubmitSearch()
  document.addEventListener('click', closeDropdowns)
  if (route.params?.creating === '1') {
    showHeader.value = false
  }
})
onUnmounted(() => {
  document.removeEventListener('click', closeDropdowns)
})
watch([major, minor, sort], onSubmitSearch)
watch(search, onSubmitSearch)
</script>

<style scoped>
/* 커스텀 셀렉트 스타일 (트렌디/피그마 스타일 기반) */
.custom-select {
  position: relative;
  min-width: 140px;
  user-select: none;
  outline: none;
}
.custom-select.disabled {
  opacity: 0.5;
  pointer-events: none;
}
.select-btn {
  background: #f5f5f8;
  border: none;
  border-radius: 0.7rem;
  padding: 0.55rem 1.1rem;
  font-size: 16px;
  min-width: 120px;
  width: 100%;
  display: flex;
  align-items: center;
  transition:
    box-shadow 0.15s,
    border 0.2s;
  cursor: pointer;
  outline: none;
  border: 1.5px solid transparent;
}
.select-btn.active,
.select-btn:focus {
  box-shadow: 0 0 0 2px #fb923c33;
  border-color: #fb923c77;
}
.select-btn.disabled {
  cursor: not-allowed;
  background: #f0f0f2;
  color: #bbb;
}
.select-list {
  position: absolute;
  z-index: 50;
  top: 110%;
  left: 0;
  min-width: 120px;
  width: max-content;
  background: #fff;
  border: 1px solid #f4f4f4;
  border-radius: 0.7rem;
  box-shadow: 0 2px 16px 0 rgba(251, 146, 60, 0.1);
  padding: 0.3rem 0;
  margin-top: 2px;
  max-height: 280px;
  overflow-y: auto;
  animation: dropdownFade 0.15s;
}
@keyframes dropdownFade {
  0% {
    opacity: 0;
    transform: translateY(-8px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
.select-option {
  padding: 0.8rem 1.1rem;
  cursor: pointer;
  border-radius: 0.5rem;
  font-size: 16px;
  transition:
    background 0.15s,
    color 0.15s;
  white-space: nowrap;
}
.select-option:hover,
.select-option[aria-selected='true'] {
  background: #fff7ed;
  color: #f97316;
}
.filter-input {
  background: #f5f5f8;
  border: none;
  border-radius: 0.7rem;
  padding: 0.55rem 1.1rem;
  font-size: 16px;
  min-width: 120px;
  outline: none;
}
.filter-input:focus {
  box-shadow: 0 0 0 2px #fb923c33;
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
  box-shadow: 0 2px 16px 0 rgba(251, 146, 60, 0.07);
  padding: 0.3rem 0;
}
.sort-option {
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background 0.15s;
  border-radius: 0.6rem;
}
.sort-option:hover,
.sort-option[aria-selected='true'] {
  background: #fff7ed;
  color: #f97316;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
