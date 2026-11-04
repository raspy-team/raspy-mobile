<template>
  <!-- 게임 화면의 챔피언 카드: 내가 속한 자리(소속·동네·전국)의 챔피언만 한 줄씩, 최대 3 (docs/organizations.md 4) -->
  <div v-if="seats.length" class="divide-y divide-line">
    <div v-for="s in seats" :key="s.seat" class="flex items-center gap-3 py-4">
      <span
        class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        :class="s.champion ? 'bg-signal-soft text-signal-fg' : 'bg-surface-2 text-fg-subtle'"
        aria-hidden="true"
      >
        <UiIcon name="fas fa-crown" />
      </span>
      <button
        type="button"
        class="flex-1 min-w-0 text-left"
        :disabled="!s.champion"
        @click="s.champion && router.push(`/profile/${s.champion.id}`)"
      >
        <span class="block t-heading truncate">
          {{ s.champion ? (s.mine ? `내가 ${s.seatName} 챔피언이에요` : `${s.seatName} 챔피언 ${s.champion.nickname}`) : `${s.seatName} 자리가 비어 있어요` }}
        </span>
        <span class="block t-caption mt-0.5 truncate">
          {{ s.mine ? '지면 자리를 내줘요. 30일 쉬어도 넘어가요' : s.champion ? '챔피언을 이기면 자리를 가져와요' : emptyHint(s.seat) }}
        </span>
      </button>
      <UiButton v-if="s.champion && !s.mine" variant="tonal" :aria-label="`${s.champion.nickname}님에게 도전`" @click="challenge(s.champion)">도전</UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
// 챔피언 카드 (규칙 상세·앱 게임 화면). '도전'은 앱 게임이면 그 사람에게만 가는 도전장(?to=), 만나서 하는 경기면 경기 열기
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { GET } from '@/api/client'
import { UiButton } from '../ui'

const props = defineProps<{ ruleId: number | null | undefined; appGameKey?: string | null }>()
const router = useRouter()

type Seat = {
  seat: string
  seatName: string
  title: string
  champion?: { id?: number; nickname: string } | null
  mine: boolean
}
const seats = ref<Seat[]>([])

function emptyHint(seat: string) {
  return seat === 'NATIONAL' ? '누구든 이기면 첫 챔피언이 돼요' : '같은 자리 사람을 이기면 첫 챔피언이 돼요'
}

function challenge(c: { id?: number; nickname: string }) {
  if (props.appGameKey) router.push({ path: `/play/${props.appGameKey}`, query: { to: c.id, toName: c.nickname } })
  else router.push(`/create-game?ruleId=${props.ruleId}`)
}

async function load() {
  if (!props.ruleId) return
  try {
    seats.value = ((await GET('/api/champions/rules/{ruleId}/seats', { path: { ruleId: props.ruleId } })).data ?? []) as Seat[]
  } catch {
    seats.value = []
  }
}

watch(() => props.ruleId, load, { immediate: true })
</script>
