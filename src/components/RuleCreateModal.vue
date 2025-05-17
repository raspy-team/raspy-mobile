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
          <input v-model.number="form.pointsToWin" type="number" class="input" required />
          <p class="text-xs text-gray-400 mt-1">-1을 입력하면 점수 제한 없이 진행됩니다.</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">필요 세트 수</label>
          <input v-model.number="form.setsToWin" type="number" class="input" required />
          <p class="text-xs text-gray-400 mt-1">최소 1 이상이어야 합니다.</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">게임 시간</label>
          <input v-model.number="form.duration" type="number" class="input" required />
          <p class="text-xs text-gray-400 mt-1">-1 입력 시 시간 제한 없이 진행됩니다.</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">승리 판정 기준</label>
          <select v-model="form.winBy" class="input" required>
            <option disabled value="">승리 조건 선택</option>
            <option value="SETS_HALF_WIN">세트 과반 승리</option>
            <option value="MOST_SETS_AND_POINTS">최다 세트 + 점수</option>
          </select>
          <p class="text-xs text-gray-400 mt-1">게임 종료 시점의 승패 판정 기준을 설정합니다.</p>
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
import { computed, ref, defineEmits } from 'vue'

const emit = defineEmits(['created', 'close'])

const form = ref({
  ruleDescription: '',
  pointsToWin: -1,
  setsToWin: 1,
  duration: -1,
  winBy: ''
})

const isValid = computed(() => {
  return (
    form.value.ruleDescription.length >= 1 &&
    form.value.ruleDescription.length <= 500 &&
    form.value.setsToWin >= 1 &&
    form.value.duration >= -1 &&
    form.value.pointsToWin >= -1 &&
    form.value.winBy
  )
})

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
