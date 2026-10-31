<template>
  <HeaderComp
    :has-referer="true"
    :show-bell="false"
    :show-dm="false"
    custom-class="bg-gray-900"
  />

  <div class="pt-7 raspy-top h-full">
    <!-- 규칙은 /rules에서 고르고 돌아온다. 여기서는 상대만 정하면 경기가 열린다.
         장소·시간은 상대가 정해진 뒤 함께 정한다 (장소는 경기 시작 때 다시 고른다) -->
    <RuleSelectPage v-if="step === 2" @select="onRuleSelected" @back="goToRuleView" />
    <GameModeSelect v-if="step === 3" @mode="onModeSelect" :is-contest="isContest" />
    <GameFinalPage v-if="step === 6" :game="gameForm" />
  </div>

  <!-- 주소 오류 모달 -->
  <div
    v-if="showAddressErrorModal"
    class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
  >
    <div class="bg-gray-800 p-6 m-5 rounded-2xl w-full max-w-sm shadow-2xl">
      <div class="text-center mb-4">
        <i class="fas fa-exclamation-triangle text-orange-500 text-4xl mb-3"></i>
        <h3 class="text-lg font-bold text-gray-100 mb-2">장소를 찾을 수 없습니다</h3>
        <p class="text-sm text-gray-400">
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
import { ref, reactive, onMounted } from 'vue'
import RuleSelectPage from '../../components/game-create/RuleSelectPage.vue'
import GameModeSelect from '../../components/game-create/GameModeSelect.vue'
import GameFinalPage from '../../components/game-create/GameFinalPage.vue'
import api from '../../api/api'
import { useRoute, useRouter } from 'vue-router'
const route = useRoute()
const router = useRouter()

const step = ref(1)

const gameForm = reactive({
  ruleId: null,
  friendId: null,
  placeRoad: '',
  placeDetail: '',
  time: '',
})

const showAddressErrorModal = ref(false)
const isContest = ref(false)

onMounted(() => {
  // 최초 마운트 시 쿼리 파라미터 체크
  const ruleId = route.query.ruleId
  const contest = route.query.contest

  if (contest === 'true') {
    isContest.value = true
  }

  if (ruleId && !isNaN(Number(ruleId))) {
    gameForm.ruleId = Number(ruleId)
    step.value = 3 // GameModeSelect로 바로 이동
  } else {
    // ruleId가 없으면 바로 RuleView로 이동
    router.push('/rules?fromGameCreate=true')
  }
})

function goToRuleView() {
  router.push('/rules?fromGameCreate=true')
}

function onRuleSelected(rule) {
  gameForm.ruleId = rule.id
  step.value = 3 // GameModeSelect로 이동
}

/**
 *
 * @param mode friend game일 땐 friend의 userId가 넘어온다.
 */
function onModeSelect(mode) {
  if (mode != 'random') {
    // 친구를 선택한 경우: friendId만 저장하고 다음 단계로 진행
    gameForm.friendId = mode // mode는 userId임
  } else {
    // 건너뛰기를 선택한 경우: friendId는 null로 유지
    gameForm.friendId = null
  }
  // 장소·시간은 비워서 연다: 장소는 프로필 지역으로 표시되고, 시간은 '시간 미정'
  gameForm.placeRoad = null
  gameForm.placeDetail = null
  gameForm.time = null
  step.value = 6 // GameFinalPage로 이동
  createGame()
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

    // friendId가 있으면 친구와의 경기 생성, 없으면 일반 경기 생성
    const endpoint = gameForm.friendId
      ? '/api/games/create-friend-game'
      : '/api/games/create'

    const gameIdRes = await api.post(endpoint, payload)
    return gameIdRes.data
  } catch (e) {
    alert('경기 생성 실패: ' + (e.response?.data?.message ?? e.message))
  }
}

</script>

<style scoped>
.raspy-top {
  background: #262626;
}

.progress-bar-outer {
  width: 92dvw;
  height: 7px;
  background: #737373;
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
