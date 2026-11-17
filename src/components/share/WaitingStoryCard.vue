<template>
  <!-- 상대를 기다리는 판 한 장 (인스타 스토리 1080×1920, utils/storyShare.ts componentFile이 찍는다. 11/17 고병연).
       임기응변 말고는 기다리는 순간에 스토리로 올릴 그림이 없었다. 위 70px·아래 120px은 인스타가 덮으니 비운다 -->
  <div class="theme-dark font-sans flex flex-col bg-canvas text-fg" :style="{ width: '360px', height: '640px', padding: '76px 24px 128px' }">
    <div class="flex items-center gap-2">
      <span class="block w-[26px] h-[26px] rounded-[7px] overflow-hidden" aria-hidden="true" v-html="logo(26)"></span>
      <span class="text-[15px] font-semibold tracking-[-0.02em]">매치 · {{ title }}</span>
    </div>

    <p class="mt-8 text-[26px] leading-[1.2] font-semibold tracking-[-0.04em] break-keep">상대를 기다리고 있어요</p>

    <!-- 점수가 뜻이 있는 게임만 크게. 히어로·투표처럼 상대가 와야 판정이 나는 게임은 한 줄만 -->
    <div v-if="score" class="mt-5">
      <p class="text-[72px] leading-none font-semibold tracking-[-0.05em] text-signal-fg tabular-nums">{{ score }}<span class="text-[28px] ml-1 text-fg">{{ unit }}</span></p>
      <p v-if="label" class="mt-3 text-[15px] text-fg-muted">{{ label }}</p>
    </div>
    <p v-else-if="label" class="mt-5 text-[20px] font-semibold text-signal-fg break-keep">{{ label }}</p>

    <div class="mt-6 rounded-2xl bg-surface px-4 py-4">
      <p class="text-[14px] break-keep">{{ how }}</p>
    </div>

    <div class="mt-auto pt-6">
      <p class="text-[17px] font-semibold break-keep">나랑 붙을 사람?</p>
      <p class="mt-2 inline-flex items-center rounded-full px-4 h-10 text-[17px] font-semibold tracking-[-0.01em] bg-signal text-signal-on">{{ address }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import logoSvg from '../../../public/favicon.svg?raw'

defineProps<{
  /** 게임 이름 */
  title: string
  /** 내 점수 숫자 (없으면 숫자 자리를 뺀다) */
  score?: string
  unit?: string
  /** 숫자 밑 한 줄 (읽씹 탈출의 '답장 올 확률'), 숫자가 없으면 이 줄만 */
  label?: string
  /** 어떻게 승패가 나나 */
  how: string
  /** 그림에 적는 주소 (누를 수는 없다. 링크 스티커는 올리는 사람이 붙인다) */
  address: string
}>()
const logo = (px: number) => logoSvg.replace('<svg ', `<svg width="${px}" height="${px}" `)
</script>
