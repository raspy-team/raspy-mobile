<template>
  <!-- userId를 주면 누르면 그 사람 프로필로 (사용자 11/3: 모든 프로필 사진은 누를 수 있게).
       버튼 안에도 들어가므로 button 대신 span + role=link, 눌림은 부모로 번지지 않게 -->
  <span
    class="relative inline-flex flex-shrink-0 items-center justify-center rounded-full overflow-hidden text-fg/90 font-semibold tracking-[-0.02em]"
    :class="userId ? 'cursor-pointer active:opacity-70' : ''"
    :role="userId ? 'link' : undefined"
    :tabindex="userId ? 0 : undefined"
    :aria-label="userId && name ? `${name} 프로필` : undefined"
    @click="go"
    @keydown.enter="go"
    :style="{ width: px + 'px', height: px + 'px', fontSize: Math.round(px * 0.38) + 'px', background: (src && !failed) ? 'rgb(var(--c-surface-2))' : tint }"
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
// 빈 회색 원은 '덜 만든 앱'처럼 보여서, 이름마다 정해지는 무채색 그라데이션을 깐다 (같은 이름이면 늘 같은 모양).
// 색을 넣으면 흑백 화면에서 탁해 보여서 밝기·방향만 바꾼다. 라이트·다크 모두 바탕색에서 섞어 만든다
import { ref, computed, watch, defineProps } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  src: { type: String, default: '' },
  name: { type: String, default: '' },
  size: { type: String, default: 'md' }, // xs 24, sm 32, md 40, lg 56, xl 96
  /** 주면 누를 수 있다 (그 사람 프로필로) */
  userId: { type: [Number, String], default: null },
})
const SIZE = { xs: 24, sm: 32, md: 40, lg: 56, xl: 96 }
const router = useRouter()
function go(e) {
  if (!props.userId) return
  e.stopPropagation()
  e.preventDefault()
  router.push(`/profile/${props.userId}`)
}
const px = computed(() => SIZE[props.size] || 40)
const initial = computed(() => (props.name || '?').trim().charAt(0).toUpperCase())
const failed = ref(false)

function hash(s) {
  let h = 0
  for (const c of s) h = (h * 31 + c.codePointAt(0)) >>> 0
  return h
}
const tint = computed(() => {
  const n = hash(props.name || '?')
  const angle = n % 360
  const a = 14 + (n % 5) * 4 // 글자색을 14~30% 섞은 밝은 쪽
  const b = 4 + ((n >>> 3) % 4) * 2 // 4~10% 섞은 어두운 쪽 (>>>: 큰 해시에서 음수가 되지 않게)
  const mix = (p) => `color-mix(in srgb, rgb(var(--c-fg)) ${p}%, rgb(var(--c-canvas)))`
  return `linear-gradient(${angle}deg, ${mix(a)}, ${mix(b)})`
})
watch(() => props.src, () => (failed.value = false))
</script>
