<template>
  <div class="flex p-1 bg-surface rounded-xl" role="tablist">
    <button
      v-for="o in options"
      :key="o.value"
      type="button"
      role="tab"
      :aria-selected="modelValue === o.value"
      class="flex-1 h-9 rounded-lg text-sm transition-colors"
      :class="modelValue === o.value ? 'bg-surface-3 text-fg font-semibold' : 'text-fg-muted'"
      @click="emit('update:modelValue', o.value)"
    >
      {{ o.label }}<span v-if="o.count" class="ml-1 text-fg-subtle">{{ o.count }}</span>
    </button>
  </div>
</template>

<script setup>
// 같은 화면 안에서 보기를 바꾸는 탭. options: [{ value, label, count? }]
import { defineProps, defineEmits } from 'vue'
defineProps({ modelValue: { type: [String, Number], default: '' }, options: { type: Array, required: true } })
const emit = defineEmits(['update:modelValue'])
</script>
