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
        @input="emit('update:modelValue', type === 'number' ? toNumber($event.target.value) : $event.target.value)"
        @keyup.enter="emit('enter')"
      />
      <!-- 아이폰의 날짜·시간 칸은 비어 있으면 아무 글도 없는 빈 상자다: 무엇을 하는 칸인지 적어 둔다 (11/14 전수 평가) -->
      <span v-if="!multiline && DATE_TYPES.includes(type) && !modelValue" class="absolute inset-y-0 left-4 right-4 flex items-center gap-2 text-fg-subtle pointer-events-none" aria-hidden="true">
        <UiIcon name="calendar" /><span class="truncate">{{ placeholder || (type === 'date' ? '날짜 고르기' : type === 'time' ? '시간 고르기' : '날짜·시간 고르기') }}</span>
      </span>
    </div>
  </UiField>
</template>

<script setup>
// 글자 입력칸 (한 줄 / 여러 줄). v-model로 쓴다
import { ref, defineProps, defineEmits, defineExpose } from 'vue'
import UiField from './UiField.vue'
const DATE_TYPES = ['datetime-local', 'date', 'time']

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
// 숫자 칸을 비우면 빈 값('')으로 둔다. 예전엔 Number('') = 0이 칸에 다시 들어앉아, 선택 칸('만 나이')이 저장을 막고
// 대회 '최대 인원'을 고쳐 쓰려 지우면 0이 남았다 (경로 8 P1, 가로 훑기 8절)
const toNumber = (v) => (v === '' || v == null ? '' : Number(v))
const inputRef = ref(null)
defineExpose({ focus: () => inputRef.value?.focus(), el: inputRef })
</script>
