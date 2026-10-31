<template>
  <UiField :label="label" :hint="hint" :error="error" :optional="optional">
    <div class="relative">
      <select
        :value="modelValue"
        :disabled="disabled"
        class="ui-control h-12 appearance-none pr-10 disabled:opacity-40"
        @change="emit('update:modelValue', $event.target.value)"
      >
        <option value="" disabled>{{ placeholder }}</option>
        <option v-for="o in normalized" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
      <i class="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-xs text-fg-subtle pointer-events-none" aria-hidden="true"></i>
    </div>
  </UiField>
</template>

<script setup>
// 고르기 칸. options는 ['서울', ...] 또는 [{ value, label }]
import { computed, defineProps, defineEmits } from 'vue'
import UiField from './UiField.vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  options: { type: Array, default: () => [] },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '선택' },
  hint: { type: String, default: '' },
  error: { type: String, default: '' },
  optional: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])
const normalized = computed(() => props.options.map((o) => (typeof o === 'object' ? o : { value: o, label: o })))
</script>
