<template>
  <span
    class="relative inline-flex flex-shrink-0 items-center justify-center rounded-full overflow-hidden text-fg/90 font-semibold tracking-[-0.02em]"
    :style="{ width: px + 'px', height: px + 'px', fontSize: Math.round(px * 0.38) + 'px', background: (src && !failed) ? '#19191c' : tint }"
  >
    <img
      v-if="src && !failed"
      :src="src"
      :alt="name ? `${name}의 프로필 사진` : ''"
      data-fallback="1"
      loading="lazy"
      class="w-full h-full object-cover"
      @error="failed = true"
    />
    <span v-else aria-hidden="true">{{ initial }}</span>
  </span>
</template>

<script setup>
// 프로필 사진. 사진이 없거나 깨지면 닉네임 첫 글자를 보여준다.
// 빈 회색 원은 '덜 만든 앱'처럼 보여서, 이름마다 정해지는 차분한 색 그라데이션을 깐다 (같은 이름이면 늘 같은 색)
import { ref, computed, watch, defineProps } from 'vue'

const props = defineProps({
  src: { type: String, default: '' },
  name: { type: String, default: '' },
  size: { type: String, default: 'md' }, // xs 24, sm 32, md 40, lg 56, xl 96
})
const SIZE = { xs: 24, sm: 32, md: 40, lg: 56, xl: 96 }
const px = computed(() => SIZE[props.size] || 40)
const initial = computed(() => (props.name || '?').trim().charAt(0).toUpperCase())
const failed = ref(false)

function hash(s) {
  let h = 0
  for (const c of s) h = (h * 31 + c.codePointAt(0)) >>> 0
  return h
}
// 채도를 낮게 묶어 흑백 화면과 다투지 않게 한다
const tint = computed(() => {
  const h = hash(props.name || '?') % 360
  return `linear-gradient(140deg, hsl(${h} 16% 34%), hsl(${(h + 48) % 360} 14% 17%))`
})
watch(() => props.src, () => (failed.value = false))
</script>
