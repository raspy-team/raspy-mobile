<template>
  <!-- 바탕 위(목록·상세)에서는 회색 칸, 카드·목록 상자 안에서는 칸 없이 아이콘만 (상자 안에 상자를 두지 않게) -->
  <span
    class="flex items-center justify-center flex-shrink-0 text-fg"
    :class="bare ? '' : 'rounded-xl bg-surface-3'"
    :style="{ width: size + 'px', height: size + 'px' }"
  >
    <!-- 앱 게임은 게임 아이콘 (규칙 목록에 앱 게임도 나온다) -->
    <UiIcon v-if="appIcon" :name="appIcon" :style="{ fontSize: size * (bare ? 0.6 : 0.46) + 'px' }" />
    <CategoryIcon v-else :rule="rule || { minorCategory: minor }" :size="size * (bare ? 0.7 : 0.56) + 'px'" />
  </span>
</template>

<script setup>
// 규칙 종목 그림. 앱 전체가 이것 하나를 쓴다
import { computed, defineProps } from 'vue'
import CategoryIcon from './CategoryIcon.vue'
import { useAppGameIcons } from '@/utils/appGames'
const props = defineProps({
  rule: { type: Object, default: null },
  minor: { type: String, default: '' },
  size: { type: Number, default: 44 },
  bare: { type: Boolean, default: false },
})
const appIcons = props.rule?.appGameKey ? useAppGameIcons() : null
// 롤·피파처럼 다른 게임 안에서 하는 규칙은 게임패드 (종목 그림이 없어 도형으로 나왔다, 9번)
const appIcon = computed(() => (props.rule?.appGameKey && appIcons?.value[props.rule.appGameKey]) || (props.rule?.extGame ? 'gamepad' : ''))
</script>
