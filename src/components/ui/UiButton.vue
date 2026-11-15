<template>
  <component
    :is="to ? 'router-link' : 'button'"
    v-bind="rest"
    :to="to"
    :type="to ? undefined : type"
    :disabled="to ? undefined : disabled || busy"
    :aria-busy="busy || undefined"
    class="relative inline-flex items-center justify-center gap-2 rounded-xl select-none transition-[background-color,color,transform] motion-safe:active:scale-[0.97] disabled:pointer-events-none"
    :class="[VARIANTS[variant], FILLED.has(variant) && size === 'sm' ? FILLED_SM : SIZES[size], block ? 'w-full' : '', disabled && !busy ? 'opacity-40' : '', to && (disabled || busy) ? 'pointer-events-none' : '']"
    :aria-disabled="to && (disabled || busy) ? 'true' : undefined"
    :tabindex="to && (disabled || busy) ? -1 : undefined"
    @click="onClick"
  >
    <!-- 기다리는 동안 글자 자리는 그대로 두고 그 위에 스피너 (버튼 폭이 흔들리지 않게) -->
    <span v-if="spinning" class="absolute inset-0 flex items-center justify-center"><UiSpinner size="sm" /></span>
    <span class="inline-flex items-center justify-center gap-2" :class="{ invisible: spinning }">
      <UiIcon v-if="icon" :name="icon" aria-hidden="true" />
      <slot />
    </span>
  </component>
</template>

<script setup>
import UiSpinner from './UiSpinner.vue'
// 앱의 모든 버튼. 화면에서 버튼 색·크기를 직접 정하지 말고 variant/size로 고른다
// - primary: 화면의 주 행동 (한 화면에 하나)
// - secondary: 나란히 놓이는 보조 행동
// - ghost: 글자만 있는 가벼운 행동 (취소, 더 보기)
// - tonal: 목록 안에서 반복되는 행동 (카드마다 있는 '신청'). 테두리만 있는 버튼이라 주 행동과 다투지 않는다
// - danger: 되돌릴 수 없는 행동 (삭제, 탈퇴)
import { defineProps, defineOptions, useAttrs, computed, ref } from 'vue'
import { sendSheet } from '../../stores/sendSheet'
import { feel } from '../../utils/feel'

defineOptions({ inheritAttrs: false })
const props = defineProps({
  variant: { type: String, default: 'primary' },
  size: { type: String, default: 'md' },
  block: { type: Boolean, default: false },
  icon: { type: String, default: '' }, // 예: 'fas fa-plus'
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  type: { type: String, default: 'button' },
  to: { type: [String, Object], default: null },
})

// 누른 일이 오래 걸리면(0.25초 넘는 약속) 버튼이 스스로 돈다 (quality-rules F-2).
// 화면마다 :loading을 달아야만 돌았는데, 서버를 부르는 버튼 쉰두 개에 빠져 있었다('다시 시도', '받기', '그만두기' …). 도는 동안은 다시 눌리지 않는다
const attrs = useAttrs()
const rest = computed(() => { const { onClick, ...r } = attrs; return r })
const auto = ref(false)
function onClick(e) {
  // 누르는 순간 손에 답한다 (quality-rules G1-1). 일이 이루어진 때의 success·win은 화면이 따로 낸다
  feel('tap')
  const h = attrs.onClick
  if (!h) return
  const pending = (Array.isArray(h) ? h : [h]).map((fn) => fn(e)).filter((r) => r && typeof r.then === 'function')
  if (!pending.length) return
  const timer = setTimeout(() => { auto.value = true }, 250)
  Promise.allSettled(pending).finally(() => { clearTimeout(timer); auto.value = false })
}
const busy = computed(() => props.loading || auto.value)
// 보내기 창이 떠 있는 동안은 돌지 않는다: 창이 닫힐 때까지 뒤의 버튼이 계속 돌았다 (quality-rules F-5)
const spinning = computed(() => busy.value && !sendSheet.open)

const VARIANTS = {
  primary: 'bg-primary text-primary-on font-semibold active:bg-primary-press',
  secondary: 'bg-surface-3 text-fg font-medium active:bg-line-strong',
  ghost: 'bg-transparent text-fg-muted font-medium active:bg-surface-2',
  tonal: 'bg-transparent text-fg font-semibold border border-line-strong active:bg-surface-2',
  danger: 'bg-danger-soft text-danger-fg font-medium active:bg-danger/25',
  // 볼트: '내 차례'에만 (결과 확인·신청 승인처럼 상대가 나를 기다릴 때). 한 화면에 하나 넘게 두지 않는다
  signal: 'bg-signal text-signal-on font-semibold active:opacity-90',
}
// 채운 버튼(주·볼트)은 작아도 높이 44다 (quality-rules S-5: 주 버튼은 단단해 보여야 한다). 글자만 한 단계 작다
const FILLED = new Set(['primary', 'signal'])
const FILLED_SM = 'h-11 px-4 text-sm'
// 높이는 손가락으로 누르기 쉬운 크기 이상 (sm도 36px)
const SIZES = {
  sm: 'h-9 px-3.5 text-sm hit',
  md: 'h-11 px-4 text-body',
  lg: 'h-[52px] px-5 text-body',
}
</script>
