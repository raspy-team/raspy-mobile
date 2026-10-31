// 어디서든 확인 창을 띄우고 답을 기다린다
//   if (await confirmDialog({ title: '경기를 삭제할까요?', confirmText: '삭제', danger: true })) { ... }
// App.vue의 <UiConfirmHost />가 실제 창을 그린다
import { reactive } from 'vue'

export const confirmState = reactive({ open: false, options: {}, resolve: null })

export function confirmDialog(options) {
  return new Promise((resolve) => {
    confirmState.options = options
    confirmState.resolve = resolve
    confirmState.open = true
  })
}

export function answerConfirm(answer) {
  confirmState.open = false
  confirmState.resolve?.(answer)
  confirmState.resolve = null
}
