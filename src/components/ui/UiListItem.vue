<template>
  <component
    :is="to ? 'router-link' : plain ? 'div' : 'button'"
    :to="to"
    :type="to || plain ? undefined : 'button'"
    class="w-full flex items-center gap-3 px-4 min-h-[56px] py-3 text-left transition-colors"
    :class="{ 'active:bg-surface-2': !plain }"
  >
    <slot name="leading">
      <UiIcon v-if="icon" :name="icon" class="text-lg" :class="danger ? 'text-danger-fg' : 'text-fg-muted'" />
    </slot>
    <span class="flex-1 min-w-0">
      <span class="block truncate" :class="danger ? 'text-danger-fg' : 'text-fg'">{{ title }}</span>
      <span v-if="subtitle" class="block truncate t-micro mt-0.5">{{ subtitle }}</span>
    </span>
    <slot name="trailing">
      <UiIcon v-if="chevron" name="chevron-right" class="text-base text-fg-subtle" />
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
  // 줄 안에 버튼이 따로 있을 때: 줄 자체는 누를 수 없게 (버튼 안에 버튼이 들어가지 않게)
  plain: { type: Boolean, default: false },
})
</script>
