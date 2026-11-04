<template>
  <svg :width="size" :height="size" viewBox="0 0 64 64" fill="none" stroke-linecap="round" stroke-linejoin="round" role="img" :aria-label="info.name">
    <!-- 매치: 로고 얼굴 그대로 (셔틀콕 머리·축구공 눈·농구공 솔기·볼트 입). 모두를 한 판으로 부르는 주인공 -->
    <g v-if="who === 'match'" :stroke="ink" stroke-width="3.4">
      <path d="M28.6 16.6L22.5 4.5" /><path d="M32 16.5V3.5" /><path d="M35.4 16.6l6.1-12.1" /><path d="M25.4 10.5h13.2" />
      <circle cx="32" cy="39" r="22" :fill="fill('#f6f2e6')" />
      <path d="M14.5 27c4.6 5 4.6 19 0 24" /><path d="M49.5 27c-4.6 5-4.6 19 0 24" />
      <g v-if="mood !== 'sad'">
        <path d="M24.5 31.5l3 2.2-1.2 3.5h-3.6l-1.2-3.5z" :fill="ink" stroke-width="1.4" />
        <path d="M39.5 31.5l3 2.2-1.2 3.5h-3.6l-1.2-3.5z" :fill="ink" stroke-width="1.4" />
      </g>
      <g v-else stroke-width="2.6"><path d="M21.5 34.5h6" /><path d="M36.5 34.5h6" /></g>
      <path v-if="mood === 'smile' || mood === 'cheer'" d="M24 45h16a8 7.5 0 0 1-16 0z" :fill="VOLT" />
      <path v-else-if="mood === 'sad'" d="M26 50c3-3 9-3 12 0" />
      <ellipse v-else cx="32" cy="48.5" rx="3.6" ry="4.2" :fill="VOLT" />
    </g>

    <!-- 콕이: 셔틀콕. 깃털 치마에 코르크 얼굴. 빠르고 겁이 조금 많은 친구 (라켓 종목, 처음 온 사람의 길잡이) -->
    <g v-else-if="who === 'kok'" :stroke="ink" stroke-width="3">
      <path d="M17 30L10 6M24 29L21 4M32 29V3M40 29l3-25M47 30l7-24" stroke-width="2.4" />
      <path d="M12 14h40M14.5 22h35" stroke-width="2" />
      <path d="M15 30h34" :stroke="VOLT" stroke-width="3.6" />
      <path d="M15 31h34v6a17 20 0 0 1-34 0z" :fill="fill('#ecdcbf')" />
      <circle cx="26" cy="41" r="2.2" :fill="ink" stroke="none" />
      <circle cx="38" cy="41" r="2.2" :fill="ink" stroke="none" />
      <path v-if="mood === 'wow'" d="M30 48a2 2.5 0 1 0 4 0a2 2.5 0 1 0-4 0" :fill="ink" stroke-width="1.6" />
      <path v-else-if="mood === 'sad'" d="M28 50c2-2 6-2 8 0" stroke-width="2.4" />
      <path v-else d="M28 47c2 2.4 6 2.4 8 0" stroke-width="2.4" />
      <path d="M21.5 45.5h2.5M40 45.5h2.5" stroke="#f2a7a0" stroke-width="2.4" />
    </g>

    <!-- 통통: 농구공. 머리띠를 맨 응원단장. 남의 경기도 신나게 응원한다 (응원·관중) -->
    <g v-else-if="who === 'tong'" :stroke="ink" stroke-width="3">
      <circle cx="32" cy="35" r="24" :fill="fill('#f08a2c')" />
      <!-- 솔기는 얼굴을 가리지 않게 가장자리와 위·아래만 -->
      <path d="M32 11v12M32 52v7M14.5 18.5c5 5 6.5 14 6 20M49.5 18.5c-5 5-6.5 14-6 20M16 52c3-3 5-6 5.5-9M48 52c-3-3-5-6-5.5-9" stroke-width="2.2" :stroke="variant === 'color' ? '#7a3b0c' : ink" />
      <path d="M10.5 25.5c14-6 29-6 43 0" :stroke="VOLT" stroke-width="5" />
      <template v-if="mood === 'sad'">
        <path d="M21 36h6M37 36h6" stroke-width="2.6" />
        <path d="M27 48c3-2.5 7-2.5 10 0" stroke-width="2.6" />
      </template>
      <template v-else>
        <path d="M20.5 37c1.6-3 5-3 6.5 0M37 37c1.6-3 5-3 6.5 0" stroke-width="2.6" />
        <path v-if="mood === 'wow'" d="M29 46a3 3.5 0 1 0 6 0a3 3.5 0 1 0-6 0" :fill="ink" stroke-width="1.6" />
        <path v-else d="M24 44h16a8 6.5 0 0 1-16 0z" :fill="ink" stroke-width="1.6" />
      </template>
      <g v-if="mood === 'cheer'" :stroke="VOLT" stroke-width="2.6"><path d="M4 8l4 4M60 8l-4 4M2 20h5M62 20h-5" /></g>
    </g>

    <!-- 돌돌: 알까기 바둑돌. 말수 적고 침착한 수읽기 장인 (앱 게임·두뇌 게임, 하루 퍼즐) -->
    <g v-else-if="who === 'dol'" :stroke="ink" stroke-width="3">
      <ellipse cx="32" cy="38" rx="25" ry="19" :fill="fill('#232329')" />
      <path d="M17 29c3-4 8-6 12-6" :stroke="variant === 'color' ? '#5c5c66' : ink" stroke-width="2.6" />
      <template v-if="mood === 'wow'">
        <circle cx="24" cy="38" r="3.4" :fill="eyeOnDark" stroke="none" />
        <circle cx="40" cy="38" r="3.4" :fill="eyeOnDark" stroke="none" />
      </template>
      <template v-else-if="mood === 'sad'">
        <path d="M20.5 39.5h7M36.5 39.5h7" :stroke="eyeOnDark" stroke-width="2.6" />
      </template>
      <template v-else>
        <path d="M20.5 38.5c2 1.6 5 1.6 7 0M36.5 38.5c2 1.6 5 1.6 7 0" :stroke="eyeOnDark" stroke-width="2.6" />
      </template>
      <path v-if="mood !== 'sad'" d="M29.5 46.5h5" :stroke="eyeOnDark" stroke-width="2.4" />
      <path d="M48 12l-3.5 7h5L46 26" :stroke="VOLT" stroke-width="2.8" />
    </g>

    <!-- 비비: AI 주민 안내 로봇. 사람이 적을 때 빈자리를 채우고, 사람이 늘면 물러난다. 늘 'AI'를 단다 -->
    <g v-else :stroke="ink" stroke-width="3">
      <path d="M32 12V5" /><circle cx="32" cy="4.5" r="3" :fill="VOLT" stroke-width="2" />
      <rect x="10" y="13" width="44" height="38" rx="12" :fill="fill('#9ad0ff')" />
      <rect x="16" y="20" width="32" height="22" rx="6" :fill="variant === 'color' ? '#16324d' : 'none'" stroke-width="2.4" />
      <template v-if="mood === 'sad'">
        <path d="M22 31h6M36 31h6" :stroke="screenInk" stroke-width="2.6" />
      </template>
      <template v-else-if="mood === 'wow'">
        <rect x="22" y="27" width="5" height="5" :fill="screenInk" stroke="none" /><rect x="37" y="27" width="5" height="5" :fill="screenInk" stroke="none" />
      </template>
      <template v-else>
        <rect x="22" y="27" width="5" height="5" :fill="screenInk" stroke="none" /><rect x="37" y="27" width="5" height="5" :fill="screenInk" stroke="none" />
        <path d="M27 36.5h10" :stroke="screenInk" stroke-width="2.4" />
      </template>
      <path d="M22 51v6M42 51v6" stroke-width="3" />
      <text x="51" y="61" text-anchor="end" font-size="9" font-weight="800" :fill="ink" stroke="none" font-family="sans-serif">AI</text>
    </g>
  </svg>
</template>

<script setup lang="ts">
// 매치 공식 캐릭터 다섯 (11/5, docs/mascots.md). 로고 얼굴(매치)에서 나온 식구들: 공 하나에 한 종목, 성격 하나.
// variant: line(앱 안: 글자색 선, 다크·라이트 모두) · color(인스타·스티커·빈 화면: 채운 색)
// mood: smile(기본) · wow(놀람·새 소식) · sad(졌을 때·못 불러옴, 담담하게) · cheer(이겼을 때·응원)
import { computed } from 'vue'

type Who = 'match' | 'kok' | 'tong' | 'dol' | 'bibi'
const props = withDefaults(defineProps<{ who?: Who; mood?: 'smile' | 'wow' | 'sad' | 'cheer'; size?: number | string; variant?: 'line' | 'color' }>(), {
  who: 'match',
  mood: 'smile',
  size: 64,
  variant: 'line',
})

const VOLT = '#d2ff4d'
const NAMES: Record<Who, string> = { match: '매치', kok: '콕이', tong: '통통', dol: '돌돌', bibi: '비비' }
const info = computed(() => ({ name: NAMES[props.who] }))
const ink = computed(() => (props.variant === 'color' ? '#16161a' : 'currentColor'))
const fill = (c: string) => (props.variant === 'color' ? c : 'none')
const eyeOnDark = computed(() => (props.variant === 'color' ? '#f6f2e6' : 'currentColor'))
const screenInk = computed(() => (props.variant === 'color' ? VOLT : 'currentColor'))
</script>
