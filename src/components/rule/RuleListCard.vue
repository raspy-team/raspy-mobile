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
      <!-- 챔피언은 남긴다: 고르는 사람에겐 "누가 잘하나"(정보), 챔피언에겐 이름이 목록에 걸리는 자랑(정체성). 목적을 '고르기' 하나로만 보고 뺐던 것을 되살림 (11/11 목적 다시 보기) -->
      <span class="flex items-center gap-1.5 mt-2 t-micro">
        <template v-if="rule.currentChampion">
          <UiIcon name="crown" class="text-signal-fg" aria-hidden="true" />
          <span class="truncate">챔피언 {{ rule.currentChampion.nickname }}</span>
          <span aria-hidden="true">·</span>
        </template>
        <span v-if="rule.playCount" class="flex-shrink-0">경기 {{ rule.playCount }}번</span>
      </span>
    </span>
  </RouterLink>
</template>

<script setup>
// 규칙 목록의 한 줄: 그림 → 이름·별점 → 한 줄 설명 → 챔피언·경기 수. 누르면 상세.
// 종류·승리 조건·순위는 상세에서 본다(한 줄에 아홉 가지라 눈이 쉬지 못했다, 목적 판정 11/11 8번). 챔피언은 자랑·정보라 남긴다
import { computed, defineProps } from 'vue'
import { ratingText } from '../../utils/rule'
import RuleThumb from './RuleThumb.vue'

const props = defineProps({ rule: { type: Object, required: true }, to: { type: [String, Object], default: null } })
const rating = computed(() => ratingText(props.rule))
</script>
