<template>
  <UiActionSheet
    :model-value="confirmState.open"
    :title="confirmState.options.title || ''"
    :message="confirmState.options.message"
    :confirm-text="confirmState.options.confirmText || '확인'"
    :cancel-text="confirmState.options.cancelText ?? '취소'"
    :danger="!!confirmState.options.danger"
    @confirm="answerConfirm(true)"
    @update:model-value="(v) => !v && answerConfirm(false)"
  />
</template>

<script setup>
// confirmDialog()가 띄우는 확인. 사용자가 시작한 일의 확인이라 아래에서 올라오는 액션 시트로 (HIG). App.vue에 하나만 둔다
import UiActionSheet from './UiActionSheet.vue'
import { confirmState, answerConfirm } from '../../composables/useConfirm'
</script>
