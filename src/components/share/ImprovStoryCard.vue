<template>
  <!-- 임기응변 등급 결과 한 장 (인스타 스토리 1080×1920, utils/storyShare.ts componentFile이 찍는다).
       위 70px·아래 120px은 인스타가 덮으니 비운다. 등급이 주인공, 내 대답 하나와 인물 반응이 읽을거리, 맨 아래는 받은 사람이 풀 곳 -->
  <div class="theme-dark font-sans flex flex-col bg-canvas text-fg" :style="{ width: '360px', height: '640px', padding: '76px 24px 128px' }">
    <div class="flex items-center gap-2">
      <span class="block w-[26px] h-[26px] rounded-[7px] overflow-hidden" aria-hidden="true" v-html="logo(26)"></span>
      <span class="text-[15px] font-semibold tracking-[-0.02em]">매치 · 임기응변 등급</span>
    </div>

    <!-- 보내는 사람의 한 줄: 등급마다 다르게 (진 사람도 보내게, viral-structures-adoption.md 3절 ①) -->
    <p class="mt-8 text-[26px] leading-[1.2] font-semibold tracking-[-0.04em] break-keep">{{ line }}</p>

    <div class="mt-5 flex items-end gap-3">
      <p class="text-[72px] leading-none font-semibold tracking-[-0.05em] text-signal-fg tabular-nums">{{ grade }}<span class="text-[28px] ml-1 text-fg">등급</span></p>
      <p class="pb-2 text-[15px] text-fg-muted">상위 {{ topPercent }}% · {{ score }}점</p>
    </div>

    <div v-if="best" class="mt-6 rounded-2xl bg-surface px-4 py-4">
      <p class="text-[12px] text-fg-muted break-keep">{{ best.who }}</p>
      <p class="mt-1 text-[14px] break-keep">“{{ best.line }}”</p>
      <p class="mt-3 text-[16px] font-semibold break-keep">나: {{ best.answer }}</p>
      <p v-if="best.reaction" class="mt-2 text-[13px] text-fg-muted break-keep">→ {{ best.reaction }}</p>
    </div>

    <div class="mt-auto pt-6">
      <p class="text-[17px] font-semibold break-keep">너도 풀어 봐!</p>
      <p class="mt-2 inline-flex items-center rounded-full px-4 h-10 text-[17px] font-semibold tracking-[-0.01em] bg-signal text-signal-on">matchapp.me/try/improv</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import logoSvg from '../../../public/favicon.svg?raw'
import { improvShareLine } from '../../utils/improv'

const props = defineProps<{
  grade: number
  topPercent: number
  score: number
  /** 가장 잘한 대답 하나 (없으면 비운다) */
  best?: { who: string; line: string; answer: string; reaction?: string } | null
}>()
const logo = (px: number) => logoSvg.replace('<svg ', `<svg width="${px}" height="${px}" `)
const line = computed(() => improvShareLine(props.grade))
</script>
