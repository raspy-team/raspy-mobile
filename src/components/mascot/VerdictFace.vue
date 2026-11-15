<template>
  <!-- 승부가 갈린 순간의 얼굴 한 벌 (quality-rules G2-1·G2-2).
       이기면 신난 얼굴이 튀어 오르고 둘레로 볼트 불꽃이 튄다. 지면 담담한 얼굴이 가만히 곁에 있다. 어느 결과 화면이든 이것 하나를 쓴다 -->
  <span class="relative block w-fit mx-auto text-fg" :class="win && live ? 'win-bounce' : ''">
    <MatchMascot :who="who" :mood="mood || (win ? 'cheer' : 'sad')" :size="size" />
    <template v-if="win && live"><span v-for="n in 10" :key="n" class="win-spark" :style="{ '--a': n * 36 + 'deg' }" aria-hidden="true"></span></template>
    <!-- 챔피언이 된 순간에는 왕관이 떨어져 얹힌다 (tier 3) -->
    <span v-if="win && tier >= 3" class="absolute -top-5 left-1/2 -ml-4 w-8 h-8 rounded-full bg-signal text-signal-on flex items-center justify-center text-lg" :class="live ? 'crown-drop' : ''" aria-hidden="true"><UiIcon name="crown" /></span>
    <!-- 이긴 순간은 화면 전체로 번진다 -->
    <WinBurst v-if="win && live" :tier="tier" />
  </span>
</template>

<script setup lang="ts">
import MatchMascot from './MatchMascot.vue'
import WinBurst from './WinBurst.vue'
import { UiIcon } from '../ui'
// win: 이긴 순간인가. live: 지금 막 본 결과인가(지난 결과를 다시 열면 false: 튀지 않는다, G2-4). mood를 안 주면 이김 = 신남, 그 밖 = 담담
// tier: 승리의 크기. 1 보통 승 · 2 연승·개인 최고 · 3 챔피언 (quality-rules G2: 큰 승리는 더 크게 치른다)
withDefaults(defineProps<{ win?: boolean; live?: boolean; mood?: string; who?: string; size?: number; tier?: number }>(), { win: false, live: true, mood: '', who: 'match', size: 72, tier: 1 })
</script>
