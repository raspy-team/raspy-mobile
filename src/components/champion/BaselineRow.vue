<template>
  <!-- 순위 사이의 AI 기준선 한 줄 (사람 줄과 구분되게 가늘고 흐리게). 번호를 매기지 않는다 -->
  <div class="flex items-center gap-3 px-4 py-2 bg-surface-2" role="note" :aria-label="`AI 기준선 ${line.label} ${line.rating}점`">
    <span class="w-7 flex justify-center text-fg-subtle" aria-hidden="true"><UiIcon name="bullseye" class="text-xs" /></span>
    <span class="flex-1 min-w-0 flex items-center t-caption">
      <span class="truncate">이 줄 위면 {{ line.label }}보다 세요</span>
    </span>
    <span class="t-caption tabular-nums">{{ line.rating }}</span>
  </div>
</template>

<script setup lang="ts">
import { UiIcon } from '../ui'
import type { Baseline } from './rankingBaselines'

defineProps<{ line: Baseline }>()
</script>
