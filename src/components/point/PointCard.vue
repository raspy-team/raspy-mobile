<template>
  <!-- 포인트와 출처 (누구 프로필에서나). 내 프로필이면 눌러서 내역 -->
  <component :is="isMe ? 'button' : 'div'" v-if="sources" type="button" class="block w-full rounded-xl bg-surface px-4 py-3 text-left" @click="isMe && openMine()">
    <span class="flex items-center gap-3">
      <UiIcon name="coins" class="text-lg" aria-hidden="true" />
      <span class="flex-1 t-body">포인트</span>
      <span class="t-heading tabular-nums">{{ sources.balance.toLocaleString() }}P</span>
      <UiIcon v-if="isMe" name="chevron-right" class="text-fg-subtle" aria-hidden="true" />
    </span>
    <!-- 어디서 벌었나: 승리·출전·응원 보너스·처음 선물 (사용자 11/3) -->
    <span v-if="sources.earned" class="flex h-1.5 mt-3 rounded-full overflow-hidden bg-surface-3" aria-hidden="true">
      <span v-for="l in sources.lines" :key="l.key" :class="TONE[l.key]" :style="{ width: `${(l.amount * 100) / sources.earned}%` }" />
    </span>
    <span v-if="sources.earned" class="flex flex-wrap gap-x-3 gap-y-1 mt-2 t-micro">
      <span v-for="l in sources.lines" :key="l.key" class="inline-flex items-center gap-1">
        <span class="w-2 h-2 rounded-full" :class="TONE[l.key]" aria-hidden="true" />{{ l.label }} {{ l.amount.toLocaleString() }}P
      </span>
    </span>
  </component>

  <UiSheet v-model="open" title="포인트">
    <template v-if="data">
      <p class="t-title tabular-nums">{{ data.balance.toLocaleString() }}P</p>
      <p class="t-caption mt-1">오늘 {{ data.earnedToday }} / {{ data.dailyLimit }}P 벌었어요</p>

      <p class="t-body mt-4">경기를 마치면 쌓이고, 남의 경기를 응원하는 데 써요.</p>
      <button type="button" class="t-micro underline underline-offset-2 mt-1" :aria-expanded="more" @click="more = !more">{{ more ? '접기' : '자세히' }}</button>
      <ul v-if="more" class="mt-3 space-y-1.5 t-caption">
        <li>· 출전(경기를 끝까지 마침) 20P, 이기면 10P 더 (앱 게임은 5P·3P)</li>
        <li>· 시작 전인 남의 경기에 10~100P를 걸어 응원할 수 있어요. 응원한 쪽이 이기면 <b class="text-fg">50%를 더해</b> 돌려받아요 (100P 걸면 150P). 선수와 친구·같은 동호회면 돌려만 받아요</li>
        <li>· 같은 상대와 일주일에 4번째 판부터는 쌓이지 않고, 응원 보너스까지 하루 200P까지예요</li>
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
// 포인트 (기능 검토 #5): 잔액과 어디서 벌었나(승리·출전·응원 보너스). 내 프로필이면 눌러서 버는 법과 최근 30줄. 서버 PointService 주석 참고
import { ref, onMounted } from 'vue'
import { GET } from '@/api/client'
import type { components } from '@/api/schema'
import { UiIcon, UiList, UiListItem, UiSheet } from '../ui'
import { timeAgo } from '../../utils/format'

const props = defineProps<{ userId: number; isMe?: boolean }>()
const TONE: Record<string, string> = { WIN: 'bg-signal', PLAY: 'bg-fg', CHEER: 'bg-fg-subtle', WELCOME: 'bg-line-strong' }
const sources = ref<components['schemas']['PointSources'] | null>(null)
const data = ref<components['schemas']['PointSummary'] | null>(null)
const open = ref(false)
async function openMine() {
  open.value = true
  data.value = (await GET('/api/points/me').catch(() => ({ data: null }))).data
}
const more = ref(false)

onMounted(async () => {
  sources.value = (await GET('/api/points/users/{userId}/sources', { path: { userId: props.userId } }).catch(() => ({ data: null }))).data
})
</script>
