<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar :title="user ? (user.isMe ? '내 기록' : `${user.nickname}님의 기록`) : '기록'" back />

    <main v-if="loading" class="max-w-2xl mx-auto px-4 pt-6" role="status" aria-label="기록 불러오는 중">
      <UiSkeleton class="h-10 w-24" />
      <UiSkeleton class="h-3 w-full mt-4 rounded-full" />
      <div class="grid grid-cols-2 gap-3 mt-8">
        <UiSkeleton v-for="n in 4" :key="n" class="h-20 rounded-xl" />
      </div>
      <UiListSkeleton :rows="3" shape="tile" class="mt-8" />
    </main>

    <main v-else-if="error" class="max-w-2xl mx-auto px-4 pt-16">
      <UiEmptyState icon="fas fa-triangle-exclamation" :title="error" description="잠시 뒤 다시 시도해주세요">
        <UiButton variant="secondary" @click="load">다시 불러오기</UiButton>
      </UiEmptyState>
    </main>

    <main v-else-if="!games.length" class="max-w-2xl mx-auto px-4 pt-16">
      <UiEmptyState icon="fas fa-chart-simple" title="아직 기록이 없어요" :description="user.isMe ? '경기를 하면 승률·규칙별 기록·받은 평가가 여기 쌓여요' : '경기를 하면 기록이 쌓여요'">
        <UiButton v-if="user.isMe" to="/">경기 찾기</UiButton>
      </UiEmptyState>
    </main>

    <main v-else class="max-w-2xl mx-auto px-4 pt-6 pb-32 space-y-10 ui-appear">
      <!-- 승률 + 승무패 막대 -->
      <section>
        <div class="flex items-end justify-between">
          <div>
            <p class="t-caption">승률</p>
            <p class="text-5xl font-bold text-fg tabular-nums leading-none mt-1">{{ total.rate }}<span class="t-title">%</span></p>
          </div>
          <p class="t-body text-fg-muted tabular-nums">{{ total.win }}승 {{ total.draw }}무 {{ total.lose }}패</p>
        </div>
        <div class="flex h-2.5 mt-4 rounded-full overflow-hidden bg-surface-2" role="img" :aria-label="`${total.win}승 ${total.draw}무 ${total.lose}패`">
          <span class="bg-success" :style="{ width: pct(total.win) }"></span>
          <span class="bg-line-strong" :style="{ width: pct(total.draw) }"></span>
          <span class="bg-danger" :style="{ width: pct(total.lose) }"></span>
        </div>
      </section>

      <!-- 최근 흐름 -->
      <section>
        <div class="flex items-center justify-between mb-3">
          <h2 class="t-heading">최근 {{ recent.length }}경기</h2>
          <UiBadge v-if="streak.count >= 2" :tone="streak.kind === 'win' ? 'success' : streak.kind === 'lose' ? 'danger' : 'neutral'">
            {{ streak.count }}{{ streak.kind === 'win' ? '연승' : streak.kind === 'lose' ? '연패' : '연속 무승부' }} 중
          </UiBadge>
        </div>
        <!-- 왼쪽이 오래된 경기, 오른쪽이 가장 최근 -->
        <div class="flex gap-1.5">
          <span
            v-for="g in recent"
            :key="g.id"
            class="flex-1 max-w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
            :class="RESULT[g.r].class"
            :title="`${g.rule.ruleTitle} vs ${g.opponent.nickname}`"
          >
            {{ RESULT[g.r].label }}
          </span>
        </div>
        <p class="t-micro mt-2">왼쪽이 오래된 경기, 오른쪽이 가장 최근이에요</p>
      </section>

      <!-- 숫자 -->
      <section class="grid grid-cols-2 gap-3">
        <div v-for="c in cards" :key="c.label" class="rounded-xl border border-line p-4 [&:last-child:nth-child(odd)]:col-span-2">
          <p class="t-caption">{{ c.label }}</p>
          <p class="t-title tabular-nums mt-1">{{ c.value }}</p>
          <p v-if="c.hint" class="t-micro mt-0.5">{{ c.hint }}</p>
        </div>
      </section>

      <!-- 규칙별 -->
      <section>
        <h2 class="t-heading mb-1">규칙별 기록</h2>
        <UiList>
          <UiListItem
            v-for="r in allRules ? byRule : byRule.slice(0, 5)"
            :key="r.id"
            :title="r.title"
            :subtitle="[`${r.games}경기 · ${r.win}승 ${r.draw ? r.draw + '무 ' : ''}${r.lose}패`, r.rating && `${r.rating}점`, r.rank && `${r.rank}위`].filter(Boolean).join(' · ')"
            chevron
            @click="router.push(`/rules/${r.id}`)"
          >
            <template #leading>
              <RuleThumb :minor="r.minor" />
            </template>
            <template #trailing>
              <span class="t-heading tabular-nums">{{ r.rate }}%</span>
            </template>
          </UiListItem>
        </UiList>
        <UiButton v-if="byRule.length > 5" block variant="ghost" class="mt-2" @click="allRules = !allRules">
          {{ allRules ? '접기' : `${byRule.length}개 규칙 모두 보기` }}
        </UiButton>
      </section>

      <!-- 자주 만난 상대 -->
      <section>
        <h2 class="t-heading mb-1">자주 만난 상대</h2>
        <UiList>
          <UiListItem
            v-for="o in rivals"
            :key="o.id"
            :title="o.nickname"
            :subtitle="`${o.games}번 만남 · ${o.win}승 ${o.draw ? o.draw + '무 ' : ''}${o.lose}패`"
            chevron
            @click="router.push('/profile/' + o.id)"
          >
            <template #leading><UiAvatar :src="o.avatar" :name="o.nickname" size="sm" /></template>
            <template #trailing>
              <UiBadge :tone="o.win > o.lose ? 'success' : o.win < o.lose ? 'danger' : 'neutral'">
                {{ o.win > o.lose ? '우세' : o.win < o.lose ? '열세' : '팽팽' }}
              </UiBadge>
            </template>
          </UiListItem>
        </UiList>
      </section>

      <!-- 받은 한마디 -->
      <section v-if="reviews.length">
        <h2 class="t-heading mb-3">받은 한마디</h2>
        <ul class="space-y-3">
          <li v-for="g in reviews" :key="g.id" class="rounded-xl bg-surface p-4 border border-line">
            <p class="t-body whitespace-pre-line break-words">“{{ g.review }}”</p>
            <p class="t-micro mt-2">{{ g.opponent.nickname }} · {{ g.rule.ruleTitle }} · {{ timeAgo(g.date) }}</p>
          </li>
        </ul>
      </section>
    </main>
  </div>
</template>

<script setup>
import RuleThumb from '../../components/rule/RuleThumb.vue'
// 기록 자세히 (/profile/:id/stats): 승률 → 최근 흐름 → 숫자 → 규칙별 → 자주 만난 상대 → 받은 한마디
// 서버의 경기 목록(/user-profile/:id/games)에서 화면이 계산한다. 값이 없는 칸은 보여주지 않는다
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../api/api'
import { UiAvatar, UiBadge, UiButton, UiEmptyState, UiList, UiListItem, UiListSkeleton, UiSkeleton, UiTopBar } from '../../components/ui'
import { timeAgo } from '../../utils/format'

const RESULT = {
  win: { label: '승', class: 'bg-success-soft text-success-fg' },
  lose: { label: '패', class: 'bg-danger-soft text-danger-fg' },
  draw: { label: '무', class: 'bg-surface-2 text-fg-muted' },
}
const norm = (r) => (r === 'win' ? 'win' : r === 'lose' || r === 'loss' ? 'lose' : 'draw')

const route = useRoute()
const router = useRouter()
const user = ref(null)
const games = ref([]) // 오래된 → 최근
const loading = ref(true)
const allRules = ref(false)
const error = ref('')

function tally(list) {
  const t = { games: list.length, win: 0, draw: 0, lose: 0 }
  list.forEach((g) => t[g.r]++)
  t.rate = t.games ? Math.round((t.win * 100) / t.games) : 0
  return t
}
const total = computed(() => tally(games.value))
const pct = (n) => `${total.value.games ? (n * 100) / total.value.games : 0}%`

const recent = computed(() => games.value.slice(-10))
const streak = computed(() => {
  const list = games.value
  if (!list.length) return { count: 0 }
  const kind = list[list.length - 1].r
  let count = 0
  for (let i = list.length - 1; i >= 0 && list[i].r === kind; i--) count++
  return { kind, count }
})

function avg(key) {
  const xs = games.value.map((g) => g[key]).filter((v) => typeof v === 'number' && v > 0)
  return xs.length ? { value: (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1), n: xs.length } : null
}
const cards = computed(() => {
  const minutes = user.value?.playTime || 0
  const manner = avg('mannerScore')
  const perf = avg('performanceScore')
  return [
    { label: '경기', value: `${total.value.games}번`, hint: user.value?.totalPlayers ? `${user.value.totalPlayers}명과 겨룸` : '' },
    minutes > 0 && { label: '함께한 시간', value: minutes >= 60 ? `${Math.floor(minutes / 60)}시간 ${minutes % 60}분` : `${minutes}분`, hint: '' },
    manner && { label: '받은 매너', value: `★ ${manner.value}`, hint: `${manner.n}명이 평가` },
    perf && { label: '받은 실력', value: `★ ${perf.value}`, hint: `${perf.n}명이 평가` },
  ].filter(Boolean)
})

const byRule = computed(() => {
  const map = new Map()
  games.value.forEach((g) => {
    const k = g.rule.id
    if (!map.has(k)) map.set(k, { id: k, title: g.rule.ruleTitle, minor: g.rule.minorCategory, list: [] })
    map.get(k).list.push(g)
  })
  const top = new Map((user.value?.top3Rules || []).map((r) => [r.ruleId, r]))
  return [...map.values()]
    .map((r) => ({ ...r, ...tally(r.list), rating: top.get(r.id)?.rating, rank: top.get(r.id)?.myRank }))
    .sort((a, b) => b.games - a.games)
})

const rivals = computed(() => {
  const map = new Map()
  games.value.forEach((g) => {
    const o = g.opponent
    if (!o?.id) return
    if (!map.has(o.id)) map.set(o.id, { id: o.id, nickname: o.nickname, avatar: o.avatar, list: [] })
    map.get(o.id).list.push(g)
  })
  return [...map.values()].map((o) => ({ ...o, ...tally(o.list) })).sort((a, b) => b.games - a.games).slice(0, 3)
})

const reviews = computed(() => games.value.filter((g) => g.review && g.review.trim()).slice(-5).reverse())

async function load() {
  loading.value = true
  error.value = ''
  try {
    user.value = (await api.get(`/api/user-profile/${route.params.id}`)).data
    const { data } = await api.get(`/api/user-profile/${user.value.id}/games`)
    games.value = data.map((g) => ({ ...g, r: norm(g.result) })).sort((a, b) => new Date(a.date) - new Date(b.date))
  } catch (e) {
    error.value = e.response?.data?.message || '기록을 불러오지 못했어요'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
