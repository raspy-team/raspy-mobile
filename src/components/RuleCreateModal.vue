<template>
  <div class="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
    <div class="bg-white w-full max-w-md rounded-lg p-6 shadow-lg">
      <h2 class="text-lg font-semibold text-gray-800 mb-4">🛠 규칙 생성</h2>

      <form @submit.prevent="emitRule" class="space-y-5">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">규칙 설명</label>
          <textarea v-model="form.ruleDescription" class="input" rows="3" required />
          <p class="text-xs text-gray-400 mt-1">게임의 규칙 내용을 간단하고 명확하게 작성해주세요.</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">승리 조건 점수</label>
          <input v-model.number="form.pointsToWin" type="number" class="input" required min="-1" @input="validateRuleOptions" />
          <p class="text-xs text-gray-400 mt-1">-1을 입력하면 점수 제한 없이 진행됩니다.</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">필요 세트 수</label>
          <input v-model.number="form.setsToWin" type="number" class="input" required min="1" />
          <p class="text-xs text-gray-400 mt-1">최소 1 이상이어야 합니다.</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">게임 시간</label>
          <input v-model.number="form.duration" type="number" class="input" required min="-1" @input="validateRuleOptions" />
          <p class="text-xs text-gray-400 mt-1">-1 입력 시 시간 제한 없이 진행됩니다.</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">세트 승리 기준</label>
          <select v-model="form.winBy" class="input" required>
            <option disabled value="">승리 기준 선택</option>
            <option value="SETS_HALF_WIN" :disabled="disableHalfWin" :class="{ 'text-gray-400': disableHalfWin }">
              승리 조건 점수 달성 (미달성 시 무승부)
            </option>
            <option value="MOST_SETS_AND_POINTS" :disabled="disableMostPoints" :class="{ 'text-gray-400': disableMostPoints }">
              제한 시간동안 더 많은 점수 획득 (동점 시 무승부)
            </option>
          </select>
          <p class="text-xs text-gray-400 mt-1">게임 종료 시점의 승패 판정 기준을 설정합니다.</p>
        </div>

        <div class="text-red-500 text-sm mt-2" v-if="invalidMessage">
          ⚠️ {{ invalidMessage }}
        </div>

        <p class="text-xs text-gray-400 mt-4 text-center">
          ⚠️ 규칙 제목과 카테고리는 AI가 자동으로 분석하여 배정됩니다.
        </p>

        <div class="flex justify-between items-center mt-4">
          <button type="submit"
                  :disabled="!isValid"
                  class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
            생성하기
          </button>
          <button type="button" @click="$emit('close')" class="text-sm text-gray-500 hover:underline">
            닫기
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, defineEmits } from 'vue'

const emit = defineEmits(['created', 'close'])

const form = ref({
  ruleDescription: '',
  pointsToWin: -1,
  setsToWin: 1,
  duration: -1,
  winBy: ''
})

const disableHalfWin = ref(false)
const disableMostPoints = ref(false)

const validateRuleOptions = () => {
  const points = form.value.pointsToWin
  const time = form.value.duration

  if ((points === -1 && time === -1) || points === 0 || time === 0) {
    disableHalfWin.value = true
    disableMostPoints.value = true
    form.value.winBy = ''
    return
  }

  if (points === -1) {
    disableHalfWin.value = true
    disableMostPoints.value = false
    form.value.winBy = 'MOST_SETS_AND_POINTS'
  } else if (time === -1) {
    disableHalfWin.value = false
    disableMostPoints.value = true
    form.value.winBy = 'SETS_HALF_WIN'
  } else {
    disableHalfWin.value = false
    disableMostPoints.value = false
  }
}

watch(() => form.value.pointsToWin, validateRuleOptions)
watch(() => form.value.duration, validateRuleOptions)

const invalidMessage = computed(() => {
  const descLen = form.value.ruleDescription.length
  const points = form.value.pointsToWin
  const time = form.value.duration
  const sets = form.value.setsToWin
  const winBy = form.value.winBy

  if (descLen < 1 || descLen > 500) return '규칙 설명은 1자 이상 500자 이하여야 합니다.'
  if (sets < 1) return '필요 세트 수는 최소 1 이상이어야 합니다.'
  if (points === 0 || time === 0) return '승리 조건 점수와 게임 시간은 0일 수 없습니다.'
  if (points === -1 && time === -1) return '승리 조건 점수와 게임 시간은 동시에 -1일 수 없습니다.'
  if (!winBy) return '세트 승리 기준을 선택해야 합니다.'

  return ''
})

const isValid = computed(() => invalidMessage.value === '')

const emitRule = () => {
  if (isValid.value) {
    emit('created', {
      referencedRuleId: null,
      ...form.value
    })
  }
}
</script>

<style scoped>
.input {
  @apply w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500;
}
</style>
