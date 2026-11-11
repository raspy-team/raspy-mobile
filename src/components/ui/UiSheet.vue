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
        :style="dragY ? { transform: `translateY(${dragY}px)`, transition: dropping ? 'transform 0.2s ease-out' : 'none' } : undefined"
      >
        <!-- 손잡이·제목 줄을 아래로 끌면 닫힌다. 손잡이를 보면 사람은 끌어 내린다(아이폰·인스타 습관). 예전엔 모양만 있었다 (목적 판정 11/11 8번) -->
        <div class="pt-2.5 pb-1 flex justify-center touch-none cursor-grab" aria-hidden="true" @pointerdown="dragStart">
          <span class="w-10 h-1 rounded-full bg-line-strong"></span>
        </div>
        <div v-if="title" class="flex items-center justify-between px-5 pt-2 pb-3 touch-none" @pointerdown="dragStart">
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
import { ref, toRef, watch, defineProps, defineEmits, onBeforeUnmount } from 'vue'
import { useOverlay } from '../../composables/useOverlay'

const props = defineProps({ modelValue: { type: Boolean, default: false }, title: { type: String, default: '' } })
const emit = defineEmits(['update:modelValue'])
const close = () => emit('update:modelValue', false)
useOverlay(toRef(props, 'modelValue'), close)

// 끌어 내려 닫기: 손을 뗄 때 90px 넘게 내렸거나 빠르게 튕겼으면 닫고, 아니면 제자리로
const dragY = ref(0)
let startY = 0
let startAt = 0
function dragStart(e) {
  if (e.button !== undefined && e.button !== 0) return
  if (e.target.closest('button')) return // 닫기 X는 누르기로
  startY = e.clientY
  startAt = Date.now()
  window.addEventListener('pointermove', dragMove)
  window.addEventListener('pointerup', dragEnd, { once: true })
  window.addEventListener('pointercancel', dragEnd, { once: true })
}
function dragMove(e) {
  dragY.value = Math.max(0, e.clientY - startY)
}
function dragEnd() {
  window.removeEventListener('pointermove', dragMove)
  const fast = dragY.value > 30 && dragY.value / Math.max(1, Date.now() - startAt) > 0.6
  if (dragY.value > 90 || fast) {
    // 끌던 자리에서 그대로 아래로 내려 보낸다 (0으로 되돌렸다 닫으면 한 번 튀어 오른다)
    dropping = true
    dragY.value = window.innerHeight
    close()
  } else dragY.value = 0
}
let dropping = false
watch(() => props.modelValue, (v) => { if (v) { dropping = false; dragY.value = 0 } })
onBeforeUnmount(() => window.removeEventListener('pointermove', dragMove))
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
