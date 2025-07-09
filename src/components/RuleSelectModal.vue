<template>
  <div class="fixed inset-0 z-50 bg-black/30 flex items-end sm:items-center justify-center">
    <div class="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-lg pb-safe flex flex-col relative overflow-hidden">
      <!-- 헤더 -->
      <button @click="$emit('close')" class="absolute right-4 top-4 text-gray-400 hover:text-gray-500">
        <i class="fas fa-xmark text-2xl"></i>
      </button>
      <div class="pt-6 pb-3 px-5 border-b border-gray-100 flex flex-col gap-1">
        <h2 class="text-lg font-md text-gray-900 tracking-tight mb-2 flex items-center gap-2">
          <i class="fas fa-bolt text-orange-500"></i>
          규칙 선택하기
        </h2>
        <div class="flex gap-2">
          <div class="flex-1">
            <select v-model="major" @change="fetchMinors"
              class="w-full bg-gray-100 border-none rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-orange-300 transition">
              <option value="">주 카테고리</option>
              <option v-for="m in majors" :key="m">{{m}}</option>
            </select>
          </div>
          <div class="flex-1">
            <select v-model="minor" :disabled="!major"
              class="w-full bg-gray-100 border-none rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-orange-300 transition disabled:opacity-40">
              <option value="">보조 카테고리</option>
              <option v-for="n in minors" :key="n">{{n}}</option>
            </select>
          </div>
        </div>
        <input v-model="search"
          placeholder="키워드로 검색"
          class="mt-2 w-full bg-gray-100 border-none rounded-lg px-3 py-3 text-sm font-medium focus:ring-2 focus:ring-orange-300 transition outline-none"
        />
        <div class="mt-2">
          <button
            @click="toggleSort"
            class="w-full flex items-center text-sm justify-center bg-white border border-gray-200 rounded-lg py-2 font-[400] text-gray-500 shadow-sm active:bg-gray-50"
          >
            <i class="fas fa-sort text-orange-400 mr-2"></i>
            {{ sortOptions.find(o => o.value === sort)?.label || '정렬' }}
            <i class="fas fa-chevron-down text-xs ml-1"></i>
          </button>
          <ul v-if="showSortOptions" class="absolute left-5 right-5 z-20 mt-1 bg-white border rounded-lg shadow-lg text-sm">
            <li v-for="o in sortOptions" :key="o.value"
                @click="selectSort(o.value)"
                class="px-4 py-2 hover:bg-orange-50 cursor-pointer text-gray-500">
              {{ o.label }}
            </li>
          </ul>
        </div>
      </div>

      <!-- 룰 리스트 -->
      <div class="flex-1 overflow-y-auto px-2 pt-2 pb-3 bg-white min-h-[36vh] max-h-[65vh]">
        <div v-if="loading" class="py-16 text-center text-orange-500">
          <i class="fas fa-spinner fa-spin text-2xl"></i>
        </div>
        <ul v-else-if="rules.length" class="flex flex-col gap-3">
          <li v-for="rule in rules" :key="rule.id"
              class="bg-gray-50 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-0.5 px-4 py-4 active:bg-orange-50 transition">
            <div class="flex justify-between items-center mb-1">
              <span class="text-base font-extrabold text-gray-900 truncate">{{ rule.ruleTitle }}</span>
              <button @click="selectRule(rule)"
                class="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-4 py-1 text-xs font-semibold shadow">
                선택
              </button>
            </div>
            <div class="text-xs text-orange-500 font-medium mb-2 flex gap-1 items-center">
              {{ rule.majorCategory }} <span class="mx-1 text-orange-500">&gt;</span> {{ rule.minorCategory }}
            </div>
              <div class="relative mb-2">
                <p :class="['text-gray-500 text-sm whitespace-pre-line leading-relaxed transition-all', expandedRules.includes(rule.id) ? '' : 'line-clamp-2']">
                  {{ rule.ruleDescription }}
                </p>
                <div class="flex justify-end">
                  <button @click="toggleExpand(rule.id)" class="text-xs text-orange-400 mt-1 hover:underline">
                    {{ expandedRules.includes(rule.id) ? '접기' : '펼치기' }}
                  </button>
                </div>
              </div>
              <div class="flex flex-col gap-1 mt-2 text-[13px]">
              <div class="flex items-center gap-2 p-2 rounded-lg">
                <i class="fas fa-trophy text-orange-400 text-base"></i>
                <span class="text-gray-500 font-light w-28 shrink-0">한세트 승리에 필요한 점수</span>
                <span class="text-gray-500 font-normal flex-1">
                  <template v-if="rule.pointsToWin === -1">제한 없음</template>
                  <template v-else>{{ rule.pointsToWin }}<span class="text-gray-400">점</span></template>
                </span>
              </div>
              <div class="flex items-center gap-2 p-2 rounded-lg">
                <i class="fas fa-th-large text-orange-400 text-base"></i>
                <span class="text-gray-500 font-light w-28 shrink-0">총 세트</span>
                <span class="text-gray-500 font-normal flex-1">
                  <template v-if="rule.setsToWin === -1">제한 없음</template>
                  <template v-else>{{ rule.setsToWin }}<span class="text-gray-400">세트</span></template>
                </span>
              </div>
              <div class="flex items-center gap-2 p-2 rounded-lg">
                <i class="fas fa-clock text-orange-400 text-base"></i>
                <span class="text-gray-500 font-light w-28 shrink-0">제한 시간</span>
                <span class="text-gray-500 font-normal flex-1">
                  <template v-if="rule.duration === -1">제한 없음</template>
                  <template v-else>{{ formatDuration(rule.duration) }}</template>
                </span>
              </div>
              <div class="flex items-center gap-2 p-2 rounded-lg">
                <i class="fas fa-crown text-orange-400 text-base text-[0.85rem]"></i>
                <span class="text-gray-500 font-light w-28 shrink-0">승리 조건</span>
                <span class="text-gray-500 font-normal flex-1">{{ formatWinBy(rule.winBy) }}</span>
              </div>
              <div class="flex items-center gap-2 p-2 rounded-lg">
                <i class="fas fa-fire text-orange-400 text-base"></i>
                <span class="text-gray-500 font-light w-28 shrink-0">사용됨</span>
                <span class="text-gray-500 font-normal flex-1">{{ rule.useCount }}<span class="text-gray-400">회</span></span>
              </div>
              <div class="flex items-center gap-2 p-2 rounded-lg">
                <i class="fas fa-user text-orange-400 text-base"></i>
                <span class="text-gray-500 font-light w-28 shrink-0">등록자</span>
                <span class="text-gray-500 font-normal flex-1 text-ellipsis overflow-hidden">@{{ rule.createdBy.nickname }}</span>
              </div>
            </div>
          </li>
        </ul>
        <div v-else class="py-14 text-center text-gray-400 text-base">
          조건에 맞는 규칙이 없습니다
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, defineEmits, watch } from 'vue'
import api from '../api/api'

const emit = defineEmits(['select', 'close'])

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
  { label: '인기순', value: 'popular' }
]

const expandedRules = ref([])

const toggleExpand = (id) => {
  if (expandedRules.value.includes(id)) {
    expandedRules.value = expandedRules.value.filter(r => r !== id)
  } else {
    expandedRules.value.push(id)
  }
}

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
  const params = { sort: sort.value }
  if (major.value) params.major = major.value
  if (minor.value) params.minor = minor.value
  if (search.value) params.search = search.value

  const res = await api.get('/api/rules/list', { params })
  rules.value = res.data
  loading.value = false
}
const selectRule = (rule) => emit('select', rule)
const toggleSort = () => { showSortOptions.value = !showSortOptions.value }
const selectSort = (v) => {
  sort.value = v
  showSortOptions.value = false
}

const formatDuration = (duration) => {
  const h = Math.floor(duration / 3600)
  const m = Math.floor((duration % 3600) / 60)
  const s = duration % 60
  let out = []
  if (h > 0) out.push(`${h}시간`)
  if (m > 0) out.push(`${m}분`)
  if (s > 0) out.push(`${s}초`)
  return out.join(' ')
}
const formatWinBy = (winBy) => {
  if (winBy === 'SETS_HALF_WIN') return '점수 달성'
  return '제한 시간동안 더 많은 점수 획득'
}

onMounted(() => {
  fetchMajors()
  onSubmitSearch()
})

watch(major, async () => {
  await fetchMinors()
  onSubmitSearch()
})
watch(minor, onSubmitSearch)
watch(sort, onSubmitSearch)

let searchTimeout = null
watch(search, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    onSubmitSearch()
  }, 300)
})
</script>

<style scoped>
html, body { background: #fff !important; }
::-webkit-scrollbar { width: 0px !important; background: transparent; }
button, select, input { outline: none !important; }
.px-5, .px-4 { box-sizing: border-box; }
@media (max-width: 640px) {
  .sm\:max-w-md { max-width: 100vw !important; }
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

</style>
