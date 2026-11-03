<template>
  <!-- 대표 종목 고르기: 규칙 이름으로 찾는다 (만나서 하는 경기 규칙만) -->
  <div>
    <UiInput v-model="q" placeholder="규칙 이름 (예: 탁구)" @update:model-value="search" />
    <UiList v-if="results.length" class="mt-2">
      <UiListItem v-for="r in results" :key="r.id" :title="r.ruleTitle" :subtitle="r.minorCategory || undefined" @click="emit('pick', { id: r.id, title: r.ruleTitle })" />
    </UiList>
    <p v-else-if="q.trim().length >= 1 && !loading" class="t-caption mt-2">맞는 규칙이 없어요</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { GET } from '@/api/client'
import type { components } from '@/api/schema'
import { UiInput, UiList, UiListItem } from '../ui'

const emit = defineEmits<{ pick: [rule: { id: number; title: string }] }>()
const q = ref('')
const loading = ref(false)
const results = ref<components['schemas']['FullRuleResponse'][]>([])
let timer: ReturnType<typeof setTimeout> | undefined

function search() {
  clearTimeout(timer)
  timer = setTimeout(async () => {
    const term = q.value.trim()
    if (!term) return (results.value = [])
    loading.value = true
    try {
      results.value = ((await GET('/api/rules/list', { query: { search: term, withApp: false } })).data || []).slice(0, 8)
    } finally {
      loading.value = false
    }
  }, 250)
}
</script>
