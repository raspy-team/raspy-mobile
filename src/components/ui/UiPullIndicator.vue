<template>
  <div class="overflow-hidden flex items-end justify-center transition-[height] duration-150" :style="{ height: (refreshing ? 48 : pull) + 'px' }" aria-live="polite">
    <i
      v-if="pull > 8 || refreshing"
      class="fas mb-3 text-fg-muted"
      :class="refreshing ? 'fa-spinner fa-spin' : 'fa-arrow-down'"
      :style="refreshing ? undefined : { transform: `rotate(${pull >= 70 ? 180 : 0}deg)`, transition: 'transform .15s' }"
      aria-hidden="true"
    ></i>
    <span v-if="refreshing" class="sr-only">새로고침 중</span>
  </div>
</template>

<script setup>
// usePullToRefresh와 짝. 목록 맨 위에 둔다
import { defineProps } from 'vue'
defineProps({ pull: { type: Number, default: 0 }, refreshing: { type: Boolean, default: false } })
</script>
