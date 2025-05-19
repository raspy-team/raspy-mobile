<template>
  <Header></Header>
  <div class="pt-20 pb-8 px-5 max-w-xl mx-auto">
    <h2 class="text-2xl font-bold mb-6 text-center">게임 생성</h2>

    <!-- 규칙 선택 영역 -->
    <div class="mb-6">
      <label class="block mb-2 text-sm font-medium text-gray-700">🎯 경기 규칙</label>

      <div v-if="selectedRule" class="bg-gray-100 p-4 rounded mb-3">
        <p class="text-sm text-gray-600 whitespace-pre-line">{{ selectedRule.ruleDescription }}</p>
        <p class="text-xs text-gray-500 mt-2">
          점수: {{ selectedRule.pointsToWin }} / 세트: {{ selectedRule.setsToWin }} /
          시간: {{ selectedRule.duration }}초 / 승리 조건: {{ selectedRule.winBy=='SETS_HALF_WIN' ? '과반 세트 승리' : '최다 세트/점수 획득' }}
        </p>
        <button @click="removeRule" class="mt-2 text-xs text-red-500 hover:underline">선택 취소</button>
      </div>

      <div class="flex space-x-2">
        <button @click="openRuleSelect" :disabled="selectedRule"
                class="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded disabled:opacity-50">
          규칙 선택
        </button>
        <button @click="openRuleCreate" :disabled="selectedRule"
                class="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 rounded disabled:opacity-50">
          규칙 생성
        </button>
      </div>
    </div>

    <!-- 게임 생성 폼 -->
    <form @submit.prevent="createGame" class="space-y-5">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">경기 일시</label>
        <input v-model="form.matchDate" type="datetime-local" class="input" />
        <p class="text-xs text-gray-400 mt-1">경기 시작 시간을 설정하세요 (미입력 시 협의결정)</p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">경기 장소</label>
        <div class="flex space-x-2">
          <input v-model="form.placeRoad" readonly class="input flex-1 bg-gray-100 cursor-not-allowed" />
          <button type="button"
                  @click="openAddressSearch"
                  class="px-3 py-2 bg-indigo-500 text-white text-sm rounded hover:bg-indigo-600">
            주소 검색
          </button>
        </div> 
        <p class="text-xs text-gray-400 mt-1">도로명 주소를 선택하세요 (미입력 시 협의결정)</p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">상세 주소</label>
        <input id="place-detail" v-model="form.placeDetail" class="input" placeholder="상세 주소" />
        <p class="text-xs text-gray-400 mt-1">예: ○○빌딩 3층, ○○체육관</p>
      </div>

      <button type="submit"
              :disabled="!selectedRule"
              class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50">
        게임 생성
      </button>
    </form>

    <!-- 모달들 -->
    <RuleSelectModal v-if="showSelectModal" @select="selectRule" @close="showSelectModal = false" />
    <RuleCreateModal v-if="showCreateModal" @created="selectRule" @close="showCreateModal = false" />

    <CustomToast />
  </div>

  <Footer tab="create-game" />
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
import Footer from "../../components/FooterNav.vue"
const router = useRouter()
const { showToast } = useToast()

const form = ref({
  matchDate: '',
  placeRoad: '',
  placeDetail: ''
})

const selectedRule = ref(null)
const showSelectModal = ref(false)
const showCreateModal = ref(false)

const openRuleSelect = () => showSelectModal.value = true
const openRuleCreate = () => showCreateModal.value = true

const selectRule = (rule) => {
  selectedRule.value = rule
  showSelectModal.value = false
  showCreateModal.value = false
}

const removeRule = () => selectedRule.value = null

const createGame = async () => {
  try {
    const payload = {
      ...form.value,
      matchDate: form.value.matchDate || null,
      ...selectedRule.value
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
