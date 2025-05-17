<template>
  <div class="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
    <div class="bg-white w-full max-w-md rounded-lg p-6 shadow-lg">
      <h2 class="text-lg font-semibold text-gray-800 mb-4">📚 규칙 선택</h2>

      <div v-if="loading" class="text-center text-gray-500">불러오는 중...</div>
      <div v-else-if="rules.length === 0" class="text-center text-gray-400">등록된 규칙이 없습니다</div>

      <ul class="space-y-4 max-h-96 overflow-y-auto">
        <li v-for="rule in rules" :key="rule.id"
            class="border p-4 rounded hover:bg-gray-50 cursor-pointer transition"
            @click="selectRule(rule)">
          <p class="text-sm text-gray-700 whitespace-pre-line">{{ rule.ruleDescription }}</p>
          <p class="text-xs text-gray-500 mt-1">
            점수: {{ rule.pointsToWin }} / 세트: {{ rule.setsToWin }} / 시간: {{ rule.duration }}초 / 승리 조건: {{ rule.winBy }}
          </p>
        </li>
      </ul>

      <div class="text-right mt-4">
        <button @click="$emit('close')" class="text-sm text-gray-500 hover:underline">닫기</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted , defineEmits} from 'vue'
import api from '../api/api'

const rules = ref([])
const loading = ref(true)

const emit = defineEmits(['select', 'close'])

const fetchRules = async () => {
  try {
    const res = await api.get('/api/rules/list')
    rules.value = res.data
  } catch (err) {
    console.error('규칙 목록 로드 실패', err)
  } finally {
    loading.value = false
  }
}

const selectRule = (rule) => {
  emit('select', {
    referencedRuleId: rule.id
  })
}

onMounted(fetchRules)
</script>
