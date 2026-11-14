<template>
  <section>
    <div v-if="title || $slots.action" class="flex items-center justify-between mb-4">
      <h2 class="t-heading">{{ title }}</h2>
      <slot name="action" />
    </div>
    <slot />
  </section>
</template>

<script setup>
// 화면 안의 한 묶음: 제목 + (오른쪽 '전체 보기' 같은 행동) + 내용
import { defineProps } from 'vue'
defineProps({ title: { type: String, default: '' } })
</script>
