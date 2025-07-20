<template>
 
  <Header title="게임 생성" hasReferer="1" />

 <div  class=" bg-gradient-to-b from-white to-gray-50 p-5 py-20">
    <div class="max-w-xl mx-auto">
      <!-- 메인 카드 컨테이너 -->
      <main class="space-y-8 mt-2">
        <!-- 규칙 선택 -->
        <section class="rounded-2xl shadow-lg bg-white p-6">
          <div class="flex items-center mb-4">
            <i class="fas fa-sliders-h text-orange-500 text-xl mr-2"></i>
            <span class="text-base font-semibold tracking-tight text-gray-800">경기 규칙</span>
          </div>
          <div class="flex space-x-3 mb-2">
            <button class="flex-1 py-3 rounded-xl border-2 border-gray-200 transition-all bg-white hover:border-orange-400 active:scale-95"
              @click="openRuleSelect">
              <div class="flex flex-col items-center">
                <i class="fas fa-book-open text-xl mb-1 text-gray-400"></i>
                <span class="text-sm font-medium text-gray-600">규칙 선택하기</span>
              </div>
            </button>
            <button class="flex-1 py-3 rounded-xl border-2 border-gray-200 transition-all bg-white hover:border-orange-400 active:scale-95"
              @click="openRuleCreate">
              <div class="flex flex-col items-center">
                <i class="fas fa-plus text-xl mb-1" :class="selectedType === 'custom' ? 'text-orange-500' : 'text-gray-400'"></i>
                <span class="text-sm font-medium" :class="selectedType === 'custom' ? 'text-orange-500' : 'text-gray-600'">새로운 규칙</span>
              </div>
            </button>
          </div>
          <!-- 룰 정보 -->
          <transition name="fade">
          <div v-if="selectedRule" class="border bg-white border-gray-100 p-4 rounded-xl mb-3 mt-4 flex flex-col gap-1 relative shadow-sm">
            <span class="absolute right-0 top-0 bg-orange-500 text-white font-bold text-xs px-4 py-1 rounded-bl-xl">게임 규칙</span>
            <div class="mb-1 font-semibold text-gray-700 text-lg">{{ selectedRule.ruleTitle }}</div>
            <div class="mb-2 text-gray-500 text-sm">{{ selectedRule.majorCategory }} &gt; {{ selectedRule.minorCategory }}</div>
            <p class="text-sm text-gray-700 mb-2 leading-relaxed whitespace-pre-line ">{{ selectedRule.ruleDescription }}</p>
            <div class="text-sm text-gray-600 flex flex-col gap-2">
              <div class="flex items-center">
                <i class="fas fa-trophy text-orange-400 mr-2"></i>
                <span class="text-gray-500 w-28 shrink-0">승리 조건</span>
                <span class="font-medium">{{ selectedRule.winBy=='SETS_HALF_WIN' ? '승리 점수 달성' : '제한 시간동안 더 많은 점수 획득' }}</span>
              </div>
              <div class="flex items-center">
                <i class="fas fa-star text-orange-400 mr-2"></i>
                <span class="text-gray-500 w-28 shrink-0">세트당 점수</span>
                <span>{{ selectedRule.pointsToWin == -1 ? '제한 없음' : selectedRule.pointsToWin +'점' }}</span>
              </div>
              <div class="flex items-center">
                <i class="fas fa-layer-group text-orange-400 mr-2"></i>
                <span class="text-gray-500 w-28 shrink-0">총 세트</span>
                <span>{{ selectedRule.setsToWin }}세트</span>
              </div>
              <div class="flex items-center">
                <i class="fas fa-clock text-orange-400 mr-2"></i>
                <span class="text-gray-500 w-28 shrink-0">세트 제한시간</span>
                <span>
                  {{ selectedRule.duration == -1 ? '제한 없음' : (selectedRule.duration >= 60 ? Math.floor(selectedRule.duration / 60) + '분 ' + (selectedRule.duration % 60) + '초' : selectedRule.duration + '초') }}
                </span>
              </div>
            </div>
            <div class="text-right">
              <button @click="confirmRemove" class="mt-2 text-xs text-red-500 hover:underline font-medium">선택 취소</button>
            </div>
          </div>
          </transition>
        </section>

        <form @submit.prevent="createGame" class="space-y-8">
          <!-- 경기 일시 -->
          <section class="rounded-2xl shadow-lg bg-white p-6 space-y-3">
            <div class="flex items-center justify-between mb-2">
              <span class="text-base font-semibold text-gray-800 flex items-center">
                <i class="far fa-calendar-alt mr-2 text-orange-500"></i>경기 일시
              </span>
              <button type="button"
                @click="toggleUnset('date')"
                :class="form.matchDate === null ? 'bg-orange-100 text-orange-500 border border-orange-300' : 'bg-gray-100 text-gray-400 border border-gray-200'"
                class="rounded-full px-4 py-1 text-xs font-semibold shadow-sm transition hover:scale-105"
              >미정</button>
            </div>
            <transition name="fade">
            <div v-if="form.matchDate !== null">
              <input
                v-model="form.matchDate"
                type="datetime-local"
                class="w-full text-gray-700 text-base rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-orange-400 transition"
              />
              <p class="text-xs text-gray-400 mt-1">경기 시작 시간을 설정하세요 (미입력 시 협의결정)</p>
            </div>

                        <div v-else class="text-gray-400 text-sm">미정으로 설정됨</div>

            </transition>
          </section>

          <!-- 경기 장소 -->
          <section class="rounded-2xl shadow-lg bg-white p-6 space-y-3">
            <div class="flex items-center justify-between mb-2">
              <span class="text-base font-semibold text-gray-800 flex items-center">
                <i class="fas fa-map-marker-alt mr-2 text-orange-500"></i>경기 장소
              </span>
              <button type="button"
                @click="toggleUnset('place')"
                :class="form.placeRoad === null ? 'bg-orange-100 text-orange-500 border border-orange-300' : 'bg-gray-100 text-gray-400 border border-gray-200'"
                class="rounded-full px-4 py-1 text-xs font-semibold shadow-sm transition hover:scale-105"
              >미정</button>
            </div>
            <transition name="fade">
            <div v-if="form.placeRoad !== null">
              <button type="button" @click="openAddressSearch"
                class="flex items-center w-full border border-gray-200 rounded-xl p-3 text-left bg-gray-50 hover:bg-orange-50 transition mb-3">
                <i class="far fa-building text-orange-400 mr-3"></i>
                <span class="flex-1 text-base text-gray-700">{{ form.placeRoad || '도로명 주소 입력' }}</span>
                <i class="fas fa-chevron-right text-gray-300"></i>
              </button>
              <input
                v-model="form.placeDetail"
                placeholder="상세주소 입력"
                class="w-full text-gray-700 text-base rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-orange-400 transition"
              />
              <p class="text-xs text-gray-500 mt-1">예: ○○빌딩 3층, ○○체육관</p>
            </div>
            <div v-else class="text-gray-400 text-sm">미정으로 설정됨</div>

            </transition>
          </section>


        </form>
      </main>
    </div>

  </div>

  
              <!-- 제출 -->
          <div  class="fixed bottom-0 w-full left-0 ">
            <button type="submit"
              :disabled="!selectedRule"
              class="w-full bg-gradient-to-r  pb-4 raspy-bot from-orange-400 to-orange-500 text-white text-lg font-semibold pt-4 shadow-md disabled:opacity-40">
              게임 생성
            </button>
          </div>
        
    <!-- 모달들 -->
    <RuleSelectModal v-if="showSelectModal" @select="selectRule" @close="showSelectModal = false" />
    <RuleCreateModal v-if="showCreateModal" @created="handleCreatedRule" @close="showCreateModal = false" />
    <CustomToast />  
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import api from '../../api/api'
import { useToast } from '../../composable/useToast'
import { useRouter, useRoute } from 'vue-router'
import CustomToast from '../../components/CustomToast.vue'
import RuleSelectModal from '../../components/RuleSelectModal.vue'
import RuleCreateModal from '../../components/RuleCreateModal.vue'
import Header from "../../components/HeaderComp.vue"

const router = useRouter()
const { showToast } = useToast()

const route = useRoute()

const confirmRemove = () => {
    removeRule()

}

const form = ref({
  matchDate: '',
  placeRoad: '',
  placeDetail: ''
})

const toggleUnset = (field) => {
  if (field === 'date') {
    form.value.matchDate = form.value.matchDate === null ? '' : null
  }
  if (field === 'place') {
    form.value.placeRoad = form.value.placeRoad === null ? '' : null
    form.value.placeDetail = ''
  }
}

const selectedRule = ref(null)
const showSelectModal = ref(false)
const showCreateModal = ref(false)
const selectedType = ref('rules')

const openRuleSelect = () => {
  selectedType.value = 'rules'
  showSelectModal.value = true
}
const openRuleCreate = () => {
  selectedType.value = 'custom'
  showCreateModal.value = true
}

const selectRule = (rule) => {
  selectedRule.value = rule
  showSelectModal.value = false
  selectedType.value = 'rules'
}

const handleCreatedRule = (rule) => {
  selectedRule.value = rule
  showCreateModal.value = false
  selectedType.value = 'custom'
}

const removeRule = () => selectedRule.value = null

const createGame = async () => {
  try {
    if (!selectedRule.value) {
      showToast('경기 규칙을 선택하거나 생성해주세요.')
      return
    }
    const payload = {
      ...form.value,
      matchDate: form.value.matchDate || null,
      placeRoad: form.value.placeRoad || null,
      placeDetail: form.value.placeDetail || null,
      referencedRuleId: selectedRule.value.id,
    }
    await api.post('/api/games/create', payload)
    showToast('게임이 생성되었습니다!')
    router.push('/game-list')
  } catch (err) {
    console.error('게임 생성 실패', err)
    showToast('게임 생성 실패. 입력값을 확인해주세요.')
  }
}

const openAddressSearch = () => {
  const postcode = new window.daum.Postcode({
    oncomplete: function (data) {
      form.value.placeRoad = data.roadAddress || data.jibunAddress
      nextTick(() => {
        const detailInput = document.getElementById('place-detail')
        if (detailInput) detailInput.focus()
      })
      window.close()
    }
  })
  postcode.open()
}

onMounted(async () => {
  // 만약 ruleId 쿼리가 있으면 해당 규칙을 찾아 selectedRule에 할당
  const ruleId = route.query.ruleId
  if (ruleId) {
    // 이미 ruleList를 갖고 있다면 아래처럼 id로 할당
    // (없다면 api에서 규칙 단건 조회)
    let found = null
    // 1. ruleList에서 찾기
    // found = ruleList.value.find(r => r.id === Number(ruleId))
    // 2. 또는 API 호출
    try {
      const res = await api.get(`/api/rules/${ruleId}`)
      found = res.data
    } catch {console.log("룰조회실패")}
    if (found) selectedRule.value = found
  }
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.25s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
