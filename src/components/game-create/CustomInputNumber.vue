<template>
  <div class="relative flex items-center">
    <input
      :type="'number'"
      :min="min"
      :max="max"
      :placeholder="placeholder"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.valueAsNumber)"
      class="block w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-400 py-2 pl-4 pr-10 text-base text-gray-900 bg-white placeholder:text-gray-300 transition-all outline-none"
    />
    <span v-if="unit" class="absolute right-3 text-xs text-gray-400">{{ unit }}</span>
  </div>
</template>
<script setup>
import { defineProps, defineEmits } from 'vue'
defineProps({
  modelValue: Number,
  min: { type: Number, default: undefined },
  max: { type: Number, default: undefined },
  placeholder: { type: String, default: '' },
  unit: { type: String, default: '' },
})
defineEmits(['update:modelValue'])
</script>
