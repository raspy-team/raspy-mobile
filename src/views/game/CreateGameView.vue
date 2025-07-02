<template>
  <Header title="게임 생성" hasReferer="1"></Header>
  <div class="pb-8 max-w-xl mx-auto">
    <div class="min-h-screen bg-gray-50 pt-4">
      <!-- Status Bar -->
      <div class="bg-white h-6 w-full"></div>
      <!-- Main Form -->
      <main class="pt-6 px-6 pb-24">
        <!-- Game Type Selection -->
        <div class="mb-6 mt-8">
          <label class="block text-sm font-medium text-gray-700 mb-2">경기 규칙</label>
          <div class="flex space-x-3 mb-4">
            <button
              class="flex-1 py-3 rounded-xl border-2 transition-all !rounded-button"
              :class="'border-gray-200 bg-white'"
              @click="openRuleSelect" 
            >
              <div class="flex flex-col items-center">
                <i
                  class="fas fa-book-open text-xl mb-2"
                  :class="'text-gray-400'"
                ></i>
                <span
                  class="text-sm font-medium"
                  :class="'text-gray-600'"
                  >규칙 선택하기</span
                >
              </div>
            </button>
            <button
              class="flex-1 py-3 rounded-xl border-2 transition-all !rounded-button"
              :class="'border-gray-200 bg-white'"
              @click="openRuleCreate" 
            >
              <div class="flex flex-col items-center">
                <i
                  class="fas fa-plus text-xl mb-2"
                  :class="selectedType === 'custom' ? 'text-orange-500' : 'text-gray-400'"
                ></i>
                <span
                  class="text-sm font-medium"
                  :class="selectedType === 'custom' ? 'text-orange-500' : 'text-gray-600'"
                  >새로운 규칙</span
                >
              </div>
            </button>
          </div>
        </div>
        <!-- 룰 정보 -->
        <div v-if="selectedRule" class="border bg-white border-gray-200 p-4 rounded-[5px] mb-3 pt-4 flex flex-col gap-1 relative">
          <span class="absolute right-0 top-0 bg-[#f97316] text-white font-bold text-[0.8rem] px-4 py-1" style="border-radius :0px 0px 0px 8px">
            게임 규칙
          </span>
          <div class="mb-3">
            {{ selectedRule.ruleTitle }}
          </div>
          <p class="text-sm text-gray-700 mt-1">{{ selectedRule.ruleDescription }}</p>
          <div class="text-sm text-gray-600 mb-2 mt-2 flex flex-col gap-1 mt-5">
            <div class="flex items-start mb-2">
              <i class="fas fa-trophy text-[#f97316] w-4 mr-2 mt-1"></i>
              <div class="w-[30dvw] font-light text-gray-500">
                승리 조건
              </div>
              <div class="text-[0.88rem] w-[40dvw] ">
                {{ selectedRule.winBy=='SETS_HALF_WIN' ? '승리 점수 달성' : '제한 시간동안 더 많은 점수 획득' }}
              </div>
            </div>
            <div class="flex items-center mb-2">
              <i class="fas fa-star text-[#f97316] w-4 mr-2"></i>
              <div class="w-[30dvw] font-light text-gray-500">
                세트 승리 점수
              </div>
              <div>
                {{ selectedRule.pointsToWin == -1 ? '제한 없음' : selectedRule.pointsToWin +'점' }}
              </div>
            </div>
            <div class="flex items-center mb-2">
              <i class="fas fa-layer-group text-[#f97316] w-4 mr-2"></i>
              <div class="w-[30dvw] font-light text-gray-500">
                총 세트
              </div>
              <div>
                {{ selectedRule.setsToWin }}세트
              </div>
            </div>
            <div class="flex items-center">
              <i class="fas fa-clock text-[#f97316] w-4 mr-2"></i>
              <div class="w-[30dvw] font-light text-gray-500">
                세트 제한시간
              </div>
              <div>
                {{ selectedRule.duration == -1 ? '제한 없음' : (selectedRule.duration >= 60 ? Math.floor(selectedRule.duration / 60) + '분 ' + (selectedRule.duration % 60) + '초' : selectedRule.duration + '초') }}
              </div>
            </div>
          </div>
          <div class="text-right">
            <button @click="confirmRemove" class="mt-2 text-xs text-red-500 hover:underline">선택 취소</button>
          </div>
        </div>

        <form @submit.prevent="createGame">
          <!-- Match Details -->
          <div class="space-y-6">
            <!-- Date & Time -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">경기 일시</label>
              <div class="bg-white rounded-xl border border-gray-200 p-3">
                <div class="flex items-center">
                  <i class="far fa-calendar text-orange-500 mr-3"></i>
                  <input
                    v-model="form.matchDate"
                    type="datetime-local"
                    class="flex-1 text-gray-700 text-sm"
                  />
                </div>
              </div>
              <p class="text-xs text-gray-400 mt-1">경기 시작 시간을 설정하세요 (미입력 시 협의결정)</p>
            </div>
            <!-- Location -->
            <div @click="openAddressSearch">
              <label class="block text-sm font-medium text-gray-700 mb-2">경기 장소</label>
              <div class="flex items-center p-3 bg-white rounded-xl border border-gray-200">
                <i class="far fa-calendar text-orange-500"></i>
                <input v-model="form.placeRoad" readonly style="box-shadow:none" class=" text-sm input flex-1 bg-white border-none shadow-[0px] outline-none cursor-not-allowed"
                  placeholder="도로명 주소 입력" />
              </div>
              <p class="text-xs text-gray-400 mt-1">도로명 주소를 입력하세요 (미입력 시 협의결정)</p>
            </div>
            <!-- Detailed Address -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">상세주소</label>
              <div class=" rounded-xl border p-3 "
                :class="!form.placeRoad ? 'bg-gray-100 text-[#ededed] cursor-not-allowed':'bg-white  border-gray-200'">
                <input
                  v-model="form.placeDetail"
                  placeholder="상세주소 입력"
                  :disabled="!form.placeRoad"
                  class="w-full text-sm text-gray-700 resize-none py-1 outline-none"
                />
              </div>
              <p class="text-xs text-gray-500 mt-1">
                예: ○○빌딩 3층, ○○체육관
              </p>
            </div>
          </div>
          <div class="fixed bottom-4 w-dvw left-0 p-5">
            <button type="submit"
              :disabled="!selectedRule"
              class="w-full bg-orange-500 text-white py-3 rounded hover:bg-blue-700 disabled:opacity-50">
              게임 생성
            </button>
          </div>
        </form>
      </main>
    </div>
  </div>
  <!-- 모달들 -->
  <RuleSelectModal v-if="showSelectModal" @select="selectRule" @close="showSelectModal = false" />
  <RuleCreateModal v-if="showCreateModal" @created="handleCreatedRule" @close="showCreateModal = false" />
  <CustomToast />
</template>

<script setup>
import { ref, nextTick } from 'vue'
import api from '../../api/api'
import { useToast } from '../../composable/useToast'
import { useRouter } from 'vue-router'
import CustomToast from '../../components/CustomToast.vue'
import RuleSelectModal from '../../components/RuleSelectModal.vue'
import RuleCreateModal from '../../components/RuleCreateModal.vue'
import Header from "../../components/HeaderComp.vue"

const router = useRouter()
const { showToast } = useToast()

const confirmRemove = () => {
  if (confirm('규칙 선택을 취소하시겠습니까?')) {
    removeRule()
  }
}

const form = ref({
  matchDate: '',
  placeRoad: '',
  placeDetail: ''
})

const selectedRule = ref(null)
const showSelectModal = ref(false)
const showCreateModal = ref(false)
const selectedType = ref('rules') // 'rules' | 'custom'

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
      referencedRuleId: selectedRule.value.id, // 반드시 백엔드에서 RuleEntity.id로 저장
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
  new window.daum.Postcode({
    oncomplete: function (data) {
      form.value.placeRoad = data.roadAddress || data.jibunAddress
      nextTick(() => {
        const detailInput = document.getElementById('place-detail')
        if (detailInput) detailInput.focus()
      })
    }
  }).open()
}
</script>

<style scoped>
.input {
  @apply w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500;
}
</style>
