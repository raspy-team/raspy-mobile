<template>
  <!-- 순위의 자리 칩: [소속1] [소속2] [동네] [전국]. 서버가 고를 수 있는 자리만 준다 (docs/organizations.md 4) -->
  <div v-if="seats.length > 1 || noOrg">
    <div v-if="seats.length > 1" class="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1" role="group" aria-label="순위 범위">
      <UiChip v-for="s in seats" :key="s.key" :selected="s.key === modelValue" @click="$emit('update:modelValue', s.key)">{{ s.label }}</UiChip>
    </div>
    <!-- 안내만 하지 않고 인증하는 곳으로 바로 갈 수 있게 -->
    <p v-if="noOrg" class="t-caption mt-2">
      학교·회사를 인증하면 그 안 순위를 볼 수 있어요
      <RouterLink to="/settings/organizations" class="inline-flex items-center min-h-[44px] px-1 underline underline-offset-2 text-fg">소속 인증하기</RouterLink>
    </p>
  </div>
</template>

<script setup lang="ts">
import { UiChip } from '../ui'

defineProps<{ seats: { key: string; label: string }[]; modelValue: string; noOrg?: boolean }>()
defineEmits<{ 'update:modelValue': [key: string] }>()
</script>
