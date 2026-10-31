<template>
  <div
    v-if="game && user1 && user2"
    class="w-dvw h-dvh flex flex-col px-4 relative bg-gray-900 text-gray-100 overflow-hidden"
    style="
      padding-top: clamp(0.5rem, 1.5vh, 0.75rem);
      padding-bottom: clamp(0.5rem, 1.5vh, 0.75rem);
    "
  >
    <!-- Reconnecting Overlay -->
    <div
      v-if="socketStatus === 'connecting'"
      class="fixed inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-[100]"
    >
      <div class="text-white text-2xl font-bold">
        <i class="fas fa-sync-alt fa-spin mr-3"></i>
        재연결 중...
      </div>
      <div class="text-gray-400 mt-2">네트워크 연결을 확인해주세요.</div>
    </div>

    <div class="flex items-center justify-between mb-2">
      <button @click="goBack" class="text-white text-lg">
        <i class="fas fa-chevron-left text-xl"></i>
      </button>
    </div>

    <!-- 경기 정보 섹션 -->
    <div class="flex-shrink-0">
      <div class="flex items-center w-full" style="gap: clamp(0.25rem, 1vw, 0.5rem)">
        <!-- Info Cards: 세트 승점, 세트 수, 세트 시간 -->
        <div class="flex w-full" style="gap: clamp(0.25rem, 0.5vw, 0.5rem)">
          <div
            class="flex-1 flex flex-col justify-center bg-gray-700 text-white rounded-xl text-center shadow-lg border border-gray-600"
            style="
              min-height: 60px;
              padding: clamp(0.5rem, 1.5vh, 0.625rem) clamp(0.375rem, 1.5vw, 0.5rem);
            "
          >
            <div class="flex flex-col items-center justify-center gap-1">
              <div
               class="flex items-center justify-center font-medium"
                style="font-size: clamp(0.65rem, 1.3vh, 0.75rem)"
              >
                <i class="fas fa-bullseye"></i>
                <span class="ml-1 text-gray-100 font-medium">세트 승점</span>
              </div>
              <div
                class="flex items-center justify-center text-orange-400 font-extrabold"
                style="font-size: clamp(0.75rem, 1.6vh, 0.9rem)"
              >
                {{ game.rule.pointsToWin == -1 ? '제한 없음' : game.rule.pointsToWin }}
              </div>
            </div>
          </div>
          <div
            class="flex-1 flex flex-col justify-center bg-gradient-to-br from-gray-700 to-gray-800 text-white rounded-xl text-center shadow-lg border border-gray-600"
            style="
              min-height: 60px;
              padding: clamp(0.5rem, 1.5vh, 0.625rem) clamp(0.375rem, 1.5vw, 0.5rem);
            "
          >
            <div class="flex flex-col items-center justify-center gap-1">
              <div
               class="flex items-center justify-center font-medium"
                style="font-size: clamp(0.65rem, 1.3vh, 0.75rem)"
              >
                <i class="fas fa-layer-group"></i>
                <span class="ml-1 text-gray-100 font-medium">세트 수</span>
              </div>
              <div
                class="flex items-center justify-center text-orange-400 font-extrabold"
                style="font-size: clamp(0.75rem, 1.6vh, 0.9rem)"
              >
                {{ game.rule.setsToWin }}
              </div>
            </div>
          </div>
          <div
            class="flex-1 flex flex-col justify-center bg-gradient-to-br from-gray-700 to-gray-800 text-white rounded-xl text-center shadow-lg border border-gray-600"
            style="
              min-height: 60px;
              padding: clamp(0.5rem, 1.5vh, 0.625rem) clamp(0.375rem, 1.5vw, 0.5rem);
            "
          >
            <div class="flex flex-col items-center justify-center gap-1">
              <div
               class="flex items-center justify-center font-medium"
                style="font-size: clamp(0.65rem, 1.3vh, 0.75rem)"
              >
                <i class="far fa-clock"></i>
                <span class="ml-1 text-gray-100 font-medium">세트 시간</span>
              </div>
              <div
                class="flex items-center justify-center text-orange-400 font-extrabold"
                style="font-size: clamp(0.75rem, 1.6vh, 0.9rem)"
              >
                {{ limitTimeStr }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        class="w-full flex justify-end"
        style="margin-top: clamp(0.375rem, 1vh, 0.5rem); gap: clamp(0.375rem, 1vw, 0.5rem)"
      >
        <button
          @click="showLogModal = true"
         class="bg-gradient-to-br from-gray-600 to-gray-700 text-white rounded-lg font-medium shadow-md hover:from-gray-700 hover:to-gray-800 hover:scale-105 transition-all duration-200"
          style="
            padding: clamp(0.375rem, 1.2vh, 0.5rem) clamp(0.625rem, 2.5vw, 0.875rem);
            font-size: clamp(0.7rem, 2vw, 0.8rem);
          "
        >
          <i class="fas fa-list mr-1"></i>로그 보기
        </button>
        <button
         class="bg-gradient-to-br from-gray-600 to-gray-700 text-white rounded-lg font-medium shadow-md hover:from-gray-700 hover:to-gray-800 hover:scale-105 transition-all duration-200"
          style="
            padding: clamp(0.375rem, 1.2vh, 0.5rem) clamp(0.625rem, 2.5vw, 0.875rem);
            font-size: clamp(0.7rem, 2vw, 0.8rem);
          "
          @click="game.showRuleDetail = true"
        >
          <i class="fas fa-book mr-1"></i>규칙 보기
        </button>
      </div>
    </div>
    <!-- 점수판 섹션 (중앙 영역 - flex-1로 남은 공간 차지) -->
    <div class="flex-1 flex flex-col items-center justify-center relative min-h-0 py-0">
      <div class="flex flex-col items-center" style="gap: clamp(0.125rem, 0.5vh, 0.25rem)">
        <div
         class="font-medium"
          style="font-size: clamp(1.125rem, 3vh, 1.5rem)"
          :class="
            game.limitSeconds !== -1 && elapsedSeconds >= game.limitSeconds
              ? 'text-red-500 animate-pulse'
              : 'text-orange-400'
          "
        >
          {{ elapsedTimeStr }}, 세트 {{ currentSet }}
        </div>
        <div
          v-if="game.limitSeconds !== -1 && elapsedSeconds >= game.limitSeconds"
          class="text-xs text-red-400 font-semibold"
        >
          추가시간
        </div>
      </div>
      <div class="flex w-full items-start justify-center">
        <div class="flex flex-col items-center justify-center w-full">
          <div
            class="flex items-center justify-center w-full"
            style="margin-bottom: clamp(0.25rem, 1vh, 0.5rem)"
          >
            <div class="flex items-end">
              <span
                class="font-extrabold text-orange-500"
                style="font-size: clamp(4rem, 15vh, 10rem); line-height: 1"
                >{{ currentScore1 }}</span
              >
              <span
               class="font-medium text-orange-400"
                style="
                  position: relative;
                  top: 0.1em;
                  font-size: clamp(1.5rem, 4vh, 3rem);
                  margin-left: clamp(0.25rem, 1vw, 0.5rem);
                "
                >{{ user1SetsWon }}</span
              >
            </div>
            <div
              class="flex items-center"
              style="margin-left: clamp(0.5rem, 2vw, 1rem); margin-right: clamp(0.5rem, 2vw, 1rem)"
            >
              <span class="font-medium text-orange-500" style="font-size: clamp(2.5rem, 7vh, 5rem)"
                >:</span
              >
            </div>
            <div class="flex items-end">
              <span
                class="font-extrabold text-orange-500"
                style="font-size: clamp(4rem, 15vh, 10rem); line-height: 1"
                >{{ currentScore2 }}</span
              >
              <span
               class="font-medium text-orange-400"
                style="
                  position: relative;
                  top: 0.1em;
                  font-size: clamp(1.5rem, 4vh, 3rem);
                  margin-left: clamp(0.25rem, 1vw, 0.5rem);
                "
                >{{ user2SetsWon }}</span
              >
            </div>
          </div>
          <div
            class="flex flex-row w-full justify-between"
            style="margin-top: clamp(0.25rem, 1vh, 0.5rem)"
          >
            <div class="flex flex-col items-center flex-1">
              <img
                :src="user1.profileUrl ? user1.profileUrl : DefaultImage"
                class="aspect-square object-cover rounded-full border-2 border-orange-500 shadow-lg"
                style="
                  width: clamp(44px, 12vh, 100px);
                  height: clamp(44px, 12vh, 100px);
                  margin-bottom: clamp(0.25rem, 1vh, 0.5rem);
                "
              />
              <div class="font-medium mb-1" style="font-size: clamp(0.875rem, 2.5vh, 1.125rem)">
                {{ user1.nickname }}
              </div>
              <div
                class="flex flex-col items-center w-full"
                style="gap: clamp(0.375rem, 1.5vh, 0.5rem); margin-top: clamp(0.25rem, 1vh, 0.5rem)"
              >
                <button
                  @click="socket_sendScore(1, 1)"
                  :disabled="isSetOver || isGameOver || isCountingDown"
                 class="bg-gray-700 text-gray-100 w-[28vw] sm:w-[38dvw] py-2 sm:py-3 rounded-t-xl rounded-b-none shadow hover:scale-110 transition text-[2rem] sm:text-[2.8rem] font-medium max-w-[140px] sm:max-w-[180px] min-w-[64px] sm:min-w-[90px] disabled:opacity-50 disabled:cursor-not-allowed"
                  style="
                    border-top-left-radius: 0.5rem;
                    border-top-right-radius: 0.5rem;
                    border-bottom-left-radius: 0;
                    border-bottom-right-radius: 0;
                  "
                >
                  +
                </button>
                <button
                  @click="socket_sendScore(1, -1)"
                  :disabled="isSetOver || isGameOver || isCountingDown || currentScore1 <= 0"
                  class="bg-gray-700 text-gray-100 w-[28vw] sm:w-[38dvw] py-2 sm:py-3 rounded-b-xl rounded-t-none shadow hover:scale-110 transition text-[2rem] sm:text-[2.8rem] font-bold max-w-[140px] sm:max-w-[180px] min-w-[64px] sm:min-w-[90px] disabled:opacity-50 disabled:cursor-not-allowed"
                  style="
                    border-bottom-left-radius: 0.5rem;
                    border-bottom-right-radius: 0.5rem;
                    border-top-left-radius: 0;
                    border-top-right-radius: 0;
                  "
                >
                  -
                </button>
              </div>
            </div>
            <div class="flex flex-col items-center flex-1">
              <img
                :src="user2.profileUrl ? user2.profileUrl : DefaultImage"
                class="aspect-square object-cover rounded-full border-2 border-orange-500 shadow-lg"
                style="
                  width: clamp(44px, 12vh, 100px);
                  height: clamp(44px, 12vh, 100px);
                  margin-bottom: clamp(0.25rem, 1vh, 0.5rem);
                "
              />
              <div class="font-medium mb-1" style="font-size: clamp(0.875rem, 2.5vh, 1.125rem)">
                {{ user2.nickname }}
              </div>
              <div
                class="flex flex-col items-center w-full"
                style="gap: clamp(0.375rem, 1.5vh, 0.5rem); margin-top: clamp(0.25rem, 1vh, 0.5rem)"
              >
                <button
                  @click="socket_sendScore(2, 1)"
                  :disabled="isSetOver || isGameOver || isCountingDown"
                 class="bg-gray-700 text-gray-100 w-[28vw] sm:w-[38dvw] py-2 sm:py-3 rounded-t-xl rounded-b-none shadow hover:scale-110 transition text-[2rem] sm:text-[2.8rem] font-medium max-w-[140px] sm:max-w-[180px] min-w-[64px] sm:min-w-[90px] disabled:opacity-50 disabled:cursor-not-allowed"
                  style="
                    border-top-left-radius: 0.5rem;
                    border-top-right-radius: 0.5rem;
                    border-bottom-left-radius: 0;
                    border-bottom-right-radius: 0;
                  "
                >
                  +
                </button>
                <button
                  @click="socket_sendScore(2, -1)"
                  :disabled="isSetOver || isGameOver || isCountingDown || currentScore2 <= 0"
                  class="bg-gray-700 text-gray-100 w-[28vw] sm:w-[38dvw] py-2 sm:py-3 rounded-b-xl rounded-t-none shadow hover:scale-110 transition text-[2rem] sm:text-[2.8rem] font-bold max-w-[140px] sm:max-w-[180px] min-w-[64px] sm:min-w-[90px] disabled:opacity-50 disabled:cursor-not-allowed"
                  style="
                    border-bottom-left-radius: 0.5rem;
                    border-bottom-right-radius: 0.5rem;
                    border-top-left-radius: 0;
                    border-top-right-radius: 0;
                  "
                >
                  -
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 하단 버튼 섹션 -->
    <div
      class="flex-shrink-0 w-full flex flex-col items-stretch"
      style="gap: clamp(0.5rem, 1.5vh, 0.75rem)"
    >
      <!-- 세트 종료 버튼과 카메라 버튼들 -->
      <div class="flex items-center justify-between" style="gap: clamp(0.5rem, 1.5vw, 0.75rem)">
        <button
          v-if="!isSetOver && !isGameOver && !isCountingDown"
          @click="manualFinishSet"
         class="flex-1 bg-orange-600 text-white rounded-xl font-bold shadow-lg hover:brightness-110 transition"
          style="
            padding: clamp(0.75rem, 2vh, 1rem) clamp(0.75rem, 2vw, 1rem);
            font-size: clamp(0.875rem, 2.5vh, 1.125rem);
          "
        >
          <i class="fas fa-flag-checkered mr-2"></i>세트 종료
        </button>
        <div class="flex" style="gap: clamp(0.375rem, 1vw, 0.5rem)">
          <button
            @click="triggerPhotoCapture"
            :disabled="isCountingDown"
            :class="[
'w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition',
 isCountingDown
 ?'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
 :' bg-orange-500 text-white hover:scale-110',
 ]"
            title="사진 촬영"
          >
            <i class="fas fa-camera text-xl"></i>
          </button>
          <button
            @click="triggerVideoCapture"
            :disabled="isCountingDown"
            :class="[
'w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition',
 isCountingDown
 ?'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
 :' bg-blue-500 text-white hover:scale-110',
 ]"
            title="동영상 촬영"
          >
            <i class="fas fa-video text-xl"></i>
          </button>
        </div>
      </div>

      <div class="w-full grid grid-cols-2 mb-10" style="gap: clamp(0.375rem, 1vw, 0.5rem)">
        <button
          @click="openConfirm('정말로 경기를 재시작 하겠습니까?', socket_resetGame)"
         class=" bg-blue-500 text-white rounded-xl font-medium shadow-lg hover:bg-blue-600 hover:scale-105 transition-all duration-200"
          style="
            padding: clamp(0.75rem, 2vh, 1rem) clamp(0.75rem, 2vw, 1rem);
            font-size: clamp(0.875rem, 2.5vh, 1.125rem);
          "
        >
          <i class="fas fa-redo mr-2"></i>처음부터
        </button>
        <button
          @click="openConfirm('정말로 경기를 즉시 종료합니까?', socket_finishGame)"
         class=" bg-red-500 text-white rounded-xl font-bold shadow-lg hover:bg-red-600 hover:scale-105 transition-all duration-200"
          style="
            padding: clamp(0.75rem, 2vh, 1rem) clamp(0.75rem, 2vw, 1rem);
            font-size: clamp(0.875rem, 2.5vh, 1.125rem);
          "
        >
          <i class="fas fa-stop-circle mr-2"></i>경기 끝내기
        </button>
      </div>
      <!-- Google AdMob Style Banner -->
      <!-- <div class="w-full flex justify-center mt-2 sm:mt-4 fixed bottom-0">
        <div
          class="w-full max-w-xs sm:max-w-md h-8 bg-gray-900 border border-gray-700 rounded-lg flex items-center shadow-sm mx-1 sm:mx-2 relative"
          style="box-sizing: border-box;"
        >
          <div class="absolute top-0 left-0 bg-gray-800 text-gray-500 text-xs px-1 py-0.5 rounded-tl-lg rounded-br-sm font-medium">
            광고
          </div>
          <div class="flex-1 flex items-center justify-center text-gray-200 text-xs font-medium">
            클래시오브클랜 <span class="text-orange-500 font-medium">회원</span> 모집중!
          </div>
        </div>
      </div> -->
    </div>

    <!-- 5초 카운트다운 오버레이 -->
    <div
      v-if="isCountingDown"
      class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60]"
    >
      <div class="text-center">
        <div class="text-orange-400 text-xl sm:text-2xl font-bold mb-4">
          세트 {{ currentSet }} 시작까지
        </div>
        <div class="text-orange-500 text-[25vw] sm:text-[30vw] font-medium animate-countdown">
          {{ countdown }}
        </div>
        <div class="text-gray-400 text-base sm:text-lg mt-4">준비하세요!</div>
      </div>
    </div>

    <div
      v-if="showStartButton"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div
        class=" bg-gray-700 rounded-2xl p-8 flex justify-center items-center shadow-2xl w-[90%] max-w-md border border-gray-600"
      >
        <button
          @click="(startSet(), (showStartButton = false))"
         class=" bg-blue-500 w-full min-w-[240px] sm:min-w-[320px] text-white px-8 py-4 rounded-full text-xl font-bold shadow-lg hover:bg-blue-600 transition-all duration-200 hover:scale-105 whitespace-nowrap"
        >
          1세트 시작
        </button>
      </div>
    </div>

    <div
      v-if="isSetOver && !isGameOver"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div
        class=" bg-gray-700 rounded-2xl p-8 flex justify-center items-center shadow-2xl w-[90%] max-w-md border border-gray-600"
      >
        <button
          @click="socket_nextSet"
         class=" bg-orange-500 w-full min-w-[240px] sm:min-w-[320px] text-white px-8 py-4 rounded-full text-xl font-bold shadow-lg hover:bg-orange-600 transition-all duration-200 hover:scale-105 whitespace-nowrap"
        >
          {{ currentSet }}세트 시작
        </button>
      </div>
    </div>

    <!-- 경기 종료시 모달 제거 -->

    <!-- MatchModal: 규칙 모달 -->
    <MatchModal v-if="game.showRuleDetail" :rule="game.rule" @close="game.showRuleDetail = false" />

    <!-- 커스텀 confirm 모달 -->
    <div
      v-if="showConfirm"
      class="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center"
    >
      <div class="bg-gray-800 w-full max-w-xs rounded-xl shadow-lg p-7 text-center">
        <div class="mb-5 text-lg font-bold text-gray-100">{{ confirmMessage }}</div>
        <div class="flex justify-center gap-3 mt-4">
          <button
            @click="closeConfirm"
            class="px-5 py-2 bg-gray-700 text-gray-100 rounded-full font-medium text-sm"
          >
            취소
          </button>
          <button
            @click="confirmCallbackWrapper"
            class="px-6 py-2 bg-orange-600 text-white rounded-full font-medium text-sm shadow hover:bg-orange-400"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- 숨겨진 카메라 input -->
  <input
    ref="cameraInputRef"
    type="file"
    accept="image/*"
    capture="environment"
    @change="onCameraChange"
    class="hidden"
  />

  <!-- 숨겨진 동영상 input -->
  <input
    ref="videoInputRef"
    type="file"
    accept="video/mp4,video/quicktime,video/*"
    @change="onVideoChange"
    class="hidden"
  />

  <div
    v-if="showLogModal"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
  >
    <div class="bg-gray-800 rounded-xl p-4 shadow-lg w-[90%] max-w-md max-h-[70vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-3">
        <div class="text-lg font-bold text-gray-100">전체 로그</div>
        <button @click="showLogModal = false" class="text-orange-400 text-sm">닫기</button>
      </div>
      <div class="flex flex-col space-y-1">
        <div
          v-for="(log, index) in logs"
          :key="index"
          class="text-xs bg-gray-700 border border-gray-600 rounded-md px-2 py-1 shadow-sm flex items-center justify-between text-gray-100"
        >
          <div class="flex-1 truncate">
            <span class="text-xs text-gray-400 mr-1">[{{ log.elapsed }}]</span>
            {{ log.message }}
          </div>
        </div>
      </div>
    </div>
  </div>

  <CustomToast />
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../api/api'
import { socket } from '../../websocket'
import DefaultImage from '../../assets/default.png'
import MatchModal from '../../components/MatchModal.vue'
import CustomToast from '../../components/CustomToast.vue'
import { useToast } from '../../composable/useToast'
import {
  addGamePicture,
  addGameVideo,
  compressImage,
  compressVideo,
} from '../../utils/gamePictureStorage'

const route = useRoute()
const router = useRouter()
const { showToast } = useToast()
const gameId = route.params.gameId

// 소켓 연결 상태
const socketStatus = ref('connected') // 'connected', 'connecting', 'disconnected'

// 카메라 관련 상태
const cameraInputRef = ref(null)
const videoInputRef = ref(null)
const game = reactive({})
const chatRoomId = ref(null)
const currentSet = ref(1)
const currentScore1 = ref(0)
const currentScore2 = ref(0)
const user1SetsWon = ref(0)
const user2SetsWon = ref(0)
const isSetOver = ref(false)
const isGameOver = ref(false)
const showFinishModal = ref(false)
const winner = ref('-')
const elapsedSeconds = ref(0)
const elapsedTimeStr = ref('00:00')
const limitTimeStr = ref('')
const timerRef = ref(null)
const logs = ref([])
const user1 = ref(null)
const user2 = ref(null)
const gameWinner = ref('')
const showLogModal = ref(false)
const showStartButton = ref(false)
const countdown = ref(0)
const isCountingDown = ref(false)
const timeOverNotified = ref(false)

// confirm 관련 상태
const showConfirm = ref(false)
const confirmMessage = ref('')
let confirmCallback = null
const confirmCallbackWrapper = () => {
  showConfirm.value = false
  if (typeof confirmCallback === 'function') confirmCallback()
}
const openConfirm = (msg, cb) => {
  confirmMessage.value = msg
  showConfirm.value = true
  confirmCallback = cb
}
const closeConfirm = () => {
  showConfirm.value = false
  confirmCallback = null
}

function startSet() {
  currentScore1.value = 0
  currentScore2.value = 0
  isSetOver.value = false
  showFinishModal.value = false
  winner.value = '-'

  // 5초 카운트다운 시작
  isCountingDown.value = true
  countdown.value = 5

  const countdownInterval = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(countdownInterval)
      isCountingDown.value = false
      // 카운트다운 종료 후 세트 시작
      game.setStartedAt = new Date()
      elapsedSeconds.value = 0
      updateElapsed()
      startTimer()
    }
  }, 1000)
}

function addScore(userIdx, delta) {
  if (isSetOver.value || isGameOver.value || isCountingDown.value) return

  if (userIdx == user1.value.id) {
    // pointsToWin이 설정되어 있으면 그 이상으로 증가 불가
    if (game.rule.pointsToWin !== -1 && delta > 0 && currentScore1.value >= game.rule.pointsToWin) {
      return
    }
    currentScore1.value = Math.max(0, currentScore1.value + delta)
  } else {
    // pointsToWin이 설정되어 있으면 그 이상으로 증가 불가
    if (game.rule.pointsToWin !== -1 && delta > 0 && currentScore2.value >= game.rule.pointsToWin) {
      return
    }
    currentScore2.value = Math.max(0, currentScore2.value + delta)
  }

  checkSetOver()
}

function checkSetOver() {
  // pointsToWin 도달 시에만 자동으로 세트 종료
  if (game.rule.pointsToWin != -1 && currentScore1.value >= game.rule.pointsToWin) {
    user1SetsWon.value++
    finishSet(1)
    return
  }
  if (game.rule.pointsToWin != -1 && currentScore2.value >= game.rule.pointsToWin) {
    user2SetsWon.value++
    finishSet(2)
    return
  }

  // 제한시간이 지나도 세트를 자동 종료하지 않음 (UI만 빨간색으로 표시)
  // 수동으로 '세트종료' 버튼을 눌러야 다음 세트로 진행
}

function manualFinishSet() {
  // 수동으로 세트 종료 (시간 초과 시)
  if (game.rule.winBy == 'MOST_SETS_AND_POINTS') {
    if (currentScore1.value > currentScore2.value) {
      user1SetsWon.value++
      finishSet(1)
    } else if (currentScore2.value > currentScore1.value) {
      user2SetsWon.value++
      finishSet(2)
    } else {
      finishSet(0) // 무승부
    }
  } else {
    finishSet(0) // 무승부
  }
}

function finishSet(who) {
  isSetOver.value = true
  clearInterval(timerRef.value)
  if (who === 1) {
    winner.value = user1.value.nickname
  } else if (who === 2) {
    winner.value = user2.value.nickname
  }
  showFinishModal.value = true
  const setsToWin = game.rule.setsToWin
  const requiredWins = Math.ceil(setsToWin / 2)
  if (user1SetsWon.value >= requiredWins || user2SetsWon.value >= requiredWins) {
    isGameOver.value = true
    isSetOver.value = false
    socket_finishGame()
    goToResult()
  } else {
    currentSet.value++
  }
}

function startTimer() {
  if (isGameOver.value) return
  clearInterval(timerRef.value)
  updateElapsed()
  timerRef.value = setInterval(updateElapsed, 1000)
}

function updateElapsed() {
  if (!game.setStartedAt || isSetOver.value || isCountingDown.value) return
  const startedAt = new Date(game.setStartedAt)
  const now = new Date()
  const elapsed = Math.floor((now - startedAt) / 1000)

  // 제한시간이 있는 경우 시간 계산
  if (game.limitSeconds !== -1) {
    elapsedSeconds.value = elapsed
    // 남은 시간 계산 (0 미만 가능 - 오버타임)
    const remainingSeconds = game.limitSeconds - elapsed
    elapsedTimeStr.value = getTimeStr(Math.abs(remainingSeconds))
    limitTimeStr.value = getTimeStr(game.limitSeconds)
  } else {
    // 제한 없음
    elapsedSeconds.value = elapsed
    elapsedTimeStr.value = getTimeStr(elapsedSeconds.value)
    limitTimeStr.value = '제한 없음'
  }

  if (!isSetOver.value && !isGameOver.value) {
    checkSetOver()
  }

  // 시간 초과 알림
  if (
    game.limitSeconds !== -1 &&
    elapsedSeconds.value >= game.limitSeconds &&
    !timeOverNotified.value
  ) {
    timeOverNotified.value = true
    // 진동
    if (navigator.vibrate) {
      navigator.vibrate(500)
    }
    // 소리 (브라우저 기본 알림음 사용, 파일이 없으면 무시)
    try {
      const audio = new Audio('/notification.mp3')
      audio.play()
    } catch (e) {
      // 무시
    }
  }
}

function getTimeStr(seconds) {
  if (seconds <= 0) return '00:00'
  const min = Math.floor(seconds / 60)
  const sec = seconds % 60
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(min)}:${pad(sec)}`
}

function goToResult() {
  router.push(`/games/${gameId}/result`)
}

function goBack() {
  router.back()
}

function handleVisibilityChange() {
  if (document.visibilityState === 'visible') {
    // 페이지가 다시 활성화될 때 소켓 연결을 시도합니다.
    // socket.connect 내부 로직에 의해 이미 연결된 상태라면 아무 작업도 수행하지 않습니다.
    socket.connect(chatRoomId.value)

    updateElapsed()
    if (!isSetOver.value && !isGameOver.value) {
      startTimer()
    }
  }
}

function addLog(log) {
  const start = new Date(game.totalGameStartedAt)
  const current = new Date(log.time)
  const diffSec = Math.floor((current - start) / 1000)
  const minutes = String(Math.floor(diffSec / 60)).padStart(2, '0')
  const seconds = String(diffSec % 60).padStart(2, '0')
  const elapsed = `${minutes}:${seconds}`

  let message = ''
  if (log.type === 'SCORE') {
    message = `${log.targetId == user1.value.id ? user1.value.nickname : user2.value.nickname} ${log.delta}점 ${log.delta > 0 ? '득점' : '실점'} (변경자 - ${log.userSummary.nickname})`
  } else if (log.type === 'SET') {
    message = `${log.userSummary.nickname} 세트를 증가시킴`
  } else if (log.type === 'RESET') {
    message = `${log.userSummary.nickname} 경기를 리셋함`
  } else if (log.type === 'FINISH') {
    message = `경기가 종료되었습니다!`
  } else {
    message = '알 수 없는 이벤트'
  }

  logs.value.push({
    elapsed,
    message,
    type: log.type,
    user: log.userSummary,
  })
}

onMounted(async () => {
  // 안드로이드 네이티브 카메라 콜백 등록
  if (typeof window !== 'undefined') {
    // 사진 촬영 콜백 핸들러
    const handleCameraResult = async (base64Image) => {
      try {
        console.log('Received photo from native camera')
        const compressed = await compressImage(base64Image)
        await addGamePicture(gameId, compressed)
        showToast('사진이 저장되었습니다!')
      } catch (error) {
        console.error('Failed to process camera image:', error)
        if (error.message === 'QUOTA_EXCEEDED') {
          showToast('저장 공간이 부족합니다.')
        } else {
          showToast('사진 저장에 실패했습니다.')
        }
      }
    }

    // 동영상 촬영 콜백 핸들러
    const handleVideoCameraResult = async (base64Video, duration) => {
      try {
        console.log('Received video from native camera')
        // duration은 밀리초 단위로 전달된다고 가정
        await addGameVideo(gameId, base64Video, duration || 0)
        showToast('동영상이 저장되었습니다!')
      } catch (error) {
        console.error('Failed to process video:', error)
        if (error.message === 'QUOTA_EXCEEDED') {
          showToast('저장 공간이 부족합니다.')
        } else {
          showToast('동영상 저장에 실패했습니다.')
        }
      }
    }

    // 여러 콜백 이름을 모두 등록 (안드로이드/iOS 호환성)
    window.onCameraResult = handleCameraResult
    window.onGameCameraResult = handleCameraResult
    window.onVideoCameraResult = handleVideoCameraResult
    window.onGameVideoCameraResult = handleVideoCameraResult
  }

  const userRes = await api.get('/api/auth/current-user-id')
  const currentUserId = userRes.data

  const res = await api.get(`/api/games/${gameId}/detail`)
  if (res.data.gameStatus != 'IN_PROGRESS') {
    router.push(`/games/${gameId}/result`)
  }

  // reactive에 직접 대입 (전체 덮어쓰기)
  Object.assign(game, res.data)
  game.showRuleDetail = false

  chatRoomId.value = res.data.chatRoomId

  const g = res.data
  const isLeftUser1 = g.user1.id == currentUserId
  user1.value = isLeftUser1 ? g.user1 : g.user2
  user2.value = isLeftUser1 ? g.user2 : g.user1

  currentScore1.value = isLeftUser1 ? g.score1 : g.score2
  currentScore2.value = isLeftUser1 ? g.score2 : g.score1

  user1SetsWon.value = isLeftUser1 ? g.set1 : g.set2
  user2SetsWon.value = isLeftUser1 ? g.set2 : g.set1
  currentSet.value = g.currentSet || 0

  if (game.rule.pointsToWin != -1 && currentScore1.value >= game.rule.pointsToWin) {
    isSetOver.value = true
    isGameOver.value = false
    user1SetsWon.value += 1
    currentSet.value += 1
  } else if (game.rule.pointsToWin != -1 && currentScore2.value >= game.rule.pointsToWin) {
    isSetOver.value = true
    isGameOver.value = false
    user2SetsWon.value += 1
    currentSet.value += 1
  } else if (game.limitSeconds !== -1 && elapsedSeconds.value >= game.limitSeconds) {
    isSetOver.value = true
    isGameOver.value = false
    if (game.rule.winBy == 'MOST_SETS_AND_POINTS') {
      if (currentScore1.value > currentScore2.value) {
        user1SetsWon.value += 1
        currentSet.value += 1
      } else if (currentScore2.value > currentScore1.value) {
        user2SetsWon.value += 1
        currentSet.value += 1
      }
    }
  } else {
    isSetOver.value = false
    isGameOver.value = false
    updateElapsed()
    // 시간 제한 없는 경우에만 자동 시작
    if (game.limitSeconds === -1) {
      startTimer()
    }
  }

  // 시간 제한 있는 경우 세트 시작 버튼 표시
  if (game.limitSeconds !== -1 && !isSetOver.value) {
    showStartButton.value = true
  }

  const logResponse = await api.get(`/api/games/${gameId}/game-logs`)
  const rawLogs = logResponse.data
  rawLogs.forEach((log) => addLog(log))

  // 소켓 핸들러 등록
  socket.onConnecting(() => {
    socketStatus.value = 'connecting'
  })
  socket.onConnected(() => {
    socketStatus.value = 'connected'
  })
  socket.onDisconnected(() => {
    socketStatus.value = 'disconnected'
  })

  socket.onMessage((payload) => {
    if (payload.type === 'SCORE') {
      addScore(payload.targetId, payload.delta)
      addLog(payload)
    } else if (payload.type === 'SET') {
      // setStartedAt는 startSet() 내부의 카운트다운이 끝난 후 설정됨
      startSet()
      addLog(payload)
    } else if (payload.type === 'FINISH') {
      isGameOver.value = true
      addLog(payload)
      const setsToWin = game.rule.setsToWin
      const requiredWins = Math.ceil(setsToWin / 2)
      if (user1SetsWon.value < requiredWins && user2SetsWon.value < requiredWins) {
        if (game.rule.winBy == 'MOST_SETS_AND_POINTS') {
          if (currentScore1.value > currentScore2.value) user1SetsWon.value++
          else if (currentScore2.value > currentScore1.value) user2SetsWon.value++
        }
      }
      if (user1SetsWon.value > user2SetsWon.value) {
        gameWinner.value = '@' + user1.value.nickname
      } else if (user2SetsWon.value > user1SetsWon.value) {
        gameWinner.value = '@' + user2.value.nickname
      } else {
        gameWinner.value = '무승부'
      }
    } else if (payload.type === 'RESET') {
      router.replace({
        path: route.fullPath,
        query: { ...route.query, reload: Date.now() },
      })
      addLog(payload)
    }
  })
  socket.connect(chatRoomId.value)

  document.addEventListener('visibilitychange', handleVisibilityChange)
})

function socket_sendScore(userIndex, scoreDelta) {
  socket.sendGameEvent(chatRoomId.value, {
    type: 'SCORE',
    userId: userIndex === 1 ? user1.value.id : user2.value.id,
    setIndex: currentSet.value,
    scoreDelta: scoreDelta,
  })
}

function socket_nextSet() {
  socket.sendGameEvent(chatRoomId.value, {
    type: 'SET',
    setIndex: currentSet.value,
    userId: 0,
    scoreDelta: 0,
  })
}

function socket_finishGame() {
  socket.sendGameEvent(chatRoomId.value, {
    type: 'FINISH',
  })
}

function socket_resetGame() {
  socket.sendGameEvent(chatRoomId.value, {
    type: 'RESET',
  })
}

// 안드로이드 웹뷰 감지
function isAndroidWebView() {
  return window.AndroidApp !== undefined
}

function isIOSWebView() {
  const userAgent = navigator.userAgent.toLowerCase()
  return (
    userAgent.includes('raspy-ios') ||
    (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.iosBridge)
  )
}

// 사진 촬영 트리거
function triggerPhotoCapture() {
  if (isAndroidWebView()) {
    try {
      console.log('Calling Android native camera for photo...')
      window.AndroidApp.openCamera()
      // 콜백은 window.onGameCameraResult로 받음
    } catch (error) {
      console.error('Failed to call Android camera:', error)
      // 실패 시 fallback
      cameraInputRef.value?.click()
    }
  } else if (isIOSWebView()) {
    try {
      console.log('Calling iOS native camera for photo...')
      window.webkit.messageHandlers.iosBridge.postMessage({
        action: 'openCamera',
        type: 'photo',
      })
      // 콜백은 window.onGameCameraResult로 받음
    } catch (error) {
      console.error('Failed to call iOS camera:', error)
      // 실패 시 fallback
      cameraInputRef.value?.click()
    }
  } else {
    // 일반 웹
    cameraInputRef.value?.click()
  }
}

// 동영상 촬영 트리거
function triggerVideoCapture() {
  if (isAndroidWebView()) {
    try {
      console.log('Calling Android native camera for video...')
      window.AndroidApp.openVideoCamera()
      // 콜백은 window.onGameVideoCameraResult로 받음
    } catch (error) {
      console.error('Failed to call Android video camera:', error)
      // 실패 시 fallback
      videoInputRef.value?.click()
    }
  } else if (isIOSWebView()) {
    try {
      console.log('Calling iOS native camera for video...')
      window.webkit.messageHandlers.iosBridge.postMessage({
        action: 'openCamera',
        type: 'video',
      })
      // 콜백은 window.onGameVideoCameraResult로 받음
    } catch (error) {
      console.error('Failed to call iOS video camera:', error)
      // 실패 시 fallback
      videoInputRef.value?.click()
    }
  } else {
    // 일반 웹
    videoInputRef.value?.click()
  }
}

// 카메라 파일 선택 완료
async function onCameraChange(e) {
  const file = e.target.files?.[0]
  if (!file) return

  // File을 base64로 변환
  const reader = new FileReader()

  reader.onload = async (event) => {
    try {
      const dataUrl = event.target.result

      // 이미지 압축 (기본값 사용: 800px, quality 0.3)
      const compressed = await compressImage(dataUrl)

      // IndexedDB에 저장
      await addGamePicture(gameId, compressed)

      showToast('사진이 저장되었습니다!')
    } catch (error) {
      console.error('사진 저장 실패:', error)
      if (error.message === 'QUOTA_EXCEEDED') {
        showToast('저장 공간이 부족합니다. 일부 사진을 삭제한 후 다시 시도해주세요.')
      } else {
        showToast('사진 저장에 실패했습니다.')
      }
    }
  }

  reader.onerror = () => {
    console.error('파일 읽기 실패')
    showToast('사진 저장에 실패했습니다.')
  }

  reader.readAsDataURL(file)

  // input 초기화 (같은 파일 재선택 가능하도록)
  e.target.value = ''
}

// 동영상 파일 선택 완료
async function onVideoChange(e) {
  const file = e.target.files?.[0]
  if (!file) return

  showToast('동영상 처리 중...')

  try {
    // 동영상 압축 (최대 2분)
    const { dataUrl, duration } = await compressVideo(file, 120)

    // IndexedDB에 저장
    await addGameVideo(gameId, dataUrl, duration)

    showToast(`동영상이 저장되었습니다! (${Math.floor(duration)}초)`)
  } catch (error) {
    console.error('동영상 저장 실패:', error)
    if (error.message === 'QUOTA_EXCEEDED') {
      showToast('저장 공간이 부족합니다. 일부 미디어를 삭제한 후 다시 시도해주세요.')
    } else {
      showToast('동영상 저장에 실패했습니다.')
    }
  }

  // input 초기화
  e.target.value = ''
}

onUnmounted(() => {
  clearInterval(timerRef.value)
  document.removeEventListener('visibilitychange', handleVisibilityChange)

  // 안드로이드 네이티브 카메라 콜백 정리
  if (typeof window !== 'undefined') {
    window.onCameraResult = null
    window.onGameCameraResult = null
    window.onVideoCameraResult = null
    window.onGameVideoCameraResult = null
  }

  // 소켓 핸들러 정리
  socket.onConnecting(null)
  socket.onConnected(null)
  socket.onDisconnected(null)
})
</script>

<style scoped>
@keyframes fade-in {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes blink {
  0%,
  50%,
  100% {
    opacity: 1;
  }
  25%,
  75% {
    opacity: 0.3;
  }
}
@keyframes vs-jump-blink {
  0% {
    transform: translateY(0);
    opacity: 1;
  }
  25% {
    transform: translateY(3px);
    opacity: 0.7;
  }
  50% {
    transform: translateY(-6px);
    opacity: 1;
  }
  75% {
    transform: translateY(3px);
    opacity: 0.7;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}
@keyframes countdown {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0.9;
  }
}
.vs-jump-blink {
  animation: vs-jump-blink 1.5s ease-in-out infinite;
}
.animate-fade-in {
  animation: fade-in 0.6s ease forwards;
}
.animate-blink {
  animation: blink 2.5s infinite;
}
.animate-countdown {
  animation: countdown 1s ease-in-out;
}
</style>
