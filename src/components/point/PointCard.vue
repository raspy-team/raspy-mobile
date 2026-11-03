<template>
  <!-- 프로필에는 잔액만. 어디서 벌었나·버는 법·내역은 눌러서 (점진적 공개, 11/3) -->
  <button v-if="sources" type="button" class="block w-full rounded-xl bg-surface p-4 text-left active:bg-surface-2 transition-[background-color,transform] motion-safe:active:scale-[0.98]" :aria-label="`포인트 ${sources.balance}P. 자세히 보기`" @click="openSheet">
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

      <!-- 응원 성적: 포인트 숫자보다 '보는 눈'이 자랑거리 (판타지 리그의 본질, docs/points-betting-review.md) -->
      <p v-if="sources.cheerRecord.total" class="t-body mt-5">
        응원 {{ sources.cheerRecord.total }}번 중 <b class="tabular-nums">{{ sources.cheerRecord.hits }}번</b> 맞혔어요<template v-if="sources.cheerRecord.upsets"> · 이변 {{ sources.cheerRecord.upsets }}번</template><template v-if="sources.cheerRecord.streak > 1"> · {{ sources.cheerRecord.streak }}연속</template>
      </p>

      <!-- 주간 응원 리그: 친구·동네, 유닛(보는 눈) 또는 포인트 순. 상은 없고 순위만 -->
      <template v-if="isMe">
        <h3 class="t-heading mt-7">이번 주 응원 리그</h3>
        <div class="flex flex-wrap gap-2 mt-2">
          <UiChip v-for="o in SCOPES" :key="o.key" :selected="scope === o.key" @click="loadLeague(o.key, sort)">{{ o.label }}</UiChip>
          <span class="w-px bg-line mx-1" aria-hidden="true" />
          <UiChip v-for="o in SORTS" :key="o.key" :selected="sort === o.key" @click="loadLeague(scope, o.key)">{{ o.label }}</UiChip>
        </div>
        <UiList v-if="league?.rows.length" class="mt-2">
          <UiListItem v-for="r in league.rows.slice(0, 5)" :key="r.userId" :title="`${r.rank}. ${r.nickname}`" :subtitle="`${r.picks}번 중 ${r.hits}번`">
            <template #trailing><span class="t-heading tabular-nums" :class="{ 'text-signal-fg': r.userId === userId }">{{ score(r) }}</span></template>
          </UiListItem>
        </UiList>
        <p class="t-caption mt-2">
          <template v-if="league?.me && league.me.rank">나는 {{ league.me.rank }}등 · {{ score(league.me) }}</template>
          <template v-else-if="league?.me">이번 주 {{ league.me.picks }}번 골랐어요. {{ league.minPicks }}번부터 순위에 들어요</template>
          <template v-else>남의 경기에서 이길 쪽을 {{ league?.minPicks ?? 3 }}번 맞혀 보면 순위에 들어요</template>
        </p>
        <p class="t-micro mt-1">유닛: 맞히면 +(배수−1), 틀리면 −1. 건 포인트와 상관없이 보는 눈만 재요</p>
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
        <li>선수가 다 모인 남의 경기에서 시작 전까지 이길 쪽을 골라요. 기본은 포인트 없이 예측만 해요.</li>
        <li>원하면 10~100P를 걸어요(하루 300P). 편마다 배수가 보이고, 이길 것 같지 않은 쪽일수록 커요(최대 3배). 100P를 ×2.4에 걸고 이기면 240P, 지면 잃어요.</li>
        <li>친구이거나 같이 한 판 한 사람이 있는 경기에서는 그 사람 편만 고를 수 있어요.</li>
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
import { UiChip, UiIcon, UiList, UiListItem, UiSheet } from '../ui'
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
  if (props.isMe && !league.value) loadLeague(scope.value, sort.value)
}

type Scope = 'FRIENDS' | 'NEIGHBORHOOD'
type Sort = 'UNITS' | 'POINTS'
const SCOPES: { key: Scope; label: string }[] = [{ key: 'FRIENDS', label: '친구' }, { key: 'NEIGHBORHOOD', label: '동네' }]
const SORTS: { key: Sort; label: string }[] = [{ key: 'UNITS', label: '보는 눈' }, { key: 'POINTS', label: '포인트' }]
const scope = ref<Scope>('FRIENDS')
const sort = ref<Sort>('UNITS')
const league = ref<components['schemas']['BetLeague'] | null>(null)
async function loadLeague(s: Scope, o: Sort) {
  scope.value = s
  sort.value = o
  league.value = (await GET('/api/points/league', { query: { scope: s, sort: o } }).catch(() => ({ data: null }))).data
}
const signed = (n: number, unit: string) => `${n > 0 ? '+' : ''}${n}${unit}`
const score = (r: components['schemas']['BetLeagueRow']) => (sort.value === 'UNITS' ? signed(r.units, '유닛') : signed(r.points, 'P'))

onMounted(async () => {
  sources.value = (await GET('/api/points/users/{userId}/sources', { path: { userId: props.userId } }).catch(() => ({ data: null }))).data
})
</script>
