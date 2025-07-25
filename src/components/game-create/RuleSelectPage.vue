<template>
  <div class="flex flex-col min-h-screen px-5 pt-10">
    <div class="flex items-center mb-4">
      <button @click="$emit('back')" class="text-xl mr-2 text-gray-400">&lt;</button>
      <span class="text-xl font-bold text-gray-900">기존 규칙 선택</span>
    </div>
    <input
      v-model="search"
      placeholder="키워드로 검색"
      class="w-full bg-gray-100 border-none rounded-lg px-3 py-3 text-sm font-medium focus:ring-2 focus:ring-orange-300 transition outline-none mb-4"
    />
    <div v-if="loading" class="text-center py-10">
      <i class="fas fa-spinner fa-spin text-2xl text-orange-400"></i>
    </div>
    <ul v-else>
      <li
        v-for="rule in filteredRules"
        :key="rule.id"
        class="bg-white rounded-xl border p-4 mb-3 shadow-sm flex flex-col gap-1"
      >
        <span class="text-base font-bold text-gray-900">{{ rule.ruleTitle }}</span>
        <span class="text-sm text-orange-500"
          >{{ rule.majorCategory }} &gt; {{ rule.minorCategory }}</span
        >
        <p class="text-sm text-gray-500 mb-2">{{ rule.ruleGoal }}</p>
        <button
          class="w-full py-2 bg-orange-500 text-white rounded-xl mt-1"
          @click="$emit('select', rule)"
        >
          선택
        </button>
      </li>
    </ul>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../api/api'
const rules = ref([])
const loading = ref(false)
const search = ref('')
const filteredRules = computed(() =>
  search.value
    ? rules.value.filter(
        (r) => r.ruleTitle.includes(search.value) || r.ruleGoal.includes(search.value),
      )
    : rules.value,
)
onMounted(async () => {
  loading.value = true
  const res = await api.get('/api/rules/list')
  rules.value = res.data
  loading.value = false
})
</script>
