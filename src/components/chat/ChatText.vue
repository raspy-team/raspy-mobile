<template>
  <!-- 우리 앱 주소만 눌리게 (앱 안에서 그 화면으로). 다른 사이트 주소는 글자로 둔다: 처음 보는 사람끼리 쓰는 대화라 낯선 링크를 누르게 하지 않는다 -->
  <template v-for="(part, i) in parts" :key="i">
    <RouterLink v-if="part.to" :to="part.to" class="hit underline underline-offset-2 break-all" @click.stop>{{ part.label }}</RouterLink>
    <template v-else>{{ part.text }}</template>
  </template>
</template>

<script setup lang="ts">
// 메시지 글. 신뢰 사다리 도전장(서버 TrustLadder)처럼 서버가 보내는 메시지에 앱 주소가 들어 있는데, 글자로만 보여 눌리지 않았다 (11/4 밤샘)
import { computed } from 'vue'

const props = defineProps<{ text: string }>()

const OWN_HOSTS = ['matchapp.me', 'www.matchapp.me', 'raspy-mobile.vercel.app']
const URL_RE = /https?:\/\/[^\s]+/g

type Part = { text: string; to?: string; label?: string }

const parts = computed<Part[]>(() => {
  const out: Part[] = []
  let last = 0
  for (const m of props.text.matchAll(URL_RE)) {
    const start = m.index ?? 0
    // 주소 뒤에 붙은 문장 부호는 주소가 아니다 ("…/games/3." "(…/clubs/2)")
    const url = m[0].replace(/[.,)!?'"]+$/, '')
    if (start > last) out.push({ text: props.text.slice(last, start) })
    out.push(toPart(url))
    last = start + url.length
  }
  if (last < props.text.length) out.push({ text: props.text.slice(last) })
  return out
})

function toPart(raw: string): Part {
  try {
    const url = new URL(raw)
    if (OWN_HOSTS.includes(url.hostname) || url.host === window.location.host) {
      const to = url.pathname + url.search + url.hash
      return { text: raw, to, label: labelFor(url.pathname) }
    }
  } catch {
    // 주소 모양이 아니면 글자로
  }
  return { text: raw }
}

/** 긴 주소 대신 무엇인지 */
function labelFor(path: string) {
  if (path.startsWith('/challenge/')) return '한 판 열기'
  if (path.startsWith('/games/')) return '경기 보기'
  if (path.startsWith('/clubs/') || path.startsWith('/club/')) return '동호회 보기'
  if (path.startsWith('/vote/')) return '투표하기'
  return '열기'
}
</script>
