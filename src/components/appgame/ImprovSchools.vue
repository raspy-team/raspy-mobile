<template>
  <!-- 학교 대항 순위 (11/14, README 3-6 ②): 학교를 고른 사람들의 임기응변 최고 등급 평균.
       결과 바로 밑에 "○○대 평균 4.2등급 · 전체 7위". 학교를 고르려면 가입한다(손님에게는 가입의 이유, 가입한 사람에게는 다시 올 이유) -->
  <UiCard v-if="data">
    <div class="flex items-center justify-between">
      <p class="t-label">학교 대항</p>
      <UiButton v-if="data.total > 3" size="sm" variant="ghost" class="-mr-2 -my-2" @click="open = true">전체 {{ data.total }}곳</UiButton>
    </div>

    <!-- 내 학교: 평균과 순위 -->
    <template v-if="data.mine">
      <p class="t-title mt-2 break-keep">{{ data.mine.name }} <span class="hl">{{ data.mine.rank }}위</span></p>
      <p class="t-caption mt-1">평균 {{ data.mine.avgGrade.toFixed(1) }}등급 · {{ data.mine.members }}명 · {{ data.total }}곳 중</p>
      <p v-if="pull" class="t-body mt-2 break-keep">{{ pull }}</p>
    </template>
    <!-- 학교를 골랐는데 아직 등급이 없다 -->
    <p v-else-if="data.hasSchool" class="t-body mt-2 break-keep">한 판을 끝내면 내 등급이 우리 학교 평균에 들어가요</p>
    <!-- 학교를 안 골랐다(가입한 사람) · 손님 -->
    <template v-else>
      <p class="t-title mt-2 break-keep">{{ grade ? `내 ${grade}등급, 우리 학교 평균에 넣을까요?` : '우리 학교는 몇 위일까요?' }}</p>
      <p class="t-caption mt-1 break-keep">{{ guest ? '가입하고 학교를 고르면 내 등급이 우리 학교 평균에 들어가요' : '학교를 고르면 내 등급이 우리 학교 평균에 들어가요' }}</p>
    </template>

    <!-- 위 셋 (내 학교가 그 안에 있으면 표시) -->
    <ol v-if="data.schools.length" class="mt-3 space-y-1.5">
      <li v-for="s in data.schools.slice(0, 3)" :key="s.orgId" class="flex items-center gap-2 t-body" :class="s.orgId === data.mine?.orgId ? 'text-fg font-semibold' : 'text-fg-muted'">
        <span class="w-5 tabular-nums">{{ s.rank }}</span>
        <span class="flex-1 min-w-0 truncate">{{ s.name }}</span>
        <span class="tabular-nums shrink-0">{{ s.avgGrade.toFixed(1) }}등급 · {{ s.members }}명</span>
      </li>
    </ol>
    <p v-else class="t-caption mt-3 break-keep">아직 순위에 오른 학교가 없어요. 지금 고르면 우리 학교가 1위로 시작해요</p>

    <UiButton v-if="guest && !noCta" block class="mt-4" @click="emit('join')">우리 학교로 참전하기</UiButton>
    <UiButton v-else-if="!guest && !data.hasSchool" block variant="secondary" class="mt-4" to="/settings/organizations">학교 고르기</UiButton>

    <UiSheet v-model="open" title="학교 대항 순위">
      <p class="t-caption mb-3 break-keep">학교를 고른 사람들의 임기응변 최고 등급 평균이에요. 낮을수록 높은 순위</p>
      <ol class="space-y-2">
        <li v-for="s in data.schools" :key="s.orgId" class="flex items-center gap-2 t-body" :class="s.orgId === data.mine?.orgId ? 'text-fg font-semibold' : ''">
          <span class="w-6 tabular-nums">{{ s.rank }}</span>
          <span class="flex-1 min-w-0 truncate">{{ s.name }}</span>
          <span class="tabular-nums shrink-0 text-fg-muted">{{ s.avgGrade.toFixed(1) }}등급 · {{ s.members }}명</span>
        </li>
      </ol>
      <p v-if="data.mine && data.mine.rank > data.schools.length" class="t-body mt-3">{{ data.mine.rank }}위 {{ data.mine.name }} · {{ data.mine.avgGrade.toFixed(1) }}등급</p>
    </UiSheet>
  </UiCard>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { GET } from '@/api/client'
import type { components } from '@/api/schema'
import { UiButton, UiCard, UiSheet } from '../ui'

type Standings = components['schemas']['Standings']
// guest: 가입 전(학교를 고르려면 가입). grade: 방금 받은 등급(있으면 문구에 쓴다)
// noCta: 같은 화면에 가입 버튼이 이미 있으면 여기 버튼은 뺀다
const props = defineProps<{ guest?: boolean; grade?: number; noCta?: boolean }>()
const emit = defineEmits<{ (e: 'join'): void; (e: 'ready', shown: boolean): void }>()
const data = ref<Standings | null>(null)
const open = ref(false)

// 내 등급이 학교 평균을 올렸나 내렸나 (등급은 작을수록 좋다)
const pull = computed(() => {
  const m = data.value?.mine
  const g = data.value?.myGrade
  if (!m || !g) return ''
  if (m.members === 1) return '지금은 나 혼자예요. 같은 학교 친구를 부르면 평균이 움직여요'
  if (g < m.avgGrade) return `내 ${g}등급이 평균을 끌어올리고 있어요`
  if (g > m.avgGrade) return `내 ${g}등급이 평균을 깎고 있어요. 한 판 더?`
  return `내 ${g}등급이 딱 평균이에요`
})

onMounted(async () => {
  try {
    data.value = (await GET('/api/improv/schools', { quiet: true })).data
  } catch {
    data.value = null // 못 불러오면 칸째 숨긴다
  }
  emit('ready', !!data.value)
})
</script>
