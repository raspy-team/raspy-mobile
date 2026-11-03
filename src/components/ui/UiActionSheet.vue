<template>
  <Teleport to="body">
    <Transition name="ui-fade">
      <div v-if="modelValue" class="fixed inset-0 z-dialog bg-black/60" aria-hidden="true" @click="close"></div>
    </Transition>
    <Transition name="ui-sheet">
      <div v-if="modelValue" role="alertdialog" aria-modal="true" :aria-label="title" class="fixed inset-x-0 bottom-0 z-dialog max-w-xl mx-auto px-3 pb-3 pb-safe space-y-2">
        <!-- 묻는 말과 할 일 한 묶음 -->
        <div class="rounded-2xl bg-surface-2 overflow-hidden">
          <div class="px-5 pt-4 pb-3 text-center">
            <p class="t-label">{{ title }}</p>
            <p v-if="message" class="t-caption mt-1 whitespace-pre-line">{{ message }}</p>
          </div>
          <button
            type="button"
            class="w-full h-14 border-t border-line text-[17px] font-semibold active:bg-surface-3 transition-colors disabled:opacity-50"
            :class="danger ? 'text-danger-fg' : 'text-fg'"
            :disabled="loading"
            @click="emit('confirm')"
          >
            {{ confirmText }}
          </button>
        </div>
        <!-- 취소는 따로 떨어뜨려, 엄지가 가장 쉽게 닿는 아래에 -->
        <button v-if="cancelText" type="button" class="w-full h-14 rounded-2xl bg-surface-2 text-[17px] text-fg active:bg-surface-3 transition-colors" @click="close">
          {{ cancelText }}
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
// 아래에서 올라오는 확인 (iOS 액션 시트). 사용자가 직접 시작한 일(삭제·나가기·로그아웃·그만두기)을 한 번 더 확인할 때.
// 가운데 창(UiDialog)은 예상 못 한 문제를 알릴 때만 쓴다 (애플 HIG, 11/3)
import { toRef, defineProps, defineEmits } from 'vue'
import { useOverlay } from '../../composables/useOverlay'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, required: true },
  message: { type: String, default: '' },
  confirmText: { type: String, default: '확인' },
  cancelText: { type: String, default: '취소' },
  danger: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])
const close = () => {
  emit('cancel')
  emit('update:modelValue', false)
}
useOverlay(toRef(props, 'modelValue'), close)
</script>
