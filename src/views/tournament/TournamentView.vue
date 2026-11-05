<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar :title="v?.summary.title || '대회'" back="/tournaments" />
    <main class="max-w-xl mx-auto px-4 pt-4 pb-16">
      <UiSkeleton v-if="!v && !error" class="h-40 w-full" />
      <UiEmptyState v-else-if="error" class="pt-16" icon="fas fa-triangle-exclamation" :title="error" />
      <template v-else-if="v">
        <!-- 일곱 가지를 한 줄에 잇지 않고 '무엇'과 '언제·누가' 두 줄로 (11/5 밤샘 C) -->
        <p class="t-caption">{{ infoLine[0] }}</p>
        <p class="t-caption">{{ infoLine[1] }}</p>
        <p v-if="v.description" class="t-body mt-2 break-words">{{ v.description }}</p>

        <!-- 끝난 대회: 우승·준우승 -->
        <UiCard v-if="v.summary.status === 'COMPLETED'" class="mt-4 text-center">
          <UiIcon name="trophy" class="text-2xl text-signal-fg" aria-hidden="true" />
          <p class="t-title mt-1"><span class="hl">{{ v.summary.winnerName }}</span> 우승</p>
          <p v-if="v.runnerUpName" class="t-caption mt-1">준우승 {{ v.runnerUpName }}</p>
        </UiCard>

        <!-- 시작한 뒤: 신청했지만 체크인하지 않아 대진에 없는 사람에게 그 사실을 (예전엔 아무 말 없이 참가 목록에만 남았다) -->
        <UiCard v-if="leftOut" class="mt-4">
          <p class="t-heading">이번 대진에 들어가지 못했어요</p>
          <p class="t-caption mt-1">시작 때 체크인한 참가자로만 대진이 나와요. 다음 대회에서는 시작 하루 전부터 체크인해 주세요</p>
        </UiCard>

        <!-- 내가 할 일 -->
        <template v-if="v.summary.status === 'RECRUITING'">
          <UiCard v-if="v.my" class="mt-4">
            <p class="t-heading">{{ MY[v.my.status] }}</p>
            <p class="t-caption mt-1">{{ myHint }}</p>
            <div class="flex gap-2 mt-3">
              <UiButton v-if="v.canCheckIn && v.my.status !== 'CHECKED_IN'" class="flex-1" variant="signal" :loading="busy" @click="checkIn">체크인</UiButton>
              <UiButton v-if="v.my.status !== 'REJECTED'" size="sm" variant="ghost" :loading="busy" @click="withdraw">신청 취소</UiButton>
            </div>
          </UiCard>
          <template v-else>
            <div v-if="v.summary.entrantType === 'CLUB'" class="mt-4">
              <p v-if="!v.myStaffClubs.length" class="t-caption">동호회 회장·운영진이 신청해요</p>
              <div v-else class="flex gap-2 flex-wrap">
                <UiButton v-for="c in v.myStaffClubs" :key="c.clubId" :loading="busy" @click="apply(c.clubId)">{{ withRo(c.name) }} 신청</UiButton>
              </div>
            </div>
            <UiButton v-else block size="lg" class="mt-4" :loading="busy" :disabled="full" @click="apply()">{{ full ? '자리가 다 찼어요' : '신청' }}</UiButton>
          </template>
        </template>

        <!-- 주최자 -->
        <UiCard v-if="v.isHost && v.summary.status === 'RECRUITING'" class="mt-4 space-y-2">
          <p class="t-heading">주최자</p>
          <p class="t-caption">시작 시각에 체크인한 참가자로 대진이 저절로 나와요. 다 모였으면 지금 시작해도 돼요</p>
          <div class="flex gap-2">
            <!-- 한 화면의 채운 버튼은 '신청하기' 하나. 둘이 안 모였으면 시작할 수 없다 -->
            <UiButton class="flex-1" variant="secondary" :loading="busy" :disabled="checkedInCount < 2" @click="start">지금 시작</UiButton>
            <UiButton class="flex-1" variant="secondary" :loading="busy" @click="cancelTournament">대회 취소</UiButton>
          </div>
        </UiCard>

        <!-- 리그 순위 -->
        <UiSection v-if="v.standings.length" title="순위" class="mt-8">
          <UiCard class="!p-0 overflow-x-auto">
            <table class="w-full text-sm tabular-nums">
              <thead>
                <tr class="t-micro text-left">
                  <th class="font-normal py-2.5 pl-4 w-8">#</th>
                  <th class="font-normal py-2.5">이름</th>
                  <th class="font-normal py-2.5 px-2 text-right">승</th>
                  <th class="font-normal py-2.5 px-2 text-right">무</th>
                  <th class="font-normal py-2.5 px-2 text-right">패</th>
                  <th class="font-normal py-2.5 px-2 pr-4 text-right">승점</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r, i) in v.standings" :key="r.entryId" class="border-t border-line" :class="i === 0 ? 'font-semibold' : ''">
                  <td class="py-2.5 pl-4">{{ i + 1 }}</td>
                  <td class="py-2.5 max-w-[9rem] truncate">{{ r.name }}</td>
                  <td class="py-2.5 px-2 text-right">{{ r.wins }}</td>
                  <td class="py-2.5 px-2 text-right">{{ r.draws }}</td>
                  <td class="py-2.5 px-2 text-right">{{ r.losses }}</td>
                  <td class="py-2.5 px-2 pr-4 text-right">{{ r.points }}</td>
                </tr>
              </tbody>
            </table>
          </UiCard>
          <p class="t-micro mt-2">승 3점 · 무 1점. 동률이면 승자승 → 득실 → 시드</p>
        </UiSection>

        <!-- 라운드마다 판 -->
        <UiSection v-if="v.rounds.length" :title="v.summary.format === 'LEAGUE' ? '경기 일정' : '대진표'" class="mt-8">
          <div class="space-y-6">
            <div v-for="r in v.rounds" :key="r.round">
              <p class="t-heading">{{ r.name }} <span class="t-micro ml-1">{{ day(r.opensAt) }} ~ {{ day(r.closesAt) }}</span></p>
              <div class="space-y-2 mt-2">
                <UiCard v-for="f in r.fixtures" :key="f.id" class="space-y-2" :class="f.mine ? 'ring-1 ring-line-strong' : ''">
                  <div class="flex items-center gap-2">
                    <span class="flex-1 min-w-0 truncate" :class="sideClass(f, f.home)"><span :class="won(f, f.home) ? 'hl' : ''">{{ f.home?.name || '앞 판 승자' }}</span></span>
                    <span class="t-mono tabular-nums text-fg-subtle">{{ f.status === 'DONE' ? `${f.homeScore}:${f.awayScore}` : 'vs' }}</span>
                    <span class="flex-1 min-w-0 truncate text-right" :class="sideClass(f, f.away)"><span :class="won(f, f.away) ? 'hl' : ''">{{ f.away?.name || (f.status === 'DONE' ? '부전승' : '앞 판 승자') }}</span></span>
                  </div>
                  <p v-if="f.result && f.result !== 'WIN'" class="t-micro text-center">{{ RESULT[f.result] }}</p>
                  <!-- 앱 게임 판: 기간 안에 각자 '경기하기' -->
                  <div v-if="v.summary.appGameKey && f.mine && f.status === 'OPEN' && !f.needsHost" class="flex">
                    <UiButton size="sm" variant="signal" class="flex-1" :loading="busy" @click="playFixture(f)">경기하기</UiButton>
                  </div>
                  <div v-else-if="f.gameId || f.clubMatchId" class="flex">
                    <UiButton size="sm" variant="secondary" class="flex-1" @click="goFixture(f)">{{ f.mine && f.status === 'OPEN' ? (f.clubMatchId ? '우리 선수 정하기' : '내 경기 · 시간·장소 잡기') : f.status === 'DONE' ? '결과 보기' : '경기 보기' }}</UiButton>
                  </div>
                  <!-- 주최자: 마감이 지난 판 -->
                  <div v-if="v.isHost && f.needsHost" class="space-y-1">
                    <p class="t-caption">마감이 지났는데 결과가 없어요. 정해 주세요</p>
                    <div class="flex gap-2">
                      <UiButton size="sm" class="flex-1" variant="secondary" @click="decide(f.id, 'HOME')">{{ f.home?.name }} 승</UiButton>
                      <UiButton size="sm" class="flex-1" variant="secondary" @click="decide(f.id, 'AWAY')">{{ f.away?.name }} 승</UiButton>
                      <UiButton v-if="v.summary.format === 'LEAGUE'" size="sm" variant="secondary" @click="decide(f.id, 'NONE')">둘 다 패</UiButton>
                    </div>
                  </div>
                </UiCard>
              </div>
            </div>
          </div>
        </UiSection>

        <!-- 참가자 -->
        <UiSection :title="started ? `참가 ${shownEntries.length}` : `참가 ${acceptedCount}/${v.summary.maxEntrants}`" class="mt-8">
          <UiList v-if="shownEntries.length">
            <UiListItem v-for="e in shownEntries" :key="e.id" :title="(e.seed ? `${e.seed}. ` : '') + e.name" :subtitle="entrySub(e)" :to="e.userId ? `/profile/${e.userId}` : e.clubId ? `/clubs/${e.clubId}` : undefined">
              <template v-if="v.isHost && e.status === 'APPLIED'" #trailing>
                <span class="flex gap-1">
                  <UiButton size="sm" @click.prevent.stop="decideEntry(e.id, true)">수락</UiButton>
                  <UiButton size="sm" variant="secondary" @click.prevent.stop="decideEntry(e.id, false)">거절</UiButton>
                </span>
              </template>
            </UiListItem>
          </UiList>
          <p v-else class="t-caption">아직 신청한 사람이 없어요</p>
        </UiSection>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
// 대회 한 곳 (/tournaments/:id): 신청·체크인 → (시작) 대진표·일정·순위 → 우승. 판 하나는 보통 경기, 교류전 또는 앱 대결
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { GET, POST } from '@/api/client'
import type { components } from '@/api/schema'
import { confirmDialog } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import { refreshOnChange } from '@/websocket/userChannel'
import { matchTime, withRo } from '@/utils/format'
import { UiButton, UiCard, UiEmptyState, UiIcon, UiList, UiListItem, UiSection, UiSkeleton, UiTopBar } from '../../components/ui'

type Schemas = components['schemas']
type Fixture = Schemas['TournamentFixtureView']
const STATUS: Record<string, string> = { RECRUITING: '모집 중', RUNNING: '진행 중', COMPLETED: '끝남', CANCELED: '취소됨' }
const MY: Record<string, string> = { APPLIED: '신청했어요 · 주최자가 받으면 참가', ACCEPTED: '참가가 정해졌어요', CHECKED_IN: '체크인했어요', REJECTED: '신청이 거절됐어요' }
const RESULT: Record<string, string> = { BYE: '부전승', FORFEIT: '기권승 (마감)', DRAW: '무승부', BOTH_LOST: '둘 다 패 (마감)' }
const route = useRoute()
const router = useRouter()
const { showToast } = useToast()
const id = Number(route.params.id)
const v = ref<Schemas['TournamentView'] | null>(null)
const error = ref('')
const busy = ref(false)

const day = (iso: string) => {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}`
}
const acceptedCount = computed(() => v.value?.summary.entryCount ?? 0)
// 시작한 뒤에는 대진에 든 참가자(시드가 있는 사람)만. 체크인하지 않은 신청자는 대진에 없다
const started = computed(() => !!v.value && v.value.summary.status !== 'RECRUITING' && v.value.summary.status !== 'CANCELED')
const shownEntries = computed(() => (v.value?.entries ?? []).filter((e) => !started.value || e.seed != null))
const leftOut = computed(() => {
  const my = v.value?.my
  if (!started.value || !my || my.status === 'REJECTED' || my.status === 'WITHDRAWN') return false
  return v.value?.entries.find((e) => e.id === my.entryId)?.seed == null
})
// '지금 시작'은 체크인한 사람으로만 대진을 짠다. 신청만 받은 수로 켜면 눌러도 시작할 수 없다 (서버가 막는다)
const checkedInCount = computed(() => v.value?.entries.filter((e) => e.status === 'CHECKED_IN').length ?? 0)
const full = computed(() => !!v.value && v.value.summary.entryCount >= v.value.summary.maxEntrants)
const infoLine = computed(() => {
  const x = v.value
  if (!x) return ['', '']
  const what = [x.summary.ruleTitle, x.summary.format === 'LEAGUE' ? '리그' : x.thirdPlace ? '토너먼트 · 3·4위전' : '토너먼트',
    x.summary.entrantType === 'CLUB' ? `동호회 대항 · ${x.boards}판 ${x.perBoard === 2 ? '2:2' : '1:1'}` : '',
    x.summary.appGameKey ? '앱 게임' : '', x.membersOnly ? '멤버만' : '',
    x.minRating || x.maxRating ? `실력 점수 ${x.minRating ?? ''}~${x.maxRating ?? ''}` : '']
  const when = [STATUS[x.summary.status], `${matchTime(x.summary.startsAt)} 시작`, `라운드마다 ${x.summary.roundDays}일`, `주최 ${x.summary.hostName}`]
  return [what.filter(Boolean).join(' · '), when.filter(Boolean).join(' · ')]
})
const myHint = computed(() => {
  const x = v.value
  if (!x?.my) return ''
  if (x.my.status === 'CHECKED_IN') return '시작 때 대진이 나오면 알려 드려요'
  if (x.canCheckIn) return '지금 체크인해야 대진에 들어가요'
  return '시작 24시간 전부터 체크인할 수 있어요. 체크인해야 대진에 들어가요'
})
const entrySub = (e: Schemas['TournamentEntryView']) =>
  [`실력 점수 ${e.rating}`, e.status === 'APPLIED' ? '신청' : e.status === 'CHECKED_IN' ? '체크인' : ''].filter(Boolean).join(' · ')
const won = (f: Fixture, side?: Schemas['TournamentSide']) => !!side && f.winnerEntryId === side.entryId
const sideClass = (f: Fixture, side?: Schemas['TournamentSide']) =>
  f.status !== 'DONE' ? 'text-fg' : won(f, side) ? 'text-fg font-semibold' : 'text-fg-muted'
const message = (e: unknown, fallback: string) => (e as { response?: { data?: { message?: string } } }).response?.data?.message || fallback

async function load() {
  try {
    v.value = (await GET('/api/tournaments/{id}', { path: { id } })).data
  } catch {
    error.value = '대회를 찾지 못했어요'
  }
}
async function act(task: () => Promise<{ data: Schemas['TournamentView'] }>, fallback: string, done?: string) {
  busy.value = true
  try {
    v.value = (await task()).data
    if (done) showToast(done)
  } catch (e) {
    showToast(message(e, fallback))
  } finally {
    busy.value = false
  }
}
const apply = (clubId?: number) => act(() => POST('/api/tournaments/{id}/apply', { path: { id }, query: { clubId } }), '신청하지 못했어요', '신청했어요')
const checkIn = () => act(() => POST('/api/tournaments/{id}/check-in', { path: { id }, query: { clubId: v.value?.my?.clubId ?? undefined } }), '체크인하지 못했어요', '체크인했어요')
const withdraw = () => act(() => POST('/api/tournaments/{id}/withdraw', { path: { id }, query: { clubId: v.value?.my?.clubId ?? undefined } }), '거두지 못했어요')
const decideEntry = (entryId: number, accept: boolean) => act(() => POST('/api/tournaments/entries/{entryId}/decide', { path: { entryId }, query: { accept } }), '처리하지 못했어요')
async function start() {
  if (!(await confirmDialog({ title: '지금 시작할까요?', message: '체크인한 참가자로 대진이 나와요. 체크인 안 한 사람은 빠져요', confirmText: '시작' }))) return
  await act(() => POST('/api/tournaments/{id}/start', { path: { id } }), '시작하지 못했어요')
}
async function cancelTournament() {
  if (!(await confirmDialog({ title: '대회를 취소할까요?', message: '참가자에게 알려요', confirmText: '취소하기', danger: true }))) return
  busy.value = true
  try {
    await POST('/api/tournaments/{id}/cancel', { path: { id } })
    await load()
  } catch (e) {
    showToast(message(e, '취소하지 못했어요'))
  } finally {
    busy.value = false
  }
}
async function decide(fixtureId: number, winner: 'HOME' | 'AWAY' | 'NONE') {
  if (!(await confirmDialog({ title: '이 판을 정할까요?', message: winner === 'NONE' ? '두 쪽 모두 진 판으로 세요' : '고른 쪽이 기권승으로 올라가요', confirmText: '정하기' }))) return
  await act(() => POST('/api/tournaments/fixtures/{fixtureId}/decide', { path: { fixtureId }, query: { winner } }), '정하지 못했어요')
}
function goFixture(f: Fixture) {
  const key = v.value?.summary.appGameKey
  if (f.clubMatchId) router.push(`/clubs/matches/${f.clubMatchId}`)
  else if (key && f.gameId) router.push(`/play/${key}?duel=${f.gameId}`)
  else if (f.gameId) router.push(f.status === 'DONE' ? `/games/${f.gameId}/result` : `/games/${f.gameId}`)
}
// 앱 게임 판: 먼저 누른 사람이 대결(실시간이면 방)을 열고, 상대는 같은 대결에 들어간다. 실시간 화면은 내 진행 중 대결을 이어서 연다
async function playFixture(f: Fixture) {
  busy.value = true
  try {
    const p = (await POST('/api/tournaments/fixtures/{fixtureId}/play', { path: { fixtureId: f.id } })).data
    if (p.mode === 'LIVE') router.push(`/play/${p.key}/live`)
    else if (p.mode === 'BATTLE') router.push(`/play/${p.key}/battle`)
    else router.push(p.played ? `/play/${p.key}?duel=${p.gameId}` : `/play/${p.key}?resume=1`)
  } catch (e) {
    showToast(message(e, '들어가지 못했어요'))
  } finally {
    busy.value = false
  }
}

// 판이 끝나면 대진이 나아간다 (선수에게 오는 변경 신호, 화면에 돌아올 때)
let off: (() => void) | undefined
onMounted(() => {
  load()
  off = refreshOnChange(load)
})
onBeforeUnmount(() => off?.())
</script>
