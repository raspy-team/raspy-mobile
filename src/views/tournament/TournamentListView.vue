<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar title="대회" back />
    <main class="max-w-xl mx-auto px-4 pt-4 pb-16">
      <p class="t-caption">리그(모두와 한 번씩)나 토너먼트(지면 끝)로 겨뤄요. 라운드마다 기간 안에 두 쪽이 시간·장소를 잡아 경기하면, 결과대로 대진이 저절로 나아가요.</p>
      <UiButton block class="mt-4" icon="plus" @click="openCreate()">대회 열기</UiButton>

      <UiTabs v-model="tab" :options="TABS" class="mt-6" />
      <UiListSkeleton v-if="!list" :rows="3" class="mt-3" />
      <div v-else-if="list.length" class="space-y-2 mt-3">
        <TournamentRow v-for="t in list" :key="t.id" :t="t" @click="router.push(`/tournaments/${t.id}`)" />
      </div>
      <UiEmptyState v-else class="pt-10" icon="trophy" :title="tab === 'mine' ? '나간 대회가 없어요' : '동네에 열린 대회가 없어요'" description="처음으로 열어 보세요. 동호회 월례대회도 여기서 열어요" />
    </main>

    <TournamentCreateSheet v-model="createOpen" :club-id="clubId" />
  </div>
</template>

<script setup lang="ts">
// 대회 목록 (/tournaments): 우리 동네 · 내 대회, 대회 열기 (?create=1&clubId=로 오면 동호회 대회로 바로)
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { GET } from '@/api/client'
import type { components } from '@/api/schema'
import TournamentRow from '../../components/tournament/TournamentRow.vue'
import TournamentCreateSheet from '../../components/tournament/TournamentCreateSheet.vue'
import { UiButton, UiEmptyState, UiListSkeleton, UiTabs, UiTopBar } from '../../components/ui'

const TABS = [
  { value: 'near', label: '우리 동네' },
  { value: 'mine', label: '내 대회' },
]
const route = useRoute()
const router = useRouter()
const tab = ref<'near' | 'mine'>('near')
const list = ref<components['schemas']['TournamentSummary'][] | null>(null)
const createOpen = ref(false)
const clubId = ref<number | null>(route.query.clubId ? Number(route.query.clubId) : null)

async function load() {
  list.value = null
  list.value = (await GET('/api/tournaments', { query: { scope: tab.value } })).data
}
function openCreate() {
  createOpen.value = true
}
watch(tab, load)
onMounted(() => {
  load()
  if (route.query.create) createOpen.value = true
})
</script>
