<template>
  <div
    v-if="game && user1 && user2"
    class="w-dvw flex flex-col px-4 py-3 relative text-black overflow-hidden"
  >
    <div class="absolute inset-0 bg-white -z-10"></div>

    <div class="flex items-center justify-between mb-4">
      <button @click="goBack" class="text-white text-lg">
        <svg
          width="8"
          height="12"
          viewBox="0 0 8 12"
          fill="black"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M7.08934 0.410704C7.41477 0.736141 7.41477 1.26378 7.08934 1.58922L2.67859 5.99996L7.08934 10.4107C7.41477 10.7361 7.41477 11.2638 7.08934 11.5892C6.7639 11.9147 6.23626 11.9147 5.91083 11.5892L0.910826 6.58922C0.585389 6.26378 0.585389 5.73614 0.910826 5.4107L5.91083 0.410704C6.23626 0.0852667 6.7639 0.0852667 7.08934 0.410704Z"
            fill="black"
          />
        </svg>
      </button>
    </div>





    <div class="mb-8 mt-5">
      <div class="flex items-center w-full gap-2">
        <!-- Info Cards: 세트 승점, 세트 수, 세트 시간 -->
      <div class="flex w-full gap-2 sm:gap-2 gap-1">
        <div class="h-[22vw] sm:h-[16vw] flex-1 max-h-[90px] sm:max-h-[130px] flex flex-col justify-between bg-white text-orange-500 px-2 sm:px-3 py-2 sm:py-3 rounded-xl text-center shadow">
            <div class="flex-1 flex flex-col items-center justify-center">
              <div class="flex items-center justify-center text-[1.1rem] sm:text-[1.25rem] font-semibold mb-1 sm:mb-2">
                <svg width="26" height="26" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M64.5834 62.5002C63.4028 62.5002 62.4132 62.1009 61.6146 61.3022C60.816 60.5036 60.4167 59.514 60.4167 58.3335V41.6668C60.4167 40.4863 60.816 39.4967 61.6146 38.6981C62.4132 37.8995 63.4028 37.5002 64.5834 37.5002H75C76.1806 37.5002 77.1702 37.8995 77.9688 38.6981C78.7674 39.4967 79.1667 40.4863 79.1667 41.6668V58.3335C79.1667 59.514 78.7674 60.5036 77.9688 61.3022C77.1702 62.1009 76.1806 62.5002 75 62.5002H64.5834ZM66.6667 56.2502H72.9167V43.7502H66.6667V56.2502ZM20.8334 62.5002V52.0835C20.8334 50.9029 21.2327 49.9134 22.0313 49.1147C22.8299 48.3161 23.8195 47.9168 25 47.9168H33.3334V43.7502H20.8334V37.5002H35.4167C36.5973 37.5002 37.5868 37.8995 38.3855 38.6981C39.1841 39.4967 39.5834 40.4863 39.5834 41.6668V47.9168C39.5834 49.0974 39.1841 50.087 38.3855 50.8856C37.5868 51.6842 36.5973 52.0835 35.4167 52.0835H27.0834V56.2502H39.5834V62.5002H20.8334ZM46.875 45.8335V39.5835H53.125V45.8335H46.875ZM46.875 60.4168V54.1668H53.125V60.4168H46.875ZM16.6667 83.3335C14.375 83.3335 12.4132 82.5175 10.7813 80.8856C9.14935 79.2536 8.33337 77.2918 8.33337 75.0002V25.0002C8.33337 22.7085 9.14935 20.7467 10.7813 19.1147C12.4132 17.4828 14.375 16.6668 16.6667 16.6668H29.1667V8.3335H37.5V16.6668H62.5V8.3335H70.8334V16.6668H83.3334C85.625 16.6668 87.5869 17.4828 89.2188 19.1147C90.8507 20.7467 91.6667 22.7085 91.6667 25.0002V75.0002C91.6667 77.2918 90.8507 79.2536 89.2188 80.8856C87.5869 82.5175 85.625 83.3335 83.3334 83.3335H16.6667ZM16.6667 75.0002H46.875V68.7502H53.125V75.0002H83.3334V25.0002H53.125V31.2502H46.875V25.0002H16.6667V75.0002Z" fill="#808080"/>
                </svg>
                <span class="ml-1 text-gray-800 text-sm sm:text-base font-semibold">세트 승점</span>
              </div>
              <div class="flex items-center justify-center text-orange-500 font-extrabold text-lg sm:text-xl mt-1 sm:mt-2">
                {{ game.rule.pointsToWin == -1 ? '제한 없음' : game.rule.pointsToWin  }}
              </div>
            </div>
          </div>
          <div class="h-[22vw] sm:h-[16vw] flex-1 max-h-[90px] sm:max-h-[130px] flex flex-col justify-between bg-white text-orange-500 px-2 sm:px-3 py-2 sm:py-3 rounded-xl text-center shadow">
            <div class="flex-1 flex flex-col items-center justify-center">
              <div class="flex items-center justify-center text-[1.25rem] font-semibold mb-2">
                <svg width="26" height="26" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M29.1667 87.5V79.1667H45.8333V66.25C42.4306 65.4861 39.3924 64.0451 36.7188 61.9271C34.0451 59.809 32.0833 57.1528 30.8333 53.9583C25.625 53.3333 21.2674 51.059 17.7604 47.1354C14.2535 43.2118 12.5 38.6111 12.5 33.3333V29.1667C12.5 26.875 13.316 24.9132 14.9479 23.2812C16.5799 21.6493 18.5417 20.8333 20.8333 20.8333H29.1667V12.5H70.8333V20.8333H79.1667C81.4583 20.8333 83.4201 21.6493 85.0521 23.2812C86.684 24.9132 87.5 26.875 87.5 29.1667V33.3333C87.5 38.6111 85.7465 43.2118 82.2396 47.1354C78.7326 51.059 74.375 53.3333 69.1667 53.9583C67.9167 57.1528 65.9549 59.809 63.2812 61.9271C60.6076 64.0451 57.5694 65.4861 54.1667 66.25V79.1667H70.8333V87.5H29.1667ZM29.1667 45V29.1667H20.8333V33.3333C20.8333 35.9722 21.5972 38.3507 23.125 40.4688C24.6528 42.5868 26.6667 44.0972 29.1667 45ZM50 58.3333C53.4722 58.3333 56.4236 57.1181 58.8542 54.6875C61.2847 52.2569 62.5 49.3056 62.5 45.8333V20.8333H37.5V45.8333C37.5 49.3056 38.7153 52.2569 41.1458 54.6875C43.5764 57.1181 46.5278 58.3333 50 58.3333ZM70.8333 45C73.3333 44.0972 75.3472 42.5868 76.875 40.4688C78.4028 38.3507 79.1667 35.9722 79.1667 33.3333V29.1667H70.8333V45Z" fill="#808080"/>
                </svg>
                <span class="ml-1 text-gray-800 text-sm sm:text-base font-semibold">세트 수</span>
              </div>
              <div class="flex items-center justify-center text-orange-500 font-extrabold text-lg sm:text-xl mt-1 sm:mt-2">
                {{ game.rule.setsToWin }}
              </div>
            </div>
          </div>
          <div class="h-[22vw] sm:h-[16vw] flex-1 max-h-[90px] sm:max-h-[130px] flex flex-col justify-between bg-white text-orange-500 px-2 sm:px-3 py-2 sm:py-3 rounded-xl text-center shadow">
            <div class="flex-1 flex flex-col items-center justify-center">
              <div class="flex items-center justify-center text-[1.25rem] font-semibold mb-2">
                <svg width="26" height="26" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M50 45.8335C54.5834 45.8335 58.507 44.2016 61.7709 40.9377C65.0347 37.6738 66.6667 33.7502 66.6667 29.1668V16.6668H33.3334V29.1668C33.3334 33.7502 34.9653 37.6738 38.2292 40.9377C41.4931 44.2016 45.4167 45.8335 50 45.8335ZM16.6667 91.6668V83.3335H25V70.8335C25 66.5974 25.9896 62.6217 27.9688 58.9064C29.9479 55.1911 32.7084 52.2224 36.25 50.0002C32.7084 47.7779 29.9479 44.8092 27.9688 41.0939C25.9896 37.3786 25 33.4029 25 29.1668V16.6668H16.6667V8.3335H83.3334V16.6668H75V29.1668C75 33.4029 74.0104 37.3786 72.0313 41.0939C70.0521 44.8092 67.2917 47.7779 63.75 50.0002C67.2917 52.2224 70.0521 55.1911 72.0313 58.9064C74.0104 62.6217 75 66.5974 75 70.8335V83.3335H83.3334V91.6668H16.6667Z" fill="#808080"/>
                </svg>
                <span class="ml-1 text-gray-800 text-sm sm:text-base font-semibold">세트 시간</span>
              </div>
              <div class="flex items-center justify-center text-orange-500 font-extrabold text-lg sm:text-xl mt-1 sm:mt-2">
                {{ limitTimeStr }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="w-full flex justify-end mt-2 gap-2">
        <button
          @click="showLogModal = true"
          class="text-xs text-orange-500 border border-orange-200 rounded-full px-4 py-1 shadow-sm hover:bg-orange-50 transition font-semibold"
        >
          로그 보기
        </button>
        <button
          class="text-xs text-orange-500 border border-orange-200 rounded-full px-4 py-1 shadow-sm hover:bg-orange-50 transition font-semibold"
          @click="game.showRuleDetail = true"
        >
          규칙 보기
        </button>
      </div>
    </div>
    <div class="flex flex-col items-center mb-6 relative left-0">
      <div class="text-orange-600 text-lg font-bold mb-2">
        {{ elapsedTimeStr }}, 세트 {{ currentSet }}
      </div>
      <div class="flex w-full items-start justify-center">
  <div class="flex flex-col items-center justify-center w-full">
  <div class="flex items-center justify-center mb-4 sm:mb-6 w-full">
    <div class="flex items-end">
  <span class="text-[28vw] sm:text-[38dvw] font-extrabold text-orange-500">{{ currentScore1 }}</span>
  <span class="ml-2 sm:ml-4 text-[2.8rem] sm:text-[4.5rem] font-bold text-orange-400" style="position:relative; top:0.1em;">{{ user1SetsWon }}</span>
      </div>
  <span class="mx-10 sm:mx-24 text-[16vw] sm:text-[24dvw] text-orange-400">:</span>
    <div class="flex items-end">
  <span class="text-[28vw] sm:text-[38dvw] font-extrabold text-orange-500">{{ currentScore2 }}</span>
  <span class="ml-2 sm:ml-4 text-[2.8rem] sm:text-[4.5rem] font-bold text-orange-400" style="position:relative; top:0.1em;">{{ user2SetsWon }}</span>
      </div>
    </div>
  <div class="flex flex-row w-full justify-between mt-4 sm:mt-8">
      <div class="flex flex-col items-center flex-1">
        <img
          :src="user1.profileUrl ? user1.profileUrl : DefaultImage"
          class="w-[18vw] sm:w-[24dvw] aspect-square object-cover rounded-full border-4 border-orange-500 shadow-lg mb-3 sm:mb-5"
        />
        <div class="font-bold text-lg sm:text-2xl mb-2 sm:mb-3">{{ user1.nickname }}</div>
        <div class="flex flex-col space-y-2 sm:space-y-3 items-center w-full">
          <button
            @click="socket_sendScore(1, 1)"
            :disabled="isSetOver || isGameOver"
            class="bg-orange-500 text-white w-[28vw] sm:w-[38dvw] py-2 sm:py-3 rounded-t-xl rounded-b-none shadow hover:scale-110 transition text-[2rem] sm:text-[2.8rem] font-bold max-w-[140px] sm:max-w-[180px] min-w-[64px] sm:min-w-[90px]"
            style="border-top-left-radius:0.5rem;border-top-right-radius:0.5rem;border-bottom-left-radius:0;border-bottom-right-radius:0;"
          >
            +
          </button>
          <button
            @click="socket_sendScore(1, -1)"
            :disabled="isSetOver || isGameOver || currentScore1 <= 0"
            class="bg-gray-200 text-gray-800 w-[28vw] sm:w-[38dvw] py-2 sm:py-3 rounded-b-xl rounded-t-none shadow hover:scale-110 transition text-[2rem] sm:text-[2.8rem] font-bold max-w-[140px] sm:max-w-[180px] min-w-[64px] sm:min-w-[90px]"
            style="border-bottom-left-radius:0.5rem;border-bottom-right-radius:0.5rem;border-top-left-radius:0;border-top-right-radius:0;"
          >
            -
          </button>
        </div>
      </div>
      <div class="flex flex-col items-center flex-1">
        <img
          :src="user2.profileUrl ? user2.profileUrl : DefaultImage"
          class="w-[18vw] sm:w-[24dvw] aspect-square object-cover rounded-full border-4 border-orange-500 shadow-lg mb-3 sm:mb-5"
        />
        <div class="font-bold text-lg sm:text-2xl mb-2 sm:mb-3">{{ user2.nickname }}</div>
        <div class="flex flex-col space-y-2 sm:space-y-3 items-center w-full">
          <button
            @click="socket_sendScore(2, 1)"
            :disabled="isSetOver || isGameOver"
            class="bg-orange-500 text-white w-[28vw] sm:w-[38dvw] py-2 sm:py-3 rounded-t-xl rounded-b-none shadow hover:scale-110 transition text-[2rem] sm:text-[2.8rem] font-bold max-w-[140px] sm:max-w-[180px] min-w-[64px] sm:min-w-[90px]"
            style="border-top-left-radius:0.5rem;border-top-right-radius:0.5rem;border-bottom-left-radius:0;border-bottom-right-radius:0;"
          >
            +
          </button>
          <button
            @click="socket_sendScore(2, -1)"
            :disabled="isSetOver || isGameOver || currentScore2 <= 0"
            class="bg-gray-200 text-gray-800 w-[28vw] sm:w-[38dvw] py-2 sm:py-3 rounded-b-xl rounded-t-none shadow hover:scale-110 transition text-[2rem] sm:text-[2.8rem] font-bold max-w-[140px] sm:max-w-[180px] min-w-[64px] sm:min-w-[90px]"
            style="border-bottom-left-radius:0.5rem;border-bottom-right-radius:0.5rem;border-top-left-radius:0;border-top-right-radius:0;"
          >
            -
          </button>
        </div>
      </div>
    </div>
  </div>
      </div>
    </div>

    <div class="mt-auto w-full flex flex-col gap-3 sm:gap-4 items-stretch mb-6 sm:mb-10">
      <div class="w-full grid grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6">
        <button
          @click="openConfirm('정말로 게임을 재시작 하겠습니까?', socket_resetGame)"
          class="border text-orange-500 px-3 py-3 rounded-[8.2px] text-xs sm:text-base hover:bg-orange-50 transition"
        >
          처음부터
        </button>
        <button
          @click="openConfirm('정말로 게임을 즉시 종료합니까?', socket_finishGame)"
          class="bg-orange-500 text-white px-3 py-3 rounded-[8.2px] text-xs sm:text-base shadow hover:brightness-110 transition"
        >
          경기 끝내기
        </button>
      </div>
      <!-- Dummy Ad Banner below the buttons, responsive spacing -->
  <div class="w-full flex justify-center mt-4 sm:mt-8">
        <div
          class="w-full max-w-xs sm:max-w-md h-10 sm:h-14 rounded-t-xl flex items-center justify-center shadow-lg font-extrabold text-sm sm:text-base animate-fade-in pointer-events-auto mx-1 sm:mx-2"
          style="
            background: linear-gradient(90deg, #ff9800 0%, #ffeb3b 50%, #00bcd4 100%);
            color: #222;
            border-top: 3px solid #ff5722;
            border-left: 3px solid #ff5722;
            border-right: 3px solid #ff5722;
            letter-spacing: 1px;
            text-shadow: 1px 1px 0 #fff, 0 2px 8px #ff9800;
            box-sizing: border-box;
          "
        >
          <span style="font-size:1em;">슈퍼덩크 <span style="color:#ff5722;">덩크 콘테스트</span> 모집중!!</span>
        </div>
      </div>
    </div>

    <div
      v-if="isSetOver && !isGameOver"
      class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50"
    >
      <button
        @click="socket_nextSet"
        class="bg-orange-500 text-white w-[70dvw] py-4 rounded-full text-lg font-bold shadow animate-blink transition hover:scale-110"
      >
        다음 세트
      </button>
    </div>

    <div
      v-if="showFinishModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-xl p-6 text-center shadow-lg w-[90%] max-w-md">
        <div class="text-lg font-bold mb-3">세트 종료</div>
        <div class="text-orange-500 font-extrabold text-xl mb-4">
          {{ winner != '-' ? winner + ' 승리' : '무승부' }}
        </div>
        <button
          @click="closeFinishModal"
          class="bg-orange-500 w-full text-white px-4 py-2 rounded-full text-sm shadow hover:brightness-110 transition"
        >
          확인
        </button>
      </div>
    </div>

    <div
      v-if="isGameOver"
      class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
    >
      <div
        class="bg-orange-500 text-white rounded-xl p-8 text-center shadow-2xl animate-fade-in w-[90%] max-w-md"
      >
        <div class="text-xl font-bold mb-4">🎉 경기 종료 🎉</div>
        <div class="text-2xl font-extrabold mb-5">
          {{ gameWinner == '무승부' ? '무승부' : gameWinner + ' 최종 승리!' }}
        </div>
        <button
          @click="goToResult"
          class="bg-white text-orange-500 w-full py-2 rounded-full text-base font-bold shadow hover:scale-105 transition"
        >
          결과 보기
        </button>
      </div>
    </div>

    <!-- MatchModal: 규칙 모달 -->
    <MatchModal v-if="game.showRuleDetail" :rule="game.rule" @close="game.showRuleDetail = false" />

    <!-- 커스텀 confirm 모달 -->
    <div
      v-if="showConfirm"
      class="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center"
    >
      <div class="bg-white w-full max-w-xs rounded-xl shadow-lg p-7 text-center">
        <div class="mb-5 text-lg font-bold text-gray-800">{{ confirmMessage }}</div>
        <div class="flex justify-center gap-3 mt-4">
          <button
            @click="closeConfirm"
            class="px-5 py-2 bg-gray-100 text-gray-600 rounded-full font-semibold text-sm"
          >
            취소
          </button>
          <button
            @click="confirmCallbackWrapper"
            class="px-6 py-2 bg-orange-500 text-white rounded-full font-semibold text-sm shadow hover:bg-orange-400"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  </div>

  <div
    v-if="showLogModal"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
  >
    <div class="bg-white rounded-xl p-4 shadow-lg w-[90%] max-w-md max-h-[70vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-3">
        <div class="text-lg font-bold">전체 로그</div>
        <button @click="showLogModal = false" class="text-orange-500 text-sm">닫기</button>
      </div>
      <div class="flex flex-col space-y-1">
        <div
          v-for="(log, index) in logs"
          :key="index"
          class="text-xs bg-orange-50 border border-orange-200 rounded-md px-2 py-1 shadow-sm flex items-center justify-between text-gray-700"
        >
          <div class="flex-1 truncate">
            <span class="text-[11px] text-gray-500 mr-1">[{{ log.elapsed }}]</span>
            {{ log.message }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../api/api'
import { socket } from '../../websocket'
import DefaultImage from '../../assets/default.png'
import MatchModal from '../../components/MatchModal.vue'

const route = useRoute()
const router = useRouter()
const gameId = route.params.gameId
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
  updateElapsed()
  startTimer()
}

function addScore(userIdx, delta) {
  if (isSetOver.value || isGameOver.value) return

  if (userIdx == user1.value.id) {
    currentScore1.value = Math.max(0, currentScore1.value + delta)
  } else {
    currentScore2.value = Math.max(0, currentScore2.value + delta)
  }

  checkSetOver()
}

function checkSetOver() {
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
  if (game.limitSeconds !== -1 && elapsedSeconds.value >= game.limitSeconds) {
    if (game.rule.winBy == 'MOST_SETS_AND_POINTS' && currentScore1.value > currentScore2.value) {
      user1SetsWon.value++
      finishSet(1)
    } else if (
      game.rule.winBy == 'MOST_SETS_AND_POINTS' &&
      currentScore2.value > currentScore1.value
    ) {
      user2SetsWon.value++
      finishSet(2)
    } else {
      finishSet(0) // 무승부
    }
    return
  }
  elapsedSeconds.value = 0
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
  } else {
    currentSet.value++
  }
}

function closeFinishModal() {
  showFinishModal.value = false
}

function startTimer() {
  if (isGameOver.value) return
  clearInterval(timerRef.value)
  updateElapsed()
  timerRef.value = setInterval(updateElapsed, 1000)
}

function updateElapsed() {
  if (!game.setStartedAt || isSetOver.value) return
  const startedAt = new Date(game.setStartedAt)
  const now = new Date()
  const elapsed = Math.floor((now - startedAt) / 1000)
  elapsedSeconds.value = game.limitSeconds === -1 ? elapsed : Math.min(elapsed, game.limitSeconds)
  elapsedTimeStr.value = getTimeStr(elapsedSeconds.value)
  if (game.limitSeconds !== -1) {
    limitTimeStr.value = getTimeStr(game.limitSeconds)
  } else {
    limitTimeStr.value = '제한 없음'
  }
  if (!isSetOver.value && !isGameOver.value) {
    checkSetOver()
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
    updateElapsed()
    if (!isSetOver.value && !isGameOver.value) {
      startTimer()
    }
  }
}

const addLog = (log) => {
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
    message = `${log.userSummary.nickname} 게임을 리셋함`
  } else if (log.type === 'FINISH') {
    message = `게임이 종료되었습니다!`
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
    startTimer()
  }

  const logResponse = await api.get(`/api/games/${gameId}/game-logs`)
  const rawLogs = logResponse.data
  rawLogs.forEach((log) => addLog(log))

  socket.onMessage((payload) => {
    if (payload.type === 'SCORE') {
      addScore(payload.targetId, payload.delta)
      addLog(payload)
    } else if (payload.type === 'SET') {
      game.setStartedAt = new Date()
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

const socket_sendScore = (userIndex, scoreDelta) => {
  socket.sendGameEvent(chatRoomId.value, {
    type: 'SCORE',
    userId: userIndex === 1 ? user1.value.id : user2.value.id,
    setIndex: currentSet.value,
    scoreDelta: scoreDelta,
  })
}

const socket_nextSet = () => {
  socket.sendGameEvent(chatRoomId.value, {
    type: 'SET',
    setIndex: currentSet.value,
    userId: 0,
    scoreDelta: 0,
  })
}

const socket_finishGame = () => {
  socket.sendGameEvent(chatRoomId.value, {
    type: 'FINISH',
  })
}

const socket_resetGame = () => {
  socket.sendGameEvent(chatRoomId.value, {
    type: 'RESET',
  })
}

onUnmounted(() => {
  clearInterval(timerRef.value)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
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
.vs-jump-blink {
  animation: vs-jump-blink 1.5s ease-in-out infinite;
}
.animate-fade-in {
  animation: fade-in 0.6s ease forwards;
}
.animate-blink {
  animation: blink 2.5s infinite;
}
</style>
