<template>
  <!-- 이긴 순간이 화면 전체로 번진다: 번쩍 → 아래에서 치솟는 형광 불길 → 날아오르는 불티. 한 번 치르고 스스로 사라진다.
       tier 1 보통 승 · 2 연승·개인 최고 · 3 챔피언(불티가 많고 울트라 색이 섞인다). 움직임 줄이기면 그리지 않는다 (tailwind.css) -->
  <Teleport to="body">
    <div v-if="on" class="win-burst" aria-hidden="true">
      <span class="win-burst-flash"></span>
      <span class="win-burst-sweep"></span>
      <span v-for="(e, i) in embers" :key="i" class="win-ember" :class="e.ultra ? 'is-ultra' : ''" :style="e.style"></span>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = withDefaults(defineProps<{ tier?: number }>(), { tier: 1 })
const on = ref(true)
// 불티: 아래 가장자리에서 흩어져 올라간다. 자리·크기·빠르기는 번호로 정해 매번 같은 그림이 되게(무작위가 아니다: 다시 그려도 튀지 않는다)
const count = props.tier >= 3 ? 34 : props.tier === 2 ? 24 : 16
const embers = Array.from({ length: count }, (_, i) => {
  const r = (n: number) => { const v = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453; return v - Math.floor(v) }
  return {
    ultra: props.tier >= 3 && i % 4 === 0,
    style: {
      left: `${4 + r(1) * 92}%`,
      '--s': `${5 + Math.round(r(2) * 7)}px`,
      '--t': `${1.1 + r(3) * 0.8}s`,
      '--d': `${r(4) * 0.45}s`,
      '--dx': `${Math.round((r(5) - 0.5) * 120)}px`,
      '--dy': `-${45 + Math.round(r(6) * 55)}vh`,
    },
  }
})
let timer: ReturnType<typeof setTimeout> | undefined
onMounted(() => { timer = setTimeout(() => (on.value = false), 2600) })
onBeforeUnmount(() => clearTimeout(timer))
</script>
