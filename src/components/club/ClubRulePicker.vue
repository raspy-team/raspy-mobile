<template>
  <!-- 대표 종목 고르기: 규칙 이름으로 찾는다 (만나서 하는 경기 규칙만. 대회는 withApp으로 앱 게임까지) -->
  <div>
    <!-- 고른 뒤에도 입력 칸과 후보가 남아 골랐는지 몰랐다 (경로 7 리뷰 K12): 고르면 고른 이름 한 줄 + 바꾸기 -->
    <div v-if="chosen" class="flex items-center gap-2 rounded-xl bg-surface-2 px-4 py-3">
      <UiIcon name="check" class="text-primary" aria-hidden="true" />
      <span class="t-body text-fg flex-1 min-w-0 truncate">{{ chosen }}</span>
      <button type="button" class="t-caption underline underline-offset-2" @click="chosen = ''">바꾸기</button>
    </div>
    <template v-else>
      <UiInput v-model="q" placeholder="규칙 이름 (예: 탁구)" @update:model-value="search" />
      <UiList v-if="results.length" class="mt-2">
        <UiListItem v-for="r in results" :key="r.id" :title="r.ruleTitle" :subtitle="r.minorCategory || undefined" @click="choose(r)" />
      </UiList>
      <p v-else-if="failed && !loading && !typing" class="t-caption text-danger mt-2">찾지 못했어요. 다시 쳐 주세요</p>
      <!-- 치는 동안(검색 전) '없어요'가 먼저 깜빡였다: 찾기가 끝난 뒤에만 -->
      <p v-else-if="q.trim().length >= 1 && !loading && !typing && searched" class="t-caption mt-2">맞는 규칙이 없어요</p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { GET } from '@/api/client'
import type { components } from '@/api/schema'
import { UiIcon, UiInput, UiList, UiListItem } from '../ui'

const props = defineProps<{ withApp?: boolean }>()
const emit = defineEmits<{ pick: [rule: { id: number; title: string; appGameKey: string | null }] }>()
const q = ref('')
const loading = ref(false)
const failed = ref(false)
const results = ref<components['schemas']['FullRuleResponse'][]>([])
let timer: ReturnType<typeof setTimeout> | undefined

const chosen = ref('')
const typing = ref(false)
const searched = ref(false)
function choose(r: components['schemas']['FullRuleResponse']) {
  chosen.value = r.ruleTitle
  emit('pick', { id: r.id, title: r.ruleTitle, appGameKey: r.appGameKey ?? null })
}
function search() {
  clearTimeout(timer)
  typing.value = true
  timer = setTimeout(async () => {
    typing.value = false
    const term = q.value.trim()
    if (!term) { searched.value = false; return (results.value = []) }
    loading.value = true
    searched.value = true
    try {
      results.value = ((await GET('/api/rules/list', { query: { search: term, withApp: props.withApp ?? false } })).data || []).slice(0, 8)
      failed.value = false
    } catch {
      // 실패하면 이전 이름의 결과를 남기지 않는다 (새로 친 이름의 결과인 줄 알았다, 목적 판정 8)
      results.value = []
      failed.value = true
    } finally {
      loading.value = false
    }
  }, 250)
}
</script>
