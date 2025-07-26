<template>
  <div class="pt-7 raspy-top h-full">
    <!-- Progress Bar -->
    <div class="progress-bar-outer">
      <div class="progress-bar-inner" :style="{ width: progressWidth + '%' }"></div>
    </div>

    <!-- 기존 콘텐츠 -->
    <GameIntro v-if="step === 1" @next="step = 2" />
    <RuleIntro v-if="step === 2" @select="onRuleIntroSelect" @back="step = 1" />
    <RuleSelectPage v-if="step === 3" @select="onRuleSelected" @back="step = step - 1" />

    <!-- 4~14: 나만의 규칙 생성 -->
    <RuleCreateWizard
      v-if="step >= 4 && step <= 14"
      :step="step"
      :form="ruleForm"
      @next="onRuleFormNext"
      @submit="submitRuleForm"
      @back="onRuleFormBack"
    />

    <RuleAIGenerating v-if="step === 15" />
    <RuleResultPage v-if="step === 16" :result="createdRule" @next="onFinishRule" />
    <GameModeSelect v-if="step === 17" @mode="onModeSelect" />
    <FriendModal v-if="showFriendModal" @select="onFriendSelect" @close="showFriendModal = false" />
    <PlaceSelectPage v-if="step === 18" @select="onPlaceSelect" @back="step -= 1" />
    <TimeSelectPage v-if="step === 19" @select="onTimeSelect" @back="step -= 1" />
    <GameFinalPage v-if="step === 20" :game="gameForm" />
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import GameIntro from '../../components/game-create/GameIntro.vue'
import RuleIntro from '../../components/game-create/RuleIntro.vue'
import RuleSelectPage from '../../components/game-create/RuleSelectPage.vue'
import RuleCreateWizard from '../../components/game-create/RuleCreateWizard.vue'
import RuleAIGenerating from '../../components/game-create/RuleAIGenerating.vue'
import RuleResultPage from '../../components/game-create/RuleResultPage.vue'
import GameModeSelect from '../../components/game-create/GameModeSelect.vue'
import FriendModal from '../../components/game-create/FriendModal.vue'
import PlaceSelectPage from '../../components/game-create/PlaceSelect.vue'
import TimeSelectPage from '../../components/game-create/TimeSelect.vue'
import GameFinalPage from '../../components/game-create/GameFinalPage.vue'
import api from '../../api/api'
import { useRoute } from 'vue-router'
const route = useRoute()

// 스텝 갯수 줄임 (14+6)
const totalSteps = 20
const step = ref(17)
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
const showFriendModal = ref(false)
const gameForm = reactive({
  ruleId: null,
  friendId: null,
  place: '',
  time: '',
})

const progressWidth = computed(() => Math.max(5, Math.round((step.value / totalSteps) * 100)))
onMounted(() => {
  // 최초 마운트 시 쿼리 파라미터 체크
  handleQueryRuleId(route)
})

function handleQueryRuleId(route) {
  const ruleId = route.query.ruleId
  if (ruleId && !isNaN(Number(ruleId))) {
    gameForm.ruleId = Number(ruleId)
    step.value = 17
  }
}

function onRuleIntroSelect(type) {
  if (type === 'select') step.value = 3
  else if (type === 'create') step.value = 4
}
function onRuleSelected(rule) {
  gameForm.ruleId = rule.id
  step.value = 17
}
function onRuleFormNext(data) {
  Object.assign(ruleForm, data)
  if (step.value < 14) step.value += 1
}
function onRuleFormBack() {
  if (step.value > 4) step.value -= 1
  else step.value = 2
}
async function submitRuleForm(data) {
  step.value = 15
  try {
    const payload = { ...data }
    const { data: ruleData } = await api.post('/api/rules', payload)
    setTimeout(() => {
      createdRule.value = ruleData
      gameForm.ruleId = ruleData.id
      step.value = 16
    }, 1800)
  } catch (e) {
    alert('규칙 생성 실패: ' + (e.response?.data?.message ?? e.message))
    step.value = 14
  }
}
function onFinishRule() {
  step.value = 17
}
function onModeSelect(mode) {
  if (mode === 'friend') showFriendModal.value = true
  else step.value = 18
}
function onFriendSelect(friend) {
  gameForm.friendId = friend.id
  showFriendModal.value = false
  step.value = 18
}
function onPlaceSelect(place) {
  gameForm.place = place
  step.value = 19
}

function onTimeSelect(time) {
  gameForm.time = time
  step.value = 20
  createGame()
}

async function createGame() {
  try {
    const payload = {
      referencedRuleId: gameForm.ruleId,
      friendId: gameForm.friendId,
      place: gameForm.place,
      time: gameForm.time,
    }
    await api.post('/api/games/create', payload)
  } catch (e) {
    alert('게임 생성 실패: ' + (e.response?.data?.message ?? e.message))
  }
}
</script>

<style scoped>
.progress-bar-outer {
  width: 92dvw;
  height: 7px;
  background: #f2f4f8;
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
