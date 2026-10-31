<template>
  <component
    :is="to ? 'router-link' : 'button'"
    :to="to"
    :type="to ? undefined : 'button'"
    class="w-full flex items-center gap-3 px-4 min-h-[56px] py-3 text-left active:bg-surface-2 transition-colors"
  >
    <slot name="leading">
      <i v-if="icon" class="w-5 text-center" :class="[icon, danger ? 'text-danger-fg' : 'text-fg-muted']" aria-hidden="true"></i>
    </slot>
    <span class="flex-1 min-w-0">
      <span class="block truncate" :class="danger ? 'text-danger-fg' : 'text-fg'">{{ title }}</span>
      <span v-if="subtitle" class="block truncate t-micro mt-0.5">{{ subtitle }}</span>
    </span>
    <slot name="trailing">
      <i v-if="chevron" class="fas fa-chevron-right text-xs text-fg-subtle" aria-hidden="true"></i>
    </slot>
  </component>
</template>

<script setup>
// 목록 한 줄 (설정, 알림, 사람 목록). 여러 줄을 UiList로 감싸면 구분선이 생긴다
import { defineProps } from 'vue'
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  icon: { type: String, default: '' },
  to: { type: [String, Object], default: null },
  chevron: { type: Boolean, default: false },
  danger: { type: Boolean, default: false },
})
</script>
