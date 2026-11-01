<template>
  <!-- 매치 얼굴: 셔틀콕 깃털(머리), 축구공 오각형(눈), 농구공 솔기(볼), 웃는 입(볼트). 여러 종목이 모여 한 사람 -->
  <svg :width="size" :height="size" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M28.6 16.6L22.5 4.5" /><path d="M32 16.5V3.5" /><path d="M35.4 16.6l6.1-12.1" /><path d="M25.4 10.5h13.2" />
    <circle cx="32" cy="39" r="22" />
    <path d="M14.5 27c4.6 5 4.6 19 0 24" /><path d="M49.5 27c-4.6 5-4.6 19 0 24" />
    <path d="M24.5 31.5l3 2.2-1.2 3.5h-3.6l-1.2-3.5z" fill="currentColor" stroke-width="1.4" />
    <path d="M39.5 31.5l3 2.2-1.2 3.5h-3.6l-1.2-3.5z" fill="currentColor" stroke-width="1.4" />
    <path v-if="mood === 'smile'" d="M24 45h16a8 7.5 0 0 1-16 0z" fill="#d2ff4d" />
    <path v-else-if="mood === 'neutral'" d="M26 48.5h12" />
    <ellipse v-else cx="32" cy="48.5" rx="3.6" ry="4.2" fill="#d2ff4d" />
  </svg>
</template>

<script setup>
// 로고의 얼굴. 표정(mood): smile(기본) · neutral(비었을 때) · wow(놀람, 404)
import { defineProps } from 'vue'
defineProps({ size: { type: [Number, String], default: 24 }, mood: { type: String, default: 'smile' } })
</script>
