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
        <UiAvatar :src="game.ownerProfileUrl" :name="game.ownerNickname" size="sm" />
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
      <!-- 다른 동네 경기(공유 링크)는 신청 버튼 대신 경기 화면이 이유를 보여 준다 -->
      <!-- 팀 경기는 들어갈 팀을 골라 신청한다 (자리가 남은 팀만) -->
      <span v-else-if="game.format === 'TEAMS' && !game.joinBlockedReason" class="flex gap-1.5 flex-shrink-0">
        <UiButton
          v-for="(left, team) in game.teamSeatsLeft || []"
          :key="team"
          size="sm"
          variant="tonal"
          :disabled="left <= 0"
          :loading="busy"
          @click="emit('apply', team)"
        >{{ TEAM_NAMES[team] }} {{ left > 0 ? `${left}자리` : '꽉 참' }}</UiButton>
      </span>
      <UiButton v-else-if="!game.joinBlockedReason" size="sm" variant="tonal" :loading="busy" @click="emit('apply')">신청</UiButton>
    </div>
  </UiCard>
</template>

<script setup>
// 홈의 열린 경기 카드: 무엇을(규칙) → 어디서·언제 → 누구와 → 신청
import RuleThumb from '../rule/RuleThumb.vue'
import { computed, ref, watch, defineProps, defineEmits } from 'vue'
import { UiAvatar, UiBadge, UiButton, UiCard, UiIconButton } from '../ui'
import { matchTime, place, ratingLine, timeAgo } from '../../utils/format'
import { formatLabel, TEAM_NAMES, venuePlace } from '../../utils/gameFormat'

const props = defineProps({
  game: { type: Object, required: true },
  isMine: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
})
const emit = defineEmits(['rule', 'profile', 'apply', 'cancel', 'challengers', 'more'])

// 신청이 막 된 순간만 축하 모양을 잠깐 보여준다
const multi = computed(() => props.game.format && props.game.format !== 'DUEL')

const justApplied = ref(false)
watch(() => props.game.isAppliedByMe, (now, before) => {
  if (now && before === false) {
    justApplied.value = true
    setTimeout(() => (justApplied.value = false), 1200)
  }
})

const applicants = computed(() => props.game.challengers?.length || 0)
// 올린 지 얼마나 됐는지는 경기 시간보다 덜 중요해서 위 줄이 아니라 여기에
const ownerLine = computed(() =>
  [ratingLine(props.game.ruleStatisticsOfOwner), props.game.createdAt && `${timeAgo(props.game.createdAt)} 올림`].filter(Boolean).join(' · '),
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
