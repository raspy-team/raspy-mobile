<template>
  <section v-if="state" class="rounded-xl bg-surface p-4" aria-label="응원">
    <div class="flex items-center justify-between">
      <h2 class="t-heading">응원</h2>
      <span class="t-micro">시작 전에만 · 걸 때 배수가 정해져요</span>
    </div>
    <!-- 편마다 배수(이기면 몇 배로 돌려받나)와 응원 수. 편은 1:1이면 사람, 팀이면 팀 -->
    <div class="mt-3 grid gap-2" :style="{ gridTemplateColumns: `repeat(${Math.min(state.board.length, 3)}, minmax(0, 1fr))` }">
      <button
        v-for="b in state.board"
        :key="b.sideUserId"
        type="button"
        class="rounded-xl border px-3 py-2.5 text-left transition-colors"
        :class="picked === b.sideUserId ? 'border-fg bg-surface-2' : 'border-line'"
        :disabled="!state.canBet || closed"
        :aria-pressed="picked === b.sideUserId"
        @click="side = b.sideUserId"
      >
        <span class="block t-body truncate">{{ b.label }}</span>
        <span class="block t-heading tabular-nums mt-0.5">{{ state.board.length > 1 ? `×${b.multiplier.toFixed(2)}` : "–" }}</span>
        <span class="block t-micro tabular-nums">{{ b.cheerers }}명 · {{ b.points }}P</span>
      </button>
    </div>

    <p v-if="state.mine" class="t-caption mt-3">
      {{ name(state.mine.sideUserId) }}{{ isTeam(state.mine.sideUserId) ? ' 팀에' : '님에게' }} {{ state.mine.amount }}P 응원했어요{{ state.mine.settled ? ' · 정산됨' : '' }}
      <span class="block t-micro mt-0.5">이기면 {{ Math.round(state.mine.amount * (1 + state.mine.bonusRate)) }}P로 돌려받고, 지면 잃어요</span>
    </p>
    <template v-else-if="state.canBet && !closed">
      <div class="flex gap-2 mt-3" role="radiogroup" aria-label="걸 포인트">
        <UiChip v-for="a in AMOUNTS" :key="a" :selected="amount === a" :disabled="a > room" @click="amount = a">{{ a }}P</UiChip>
      </div>
      <p v-if="chosen" class="t-micro mt-2 tabular-nums">이기면 {{ Math.round(amount * chosen.multiplier) }}P · 오늘 {{ state.stakedToday }}/{{ state.dailyStakeLimit }}P 걸었어요</p>
      <UiButton block class="mt-3" :disabled="!chosen || amount > room" :loading="busy" @click="send">
        {{ chosen ? `${chosen.label}${isTeam(chosen.sideUserId) ? ' 팀' : '님'} 응원하기` : '응원할 쪽을 고르세요' }}
      </UiButton>
    </template>
    <p v-else-if="state.blockedReason" class="t-caption mt-3">{{ state.blockedReason }}</p>
  </section>
</template>

<script setup lang="ts">
// 경기 응원 (포인트 걸기 고도화, 11/3 세션 2. docs/points-betting-review.md): 선수가 다 모인 시작 전 남의 경기 한쪽에 포인트를 건다.
// 배수 = 1 ÷ 이길 확률 (×1.05~×3.0). 걸기 전에 편마다 보여 주고, 걸 때 정해진다. 경기마다 한 번 10~100P, 하루 300P.
// 선수와 아는 사이는 걸지 못한다 (서버가 까닭을 준다). 경기 중 응원(포인트 없음)은 중계 화면(/live)에서
import { ref, computed, onMounted } from 'vue'
import { GET, POST } from '@/api/client'
import type { components } from '@/api/schema'
import { UiButton, UiChip } from '../ui'
import { useToast } from '../../composable/useToast'

const props = defineProps<{ gameId: number; closed?: boolean }>()
const AMOUNTS = [10, 30, 50, 100]
const { showToast } = useToast()

const state = ref<components['schemas']['CheerState'] | null>(null)
const side = ref<number | null>(null)
const amount = ref(30)
const busy = ref(false)

const picked = computed(() => state.value?.mine?.sideUserId ?? side.value)
const chosen = computed(() => state.value?.board.find((b) => b.sideUserId === side.value))
const room = computed(() => (state.value ? state.value.dailyStakeLimit - state.value.stakedToday : 0))
// 응원한 id가 편의 첫 사람이 아니어도(팀원) 그 편을 찾는다
const sideOf = (id: number) => state.value?.board.find((b) => b.memberIds.includes(id))
const name = (id: number) => sideOf(id)?.label ?? ''
const isTeam = (id: number) => (sideOf(id)?.memberIds.length ?? 1) > 1

async function send() {
  if (!chosen.value) return
  busy.value = true
  try {
    state.value = (await POST('/api/points/cheer/{gameId}', { path: { gameId: props.gameId }, body: { sideUserId: chosen.value.sideUserId, amount: amount.value } })).data
    showToast(`${amount.value}P 응원했어요`)
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
