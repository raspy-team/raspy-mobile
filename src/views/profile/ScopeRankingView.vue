<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar :title="data ? `${data.label} 순위` : '순위'" back />

    <main class="max-w-2xl mx-auto px-4 pt-2 pb-16">
      <div v-if="loading && !data" class="space-y-3">
        <UiSkeleton class="h-20 w-full" />
        <UiSkeleton v-for="n in 5" :key="n" class="h-14 w-full" />
      </div>

      <UiEmptyState v-else-if="error" class="pt-16" icon="fas fa-triangle-exclamation" :title="error" description="잠시 뒤 다시 해 주세요">
        <UiButton variant="secondary" @click="load()">다시 불러오기</UiButton>
      </UiEmptyState>

      <template v-else-if="data">
        <SeatChips class="mb-4" :seats="data.seats" :model-value="data.seat" :no-org="data.noOrg" @update:model-value="load" />

        <!-- 순위가 통째로 비었으면 내 칸('아직 순위가 없어요')과 빈 화면이 같은 말을 두 번 한다: 빈 화면 하나만 (first10 검토) -->
        <UiCard v-if="data.me || data.rankings.length" class="flex items-center gap-4">
          <template v-if="data.me">
            <span class="t-display tabular-nums">{{ data.me.rank }}<span class="t-heading">위</span></span>
            <span class="flex-1 min-w-0">
              <span class="block t-heading">{{ data.me.rating }}점</span>
              <span class="block t-caption mt-0.5">{{ data.me.crown ? `${seatName} ${data.label} 1위예요` : '1위는 매일 새벽 4시에 정해요' }}</span>
            </span>
          </template>
          <span v-else class="flex-1 min-w-0">
            <span class="block t-heading">아직 순위가 없어요</span>
            <span class="block t-caption mt-0.5">{{ data.label }}에 드는 게임을 사람과 5판 하면 올라가요</span>
          </span>
        </UiCard>

        <UiEmptyState v-if="!data.rankings.length" class="pt-12" mascot="dol" title="아직 순위가 비어 있어요" :description="`${data.label}에 드는 게임을 사람과 5판 하면 첫 이름이 올라가요`">
          <UiButton to="/games">한 판 하러 가기</UiButton>
        </UiEmptyState>

        <UiList v-else class="mt-6">
          <UiListItem
            v-for="r in data.rankings"
            :key="r.userId"
            :title="r.isCurrentUser ? `${r.userName} (나)` : r.userName"
            :subtitle="r.crown ? `${seatName} ${data.label} 1위` : undefined"
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

<script setup lang="ts">
// 능력·종합 순위 (/rankings/:kind/:key): 자리 칩 → 내 자리 → 순위. 기본은 첫 소속, 없으면 전국 (docs/organizations.md 4)
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { GET } from '@/api/client'
import type { components } from '@/api/schema'
import { UiAvatar, UiButton, UiCard, UiEmptyState, UiList, UiListItem, UiSkeleton, UiTopBar } from '../../components/ui'
import SeatChips from '../../components/champion/SeatChips.vue'

type Kind = components['schemas']['ScopeRankingResponse']['kind']

const route = useRoute()
const router = useRouter()
const data = ref<components['schemas']['ScopeRankingResponse'] | null>(null)
const loading = ref(true)
const error = ref('')
const seatName = computed(() => data.value?.seats.find((s) => s.key === data.value?.seat)?.label ?? '')

async function load(seat?: string) {
  loading.value = true
  error.value = ''
  try {
    data.value = (await GET('/api/rankings/scope', {
      query: { kind: String(route.params.kind) as Kind, key: String(route.params.key), seat: seat ?? data.value?.seat },
    })).data
  } catch (e: any) {
    error.value = e.response?.data?.message || '순위를 불러오지 못했어요'
  } finally {
    loading.value = false
  }
}

onMounted(() => load())
</script>
