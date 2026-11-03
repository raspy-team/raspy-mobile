<template>
  <!-- 프로필에는 잔액만. 어디서 벌었나·버는 법·내역은 눌러서 (점진적 공개, 11/3) -->
  <button v-if="sources" type="button" class="block w-full rounded-xl bg-surface p-4 text-left active:bg-surface-2 transition-colors" :aria-label="`포인트 ${sources.balance}P. 자세히 보기`" @click="openSheet">
    <span class="flex items-center gap-1 t-label">포인트<UiIcon name="info-circle" class="text-fg-subtle" /></span>
    <span class="block t-title tabular-nums mt-1">{{ sources.balance.toLocaleString() }}P</span>
    <span class="block t-caption mt-0.5">{{ isMe ? '응원에 쓸 수 있어요' : '경기로 모은 포인트' }}</span>
  </button>

  <UiSheet v-model="open" title="포인트">
    <template v-if="sources">
      <p class="t-display tabular-nums">{{ sources.balance.toLocaleString() }}P</p>
      <p v-if="isMe && mine" class="t-caption mt-1">오늘 {{ mine.earnedToday }}P 벌었어요 (하루 {{ mine.dailyLimit }}P까지)</p>

      <!-- 어디서 벌었나: 승리·경기·응원 보너스·출석·처음 선물 -->
      <template v-if="sources.earned">
        <span class="flex h-1.5 mt-5 rounded-full overflow-hidden bg-surface-3" aria-hidden="true">
          <span v-for="l in sources.lines" :key="l.key" :class="TONE[l.key]" :style="{ width: `${(l.amount * 100) / sources.earned}%` }" />
        </span>
        <ul class="mt-3 space-y-2">
          <li v-for="l in sources.lines" :key="l.key" class="flex items-center gap-2 t-body">
            <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" :class="TONE[l.key]" aria-hidden="true" />
            <span class="flex-1">{{ l.label }}</span>
            <span class="tabular-nums text-fg-muted">{{ l.amount.toLocaleString() }}P</span>
          </li>
        </ul>
      </template>

      <!-- 한 줄에 한 가지. 숫자는 예로 -->
      <h3 class="t-heading mt-7">이렇게 모여요</h3>
      <ul class="mt-2 space-y-2 t-body">
        <li>경기를 끝까지 하면 20P, 이기면 10P를 더 받아요. 앱 게임은 5P, 3P예요.</li>
        <li>하루 처음 앱을 열면 5P. 7일 내내 열면 15P를 더 받아요.</li>
        <li>같은 상대와는 일주일에 세 판까지만 쌓여요.</li>
      </ul>
      <h3 class="t-heading mt-6">이렇게 써요</h3>
      <ul class="mt-2 space-y-2 t-body">
        <li>시작 전인 남의 경기에 10~100P를 걸고 응원해요.</li>
        <li>응원한 쪽이 이기면 더 받고, 지면 건 만큼 잃어요. 약한 쪽을 응원할수록 많이 받아요. 100P를 걸면 최대 150P예요.</li>
        <li>돈으로 사거나 바꿀 수 없고, 남에게 줄 수도 없어요.</li>
      </ul>

      <template v-if="isMe && mine?.history.length">
        <h3 class="t-heading mt-7 mb-1">최근</h3>
        <UiList>
          <UiListItem v-for="(h, i) in mine.history" :key="i" :title="h.label" :subtitle="timeAgo(h.at)">
            <template #trailing>
              <span class="t-heading tabular-nums" :class="h.amount > 0 ? 'text-signal-fg' : 'text-fg-muted'">{{ h.amount > 0 ? '+' : '' }}{{ h.amount }}</span>
            </template>
          </UiListItem>
        </UiList>
      </template>
    </template>
  </UiSheet>
</template>

<script setup lang="ts">
// 포인트 (기능 검토 #5): 잔액과 어디서 벌었나(승리·경기·응원 보너스·출석). 서버 PointService 주석 참고.
// 프로필에는 잔액 타일만, 출처·버는 법·내 내역은 시트에서 (애플 HIG 점진적 공개, 11/3)
import { ref, onMounted } from 'vue'
import { GET } from '@/api/client'
import type { components } from '@/api/schema'
import { UiIcon, UiList, UiListItem, UiSheet } from '../ui'
import { timeAgo } from '../../utils/format'

const props = defineProps<{ userId: number; isMe?: boolean }>()
// 볼트는 승리 하나만. signal-fg는 어두운 화면에서 볼트와 같은 색이라 출석을 회색 단계로 둔다
const TONE: Record<string, string> = { WIN: 'bg-signal', PLAY: 'bg-fg', ATTEND: 'bg-fg-muted', CHEER: 'bg-fg-subtle', WELCOME: 'bg-line-strong' }
const sources = ref<components['schemas']['PointSources'] | null>(null)
const mine = ref<components['schemas']['PointSummary'] | null>(null)
const open = ref(false)
async function openSheet() {
  open.value = true
  if (props.isMe && !mine.value) mine.value = (await GET('/api/points/me').catch(() => ({ data: null }))).data
}

onMounted(async () => {
  sources.value = (await GET('/api/points/users/{userId}/sources', { path: { userId: props.userId } }).catch(() => ({ data: null }))).data
})
</script>
