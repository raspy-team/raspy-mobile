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
      <!-- AI 보스 (docs/ai-residents.md 3): 앱 게임 전국 빈자리를 든 AI. 이기면 첫 사람 챔피언 -->
      <template v-if="s.boss && s.champion">
        <button type="button" class="flex-1 min-w-0 text-left" @click="router.push(`/profile/${s.champion.id}`)">
          <span class="flex items-center t-heading min-w-0">
            <span class="truncate">{{ s.champion.nickname }}</span><UiAiBadge />
          </span>
          <span class="block t-caption mt-0.5 break-keep">{{ s.seatName }} AI 보스 · {{ bossHint(s) }}</span>
        </button>
        <UiButton size="sm" variant="tonal" :disabled="s.bossTriesLeft === 0" @click="challengeBoss">도전하기</UiButton>
      </template>
      <template v-else>
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
        <UiButton v-if="s.champion && !s.mine" size="sm" variant="tonal" @click="challenge(s.champion)">도전</UiButton>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
// 챔피언 카드 (규칙 상세·앱 게임 화면). '도전'은 앱 게임이면 그 사람에게만 가는 도전장(?to=), 만나서 하는 경기면 경기 열기
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { GET } from '@/api/client'
import { track } from '@/utils/trackLog'
import { UiAiBadge, UiButton } from '../ui'

const props = defineProps<{ ruleId: number | null | undefined; appGameKey?: string | null }>()
const router = useRouter()

type Seat = {
  seat: string
  seatName: string
  title: string
  champion?: { id?: number; nickname: string } | null
  mine: boolean
  boss?: boolean
  bossTriesLeft?: number | null
}
const seats = ref<Seat[]>([])

function emptyHint(seat: string) {
  return seat === 'NATIONAL' ? '누구든 이기면 첫 챔피언이 돼요' : '같은 자리 사람을 이기면 첫 챔피언이 돼요'
}

function bossHint(s: Seat) {
  if (s.bossTriesLeft === 0) return '오늘 도전을 다 썼어요. 내일 다시 도전해 주세요'
  return s.bossTriesLeft != null ? `이기면 첫 사람 챔피언이 돼요 · 오늘 ${s.bossTriesLeft}번 남았어요` : '이기면 첫 사람 챔피언이 돼요 · 하루 3번'
}

// 보스 도전: 실시간 화면이 ?boss=1을 보고 보스와 바로 붙는다
function challengeBoss() {
  // 보스 도전은 원본 기록에 ai=true로 (docs/ai-residents.md '숫자는 따로')
  if (props.appGameKey) track('boss_challenge', { gameKey: props.appGameKey, value: 'ai=true' })
  if (props.appGameKey) router.push({ path: `/play/${props.appGameKey}/live`, query: { boss: 1 } })
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
