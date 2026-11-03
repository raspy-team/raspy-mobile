<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar :title="ruleName ? `${ruleName} 랭킹` : '랭킹'" back />

    <main class="max-w-2xl mx-auto px-4 pt-2 pb-16">
      <div v-if="loading && !rankings.length" class="space-y-3">
        <UiSkeleton class="h-20 w-full" />
        <UiSkeleton v-for="n in 5" :key="n" class="h-14 w-full" />
      </div>

      <UiEmptyState v-else-if="error" class="pt-16" icon="fas fa-triangle-exclamation" :title="error" description="잠시 뒤 다시 시도해주세요">
        <UiButton variant="secondary" @click="load">다시 불러오기</UiButton>
      </UiEmptyState>

      <template v-else>
        <!-- 동네 / 전국 (동네가 있을 때만) -->
        <UiTabs v-if="areaName" class="mb-4" :model-value="scope" :options="[{ value: 'dong', label: areaName }, { value: 'all', label: '전국' }]" @update:model-value="setScope" />

        <!-- 내 자리 -->
        <UiCard class="flex items-center gap-4">
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

        <UiEmptyState v-if="!rankings.length" class="pt-12" icon="fas fa-ranking-star" title="아직 랭킹이 없어요" description="5판 넘게 한 사람부터 순위에 올라요" />

        <UiList v-else class="mt-6">
          <UiListItem
            v-for="r in rankings"
            :key="r.userId"
            :title="r.isCurrentUser ? `${r.userName} (나)` : r.userName"
            :subtitle="`경기 ${r.playCount}번`"
            chevron
            @click="router.push('/profile/' + r.userId)"
          >
            <template #leading>
              <span class="w-7 text-center tabular-nums" :class="r.rank <= 3 ? 't-heading text-fg' : 't-label text-fg-subtle'">{{ r.rank }}</span>
              <UiAvatar :src="r.userAvatar" :name="r.userName" :user-id="r.userId" size="sm" />
            </template>
            <template #trailing>
              <span class="t-heading tabular-nums">{{ r.rating }}</span>
            </template>
          </UiListItem>
        </UiList>
      </template>
    </main>
  </div>
</template>

<script setup>
// 규칙 랭킹: 동네/전국 → 내 자리 → 순위. 처음에는 서버가 정한 범위(앱 밖 경기는 동네, 앱 게임은 전국)
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../api/api'
import { UiAvatar, UiButton, UiCard, UiEmptyState, UiList, UiListItem, UiSkeleton, UiTabs, UiTopBar } from '../../components/ui'

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
const areaName = ref('')

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
    areaName.value = data.areaName || ''
    ruleName.value = data.ruleName || ''
    appGameKey.value = data.appGameKey || ''
    rankings.value = data.rankings || []
    me.value = data.currentUserRanking || null
  } catch (e) {
    error.value = e.response?.data?.message || '랭킹을 불러오지 못했어요'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
