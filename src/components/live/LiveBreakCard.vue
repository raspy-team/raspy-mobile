<template>
  <!-- 세트 사이 라커룸: 그 세트 동안 관중이 보낸 응원을 한 장으로. 선수는 '고마워요' 한 번 -->
  <section class="rounded-xl bg-surface p-4" aria-live="polite">
    <!-- 응원 한 장은 응원단장 통통이 신나게 (docs/mascots.md) -->
    <div class="flex items-center gap-3">
      <MatchMascot who="tong" mood="cheer" :size="48" aria-hidden="true" />
      <div class="min-w-0">
        <p class="t-micro">{{ data.final ? '경기 내내' : `${data.set}세트 동안` }}</p>
        <p class="t-heading mt-1">
          관중 {{ data.viewers }}명이 응원했어요<template v-if="data.reactions"> · {{ data.topEmoji }} {{ data.reactions }}번</template>
        </p>
      </div>
    </div>
    <ul v-if="data.shouts.length" class="mt-2 space-y-1">
      <li v-for="s in data.shouts" :key="s.text" class="t-body">“{{ s.text }}” <span class="t-micro tabular-nums">×{{ s.count }}</span></li>
    </ul>
    <UiButton v-if="player" block size="sm" class="mt-3" :variant="thanked ? 'secondary' : 'primary'" :disabled="thanked" @click="thank">
      {{ thanked ? '고마움을 전했어요' : '관중에게 고마워요' }}
    </UiButton>
  </section>
</template>

<script setup lang="ts">
// 세트 사이 한 장 (관중, 11/3 세션 2. docs/live-spectator-review.md B). 서버 LiveWatchService가 세트가 끝날 때 BREAK로 보낸다
import { ref } from 'vue'
import { POST } from '@/api/client'
import { UiButton } from '../ui'
import MatchMascot from '../mascot/MatchMascot.vue'

export type LiveBreak = { set: number; final: boolean; viewers: number; reactions: number; topEmoji?: string; shouts: { text: string; count: number }[] }
const props = defineProps<{ data: LiveBreak; gameId: number; player?: boolean }>()
const thanked = ref(false)

async function thank() {
  thanked.value = true
  await POST('/api/games/{gameId}/live/thanks', { path: { gameId: props.gameId } }).catch(() => { thanked.value = false })
}
</script>
