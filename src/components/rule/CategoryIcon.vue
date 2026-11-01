<template>
  <svg
    v-if="icon.svg"
    viewBox="0 0 24 24"
    :width="size"
    :height="size"
    fill="none"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="flex-shrink-0"
    aria-hidden="true"
    v-html="icon.svg"
  ></svg>
  <component :is="icon.component" v-else :size="size" :stroke-width="1.75" class="flex-shrink-0" aria-hidden="true" />
</template>

<script setup>
// 종목 아이콘. 앱의 다른 아이콘과 같은 선 굵기로 그린다 (sportIcons.js). 색은 글자색을 따른다
import { computed, defineProps } from 'vue'
import { categoryKey } from '../../utils/rule'
import { sportIcon } from './sportIcons'
const props = defineProps({
  rule: { type: Object, default: null },
  name: { type: String, default: '' }, // 큰 분류 이름처럼 이름을 바로 줄 때
  size: { type: String, default: '1.5rem' },
})
const icon = computed(() => sportIcon(props.name || categoryKey(props.rule)))
</script>
