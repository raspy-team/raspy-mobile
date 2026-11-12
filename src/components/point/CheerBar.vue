<template>
  <section v-if="state" class="rounded-xl bg-surface p-4" aria-label="응원">
    <div class="flex items-center justify-between gap-2">
      <!-- 응원 칸은 응원단장 통통 (docs/mascots.md). 맞히면 신나고, 못 맞혀도 담담하게 -->
      <h2 class="t-heading flex items-center gap-2"><MatchMascot who="tong" :mood="state.mine?.outcome === 'WIN' ? 'cheer' : state.mine?.outcome === 'LOSS' ? 'sad' : 'smile'" :size="32" aria-hidden="true" />누가 이길까요?</h2>
      <span class="t-micro">시작 전에만</span>
    </div>
    <!-- 처음 보는 사람에게 확률·점수가 무슨 뜻인지 한 줄로 (경로 4 훑기) -->
    <!-- 세 번 본 뒤에는 뺀다 (경기마다 같은 설명이었다, 11/11 쌓이는 피로 전수표) -->
    <p v-if="explainCheer" class="t-caption mt-1 break-keep">이길 쪽을 고르면 끝나고 맞혔는지 알려요. 이길 확률이 낮은 쪽을 맞힐수록 응원 리그 점수가 더 올라요</p>
    <!-- 편마다 이길 확률·응원 수. 편은 1:1이면 사람, 팀이면 팀. 포인트는 걸지 않는다 (11/13 앱스토어 2.3.6) -->
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
          <span class="block t-heading tabular-nums mt-0.5">{{ b.rated ? `${Math.round(b.chance * 100)}%` : '반반' }}</span>
          <span class="block t-micro tabular-nums">{{ b.rated ? '이길 확률' : '기록 없음' }}</span>
        </template>
        <span class="block t-micro tabular-nums">{{ b.cheerers }}명 응원</span>
        <span v-if="b.lockedReason && !state.mine" class="block t-micro mt-1 text-fg-muted">{{ b.lockedReason }}</span>
      </button>
    </div>

    <p v-if="state.mine" class="t-caption mt-3">
      {{ mineText }}
      <span v-if="!state.mine.settled" class="block t-micro mt-0.5">맞히면 이번 주 응원 리그 +{{ state.mine.bonusRate.toFixed(2) }}점</span>
    </p>
    <template v-else-if="state.canBet && !closed">
      <p v-if="chosen" class="t-micro mt-3 tabular-nums">맞히면 응원 리그 +{{ (chosen.multiplier - 1).toFixed(2) }}점</p>
      <UiButton block class="mt-3" :disabled="!chosen" :loading="busy" @click="send">
        {{ chosen ? `${chosen.label}${isTeam(chosen.sideUserId) ? ' 팀' : '님'}이 이긴다` : '이길 쪽을 고르세요' }}
      </UiButton>
    </template>
    <p v-else-if="state.blockedReason" class="t-caption mt-3">{{ state.blockedReason }}</p>
  </section>
</template>

<script setup lang="ts">
// 경기 응원 (11/3 세션 2, docs/points-betting-review.md): 선수가 다 모인 시작 전 남의 경기에서 이길 쪽을 맞힌다.
// 포인트는 걸지 않는다 (11/13: 애플은 가상 화폐로 배당을 거는 것을 '가상 도박'으로 보고 개인 개발자에게 막는다, 심사 2.3.6).
// 맞히면 응원 리그 점수(유닛)가 1 ÷ 이길 확률 − 1만큼 오른다. 고를 때 정해진다.
// 편마다 못 고르는 까닭이 있으면 서버가 준다 (지금은 없다: 아는 사이도 다 연다, 고병연 11/3). 경기 중 응원(포인트 없음)은 중계 화면(/live)에서
import { ref, computed, onMounted } from 'vue'
const explainCheer = (() => {
  try {
    const n = Number(localStorage.getItem('explain_cheer') || 0)
    localStorage.setItem('explain_cheer', String(n + 1))
    return n < 3
  } catch { return true }
})()
import { GET, POST } from '@/api/client'
import type { components } from '@/api/schema'
import { UiButton } from '../ui'
import MatchMascot from '../mascot/MatchMascot.vue'
import { useToast } from '../../composables/useToast'

const props = defineProps<{ gameId: number; closed?: boolean }>()
const { showToast } = useToast()

const state = ref<components['schemas']['CheerState'] | null>(null)
const side = ref<number | null>(null)
const busy = ref(false)

const picked = computed(() => state.value?.mine?.sideUserId ?? side.value)
const chosen = computed(() => state.value?.board.find((b) => b.sideUserId === side.value && !b.lockedReason))
// 응원한 id가 편의 첫 사람이 아니어도(팀원) 그 편을 찾는다
const sideOf = (id: number) => state.value?.board.find((b) => b.memberIds.includes(id))
const isTeam = (id: number) => (sideOf(id)?.memberIds.length ?? 1) > 1
const mineText = computed(() => {
  const m = state.value?.mine
  if (!m) return ''
  const who = `${sideOf(m.sideUserId)?.label ?? ''}${isTeam(m.sideUserId) ? ' 팀' : '님'}`
  if (m.outcome === 'WIN') return `맞혔어요! ${who}이 이겼어요`
  if (m.outcome === 'LOSS') return `아쉬워요. ${who}이 졌어요`
  if (m.outcome === 'REFUND') return '승부가 나지 않았어요'
  return `${who}이 이긴다고 골랐어요`
})

async function send() {
  if (!chosen.value) return
  busy.value = true
  try {
    state.value = (await POST('/api/points/cheer/{gameId}', { path: { gameId: props.gameId }, body: { sideUserId: chosen.value.sideUserId, amount: 0 } })).data  // amount 0: 예전 서버(amount 필수)와도 맞게. 서버는 0만 받는다
    showToast('골랐어요')
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
