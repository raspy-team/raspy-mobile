<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar :title="detail?.club.name || '동호회'" back="/clubs">
      <template v-if="isStaff" #right>
        <UiIconButton icon="pen" label="동호회 꾸미기" @click="openSettings" />
      </template>
    </UiTopBar>
    <main class="max-w-xl mx-auto px-4 pt-4 pb-16">
      <UiSkeleton v-if="!detail && !error" class="h-40 w-full" />
      <UiEmptyState v-else-if="error" class="pt-16" icon="fas fa-triangle-exclamation" :title="error" />
      <template v-else-if="detail">
        <!-- 동호회의 얼굴: 동네 · 대표 종목 · 멤버 · 이번 달 · 교류전 전적 -->
        <p class="t-caption">{{ faceLine }}</p>
        <p v-if="detail.club.intro" class="t-body mt-2">{{ detail.club.intro }}</p>

        <UiCard v-if="detail.notice" class="mt-4 flex gap-2">
          <UiIcon name="flag" class="text-fg-muted mt-0.5 flex-shrink-0" aria-hidden="true" />
          <p class="t-body break-words">{{ detail.notice }}</p>
        </UiCard>

        <!-- 막 만든 동호회: 단톡방에 링크부터 -->
        <UiCard v-if="justMade" class="mt-4">
          <p class="t-heading">동호회를 만들었어요</p>
          <p class="t-caption mt-1">초대 링크를 단톡방에 올리면 누르기만 해도 들어와요</p>
          <!-- 정하는 곳이 위의 연필 아이콘뿐이라 안내만 보고는 못 찾았다 (11/4 밤샘, 동호회 총무) -->
          <div class="flex gap-2 mt-3">
            <UiButton size="sm" icon="share" @click="share">초대 링크 보내기</UiButton>
            <UiButton v-if="isStaff && !detail.club.mainRuleTitle" size="sm" variant="secondary" @click="openSettings">대표 종목 정하기</UiButton>
          </div>
        </UiCard>

        <template v-if="isMember">
          <UiButton block size="lg" class="mt-5" icon="plus" @click="openGame">동호회 경기 열기</UiButton>
          <!-- 막 만든 카드에 '초대 링크 보내기'가 있으면 여기 것은 숨긴다 (같은 버튼이 두 번이었다, UX 리뷰 ⑦) -->
          <div v-if="detail.chatLink || !justMade" class="flex gap-2 mt-2">
            <UiButton v-if="detail.chatLink" class="flex-1" variant="secondary" icon="comment" @click="openChat">단톡방</UiButton>
            <UiButton v-if="!justMade" class="flex-1" variant="secondary" icon="share" @click="share">초대 링크</UiButton>
          </div>
        </template>
        <template v-else>
          <UiCard v-if="detail.requested" class="mt-5">
            <p class="t-heading">가입을 신청했어요</p>
            <p class="t-caption mt-1">운영진이 받으면 알려 드려요</p>
            <UiButton size="sm" variant="ghost" class="mt-2 -ml-3" @click="cancelRequest">신청 거두기</UiButton>
          </UiCard>
          <template v-else-if="detail.club.joinMode === 'APPROVAL'">
            <p class="t-caption mt-5">운영진이 받으면 들어와요{{ detail.joinQuestion ? '. 아래 질문에 답해 주세요' : '' }}</p>
            <p v-if="detail.joinQuestion" class="t-heading mt-3">{{ detail.joinQuestion }}</p>
            <UiInput v-if="detail.joinQuestion" v-model="answer" class="mt-2" :maxlength="200" placeholder="답" />
            <UiButton block size="lg" class="mt-3" :loading="joining" :disabled="!!detail.joinQuestion && !answer.trim()" @click="join">가입 신청</UiButton>
          </template>
          <UiButton v-else block size="lg" class="mt-5" :loading="joining" @click="join">들어가기</UiButton>
        </template>

        <!-- 가입 신청 (회장·운영진) -->
        <UiSection v-if="detail.pendingRequests.length" :title="`가입 신청 ${detail.pendingRequests.length}`" class="mt-8">
          <div class="space-y-2">
            <UiCard v-for="r in detail.pendingRequests" :key="r.userId" class="space-y-2">
              <div class="flex items-center gap-3">
                <UiAvatar :src="r.profilePicture || undefined" :name="r.nickname" :user-id="r.userId" size="sm" />
                <RouterLink :to="`/profile/${r.userId}`" class="t-heading flex-1 truncate">{{ r.nickname }}</RouterLink>
              </div>
              <p v-if="r.answer" class="t-body break-words">“{{ r.answer }}”</p>
              <div class="flex gap-2">
                <UiButton size="sm" class="flex-1" :disabled="busy" @click="decide(r.userId, true)">받기</UiButton>
                <UiButton size="sm" variant="secondary" class="flex-1" :disabled="busy" @click="decide(r.userId, false)">거절</UiButton>
              </div>
            </UiCard>
          </div>
        </UiSection>

        <!-- 일정: 정모·번개 (멤버에게만) -->
        <UiSection v-if="isMember" title="일정" class="mt-8">
          <template v-if="isStaff" #action><UiButton variant="ghost" size="sm" icon="plus" @click="eventOpen = true">일정 잡기</UiButton></template>
          <div v-if="detail.events.length" class="space-y-2">
            <UiCard v-for="e in detail.events" :key="e.id" class="space-y-2">
              <div>
                <p class="t-heading">{{ e.title }}</p>
                <p class="t-caption mt-0.5">{{ [when(e.startsAt), e.place].filter(Boolean).join(' · ') }}</p>
                <p v-if="e.note" class="t-caption mt-0.5 break-words">{{ e.note }}</p>
              </div>
              <div class="flex items-center gap-2">
                <span class="flex -space-x-2">
                  <UiAvatar v-for="g in e.going.slice(0, 6)" :key="g.userId" :src="g.profilePicture || undefined" :name="g.nickname" :user-id="g.userId" size="sm" class="ring-2 ring-canvas" />
                </span>
                <span class="t-caption tabular-nums">갈게요 {{ e.going.length }}{{ e.capacity ? ` / ${e.capacity}` : '' }}{{ e.notGoingCount ? ` · 못 가요 ${e.notGoingCount}` : '' }}</span>
              </div>
              <div class="flex gap-2">
                <UiButton size="sm" class="flex-1" :variant="e.myAnswer === true ? 'primary' : 'secondary'" :disabled="e.full && e.myAnswer !== true" @click="answerEvent(e.id, true)">{{ e.full && e.myAnswer !== true ? '정원이 찼어요' : '갈게요' }}</UiButton>
                <UiButton size="sm" class="flex-1" :variant="e.myAnswer === false ? 'primary' : 'secondary'" @click="answerEvent(e.id, false)">못 가요</UiButton>
                <UiIconButton v-if="isStaff" icon="xmark" label="일정 취소" @click="cancelEvent(e.id)" />
              </div>
            </UiCard>
          </div>
          <p v-else class="t-caption">다가오는 일정이 없어요</p>
        </UiSection>

        <!-- 교류전: 동호회 대 동호회 -->
        <UiSection title="교류전" class="mt-8">
          <template v-if="isStaff" #action><UiButton variant="ghost" size="sm" icon="swords" @click="openPropose">교류전 신청</UiButton></template>
          <div v-if="detail.matches.length" class="space-y-2">
            <UiCard v-for="m in detail.matches" :key="m.id" class="py-3 cursor-pointer active:bg-surface-2" role="button" @click="router.push(`/clubs/matches/${m.id}`)">
              <div class="flex items-center gap-2">
                <span class="t-heading truncate flex-1">{{ m.home.name }} <span class="text-fg-subtle">vs</span> {{ m.away.name }}</span>
                <span class="t-mono tabular-nums">{{ m.home.score }}:{{ m.away.score }}</span>
              </div>
              <p class="t-caption mt-0.5">{{ [m.ruleTitle, `${m.boards}판 ${m.perBoard === 2 ? '2:2' : '1:1'}`, MATCH_STATUS[m.status], m.matchDate ? when(m.matchDate) : ''].filter(Boolean).join(' · ') }}</p>
            </UiCard>
          </div>
          <p v-else class="t-caption">아직 교류전이 없어요</p>
        </UiSection>

        <!-- 대회: 이 동호회가 연 대회 (월례대회 등) -->
        <UiSection title="대회" class="mt-8">
          <template v-if="isStaff" #action><UiButton variant="ghost" size="sm" icon="trophy" @click="router.push(`/tournaments?create=1&clubId=${id}`)">대회 열기</UiButton></template>
          <div v-if="tournaments.length" class="space-y-2">
            <TournamentRow v-for="t in tournaments" :key="t.id" :t="t" @click="router.push(`/tournaments/${t.id}`)" />
          </div>
          <p v-else class="t-caption">아직 연 대회가 없어요</p>
        </UiSection>

        <!-- 우리끼리 순위: 대표 종목 실력 점수 -->
        <UiSection v-if="detail.club.mainRuleTitle" :title="`우리끼리 순위 · ${detail.club.mainRuleTitle}`" class="mt-8">
          <UiList v-if="detail.ranking.length">
            <UiListItem v-for="(r, i) in detail.ranking" :key="r.userId" :title="r.nickname" :to="`/profile/${r.userId}`">
              <template #leading><span class="t-mono w-6 text-center" :class="i === 0 ? 'text-fg font-bold' : 'text-fg-subtle'">{{ i + 1 }}</span></template>
              <template #trailing><span class="t-mono tabular-nums">{{ r.rating }}</span></template>
            </UiListItem>
          </UiList>
          <p v-else class="t-caption">{{ detail.club.mainRuleTitle }} 경기를 하면 우리끼리 순위가 생겨요</p>
        </UiSection>

        <UiSection title="친선전" class="mt-8">
          <div v-if="detail.games.length" class="space-y-2">
            <UiCard v-for="g in detail.games" :key="g.gameId" class="py-3 cursor-pointer active:bg-surface-2" role="button" @click="router.push(`/games/${g.gameId}`)">
              <p class="t-heading">{{ g.title }}</p>
              <p class="t-caption mt-0.5">{{ g.hostNickname }}님이 열었어요 · {{ STATUS[g.status] || g.status }}</p>
            </UiCard>
          </div>
          <p v-else class="t-caption">아직 동호회 경기가 없어요</p>
        </UiSection>

        <UiSection :title="`멤버 ${detail.members.length}`" class="mt-8">
          <UiList>
            <UiListItem
              v-for="m in detail.members"
              :key="m.userId"
              :title="m.nickname"
              :subtitle="ROLE[m.role]"
              :to="canManage(m) ? undefined : `/profile/${m.userId}`"
              :chevron="canManage(m)"
              @click="canManage(m) && (memberMenu = m)"
            >
              <template #leading><UiAvatar :src="m.profilePicture || undefined" :name="m.nickname" :user-id="m.userId" size="sm" /></template>
            </UiListItem>
          </UiList>
        </UiSection>

        <UiButton v-if="isMember" block variant="ghost" class="mt-8 text-danger" @click="leave">동호회 나가기</UiButton>
      </template>
    </main>

    <!-- 멤버 관리 (회장·운영진) -->
    <UiSheet :model-value="!!memberMenu" :title="memberMenu?.nickname" @update:model-value="memberMenu = null">
      <UiList v-if="memberMenu">
        <UiListItem icon="user" title="프로필 보기" chevron @click="router.push(`/profile/${memberMenu.userId}`)" />
        <template v-if="detail?.myRole === 'OWNER'">
          <UiListItem v-if="memberMenu.role === 'MEMBER'" icon="user-check" title="운영진 맡기기" subtitle="일정·공지·가입 승인·교류전을 함께 맡아요" @click="setRole(memberMenu.userId, 'STAFF')" />
          <UiListItem v-else icon="user-minus" title="운영진 풀기" @click="setRole(memberMenu.userId, 'MEMBER')" />
          <UiListItem icon="crown" title="회장 넘기기" subtitle="나는 운영진이 돼요" @click="setRole(memberMenu.userId, 'OWNER')" />
        </template>
        <UiListItem icon="user-slash" title="내보내기" danger @click="removeMember(memberMenu.userId)" />
      </UiList>
    </UiSheet>

    <!-- 일정 잡기 -->
    <UiSheet v-model="eventOpen" title="일정 잡기">
      <div class="space-y-3">
        <UiInput v-model="ev.title" :maxlength="40" placeholder="제목 (예: 토요일 아침 정모)" />
        <UiInput v-model="ev.startsAt" type="datetime-local" />
        <UiInput v-model="ev.place" :maxlength="100" placeholder="장소 (선택)" />
        <UiInput v-model="ev.capacity" type="number" inputmode="numeric" placeholder="정원 (선택)" />
        <UiInput v-model="ev.note" :maxlength="200" placeholder="한 줄 안내 (선택)" />
        <UiButton block :loading="busy" :disabled="ev.title.trim().length < 2 || !ev.startsAt" @click="createEvent">잡고 알리기</UiButton>
      </div>
    </UiSheet>

    <!-- 교류전 신청 -->
    <UiSheet v-model="proposeOpen" title="교류전 신청">
      <div class="space-y-3">
        <p v-if="!detail?.club.mainRuleTitle" class="t-caption">먼저 동호회 꾸미기에서 대표 종목을 정해 주세요. 교류전은 대표 종목으로 해요</p>
        <template v-else>
          <p class="t-caption">종목: <b class="text-fg">{{ detail.club.mainRuleTitle }}</b></p>
          <UiInput v-model="opQuery" placeholder="상대 동호회 이름" @update:model-value="searchClubs" />
          <UiList v-if="!opponent && opResults.length">
            <UiListItem v-for="c in opResults" :key="c.id" :title="c.name" :subtitle="[c.dongName, c.mainRuleTitle, `${c.memberCount}명`].filter(Boolean).join(' · ')" @click="opponent = c" />
          </UiList>
          <UiCard v-if="opponent" class="flex items-center gap-2 py-3">
            <span class="t-heading flex-1 truncate">{{ opponent.name }}</span>
            <UiButton size="sm" variant="ghost" @click="opponent = null">바꾸기</UiButton>
          </UiCard>
          <div class="flex flex-wrap gap-2">
            <UiChip v-for="n in [1, 3, 5, 7]" :key="n" :selected="pr.boards === n" @click="pr.boards = n">{{ n }}판</UiChip>
          </div>
          <div class="flex flex-wrap gap-2">
            <UiChip :selected="pr.perBoard === 1" @click="pr.perBoard = 1">1:1</UiChip>
            <UiChip :selected="pr.perBoard === 2" @click="pr.perBoard = 2">2:2</UiChip>
          </div>
          <UiInput v-model="pr.matchDate" type="datetime-local" />
          <UiInput v-model="pr.placeRoad" :maxlength="100" placeholder="장소 (선택)" />
          <UiInput v-model="pr.message" :maxlength="200" placeholder="하고 싶은 말 (선택)" />
          <UiButton block :loading="busy" :disabled="!opponent" @click="propose">신청하기</UiButton>
          <p class="t-caption">상대 운영진이 받으면, 양쪽이 판마다 선수를 정해요. 이긴 판이 많은 동호회가 이겨요</p>
        </template>
      </div>
    </UiSheet>

    <!-- 동호회 꾸미기 (회장·운영진) -->
    <UiSheet v-model="settingsOpen" title="동호회 꾸미기">
      <div class="space-y-3">
        <UiInput v-model="st.intro" :maxlength="100" placeholder="한 줄 소개" />
        <UiInput v-model="st.notice" :maxlength="200" placeholder="공지 한 줄 (예: 이번 주 정모는 토요일 7시)" />
        <UiInput v-model="st.chatLink" :maxlength="300" placeholder="단톡방 링크 (https://open.kakao.com/...)" />
        <div>
          <p class="t-heading">대표 종목</p>
          <p class="t-caption mt-0.5">{{ st.mainRuleTitle ? `지금: ${st.mainRuleTitle}` : '우리끼리 순위와 교류전의 기준이에요' }}</p>
          <ClubRulePicker class="mt-2" @pick="(r) => { st.mainRuleId = r.id; st.mainRuleTitle = r.title }" />
        </div>
        <div>
          <p class="t-heading">가입 방식</p>
          <div class="flex flex-wrap gap-2 mt-2">
            <UiChip :selected="st.joinMode === 'OPEN'" @click="st.joinMode = 'OPEN'">바로 들어오기</UiChip>
            <UiChip :selected="st.joinMode === 'APPROVAL'" @click="st.joinMode = 'APPROVAL'">운영진 승인</UiChip>
          </div>
          <UiInput v-if="st.joinMode === 'APPROVAL'" v-model="st.joinQuestion" class="mt-2" :maxlength="100" placeholder="가입 질문 (예: 구력이 어떻게 되세요?)" />
          <p class="t-caption mt-1">초대 링크로 온 사람은 언제나 바로 들어와요</p>
        </div>
        <UiButton block :loading="busy" @click="saveSettings">저장</UiButton>
      </div>
    </UiSheet>
  </div>
</template>

<script setup lang="ts">
// 동호회 한 곳 (/clubs/:id): 같이 붙고, 같이 기록이 쌓이는 팀 (docs/clubs.md).
// 공지·단톡방 → 가입 신청(운영진) → 일정·참석 → 교류전 → 우리끼리 순위 → 친선전 → 멤버(운영진 관리)
import { ref, computed, reactive, onMounted } from 'vue'
import { matchTime } from '@/utils/format'
import { useRoute, useRouter } from 'vue-router'
import { GET, POST, PUT } from '@/api/client'
import type { components } from '@/api/schema'
import { shareLink } from '@/utils/share'
import { confirmDialog } from '@/composables/useConfirm'
import { useToast } from '@/composable/useToast'
import ClubRulePicker from '../../components/club/ClubRulePicker.vue'
import TournamentRow from '../../components/tournament/TournamentRow.vue'
import {
  UiAvatar, UiButton, UiCard, UiChip, UiEmptyState, UiIcon, UiIconButton, UiInput, UiList, UiListItem, UiSection, UiSheet, UiSkeleton, UiTopBar,
} from '../../components/ui'

type Schemas = components['schemas']
type Member = Schemas['ClubMember']
const STATUS: Record<string, string> = { MATCHING: '모집 중', SCHEDULED: '시작 예정', IN_PROGRESS: '하는 중', RESULT_PENDING: '결과 확인 중', COMPLETED: '끝남', CANCELED: '취소' }
const MATCH_STATUS: Record<string, string> = { PROPOSED: '신청 중', ACCEPTED: '잡힘', COMPLETED: '끝남', CANCELED: '취소' }
const ROLE: Record<string, string | undefined> = { OWNER: '회장', STAFF: '운영진', MEMBER: undefined }
const route = useRoute()
const router = useRouter()
const { showToast } = useToast()
const detail = ref<Schemas['ClubDetail'] | null>(null)
const error = ref('')
const joining = ref(false)
const busy = ref(false)
const answer = ref('')
const id = Number(route.params.id)

const isMember = computed(() => !!detail.value?.myRole)
const isStaff = computed(() => detail.value?.myRole === 'OWNER' || detail.value?.myRole === 'STAFF')
const justMade = computed(() => !!route.query.made && !!detail.value?.inviteCode)
const faceLine = computed(() => {
  const d = detail.value
  if (!d) return ''
  const r = d.club.record
  const played = r ? r.wins + r.draws + r.losses : 0
  return [d.club.dongName, d.club.mainRuleTitle, `멤버 ${d.club.memberCount}명`, d.gamesThisMonth ? `이번 달 ${d.gamesThisMonth}판` : '',
    played ? `교류전 ${r!.wins}승 ${r!.draws ? `${r!.draws}무 ` : ''}${r!.losses}패` : ''].filter(Boolean).join(' · ')
})
// 오전·오후까지 (예전엔 '11월 7일 4시 16분'으로 새벽인지 오후인지 몰랐다). 다른 화면과 같은 꼴
const when = (iso: string) => matchTime(iso)
const message = (e: unknown, fallback: string) => (e as { response?: { data?: { message?: string } } }).response?.data?.message || fallback

const tournaments = ref<Schemas['TournamentSummary'][]>([])
async function load() {
  try {
    detail.value = (await GET('/api/clubs/{id}', { path: { id } })).data
    // 대회 목록만 못 불러오면 동호회는 그대로 보여 준다 (전에는 '동호회를 찾지 못했어요'가 떴다)
    tournaments.value = await GET('/api/tournaments', { query: { scope: 'club', clubId: id } }).then((r) => r.data.slice(0, 5), () => [])
  } catch {
    error.value = '동호회를 찾지 못했어요'
  }
}

async function run<T>(task: () => Promise<T>, fallback: string): Promise<T | undefined> {
  // 두 번 눌러도 한 번만 (가입 받기를 두 번 누르면 두 번째가 '가입 신청이 없어요'로 실패해 오류가 떴다)
  if (busy.value) return undefined
  busy.value = true
  try {
    return await task()
  } catch (e) {
    showToast(message(e, fallback))
  } finally {
    busy.value = false
  }
}

async function join() {
  joining.value = true
  try {
    detail.value = (await POST('/api/clubs/join', { body: { clubId: id, answer: answer.value.trim() || undefined } })).data
    if (detail.value.requested) showToast('가입을 신청했어요')
  } catch (e) {
    showToast(message(e, '들어가지 못했어요'))
  } finally {
    joining.value = false
  }
}
async function cancelRequest() {
  if (await run(() => POST('/api/clubs/{id}/leave', { path: { id } }), '취소하지 못했어요')) await load()
}
async function decide(userId: number, accept: boolean) {
  const d = await run(() => POST('/api/clubs/{id}/requests/{userId}', { path: { id, userId }, query: { accept } }), '처리하지 못했어요')
  if (d) detail.value = d.data
}

// 멤버 관리
const memberMenu = ref<Member | null>(null)
const canManage = (m: Member) => isStaff.value && m.role !== 'OWNER' && !(detail.value?.myRole === 'STAFF' && m.role === 'STAFF')
async function setRole(userId: number, role: 'OWNER' | 'STAFF' | 'MEMBER') {
  if (role === 'OWNER' && !(await confirmDialog({ title: '회장을 넘길까요?', message: '넘기면 나는 운영진이 돼요', confirmText: '넘기기' }))) return
  memberMenu.value = null
  const d = await run(() => POST('/api/clubs/{id}/members/{userId}/role', { path: { id, userId }, query: { role } }), '바꾸지 못했어요')
  if (d) detail.value = d.data
}
async function removeMember(userId: number) {
  if (!(await confirmDialog({ title: '내보낼까요?', message: '동호회 알림과 일정이 더는 가지 않아요', confirmText: '내보내기', danger: true }))) return
  memberMenu.value = null
  const d = await run(() => POST('/api/clubs/{id}/members/{userId}/remove', { path: { id, userId } }), '내보내지 못했어요')
  if (d) detail.value = d.data
}

// 일정
const eventOpen = ref(false)
const ev = reactive({ title: '', startsAt: '', place: '', capacity: '', note: '' })
async function createEvent() {
  const made = await run(() => POST('/api/clubs/{id}/events', {
    path: { id },
    body: { title: ev.title.trim(), startsAt: ev.startsAt, place: ev.place.trim() || undefined, capacity: ev.capacity ? Number(ev.capacity) : undefined, note: ev.note.trim() || undefined },
  }), '일정을 잡지 못했어요')
  if (!made) return
  eventOpen.value = false
  Object.assign(ev, { title: '', startsAt: '', place: '', capacity: '', note: '' })
  showToast('일정을 잡고 멤버에게 알렸어요')
  await load()
}
async function answerEvent(eventId: number, going: boolean) {
  const r = await run(() => POST('/api/clubs/events/{eventId}/answer', { path: { eventId }, query: { going } }), '답하지 못했어요')
  if (r && detail.value) detail.value.events = detail.value.events.map((e) => (e.id === eventId ? r.data : e))
}
async function cancelEvent(eventId: number) {
  if (!(await confirmDialog({ title: '일정을 취소할까요?', message: "'갈게요'한 사람에게 알려요", confirmText: '취소하기', danger: true }))) return
  await run(() => POST('/api/clubs/events/{eventId}/cancel', { path: { eventId } }), '취소하지 못했어요')
  await load()
}

// 교류전 신청
const proposeOpen = ref(false)
const opQuery = ref('')
const opResults = ref<Schemas['ClubSummary'][]>([])
const opponent = ref<Schemas['ClubSummary'] | null>(null)
const pr = reactive({ boards: 3, perBoard: 1, matchDate: '', placeRoad: '', message: '' })
let searchTimer: ReturnType<typeof setTimeout> | undefined
function openPropose() {
  proposeOpen.value = true
  // 처음엔 우리 동네 동호회를 후보로
  if (!opResults.value.length) GET('/api/clubs/nearby').then((r) => (opResults.value = r.data)).catch(() => {})
}
let searchSeq = 0
function searchClubs() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(async () => {
    const q = opQuery.value.trim()
    const seq = ++searchSeq
    // 두 글자보다 짧으면 처음처럼 우리 동네 동호회 (예전엔 지난 검색 결과가 그대로 남았다). 늦게 온 앞 검색은 버린다
    const r = await (q.length < 2 ? GET('/api/clubs/nearby') : GET('/api/clubs/search', { query: { q } })).catch(() => null)
    if (seq !== searchSeq) return
    opResults.value = (r?.data ?? []).filter((c) => c.id !== id)
  }, 250)
}
async function propose() {
  if (!opponent.value || !detail.value?.mainRuleId) return
  const r = await run(() => POST('/api/clubs/{id}/matches', {
    path: { id },
    body: {
      awayClubId: opponent.value!.id, ruleId: detail.value!.mainRuleId!, boards: pr.boards, perBoard: pr.perBoard,
      matchDate: pr.matchDate || undefined, placeRoad: pr.placeRoad.trim() || undefined, message: pr.message.trim() || undefined,
    },
  }), '신청하지 못했어요')
  if (!r) return
  proposeOpen.value = false
  showToast(`${opponent.value.name}에 교류전을 신청했어요`)
  router.push(`/clubs/matches/${r.data.id}`)
}

// 꾸미기
const settingsOpen = ref(false)
const st = reactive({ intro: '', notice: '', chatLink: '', joinMode: 'OPEN' as 'OPEN' | 'APPROVAL', joinQuestion: '', mainRuleId: 0, mainRuleTitle: '' })
function openSettings() {
  const d = detail.value!
  Object.assign(st, {
    intro: d.club.intro || '', notice: d.notice || '', chatLink: d.chatLink || '', joinMode: d.club.joinMode === 'APPROVAL' ? 'APPROVAL' : 'OPEN',
    joinQuestion: d.joinQuestion || '', mainRuleId: d.mainRuleId || 0, mainRuleTitle: d.club.mainRuleTitle || '',
  })
  settingsOpen.value = true
}
async function saveSettings() {
  const r = await run(() => PUT('/api/clubs/{id}', {
    path: { id },
    body: { intro: st.intro, notice: st.notice, chatLink: st.chatLink, joinMode: st.joinMode, joinQuestion: st.joinQuestion, mainRuleId: st.mainRuleId || undefined },
  }), '저장하지 못했어요')
  if (!r) return
  detail.value = r.data
  settingsOpen.value = false
  showToast('저장했어요')
}

// 규칙을 고르고 오는 동안 어느 동호회인지 기억해 둔다 (경기 만들기 화면이 꺼내 쓴다)
function openGame() {
  sessionStorage.setItem('match_club_for_game', String(id))
  router.push('/rules?fromGameCreate=true')
}
function openChat() {
  if (detail.value?.chatLink) window.open(detail.value.chatLink, '_blank', 'noopener')
}

async function share() {
  if (!detail.value?.inviteCode) return
  const msg = await shareLink(`${window.location.origin}/club/join/${detail.value.inviteCode}`, `${detail.value.club.name} 매치 동호회에 들어와요. 일정·교류전·우리끼리 순위가 여기 있어요`)
  if (msg) showToast(msg)
}

async function leave() {
  // 회장이 나가면 운영진(없으면 먼저 든 멤버)에게 넘어가고, 혼자면 동호회가 없어진다 (서버 ClubService.leave). 그걸 미리 말한다
  const d = detail.value
  const message = d?.myRole !== 'OWNER'
    ? '동호회 일정·경기 알림이 더는 오지 않아요'
    : (d.club.memberCount ?? 1) <= 1
      ? '혼자 남은 동호회라 나가면 동호회가 없어져요'
      : '회장은 운영진이나 먼저 든 멤버에게 넘어가요. 정해서 넘기려면 멤버 이름을 눌러 회장 넘기기를 해 주세요'
  if (!(await confirmDialog({ title: '동호회를 나갈까요?', message, confirmText: '나가기', danger: true }))) return
  if (await run(() => POST('/api/clubs/{id}/leave', { path: { id } }), '나가지 못했어요. 다시 해 주세요')) router.replace('/clubs')
}

onMounted(load)
</script>
