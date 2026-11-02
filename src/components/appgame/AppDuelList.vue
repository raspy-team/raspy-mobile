<template>
  <UiList>
    <UiListItem v-for="d in duels" :key="d.gameId" :title="d.title" :subtitle="view(d).line" @click="router.push(view(d).to)">
      <template #leading>
        <span class="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center flex-shrink-0" aria-hidden="true">
          <UiIcon :name="d.icon" />
        </span>
      </template>
      <template #trailing>
        <UiBadge :tone="view(d).act ? 'primary' : 'neutral'">{{ view(d).badge }}</UiBadge>
      </template>
    </UiListItem>
  </UiList>
</template>

<script setup lang="ts">
// 아직 안 끝난 앱 대결 목록 (내 경기 화면). 내가 할 일이 남은 판(이어서 하기·하는 중)은 배지를 칠한다
import { useRouter } from 'vue-router'
import type { components } from '@/api/schema'
import { UiBadge, UiIcon, UiList, UiListItem } from '../ui'

type Duel = components['schemas']['AppDuelResponse']
defineProps<{ duels: Duel[] }>()
const router = useRouter()

function hhmm(at?: string) {
  if (!at) return ''
  const d = new Date(at)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function view(d: Duel) {
  const result = `/play/${d.key}?duel=${d.gameId}`
  if (d.playMode === 'REALTIME') return { badge: '하는 중', line: `${d.opponent?.nickname ?? '상대'}님과 하는 중`, to: `/play/${d.key}/live`, act: true }
  if (d.deadlineAt && new Date(d.deadlineAt).getTime() > Date.now()) return { badge: '이어서 하기', line: '아직 내지 않았어요', to: `/play/${d.key}?resume=1`, act: true }
  if (d.myJudging) return { badge: '채점 중', line: '끝나면 알림으로 알려 드릴게요', to: result, act: false }
  if (d.status === 'VOTING') return { badge: '투표 중', line: `투표 마감 ${hhmm(d.votingEndsAt)}`, to: result, act: false }
  if (d.opponent) return { badge: '상대 차례', line: `${d.opponent.nickname}님이 푸는 중`, to: result, act: false }
  return { badge: '상대 찾는 중', line: '같은 문제를 풀 사람을 기다려요', to: result, act: false }
}
</script>
