<template>
  <component
    :is="to ? 'router-link' : 'button'"
    :to="to"
    :type="to ? undefined : 'button'"
    :aria-label="label"
    class="relative w-11 h-11 inline-flex items-center justify-center rounded-full text-fg active:bg-surface-2 transition-colors"
  >
    <i :class="icon" class="text-lg" aria-hidden="true"></i>
    <span
      v-if="badge"
      class="absolute top-1.5 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-on text-[11px] font-bold flex items-center justify-center"
    >
      {{ badge > 9 ? '9+' : badge }}
    </span>
  </component>
</template>

<script setup>
// 아이콘만 있는 버튼. label은 화면 읽기 프로그램용이라 꼭 넣는다
import { defineProps } from 'vue'
defineProps({
  icon: { type: String, required: true },
  label: { type: String, required: true },
  badge: { type: Number, default: 0 },
  to: { type: [String, Object], default: null },
})
</script>
