<template>
  <div v-if="user" class="min-h-screen bg-[#f8f9fa] pb-24 relative">

    <!-- Fixed Top Bar -->
    <div class="fixed z-30 left-0 right-0 top-0 backdrop-blur flex justify-between items-center px-4 py-3 border-b border-gray-100">
        <div class="relative flex-1 mr-2 sm:w-48">
          <i class="fas fa-search text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"></i>
          <input
            type="text"
            readonly
            placeholder="유저 찾기"
            @click="searchUsers"
            class="pl-9 pr-4 py-2 rounded-[5px] border border-gray-200 bg-white text-gray-700 text-sm font-semibold shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-100 transition w-full hover:border-orange-400"
          />
        </div>

      <button @click="goSettings" class="flex items-center gap-2 px-2 py-1 text-gray-700 hover:text-orange-500">
        <i class="fas fa-cog text-lg"></i>
        <span class="font-semibold text-sm hidden sm:inline">설정</span>
      </button>
    </div>
<!-- User Card Section (UI/UX 개선) -->
<section  class="max-w-lg mx-auto bg-white rounded-2xl shadow-lg mt-10 mb-8 px-6 pt-7 pb-8 flex flex-col gap-5 relative">
  <!-- 프로필/닉네임/기본정보 -->
  <div class="flex gap-5 items-center mb-2">
    <img
      :src="user.avatar ? user.avatar : Default"
      alt="avatar"
      class="w-20 h-20 rounded-full object-cover border-2 border-orange-400 shadow"
    />
    <div class="flex-1 flex flex-col ">
      <div class="flex flex-col items-start gap-2">
        <h2 class="text-xl font-bold text-gray-900">@{{ user.nickname }}</h2>
        <div>
          <span class="inline-block bg-orange-100 text-orange-600 text-xs px-2.5 py-0.5 rounded font-bold">{{ user.age ? user.age + '세': '연령 미등록'}}</span>
          <span class="inline-block bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded font-bold">{{ user.gender ? user.gender : '성별 미등록' }}</span>
        </div>
      </div>
      <div class="text-xs text-gray-400 mt-0.5">{{ user.location }}</div>
      <div class="text-sm text-gray-500 mt-2 line-clamp-2">{{ user.intro }}</div>
    </div>
  </div>

  <!-- 올인원 통계/부가정보 박스 -->
  <div class="rounded-xl bg-gray-50 p-0.5 w-full flex flex-col sm:flex-row gap-0 sm:gap-4 items-stretch shadow-sm">
    <!-- 승무패+승률 (좌측) -->
    <div class="flex flex-row flex-1 items-center justify-around px-4 py-3 gap-0 border-b sm:border-b-0 sm:border-r border-gray-200">
      <div class="flex flex-col items-center gap-0.5">
        <span class="text-lg font-extrabold text-gray-900">{{ user.stats.wins }}</span>
        <span class="text-xs text-gray-500 font-semibold">승</span>
      </div>
      <div class="flex flex-col items-center gap-0.5">
        <span class="text-lg font-extrabold text-gray-900">{{ user.stats.draws }}</span>
        <span class="text-xs text-gray-500 font-semibold">무</span>
      </div>
      <div class="flex flex-col items-center gap-0.5">
        <span class="text-lg font-extrabold text-gray-900">{{ user.stats.losses }}</span>
        <span class="text-xs text-gray-500 font-semibold">패</span>
      </div>
      <div class="flex flex-col items-center gap-0.5">
        <span class="text-lg font-extrabold text-orange-500">{{ user.stats.winRate }}%</span>
        <span class="text-xs text-orange-500 font-bold">승률</span>
      </div>
    </div>
    <!-- 부가 정보(친구/매너/시간, 우측) -->
    <div class="flex flex-row flex-1 items-center justify-around px-4 py-3 gap-0">
      <div class="flex flex-col items-center gap-0.5">
        <span class="text-base font-extrabold text-gray-900">{{ user.stats.friends }}</span>
        <span class="text-xs text-gray-500 font-semibold">친구</span>
      </div>
      <div class="flex flex-col items-center gap-0.5">
        <span
          class="text-base font-extrabold"
          :class="[
            user.mannerScore >= 4
              ? 'text-green-500'
              : user.mannerScore >= 2
                ? 'text-yellow-500'
                : user.mannerScore > 0
                  ? 'text-red-500'
                  : 'text-gray-400'
          ]"
        >{{ user.mannerScore.toFixed(1) }}</span>
        <span class="text-xs text-gray-500 font-semibold">매너</span>
      </div>
      <div class="flex flex-col items-center gap-0.5">
        <span class="text-base font-extrabold text-gray-900">{{ formattedPlayTime }}</span>
        <span class="text-xs text-gray-500 font-semibold">플레이</span>
      </div>
    </div>
  </div>

  <!-- 액션 버튼 (좌/우) -->
  <div v-if="!user.isMe" class="flex gap-3 mt-1">
    <button
      v-if="!sent"
      class="flex justify-center items-center bg-orange-500 hover:bg-orange-400 border-[0.1px] border-orange-500 text-white font-bold py-3 w-full rounded-xl shadow transition"
      @click="sendFriendRequest"
    >
      <i class="fas fa-user-plus mr-2"></i> 친구추가
    </button>
    <button
      v-else
      class="flex justify-center items-center bg-white border-[0.1px] border-orange-500 text-orange-500 font-bold py-3 w-full rounded-xl shadow transition"
      @click="sendFriendCancelRequest"
    >
      <i class="fas fa-check mr-2"></i> 요청됨
    </button>
    <button class="flex justify-center items-center bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 rounded-xl w-[50%] shadow transition">
      <i class="fas fa-paper-plane mr-2"></i> DM
    </button>
  </div>
</section>


    <!-- Stat Tabs Selector & Graph -->
    <section class="max-w-lg mx-auto px-4">
      <!-- no use at demo -->
      <div v-if="false" class="flex items-center gap-2 mb-4 mt-2">
        <button
          v-for="item in statTabs"
          :key="item.id"
          @click="onTabChange(item)"
          :class="statMode === item.id
            ? 'bg-orange-500 text-white font-bold shadow'
            : 'bg-white text-gray-500 border border-gray-200'"
          class="px-4 py-3 rounded-full flex-1 text-sm transition-all"
        >{{ item.label }}</button>
      </div>
      <div v-if="statMode === 'rule'" class="mb-4">
        <button
          @click="showRuleModal = true"
          class="w-full py-3 rounded-xl bg-orange-100 text-orange-600 text-sm font-bold shadow flex items-center justify-center gap-2"
        >
          <i class="fas fa-list-alt"></i>
          {{ selectedRule?.ruleTitle || '경기 규칙 선택' }}
        </button>
      </div>
      <div v-if="statMode === 'category'" class="mb-4 flex gap-2">
         <CustomSelect
           :options="Object.keys(playedCategoryMap).map(cat => ({ label: cat, value: cat }))"
           v-model="selectedMainCategory"
           placeholder="주 카테고리"
         />
         <CustomSelect
           :options="subCategoryOptions"
           v-model="selectedSubCategory"
           :disabled="!selectedMainCategory"
           placeholder="서브 카테고리"
         />
      </div>
      <div class="mb-3 text-xs text-gray-500 px-2">
        <template v-if="statMode === 'total'">
          전체 기준 (플레이한 유저: <b>{{ user.totalPlayers }}</b>명)
        </template>
        <template v-if="statMode === 'rule' && selectedRule">
          [{{ selectedRule.title }}] {{ selectedRule.description }}<br>
          카테고리: {{ selectedRule.majorCategory }} > {{ selectedRule.minorCategory }}
          <span class="block mt-1 text-gray-400">플레이 유저: <b>{{ selectedRule.players }}</b>명</span>
        </template>
        <template v-if="statMode === 'category' && selectedMainCategory && selectedSubCategory">
          [{{ selectedMainCategory }} > {{ selectedSubCategory }}] 기준<br>
          플레이 유저: <b>{{ filteredCategoryPlayers }}</b>명
        </template>
      </div>
      <div class="rounded-2xl bg-white shadow p-5 mb-8">
        <div class="flex justify-start items-center mb-3">
          <span class="font-bold text-gray-900 text-base flex items-center gap-2">
            <i class="fas fa-chart-line text-orange-500"></i> 퍼포먼스 그래프
          </span>
          <!-- <div class="flex items-center gap-2"> 랭킹시스템 
            <span class="px-3 py-1 rounded-full bg-orange-500 text-white font-black text-xs shadow">랭킹 {{ stat.rank }}위</span>
            <span class="px-2 py-1 rounded-full bg-white text-orange-500 text-xs font-semibold border border-orange-400">상위 {{ stat.topPercent }}%</span> -->
          <!-- </div> -->
        </div>
        <div class="w-full h-[120px] flex items-center justify-center my-5 -ml-2">
          <canvas
            v-if="chartData.length > 0"
            ref="chartRef"
            height="flex-1"
            class="flex-1"
          ></canvas>
          <div v-else class="w-full text-center text-gray-400 text-sm py-8">
            경기 횟수가 부족하여<br> 퍼포먼스 그래프를 표시할 수 없습니다.
          </div>
        </div>
        <div class="mt-3 grid grid-cols-2 gap-y-2 gap-x-6 text-[0.97rem]">
          <div class="font-semibold text-gray-500">퍼포먼스 평균</div>
          <div class="text-right font-bold text-gray-900">{{ stat.performance.toFixed(1) }}</div>
          <div class="font-semibold text-gray-500">승/무/패</div>
          <div class="text-right text-gray-600">{{ stat.wins }}승 {{ stat.draws }}무 {{ stat.losses }}패</div>
          <div class="font-semibold text-gray-500">승률</div>
          <div class="text-right text-orange-500 font-bold">{{ stat.winRate }}%</div>
        </div>
      </div>
    </section>

    <!-- 경기 리스트 -->
    <section class="max-w-lg mx-auto px-4">
<!-- ... -->
<section class="max-w-lg mx-auto px-4">
  <div class="flex items-center gap-2 mb-4">
    <h3 class="text-xl font-bold text-gray-900">
      플레이한 경기
    </h3>
    <span v-if="statMode==='total'" class="text-sm text-orange-600 bg-orange-100 rounded px-2 py-1 font-bold">전체 경기</span>
    <span v-if="statMode==='rule' && selectedRule" class="text-sm text-orange-600 bg-orange-100 rounded px-2 py-1 font-bold">{{ selectedRule.ruleTitle }}</span>
    <span v-if="statMode==='category' && selectedMainCategory && selectedSubCategory" class="text-sm text-orange-600 bg-orange-100 rounded px-2 py-1 font-bold">{{ selectedMainCategory }} > {{ selectedSubCategory }}</span>
  </div>
  <!-- ... 나머지 카드리스트 ... -->
</section>
      <div v-if="filteredGames.length" class="space-y-6">
        <MatchCard
          v-for="game in filteredGames"
          :key="game.id"
          :game="game"
          :isWin="game.result === 'win'"
          :isDraw="game.result === 'draw'"
        />
      </div>
      <div v-else class="text-center text-gray-400 py-6 text-sm">표시할 경기가 없습니다.</div>
    </section>

    <!-- 경기규칙 모달 -->
    <transition name="fade">
      <div v-if="showRuleModal" class="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-end z-50">
        <div class="w-full max-w-lg bg-white rounded-t-3xl shadow-2xl p-6">
          <div class="mb-2 flex justify-between items-center">
            <h3 class="text-lg font-bold text-gray-900">경기 규칙 선택</h3>
            <button @click="showRuleModal = false" class="text-gray-400 hover:text-orange-500 text-xl"><i class="fas fa-times"></i></button>
          </div>
          <input
            v-model="ruleSearch"
            class="w-full border rounded-full px-4 py-2 mb-3 text-sm focus:ring-2 focus:ring-orange-200"
            placeholder="규칙 제목 검색"
          />
          <div  v-if="filteredRules.length > 0"  class="max-h-80 overflow-y-auto flex flex-col gap-2">
            <button
              v-for="rule in filteredRules"
              :key="rule.id"
              class="flex flex-col items-start gap-1 p-3 bg-gray-100 hover:bg-orange-50 rounded-xl text-sm font-bold text-gray-800 transition"
              :class="{ 'bg-orange-200 text-orange-700': selectedRuleId === rule.id }"
              @click="selectRule(rule.id)"
            >
              <div class="flex items-center gap-2">
                <span class="font-bold text-base">{{ rule.ruleTitle }}</span>
                <span class="text-xs px-2 py-0.5 bg-gray-200 rounded">{{ rule.majorCategory }} > {{ rule.minorCategory }}</span>
              </div>
              <div class="text-xs text-gray-600">{{ rule.ruleDescription }}</div>
            </button>

          </div>
          <div v-else>
            플레이한 게임이 없습니다.
          </div>
        </div>
      </div>
    </transition>
  </div>

    <transition name="fade">
    <div v-if="showUserModal" class="fixed inset-0 bg-black bg-opacity-30 z-50 flex justify-center items-center">
      <div class="bg-white  w-dvw h-dvh  w-full p-6 relative">
        <button class="absolute top-4  right-7 text-gray-400 hover:text-orange-500 text-xl"
                @click="closeUserModal">
          <i class="fas fa-times"></i>
        </button>
        <h3  class="font-bold text-lg mb-4 text-gray-800">유저 찾기</h3>
        <input v-model="userSearch"
               @input="onUserSearch"
               type="text"
               class="w-full border rounded-[10px] px-4 py-3 mb-4 text-sm focus:ring-2 focus:ring-orange-200 outline-none"
               placeholder="유저의 이름을 입력하세요" />
        <div v-if="userSearching" class="text-center text-gray-400 py-4 text-sm">검색 중...</div>
        <div v-else-if="userSearchResult.length === 0 && userSearch.trim() !== ''" class="text-center text-gray-400 py-10 text-base">검색 결과가 없습니다.</div>
        <div v-else class="flex flex-col gap-2 max-h-60 overflow-y-auto">
          <button v-for="user in userSearchResult" :key="user.id"
                  @click="gotoUser(user.id)"
                  class="flex items-center gap-3 p-2 hover:bg-orange-50 rounded-xl transition border border-transparent hover:border-orange-200">
            <img :src="user.avatar" class="w-10 h-10 rounded-full border object-cover" />
            <div class="flex-1 text-left">
              <div class="font-bold text-gray-800 text-sm">@{{ user.nickname }}</div>
              <div class="text-xs text-gray-500">{{ user.intro }}</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  </transition>

  <Footer tab="profile" />
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Chart from 'chart.js/auto'
import Footer from "../../components/FooterNav.vue"
import CustomSelect from './CustomSelect.vue'
import MatchCard from './MatchCard.vue'
import Default from "../../assets/default.png"
import api from "../../api/api"

const chartRef = ref(null)
let chartInstance = null
const router = useRouter()
const route = useRoute()
let userId = route.params.id 


const user = ref(null)
const allGames = ref([])

// [카테고리, [서브카테고리, ...]] 목록 (플레이한 것만)
const playedCategoryMap = ref({}) // { "신체": ["축구", "농구"], "보드": ["체스"] }
const playedRules = ref([]) // 전체 플레이한 룰 배열

const statTabs = [
  { id: 'total', label: '전체' },
  // { id: 'rule', label: '경기 규칙별' },
  // { id: 'category', label: '카테고리별' },
]
const statMode = ref('total')
const showRuleModal = ref(false)
const ruleSearch = ref('')
const selectedRuleId = ref(null)
const selectedMainCategory = ref(null)
const selectedSubCategory = ref(null)

const subCategoryOptions = computed(() =>
  selectedMainCategory.value && playedCategoryMap.value[selectedMainCategory.value]
    ? playedCategoryMap.value[selectedMainCategory.value].map(sub => ({ label: sub, value: sub }))
    : []
)

const selectedRule = computed(() =>
  playedRules.value.find(r => r.id === selectedRuleId.value)
)

const sent = ref(false)

function sendFriendRequest() {
  sent.value = true  
}

function sendFriendCancelRequest() {
  sent.value = false
}

const stat = computed(() => {
  if (!user.value) return { performance: 0, wins: 0, draws: 0, losses: 0, winRate: 0 }
  if (statMode.value === 'total') {
    return {
      performance: user.value.stats.performance ?? 0,
      wins: user.value.stats.wins,
      draws: user.value.stats.draws,
      losses: user.value.stats.losses,
      winRate: user.value.stats.winRate
    }
  } else if (statMode.value === 'rule' && selectedRule.value) {
    return selectedRule.value.stat ?? { performance: 0, wins: 0, draws: 0, losses: 0, winRate: 0 }
  } else if (statMode.value === 'category' && selectedMainCategory.value && selectedSubCategory.value) {
    // 카테고리/서브카테고리 통계는 별도 API 필요하면 이곳에서 fetch하여 사용
    return { performance: 0, wins: 0, draws: 0, losses: 0, winRate: 0 }
  }
  return { performance: 0, wins: 0, draws: 0, losses: 0, winRate: 0 }
})

const filteredCategoryPlayers = computed(() => {
  if (statMode.value === 'category' && selectedMainCategory.value && selectedSubCategory.value) {
    // 플레이 유저 수 통계가 있다면 여기에 연결
    return 0
  }
  return user.value?.totalPlayers ?? 0
})

const filteredGames = computed(() => {
  if (statMode.value === 'total') return allGames.value
  if (statMode.value === 'rule' && selectedRule.value) {
    return allGames.value.filter(g => g.ruleId === selectedRule.value.id)
  }
  if (statMode.value === 'category' && selectedMainCategory.value && selectedSubCategory.value) {
    return allGames.value.filter(
      g => g.mainCategory === selectedMainCategory.value && g.subCategory === selectedSubCategory.value
    )
  }
  return []
})

function onTabChange(item) {
  statMode.value = item.id
  if (item.id === 'rule' && playedRules.value.length && !selectedRule.value) {
    selectedRuleId.value = playedRules.value[0].id
  }
  if (item.id === 'category') {
    selectedMainCategory.value = Object.keys(playedCategoryMap.value)[0] || null
    selectedSubCategory.value = playedCategoryMap.value[selectedMainCategory.value]?.[0] || null
  }
}

const chartData = computed(() => {
  if (statMode.value === 'total') return user.value?.stats?.performanceHistory ?? []
  if (statMode.value === 'rule' && selectedRule.value) return selectedRule.value.performanceHistory ?? []
  if (statMode.value === 'category') return []
  return []
})

const formattedPlayTime = computed(() => {
  const min = user.value?.playTime ?? 0
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
})


const filteredRules = computed(() =>
  playedRules.value.filter(r =>
    r.ruleTitle.includes(ruleSearch.value)
  )
)

function selectRule(id) {
  selectedRuleId.value = id
  showRuleModal.value = false
}

function goSettings() {
  router.push('/settings')
}

const updateChart = async () => {
  await nextTick()
  if (!chartRef.value) return
  if (chartInstance) chartInstance.destroy()
  if (chartData.value.length < 1) return

  chartInstance = new Chart(chartRef.value, {
    type: 'line',
    data: {
      labels: chartData.value.map((_, i) => i + 1),
      datasets: [{
        label: "퍼포먼스 점수",
        data: chartData.value,
        borderColor: "#fd7e14",
        backgroundColor: "rgba(253,126,20,0.06)",
        pointRadius: 5,
        pointHoverRadius: 6,
        borderWidth: 3,
        fill: true,
        tension: 0.25,
      }]
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { title: { display: true, text: "경기 횟수", color: "#aaa", font: { size: 13, weight: 600 } }, grid: { display: false } },
        y: { min: 0, max: 5, ticks: { stepSize: 1, color: "#bbb" }, title: { display: true, text: "퍼포먼스(점)", color: "#aaa", font: { size: 13, weight: 600 } }, grid: { color: "#efefef" } }
      }
    }
  })
}

// 유저 검색 모달 및 검색 API
const showUserModal = ref(false)
const userSearch = ref('')
const userSearching = ref(false)
const userSearchResult = ref([])
let searchTimeout

function searchUsers() {
  showUserModal.value = true
  userSearch.value = ''
  userSearchResult.value = []
}
function closeUserModal() {
  showUserModal.value = false
}
async function onUserSearch() {
  clearTimeout(searchTimeout)
  if (!userSearch.value.trim()) {
    userSearchResult.value = []
    return
  }
  userSearching.value = true
  searchTimeout = setTimeout(async () => {
    const res = await api.get(`/api/user-profile/search?keyword=${encodeURIComponent(userSearch.value)}`)
    userSearchResult.value = res.data
    userSearching.value = false
  }, 350)
}
function gotoUser(userId) {
  closeUserModal()
  router.push(`/profile/${userId}`)
}

// 데이터 로딩 및 예외처리
onMounted(async () => {
  try {
    const res1 = await api.get(`/api/user-profile/${userId}`)
    user.value = res1.data

    // 카테고리/서브카테고리 맵 구성
    const categoryMap = {}
    for (const rule of res1.data.playedRules) {
      if (!categoryMap[rule.majorCategory]) categoryMap[rule.majorCategory] = []
      if (!categoryMap[rule.majorCategory].includes(rule.minorCategory))
        categoryMap[rule.majorCategory].push(rule.minorCategory)
    }
    playedCategoryMap.value = categoryMap
    playedRules.value = res1.data.playedRules

    // 필터 기본값
    if (Object.keys(categoryMap).length) {
      selectedMainCategory.value = Object.keys(categoryMap)[0]
      selectedSubCategory.value = categoryMap[selectedMainCategory.value][0]
    }
    if (playedRules.value.length) selectedRuleId.value = playedRules.value[0].id

    const res2 = await api.get(`/api/user-profile/${userId}/games`)
    allGames.value = res2.data

    updateChart()
  } catch (e) {
    alert('존재하지 않는 유저입니다.')
    router.push('/')
  }
})

watch([statMode, selectedRuleId, selectedMainCategory, selectedSubCategory], updateChart, { deep: true })

</script>


<style scoped>
@import url("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css");
body { background: #f8f9fa !important; }
.line-clamp-2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}
.fade-enter-active, .fade-leave-active { transition: all 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
::-webkit-scrollbar { display:none; }
</style>
