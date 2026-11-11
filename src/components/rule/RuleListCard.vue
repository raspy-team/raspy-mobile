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
      <span v-if="rule.ruleGoal" class="block t-caption mt-1 line-clamp-2">{{ rule.ruleGoal }}</span>
      <span class="block mt-2 t-micro">{{ rule.playCount ? `경기 ${rule.playCount}번` : '아직 경기 없음' }}</span>
    </span>
  </RouterLink>
</template>

<script setup>
// 규칙 목록의 한 줄: 그림 → 이름·별점 → 한 줄 설명 → 경기 수. 누르면 상세.
// 목록에서 고르는 사람에게 필요한 넷만 남겼다. 종류·승리 조건·순위·챔피언까지 한 줄에 아홉 가지라
// 눈이 쉬지 못했다. 그것들은 상세에서 본다 (목적 판정 11/11 8번)
import { computed, defineProps } from 'vue'
import { ratingText } from '../../utils/rule'
import RuleThumb from './RuleThumb.vue'

const props = defineProps({ rule: { type: Object, required: true }, to: { type: [String, Object], default: null } })
const rating = computed(() => ratingText(props.rule))
</script>
