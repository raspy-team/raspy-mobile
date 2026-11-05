<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar :title="ruleName ? `${ruleName} 순위` : '순위'" back />

    <main class="max-w-2xl mx-auto px-4 pt-2 pb-16">
      <div v-if="loading && !rankings.length" class="space-y-3">
        <UiSkeleton class="h-20 w-full" />
        <UiSkeleton v-for="n in 5" :key="n" class="h-14 w-full" />
      </div>

      <UiEmptyState v-else-if="error" class="pt-16" icon="fas fa-triangle-exclamation" :title="error" description="잠시 뒤 다시 해 주세요">
        <UiButton variant="secondary" @click="load">다시 불러오기</UiButton>
      </UiEmptyState>

      <template v-else>
        <!-- 자리: [소속] [동네] [전국] -->
        <SeatChips class="mb-4" :seats="seats" :model-value="scope" :no-org="noOrg" @update:model-value="setScope" />

        <!-- 내 자리. 아무도 순위에 없으면 아래 빈 화면 하나로 알린다 -->
        <UiCard v-if="me || rankings.length" class="flex items-center gap-4">
          <template v-if="me">
            <span class="t-display tabular-nums">{{ me.rank }}<span class="t-heading">위</span></span>
            <span class="flex-1 min-w-0">
              <span class="block t-heading">{{ me.rating }}점</span>
              <span class="block t-caption mt-0.5">경기 {{ me.playCount }}번</span>
            </span>
          </template>
          <template v-else>
            <span class="flex-1 min-w-0">
              <span class="block t-heading">아직 순위가 없어요</span>
              <span class="block t-caption mt-0.5">이 규칙으로 5판 하면 순위에 올라가요</span>
            </span>
            <UiButton size="sm" variant="tonal" :to="appGameKey ? `/play/${appGameKey}` : `/create-game?ruleId=${ruleId}`">
              {{ appGameKey ? '한 판 하기' : '경기 열기' }}
            </UiButton>
          </template>
        </UiCard>

        <UiEmptyState v-if="!rankings.length" class="pt-12" mascot="match" title="아직 순위가 비어 있어요" :description="baselines.length ? '사람과 5판을 하면 첫 이름이 올라가요. 아래 AI 기준선과 견줘 보세요' : '사람과 5판을 하면 첫 이름이 올라가요. 먼저 올라가 보세요'">
          <UiButton variant="secondary" :to="appGameKey ? `/play/${appGameKey}` : `/create-game?ruleId=${ruleId}`">
            {{ appGameKey ? '한 판 하기' : '경기 열기' }}
          </UiButton>
        </UiEmptyState>

        <!-- 사람 순위가 비어도 AI 기준선은 보인다 (docs/ai-residents.md 2) -->
        <UiList v-if="rows.length" class="mt-6">
          <template v-for="(x, i) in rows" :key="x.kind === 'user' ? x.row.userId : `ai-${i}`">
            <BaselineRow v-if="x.kind === 'ai'" :line="x.line" />
            <UiListItem
              v-else
              :title="x.row.isCurrentUser ? `${x.row.userName} (나)` : x.row.userName"
              :subtitle="`경기 ${x.row.playCount}번`"
              chevron
              @click="router.push('/profile/' + x.row.userId)"
            >
              <template #leading>
                <span class="w-7 text-center tabular-nums" :class="x.row.rank <= 3 ? 't-heading text-fg' : 't-label text-fg-subtle'">{{ x.row.rank }}</span>
                <UiAvatar :src="x.row.userAvatar" :name="x.row.userName" :user-id="x.row.userId" size="sm" />
              </template>
              <template #trailing>
                <span class="t-heading tabular-nums">{{ x.row.rating }}</span>
              </template>
            </UiListItem>
          </template>
        </UiList>
        <!-- 사람이 20명을 넘으면 기준선을 접는다 (7 물러나기) -->
        <UiButton v-if="baselines.length && folded" block variant="ghost" class="mt-2" @click="showAi = !showAi">
          {{ showAi ? 'AI 기준 접기' : 'AI 기준 보기' }}
        </UiButton>

        <!-- 역대 전국 챔피언 (앱 게임). AI 보스는 첫 줄에 AI 표시 -->
        <section v-if="history.length" class="mt-10">
          <h2 class="t-heading mb-3">역대 전국 챔피언</h2>
          <UiList>
            <div v-for="(h, i) in [...history].reverse()" :key="i" class="flex items-center gap-3 px-4 min-h-[56px] py-3">
              <UiIcon name="crown" :class="h.until ? 'text-fg-subtle' : 'text-signal-fg'" aria-hidden="true" />
              <span class="flex-1 min-w-0">
                <span class="flex items-center min-w-0"><span class="truncate">{{ h.nickname }}</span><UiAiBadge v-if="h.ai" /></span>
                <span class="block t-micro mt-0.5">{{ period(h) }}</span>
              </span>
            </div>
          </UiList>
        </section>
      </template>
    </main>
  </div>
</template>

<script setup>
// 규칙 랭킹: 자리 칩(소속·동네·전국) → 내 자리 → 순위. 처음에는 서버가 정한 자리(앱 게임은 첫 소속, 앱 밖 경기는 동네, 없으면 전국)
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../api/api'
import { UiAiBadge, UiAvatar, UiButton, UiCard, UiEmptyState, UiIcon, UiList, UiListItem, UiSkeleton, UiTopBar } from '../../components/ui'
import SeatChips from '../../components/champion/SeatChips.vue'
import BaselineRow from '../../components/champion/BaselineRow.vue'
import { FOLD_AT, withBaselines } from '../../components/champion/rankingBaselines'

const route = useRoute()
const router = useRouter()
const ruleId = route.params.ruleId
const ruleName = ref('')
const appGameKey = ref('')
const rankings = ref([])
const me = ref(null)
const loading = ref(true)
const error = ref('')
const scope = ref('')
const seats = ref([])
const noOrg = ref(false)
const baselines = ref([])
const history = ref([])
const showAi = ref(false)
// 사람이 20명을 넘으면 기준선을 접어 둔다
const folded = computed(() => rankings.value.length > FOLD_AT)
const rows = computed(() => withBaselines(rankings.value, folded.value && !showAi.value ? [] : baselines.value))

function day(s) {
  const d = new Date(s)
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`
}
function period(h) {
  return h.until ? `${day(h.since)} ~ ${day(h.until)}` : `${day(h.since)}부터 지금`
}

function setScope(v) {
  scope.value = v
  load()
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get(`/api/rules/${ruleId}/rankings`, { params: scope.value ? { scope: scope.value } : {} })
    scope.value = data.scope
    seats.value = data.seats || []
    noOrg.value = !!data.noOrg
    ruleName.value = data.ruleName || ''
    appGameKey.value = data.appGameKey || ''
    rankings.value = data.rankings || []
    me.value = data.currentUserRanking || null
    baselines.value = data.baselines || []
    // 역대 전국 챔피언은 앱 게임만 (못 불러와도 순위는 보인다)
    if (data.appGameKey && !history.value.length) api.get(`/api/champions/rules/${ruleId}/history`).then((r) => { history.value = r.data || [] }, () => {})
  } catch (e) {
    error.value = e.response?.data?.message || '순위를 불러오지 못했어요'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
