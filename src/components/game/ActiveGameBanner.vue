<template>
  <Transition name="ui-fade">
    <div
      v-if="game"
      class="fixed inset-x-0 z-nav px-4"
      :class="withNav ? 'bottom-[calc(64px+env(safe-area-inset-bottom)+8px)]' : 'bottom-[calc(env(safe-area-inset-bottom)+12px)]'"
    >
      <div class="max-w-xl mx-auto flex items-center gap-3 bg-surface-2 border border-line-strong rounded-xl pl-4 pr-1 py-1">
        <span class="w-2 h-2 rounded-full bg-signal animate-pulse flex-shrink-0" aria-hidden="true"></span>
        <div class="flex-1 min-w-0">
          <p class="text-sm text-fg font-medium truncate">경기가 진행 중이에요</p>
          <p class="t-micro truncate">{{ game.ruleTitle }} · {{ game.player1?.nickname }} vs {{ game.player2?.nickname }}</p>
        </div>
        <UiButton size="sm" @click="emit('open')">돌아가기</UiButton>
        <UiIconButton icon="fas fa-xmark" label="닫기" @click="emit('dismiss')" />
      </div>
    </div>
  </Transition>
</template>

<script setup>
// 내 경기가 진행 중일 때 화면 아래에 뜨는 띠. 누를지는 사용자가 정한다
// (예전에는 5초 뒤 자동으로 경기 화면으로 끌고 갔다)
import { defineProps, defineEmits } from 'vue'
import { UiButton, UiIconButton } from '../ui'

defineProps({
  game: { type: Object, default: null },
  withNav: { type: Boolean, default: true }, // 하단 탭이 보이는 화면이면 그 위에
})
const emit = defineEmits(['open', 'dismiss'])
</script>
