<template>
  <Teleport to="body">
    <Transition name="ui-fade">
      <div v-if="modelValue" class="fixed inset-0 z-dialog bg-black/60 flex items-center justify-center p-6" @click.self="dismissible && close()">
        <div role="alertdialog" aria-modal="true" :aria-label="title" class="w-full max-w-sm bg-surface border border-line rounded-2xl p-6">
          <h2 class="t-heading">{{ title }}</h2>
          <p v-if="message" class="t-caption mt-2 whitespace-pre-line">{{ message }}</p>
          <slot />
          <div class="mt-6 flex gap-2">
            <UiButton v-if="cancelText" variant="secondary" block @click="close">{{ cancelText }}</UiButton>
            <UiButton :variant="danger ? 'danger' : 'primary'" block :loading="loading" @click="emit('confirm')">{{ confirmText }}</UiButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
// 가운데 뜨는 확인 창. 짧은 질문 하나와 버튼 두 개만. 내용이 길면 UiSheet를 쓴다
import { toRef, defineProps, defineEmits } from 'vue'
import UiButton from './UiButton.vue'
import { useOverlay } from '../../composables/useOverlay'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, required: true },
  message: { type: String, default: '' },
  confirmText: { type: String, default: '확인' },
  cancelText: { type: String, default: '취소' },
  danger: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  dismissible: { type: Boolean, default: true },
})
const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])
const close = () => {
  emit('cancel')
  emit('update:modelValue', false)
}
useOverlay(toRef(props, 'modelValue'), close)
</script>
