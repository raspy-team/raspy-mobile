<template>
  <RouterLink :to="to || `/rules/${rule.id}`" class="flex gap-4 py-4 active:opacity-70 transition-opacity">
    <RuleThumb :rule="rule" :size="64" />

    <span class="flex-1 min-w-0">
      <span class="flex items-start gap-2">
        <span class="flex-1 t-heading truncate">{{ rule.ruleTitle }}</span>
        <span v-if="rating" class="flex items-center gap-1 text-sm text-fg flex-shrink-0">
          <UiIcon name="fas fa-star" class="text-xs" aria-hidden="true" />{{ rating }}
          <span class="text-fg-subtle">({{ rule.ratingCount }})</span>
        </span>
      </span>
      <span class="block t-caption mt-0.5 truncate">{{ [ruleKind(rule), winSummary(rule)].filter(Boolean).join(' · ') }}</span>
      <span v-if="rule.ruleGoal" class="block t-caption mt-1 line-clamp-2">{{ rule.ruleGoal }}</span>
      <span class="flex items-center gap-1.5 mt-2 t-micro">
        <template v-if="rule.rank">
          <span class="flex-shrink-0 font-bold text-fg">{{ rule.rank }}위</span>
          <span aria-hidden="true">·</span>
        </template>
        <template v-if="rule.currentChampion">
          <UiIcon name="crown" class="text-signal-fg" />
          <span class="truncate">챔피언 {{ rule.currentChampion.nickname }}</span>
          <span aria-hidden="true">·</span>
        </template>
        <span class="flex-shrink-0">{{ rule.playCount ? `경기 ${rule.playCount}번` : '아직 경기 없음' }}</span>
      </span>
    </span>
  </RouterLink>
</template>

<script setup>
// 규칙 목록의 한 줄: 그림 → 이름·평점 → 종류(종목·능력)·승리 조건 → 한 줄 설명 → 순위·챔피언·경기 수. 누르면 상세
import { computed, defineProps } from 'vue'
import { ratingText, ruleKind, winSummary } from '../../utils/rule'
import RuleThumb from './RuleThumb.vue'

const props = defineProps({ rule: { type: Object, required: true }, to: { type: [String, Object], default: null } })
const rating = computed(() => ratingText(props.rule))
</script>
