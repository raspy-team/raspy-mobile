<template>
  <div>
    <!-- 동네가 있으면: 이름을 눌러 다른 동네로 바꾼다 (당근의 왼쪽 위 동네 이름) -->
    <button v-if="active" type="button" class="flex items-center gap-1.5 h-10 -ml-1 px-1 t-heading" :aria-label="`지금 동네 ${active.name}, 바꾸기`" @click="open = true">
      {{ active.name }}
      <span v-if="active.nearbyCount" class="t-caption font-normal">근처 {{ active.nearbyCount }}개 동까지</span>
      <UiIcon name="chevron-down" class="text-xs" aria-hidden="true" />
    </button>
    <p v-if="active?.expired" class="t-caption text-danger-fg">
      {{ active.name }} 인증이 지났어요.
      <RouterLink to="/neighborhood" class="underline underline-offset-2">다시 인증하기</RouterLink>
    </p>

    <!-- 동네가 없을 때의 '동네를 인증해 주세요' 카드는 뺐다: 경기를 보러 온 사람에게 위치 인증부터 권했다.
         동네가 필요한 순간(신청·열기)엔 서버가 묻고(428) 인증 뒤 하던 화면으로 돌려보낸다 (목적 판정 11/11 4번) -->

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
import { useRouter } from 'vue-router'
import { GET, POST } from '@/api/client'
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

async function select(code: string) {
  open.value = false
  if (code === active.value?.code) return
  data.value = (await POST('/api/neighborhoods/select', { body: { code } })).data
  emit('changed')
}
function go() {
  open.value = false
  router.push('/neighborhood')
}

onMounted(async () => {
  try {
    data.value = (await GET('/api/neighborhoods/me')).data
  } finally {
    loaded.value = true
  }
})
</script>
