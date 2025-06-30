<template>
  <div class="relative w-full">
    <button class="w-full bg-white border px-4 py-2 rounded-full text-left flex items-center justify-between"
      @click="open = !open" :disabled="disabled">
      <span>{{ selectedLabel || placeholder }}</span>
      <i class="fas fa-chevron-down text-xs ml-2"></i>
    </button>
    <ul v-if="open" class="absolute z-10 w-full bg-white border mt-1 rounded shadow">
      <li v-for="opt in options" :key="opt.value"
          @click="select(opt.value)"
          class="px-4 py-2 hover:bg-orange-50 cursor-pointer">
        {{ opt.label }}
      </li>
    </ul>
  </div>
</template>
<script setup>
import { ref, computed, watch, defineProps, defineEmits } from 'vue'
const props = defineProps({ options: Array, modelValue: [String, Number], placeholder: String, disabled: Boolean })
const emit = defineEmits(['update:modelValue'])
const open = ref(false)
const selectedLabel = computed(() => props.options?.find(opt => opt.value === props.modelValue)?.label || "")
function select(val) {
  emit('update:modelValue', val)
  open.value = false
}
watch(() => props.modelValue, () => open.value = false)
</script>
