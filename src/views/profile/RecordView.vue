<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar :title="isMe ? '내 기록' : nickname ? `${nickname}님의 기록` : '기록'" back />

    <main v-if="loading" class="max-w-2xl mx-auto px-4 pt-4" role="status" aria-label="기록 불러오는 중">
      <UiSkeleton class="h-11 w-full rounded-xl" />
      <UiSkeleton class="h-14 w-32 mt-6" />
      <UiSkeleton class="h-2.5 w-full mt-4 rounded-full" />
      <UiSkeleton class="h-28 w-full mt-8 rounded-xl" />
      <UiListSkeleton :rows="3" shape="tile" class="mt-8" />
    </main>

    <!-- 경기 기록을 '나만'으로 둔 사람 (서버 403, 내 정보 공개). 다시 불러와도 같으니 버튼을 두지 않는다 -->
    <main v-else-if="hidden" class="max-w-2xl mx-auto px-4 pt-16">
      <UiEmptyState icon="eye-slash" title="기록을 공개하지 않았어요" />
    </main>
    <main v-else-if="error" class="max-w-2xl mx-auto px-4 pt-16">
      <!-- 서버가 이유를 말했으면(없는 사람·차단) 그 말만, 연결 오류면 다시 불러오기 -->
      <UiEmptyState icon="fas fa-triangle-exclamation" :title="error" :description="told ? '' : '잠시 뒤 다시 해 주세요'">
        <UiButton v-if="told" variant="secondary" @click="router.back()">돌아가기</UiButton>
        <UiButton v-else variant="secondary" @click="load">다시 시도</UiButton>
      </UiEmptyState>
    </main>

    <main v-else-if="!s.total.games && !s.practiceGames" class="max-w-2xl mx-auto px-4 pt-16">
      <UiEmptyState mascot="match" title="아직 기록이 없어요">
        <!-- 기록이 없으면 찾기로 (정리 11/5: 앱 게임이 아니라 동네 경기가 주인공) -->
        <!-- 프로필 빈 상태와 같은 말: 같은 "한 판 하기"가 순위 화면에선 앱 게임으로 가서 헷갈렸다 (목적 판정 6) -->
        <UiButton v-if="isMe" to="/">경기 찾기</UiButton>
      </UiEmptyState>
    </main>

    <main v-else class="max-w-2xl mx-auto px-4 pt-4 pb-32 space-y-10 ui-appear">
      <!-- 기간: 스트라바처럼 이번 주가 먼저. 이번 주에 한 게 없으면 한 게 있는 가장 짧은 기간을 연다 -->
      <section>
        <UiTabs v-model="periodKey" :options="PERIODS" />
        <div class="mt-6 flex items-end justify-between gap-4">
          <div>
            <p class="t-caption">{{ periodLabel }} 사람과 한 판</p>
            <p class="t-display text-[56px] tracking-[-0.06em] leading-none mt-2 tabular-nums"><UiRollNumber :value="period.tally.games" /><span class="text-2xl text-fg-muted ml-1">판</span></p>
          </div>
          <div v-if="period.tally.games" class="text-right">
            <p class="t-title tabular-nums">{{ period.tally.winRate }}%</p>
            <p class="t-caption tabular-nums">{{ period.tally.wins }}승 {{ period.tally.draws ? period.tally.draws + '무 ' : '' }}{{ period.tally.losses }}패</p>
          </div>
        </div>
        <div v-if="period.tally.games" class="flex h-2.5 mt-4 rounded-full overflow-hidden bg-surface-2" role="img" :aria-label="`${period.tally.wins}승 ${period.tally.draws}무 ${period.tally.losses}패`">
          <!-- 승패는 색이 아니라 밝기로: 승은 글자색, 무는 회색, 패는 빈칸 -->
          <span class="bg-fg" :style="{ width: pct(period.tally.wins, period.tally.games) }"></span>
          <span class="bg-fg-subtle" :style="{ width: pct(period.tally.draws, period.tally.games) }"></span>
        </div>
        <p v-if="compare" class="t-caption mt-3">{{ compare }}</p>
        <div class="grid grid-cols-3 gap-2 mt-4">
          <div v-for="c in periodCards" :key="c.label" class="rounded-xl bg-surface px-3 py-3">
            <p class="t-heading tabular-nums">{{ c.value }}</p>
            <p class="t-micro mt-0.5">{{ c.label }}</p>
          </div>
        </div>
      </section>

      <!-- 활동: 한 판 이상 한 주가 몇 주 이어졌나 + 26주 달력 (연습 포함) -->
      <section>
        <div class="flex items-center justify-between mb-3">
          <h2 class="t-heading">활동</h2>
          <UiBadge v-if="s.weekStreak >= 2" tone="success">{{ s.weekStreak }}주 연속</UiBadge>
        </div>
        <div class="rounded-xl bg-surface p-4">
          <div class="grid gap-[3px]" :style="{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }" role="img" :aria-label="`최근 ${weeks.length}주 동안 ${s.activity.length}일 활동`">
            <div v-for="(w, i) in weeks" :key="i" class="grid grid-rows-7 gap-[3px]">
              <span v-for="d in w" :key="d.date" class="aspect-square rounded-[2px]" :class="d.future ? '' : HEAT[d.level]"></span>
            </div>
          </div>
          <div class="flex justify-between mt-2 t-micro">
            <span>{{ Number(s.activitySince.slice(5, 7)) }}월</span>
            <span>오늘</span>
          </div>
          <p v-if="streakLine" class="t-caption mt-3">{{ streakLine }}</p>
        </div>
      </section>

      <!-- 최근 흐름: 칸을 누르면 그 경기로 -->
      <section v-if="s.matches.length">
        <div class="flex items-center justify-between mb-3">
          <h2 class="t-heading">최근 경기</h2>
          <UiBadge v-if="s.streak && s.streak.count >= 2" :tone="s.streak.kind === 'win' ? 'success' : 'neutral'">
            {{ s.streak.count }}{{ s.streak.kind === 'win' ? '연승' : s.streak.kind === 'lose' ? '연패' : '연속 무승부' }} 중
          </UiBadge>
        </div>
        <!-- 승패 칸 줄(왼쪽이 오래된 경기)은 이 목록과 같은 내용이라 뺐다 (UX 리뷰 ⑥) -->
        <UiList>
          <UiListItem
            v-for="m in allMatches ? s.matches : s.matches.slice(0, 5)"
            :key="m.gameId"
            :title="m.ruleTitle"
            :subtitle="[matchWho(m), timeAgo(m.playedAt)].filter(Boolean).join(' · ')"
            chevron
            @click="openMatch(m)"
          >
            <template #leading>
              <span class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 t-label" :class="RESULT[m.result].class">{{ m.players > 2 && !m.teams ? `${m.place}등` : RESULT[m.result].label }}</span>
            </template>
          </UiListItem>
        </UiList>
        <UiButton v-if="s.matches.length > 5" block variant="ghost" class="mt-2" @click="allMatches = !allMatches">
          {{ allMatches ? '접기' : `최근 ${s.matches.length}경기 모두 보기` }}
        </UiButton>
      </section>

      <!-- 실력 점수: 숫자만으로는 뜻이 없다. 같은 게임 하는 사람 중 어디쯤인지와 함께 -->
      <section v-if="overview?.overall || ratedRules.length">
        <div class="flex items-center justify-between mb-3">
          <h2 class="t-heading">실력 점수</h2>
          <UiButton size="sm" variant="ghost" class="-mr-2" icon="circle-question" @click="helpOpen = true">점수가 뭔가요?</UiButton>
        </div>

        <div v-if="overview?.overall" class="rounded-xl bg-surface p-4">
          <button type="button" class="w-full flex items-baseline gap-2 text-left" @click="router.push('/rankings/OVERALL/ALL')">
            <p class="t-caption">종합</p>
            <!-- 가진 1위 (자리마다, 새벽 4시에 정한다) -->
            <span v-if="crownText('OVERALL', 'ALL')" class="t-micro text-signal-fg"><UiIcon name="fas fa-crown" /> {{ crownText('OVERALL', 'ALL') }}</span>
            <!-- 잠정이면 숫자 대신 한 줄 (④ 결과 화면과 같은 기준: 첫 몇 판의 숫자는 크게 흔들린다) -->
            <p v-if="overview.overall.provisional" class="t-caption ml-auto">몇 판 더 하면 나와요</p>
            <template v-else>
              <p class="t-title tabular-nums ml-auto">{{ overview.overall.rating }}</p>
              <p class="t-caption tabular-nums">±{{ overview.overall.margin }}</p>
            </template>
          </button>
          <p v-if="!overview.overall.provisional && showRank(overview.overall.rank, overview.overall.people)" class="t-label mt-1 text-right">
            {{ standing(overview.overall.rank, overview.overall.people) }}
          </p>
          <div v-if="overview.groups.length" class="grid gap-2 mt-3" :style="{ gridTemplateColumns: `repeat(${overview.groups.length}, minmax(0, 1fr))` }">
            <button v-for="g in overview.groups" :key="g.key" type="button" class="rounded-lg bg-surface-2 px-3 py-2 text-left" @click="router.push(`/rankings/GROUP/${g.key}`)">
              <p class="t-micro">{{ g.label }}</p>
              <p v-if="g.provisional" class="t-caption">몇 판 더</p>
              <p v-else class="t-heading tabular-nums">{{ g.rating }}</p>
              <p v-if="!g.provisional && showRank(g.rank, g.people)" class="t-micro tabular-nums">{{ standing(g.rank, g.people) }}</p>
              <p v-if="crownText('GROUP', g.key)" class="t-micro text-signal-fg truncate"><UiIcon name="fas fa-crown" /> {{ crownText('GROUP', g.key) }}</p>
            </button>
          </div>
          <div v-if="overview.abilities.length" class="flex flex-wrap gap-1.5 mt-3">
            <UiChip v-for="a in overview.abilities.slice(0, 6)" :key="a.key" :icon="crownText('ABILITY', a.key) ? 'fas fa-crown' : ''" @click="router.push(`/rankings/ABILITY/${a.key}`)">
              {{ a.label }} {{ a.rating }}<template v-if="crownText('ABILITY', a.key)"> · {{ crownText('ABILITY', a.key) }}</template>
            </UiChip>
          </div>
        </div>

        <!-- 게임마다: 점수 · 순위(또는 순위까지 남은 것) · 흐름 -->
        <div v-if="ratedRules.length" class="mt-3">
          <div v-if="ratedRules.length > 1" class="flex gap-2 -mx-4 px-4 mb-3 overflow-x-auto no-scrollbar" role="tablist" aria-label="게임 고르기">
            <UiChip v-for="r in ratedRules" :key="r.ruleId" class="flex-shrink-0 whitespace-nowrap" :selected="picked?.ruleId === r.ruleId" @click="pickedId = r.ruleId">{{ r.ruleTitle }}</UiChip>
          </div>
          <div v-if="picked?.provisional" class="rounded-xl bg-surface p-4">
            <p class="t-body">실력 점수는 몇 판 더 하면 나와요</p>
            <p v-if="untilRanked(picked)" class="t-caption mt-1">{{ untilRanked(picked) }}</p>
          </div>
          <div v-else-if="picked" class="rounded-xl bg-surface p-4">
            <div class="flex items-baseline gap-2">
              <p class="t-title tabular-nums">{{ picked.rating }}점</p>
              <p class="t-caption tabular-nums">±{{ picked.margin }}</p>
              <UiBadge v-if="picked.provisional" class="ml-auto">잠정</UiBadge>
              <p v-else-if="trend" class="t-caption tabular-nums ml-auto" :class="trend > 0 ? 'text-signal-fg' : ''">최근 5판 {{ trend > 0 ? '+' : '' }}{{ trend }}</p>
            </div>
            <p v-if="rankLine(picked)" class="t-label mt-1">{{ rankLine(picked) }}</p>
            <svg v-if="chart" viewBox="0 0 300 72" class="w-full h-[72px] mt-3 text-fg" role="img" :aria-label="`${picked.ruleTitle} 실력 점수 흐름, 처음 ${chart.first}점에서 지금 ${picked.rating}점`">
              <!-- 지금 점수의 ± 범위: 오른쪽 끝의 세로 막대 (지난 점수의 범위는 남기지 않아 그리지 않는다) -->
              <line :x1="chart.lastX" :x2="chart.lastX" :y1="chart.bandTop" :y2="chart.bandBottom" stroke="currentColor" stroke-width="6" stroke-linecap="round" opacity="0.15" />
              <polyline :points="chart.points" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
              <circle :cx="chart.lastX" :cy="chart.lastY" r="3.5" fill="currentColor" />
            </svg>
            <div v-if="chart" class="flex justify-between t-micro tabular-nums mt-1">
              <span>처음 {{ chart.first }}</span>
              <span>지금 {{ picked.rating }} ±{{ picked.margin }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 게임(규칙)별: 모든 게임에 순위 또는 순위까지 남은 것 -->
      <section v-if="s.rules.length">
        <h2 class="t-heading mb-1">게임별 기록</h2>
        <UiList>
          <UiListItem
            v-for="r in allRules ? s.rules : s.rules.slice(0, 5)"
            :key="r.ruleId"
            :title="r.ruleTitle"
            :subtitle="[`${r.tally.games}판 · ${r.tally.wins}승 ${r.tally.draws ? r.tally.draws + '무 ' : ''}${r.tally.losses}패`, rankShort(r)].filter(Boolean).join(' · ')"
            chevron
            @click="router.push(r.appGameKey ? `/play/${r.appGameKey}` : `/rules/${r.ruleId}`)"
          >
            <template #leading>
              <RuleThumb :rule="{ minorCategory: r.minorCategory, ruleTitle: r.ruleTitle, appGameKey: r.appGameKey }" :size="36" bare />
            </template>
            <template #trailing>
              <span class="t-heading tabular-nums">{{ r.tally.winRate }}%</span>
            </template>
          </UiListItem>
        </UiList>
        <UiButton v-if="s.rules.length > 5" block variant="ghost" class="mt-2" @click="allRules = !allRules">
          {{ allRules ? '접기' : `${s.rules.length}개 게임 모두 보기` }}
        </UiButton>
      </section>

      <!-- 개인 최고 기록 (기록 도전 게임) -->
      <section v-if="s.bests.length">
        <h2 class="t-heading mb-1">개인 최고 기록</h2>
        <UiList>
          <UiListItem
            v-for="b in s.bests"
            :key="b.key"
            :title="b.title"
            :subtitle="showRank(b.rank, b.players) ? `기록 순위 ${b.rank}위 / ${b.players}명` : ''"
            chevron
            @click="router.push(`/play/${b.key}`)"
          >
            <template #leading>
              <RuleThumb :rule="{ ruleTitle: b.title, appGameKey: b.key }" :size="36" bare />
            </template>
            <template #trailing>
              <span class="flex items-center gap-2">
                <UiBadge v-if="b.setThisWeek" tone="success">이번 주</UiBadge>
                <span class="t-heading tabular-nums">{{ score(b.score) }}<span class="t-caption ml-0.5">{{ b.scoreUnit }}</span></span>
              </span>
            </template>
          </UiListItem>
        </UiList>
      </section>

      <!-- 봇과 한 판은 사람 레이팅·순위와 따로 -->
      <section v-if="overview?.practice?.length">
        <h2 class="t-heading mb-1">연습 점수 <span class="t-caption">AI 주민과 한 판 · 순위에 안 들어가요</span></h2>
        <UiList>
          <UiListItem v-for="p in overview.practice" :key="p.ruleId" :title="p.ruleTitle" :subtitle="`${p.games}판`" chevron @click="router.push(`/rules/${p.ruleId}`)">
            <template #trailing><span class="t-heading tabular-nums">{{ p.rating }}</span></template>
          </UiListItem>
        </UiList>
      </section>

      <!-- 자주 만난 상대: 맞대결은 두 사람의 등수를 비교한다 -->
      <section v-if="s.rivals.length">
        <h2 class="t-heading mb-1">자주 만난 상대</h2>
        <UiList>
          <UiListItem
            v-for="o in s.rivals"
            :key="o.player.id"
            :title="o.player.nickname"
            :subtitle="`${o.tally.games}번 만남 · ${o.tally.wins}승 ${o.tally.draws ? o.tally.draws + '무 ' : ''}${o.tally.losses}패`"
            chevron
            @click="router.push('/profile/' + o.player.id)"
          >
            <template #leading><UiAvatar :src="o.player.avatar" :name="o.player.nickname" :user-id="o.player.id" size="sm" /></template>
            <template #trailing>
              <UiBadge :tone="o.tally.wins > o.tally.losses ? 'success' : 'neutral'">
                {{ o.tally.wins > o.tally.losses ? '우세' : o.tally.wins < o.tally.losses ? '열세' : '팽팽' }}
              </UiBadge>
            </template>
          </UiListItem>
        </UiList>
      </section>

      <!-- 받은 별점: 실력 점수(이기고 진 결과)와 다른, 상대가 매긴 별점. ★로 점수와 구분한다 -->
      <section v-if="s.manner || s.skill || s.reviews.length">
        <h2 class="t-heading mb-3">받은 별점</h2>
        <div v-if="s.manner || s.skill" class="grid grid-cols-2 gap-3">
          <div v-if="s.manner" class="rounded-xl bg-surface p-4">
            <p class="t-caption">매너</p>
            <p class="t-title tabular-nums mt-1">★ {{ s.manner.average.toFixed(1) }}</p>
            <p class="t-micro mt-0.5">{{ s.manner.count }}명이 평가</p>
          </div>
          <div v-if="s.skill" class="rounded-xl bg-surface p-4">
            <p class="t-caption">실력</p>
            <p class="t-title tabular-nums mt-1">★ {{ s.skill.average.toFixed(1) }}</p>
            <p class="t-micro mt-0.5">{{ s.skill.count }}명이 평가</p>
          </div>
        </div>
        <ul v-if="s.reviews.length" class="space-y-3 mt-3">
          <li v-for="r in s.reviews" :key="r.gameId" class="rounded-xl bg-surface p-4">
            <p class="t-body whitespace-pre-line break-words">“{{ r.text }}”</p>
            <p class="t-micro mt-2">{{ r.from.nickname }} · {{ r.ruleTitle }} · {{ timeAgo(r.at) }}</p>
          </li>
        </ul>
      </section>
    </main>

    <!-- 점수가 뭔가요? -->
    <UiSheet v-model="helpOpen" title="실력 점수가 뭔가요?">
      <ul class="space-y-3 t-body">
        <li><strong>게임마다 따로</strong> 매겨요. 모두 <strong>1500점</strong>에서 시작해요.</li>
        <li>이기면 오르고 지면 내려가요. <strong>나보다 점수가 높은 사람을 이기면</strong> 더 많이 올라요.</li>
        <li><strong>200점 차이</strong>면 높은 쪽이 4판 중 3판쯤 이겨요. 400점 차이면 10판 중 9판이에요.</li>
        <li><strong>±</strong>는 아직 확실하지 않은 정도예요. 판이 쌓이면 좁아지고, 오래 쉬면 다시 넓어져요. <strong>잠정</strong>은 아직 판이 적다는 뜻이에요.</li>
        <li><strong>순위</strong>는 그 게임을 사람과 5판, 서로 다른 상대 3명 이상과 하면 붙어요. AI 주민과 한 판은 연습이라 따로 세요.</li>
        <li><strong>종합</strong>은 게임별 점수를 모은 거예요. 판을 많이 해서 확실한 점수일수록 크게 쳐요.</li>
      </ul>
      <p class="t-micro mt-4">체스 사이트 lichess와 같은 Glicko-2 방식이에요.</p>
    </UiSheet>
  </div>
</template>

<script setup>
// 기록 자세히 (/profile/:id/stats), 11/3 통계 개편.
// 숫자는 모두 서버 한 곳(/user-profile/:id/stats, UserStatsService)에서 센다. 프로필 숫자 줄과 같은 수가 나온다.
// 기간(이번 주가 먼저) → 활동 달력·연속 주 → 최근 경기 → 실력 점수(순위·상위 %와 함께) → 게임별 → 개인 최고 → 연습 → 상대 → 받은 평가
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { GET } from '@/api/client'
import RuleThumb from '../../components/rule/RuleThumb.vue'
import { UiAvatar, UiBadge, UiButton, UiChip, UiEmptyState, UiList, UiListItem, UiListSkeleton, UiRollNumber, UiSheet, UiSkeleton, UiTabs, UiTopBar } from '../../components/ui'
import { timeAgo } from '../../utils/format'
import { showRank } from '@/utils/rank'

const RESULT = {
  win: { label: '승', word: '이김', class: 'bg-fg text-canvas' },
  lose: { label: '패', word: '짐', class: 'border border-line-strong text-fg-subtle' },
  draw: { label: '무', word: '비김', class: 'bg-surface-3 text-fg-muted' },
}
const PERIODS = [
  { value: 'WEEK', label: '이번 주' },
  { value: 'MONTH', label: '이번 달' },
  { value: 'YEAR', label: '올해' },
  { value: 'ALL', label: '전체' },
]
const PREVIOUS = { WEEK: '지난주', MONTH: '지난달', YEAR: '작년' }
// 활동 달력 칸의 진하기: 0판 · 1판 · 2~3판 · 4판 이상 (색 대신 밝기)
const HEAT = ['bg-surface-2', 'bg-fg/30', 'bg-fg/60', 'bg-fg']
const WEEKS = 26

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const error = ref('')
const hidden = ref(false)
const s = ref(null)
const nickname = ref('')
const isMe = ref(route.params.id === '0')
const ratings = ref([])
const overview = ref(null)
// 가진 능력·종합 1위 (docs/organizations.md 3-3)
const crowns = ref([])
/** '전국·합정동 1위'. 없으면 '' */
function crownText(kind, key) {
  const seats = crowns.value.filter((c) => c.kind === kind && c.key === key).map((c) => c.seatLabel)
  return seats.length ? `${seats.join('·')} 1위` : ''
}
const periodKey = ref('WEEK')
const pickedId = ref(null)
const allRules = ref(false)
const allMatches = ref(false)
const helpOpen = ref(false)

const pct = (n, of) => `${of ? (n * 100) / of : 0}%`

const period = computed(() => s.value.periods.find((p) => p.key === periodKey.value))
const periodLabel = computed(() => PERIODS.find((p) => p.value === periodKey.value).label)
const compare = computed(() => {
  const prev = period.value.previousGames
  const name = PREVIOUS[periodKey.value]
  if (prev == null || !name) return ''
  const diff = period.value.tally.games - prev
  if (!prev && !diff) return ''
  if (!prev) return `${name}엔 안 했어요`
  if (diff > 0) return `${name}보다 ${diff}판 더 했어요 (${name} ${prev}판)`
  return diff < 0 ? `${name}엔 ${prev}판 했어요` : `${name}와 같아요 (${prev}판)`
})
const periodCards = computed(() => [
  { label: '만난 사람', value: `${period.value.opponents}명` },
  { label: '활동한 날', value: `${period.value.activeDays}일` },
  { label: '연습 (AI)', value: `${period.value.practiceGames}판` },
])

// 26주 × 7일 (월요일부터, 왼쪽이 오래된 주). 오늘 뒤의 칸은 비운다
const weeks = computed(() => {
  const counts = new Map(s.value.activity.map((d) => [d.date, d.games]))
  const start = new Date(`${s.value.activitySince}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Array.from({ length: WEEKS }, (_, w) =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + w * 7 + i)
      const date = ymd(d)
      const games = counts.get(date) || 0
      return { date, future: d > today, level: games >= 4 ? 3 : games >= 2 ? 2 : games ? 1 : 0 }
    }),
  )
})
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
// 주가 끝나기 전엔 연속이 끊기지 않는다. 이번 주가 비었으면 '한 판 하면 N주 연속' (목표가 눈앞에 보이게)
const streakLine = computed(() => {
  const n = s.value.weekStreak
  // 이번 주에 했으면 위의 큰 숫자와 'N주 연속' 표가 이미 말한다
  if (s.value.activeThisWeek) return ''
  if (n) return isMe.value ? `이번 주에 한 판 하면 ${n + 1}주 연속이에요` : `지난주까지 ${n}주 연속 했어요`
  return ''
})

function matchWho(m) {
  if (m.teams) return m.opponent ? `${m.opponent.nickname} 팀과` : '팀 경기'
  if (m.players > 2) return `${m.players}명 중 ${m.place}등`
  return m.opponent ? `vs ${m.opponent.nickname}` : ''
}
const openMatch = (m) => router.push(`/feed?gameId=${m.gameId}`)

// 순위 문구: 10명 미만이면 '5명 중 2위', 넘으면 '상위 12%'
function standing(rank, people) {
  if (!rank || !people) return ''
  if (people < 10) return `${people}명 중 ${rank}위`
  return `상위 ${Math.max(1, Math.ceil((rank * 100) / people))}%`
}
function untilRanked(r) {
  // '순위까지 3판 · 상대 1명'은 뜻이 헷갈렸다: 더 필요한 것만, '더'를 붙여
  const need = [r.needGames && `${r.needGames}판`, r.needOpponents && `새 상대 ${r.needOpponents}명`].filter(Boolean).join(', ')
  return need ? `순위까지 ${need} 더` : ''
}
const rankLine = (r) => (r.rank ? (showRank(r.rank, r.rankedPlayers) ? `전국 ${r.rank}위 · ${standing(r.rank, r.rankedPlayers)}` : '') : untilRanked(r))
const rankShort = (r) => (r.rank ? (showRank(r.rank, r.rankedPlayers) ? `${r.rank}위` : '') : untilRanked(r))
const score = (v) => (Number.isInteger(v) ? v : v.toFixed(1))

// 실력 점수가 있는 게임 (게임별 줄 + 흐름). 흐름은 /api/rankings/history
const ratedRules = computed(() => s.value.rules.filter((r) => r.rating != null))
const picked = computed(() => ratedRules.value.find((r) => r.ruleId === pickedId.value) || ratedRules.value[0])
const points = computed(() => ratings.value.find((h) => h.ruleId === picked.value?.ruleId)?.points || [])
const trend = computed(() => {
  const p = points.value
  return p.length >= 2 ? p[p.length - 1].rating - p[Math.max(0, p.length - 6)].rating : 0
})
const chart = computed(() => {
  const p = points.value
  if (p.length < 2 || !picked.value) return null
  const ys = p.map((x) => x.rating)
  const { rating, margin } = picked.value
  const lo = Math.min(...ys, rating - margin)
  const span = Math.max(Math.max(...ys, rating + margin) - lo, 20)
  const y = (v) => 68 - ((v - lo) / span) * 64
  const x = (i) => (i / (ys.length - 1)) * 290 + 4
  return {
    first: ys[0],
    points: ys.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' '),
    lastX: x(ys.length - 1),
    lastY: y(ys[ys.length - 1]),
    bandTop: y(rating + margin),
    bandBottom: y(rating - margin),
  }
})

const told = ref(false) // 서버가 이유를 말한 실패 (다시 불러와도 같다)
async function load() {
  loading.value = true
  error.value = ''
  hidden.value = false
  try {
    const { data } = await GET('/api/user-profile/{userId}/stats', { path: { userId: Number(route.params.id) } })
    const [history, ov, seatsRes] = await Promise.all([
      GET('/api/rankings/history', { query: { userId: data.userId } }).catch(() => ({ data: [] })),
      GET('/api/rankings/overview', { query: { userId: data.userId } }).catch(() => ({ data: null })),
      GET('/api/champions/users/{userId}', { path: { userId: data.userId } }).catch(() => ({ data: null })),
    ])
    crowns.value = seatsRes.data?.crowns ?? []
    nickname.value = data.nickname
    isMe.value = data.isMe
    ratings.value = history.data || []
    overview.value = ov.data
    // 이번 주에 한 게 없으면 한 게 있는 가장 짧은 기간
    periodKey.value = (data.periods.find((p) => p.tally.games + p.practiceGames > 0) || data.periods[data.periods.length - 1]).key
    s.value = data
  } catch (e) {
    if (e.response?.status === 403) hidden.value = true
    else {
      told.value = !!e.response?.data?.message
      error.value = e.response?.data?.message || '기록을 불러오지 못했어요'
    }
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
