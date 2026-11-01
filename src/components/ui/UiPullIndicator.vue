<template>
  <div class="overflow-hidden flex items-end justify-center transition-[height] duration-150" :style="{ height: (refreshing ? 48 : pull) + 'px' }" aria-live="polite">
    <UiSpinner v-if="refreshing" class="mb-3 text-fg-muted" label="새로고침 중" />
    <UiIcon
      v-else-if="pull > 8"
      name="arrow-down"
      class="mb-3 text-fg-muted"
      :style="{ transform: `rotate(${pull >= 70 ? 180 : 0}deg)`, opacity: Math.min(1, pull / 70), transition: 'transform .15s' }"
    />
  </div>
</template>

<script setup>
// usePullToRefresh와 짝. 목록 맨 위에 둔다
import { defineProps } from 'vue'
import UiSpinner from './UiSpinner.vue'
defineProps({ pull: { type: Number, default: 0 }, refreshing: { type: Boolean, default: false } })
</script>
