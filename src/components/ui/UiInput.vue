<template>
  <UiField :label="label" :hint="hint" :error="error" :optional="optional">
    <div class="relative">
      <UiIcon v-if="icon" :name="icon" class="absolute left-4 top-1/2 -translate-y-1/2 text-fg-subtle" aria-hidden="true" />
      <textarea
        v-if="multiline"
        ref="inputRef"
        :value="modelValue"
        :disabled="disabled"
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
        :disabled="disabled"
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
  // 막힌 칸 (예: 내 차례가 아닐 때). 예전엔 받지 않아 바깥 label에만 붙고 칸은 써졌다
  disabled: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'enter'])
const inputRef = ref(null)
defineExpose({ focus: () => inputRef.value?.focus(), el: inputRef })
</script>
