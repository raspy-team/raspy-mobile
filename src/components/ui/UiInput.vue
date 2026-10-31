<template>
  <UiField :label="label" :hint="hint" :error="error" :optional="optional">
    <div class="relative">
      <i v-if="icon" :class="icon" class="absolute left-4 top-1/2 -translate-y-1/2 text-fg-subtle" aria-hidden="true"></i>
      <textarea
        v-if="multiline"
        :value="modelValue"
        :rows="rows"
        :placeholder="placeholder"
        :maxlength="maxlength"
        class="ui-control resize-none py-3"
        :class="{ 'border-danger': error }"
        @input="emit('update:modelValue', $event.target.value)"
      ></textarea>
      <input
        v-else
        ref="inputRef"
        :value="modelValue"
        :type="type"
        :inputmode="inputmode"
        :placeholder="placeholder"
        :maxlength="maxlength"
        :autocomplete="autocomplete"
        class="ui-control h-12"
        :class="{ 'pl-11': icon, 'border-danger': error }"
        @input="emit('update:modelValue', type === 'number' ? Number($event.target.value) : $event.target.value)"
        @keyup.enter="emit('enter')"
      />
    </div>
  </UiField>
</template>

<script setup>
// 글자 입력칸 (한 줄 / 여러 줄). v-model로 쓴다
import { ref, defineProps, defineEmits, defineExpose } from 'vue'
import UiField from './UiField.vue'

defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  hint: { type: String, default: '' },
  error: { type: String, default: '' },
  optional: { type: Boolean, default: false },
  type: { type: String, default: 'text' },
  inputmode: { type: String, default: undefined },
  icon: { type: String, default: '' },
  maxlength: { type: [String, Number], default: undefined },
  autocomplete: { type: String, default: 'off' },
  multiline: { type: Boolean, default: false },
  rows: { type: [String, Number], default: 3 },
})
const emit = defineEmits(['update:modelValue', 'enter'])
const inputRef = ref(null)
defineExpose({ focus: () => inputRef.value?.focus() })
</script>
