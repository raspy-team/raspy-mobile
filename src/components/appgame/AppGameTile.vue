<template>
  <!-- 놀이방의 게임 한 칸: 게임마다 다른 그림을 크게, 이름, 두 줄 소개. 모서리에 해 본 게임만 내 점수 -->
  <RouterLink :to="`/play/${game.key}`" class="flex flex-col rounded-2xl bg-surface p-4 active:bg-surface-2 transition-[background-color,transform] motion-safe:active:scale-[0.98]" :class="compact ? 'w-36 flex-shrink-0' : ''">
    <span class="flex items-start justify-between">
      <span class="w-12 h-12 rounded-2xl bg-surface-2 flex items-center justify-center text-[26px] text-fg" aria-hidden="true">
        <UiIcon :name="gameIcon(game.key, game.icon)" />
      </span>
      <UiBadge v-if="!game.available">준비 중</UiBadge>
      <!-- 해 본 적 없는 게임의 1500은 뜻 없는 숫자라 비워 둔다. 처음 온 사람은 모든 칸이 '안 해 봄'이라 말하지 않는다 (11/5 밤샘 C) -->
      <span v-else-if="played" class="t-label tabular-nums text-fg">{{ game.myRating }}</span>
    </span>
    <span class="mt-3 t-heading leading-snug line-clamp-2">{{ game.title }}</span>
    <span v-if="!compact" class="mt-1 t-caption line-clamp-2">{{ game.summary }}</span>
    <!-- 모두 같은 말이면 정보가 아니다: 다를 때만 (편할 때 하기, AI 채점, 투표) -->
    <span v-if="!compact && meta" class="mt-2 t-micro">{{ meta }}</span>
  </RouterLink>
</template>

<script setup lang="ts">
// 앱 게임 한 칸 (모든 앱 게임 화면). 줄 목록 대신 칸으로: 게임마다 얼굴이 보이게 (11/3 디자인 리뷰 '놀이방')
import { computed } from 'vue'
import type { components } from '@/api/schema'
import { judgeLabel, structureLabel } from '@/utils/appGame'
import { gameIcon } from '@/utils/appGameIcon'
import { UiBadge, UiIcon } from '../ui'

const props = defineProps<{ game: components['schemas']['AppGameSummary']; compact?: boolean }>()
const played = computed(() => (props.game.myWins || 0) + (props.game.myLosses || 0) + (props.game.myDraws || 0) > 0)
// 가장 흔한 조합(지금 바로 붙기 · 앱이 판정)은 말하지 않는다
const meta = computed(() =>
  [props.game.playMode !== 'REALTIME' && structureLabel(props.game.playMode), props.game.judge !== 'APP' && judgeLabel(props.game.judge)].filter(Boolean).join(' · '),
)
</script>
