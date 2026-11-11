<template>
  <!-- 바뀌지 않은 항목은 접어 둔다: 14개를 모두 보여 바뀐 한 곳을 찾으려면 끝까지 내려야 했다 (경로 7 리뷰 K16) -->
  <div v-if="hasChanged || showAll" class="bg-surface rounded-xl p-4">
    <div class="flex items-center gap-2 mb-3">
      <UiIcon :name="'fas ' + icon" class="text-fg-muted" />
      <h3 class="t-heading text-base">{{ label }}</h3>
      <span v-if="hasChanged" class="t-micro text-signal-fg font-medium ml-auto">바뀜</span>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <!-- 원본: 바뀌었으면 흐리게 지운 줄 -->
      <div>
        <p class="t-micro mb-1.5">원본</p>
        <div class="rounded-lg bg-surface-2 p-3">
          <p class="text-sm" :class="[multiline ? 'whitespace-pre-wrap' : 'truncate', hasChanged ? 'text-fg-subtle line-through' : 'text-fg-muted']">
            {{ original || '없음' }}
          </p>
        </div>
      </div>
      <!-- 수정본: 바뀌었으면 시그널 테두리 -->
      <div>
        <p class="t-micro mb-1.5">수정본</p>
        <div class="rounded-lg bg-surface-2 p-3 border" :class="hasChanged ? 'border-signal-fg/60' : 'border-transparent'">
          <p class="text-sm" :class="[multiline ? 'whitespace-pre-wrap' : 'truncate', hasChanged ? 'text-fg' : 'text-fg-muted']">
            {{ modified || '없음' }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineProps, inject, ref } from 'vue'

const props = defineProps({
  label: String,
  icon: String,
  original: [String, Number],
  modified: [String, Number],
  multiline: Boolean,
})

const showAll = inject('comparisonShowAll', ref(true))
const hasChanged = computed(() => {
  const orig = props.original || ''
  const mod = props.modified || ''
  return String(orig) !== String(mod)
})
</script>
