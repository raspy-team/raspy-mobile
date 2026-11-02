<template>
  <section class="rounded-xl bg-surface p-4" aria-label="응원">
    <div class="flex items-center justify-between">
      <h2 class="t-heading">응원</h2>
      <span class="t-micro">이기면 +50% 돌려받아요</span>
    </div>
    <!-- 쪽마다 응원 수. 막대는 포인트 비율 -->
    <div class="mt-3 grid gap-2" :style="{ gridTemplateColumns: `repeat(${players.length}, minmax(0, 1fr))` }">
      <button
        v-for="p in players"
        :key="p.id"
        type="button"
        class="rounded-xl border px-3 py-2.5 text-left transition-colors"
        :class="side === p.id ? 'border-fg bg-surface-2' : 'border-line'"
        :disabled="!!state?.mine || closed"
        :aria-pressed="side === p.id"
        @click="side = p.id"
      >
        <span class="block t-body truncate">{{ p.nickname }}</span>
        <span class="block t-micro tabular-nums mt-0.5">{{ count(p.id).cheerers }}명 · {{ count(p.id).points }}P</span>
      </button>
    </div>

    <p v-if="state?.mine" class="t-caption mt-3">
      {{ nameOf(state.mine.sideUserId) }}님에게 {{ state.mine.amount }}P 응원했어요{{ state.mine.settled ? ' · 정산됨' : '' }}
    </p>
    <template v-else-if="!closed">
      <div class="flex gap-2 mt-3" role="radiogroup" aria-label="걸 포인트">
        <UiChip v-for="a in AMOUNTS" :key="a" :selected="amount === a" @click="amount = a">{{ a }}P</UiChip>
      </div>
      <UiButton block class="mt-3" :disabled="!side" :loading="busy" @click="send">{{ side ? `${nameOf(side)}님 응원하기` : '응원할 쪽을 고르세요' }}</UiButton>
    </template>
  </section>
</template>

<script setup lang="ts">
// 경기 응원 (기능 검토 #5·#8): 남의 경기 한쪽에 포인트를 건다. 경기마다 한 번, 10~100P.
// 응원한 쪽이 이기면 시스템이 +50%를 더해 돌려준다 (사람끼리 주고받지 않는다). 비기거나 취소되면 돌려준다
import { ref, onMounted } from 'vue'
import { GET, POST } from '@/api/client'
import type { components } from '@/api/schema'
import { UiButton, UiChip } from '../ui'
import { useToast } from '../../composable/useToast'

const props = defineProps<{ gameId: number; players: { id: number; nickname: string }[]; closed?: boolean }>()
const AMOUNTS = [10, 30, 50, 100]
const { showToast } = useToast()

const state = ref<components['schemas']['CheerState'] | null>(null)
const side = ref<number | null>(null)
const amount = ref(30)
const busy = ref(false)

const count = (id: number) => state.value?.sides.find((s) => s.userId === id) ?? { cheerers: 0, points: 0 }
const nameOf = (id: number) => props.players.find((p) => p.id === id)?.nickname ?? ''

async function send() {
  if (!side.value) return
  busy.value = true
  try {
    state.value = (await POST('/api/points/cheer/{gameId}', { path: { gameId: props.gameId }, body: { sideUserId: side.value, amount: amount.value } })).data
    showToast(`${amount.value}P 응원했어요`)
  } catch (e: any) {
    showToast(e.response?.data?.message || '응원하지 못했어요')
  } finally {
    busy.value = false
  }
}

onMounted(async () => {
  state.value = (await GET('/api/points/cheer/{gameId}', { path: { gameId: props.gameId } }).catch(() => ({ data: null }))).data
  if (state.value?.mine) side.value = state.value.mine.sideUserId
})
</script>
