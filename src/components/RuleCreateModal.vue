<!-- RuleCreateModal.vue -->
<template>
  <div class="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center ">
    <div class="bg-white w-[90%] max-h-[95%] overflow-auto max-w-md rounded-2xl p-6 shadow-2xl animate-fade-in space-y-6 relative pt-8">
      <button @click="$emit('close')" class="absolute top-4 right-4 text-gray-600 hover:text-black text-[2rem] font-bold">×</button>
      <h2 class="text-lg font-md text-gray-900 tracking-tight mb-2 flex items-center gap-2">
        <i class="fas fa-bolt text-orange-500"></i>
        규칙 생성하기
      </h2>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">규칙 설명</label>
          <textarea 
            v-model="form.ruleDescription" 
            class="modern-input text-sm" 
            rows="3" 
            maxlength="500"
            placeholder="게임 규칙을 입력하세요" 
          />
          <div class="flex justify-between  items-center">
            <div class="text-gray-400 font-[400] text-[0.7rem]">
              규칙 설명은 최대한 구체적으로 작성해주세요.
            </div>
            <div class="text-xs text-gray-500 text-right mt-1">
              {{ form.ruleDescription.length }} / 500
            </div>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">세트 승리 점수</label>
          <div class="relative flex items-center" >
            <input :value="pointsUnlimited ? '제한 없음' : form.pointsToWin" @input="handlePointsInput" type="text" class="modern-input pr-28 text-xs " :disabled="pointsUnlimited" placeholder="점수를 입력하세요" />
            <button type="button" @click="togglePointsUnlimited" class="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-2 rounded-full text-xs font-semibold transition" :class="pointsUnlimited ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'">
              {{ pointsUnlimited ? '제한 없음' : '직접 입력' }}
            </button>
          </div>
          <div class="text-gray-400 font-[400] text-[0.7rem] mt-2">
            ‘제한없음’으로 설정된 경우 세트 시간 종료시까지 세트가 진행됩니다.
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">총 세트(과반 세트 승리 시 경기 승리)</label>
          <input v-model.number="form.setsToWin" type="number" class="modern-input text-xs" min="1" placeholder="세트 수 입력" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">세트 제한시간 (초)</label>
          <div class="relative flex items-center">
            <input :value="timeUnlimited ? '제한 없음' : form.duration" @input="handleTimeInput" type="text" class="modern-input pr-28 text-xs" :disabled="timeUnlimited" placeholder="시간을 입력하세요" />
            <button type="button" @click="toggleTimeUnlimited" class="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-2 rounded-full text-xs font-semibold transition" :class="timeUnlimited ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'">
              {{ timeUnlimited ? '제한 없음' : '직접 입력' }}
            </button>
          </div>
          <div class="text-gray-400 font-[400] text-[0.7rem] mt-2">
            ‘제한없음’으로 설정된 경우 세트 승리 점수 도달시까지 세트가 진행됩니다.
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">세트 승리 기준</label>
          <select v-model="form.winBy" class="modern-input text-xs">
            <option disabled value="">기준 선택</option>
            <option value="SETS_HALF_WIN" :disabled="disableHalfWin">승리 점수 달성 (미달성 시 무승부)</option>
            <option value="MOST_SETS_AND_POINTS" :disabled="disableMostPoints">시간 도달 (동점 시 무승부)</option>
          </select>
        </div>
        <div v-if="invalidMessage" class="mt-2 px-3 py-4 bg-red-100 text-red-600 text-xs rounded-md border border-red-300">
          ⚠️ {{ invalidMessage }}
        </div>
        <div>
          <div class="pb-3 font-sm text-gray-600 text-[0.73rem]">
            [규칙 제목]과 [카테고리]는 입력한 설명을 바탕으로 AI로 자동생성 됩니다.
          </div>
          <button type="submit" :disabled="loading || !isValid" class="w-full bg-orange-500 text-white py-2 rounded-[5px] font-semibold shadow hover:brightness-110 transition disabled:opacity-50">
            {{ loading ? '생성 중...' : '생성하기' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, defineEmits } from 'vue'
import api from '../api/api'

const emit = defineEmits(['created', 'close'])

const form = ref({
  ruleDescription: '',
  pointsToWin: -1,
  setsToWin: 1,
  duration: -1,
  winBy: ''
})

const pointsUnlimited = ref(true)
const timeUnlimited = ref(true)
const disableHalfWin = ref(false)
const disableMostPoints = ref(false)
const loading = ref(false)

const togglePointsUnlimited = () => {
  pointsUnlimited.value = !pointsUnlimited.value
  if (pointsUnlimited.value) form.value.pointsToWin = -1
  validateRuleOptions()
}

const toggleTimeUnlimited = () => {
  timeUnlimited.value = !timeUnlimited.value
  if (timeUnlimited.value) form.value.duration = -1  
  validateRuleOptions()
}

const handlePointsInput = (e) => {
  form.value.pointsToWin = parseInt(e.target.value) || 0
  validateRuleOptions()
}

const handleTimeInput = (e) => {
  form.value.duration = parseInt(e.target.value) || 0
  validateRuleOptions()
}

const validateRuleOptions = () => {
  const points = form.value.pointsToWin
  const time = form.value.duration

  disableHalfWin.value = points === -1
  disableMostPoints.value = time === -1

  if (points === -1 && time !== -1) form.value.winBy = 'MOST_SETS_AND_POINTS'
  if (time === -1 && points !== -1) form.value.winBy = 'SETS_HALF_WIN'
  if (points === -1 && time === -1) form.value.winBy = ''
}

watch(() => form.value.pointsToWin, validateRuleOptions)
watch(() => form.value.duration, validateRuleOptions)

const invalidMessage = computed(() => {
  if (form.value.ruleDescription.length < 1) return '규칙 설명을 입력하세요.'
  if (form.value.setsToWin < 1) return '세트 수는 1 이상이어야 합니다.'
  if (form.value.pointsToWin === 0 || form.value.duration === 0) return '점수 및 시간은 0일 수 없습니다.'
  if (form.value.pointsToWin === -1 && form.value.duration === -1) return '점수와 시간을 동시에 -1로 설정할 수 없습니다.'
  if (!form.value.winBy) return '세트 승리 기준을 선택하세요.'
  return ''
})

const isValid = computed(() => invalidMessage.value === '')

const handleSubmit = async () => {
  if (!isValid.value || loading.value) return
  loading.value = true
  try {
    const dto = { referencedRuleId: null, ...form.value }
    const { data } = await api.post('/api/rules', dto)
    emit('created', data)
  } catch (e) {
    alert('규칙 생성 실패. 입력값을 확인하세요.')
  }
  loading.value = false
}
</script>

<style scoped>
@keyframes fade-in {
  0% { opacity: 0; transform: scale(0.95); }
  100% { opacity: 1; transform: scale(1); }
}
.animate-fade-in {
  animation: fade-in 0.4s ease forwards;
}
.modern-input {
  @apply w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400;
}
</style>
