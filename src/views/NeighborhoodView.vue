<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar title="내 동네" back />

    <main class="max-w-xl mx-auto px-4 pt-2 pb-24">
      <!-- 다른 화면에서 막혀서 왔으면 이유부터 -->
      <UiCard v-if="reason" class="mb-4 flex items-start gap-3">
        <UiIcon name="location-dot" class="text-lg mt-0.5" aria-hidden="true" />
        <p class="t-body flex-1">{{ reason }}</p>
      </UiCard>

      <div v-if="loading" class="space-y-3 pt-2">
        <UiSkeleton class="h-24 w-full" />
        <UiSkeleton class="h-24 w-full" />
      </div>

      <!-- 못 불러왔을 때 '동네가 없다'로 보이지 않게 -->
      <UiEmptyState v-else-if="loadError" class="pt-16" icon="fas fa-triangle-exclamation" title="동네를 불러오지 못했어요" description="잠시 뒤 다시 해 주세요">
        <UiButton variant="secondary" @click="load">다시 시도</UiButton>
      </UiEmptyState>

      <!-- 아직 동네가 없으면 인증부터 -->
      <template v-else-if="!list.length">
        <h1 class="t-title mt-2">동네를 인증해 주세요</h1>
        <p class="t-body text-fg-muted mt-2">내 동네 근처 경기가 보여요</p>
        <NeighborhoodVerify class="mt-4" :current="list" :max-count="maxCount" @verified="onVerified" />
      </template>

      <template v-else>
        <!-- 동네 (최대 2개). 누르면 지금 동네로 -->
        <section aria-label="인증한 동네" class="space-y-3 pt-2">
          <UiCard v-for="n in list" :key="n.code" class="!p-0">
            <button type="button" class="w-full flex items-center gap-3 p-4 text-left" :aria-pressed="n.active" @click="select(n)">
              <span class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" :class="n.active ? 'bg-fg text-canvas' : 'border-2 border-line-strong'" aria-hidden="true">
                <UiIcon v-if="n.active" name="check" class="text-xs" />
              </span>
              <span class="flex-1 min-w-0">
                <span class="block t-heading">{{ n.name }}</span>
                <span class="block t-caption mt-0.5 truncate">{{ n.shortName }}</span>
              </span>
              <UiBadge v-if="n.expired" tone="danger">인증 지남</UiBadge>
              <UiBadge v-else-if="n.active" tone="primary">지금 동네</UiBadge>
            </button>
            <div class="flex items-center justify-between border-t border-line px-4 h-11">
              <span class="t-micro">{{ n.expired ? '다시 인증해야 경기를 열고 신청할 수 있어요' : `${dateText(n.expiresAt)}까지 인증` }}</span>
              <span class="flex -mr-2">
                <UiButton variant="ghost" size="sm" @click="openVerify(n.code)">다시 인증</UiButton>
                <UiButton variant="ghost" size="sm" @click="confirmRemove(n)">삭제</UiButton>
              </span>
            </div>
          </UiCard>
          <UiButton v-if="list.length < maxCount" block variant="secondary" icon="plus" @click="openVerify('')">동네 추가</UiButton>
        </section>

        <!-- 범위: 지금 동네 기준 -->
        <section v-if="active" class="mt-10">
          <h2 class="t-heading">{{ active.name }}에서 어디까지 볼까요?</h2>
          <p class="t-caption mt-1">경기 목록과 동네 순위가 이 범위를 따라요</p>
          <div class="flex p-1 mt-4 bg-surface rounded-xl" role="radiogroup" aria-label="동네 범위">
            <button
              v-for="r in ranges"
              :key="r.level"
              type="button"
              role="radio"
              :aria-checked="active.rangeLevel === r.level"
              class="flex-1 h-10 rounded-lg text-xs transition-colors"
              :class="active.rangeLevel === r.level ? 'bg-surface-3 text-fg font-semibold' : 'text-fg-muted'"
              :disabled="savingRange"
              @click="setRange(r.level)"
            >
              {{ r.label }}
            </button>
          </div>
          <p class="t-body mt-4">
            <template v-if="active.nearbyCount">{{ active.name }}과 근처 동네 <b>{{ active.nearbyCount }}곳</b></template>
            <template v-else><b>{{ active.name }}</b>만</template>
          </p>
          <p v-if="active.nearbyNames.length" class="t-caption mt-1">{{ active.nearbyNames.join(', ') }}{{ active.nearbyCount > active.nearbyNames.length ? ' …' : '' }}</p>
        </section>
      </template>
    </main>

    <UiSheet v-model="verifyOpen" :title="expectName ? `${expectName} 다시 인증` : '지금 위치로 인증'">
      <NeighborhoodVerify :key="expectCode" :current="list" :max-count="maxCount" :expect-code="expectCode" @verified="onVerified" />
    </UiSheet>
  </div>
</template>

<script setup lang="ts">
// 내 동네 (/neighborhood): 인증한 동네 2개까지, 지금 동네 고르기, 범위(당근의 '동네 범위'), 다시 인증·지우기.
// 경기를 열거나 신청하다 동네가 필요해 막히면 api.js가 ?back=&reason=을 붙여 이리로 보낸다. 인증하면 돌아간다
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { GET, POST } from '@/api/client'
import type { components } from '@/api/schema'
import NeighborhoodVerify from '../components/neighborhood/NeighborhoodVerify.vue'
import { UiBadge, UiButton, UiCard, UiEmptyState, UiSheet, UiSkeleton, UiTopBar } from '../components/ui'
import { useToast } from '../composables/useToast'
import { confirmDialog } from '../composables/useConfirm'

type Mine = components['schemas']['MyNeighborhoods']

const route = useRoute()
const router = useRouter()
const { showToast } = useToast()

const loading = ref(true)
const data = ref<Mine | null>(null)
const verifyOpen = ref(false)
const savingRange = ref(false)

const list = computed(() => data.value?.neighborhoods ?? [])
const ranges = computed(() => data.value?.ranges ?? [])
const maxCount = computed(() => data.value?.maxCount ?? 2)
const active = computed(() => list.value.find((n) => n.active))
const reason = computed(() => (typeof route.query.reason === 'string' ? route.query.reason : ''))

function dateText(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

// 다시 인증은 그 동네 안에서만 된다 (엉뚱한 동네가 인증되지 않게). 추가는 지금 위치 그대로
const expectCode = ref('')
const expectName = computed(() => list.value.find((n) => n.code === expectCode.value)?.name ?? '')
function openVerify(code: string) {
  expectCode.value = code
  verifyOpen.value = true
}

function onVerified(next: Mine) {
  data.value = next
  verifyOpen.value = false
  showToast(`${next.neighborhoods.find((n) => n.active)?.name ?? '동네'} 인증을 마쳤어요`)
  const back = route.query.back
  if (typeof back === 'string' && back.startsWith('/')) router.replace(back)
}

async function select(n: Mine['neighborhoods'][number]) {
  if (n.active) return
  try {
    data.value = (await POST('/api/neighborhoods/select', { body: { code: n.code } })).data
    showToast(`지금 동네를 ${n.name}으로 바꿨어요`)
  } catch (e) {
    showToast(errMessage(e, '바꾸지 못했어요. 다시 해 주세요'))
  }
}

async function setRange(level: number) {
  if (!active.value || active.value.rangeLevel === level) return
  savingRange.value = true
  try {
    data.value = (await POST('/api/neighborhoods/range', { body: { code: active.value.code, level } })).data
  } catch (e) {
    showToast(errMessage(e, '범위를 바꾸지 못했어요. 다시 해 주세요'))
  } finally {
    savingRange.value = false
  }
}

async function confirmRemove(n: Mine['neighborhoods'][number]) {
  const last = list.value.length === 1
  const ok = await confirmDialog({
    title: `${n.name}을 지울까요?`,
    message: last ? '동네가 없으면 경기를 열거나 신청할 수 없어요' : n.active ? '남은 동네가 지금 동네가 돼요' : '다시 쓰려면 그 동네에서 인증해야 해요',
    confirmText: '삭제',
    danger: true,
  })
  if (!ok) return
  try {
    data.value = (await POST('/api/neighborhoods/remove', { body: { code: n.code } })).data
  } catch (e) {
    showToast(errMessage(e, '지우지 못했어요. 다시 해 주세요'))
  }
}

const loadError = ref(false)
const errMessage = (e: unknown, fallback: string) => (e as { response?: { data?: { message?: string } } }).response?.data?.message || fallback
async function load() {
  loading.value = true
  loadError.value = false
  try {
    data.value = (await GET('/api/neighborhoods/me')).data
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>
