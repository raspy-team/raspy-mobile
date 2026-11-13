<template>
  <div>
    <!-- 동네가 있으면: 이름을 눌러 다른 동네로 바꾼다 (당근의 왼쪽 위 동네 이름) -->
    <button v-if="active" type="button" class="flex items-center gap-1.5 h-10 -ml-1 px-1 t-heading" :aria-label="`지금 동네 ${active.name}, 바꾸기`" @click="open = true">
      {{ active.name }}
      <!-- '근처 N개 동까지'는 무슨 범위인지 몰랐다: 보이는 경기의 범위라고 말한다 (경로 전부 훑기 4) -->
      <span v-if="active.nearbyCount" class="t-caption font-normal">근처 동네 {{ active.nearbyCount }}곳 경기까지</span>
      <UiIcon name="chevron-down" class="text-xs" aria-hidden="true" />
    </button>
    <!-- '인증이 지났어요' 경고는 뺐다: 11/13부터 동네는 고르기만 해도 되고 인증이 지나도 막지 않는다 -->

    <!-- 동네가 없을 때의 '동네를 인증해 주세요' 카드는 뺐다: 경기를 보러 온 사람에게 위치 인증부터 권했다.
         동네가 필요한 순간(신청·열기)엔 서버가 묻고(428) 인증 뒤 하던 화면으로 돌려보낸다 (목적 판정 11/11 4번).
         대신 이 목록이 전국 경기라는 것만 한 줄로 (경로 4 리뷰 G2: 서울 사람이 부산 경기 카드를 봤다). 못 불러왔을 때는 말하지 않는다 -->
    <p v-if="loaded && !failed && !active" class="t-caption">
      <!-- '전국 경기예요'는 늘, 동네 인증 권유는 세 번까지 (11/11 쌓이는 피로 전수표) -->
      전국 경기예요<template v-if="nudgeLeft"> · <RouterLink to="/neighborhood" class="hit underline underline-offset-2">동네를 고르면</RouterLink> 가까운 경기만 보여요</template>
    </p>

    <UiSheet v-model="open" title="동네 고르기">
      <UiList>
        <UiListItem v-for="n in list" :key="n.code" :title="n.name" :subtitle="n.shortName" @click="select(n.code)">
          <template #trailing><UiIcon v-if="n.active" name="check" aria-hidden="true" /></template>
        </UiListItem>
        <UiListItem icon="fas fa-gear" title="내 동네 설정" subtitle="동네 추가 · 보는 범위" chevron @click="go" />
      </UiList>
    </UiSheet>
  </div>
</template>

<script setup lang="ts">
// 경기 목록 위 동네 줄: 지금 동네 이름(눌러서 바꾸기) 또는 인증 권하기. 동네를 바꾸면 changed를 보내 목록을 다시 부른다
import { ref, computed, onMounted } from 'vue'
// 동네 인증 권유를 본 횟수 (세 번까지)
const nudgeLeft = (() => {
  try {
    const n = Number(localStorage.getItem('nudge_neighborhood') || 0)
    localStorage.setItem('nudge_neighborhood', String(n + 1))
    return n < 3
  } catch { return true }
})()
import { useRouter } from 'vue-router'
import { GET, POST } from '@/api/client'
import { useToast } from '@/composables/useToast'
import type { components } from '@/api/schema'
import { UiList, UiListItem, UiSheet } from '../ui'

type Mine = components['schemas']['MyNeighborhoods']

const emit = defineEmits<{ changed: [] }>()
const router = useRouter()
const data = ref<Mine | null>(null)
const loaded = ref(false)
const open = ref(false)

const list = computed(() => data.value?.neighborhoods ?? [])
const active = computed(() => list.value.find((n) => n.active))

// 바꾸기가 실패하면 시트만 닫히고 말이 없었다 (경로 전부 훑기 4)
const { showToast } = useToast()
async function select(code: string) {
  open.value = false
  if (code === active.value?.code) return
  try {
    data.value = (await POST('/api/neighborhoods/select', { body: { code } })).data
    emit('changed')
  } catch (e) {
    showToast((e as { response?: { data?: { message?: string } } }).response?.data?.message || '동네를 바꾸지 못했어요. 잠시 뒤 다시 해 주세요')
  }
}
function go() {
  open.value = false
  router.push('/neighborhood')
}

const failed = ref(false)
onMounted(async () => {
  try {
    data.value = (await GET('/api/neighborhoods/me')).data
  } catch {
    failed.value = true
  } finally {
    loaded.value = true
  }
})
</script>
