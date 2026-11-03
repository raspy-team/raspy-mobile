<template>
  <UiCard :pad="false">
    <!-- 무엇을 · 어디서 언제 -->
    <div class="flex items-start gap-3 p-4 pb-3">
      <button type="button" class="flex-1 min-w-0 flex items-start gap-3 text-left" @click="emit('rule')">
        <RuleThumb :rule="game.rule" :size="36" bare />
        <span class="flex-1 min-w-0">
          <span class="block t-heading truncate">{{ game.rule?.ruleTitle }}</span>
          <!-- 만나서 하는 경기는 동네 이름부터 (화상·다른 게임은 동네가 없다) -->
          <span class="block t-caption truncate mt-0.5">{{ [game.dongName, venuePlace(game, place), matchTime(game.matchDate)].filter(Boolean).join(' · ') }}</span>
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
      <button v-if="applicants" type="button" class="t-micro underline underline-offset-2 flex-shrink-0" @click="emit('challengers')">
        {{ applicants }}명 신청
      </button>
      <UiBadge v-if="isMine">내 경기</UiBadge>
      <!-- 신청이 된 순간: 체크로 바뀌며 볼트 불꽃이 튄다 (1.2초 뒤 '신청 취소'로) -->
      <span v-else-if="justApplied" class="apply-burst relative inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-signal text-signal-on text-sm font-semibold" role="status">
        <UiIcon name="check" class="text-base" />신청했어요
        <span v-for="n in 8" :key="n" class="apply-spark" :style="{ '--a': n * 45 + 'deg' }" aria-hidden="true"></span>
      </span>
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
import { matchTime, place, ratingLine, timeAgo } from '../../utils/format'
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
function pick(cb) {
  teamPick.value = false
  cb()
}

const applicants = computed(() => props.game.challengers?.length || 0)
// 올린 지 얼마나 됐는지는 경기 시간보다 덜 중요해서 위 줄이 아니라 여기에
const ownerLine = computed(() =>
  [
    // 매치 온도 (만나도 되는 사람인지, 기능 검토 #1)
    props.game.ownerTemperature != null && `${props.game.ownerTemperature.toFixed(1)}°`,
    // 둘 다 이 규칙 레이팅이 있으면 이길 확률 (비슷한 실력인지 고르는 데 쓴다). 40~60%면 '해 볼 만'
    props.game.myWinChance != null && `이길 확률 ${props.game.myWinChance}%${props.game.myWinChance >= 40 && props.game.myWinChance <= 60 ? ' 해 볼 만' : ''}`,
    ratingLine(props.game.ruleStatisticsOfOwner),
    props.game.createdAt && `${timeAgo(props.game.createdAt)} 올림`,
  ].filter(Boolean).join(' · '),
)
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
