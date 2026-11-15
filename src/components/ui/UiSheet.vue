<template>
  <Teleport to="body">
    <Transition name="ui-fade">
      <div v-if="modelValue" class="fixed inset-0 z-sheet bg-black/70" @click="close" @touchmove.prevent aria-hidden="true"></div>
    </Transition>
    <Transition name="ui-sheet">
      <div
        v-if="modelValue"
        role="dialog"
        aria-modal="true"
        :aria-label="title || undefined"
        class="fixed inset-x-0 bottom-0 z-sheet max-w-xl mx-auto bg-surface rounded-t-2xl flex flex-col max-h-[88dvh]"
        :class="kb.height ? '' : 'pb-safe'"
        :style="[kbStyle, dragY ? { transform: `translateY(${dragY}px)`, transition: dropping ? 'transform 0.2s ease-out' : 'none' } : null]"
        @touchmove="holdPage"
      >
        <!-- 손잡이·제목 줄을 아래로 끌면 닫힌다. 손잡이를 보면 사람은 끌어 내린다(아이폰·인스타 습관). 예전엔 모양만 있었다 (목적 판정 11/11 8번) -->
        <!-- 제목 없는 창(더보기 같은 고르는 목록)에는 닫기 X를 두지 않는다: 손잡이 옆 구석에 떠 있어 자리가 어색했고, 고르거나 바깥을 누르거나 끌어 내리면 닫힌다 (11/15 고병연) -->
        <div class="relative pt-2.5 pb-1 flex justify-center touch-none cursor-grab" :class="!title ? 'min-h-8' : ''" @pointerdown="dragStart">
          <span class="w-10 h-1 rounded-full bg-line-strong" aria-hidden="true"></span>
        </div>
        <div v-if="title" class="flex items-center justify-between px-5 pt-2 pb-3 touch-none" @pointerdown="dragStart">
          <h2 class="t-heading">{{ title }}</h2>
          <button type="button" class="hit w-9 h-9 -mr-2 flex items-center justify-center text-fg-muted" aria-label="닫기" @click="close">
            <UiIcon name="xmark" class="text-xl" />
          </button>
        </div>
        <div ref="scroller" class="flex-1 overflow-y-auto overscroll-contain px-5 pb-5"><slot /></div>
        <div v-if="$slots.footer" class="px-5 py-4 border-t border-line"><slot name="footer" /></div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
// 아래에서 올라오는 시트. 목록·상세·고르기처럼 내용이 있는 것은 시트로 연다
// v-model로 열고 닫는다. 뒤로가기·바깥 누르기·Esc로 닫힌다
import { ref, reactive, computed, toRef, watch, defineProps, defineEmits, onBeforeUnmount } from 'vue'
import { useOverlay } from '../../composables/useOverlay'

const props = defineProps({ modelValue: { type: Boolean, default: false }, title: { type: String, default: '' } })
const emit = defineEmits(['update:modelValue'])
const close = () => emit('update:modelValue', false)
useOverlay(toRef(props, 'modelValue'), close)

// 키보드가 오르면 창을 키보드 위·상태 표시줄 아래로 가둔다. 아이폰은 화면 틀이 키보드에 줄지 않아, 아래에 붙은 창의 입력칸을 보이려고
// 화면을 통째로 밀어 올렸고 긴 창(사람 찾기 결과)은 찾기 칸이 시계 밑으로 들어갔다 (11/14 전수 평가)
const kb = reactive({ height: 0, room: 0, bottom: 0 })
const vv = typeof window !== 'undefined' ? window.visualViewport : null
function trackKeyboard() {
  if (!vv) return
  // 키보드가 올라와 있나: 보이는 화면이 기기 화면의 3/4보다 낮다. (화면 틀 높이와의 차로 재면 안 된다: 아이폰은 틀도 일부만 줄고 보이는 화면을 밀어 올린다)
  const up = vv.height < window.screen.height * 0.75
  kb.height = up ? 1 : 0
  kb.room = Math.round(vv.height)
  // 창의 아래 끝을 보이는 화면의 아래 끝에 맞춘다
  kb.bottom = Math.max(0, Math.round(window.innerHeight - vv.offsetTop - vv.height))
}
const kbStyle = computed(() => (kb.height
  // 키보드 위 유리 막대 밑으로 뒤 화면이 비치지 않게 창 색을 아래로 이어 칠한다
  ? { bottom: `${kb.bottom}px`, maxHeight: `calc(${kb.room}px - env(safe-area-inset-top) - 8px)`, boxShadow: '0 160px 0 0 rgb(var(--c-surface))' }
  : null))
watch(() => props.modelValue, (open) => {
  if (!vv) return
  if (open) { vv.addEventListener('resize', trackKeyboard); vv.addEventListener('scroll', trackKeyboard); trackKeyboard() }
  else { vv.removeEventListener('resize', trackKeyboard); vv.removeEventListener('scroll', trackKeyboard); kb.height = 0 }
}, { immediate: true })
onBeforeUnmount(() => { vv?.removeEventListener('resize', trackKeyboard); vv?.removeEventListener('scroll', trackKeyboard) })

// 창을 밀어도 뒤 화면은 움직이지 않는다 (11/15 고병연: 더보기 창을 밀면 뒤의 내 경기 목록이 움직였다).
// 내용이 짧아 창 안에서 움직일 것이 없으면 그 손짓이 뒤 화면으로 넘어갔다. 창 안의 긴 내용과 옆으로 미는 줄(칩)만 움직이게 둔다
const scroller = ref(null)
function holdPage(e) {
  const box = scroller.value
  const inside = box && box.contains(e.target)
  if (inside && (box.scrollHeight > box.clientHeight + 1 || e.target.closest?.('.overflow-x-auto, input[type="range"], textarea'))) return
  if (e.cancelable) e.preventDefault()
}

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
