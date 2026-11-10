<template>
  <!-- 공유 그림 한 장 (src/utils/storyShare.ts가 찍는다). 앱의 소식 카드를 그대로 넣어 앱 화면이 곧 그림이 된다. 화면 설정과 상관없이 다크(.theme-dark)
       - dark·volt: 인스타 스토리 한 장(1080×1920). 위 70px·아래 120px은 인스타가 프로필 줄·답장 칸으로 덮으니 비워 둔다
       - sticker: 바탕이 투명한 카드 한 장. 인스타 스토리에서 내 사진 위에 붙인다 (Strava의 통계 스티커처럼) -->
  <div v-if="variant === 'sticker'" class="theme-dark text-fg font-sans p-3" :style="{ width: W + 'px' }">
    <div class="rounded-[22px] bg-canvas px-4 pt-4 pb-5 border border-line-strong">
      <div class="flex items-center gap-2">
        <span class="block w-[22px] h-[22px] rounded-[6px] overflow-hidden" aria-hidden="true" v-html="logo(22)"></span>
        <span class="text-[13px] font-semibold tracking-[-0.02em]">매치</span>
        <span class="ml-auto text-[12px] text-fg-muted">matchapp.me</span>
      </div>
      <p class="mt-3 text-[24px] leading-[1.2] font-semibold tracking-[-0.04em] break-keep">{{ line }}</p>
      <div class="mt-3">
        <AppDuelFeedCard v-if="post.appDuel" :post="post" :my-id="myId ?? undefined" still />
        <FeedCard v-else :post="post" :my-id="myId ?? undefined" still />
      </div>
    </div>
  </div>

  <div
    v-else
    class="theme-dark font-sans flex flex-col"
    :class="volt ? 'bg-signal text-signal-on' : 'bg-canvas text-fg'"
    :style="{ width: W + 'px', height: H + 'px', padding: '76px 24px 128px' }"
  >
    <div class="flex items-center gap-2">
      <!-- 로고는 그림 파일 대신 SVG를 그대로 넣는다. 사파리에서 첫 장을 찍을 때 <img>가 아직 안 그려져 빠진 적이 있다 -->
      <span class="block w-[26px] h-[26px] rounded-[7px] overflow-hidden" aria-hidden="true" v-html="logo(26)"></span>
      <span class="text-[15px] font-semibold tracking-[-0.02em]">매치</span>
    </div>

    <!-- 보내는 사람의 한 줄: 이기면 자랑, 지면 다음 사람에게 넘긴다 (product/growth/viral-structures-adoption.md 3절 ①) -->
    <p class="mt-9 text-[34px] leading-[1.18] font-semibold tracking-[-0.045em] break-keep">{{ line }}</p>

    <!-- 카드가 길어도 꼬리(나도 한 판·주소)는 그림 안에: 카드 칸이 줄고 넘치는 것은 가린다 (3-5 P6 나머지 F1) -->
    <div class="mt-7 min-h-0 shrink overflow-hidden rounded-2xl bg-surface text-fg px-4 py-5">
      <AppDuelFeedCard v-if="post.appDuel" :post="post" :my-id="myId ?? undefined" still />
      <FeedCard v-else :post="post" :my-id="myId ?? undefined" still />
    </div>

    <div class="mt-auto pt-6 shrink-0">
      <p class="text-[15px] break-keep" :class="volt ? 'text-signal-on/70' : 'text-fg-muted'">나도 한 판 붙어 보기</p>
      <p
        class="mt-2 inline-flex items-center rounded-full px-4 h-10 text-[17px] font-semibold tracking-[-0.01em]"
        :class="volt ? 'bg-signal-on text-signal' : 'bg-signal text-signal-on'"
      >matchapp.me</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppDuelFeedCard from '../feed/AppDuelFeedCard.vue'
import FeedCard from '../feed/FeedCard.vue'
import { storyLine } from '../../utils/storyLine'
import logoSvg from '../../../public/favicon.svg?raw'
import type { StoryVariant } from '../../utils/storyShare'

const props = withDefaults(defineProps<{ post: any; myId?: number | null; variant?: StoryVariant }>(), { variant: 'dark', myId: null })
const W = 360
const H = 640
const volt = computed(() => props.variant === 'volt')
const logo = (px: number) => logoSvg.replace('<svg ', `<svg width="${px}" height="${px}" `)
const line = computed(() => storyLine(props.post, props.myId ?? null))
</script>
