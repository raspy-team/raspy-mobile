<template>
  <section v-if="state" class="rounded-xl bg-surface p-4" aria-label="응원">
    <div class="flex items-center justify-between">
      <h2 class="t-heading">누가 이길까요?</h2>
      <span class="t-micro">시작 전에만 · 고를 때 배수가 정해져요</span>
    </div>
    <!-- 편마다 배수(이기면 몇 배로 돌려받나)·이길 확률·응원 수. 편은 1:1이면 사람, 팀이면 팀 -->
    <div class="mt-3 grid gap-2" :style="{ gridTemplateColumns: `repeat(${Math.min(state.board.length, 3)}, minmax(0, 1fr))` }">
      <button
        v-for="b in state.board"
        :key="b.sideUserId"
        type="button"
        class="rounded-xl border px-3 py-2.5 text-left transition-colors"
        :class="picked === b.sideUserId ? 'border-fg bg-surface-2' : 'border-line'"
        :disabled="!state.canBet || closed || !!b.lockedReason"
        :aria-pressed="picked === b.sideUserId"
        @click="side = b.sideUserId"
      >
        <span class="block t-body truncate">{{ b.label }}</span>
        <template v-if="state.board.length > 1">
          <span class="block t-heading tabular-nums mt-0.5">×{{ b.multiplier.toFixed(2) }}</span>
          <span class="block t-micro tabular-nums">{{ b.rated ? `이길 확률 ${Math.round(b.chance * 100)}%` : '기록 없음 · 반반' }}</span>
        </template>
        <span class="block t-micro tabular-nums">{{ b.cheerers }}명 · {{ b.points }}P</span>
        <span v-if="b.lockedReason && !state.mine" class="block t-micro mt-1 text-fg-muted">{{ b.lockedReason }}</span>
      </button>
    </div>

    <p v-if="state.mine" class="t-caption mt-3">
      {{ mineText }}
      <span v-if="state.mine.amount > 0 && !state.mine.settled" class="block t-micro mt-0.5">이기면 {{ Math.round(state.mine.amount * (1 + state.mine.bonusRate)) }}P로 돌려받고, 지면 잃어요</span>
      <span v-else-if="!state.mine.settled" class="block t-micro mt-0.5">맞히면 이번 주 응원 리그에 +{{ state.mine.bonusRate.toFixed(2) }}유닛</span>
    </p>
    <template v-else-if="state.canBet && !closed">
      <!-- 기본은 예측만(포인트 없이). 포인트는 원할 때만 더 건다 -->
      <div class="flex flex-wrap gap-2 mt-3" role="radiogroup" aria-label="걸 포인트">
        <UiChip v-for="a in AMOUNTS" :key="a" :selected="amount === a" :disabled="a > room" @click="amount = a">{{ a ? `${a}P` : '예측만' }}</UiChip>
      </div>
      <p v-if="chosen" class="t-micro mt-2 tabular-nums">
        <template v-if="amount">이기면 {{ Math.round(amount * chosen.multiplier) }}P · 오늘 {{ state.stakedToday }}/{{ state.dailyStakeLimit }}P 걸었어요</template>
        <template v-else>포인트는 그대로예요. 맞히면 응원 리그에 +{{ (chosen.multiplier - 1).toFixed(2) }}유닛</template>
      </p>
      <UiButton block class="mt-3" :disabled="!chosen || amount > room" :loading="busy" @click="send">
        {{ chosen ? `${chosen.label}${isTeam(chosen.sideUserId) ? ' 팀' : '님'}이 이긴다` : '이길 쪽을 고르세요' }}
      </UiButton>
    </template>
    <p v-else-if="state.blockedReason" class="t-caption mt-3">{{ state.blockedReason }}</p>
  </section>
</template>

<script setup lang="ts">
// 경기 응원 (포인트 걸기 고도화, 11/3 세션 2. docs/points-betting-review.md): 선수가 다 모인 시작 전 남의 경기에서 이길 쪽을 고른다.
// 기본은 예측만(0P), 포인트(10~100P, 하루 300P)는 원할 때만. 배수 = 1 ÷ 이길 확률 (×1.05~×3.0), 고를 때 정해진다.
// 편마다 못 고르는 까닭이 있으면 서버가 준다 (지금은 없다: 아는 사이도 다 연다, 고병연 11/3). 경기 중 응원(포인트 없음)은 중계 화면(/live)에서
import { ref, computed, onMounted } from 'vue'
import { GET, POST } from '@/api/client'
import type { components } from '@/api/schema'
import { UiButton, UiChip } from '../ui'
import { useToast } from '../../composable/useToast'

const props = defineProps<{ gameId: number; closed?: boolean }>()
const AMOUNTS = [0, 10, 30, 50, 100]
const { showToast } = useToast()

const state = ref<components['schemas']['CheerState'] | null>(null)
const side = ref<number | null>(null)
const amount = ref(0)
const busy = ref(false)

const picked = computed(() => state.value?.mine?.sideUserId ?? side.value)
const chosen = computed(() => state.value?.board.find((b) => b.sideUserId === side.value && !b.lockedReason))
const room = computed(() => (state.value ? state.value.dailyStakeLimit - state.value.stakedToday : 0))
// 응원한 id가 편의 첫 사람이 아니어도(팀원) 그 편을 찾는다
const sideOf = (id: number) => state.value?.board.find((b) => b.memberIds.includes(id))
const isTeam = (id: number) => (sideOf(id)?.memberIds.length ?? 1) > 1
const mineText = computed(() => {
  const m = state.value?.mine
  if (!m) return ''
  const who = `${sideOf(m.sideUserId)?.label ?? ''}${isTeam(m.sideUserId) ? ' 팀' : '님'}`
  if (m.outcome === 'WIN') return `맞혔어요! ${who}이 이겼어요`
  if (m.outcome === 'LOSS') return `아쉬워요. ${who}이 졌어요`
  if (m.outcome === 'REFUND') return m.amount ? `승부가 나지 않아 ${m.amount}P를 돌려받았어요` : '승부가 나지 않았어요'
  return m.amount ? `${who}에게 ${m.amount}P 걸었어요` : `${who}이 이긴다고 골랐어요`
})

async function send() {
  if (!chosen.value) return
  busy.value = true
  try {
    state.value = (await POST('/api/points/cheer/{gameId}', { path: { gameId: props.gameId }, body: { sideUserId: chosen.value.sideUserId, amount: amount.value } })).data
    showToast(amount.value ? `${amount.value}P 걸었어요` : '골랐어요')
  } catch (e: any) {
    showToast(e.response?.data?.message || '응원하지 못했어요')
  } finally {
    busy.value = false
  }
}

onMounted(async () => {
  state.value = (await GET('/api/points/cheer/{gameId}', { path: { gameId: props.gameId } }).catch(() => ({ data: null }))).data
})
</script>
