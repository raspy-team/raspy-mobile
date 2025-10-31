<template>
  <div class="pt-7 raspy-top h-full">
    <!-- Progress Bar -->
    <div class="progress-bar-outer">
      <div class="progress-bar-inner" :style="{ width: progressWidth + '%' }"></div>
    </div>

    <!-- 로딩 상태 -->
    <div v-if="loading" class="flex flex-col items-center justify-center h-screen">
      <i class="fas fa-spinner fa-spin text-4xl text-orange-500 mb-4"></i>
      <p class="text-gray-300">규칙 정보를 불러오는 중...</p>
    </div>

    <!-- 규칙 수정 위자드 -->
    <template v-else-if="step >= 4 && step <= 14 && !loading">
      <!-- 안내 메시지 -->
      <div
        v-if="step == 4"
        class="bg-blue-900/20 border-l-4 border-blue-400 p-4 mx-5 fixed top-[16dvh] rounded-r-lg"
      >
        <div class="flex items-start">
          <i class="fas fa-info-circle text-blue-400 mt-0.5 mr-3"></i>
          <div class="flex-1">
            <p class="text-sm font-semibold text-blue-300 mb-1">규칙 수정 요청</p>
            <p class="text-xs text-blue-400">
              수정 내용은 관리자 승인 후 반영됩니다. 기존 값이 미리 채워져 있으니 수정할 부분만
              변경해주세요.
            </p>
          </div>
        </div>
      </div>

      <RuleCreateWizard
        :step="step"
        :form="ruleForm"
        :is-edit-mode="true"
        @next="onRuleFormNext"
        @submit="submitEditRequest"
        @back="onRuleFormBack"
      />
    </template>

    <!-- AI 처리 중 -->
    <div v-if="step === 15" class="flex flex-col items-center justify-center h-screen">
      <i class="fas fa-spinner fa-spin text-4xl text-orange-500 mb-4"></i>
      <p class="text-gray-300 text-lg font-semibold">수정 요청 제출 중...</p>
    </div>

    <!-- 수정 요청 완료 -->
    <div v-if="step === 16" class="flex flex-col items-center justify-center h-screen px-6">
      <div
        class="bg-gray-800 rounded-2xl shadow-lg p-8 max-w-md w-full text-center border-2 border-orange-600"
      >
        <i class="fas fa-check-circle text-6xl text-green-500 mb-4"></i>
        <h2 class="text-2xl font-bold text-white mb-3">수정 요청 완료!</h2>
        <p class="text-gray-300 mb-6 leading-relaxed">
          규칙 수정 요청이 성공적으로 제출되었습니다.<br />
          관리자 검토 후 승인되면 변경사항이 반영됩니다.
        </p>
        <div class="bg-blue-900/20 border border-blue-600 rounded-lg p-4 mb-6">
          <p class="text-sm text-blue-300">
            <i class="fas fa-info-circle mr-1"></i>
            승인/거절 상태는 '내 규칙' 페이지에서 확인할 수 있습니다.
          </p>
        </div>
        <button
          @click="goToMyRules"
          class="w-full bg-orange-500 text-white font-bold py-3 rounded-xl hover:bg-orange-600 transition shadow"
        >
          내 규칙으로 이동
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import RuleCreateWizard from '../../components/game-create/RuleCreateWizard.vue'
import api from '../../api/api'

const router = useRouter()
const route = useRoute()

const loading = ref(true)
const totalSteps = 13
const step = ref(4)

const ruleForm = reactive({
  ruleTitle: '',
  majorCategory: '',
  minorCategory: '',
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

const originalRuleId = ref(null)

const progressWidth = computed(() =>
  Math.max(5, Math.round(((step.value - 3) / (totalSteps - 3)) * 100)),
)

async function loadRule() {
  const ruleId = route.params.id
  if (!ruleId) {
    alert('잘못된 접근입니다.')
    router.push('/rules/my-rules')
    return
  }

  loading.value = true
  try {
    const { data } = await api.get(`/api/rules/${ruleId}`)

    // 기존 규칙 데이터로 폼 초기화
    Object.assign(ruleForm, {
      ruleTitle: data.ruleTitle || '',
      majorCategory: data.majorCategory || '',
      minorCategory: data.minorCategory || '',
      ruleGoal: data.ruleGoal || '',
      ruleScoreDefinition: data.ruleScoreDefinition || '',
      rulePreparation: data.rulePreparation || '',
      ruleOrder: data.ruleOrder || '',
      ruleDecision: data.ruleDecision || '',
      ruleFoul: data.ruleFoul || '',
      ruleExtraInfo: data.ruleExtraInfo || '',
      pointsToWin: data.pointsToWin ?? -1,
      duration: data.duration ?? -1,
      setsToWin: data.setsToWin ?? 1,
      winBy: data.winBy || '',
    })

    originalRuleId.value = ruleId
  } catch (e) {
    console.error('Failed to load rule:', e)
    alert('규칙을 불러오는데 실패했습니다.')
    router.push('/rules/my-rules')
  } finally {
    loading.value = false
  }
}

function onRuleFormNext(data) {
  Object.assign(ruleForm, data)
  if (step.value < 14) step.value += 1
}

function onRuleFormBack() {
  if (step.value > 4) step.value -= 1
  else router.push('/rules/my-rules')
}

async function submitEditRequest(data) {
  step.value = 15 // 처리 중 화면
  try {
    const payload = {
      ...data,
      originalRuleId: originalRuleId.value,
    }

    await api.post('/api/rules/edit-requests', payload)

    setTimeout(() => {
      step.value = 16 // 완료 화면
    }, 1000)
  } catch (e) {
    console.error('Failed to submit edit request:', e)
    alert('수정 요청 제출 실패: ' + (e.response?.data?.message ?? e.message))
    step.value = 14 // 마지막 단계로 돌아가기
  }
}

function goToMyRules() {
  router.push('/rules/my-rules')
}

onMounted(() => {
  loadRule()
})
</script>

<style scoped>
.raspy-top {
  background: #1f2937;
}

.progress-bar-outer {
  width: 92dvw;
  height: 7px;
  background: #6b7280;
  border-radius: 5px;
  overflow: hidden;
  position: fixed;
  top: 8%;
  z-index: 100;
  margin: 0px 4dvw;
  box-sizing: border-box;
  transition: background 0.3s;
}

.progress-bar-inner {
  height: 100%;
  background: linear-gradient(90deg, #ff8521 70%, #ff681c 100%);
  border-radius: 5px 0 0 5px;
  transition: width 0.25s cubic-bezier(0.6, 0, 0.3, 1);
}
</style>
