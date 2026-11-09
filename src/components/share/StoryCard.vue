<template>
  <!-- 인스타 스토리 그림 한 장 (1080×1920으로 찍는다, src/utils/storyShare.ts). 앱의 소식 카드를 그대로 넣어 앱 화면이 곧 그림이 된다.
       화면 설정과 상관없이 다크(.theme-dark). 위 70px·아래 120px은 인스타가 프로필 줄·답장 칸으로 덮으니 비워 둔다 -->
  <div class="theme-dark bg-canvas text-fg font-sans flex flex-col" :style="{ width: W + 'px', height: H + 'px', padding: '76px 24px 128px' }">
    <div class="flex items-center gap-2">
      <!-- 로고는 그림 파일 대신 SVG를 그대로 넣는다. 사파리에서 첫 장을 찍을 때 <img>가 아직 안 그려져 빠진 적이 있다 -->
      <span class="block w-[26px] h-[26px] rounded-[7px] overflow-hidden" aria-hidden="true" v-html="logo"></span>
      <span class="text-[15px] font-semibold tracking-[-0.02em]">매치</span>
    </div>

    <!-- 보내는 사람의 한 줄: 이기면 자랑, 지면 다음 사람에게 넘긴다 (docs product/growth/viral-structures-adoption.md 3절 ①) -->
    <p class="mt-9 text-[34px] leading-[1.18] font-semibold tracking-[-0.045em] break-keep">{{ line }}</p>

    <div class="mt-7 rounded-2xl bg-surface px-4 py-5">
      <AppDuelFeedCard v-if="post.appDuel" :post="post" :my-id="myId" still />
      <FeedCard v-else :post="post" :my-id="myId ?? undefined" still />
    </div>

    <div class="mt-auto pt-6">
      <p class="text-[15px] text-fg-muted break-keep">나도 한 판 붙어 보기</p>
      <p class="mt-2 inline-flex items-center rounded-full bg-signal text-signal-on px-4 h-10 text-[17px] font-semibold tracking-[-0.01em]">matchapp.me</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppDuelFeedCard from '../feed/AppDuelFeedCard.vue'
import FeedCard from '../feed/FeedCard.vue'
import { storyLine } from '../../utils/storyLine'
import logoSvg from '../../../public/favicon.svg?raw'

const props = defineProps<{ post: any; myId?: number | null }>()
const W = 360
const H = 640
const logo = logoSvg.replace('<svg ', '<svg width="26" height="26" ')
const line = computed(() => storyLine(props.post, props.myId ?? null))
</script>
