<template>
  <!-- 친구와의 승부 (11/14 초대받은 1:1): 도전장으로 붙었지만 친구가 아직 가입 전인 판들.
       손님에게는 가리던 승패와 친구의 답을, 가입한 사람에게 여기서 보인다. 친구도 가입하면 1:1 경기로 바뀌어 아래 대결 목록으로 간다 -->
  <UiSection v-if="rows.length" title="친구와의 승부">
    <!-- 가장 최근 승부는 크게: "누가 이겼는지 보기"를 눌러 가입한 사람이 받는 답이다 (11/14 전수 평가: 작은 칩 하나였다) -->
    <UiCard class="text-center">
      <p class="t-micro">{{ who(rows[0]) }}</p>
      <p class="t-display mt-2"><span :class="rows[0].result === 'WIN' ? 'hl' : ''">{{ RESULT[rows[0].result] ?? rows[0].result }}</span></p>
      <p class="t-heading mt-3">{{ line(rows[0]) }}</p>
      <UiButton class="mt-4" variant="secondary" @click="open = rows[0]">친구 답 보기</UiButton>
    </UiCard>
    <UiList v-if="rows.length > 1" class="mt-3">
      <UiListItem v-for="r in rows.slice(1)" :key="r.id" :title="line(r)" :subtitle="who(r)" chevron @click="open = r">
        <template #trailing>
          <UiBadge :tone="r.result === 'WIN' ? 'primary' : 'neutral'">{{ RESULT[r.result] ?? r.result }}</UiBadge>
        </template>
      </UiListItem>
    </UiList>
    <p class="t-micro mt-2 break-keep">친구가 아직 가입 전이에요. 친구도 가입하면 둘의 1:1 기록으로 남아요</p>

    <UiSheet :model-value="!!open" :title="open ? `${RESULT[open.result]} · ${line(open)}` : ''" @update:model-value="open = null">
      <template v-if="open">
        <div v-for="(s, i) in improvSituations(open.problem)" :key="s.id" class="py-3" :class="i ? 'border-t border-line' : ''">
          <p class="t-micro">{{ s.who }}</p>
          <p class="t-caption mt-1 break-keep">“{{ s.line }}”</p>
          <p class="t-body mt-2 break-keep">나: {{ improvAnswers(open.myAnswer)[i] || '(대답 없음)' }}</p>
          <p class="t-body mt-1 break-keep text-fg-muted">친구: {{ improvAnswers(open.theirAnswer)[i] || (open.theirAnswer ? '(대답 없음)' : '(가려진 답)') }}</p>
        </div>
      </template>
    </UiSheet>
  </UiSection>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { GET } from '@/api/client'
import type { components } from '@/api/schema'
import { UiBadge, UiButton, UiCard, UiList, UiListItem, UiSection, UiSheet } from '../ui'
import { improvAnswers, improvSituations } from '@/utils/improv'

type Versus = components['schemas']['Versus']
const emit = defineEmits<{ (e: 'loaded', rows: Versus[]): void }>()
const rows = ref<Versus[]>([])
const open = ref<Versus | null>(null)
const RESULT: Record<string, string> = { WIN: '이겼어요', LOSE: '졌어요', DRAW: '비겼어요' }

// "N등급"만 (없으면 점수)
const grade = (l?: string | null, score?: number) => l?.match(/\d등급/)?.[0] ?? `${Math.round(score ?? 0)}점`
const who = (r: Versus) => (r.role === 'SENT' ? '내 링크로 푼 친구와의 승부' : '나를 초대한 친구와의 승부')
const line = (r: Versus) => `나 ${grade(r.myLine, r.myScore)} · 친구 ${grade(r.theirLine, r.theirScore)}`

async function load() {
  try {
    rows.value = (await GET('/api/guest/plays/versus', { query: { key: 'improv' }, quiet: true })).data ?? []
  } catch {
    rows.value = [] // 못 불러와도 게임 화면은 그대로
  }
  emit('loaded', rows.value)
}
onMounted(load)
defineExpose({ load })
</script>
