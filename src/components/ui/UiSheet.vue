<template>
  <Teleport to="body">
    <Transition name="ui-fade">
      <div v-if="modelValue" class="fixed inset-0 z-sheet bg-black/70" @click="close" aria-hidden="true"></div>
    </Transition>
    <Transition name="ui-sheet">
      <div
        v-if="modelValue"
        role="dialog"
        aria-modal="true"
        :aria-label="title || undefined"
        class="fixed inset-x-0 bottom-0 z-sheet max-w-xl mx-auto bg-surface rounded-t-2xl flex flex-col max-h-[88dvh] pb-safe"
      >
        <div class="pt-2.5 pb-1 flex justify-center" aria-hidden="true">
          <span class="w-10 h-1 rounded-full bg-line-strong"></span>
        </div>
        <div v-if="title" class="flex items-center justify-between px-5 pt-2 pb-3">
          <h2 class="t-heading">{{ title }}</h2>
          <button type="button" class="w-9 h-9 -mr-2 flex items-center justify-center text-fg-muted" aria-label="닫기" @click="close">
            <UiIcon name="xmark" class="text-xl" />
          </button>
        </div>
        <div class="flex-1 overflow-y-auto overscroll-contain px-5 pb-5"><slot /></div>
        <div v-if="$slots.footer" class="px-5 py-4 border-t border-line"><slot name="footer" /></div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
// 아래에서 올라오는 시트. 목록·상세·고르기처럼 내용이 있는 것은 시트로 연다
// v-model로 열고 닫는다. 뒤로가기·바깥 누르기·Esc로 닫힌다
import { toRef, defineProps, defineEmits } from 'vue'
import { useOverlay } from '../../composables/useOverlay'

const props = defineProps({ modelValue: { type: Boolean, default: false }, title: { type: String, default: '' } })
const emit = defineEmits(['update:modelValue'])
const close = () => emit('update:modelValue', false)
useOverlay(toRef(props, 'modelValue'), close)
</script>

<style>
.ui-fade-enter-active,
.ui-fade-leave-active { transition: opacity 0.2s ease; }
.ui-fade-enter-from,
.ui-fade-leave-to { opacity: 0; }
.ui-sheet-enter-active,
.ui-sheet-leave-active { transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1); }
.ui-sheet-enter-from,
.ui-sheet-leave-to { transform: translateY(100%); }
</style>
