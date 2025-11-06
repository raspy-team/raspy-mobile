<template>
  <div class="pt-7 raspy-top h-full">
    <!-- Progress Bar -->
    <div class="progress-bar-outer">
      <div class="progress-bar-inner" :style="{ width: progressWidth + '%' }"></div>
    </div>

    <!-- 규칙 생성 위자드 (4~14단계) -->
    <RuleCreateWizard
      v-if="step >= 4 && step <= 14"
      :step="step"
      :form="ruleForm"
      @next="onRuleFormNext"
      @submit="submitRuleForm"
      @back="onRuleFormBack"
    />

    <!-- AI 생성 중 -->
    <RuleAIGenerating v-if="step === 15" />

    <!-- 생성 결과 -->
    <RuleResultPage v-if="step === 16" :result="createdRule" @next="onFinishRule" />

    <!-- 성공 모달 -->
    <CustomAlert
      v-if="showSuccessModal"
      message="규칙이 생성되었습니다!"
      confirm-text="경기로 만들기"
      cancel-text="다른 규칙 보기"
      @confirm="handleGameCreate"
      @cancel="handleBrowseRules"
    />
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import RuleCreateWizard from '../../components/game-create/RuleCreateWizard.vue'
import RuleAIGenerating from '../../components/game-create/RuleAIGenerating.vue'
import RuleResultPage from '../../components/game-create/RuleResultPage.vue'
import CustomAlert from '../../components/CustomAlert.vue'
import api from '../../api/api'

const router = useRouter()

const totalSteps = 13
const step = ref(4) // RuleCreateWizard는 step 4부터 시작

const ruleForm = reactive({
  ruleGoal: '',
  ruleScoreDefinition: '',
  rulePreparation: '',
  ruleOrder: '',
  ruleDecision: '',
  ruleFoul: '',
  ruleExtraInfo: '',
  pointsToWin: -1,
  duration: -1,
  setsToWin: 1,
  winBy: '',
})

const createdRule = ref(null)
const showSuccessModal = ref(false)

const progressWidth = computed(() => Math.max(5, Math.round(((step.value - 3) / (totalSteps - 3)) * 100)))

function onRuleFormNext(data) {
  Object.assign(ruleForm, data)
  if (step.value < 14) step.value += 1
}

function onRuleFormBack() {
  if (step.value > 4) step.value -= 1
  else router.push('/rules?fromRuleCreate=true') // 규칙 목록으로 돌아가기
}

async function submitRuleForm(data) {
  step.value = 15 // AI 생성 중 화면
  try {
    const payload = { ...data }
    const { data: ruleData } = await api.post('/api/rules', payload)
    setTimeout(() => {
      createdRule.value = ruleData
      step.value = 16 // 결과 화면
    }, 1800)
  } catch (e) {
    alert('규칙 생성 실패: ' + (e.response?.data?.message ?? e.message))
    step.value = 14 // 마지막 단계로 돌아가기
  }
}

function onFinishRule() {
  showSuccessModal.value = true
}

function handleGameCreate() {
  router.push(`/create-game?ruleId=${createdRule.value.id}`)
}

function handleBrowseRules() {
  router.push('/rules')
}
</script>

<style scoped>
.raspy-top {
  display: flex;
  flex-direction: column;
  background: #1f2937;
}

.progress-bar-outer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: #6b7280;
  z-index: 1000;
}

.progress-bar-inner {
  height: 100%;
  background: linear-gradient(90deg, #f97316, #fb923c);
  transition: width 0.3s ease;
}
</style>
