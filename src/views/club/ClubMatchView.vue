<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar title="교류전" back />
    <main class="max-w-xl mx-auto px-4 pt-4 pb-16">
      <UiSkeleton v-if="!m && !error" class="h-40 w-full" />
      <!-- 한 번 실패하면 이 문구가 굳고 다시 시도가 없었다 (경로 7 리뷰) -->
      <UiEmptyState v-else-if="error" class="pt-16" icon="fas fa-triangle-exclamation" :title="error">
        <UiButton variant="secondary" @click="retry">다시 시도</UiButton>
      </UiEmptyState>
      <template v-else-if="m">
        <!-- 두 동호회와 점수 -->
        <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-3 mt-2">
          <RouterLink :to="`/clubs/${m.home.clubId}`" class="t-heading truncate" :class="m.result === 'HOME' ? 'hl' : ''">{{ m.home.name }}</RouterLink>
          <span class="text-[2rem] font-semibold tabular-nums leading-none">{{ m.home.score }}<span class="text-fg-subtle mx-1">:</span>{{ m.away.score }}</span>
          <RouterLink :to="`/clubs/${m.away.clubId}`" class="t-heading truncate text-right" :class="m.result === 'AWAY' ? 'hl' : ''">{{ m.away.name }}</RouterLink>
        </div>
        <p class="t-caption text-center mt-3">{{ [m.ruleTitle, `${m.boards}판 ${m.perBoard === 2 ? '2:2' : '1:1'}`, STATUS[m.status], m.matchDate ? when(m.matchDate) : '', m.placeRoad].filter(Boolean).join(' · ') }}</p>
        <p v-if="m.message" class="t-body text-center mt-2 break-words">“{{ m.message }}”</p>

        <!-- 받는 동호회 운영진: 받기·거절 -->
        <div v-if="m.status === 'PROPOSED' && m.mySide === 'AWAY'" class="flex gap-2 mt-5">
          <UiButton class="flex-1" :loading="busy" @click="respond(true)">수락</UiButton>
          <UiButton class="flex-1" variant="secondary" :loading="busy" @click="respond(false)">거절</UiButton>
        </div>
        <p v-else-if="m.status === 'PROPOSED'" class="t-caption text-center mt-5">{{ m.away.name }} 운영진이 답하기를 기다려요</p>
        <!-- 판이 다 열렸으면 선수를 정하라는 말 대신 다음 할 일 -->
        <!-- 운영진이 아닌 멤버·구경하는 사람은 할 일이 없는데 아무 말이 없었다 (경로 7 리뷰): 누가 무엇을 하는지 -->
        <p v-if="m.status === 'ACCEPTED' && !m.mySide" class="t-caption text-center mt-5">선수는 두 동호회 운영진이 정해요. 판이 열리면 아래에서 경기를 볼 수 있어요</p>
        <p v-if="m.status === 'ACCEPTED' && m.mySide" class="t-caption text-center mt-5">{{ m.boardList.every((b) => b.gameId) ? '판마다 경기가 열렸어요. 경기에서 결과를 내면 점수가 올라가요' : '판마다 우리 선수를 정해 주세요. 양쪽이 다 정하면 그 판의 경기가 열려요' }}</p>

        <UiSection title="판" class="mt-8">
          <div class="space-y-2">
            <UiCard v-for="b in m.boardList" :key="b.boardNo" class="space-y-2">
              <div class="flex items-center gap-2">
                <span class="t-mono w-8 text-fg-subtle">{{ b.boardNo }}판</span>
                <span class="flex-1 min-w-0 truncate" :class="b.winner === 'HOME' ? 'text-fg font-semibold' : 'text-fg-muted'">
                  <span :class="b.winner === 'HOME' ? 'hl' : ''">{{ names(b.home) || '아직' }}</span>
                </span>
                <span class="t-micro">vs</span>
                <span class="flex-1 min-w-0 truncate text-right" :class="b.winner === 'AWAY' ? 'text-fg font-semibold' : 'text-fg-muted'">
                  <span :class="b.winner === 'AWAY' ? 'hl' : ''">{{ names(b.away) || '아직' }}</span>
                </span>
              </div>
              <div class="flex gap-2">
                <UiButton v-if="b.gameId" size="sm" variant="secondary" class="flex-1" @click="router.push(`/games/${b.gameId}`)">{{ GAME_STATUS[b.gameStatus || ''] || '경기 보기' }}</UiButton>
                <UiButton v-else-if="m.status === 'ACCEPTED' && m.mySide" size="sm" variant="secondary" class="flex-1" @click="openLineup(b.boardNo)">
                  {{ (m.mySide === 'HOME' ? b.home : b.away).length ? '우리 선수 바꾸기' : '우리 선수 정하기' }}
                </UiButton>
              </div>
            </UiCard>
          </div>
        </UiSection>

        <!-- 대회 판의 교류전은 취소하지 않는다 (서버도 막는다). 못 하게 되면 주최자가 정한다 -->
        <p v-if="m.tournament && m.mySide && m.status === 'ACCEPTED'" class="t-caption text-center mt-8">대회 경기라 취소할 수 없어요. 못 하게 되면 주최자에게 알려 주세요</p>
        <UiButton v-else-if="m.mySide && (m.status === 'PROPOSED' || m.status === 'ACCEPTED')" block variant="ghost" class="mt-8 text-danger" @click="cancel">
          {{ m.status === 'PROPOSED' && m.mySide === 'HOME' ? '신청 취소' : '교류전 취소' }}
        </UiButton>
      </template>
    </main>

    <!-- 판에 우리 선수 내기 -->
    <UiSheet :model-value="lineupBoard > 0" :title="`${lineupBoard}판 우리 선수 (${m?.perBoard === 2 ? '두 명' : '한 명'})`" @update:model-value="lineupBoard = 0">
      <UiListSkeleton v-if="!members" :rows="4" />
      <UiList v-else>
        <UiListItem v-for="p in members" :key="p.userId" :title="p.nickname" @click="toggle(p.userId)">
          <template #leading><UiAvatar :src="p.profilePicture || undefined" :name="p.nickname" :user-id="p.userId" size="sm" /></template>
          <template #trailing><UiIcon v-if="picked.includes(p.userId)" name="check" class="text-fg" aria-hidden="true" /></template>
        </UiListItem>
      </UiList>
      <template #footer>
        <UiButton block :loading="busy" :disabled="picked.length !== (m?.perBoard || 1)" @click="saveLineup">정하기</UiButton>
      </template>
    </UiSheet>
  </div>
</template>

<script setup lang="ts">
// 교류전 한 판 (/clubs/matches/:matchId): 동호회 대 동호회. 판마다 양쪽 선수 → 판이 보통 경기로 열린다 → 이긴 판이 많은 동호회가 이긴다
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { matchTime } from '@/utils/format'
import { useRoute, useRouter } from 'vue-router'
import { GET, POST, PUT } from '@/api/client'
import type { components } from '@/api/schema'
import { confirmDialog } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import { refreshOnChange } from '@/websocket/userChannel'
import {
  UiAvatar, UiButton, UiCard, UiEmptyState, UiIcon, UiList, UiListItem, UiListSkeleton, UiSection, UiSheet, UiSkeleton, UiTopBar,
} from '../../components/ui'

type Schemas = components['schemas']
const STATUS: Record<string, string> = { PROPOSED: '신청 중', ACCEPTED: '잡힘', COMPLETED: '끝남', CANCELED: '취소됨', DECLINED: '거절됨' }
const GAME_STATUS: Record<string, string> = { SCHEDULED: '경기 보기 · 시작 전', IN_PROGRESS: '하는 중 · 보러 가기', RESULT_PENDING: '결과 확인 중', COMPLETED: '결과 보기', CANCELED: '취소된 판' }
const route = useRoute()
const router = useRouter()
const { showToast } = useToast()
const matchId = Number(route.params.matchId)
const m = ref<Schemas['ClubMatchView'] | null>(null)
const error = ref('')
const busy = ref(false)

const names = (ps: Schemas['ClubMember'][]) => ps.map((p) => p.nickname).join('·')
// 분과 오전·오후까지 (예전엔 '11월 8일 19시'로 분을 버렸다). 다른 화면과 같은 꼴: '내일 오후 7:30'
const when = (iso: string) => matchTime(iso)
const message = (e: unknown, fallback: string) => (e as { response?: { data?: { message?: string } } }).response?.data?.message || fallback

async function load() {
  try {
    m.value = (await GET('/api/clubs/matches/{matchId}', { path: { matchId } })).data
    error.value = ''
  } catch (e) {
    // 보고 있던 교류전이 있으면 그대로 두고, 처음부터 못 받았을 때만 실패 화면. 없는 것과 연결 오류를 가른다
    const status = (e as { response?: { status?: number } }).response?.status
    if (!m.value) error.value = status === 404 || status === 403 ? '교류전을 찾지 못했어요' : '교류전을 불러오지 못했어요'
  }
}
function retry() {
  error.value = ''
  load()
}

/** 됐으면 true */
async function act(task: () => Promise<{ data: Schemas['ClubMatchView'] }>, fallback: string): Promise<boolean> {
  if (busy.value) return false
  busy.value = true
  try {
    m.value = (await task()).data
    return true
  } catch (e) {
    showToast(message(e, fallback))
    return false
  } finally {
    busy.value = false
  }
}
async function respond(accept: boolean) {
  // 거절은 확인 없이 바로 됐다 (경로 7 리뷰)
  if (!accept && !(await confirmDialog({ title: '교류전을 거절할까요?', message: '상대 운영진에게 알려요', confirmText: '거절', danger: true }))) return
  await act(() => POST('/api/clubs/matches/{matchId}/respond', { path: { matchId }, query: { accept } }), '답하지 못했어요')
}
async function cancel() {
  if (!(await confirmDialog({ title: '교류전을 취소할까요?', message: '상대 운영진에게 알려요. 시작한 판이 있으면 취소할 수 없어요', confirmText: '취소하기', danger: true }))) return
  await act(() => POST('/api/clubs/matches/{matchId}/cancel', { path: { matchId } }), '취소하지 못했어요')
}

// 판에 선수 내기: 우리 동호회 멤버 중에서
const lineupBoard = ref(0)
const members = ref<Schemas['ClubMember'][] | null>(null)
const picked = ref<number[]>([])
async function openLineup(boardNo: number) {
  if (!m.value) return
  lineupBoard.value = boardNo
  const b = m.value.boardList.find((x) => x.boardNo === boardNo)!
  picked.value = (m.value.mySide === 'HOME' ? b.home : b.away).map((p) => p.userId)
  const clubId = m.value.mySide === 'HOME' ? m.value.home.clubId : m.value.away.clubId
  members.value = null
  try {
    members.value = (await GET('/api/clubs/{id}', { path: { id: clubId } })).data.members
  } catch (e) {
    // 못 불러오면 빈 뼈대가 남지 않게 닫는다
    lineupBoard.value = 0
    showToast(message(e, '멤버를 불러오지 못했어요'))
  }
}
function toggle(userId: number) {
  const max = m.value?.perBoard || 1
  if (picked.value.includes(userId)) picked.value = picked.value.filter((x) => x !== userId)
  else picked.value = [...picked.value, userId].slice(-max)
}
async function saveLineup() {
  const boardNo = lineupBoard.value
  // 못 정했으면 고른 사람을 그대로 두고 시트도 닫지 않는다
  if (await act(() => PUT('/api/clubs/matches/{matchId}/boards/{boardNo}', { path: { matchId, boardNo }, body: { userIds: picked.value } }), '정하지 못했어요')) lineupBoard.value = 0
}

// 판이 끝나면 점수가 바뀐다 (선수에게 오는 변경 신호, 화면에 돌아올 때)
let off: (() => void) | undefined
onMounted(async () => {
  await load()
  off = refreshOnChange(load)
  // 대회 판의 "우리 선수 정하기"로 왔으면 우리 선수가 아직 없는 첫 판의 시트를 바로 연다
  // (목적 판정 7: 선수를 정하러 눌렀는데 여기서 같은 버튼을 다시 찾아 눌러야 했다)
  if (route.query.lineup && m.value?.status === 'ACCEPTED' && m.value.mySide) {
    // 주소의 lineup만 지운다. router.replace로 지우면 화면 key(App.vue)가 바뀌어 통째로 새로 그려지고 시트가 열리지 않았다 (경로 7 리뷰 K1)
    const url = router.resolve({ query: {} }).fullPath
    window.history.replaceState({ ...window.history.state, current: url }, '', url)
    const mine = (b: Schemas['ClubMatchView']['boardList'][number]) => (m.value!.mySide === 'HOME' ? b.home : b.away)
    const first = m.value.boardList.find((b) => !b.gameId && !mine(b).length) ?? m.value.boardList.find((b) => !b.gameId)
    if (first) openLineup(first.boardNo)
  }
})
onBeforeUnmount(() => off?.())
</script>
