<template>
  <UiSheet :model-value="true" :title="rule.ruleTitle" @update:model-value="emit('close')">
    <p class="t-caption mb-6">{{ [rule.minorCategory, winSummaryUnder(rule)].filter(Boolean).join(' · ') }}</p>
    <RuleBody :rule="rule" />
    <template v-if="rule.id" #footer>
      <UiButton block variant="secondary" @click="openDetail">규칙 자세히 보기</UiButton>
    </template>
  </UiSheet>
</template>

<script setup>
// 경기·카드에서 규칙을 잠깐 확인하는 시트. 내용은 상세 화면과 같은 RuleBody
import { defineProps, defineEmits } from 'vue'
import { useRouter } from 'vue-router'
import RuleBody from './rule/RuleBody.vue'
import { UiButton, UiSheet } from './ui'
import { winSummaryUnder } from '../utils/rule'

const props = defineProps({ rule: { type: Object, required: true } })
const emit = defineEmits(['close'])
const router = useRouter()

function openDetail() {
  emit('close')
  router.push(`/rules/${props.rule.id}`)
}
</script>
