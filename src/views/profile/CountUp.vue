<script setup>
import { ref, watch, defineProps } from 'vue'
const props = defineProps({ endVal: Number, duration: Number, options: Object })
const displayVal = ref(1)

// 지수형 감속 (더 강하게 느려짐)
function easeOutExpo(x) {
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x)
}

watch(
  () => props.endVal,
  (val) => {
    if (val === 0) {
      displayVal.value = 0 // 애니메이션 없이 "-" 출력에 사용됨
      return
    }

    let start = Math.max(val + 50, 50)
    const diff = start - val
    let startTime = null

    function animate(ts) {
      if (!startTime) startTime = ts
      let linear = Math.min((ts - startTime) / (props.duration * 1000), 1)
      let progress = easeOutExpo(linear)
      displayVal.value = Math.floor(start - diff * progress)
      if (linear < 1) requestAnimationFrame(animate)
      else displayVal.value = val
    }
    requestAnimationFrame(animate)
  },
  { immediate: true },
)
</script>
<template>
  {{ displayVal==0 ? "-" : displayVal }}<span v-if="props.options?.suffix">{{ props.options.suffix }}</span>
</template>
