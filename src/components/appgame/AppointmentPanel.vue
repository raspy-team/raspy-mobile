<template>
  <UiSkeleton v-if="!a && !error" class="h-48 w-full" />
  <UiEmptyState v-else-if="error" class="pt-16" icon="fas fa-triangle-exclamation" :title="error" />
  <div v-else-if="a">
    <UiCard class="text-center py-8">
      <UiAvatar :src="other?.profilePicture" :name="other?.nickname" :user-id="other?.userId" size="lg" class="mx-auto" />
      <p class="t-title mt-4">{{ headline }}</p>
      <p v-if="a.matchDate && a.state !== 'CLOSED'" class="t-heading mt-2">{{ matchTime(a.matchDate) }}</p>
      <p v-if="line" class="t-caption mt-2">{{ line }}</p>
    </UiCard>

    <!-- 시간 고르기: 받은 사람이 처음 정할 때, 또는 둘 중 누구든 바꿀 때 -->
    <div v-if="picking" class="mt-5">
      <p class="t-heading">{{ a.matchDate ? '언제로 바꿀까요?' : '언제 할까요?' }}</p>
      <div class="flex flex-wrap gap-2 mt-3">
        <UiChip v-for="c in choices" :key="c.label" :selected="pick === c.label" @click="choose(c)">{{ c.label }}</UiChip>
        <UiChip :selected="pick === EXACT" @click="pick = EXACT; at = ''">{{ EXACT }}</UiChip>
      </div>
      <UiInput v-if="pick === EXACT" v-model="exact" class="mt-2" type="datetime-local" :min="nowLocal" />
      <p v-else-if="pick && at" class="t-caption mt-2">{{ matchTime(at) }}</p>
      <UiButton block size="lg" class="mt-4" :disabled="!ready" :loading="busy" @click="schedule">{{ pick === NOW ? '지금 하기' : '이 시간으로' }}</UiButton>
    </div>

    <!-- 약속 시간 무렵: 들어가기 · 기다리기 -->
    <template v-else-if="a.state === 'OPEN'">
      <UiButton v-if="!a.meReady" block size="lg" class="mt-4" :loading="busy" @click="arrive">들어가기</UiButton>
      <div v-else class="mt-5 flex items-center justify-center gap-2 t-body">
        <UiSpinner /> {{ other?.nickname }}님을 기다리는 중
      </div>
    </template>

    <!-- 그 밖의 손짓 -->
    <div v-if="a.state !== 'CLOSED' && a.state !== 'STARTED'" class="mt-3 flex justify-center gap-2">
      <UiButton v-if="a.matchDate && !picking && !a.meReady" variant="ghost" @click="startPicking">시간 바꾸기</UiButton>
      <UiButton v-if="picking && a.matchDate" variant="ghost" @click="picking = false">그대로 두기</UiButton>
      <UiButton variant="ghost" :loading="declining" @click="decline">{{ a.mine ? '도전 취소' : '다음에' }}</UiButton>
    </div>
    <UiButton block variant="ghost" class="mt-2" :to="`/play/${a.key}`">이 게임 둘러보기</UiButton>
  </div>
</template>

<script setup lang="ts">
// 앱 게임 약속 하나 (11/5): 실시간 게임 도전은 기다리지 않는다. 도전장 → 받은 사람이 시간 → 그 시간에 둘 다 들어오면 시작.
// 상태는 서버(AppAppointmentService)가 정하고, 바뀌면 신호(APPOINTMENT·REALTIME)로 다시 부른다 (폴링 없음).
// 기다리는 동안만 45초마다 '들어와 있어요'를 다시 알린다 (앱을 끄고 나간 사람과 시작하지 않게, 서버는 90초 안의 것만 친다)
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { GET, POST } from '@/api/client'
import type { components } from '@/api/schema'
import { matchTime } from '@/utils/format'
import { localIso, quickTimes } from '@/utils/when'
import { refreshOnChange } from '@/websocket/userChannel'
import { useToast } from '@/composables/useToast'
import { confirmDialog } from '@/composables/useConfirm'
import { UiAvatar, UiButton, UiCard, UiChip, UiEmptyState, UiInput, UiSkeleton, UiSpinner } from '../ui'

const props = defineProps<{ gameId: number }>()
const router = useRouter()
const { showToast } = useToast()

type Appointment = components['schemas']['AppAppointment']
const a = ref<Appointment | null>(null)
const error = ref('')
const busy = ref(false)
const declining = ref(false)

const other = computed(() => (a.value ? (a.value.mine ? a.value.guest : a.value.host) : null))
const headline = computed(() => {
  const x = a.value
  if (!x) return ''
  if (x.state === 'CLOSED') return '끝났거나 지난 약속이에요'
  return x.mine ? `${other.value?.nickname}님에게 '${x.title}' 도전` : `${other.value?.nickname}님이 '${x.title}' 한 판 하재요`
})
const line = computed(() => {
  const x = a.value
  if (!x) return ''
  if (x.state === 'ASKED') return x.mine ? `${other.value?.nickname}님이 시간을 정하면 알려 드려요` : ''
  if (x.state === 'SCHEDULED') return '10분 전과 그 시간에 둘에게 알려 드려요'
  if (x.state === 'OPEN') return x.otherReady && !x.meReady ? `${other.value?.nickname}님이 들어와 있어요` : x.meReady ? '' : '들어오면 상대와 바로 시작해요'
  return ''
})

// 시간 고르기: 받은 사람이 처음 정할 때는 바로 보인다
const picking = ref(false)
const NOW = '지금'
const EXACT = '직접 고르기'
const pick = ref('')
const at = ref('') // 고른 시각 (지금이면 '')
const exact = ref('')
const nowLocal = localIso(new Date()).slice(0, 16)
const choices = computed(() => [{ label: NOW, date: () => '' }, ...quickTimes()])
const ready = computed(() => pick.value === NOW || (pick.value === EXACT ? !!exact.value : !!at.value))
function choose(c: { label: string; date: () => string | null }) {
  pick.value = c.label
  at.value = c.date() || ''
}
function startPicking() {
  pick.value = ''
  at.value = ''
  picking.value = true
}

async function load() {
  try {
    a.value = (await GET('/api/app-games/appointments/{gameId}', { path: { gameId: props.gameId } })).data
    error.value = ''
  } catch (e) {
    const r = (e as { response?: { status?: number; data?: { message?: string } } }).response
    error.value = r?.status === 404 ? '없거나 지워진 도전장이에요' : r?.data?.message || '도전장을 불러오지 못했어요'
  }
}

// 상태가 바뀌면: 받은 사람이 아직 안 정했으면 고르기를 펴고, 시작했으면 판으로
watch(a, (x) => {
  if (!x) return
  if (x.state === 'STARTED') {
    router.replace({ path: `/play/${x.key}/live`, query: { game: String(x.gameId) } })
    return
  }
  if (x.state === 'ASKED' && !x.mine) picking.value = true
  else if (x.state !== 'ASKED' && !x.matchDate) picking.value = false
})

async function schedule() {
  busy.value = true
  try {
    const when = pick.value === NOW ? undefined : pick.value === EXACT ? `${exact.value.slice(0, 16)}:00` : at.value
    a.value = (await POST('/api/app-games/appointments/{gameId}/schedule', { path: { gameId: props.gameId }, query: when ? { at: when } : {} })).data
    picking.value = false
    showToast(pick.value === NOW ? `${other.value?.nickname}님에게 지금 하자고 알렸어요` : `${other.value?.nickname}님에게 알렸어요`)
    // 지금이면 바로 들어간다
    if (a.value?.state === 'OPEN' && !a.value.meReady) await arrive()
  } catch (e) {
    showToast((e as { response?: { data?: { message?: string } } }).response?.data?.message || '시간을 정하지 못했어요')
  } finally {
    busy.value = false
  }
}

async function arrive() {
  busy.value = true
  try {
    a.value = (await POST('/api/app-games/appointments/{gameId}/arrive', { path: { gameId: props.gameId } })).data
  } catch (e) {
    showToast((e as { response?: { data?: { message?: string } } }).response?.data?.message || '들어가지 못했어요')
    await load()
  } finally {
    busy.value = false
  }
}

async function decline() {
  const mine = a.value?.mine
  const ok = await confirmDialog({
    title: mine ? '도전을 취소할까요?' : '다음에 할까요?',
    message: `${other.value?.nickname}님에게 알려요`,
    confirmText: mine ? '도전 취소' : '다음에',
  })
  if (!ok) return
  declining.value = true
  try {
    a.value = (await POST('/api/app-games/appointments/{gameId}/decline', { path: { gameId: props.gameId } })).data
  } catch (e) {
    showToast((e as { response?: { data?: { message?: string } } }).response?.data?.message || '처리하지 못했어요')
  } finally {
    declining.value = false
  }
}

// 기다리는 동안만 '들어와 있어요'를 다시 알린다
let beat: ReturnType<typeof setInterval> | null = null
watch(() => a.value?.state === 'OPEN' && a.value?.meReady, (waiting) => {
  if (beat) clearInterval(beat)
  beat = waiting ? setInterval(() => { if (!busy.value) arrive() }, 45_000) : null
})

let stop: (() => void) | null = null
onMounted(() => {
  load()
  stop = refreshOnChange(load)
})
onBeforeUnmount(() => {
  stop?.()
  if (beat) clearInterval(beat)
})
</script>
