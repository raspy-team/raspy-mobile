<template>
  <span
    class="relative inline-flex flex-shrink-0 items-center justify-center rounded-full overflow-hidden bg-surface-2 text-fg-muted font-medium"
    :style="{ width: px + 'px', height: px + 'px', fontSize: Math.round(px * 0.4) + 'px' }"
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
// 프로필 사진. 사진이 없거나 깨지면 닉네임 첫 글자를 보여준다
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
watch(() => props.src, () => (failed.value = false))
</script>
