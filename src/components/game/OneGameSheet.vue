<template>
  <!-- '한 판 붙자' (11/13 도전 하나로): 사람에게 게임 하나로 보낸다. 받으면 1:1 경기가 된다.
       앱 게임은 내가 먼저 한 판 하고 같은 문제로 보내고(AppGameView ?to=), 만나서 하는 경기는 그 규칙으로 신청한다(나랑도해) -->
  <UiSheet :model-value="modelValue" :title="`${name}님과 한 판`" @update:model-value="emit('update:modelValue', $event)">
    <UiListSkeleton v-if="loading" :rows="4" />
    <template v-else>
      <p class="t-label mb-2">폰으로</p>
      <UiList>
        <UiListItem
          v-for="g in games"
          :key="g.key"
          :title="g.title"
          :subtitle="g.summary"
          chevron
          @click="playApp(g.key)"
        >
          <template #leading><RuleThumb :rule="{ ruleTitle: g.title, appGameKey: g.key }" :size="36" bare /></template>
        </UiListItem>
      </UiList>
      <template v-if="rules.length">
        <p class="t-label mt-6 mb-2">만나서 ({{ name }}님이 많이 한 규칙)</p>
        <UiList>
          <UiListItem v-for="r in rules" :key="r.ruleId" :title="r.ruleTitle" chevron :disabled="sending" @click="sendOffline(r.ruleId)">
            <template #leading><RuleThumb :rule="r" :size="36" bare /></template>
          </UiListItem>
        </UiList>
      </template>
      <!-- 여기 없는 종목으로도 (11/14 폰으로 한 바퀴): 상대가 많이 한 규칙 셋만 나와, 다른 종목으로 붙자고 할 길이 없었다 -->
      <p class="t-label mt-6 mb-2">다른 종목으로</p>
      <UiInput v-model="q" placeholder="종목·규칙 이름 (예: 탁구)" />
      <UiList v-if="found.length" class="mt-2">
        <UiListItem v-for="r in found" :key="r.id" :title="r.ruleTitle" chevron :disabled="sending" @click="sendOffline(r.id)">
          <template #leading><RuleThumb :rule="r" :size="36" bare /></template>
        </UiListItem>
      </UiList>
      <p v-else-if="q.trim().length >= 1 && searched" class="t-caption mt-2">그런 규칙이 없어요. 규칙은 홈의 +에서 만들 수 있어요</p>
    </template>
  </UiSheet>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { GET } from '@/api/client'
import api, { playWithMeTooAPI } from '../../api/api'
import RuleThumb from '../rule/RuleThumb.vue'
import { UiInput, UiList, UiListItem, UiListSkeleton, UiSheet } from '../ui'
import { useToast } from '../../composables/useToast'

const props = defineProps<{ modelValue: boolean; userId: number; name: string; rules?: { ruleId: number; ruleTitle: string; minorCategory?: string }[] }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()
const router = useRouter()
const { showToast } = useToast()

const games = ref<{ key: string; title: string; summary: string }[]>([])
const rules = ref<{ ruleId: number; ruleTitle: string; minorCategory?: string }[]>([])
const loading = ref(false)
// 다른 종목 찾기: 만나서 하는 규칙만 (앱 게임은 위 '폰으로')
const q = ref('')
const found = ref<{ id: number; ruleTitle: string; minorCategory?: string }[]>([])
const searched = ref(false)
let seq = 0
watch(q, (v) => {
  const mine = ++seq
  searched.value = false
  if (!v.trim()) { found.value = []; return }
  setTimeout(async () => {
    if (mine !== seq) return
    try {
      const { data } = await api.get('/api/rules/list', { params: { withApp: false, search: v.trim() } })
      if (mine === seq) found.value = (data || []).slice(0, 6)
    } catch { if (mine === seq) found.value = [] }
    if (mine === seq) searched.value = true
  }, 250)
})
const sending = ref(false)

watch(() => props.modelValue, async (open) => {
  if (!open || games.value.length) return
  loading.value = true
  rules.value = props.rules ?? []
  // 목록에 보이는 앱 게임만 (서버 AppGameCatalog.listed). 같은 문제로 보낼 수 없는 하루 퍼즐은 뺀다
  const list = (await GET('/api/app-games').catch(() => ({ data: [] }))).data ?? []
  games.value = list.filter((g) => g.available !== false && g.dailyLimit !== 1).map((g) => ({ key: g.key, title: g.title, summary: g.summary }))
  loading.value = false
})

function playApp(key: string) {
  emit('update:modelValue', false)
  router.push({ path: `/play/${key}`, query: { to: String(props.userId), toName: props.name } })
}

async function sendOffline(ruleId: number) {
  sending.value = true
  try {
    await playWithMeTooAPI.sendRequest(props.userId, ruleId)
    emit('update:modelValue', false)
    showToast(`${props.name}님에게 한 판 붙자고 했어요. 받으면 메시지로 이어져요`)
  } catch (e) {
    showToast((e as { response?: { data?: { message?: string } } }).response?.data?.message || '보내지 못했어요')
  } finally {
    sending.value = false
  }
}
</script>
