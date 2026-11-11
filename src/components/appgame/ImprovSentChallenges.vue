<template>
  <!-- 내가 보낸 도전장의 결과 (임기응변 등급, 가입 전). 손님에게는 알림이 없어서, 다시 오면 여기서 친구들의 승패를 본다 (3-5 걷기 C2).
       친구는 누군지 모른다(가입 전). 그래서 '친구 1, 2…'로 부르고, 최근 것부터 -->
  <UiCard v-if="rows.length">
    <p class="t-title">보낸 도전장</p>
    <p class="t-caption mt-1">내 링크로 친구 {{ rows.length }}명이 붙었어요</p>
    <ul class="mt-3 space-y-2">
      <li v-for="(r, i) in rows" :key="i" class="flex items-center justify-between gap-3 t-body">
        <span class="min-w-0 truncate">친구 {{ rows.length - i }} · {{ gradeOf(r.theirLine, r.theirScore) }}</span>
        <span class="shrink-0" :class="r.myScore > r.theirScore ? 'text-signal-fg font-semibold' : 'text-fg-muted'">
          {{ r.myScore > r.theirScore ? '내가 이김' : r.myScore < r.theirScore ? '친구가 이김' : '비김' }}
        </span>
      </li>
    </ul>
  </UiCard>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { GET } from '@/api/client'
import type { components } from '@/api/schema'
import { UiCard } from '../ui'

type Sent = components['schemas']['SentChallenge']

const props = defineProps<{ visitorId: string }>()
const rows = ref<Sent[]>([])

// 등급이 안 나온 판(셋 다 비움·마감 넘김)은 점수 대신 그 말로: "친구 2 · 0점"만 다른 줄과 달랐다 (경로 10 리뷰 I8)
function gradeOf(line?: string | null, score?: number) {
  return line?.match(/\d등급/)?.[0] ?? (score ? `${score}점` : '대답 없음')
}

onMounted(async () => {
  if (!props.visitorId) return
  try {
    rows.value = (await GET('/api/guest/plays/challenges', { query: { visitorId: props.visitorId, key: 'improv' } })).data ?? []
  } catch {
    // 못 불러와도 판은 그대로 한다
  }
})
</script>
