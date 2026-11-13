<template>
  <!-- 지금 사람이 있나 (11/14, README 3-6 '빈 식당'): 실제 수만 보인다. 적을 때는 그리지 않는다(적은 수는 오히려 비어 보인다).
       home: 홈 맨 위 한 줄(누르면 임기응변으로). start: 시작 버튼 곁의 한 줄 -->
  <component :is="variant === 'home' ? RouterLink : 'p'" v-if="text" :to="variant === 'home' ? '/play/improv' : undefined" :class="variant === 'home' ? 'flex items-center gap-2 rounded-xl bg-surface px-4 py-3 mb-4 active:bg-surface-2' : 't-caption text-center mt-2'">
    <span class="relative flex h-2 w-2 shrink-0" aria-hidden="true">
      <span v-if="p && p.playingNow >= NOW_MIN" class="absolute inline-flex h-full w-full rounded-full bg-signal opacity-60 animate-ping" />
      <span class="relative inline-flex h-2 w-2 rounded-full" :class="p && p.playingNow >= NOW_MIN ? 'bg-signal' : 'bg-fg-subtle'" />
    </span>
    <span :class="variant === 'home' ? 'flex-1 min-w-0 t-body text-fg truncate' : ''">{{ text }}</span>
    <UiIcon v-if="variant === 'home'" name="chevron-right" class="text-fg-subtle" aria-hidden="true" />
  </component>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { GET } from '@/api/client'
import type { components } from '@/api/schema'
import { UiIcon } from '../ui'

type Pulse = components['schemas']['Pulse']
const props = withDefaults(defineProps<{ variant?: 'home' | 'start' }>(), { variant: 'start' })
const p = ref<Pulse | null>(null)

// 이보다 적으면 말하지 않는다
const NOW_MIN = 3
const TODAY_MIN = 10

const text = computed(() => {
  const v = p.value
  if (!v) return ''
  const now = v.playingNow >= NOW_MIN ? `지금 ${v.playingNow}명이 푸는 중` : ''
  const today = v.peopleToday >= TODAY_MIN ? `오늘 ${v.peopleToday.toLocaleString()}명이 풀었어요` : ''
  if (props.variant === 'home') {
    if (!now && !today) return ''
    return `임기응변 등급 · ${[now, today].filter(Boolean).join(' · ')}`
  }
  return [now, today].filter(Boolean).join(' · ')
})

onMounted(async () => {
  try {
    p.value = (await GET('/api/improv/pulse', { quiet: true })).data
  } catch {
    p.value = null // 못 불러오면 그리지 않는다
  }
})
</script>
