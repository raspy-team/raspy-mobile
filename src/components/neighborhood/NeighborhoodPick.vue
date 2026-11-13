<template>
  <!-- 동네 이름으로 고르기 (11/13 앱 기능 좁히기: GPS 없이도 바로 경기를 열고 신청한다. '동네 인증 ✓'은 GPS로 인증할 때만) -->
  <div>
    <UiInput v-model="q" label="동네 이름" placeholder="예: 합정, 회기, 신촌" autocomplete="off" @update:model-value="search" />
    <p v-if="error" class="t-caption text-danger-fg mt-2">{{ error }}</p>
    <UiList v-if="options.length" class="mt-2">
      <UiListItem v-for="o in options" :key="o.code" :title="o.name" chevron :disabled="busy" @click="pick(o.code)" />
    </UiList>
    <p v-else-if="searched && q.trim().length >= 1" class="t-caption mt-2">그런 동네를 찾지 못했어요. 다른 이름으로 쳐 보세요</p>
    <!-- 이미 2개면 바꿀 동네를 고른다 -->
    <template v-if="needReplace">
      <p class="t-body mt-5">동네는 {{ maxCount }}개까지예요. 어느 동네를 바꿀까요?</p>
      <div class="flex flex-wrap gap-2 mt-2">
        <UiButton v-for="n in current" :key="n.code" variant="secondary" size="sm" :loading="busy" @click="pick(pending!, n.code)">{{ n.name }} 대신</UiButton>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import api from '../../api/api'
import type { components } from '@/api/schema'
import { UiButton, UiInput, UiList, UiListItem } from '../ui'

type Mine = components['schemas']['MyNeighborhoods']
const props = defineProps<{ current: Mine['neighborhoods']; maxCount: number }>()
const emit = defineEmits<{ (e: 'picked', next: Mine): void }>()

const q = ref('')
const options = ref<{ code: string; name: string }[]>([])
const searched = ref(false)
const busy = ref(false)
const error = ref('')
const needReplace = ref(false)
const pending = ref<string | null>(null)

let seq = 0
async function search() {
  const term = q.value.trim()
  error.value = ''
  needReplace.value = false
  if (!term) {
    options.value = []
    searched.value = false
    return
  }
  const mine = ++seq
  const r = await api.get('/api/partner-requests/dongs', { params: { q: term } }).catch(() => null)
  if (mine !== seq) return // 늦게 온 앞 검색은 버린다
  options.value = r?.data ?? []
  searched.value = true
}

async function pick(code: string, replaceCode?: string) {
  error.value = ''
  // 이미 2개인데 새 동네면 바꿀 동네부터 묻는다
  if (!replaceCode && props.current.length >= props.maxCount && !props.current.some((n) => n.code === code)) {
    pending.value = code
    needReplace.value = true
    return
  }
  busy.value = true
  try {
    const { data } = await api.post('/api/neighborhoods/pick', { code, replaceCode })
    needReplace.value = false
    emit('picked', data)
  } catch (e) {
    error.value = (e as { response?: { data?: { message?: string } } }).response?.data?.message || '동네를 고르지 못했어요'
  } finally {
    busy.value = false
  }
}
</script>
