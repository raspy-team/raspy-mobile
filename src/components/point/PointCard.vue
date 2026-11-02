<template>
  <button v-if="data" type="button" class="w-full flex items-center gap-3 rounded-xl bg-surface px-4 h-14 text-left" @click="open = true">
    <UiIcon name="coins" class="text-lg" aria-hidden="true" />
    <span class="flex-1 t-body">포인트</span>
    <span class="t-heading tabular-nums">{{ data.balance.toLocaleString() }}P</span>
    <UiIcon name="chevron-right" class="text-fg-subtle" aria-hidden="true" />
  </button>

  <UiSheet v-model="open" title="포인트">
    <template v-if="data">
      <p class="t-title tabular-nums">{{ data.balance.toLocaleString() }}P</p>
      <p class="t-caption mt-1">오늘 {{ data.earnedToday }} / {{ data.dailyLimit }}P 벌었어요</p>

      <ul class="mt-4 space-y-1.5 t-caption">
        <li>· 경기를 마치면 20P, 이기면 10P 더 (앱 게임은 5P·3P)</li>
        <li>· 남의 경기를 응원하며 10~100P를 걸 수 있어요. 응원한 쪽이 이기면 <b class="text-fg">+50%</b>를 더해 돌려받아요</li>
        <li>· 같은 상대와 일주일에 4번째 판부터, 하루 100P를 넘으면 쌓이지 않아요</li>
        <li>· 포인트는 돈으로 사거나 돈·경품으로 바꾸거나 남에게 줄 수 없어요</li>
      </ul>

      <h3 class="t-heading mt-6 mb-1">최근</h3>
      <UiList v-if="data.history.length">
        <UiListItem v-for="(h, i) in data.history" :key="i" :title="h.label" :subtitle="timeAgo(h.at)">
          <template #trailing>
            <span class="t-heading tabular-nums" :class="h.amount > 0 ? 'text-signal-fg' : 'text-fg-muted'">{{ h.amount > 0 ? '+' : '' }}{{ h.amount }}</span>
          </template>
        </UiListItem>
      </UiList>
    </template>
  </UiSheet>
</template>

<script setup lang="ts">
// 내 포인트 (기능 검토 #5): 잔액 한 줄 → 누르면 버는 법·응원·법적 원칙과 최근 30줄. 서버 PointService 주석 참고
import { ref, onMounted } from 'vue'
import { GET } from '@/api/client'
import type { components } from '@/api/schema'
import { UiIcon, UiList, UiListItem, UiSheet } from '../ui'
import { timeAgo } from '../../utils/format'

const data = ref<components['schemas']['PointSummary'] | null>(null)
const open = ref(false)

onMounted(async () => {
  data.value = (await GET('/api/points/me').catch(() => ({ data: null }))).data
})
</script>
