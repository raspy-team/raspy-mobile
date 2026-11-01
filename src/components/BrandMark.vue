<template>
  <span class="inline-flex items-center gap-2 text-fg" :style="{ fontSize: size }" aria-label="match">
    <BrandFace size="1.35em" class="-my-[0.2em]" />
    <span v-if="!markOnly" class="font-semibold leading-none tracking-[-0.055em]" aria-hidden="true">match</span>
  </span>
</template>

<script setup>
// 매치 로고: 얼굴 + 'match' 글자. 크기는 size(글자 크기)로
import { defineProps } from 'vue'
import BrandFace from './BrandFace.vue'
defineProps({ size: { type: String, default: '24px' }, markOnly: { type: Boolean, default: false } })
</script>
