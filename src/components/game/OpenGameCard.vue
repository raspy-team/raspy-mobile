<template>
  <UiCard :pad="false">
    <!-- 무엇을 · 어디서 언제 -->
    <div class="flex items-start gap-3 p-4 pb-3">
      <button type="button" class="flex-1 min-w-0 flex items-start gap-3 text-left" @click="emit('rule')">
        <RuleThumb :rule="game.rule" :size="36" bare />
        <span class="flex-1 min-w-0">
          <span class="block t-heading truncate">{{ game.rule?.ruleTitle }}</span>
          <!-- 만나서 하는 경기는 동네 이름과 내 동네에서 거리부터 (화상·다른 게임은 동네가 없다) -->
          <span class="block t-caption line-clamp-2 mt-0.5">{{ [[game.dongName, distance(game.distanceM)].filter(Boolean).join(' '), matchTime(game.matchDate), venuePlace(game, place)].filter(Boolean).join(' · ') }}</span>
          <!-- 여럿이 하는 경기: 형식과 모인 인원 -->
          <span v-if="multi" class="block t-micro mt-0.5">{{ formatLabel(game.format, game.maxPlayers) }} · {{ game.currentParticipantCounts }}/{{ game.maxPlayers }}명 모임</span>
        </span>
      </button>
      <!-- 댓글·메시지·공유·신고는 여기로 (카드마다 아이콘 줄을 두지 않는다) -->
      <UiIconButton icon="fas fa-ellipsis" label="더보기" class="-mt-2 -mr-2" @click="emit('more')" />
    </div>

    <!-- 누구와 · 신청 -->
    <div class="flex items-center gap-3 px-4 pb-4">
      <button type="button" class="flex-1 min-w-0 flex items-center gap-2.5 text-left" @click="emit('profile')">
        <UiAvatar :src="game.ownerProfileUrl" :name="game.ownerNickname" :user-id="game.ownerId" size="sm" />
        <span class="min-w-0">
          <span class="block text-sm text-fg truncate">{{ game.ownerNickname }}</span>
          <!-- 아직 안 해 본 사람의 '1500점 · 첫 경기 전'은 정보가 아니라 소음이라 뺀다 -->
          <span class="block t-micro truncate">{{ ownerLine }}</span>
        </span>
      </button>
      <!-- 신청자 목록은 주최자만 연다. 다른 사람에게는 몇 명인지만 (뽑히지 않은 사람이 남들에게 보이지 않게, 11/11 감정과 체면) -->
      <button v-if="applicants && isMine" type="button" class="t-micro underline underline-offset-2 flex-shrink-0 px-2 -mx-2 py-3 -my-3" @click="emit('challengers')">
        {{ applicants }}명 신청
      </button>
      <span v-else-if="applicants" class="t-micro flex-shrink-0">{{ applicants }}명 신청</span>
      <UiBadge v-if="isMine">내 경기</UiBadge>
      <!-- 신청이 된 순간: 체크로 바뀌며 볼트 불꽃이 튄다 (1.2초 뒤 '신청 취소'로) -->
      <span v-else-if="justApplied" class="apply-burst relative inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-signal text-signal-on text-sm font-semibold" role="status">
        <UiIcon name="check" class="text-base" />신청했어요
        <span v-for="n in 8" :key="n" class="apply-spark" :style="{ '--a': n * 45 + 'deg' }" aria-hidden="true"></span>
      </span>
      <!-- 이미 승인된 선수: '신청'이 다시 보여 누르면 거절됐다. 빠지기는 내 경기에서 (경로 4 리뷰) -->
      <UiBadge v-else-if="game.isApprovedMe" tone="success">승인됐어요</UiBadge>
      <UiButton v-else-if="game.isAppliedByMe" size="sm" variant="secondary" :loading="busy" @click="emit('cancel')">신청 취소</UiButton>
      <!-- 상대가 다 정해졌거나 시작한 경기는 신청할 수 없다 (공유 링크로 들어온 경기 화면) -->
      <UiBadge v-else-if="game.gameStatus && game.gameStatus !== 'MATCHING'">{{ STATUS_LABEL[game.gameStatus] || '모집 끝' }}</UiBadge>
      <!-- 다른 동네 경기(공유 링크)는 신청 버튼 대신 경기 화면이 이유를 보여 준다 -->
      <!-- 팀 경기도 카드에는 신청 버튼 하나. 팀 고르기는 시트에서 (카드에 버튼이 늘면 주최자 이름이 잘렸다) -->
      <UiButton v-else-if="!game.joinBlockedReason" size="sm" variant="tonal" :loading="busy" @click="game.format === 'TEAMS' ? (teamPick = true) : emit('apply')">신청</UiButton>
    </div>
  </UiCard>

  <!-- 팀 고르기: 자리가 남은 팀, 친구와 둘이 -->
  <UiSheet v-model="teamPick" title="어느 팀으로 갈까요?">
    <UiList>
      <UiListItem
        v-for="(left, team) in game.teamSeatsLeft || []"
        :key="team"
        :title="TEAM_NAMES[team]"
        :subtitle="left > 0 ? `${left}자리 남았어요` : '자리가 없어요'"
        :chevron="left > 0"
        :class="left > 0 ? '' : 'opacity-40 pointer-events-none'"
        :aria-disabled="left > 0 ? undefined : 'true'"
        @click="left > 0 && pick(() => emit('apply', team))"
      />
      <UiListItem
        v-if="(game.teamSeatsLeft || []).some((n) => n >= 2)"
        icon="user-group"
        title="친구와 둘이 신청"
        subtitle="두 자리가 남은 팀에 같이 들어가요"
        chevron
        @click="pick(() => emit('pair'))"
      />
    </UiList>
  </UiSheet>
</template>

<script setup>
// 홈의 열린 경기 카드: 무엇을(규칙) → 어디서·언제 → 누구와 → 신청
const STATUS_LABEL = { SCHEDULED: '상대 정해짐', IN_PROGRESS: '경기 중', RESULT_PENDING: '결과 확인 중', COMPLETED: '끝남', CANCELED: '취소됨' }
import RuleThumb from '../rule/RuleThumb.vue'
import { computed, ref, watch, defineProps, defineEmits } from 'vue'
import { UiAvatar, UiBadge, UiButton, UiCard, UiIconButton, UiList, UiListItem, UiSheet } from '../ui'
import { distance, matchTime, place } from '../../utils/format'
import { formatLabel, TEAM_NAMES, venuePlace } from '../../utils/gameFormat'

const props = defineProps({
  game: { type: Object, required: true },
  isMine: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
})
const emit = defineEmits(['rule', 'profile', 'apply', 'pair', 'cancel', 'challengers', 'more'])

// 신청이 막 된 순간만 축하 모양을 잠깐 보여준다
const multi = computed(() => props.game.format && props.game.format !== 'DUEL')

const justApplied = ref(false)
watch(() => props.game.isAppliedByMe, (now, before) => {
  if (now && before === false) {
    justApplied.value = true
    setTimeout(() => (justApplied.value = false), 1200)
  }
})

const teamPick = ref(false)
// 시트를 닫고 바로 다음 시트를 열면 닫은 시트의 기록 칸이 남아 뒤로를 두 번 눌러야 했다: 칸이 걷힌 뒤 연다 (가로 훑기 2)
function afterSheetClosed(cb) {
  let done = false
  const go = () => {
    if (done) return
    done = true
    window.removeEventListener('popstate', go)
    cb()
  }
  window.addEventListener('popstate', go)
  setTimeout(go, 300)
}
function pick(cb) {
  teamPick.value = false
  afterSheetClosed(cb)
}

const applicants = computed(() => props.game.challengers?.length || 0)
// 올린 지 얼마나 됐는지는 경기 시간보다 덜 중요해서 위 줄이 아니라 여기에
// 갈지 정하는 데 필요한 것만: 믿을 만한가(온도)와 해 볼 만한가(이길 확률을 말로). 레이팅·올린 때는 프로필·경기 화면에서 (목적 판정 8: 한 줄에 숫자 넷이었다)
const ownerLine = computed(() => {
  const c = props.game.myWinChance
  // 주최자 이름 옆 '나보다 잘해요'는 누구의 '나'인지 헷갈렸다: 내가 보는 상대로 말한다. 온도는 무엇의 온도인지 붙인다 (경로 4 리뷰 G6)
  const chance = c == null ? null : c >= 40 && c <= 60 ? '해 볼 만한 상대' : c < 40 ? '나보다 센 상대' : '내가 앞서는 상대'
  return [
    props.game.ownerTemperature != null && `매너 ${props.game.ownerTemperature.toFixed(1)}°`,
    // 이길 확률이 없으면(레이팅이 없으면) 롤·피파 같은 다른 게임 티어가 그 자리를 대신한다
    chance ?? props.game.ownerExtTier,
  ].filter(Boolean).join(' · ')
})
</script>

<style>
.apply-burst { animation: apply-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
@keyframes apply-pop { from { transform: scale(0.85); } to { transform: scale(1); } }
.apply-spark {
  position: absolute; left: 50%; top: 50%; width: 4px; height: 4px; margin: -2px; border-radius: 9999px;
  background: rgb(var(--c-signal-fg));
  animation: apply-spark 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
}
@keyframes apply-spark {
  from { opacity: 1; transform: rotate(var(--a)) translateX(0); }
  to { opacity: 0; transform: rotate(var(--a)) translateX(46px); }
}
@media (prefers-reduced-motion: reduce) { .apply-burst, .apply-spark { animation: none; } .apply-spark { display: none; } }
</style>
