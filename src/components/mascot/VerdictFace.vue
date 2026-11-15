<template>
  <!-- 승부가 갈린 순간의 얼굴 한 벌 (quality-rules G2-1·G2-2).
       이기면 신난 얼굴이 튀어 오르고 둘레로 볼트 불꽃이 튄다. 지면 담담한 얼굴이 가만히 곁에 있다. 어느 결과 화면이든 이것 하나를 쓴다 -->
  <span class="relative block w-fit mx-auto text-fg" :class="win && live ? 'win-bounce' : ''">
    <MatchMascot :who="who" :mood="mood || (win ? 'cheer' : 'sad')" :size="size" />
    <template v-if="win && live"><span v-for="n in 10" :key="n" class="win-spark" :style="{ '--a': n * 36 + 'deg' }" aria-hidden="true"></span></template>
  </span>
</template>

<script setup lang="ts">
import MatchMascot from './MatchMascot.vue'
// win: 이긴 순간인가. live: 지금 막 본 결과인가(지난 결과를 다시 열면 false: 튀지 않는다, G2-4). mood를 안 주면 이김 = 신남, 그 밖 = 담담
withDefaults(defineProps<{ win?: boolean; live?: boolean; mood?: string; who?: string; size?: number }>(), { win: false, live: true, mood: '', who: 'match', size: 72 })
</script>
