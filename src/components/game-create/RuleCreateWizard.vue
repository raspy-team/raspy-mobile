<template>
  <div class="h-full w-full">
    <div v-if="step === 4" class="flex flex-col items-center justify-center min-h-full px-5">
      <h2 class="text-2xl font-bold mb-4 text-gray-900">나만의 규칙 만들기</h2>
      <p class="text-base text-gray-500 mb-8">
        아래 7단계에 걸쳐 규칙을 입력할 수 있습니다.<br />
        각 단계마다 건너뛰기도 가능합니다.
      </p>
      <div class="fixed bottom-10 w-full p-5 flex gap-2">
        <button
          @click="$emit('back')"
          class="w-full py-4 text-gray-500 bg-white border border-[#c5c5c5] text-lg font-bold rounded-xl"
        >
          이전
        </button>
        <button
          @click="$emit('next', form)"
          class="w-full py-4 bg-orange-500 text-white text-lg font-bold rounded-xl"
        >
          다음
        </button>
      </div>
    </div>
    <RuleStepForm
      class="p-5 pt-[30%]"
      v-if="step >= 5 && step <= 14"
      :step="step"
      :form="form"
      @input="onInput"
      @validation="onValidation"
    />
    <div
      v-if="step >= 5 && step <= 14"
      class="fixed bottom-10 left-0 w-full bg-white p-5 flex flex-col gap-2"
    >
      <div class="flex w-full gap-3">
        <button
          @click="goBackStep()"
          class="flex-1 py-4 text-lg font-bold rounded-xl border border-gray-200 bg-gray-100 text-gray-400"
        >
          이전
        </button>
        <button
          @click="handleNext"
          :disabled="!isValid"
          class="flex-1 py-4 text-lg font-bold rounded-xl bg-orange-500 text-white"
          :class="{ 'opacity-60': !isValid }"
        >
          {{ step === 14 ? '제출' : '다음' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import RuleStepForm from './RuleStepForm.vue'
import { ref, defineProps, defineEmits } from 'vue'
const props = defineProps(['step', 'form'])
const emit = defineEmits(['next', 'submit', 'back'])
const isValid = ref(false)

function goBackStep() {
  emit('back')
}
function onInput(val) {
  Object.assign(props.form, val)
}
function onValidation(valid) {
  isValid.value = valid
}
function handleNext() {
  if (props.step === 14) emit('submit', props.form)
  else emit('next', props.form)
}
</script>
