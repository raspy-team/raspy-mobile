<template>
  <UiCard :pad="false">
    <div class="flex items-start gap-3 p-4 pb-3">
      <RuleThumb :rule="game.rule" :size="36" bare />
      <div class="flex-1 min-w-0">
        <p class="t-heading truncate">{{ game.rule?.ruleTitle }}</p>
        <!-- 때·장소는 두 줄까지 (한 줄로 자르면 '장…'처럼 장소 미정도 안 보였다). 줄이 모자라면 장소가 잘리게 때를 앞에 ('11월 …'로 날짜가 잘렸다, 11/5 밤샘 C) -->
        <button v-if="canSchedule" type="button" class="flex items-center gap-1.5 max-w-full text-left mt-0.5 py-2.5 -my-2.5" @click="emit('schedule')">
          <span class="t-caption line-clamp-2 min-w-0">{{ matchTime(game.matchDate) }} · {{ venuePlace(game, place) }}</span>
          <!-- 정한 뒤에도 두 선수 모두 바꿀 수 있다는 게 보이게 (예전 밑줄 글씨는 너무 작아 못 바꾸는 줄 알았다) -->
          <span class="inline-flex items-center gap-1 h-6 px-2 rounded-md bg-surface-3 text-fg text-xs font-medium flex-shrink-0"><UiIcon name="pen" class="text-[10px]" aria-hidden="true" />{{ needsSchedule ? '정하기' : '바꾸기' }}</span>
        </button>
        <p v-else class="t-caption line-clamp-2 mt-0.5">{{ matchTime(game.matchDate) }} · {{ venuePlace(game, place) }}</p>
      </div>
      <UiBadge :tone="state.tone" class="mt-0.5">{{ state.label }}</UiBadge>
    </div>

    <!-- 시간 바꾸기 제안 (확정된 1:1): 받는 사람은 좋아요·그대로, 낸 사람은 기다림 -->
    <div v-if="game.proposedMatchDate" class="mx-4 mb-3 rounded-xl bg-surface px-3 py-2.5">
      <template v-if="game.proposedById === me?.id">
        <p class="t-caption">{{ matchTime(game.proposedMatchDate) }}로 바꾸자고 했어요</p>
      </template>
      <div v-else class="flex items-center gap-2">
        <p class="flex-1 min-w-0 t-caption">{{ opponent?.name }}님: {{ matchTime(game.proposedMatchDate) }}로 바꿀까요?</p>
        <UiButton size="sm" variant="secondary" @click="emit('answer-time', false)">그대로</UiButton>
        <UiButton size="sm" @click="emit('answer-time', true)">좋아요</UiButton>
      </div>
    </div>

    <!-- 여럿이 하는 경기: 팀(또는 모두)의 얼굴과 빈자리 -->
    <div v-if="multi" class="px-4 pb-4 space-y-2">
      <div v-for="row in rows" :key="row.key" class="flex items-center gap-2 min-w-0">
        <span v-if="row.name" class="t-micro w-9 flex-shrink-0">{{ row.name }}</span>
        <div class="flex items-center gap-1.5 flex-wrap min-w-0">
          <button v-for="p in row.players" :key="p.id" type="button" :aria-label="p.nickname" @click="emit('profile', p.id)">
            <UiAvatar :src="p.profileUrl" :name="p.nickname" :user-id="p.id" size="sm" />
          </button>
          <span v-for="n in row.empty" :key="'e' + n" class="w-8 h-8 rounded-full border border-dashed border-line-strong" aria-hidden="true"></span>
        </div>
      </div>
    </div>

    <!-- 나 vs 상대 -->
    <div v-else class="flex items-center gap-3 px-4 pb-4">
      <button type="button" class="flex items-center gap-2 min-w-0 flex-1" @click="emit('profile', me.id)">
        <UiAvatar :src="me.avatar" :name="me.name" :user-id="me.id" size="sm" />
        <span class="text-sm text-fg truncate">{{ me.name }}</span>
      </button>
      <span class="t-micro">vs</span>
      <button
        v-if="opponent"
        type="button"
        class="flex items-center justify-end gap-2 min-w-0 flex-1"
        @click="emit('profile', opponent.id)"
      >
        <span class="text-sm text-fg truncate">{{ opponent.name }}</span>
        <UiAvatar :src="opponent.avatar" :name="opponent.name" :user-id="opponent.id" size="sm" />
      </button>
      <span v-else class="flex-1 flex items-center justify-end gap-2 min-w-0">
        <span class="t-caption truncate">상대 구하는 중</span>
        <span class="w-8 h-8 rounded-full border border-dashed border-line-strong flex-shrink-0" aria-hidden="true"></span>
      </span>
    </div>

    <!-- 지금 이 경기에서 할 일 하나 + 더보기 -->
    <div class="flex items-center gap-2 px-4 pb-4">
      <UiButton v-if="state.action" block :variant="quiet && state.actionVariant === 'signal' ? 'primary' : state.actionVariant" @click="emit(state.action)">{{ state.actionLabel }}</UiButton>
      <p v-else class="flex-1 t-caption">{{ state.hint }}</p>
      <!-- 팀 경기 단톡방: 승인된 둘 이상이면 (11/5 C) -->
      <UiIconButton v-if="chatOpen" icon="far fa-comment" label="단톡방" class="flex-shrink-0" @click="emit('chat')" />
      <UiIconButton icon="fas fa-ellipsis" label="더보기" class="flex-shrink-0" @click="emit('more')" />
    </div>
  </UiCard>
</template>

<script setup>
// 내 경기 카드. 상태에 따라 배지 하나와 '지금 할 일' 버튼 하나만 보여준다
import RuleThumb from '../rule/RuleThumb.vue'
import { computed, defineProps, defineEmits } from 'vue'
import { UiAvatar, UiBadge, UiButton, UiCard, UiIconButton } from '../ui'
import { matchTime, place } from '../../utils/format'
import { TEAM_NAMES, venuePlace, isRemote, teamChatOpen } from '../../utils/gameFormat'

const props = defineProps({
  game: { type: Object, required: true },
  me: { type: Object, default: () => ({ name: '나' }) }, // { id, name, avatar }
  /** 볼트(내 차례) 버튼을 보통 채운 버튼으로. 한 화면에 볼트는 하나라 목록의 둘째부터 */
  quiet: { type: Boolean, default: false },
})
const emit = defineEmits(['profile', 'play', 'start', 'applicants', 'share', 'cancel-request', 'result', 'more', 'schedule', 'chat', 'message', 'answer-time'])
const chatOpen = computed(() => teamChatOpen(props.game, props.game.myId ?? props.me?.id))

// 시작 전이면 선수(주최자·확정된 상대)가 시간·장소를 정하고 바꾼다
const canSchedule = computed(() => {
  const g = props.game
  if (g.type === 'my-game') return ['MATCHING', 'SCHEDULED'].includes(g.status)
  return g.status === 'APPROVED' && ['MATCHING', 'SCHEDULED'].includes(g.gameStatus)
})
// 화상·다른 게임은 장소가 없어도 된다 (시간만 정하면)
const needsSchedule = computed(() => !props.game.matchDate || (!props.game.matchLocation && !isRemote(props.game.venue)))

const isMine = computed(() => props.game.type === 'my-game')
// 경기 날(그날 0시부터)이 되면 '경기 시작'. 그 전에는 상대에게 메시지가 할 일이다
const matchDay = computed(() => {
  const d = props.game.matchDate && new Date(props.game.matchDate)
  if (!d) return true
  const today = new Date(); today.setHours(0, 0, 0, 0)
  return d.getTime() < today.getTime() + 86_400_000
})
const approved = computed(() => (props.game.applicants || []).find((a) => a.approved))

// 내 경기 응답에는 내 정보(my*)가 있고, 신청한 경기 응답에는 없어서 화면이 넘겨준다
const me = computed(() =>
  isMine.value ? { id: props.game.myId, name: props.game.myNickname, avatar: props.game.myProfileUrl } : props.me,
)

const opponent = computed(() => {
  const g = props.game
  if (!isMine.value) return { id: g.ownerId, name: g.ownerNickname, avatar: g.ownerProfileUrl }
  if (g.opponentNickname) return { id: g.opponentId, name: g.opponentNickname, avatar: g.opponentProfileUrl }
  if (approved.value) return { id: approved.value.userId, name: approved.value.applicantNickname, avatar: approved.value.applicantProfileUrl }
  return null
})

// 팀·각자 경기: 선수 목록은 players (나 포함)
const multi = computed(() => !!props.game.format && props.game.format !== 'DUEL')
const players = computed(() => props.game.players || [])
const rows = computed(() => {
  const g = props.game
  if (g.format === 'TEAMS') {
    return [0, 1].map((team) => {
      const ps = players.value.filter((p) => p.team === team)
      return { key: team, name: TEAM_NAMES[team], players: ps, empty: Math.max(0, g.maxPlayers / 2 - ps.length) }
    })
  }
  return [{ key: 'all', name: '', players: players.value, empty: Math.max(0, (g.maxPlayers || 0) - players.value.length) }]
})
// 결과를 확인할 수 있나: 낸 사람이 아니고, 팀 경기면 낸 사람과 다른 팀 (서버 canConfirm과 같다)
const canConfirm = computed(() => {
  const g = props.game
  if (g.resultSubmittedById === me.value?.id) return false
  if (g.format !== 'TEAMS') return true
  const teamOf = (id) => players.value.find((p) => p.id === id)?.team
  return teamOf(me.value?.id) !== teamOf(g.resultSubmittedById)
})
const gathered = computed(() => `${players.value.length}/${props.game.maxPlayers}명`)

// 상태 → 배지 + 할 일 (한 곳에서 정한다)
// 채운 버튼은 진행 중인 경기로 돌아가기, 볼트(signal)는 상대가 나를 기다리는 일(결과 확인·신청 승인)만. 나머지 할 일은 tonal
const state = computed(() => {
  const g = props.game
  const live = g.status === 'IN_PROGRESS' || g.gameStatus === 'IN_PROGRESS'
  if (live) return { label: '진행 중', tone: 'success', action: 'play', actionLabel: '경기로 돌아가기', actionVariant: 'primary' }
  if (g.status === 'RESULT_PENDING' || g.gameStatus === 'RESULT_PENDING') {
    return !canConfirm.value
      ? { label: '확인 대기', tone: 'neutral', hint: multi.value ? '상대 쪽에서 확인하면 기록돼요' : '상대가 확인하면 기록돼요', action: 'result', actionLabel: '낸 결과 보기', actionVariant: 'secondary' }
      : { label: '결과 확인', tone: 'primary', action: 'result', actionLabel: '결과 확인하기', actionVariant: 'signal' }
  }
  if (isMine.value) {
    const n = (g.applicants || []).filter((a) => !a.approved || !multi.value).length
    if (g.status === 'COMPLETED') return { label: '끝남', tone: 'neutral', action: 'result', actionLabel: '결과 보기', actionVariant: 'secondary' }
    if (g.status === 'CANCELED') return { label: '취소됨', tone: 'neutral', hint: '취소된 경기예요' }
    if (g.status === 'SCHEDULED') {
      if (needsSchedule.value) return { label: '확정', tone: 'primary', action: 'schedule', actionLabel: isRemote(g.venue) ? '시간 정하기' : '시간·장소 정하기', actionVariant: 'tonal' }
      if (!multi.value && opponent.value && (!matchDay.value || g.isOwner === false)) return { label: '확정', tone: 'primary', action: 'message', actionLabel: `${opponent.value.name}에게 메시지`, actionVariant: 'secondary' }
      return g.isOwner === false
        ? { label: '확정', tone: 'primary', hint: '주최자가 시작하면 알려 드려요' }
        : { label: '확정', tone: 'primary', action: 'start', actionLabel: '경기 시작', actionVariant: 'tonal' }
    }
    if (n > 0) return { label: `신청 ${n}명`, tone: 'primary', action: 'applicants', actionLabel: '신청자 보고 승인하기', actionVariant: 'signal' }
    if (multi.value) return { label: `${gathered.value} 모임`, tone: 'neutral', action: 'share', actionLabel: '링크 보내서 더 부르기', actionVariant: 'secondary' }
    return { label: '상대 구하는 중', tone: 'neutral', action: 'share', actionLabel: '링크 공유하기', actionVariant: 'secondary' }
  }
  if (g.status === 'REQUESTED') return { label: '승인 대기', tone: 'neutral', hint: `${g.ownerNickname}님이 승인하면 알려 드려요` }
  // 여럿이 하는 경기는 승인돼도 다 모일 때까지 확정이 아니다
  if (g.status === 'APPROVED' && multi.value && g.gameStatus === 'MATCHING') {
    return { label: '승인됨', tone: 'neutral', hint: `${gathered.value} 모였어요. 다 모이면 확정돼요` }
  }
  if (g.status === 'APPROVED') {
    if (needsSchedule.value) return { label: '확정', tone: 'primary', action: 'schedule', actionLabel: isRemote(g.venue) ? '시간 정하기' : '시간·장소 정하기', actionVariant: 'tonal' }
    if (!multi.value) return { label: '확정', tone: 'primary', action: 'message', actionLabel: `${g.ownerNickname}에게 메시지`, actionVariant: 'secondary' }
    return { label: '확정', tone: 'primary', hint: '주최자가 시작하면 알려 드려요' }
  }
  if (g.status === 'REJECTED') return { label: '거절됨', tone: 'danger', hint: '다른 경기를 찾아보세요' }
  return { label: '대기', tone: 'neutral', hint: '' }
})
</script>
