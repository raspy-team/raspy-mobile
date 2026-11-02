<template>
  <div>
    <!-- 동네가 있으면: 이름을 눌러 다른 동네로 바꾼다 (당근의 왼쪽 위 동네 이름) -->
    <button v-if="active" type="button" class="flex items-center gap-1.5 h-10 -ml-1 px-1 t-heading" :aria-label="`지금 동네 ${active.name}, 바꾸기`" @click="open = true">
      {{ active.name }}
      <span v-if="active.nearbyCount" class="t-caption font-normal">근처 {{ active.nearbyCount }}곳</span>
      <UiIcon name="chevron-down" class="text-xs" aria-hidden="true" />
    </button>
    <p v-if="active?.expired" class="t-caption text-danger-fg">
      {{ active.name }} 인증이 지났어요.
      <RouterLink to="/neighborhood" class="underline underline-offset-2">다시 인증하기</RouterLink>
    </p>

    <!-- 동네가 없으면: 전국 경기를 보여 주고 인증을 권한다 -->
    <UiCard v-else-if="loaded && !active" class="flex items-center gap-3">
      <UiIcon name="location-dot" class="text-lg" aria-hidden="true" />
      <div class="flex-1 min-w-0">
        <p class="t-heading">동네를 인증해 주세요</p>
        <p class="t-caption mt-0.5">지금은 전국 경기가 보여요. 인증하면 가까운 경기만 보고 신청할 수 있어요</p>
      </div>
      <UiButton size="sm" to="/neighborhood">인증</UiButton>
    </UiCard>

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
import { UiButton, UiCard, UiList, UiListItem, UiSheet } from '../ui'

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
