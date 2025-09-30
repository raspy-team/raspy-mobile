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
    <PlaceSelectPage v-if="step === 18" @select="onPlaceSelect" @back="step -= 1" />
    <TimeSelectPage v-if="step === 19" @select="onTimeSelect" @back="step -= 1" />
    <GameFinalPage v-if="step === 20" :game="gameForm" />
  </div>

  <!-- 장소/진행 모달 -->
  <div
    v-if="showAddressModal"
    class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[300000]"
  >
    <div class="bg-white p-6 m-5 rounded-2xl w-full max-w-md shadow-lg">
      <h2 class="text-lg font-semibold mb-4">경기 장소 설정</h2>
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          <i class="fas fa-search mr-1 text-orange-500"></i>
          장소 검색
        </label>
        <div class="relative">
          <input
            ref="addressInputWizard"
            v-model="searchQuery"
            class="w-full text-base px-4 py-3 bg-white rounded-xl border-2 border-gray-200 outline-none focus:border-orange-400 transition"
            placeholder="장소명 또는 주소 입력 (예: 서초탁구장)"
            autocomplete="off"
          />
          <i v-if="!searchQuery" class="fas fa-location-dot absolute right-4 top-1/2 -translate-y-1/2 text-gray-300"></i>
        </div>
        <p class="text-xs text-gray-400 mt-2">
          <i class="fas fa-lightbulb text-yellow-500 mr-1"></i>
          장소명이나 주소를 입력하면 자동으로 검색됩니다
        </p>
      </div>

      <div v-if="selectedPlace" class="mb-4 p-4 bg-orange-50 rounded-xl border border-orange-200">
        <div class="flex items-start gap-3">
          <i class="fas fa-map-marker-alt text-orange-500 mt-1"></i>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-gray-800 mb-1">{{ selectedPlace.name }}</p>
            <p class="text-sm text-gray-600">{{ selectedPlace.address }}</p>
          </div>
          <button
            @click="clearSelection"
            class="text-gray-400 hover:text-gray-600 transition"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>

      <div v-if="!selectedPlace" class="mt-4 text-xs text-gray-500 flex items-center gap-2">
        <i class="fas fa-info-circle text-blue-400"></i>
        <span>장소를 선택해야 게임을 시작할 수 있습니다</span>
      </div>
      <div class="flex justify-end mt-6 space-x-2">
        <button
          @click="closeModal"
          class="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 transition"
        >
          취소
        </button>
        <button
          :disabled="!selectedPlace"
          class="px-5 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-600 transition shadow-md"
          @click="submitAndStartGame"
        >
          <i class="fas fa-play mr-1"></i>
          경기 진행
        </button>
      </div>
    </div>
  </div>

  <!-- 시작 전 확인 모달 -->
  <div
    v-if="showCountdownModal"
    class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
  >
    <div class="bg-white p-7 m-5 rounded-2xl w-full max-w-md shadow-2xl text-center">
      <h2 class="text-xl font-bold text-gray-900 mb-3 tracking-tight">경기 시작 전 확인</h2>

      <p class="text-sm text-gray-500 mb-1">이 경기는 다음 시간 동안 진행됩니다:</p>

      <div class="text-4xl font-black text-orange-500 py-4 mb-4 mt-3">
        {{ countdownDurationText }}
      </div>

      <p class="text-xs text-gray-400 mb-5">
        아래 <span class="font-semibold text-orange-500">"바로 시작하기"</span> 버튼을 누르면 즉시
        경기가 시작되고 상대방에게도 표시됩니다.
      </p>

      <div class="flex justify-end gap-2">
        <button
          @click="showCountdownModal = false"
          class="px-4 py-2 rounded bg-gray-100 text-gray-600 text-sm"
        >
          취소
        </button>
        <button
          @click="confirmStartGame"
          class="px-5 py-2 rounded bg-orange-500 text-white text-sm font-semibold shadow hover:bg-orange-400 transition active:scale-95"
        >
          바로 시작하기
        </button>
      </div>
    </div>
  </div>

  <!-- 주소 오류 모달 -->
  <div
    v-if="showAddressErrorModal"
    class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
  >
    <div class="bg-white p-6 m-5 rounded-2xl w-full max-w-sm shadow-2xl">
      <div class="text-center mb-4">
        <i class="fas fa-exclamation-triangle text-orange-500 text-4xl mb-3"></i>
        <h3 class="text-lg font-bold text-gray-900 mb-2">장소를 찾을 수 없습니다</h3>
        <p class="text-sm text-gray-600">
          더 구체적인 장소를 입력해주세요.<br />
          <span class="text-xs text-gray-500 mt-2 block">예: 서초탁구장, 강남체육관</span>
        </p>
      </div>
      <button
        @click="showAddressErrorModal = false"
        class="w-full bg-orange-500 text-white font-semibold py-3 rounded-xl hover:bg-orange-600 transition shadow"
      >
        확인
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, nextTick } from 'vue'
import GameIntro from '../../components/game-create/GameIntro.vue'
import RuleIntro from '../../components/game-create/RuleIntro.vue'
import RuleSelectPage from '../../components/game-create/RuleSelectPage.vue'
import RuleCreateWizard from '../../components/game-create/RuleCreateWizard.vue'
import RuleAIGenerating from '../../components/game-create/RuleAIGenerating.vue'
import RuleResultPage from '../../components/game-create/RuleResultPage.vue'
import GameModeSelect from '../../components/game-create/GameModeSelect.vue'
import PlaceSelectPage from '../../components/game-create/PlaceSelect.vue'
import TimeSelectPage from '../../components/game-create/TimeSelect.vue'
import GameFinalPage from '../../components/game-create/GameFinalPage.vue'
import api from '../../api/api'
import { parseRegion } from '../../utils/regionParser'
import { useRoute, useRouter } from 'vue-router'
const route = useRoute()
const router = useRouter()

// 스텝 갯수 줄임 (14+6)
const totalSteps = 20
const step = ref(1)
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

const gameForm = reactive({
  ruleId: null,
  friendId: null,
  placeRoad: '',
  placeDetail: '',
  time: '',
})

// 장소/진행 모달 상태
const showAddressModal = ref(false)
const searchQuery = ref('')
const selectedPlace = ref(null)

// 시작 전 확인 모달 상태
const showCountdownModal = ref(false)
const countdownDurationText = ref('')
const showAddressErrorModal = ref(false)

// 생성된 게임 ID
const currentGameId = ref(null)

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

/**
 *
 * @param mode friend game일 땐 friend의 userId가 넘어온다.
 */
function onModeSelect(mode) {
  if (mode != 'random') {
    friendSelect(mode) // 이 경우 mode는 userId임
  } else step.value = 18
}

async function friendSelect(friendId) {
  gameForm.friendId = friendId
  // 바로 시작 플로우: 기본 경기 시각은 현재로 설정
  gameForm.time = new Date()

  // 장소 초기화 후 모달 오픈
  searchQuery.value = ''
  selectedPlace.value = null
  showAddressModal.value = true

  nextTick(() => {
    initGoogleAutocompleteWizard()
  })
}

function onPlaceSelect(data) {
  gameForm.placeRoad = data.placeRoad
  gameForm.placeDetail = data.placeDetail
  step.value = 19
}

function onTimeSelect(time) {
  gameForm.time = time
  step.value = 20
  createGame()
}

/**
 * createGame과 차이는, 참가자가 확정된 상태라는 것임.
 */
async function createFriendGame() {
  try {
    const payload = {
      referencedRuleId: gameForm.ruleId,
      friendId: gameForm.friendId,
      placeRoad: gameForm.placeRoad,
      placeDetail: gameForm.placeDetail,
      matchDate: gameForm.time,
    }
    const gameIdRes = await api.post('/api/games/create-friend-game', payload)
    return gameIdRes.data
  } catch (e) {
    alert('게임 생성 실패: ' + (e.response?.data?.message ?? e.message))
  }
}

async function createGame() {
  try {
    const payload = {
      referencedRuleId: gameForm.ruleId,
      friendId: gameForm.friendId,
      placeRoad: gameForm.placeRoad,
      placeDetail: gameForm.placeDetail,
      matchDate: gameForm.time,
    }
    const gameIdRes = await api.post('/api/games/create', payload)
    return gameIdRes.data
  } catch (e) {
    alert('게임 생성 실패: ' + (e.response?.data?.message ?? e.message))
  }
}

function formatDurationText(durationSec) {
  if (durationSec === -1) return '제한 없음'
  const min = Math.floor(durationSec / 60)
  const sec = durationSec % 60
  return (min ? `${min}분 ` : '') + (sec ? `${sec}초` : min ? '' : '0초')
}

const addressInputWizard = ref(null)
let autocompleteWizard = null

function initGoogleAutocompleteWizard() {
  if (window.google?.maps?.places && addressInputWizard.value) {
    autocompleteWizard = new window.google.maps.places.Autocomplete(addressInputWizard.value, {
      componentRestrictions: { country: 'kr' },
      fields: ['formatted_address', 'address_components', 'geometry', 'name'],
      types: ['establishment', 'geocode']
    })

    autocompleteWizard.addListener('place_changed', () => {
      const place = autocompleteWizard.getPlace()
      if (place.geometry && place.formatted_address) {
        console.log('Original address:', place.formatted_address)

        // 주소 파싱 및 검증
        const parsed = parseRegion(place.formatted_address)

        if (!parsed) {
          showAddressErrorModal.value = true
          searchQuery.value = ''
          selectedPlace.value = null
          return
        }

        console.log('Parsed:', parsed)

        selectedPlace.value = {
          name: place.name || '',
          address: parsed.fullAddress, // "경기 수원시 영통구 ..." 형태
          region1: parsed.region1, // "경기" (변환됨)
          region2: parsed.region2, // "수원시 영통구"
          geometry: place.geometry
        }

        console.log('selectedPlace:', selectedPlace.value)
      }
    })
  }
}

function clearSelection() {
  selectedPlace.value = null
  searchQuery.value = ''
}

async function submitAndStartGame() {
  if (!selectedPlace.value) {
    alert('장소를 선택해주세요.')
    return
  }

  // gameForm에 장소 반영
  gameForm.placeRoad = selectedPlace.value.address
  gameForm.placeDetail = selectedPlace.value.name

  console.log('Submitting:', {
    placeRoad: gameForm.placeRoad,
    placeDetail: gameForm.placeDetail
  })

  // 게임 생성
  const gameId = await createFriendGame()
  if (!gameId) return
  currentGameId.value = gameId

  // 규칙 duration 조회 (확인 모달 안내용)
  let duration = -1
  try {
    const { data: rule } = await api.get(`/api/rules/${gameForm.ruleId}`)
    duration = rule?.duration ?? -1
  } catch (_) {
    // ignore
  }
  countdownDurationText.value = formatDurationText(duration)

  // 모달 전환
  showAddressModal.value = false
  showCountdownModal.value = true
}

async function confirmStartGame() {
  if (!currentGameId.value) return
  try {
    await api.post(`/api/games/${currentGameId.value}/start`)
    showCountdownModal.value = false
    router.push(`/games/${currentGameId.value}/play`)
  } catch (e) {
    alert('게임 시작 실패: ' + (e.response?.data?.message ?? e.message))
  }
}

function closeModal() {
  showAddressModal.value = false
  searchQuery.value = ''
  selectedPlace.value = null
  currentGameId.value = null
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
