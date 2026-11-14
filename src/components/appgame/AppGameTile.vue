<template>
  <!-- 놀이방의 게임 한 칸: 게임마다 다른 그림을 크게, 이름, 두 줄 소개. 모서리에 해 본 게임만 내 점수 -->
  <!-- again: 바로 한 판 (최근에 한 게임: 첫 화면을 거쳐 '한 판 하기'를 또 눌렀다, 11/11 귀찮음 재검토) -->
  <!-- wide: 한 줄에 하나, 소개를 자르지 않는다 (11/14 전수 평가: 두 칸짜리에서 여섯 게임의 소개가 모두 '…'로 잘렸다) -->
  <RouterLink v-if="wide" :to="`/play/${game.key}`" class="flex items-start gap-4 rounded-2xl bg-surface p-4 active:bg-surface-2 transition-[background-color,transform] motion-safe:active:scale-[0.98]">
    <span class="w-12 h-12 flex-shrink-0 rounded-2xl bg-surface-2 flex items-center justify-center text-[26px] text-fg" aria-hidden="true">
      <UiIcon :name="gameIcon(game.key, game.icon)" />
    </span>
    <span class="flex-1 min-w-0">
      <span class="flex items-center justify-between gap-2">
        <span class="t-heading leading-snug">{{ game.title }}</span>
        <UiBadge v-if="!game.available">준비 중</UiBadge>
        <span v-else-if="played" class="t-micro tabular-nums flex-shrink-0">실력 {{ game.myRating }}</span>
      </span>
      <span class="block mt-1 t-caption break-keep">{{ game.summary }}</span>
      <span v-if="showMeta && meta" class="block mt-2 t-micro">{{ meta }}</span>
    </span>
  </RouterLink>
  <RouterLink v-else :to="again ? `/play/${game.key}?again=1` : `/play/${game.key}`" class="flex flex-col rounded-2xl bg-surface p-4 active:bg-surface-2 transition-[background-color,transform] motion-safe:active:scale-[0.98]" :class="compact ? 'w-36 flex-shrink-0' : ''">
    <span class="flex items-start justify-between">
      <span class="w-12 h-12 rounded-2xl bg-surface-2 flex items-center justify-center text-[26px] text-fg" aria-hidden="true">
        <UiIcon :name="gameIcon(game.key, game.icon)" />
      </span>
      <UiBadge v-if="!game.available">준비 중</UiBadge>
      <!-- 해 본 적 없는 게임의 1500은 뜻 없는 숫자라 비워 둔다. 숫자만 있으면 무엇인지 몰랐다: '실력'을 붙인다 (11/14) -->
      <span v-else-if="played" class="t-micro tabular-nums text-right">실력<br /><b class="text-fg">{{ game.myRating }}</b></span>
    </span>
    <span class="mt-3 t-heading leading-snug line-clamp-2">{{ game.title }}</span>
    <span v-if="!compact" class="mt-1 t-caption line-clamp-2">{{ game.summary }}</span>
    <!-- 모두 같은 말이면 정보가 아니다: 다를 때만 (편할 때 하기, AI 채점, 투표) -->
    <span v-if="!compact && showMeta && meta" class="mt-2 t-micro">{{ meta }}</span>
  </RouterLink>
</template>

<script setup lang="ts">
// 앱 게임 한 칸 (모든 앱 게임 화면). 줄 목록 대신 칸으로: 게임마다 얼굴이 보이게 (11/3 디자인 리뷰 '놀이방')
import { computed } from 'vue'
import type { components } from '@/api/schema'
import { judgeLabel, structureLabel } from '@/utils/appGame'
import { gameIcon } from '@/utils/appGameIcon'
import { UiBadge, UiIcon } from '../ui'

const props = withDefaults(defineProps<{ game: components['schemas']['AppGameSummary']; compact?: boolean; again?: boolean; wide?: boolean; showMeta?: boolean }>(), { showMeta: true })
const played = computed(() => (props.game.myWins || 0) + (props.game.myLosses || 0) + (props.game.myDraws || 0) > 0)
// 가장 흔한 조합(지금 바로 붙기 · 앱이 판정)은 말하지 않는다
const meta = computed(() =>
  [props.game.playMode !== 'REALTIME' && structureLabel(props.game.playMode), props.game.judge !== 'APP' && judgeLabel(props.game.judge)].filter(Boolean).join(' · '),
)
</script>
