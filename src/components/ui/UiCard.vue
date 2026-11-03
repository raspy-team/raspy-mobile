<template>
  <component
    :is="to ? 'router-link' : interactive ? 'button' : 'div'"
    :to="to"
    :type="interactive && !to ? 'button' : undefined"
    class="block w-full text-left bg-surface rounded-xl"
    :class="[pad ? 'p-4' : '', interactive || to ? 'active:bg-surface-2 transition-[background-color,transform] motion-safe:active:scale-[0.98]' : '']"
  >
    <slot />
  </component>
</template>

<script setup>
// 카드: 한 덩어리의 정보. 눌러서 들어가는 카드면 to 또는 interactive
import { defineProps } from 'vue'
defineProps({
  to: { type: [String, Object], default: null },
  interactive: { type: Boolean, default: false },
  pad: { type: Boolean, default: true },
})
</script>
