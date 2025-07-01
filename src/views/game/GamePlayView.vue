<template>
  <div v-if="game" class="min-h-screen w-screen flex flex-col px-4 py-3 relative text-black overflow-hidden">
    <div class="absolute inset-0 bg-white -z-10"></div>

    <div class="flex items-center justify-between mb-4">

        <button @click="goBack" class="text-white text-lg">
          <svg width="8" height="12" viewBox="0 0 8 12" fill="black" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M7.08934 0.410704C7.41477 0.736141 7.41477 1.26378 7.08934 1.58922L2.67859 5.99996L7.08934 10.4107C7.41477 10.7361 7.41477 11.2638 7.08934 11.5892C6.7639 11.9147 6.23626 11.9147 5.91083 11.5892L0.910826 6.58922C0.585389 6.26378 0.585389 5.73614 0.910826 5.4107L5.91083 0.410704C6.23626 0.0852667 6.7639 0.0852667 7.08934 0.410704Z" fill="black"/>
          </svg>
        </button>

    </div>

    <div class="text-xs text-gray-700 text-center mb-3">
      경기 시작: {{ formatDate(game.totalGameStartedAt) }} | 현재 세트 시작: {{ formatDate(game.setStartedAt) }}
    </div>

    <div class="grid grid-cols-3 gap-2 mb-4">
      <div class="bg-white border border-orange-500 text-orange-500 px-4 py-3 rounded-xl shadow text-center">
        <div class="text-xs font-semibold mb-1">세트 승리 점수</div>
        <div class="text-md font-extrabold">{{ game.pointsToWin  == -1 ? "제한 없음" : game.pointsToWin+'점'}}</div>
      </div>
      <div class="bg-white border border-orange-500 text-orange-500 px-4 py-3 rounded-xl shadow text-center">
        <div class="text-xs font-semibold mb-1">세트 제한 시간</div>
        <div class="text-md font-extrabold">{{ limitTimeStr }}</div>
      </div>
      <div class="bg-white border border-orange-500 text-orange-500 px-4 py-3 rounded-xl shadow text-center">
        <div class="text-xs font-semibold mb-1">총 세트</div>
        <div class="text-md font-extrabold">{{ game.setsToWin }}세트</div>
      </div>
    </div>

    <div class="text-center text-orange-600 text-lg font-bold animate-pulse mb-3">현재 세트: {{ currentSet }}</div>

    <div class="flex items-start justify-between mb-6 relative">
      <div class="flex flex-col items-center mr-2 animate-fade-in">
        <img :src="game.user1.profileUrl ? game.user1.profileUrl : DefaultImage" class="w-20 aspect-square object-cover rounded-full border-4 border-orange-500 shadow-lg mb-1" />
        <div class="font-bold text-sm">@{{ game.user1.nickname }}</div>
        <div class="text-[3.0rem] font-extrabold text-orange-500 mt-1">{{ currentScore1 }}</div>
        <div class="text-base font-bold text-orange-500 mt-1">세트: {{ user1SetsWon }}</div>
        <div class="flex space-x-2 mt-2 px-1">
          <button @click="socket_sendScore(1, 1)" :disabled="isSetOver || isGameOver" class="bg-orange-500 text-white w-14 py-1.5 rounded-full shadow hover:scale-110 transition text-base font-bold">+1</button>
          <button @click="socket_sendScore(1, -1)" :disabled="isSetOver || isGameOver || currentScore1<=0" c class="bg-gray-200 text-gray-800 w-14 py-1.5 rounded-full shadow hover:scale-110 transition text-base font-bold">-1</button>
        </div>
      </div>
      <div>
        
     <div class="w-24 text-center text-xl font-[600] mt-8 text-orange-500 ">{{ elapsedTimeStr }} </div>

      </div>
      <div class="flex flex-col items-center ml-2 animate-fade-in">
        <img :src="game.user2.profileUrl ? game.user2.profileUrl : DefaultImage" class="w-20 h-20 rounded-full border-4 border-orange-500 shadow-lg mb-1" />
        <div class="font-bold text-sm">@{{ game.user2.nickname }}</div>
        <div class="text-[3.0rem] font-extrabold text-orange-500 mt-1">{{ currentScore2 }}</div>
        <div class="text-base font-bold text-orange-500 mt-1">세트: {{ user2SetsWon }}</div>
        <div class="flex space-x-2 mt-2 px-1">
          <button @click="socket_sendScore(2, 1)" :disabled="isSetOver || isGameOver" class="bg-orange-500 text-white w-14 py-1.5 rounded-full shadow hover:scale-110 transition text-base font-bold">+1</button>
          <button @click="socket_sendScore(2, -1)" :disabled="isSetOver || isGameOver || currentScore2<=0" class="bg-gray-200 text-gray-800 w-14 py-1.5 rounded-full shadow hover:scale-110 transition text-base font-bold">-1</button>
        </div>
      </div>
    </div>

    <div class="text-left mb-5">
      <div class="bg-orange-50 border border-orange-200 rounded-xl px-4 py-5 shadow-md animate-fade-in">
        <div class="text-xs font-semibold mb-1">{{ game.majorCategory }} - {{ game.minorCategory }}</div>
        <div class="text-xs text-gray-600">{{ game.ruleDescription }}</div>
      </div>
    </div>

    <!-- <div class="fixed top-[26dvh] left-1/2 -translate-x-1/2">
       <button @click="nextSet" class=" bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500 text-white w-[70dvw] py-4 rounded-full text-base font-bold shadow-xl hover:scale-110 transition animate-bounce-pulse z-50">다음 세트로</button>
    </div> -->

<div class="mt-auto relative">
  
<div class="relative max-h-28 overflow-hidden flex flex-col justify-end space-y-1 mb-10 px-1">
  
  <div v-for="(log, index) in logs" :key="index" 
       class="text-xs bg-orange-50 border border-orange-200 rounded-md px-2 py-1 shadow-sm flex items-center justify-between text-gray-700">
    <div class="flex-1 truncate">
      <span class="text-[11px] text-gray-500 mr-1">[{{ log.elapsed }}]</span>
      {{ log.message }}
    </div>
  </div>

  <!-- 상단 반투명 + 중앙 더보기 버튼 -->
  <div v-if="logs.length > 5" 
       class="absolute top-0 left-0 w-full h-10 bg-gradient-to-b from-white/80 to-transparent flex justify-center items-start z-10">
    
    <button @click="showLogModal = true" 
            class="text-orange-500 text-[12px] font-[600] border border-orange-500 bg-white rounded-full shadow px-8 py-[7px] flex items-center space-x-1 hover:brightness-110 transition mt-1">
      <span>모두 보기</span>
    </button>
  </div>

</div>


  <div class="grid grid-cols-2 gap-3 mb-4">
    <button @click="resetGame" 
            class="border border-orange-500 text-orange-500 px-3 py-2 rounded-full text-xs hover:bg-orange-50 transition">초기화</button>
    <button @click="forced_finishGame" 
            class="bg-orange-500 text-white px-3 py-2 rounded-full text-xs shadow hover:brightness-110 transition">게임 종료</button>
  </div>
</div>


           <!-- 세트 종료 시: 다음 세트 버튼 -->
        <div v-if="isSetOver && !isGameOver" class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
          <button @click="socket_nextSet" 
                  class="bg-orange-500 text-white w-[70dvw] py-4 rounded-full text-lg font-bold shadow animate-blink transition hover:scale-110">
            다음 세트
          </button>
        </div>

    <div v-if="showFinishModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 text-center shadow-lg w-[90%] max-w-md">
        <div class="text-lg font-bold mb-3">세트 종료</div>
        <div class="text-orange-500 font-extrabold text-xl mb-4">{{ winner != '-' ? '@' +winner+ ' 승리' : '무승부' }} </div>
        <button @click="closeFinishModal" class="bg-orange-500 w-full text-white px-4 py-2 rounded-full text-sm shadow hover:brightness-110 transition">확인</button>
      </div>
    </div>

    <div v-if="isGameOver" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div class="bg-orange-500 text-white rounded-xl p-8 text-center shadow-2xl animate-fade-in w-[90%] max-w-md">
        <div class="text-xl font-bold mb-4">🎉 경기 종료 🎉</div>
        <div class="text-2xl font-extrabold mb-5">{{ gameWinner =='무승부' ? '무승부' : gameWinner + ' 최종 승리!'}} </div>
        <button @click="goToResult" class="bg-white text-orange-500 w-full py-2 rounded-full text-base font-bold shadow hover:scale-105 transition">결과 보기</button>
      </div>  
    </div>
  </div>
<div v-if="showLogModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div class="bg-white rounded-xl p-4 shadow-lg w-[90%] max-w-md max-h-[70vh] overflow-y-auto">
    
    <div class="flex justify-between items-center mb-3">
      <div class="text-lg font-bold">전체 로그</div>
      <button @click="showLogModal = false" class="text-orange-500 text-sm">닫기</button>
    </div>

    <div class="flex flex-col space-y-1">
      <div v-for="(log, index) in logs" :key="index" 
           class="text-xs bg-orange-50 border border-orange-200 rounded-md px-2 py-1 shadow-sm flex items-center justify-between text-gray-700">
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
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../api/api'
import { socket } from '../../websocket'
import DefaultImage from "../../assets/default.png"

const route = useRoute()
const router = useRouter()
const gameId = route.params.gameId
const game = ref(null)
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
const elapsedTimeStr = ref('0분 0초')
const limitTimeStr = ref('')
const timerRef = ref(null)
const logs = ref([])

const user1 = ref(null)
const user2 = ref(null)

const gameWinner = ref('')

const showLogModal = ref(false)

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
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

const resetGame = () => {
  if(!confirm("정말로 게임을 재시작 하겠습니까?")) return;
  
  socket_resetGame()
}

function checkSetOver() {
  if (game.value.pointsToWin != -1 && currentScore1.value >= game.value.pointsToWin) {
    user1SetsWon.value++
    finishSet(1)
    return
  }  
  if (game.value.pointsToWin != -1 && currentScore2.value >= game.value.pointsToWin) {
    user2SetsWon.value++
    finishSet(2)
    return
  }
  if (game.value.limitSeconds !== -1 && elapsedSeconds.value >= game.value.limitSeconds) {
    if (game.value.winBy=='MOST_SETS_AND_POINTS' && currentScore1.value > currentScore2.value) {
      user1SetsWon.value++

      finishSet(1)
    } else if (game.value.winBy=='MOST_SETS_AND_POINTS' && currentScore2.value > currentScore1.value) {
      user2SetsWon.value++

      finishSet(2)
    } else {
      finishSet(0) // 무승부 (점수가 동일한 경우 무승부일것임)

    } 
    return
  }

    elapsedSeconds.value = 0;

}

function finishSet(who) {
  isSetOver.value = true
  clearInterval(timerRef.value)
  if (who === 1) {
    winner.value = game.value.user1.nickname
  }
  else if (who === 2) { 
    winner.value = game.value.user2.nickname
  }
 
  showFinishModal.value = true
  
  
  const setsToWin = game.value.setsToWin  // 예: 5판
  const requiredWins = Math.ceil(setsToWin / 2)  // 절반 이상 승리 필요

  if (user1SetsWon.value >= requiredWins || user2SetsWon.value >= requiredWins) {
    /**
     * 조건 세트 수가 채워져, 게임이 종료됨.
     */
    isGameOver.value = true
    isSetOver.value = false

    socket_finishGame()
  } else {
     currentSet.value ++
  }

}

function closeFinishModal() {
  showFinishModal.value = false
}

function startTimer() {
  if(isGameOver.value) return
  clearInterval(timerRef.value)
  updateElapsed()
  timerRef.value = setInterval(updateElapsed, 1000)
}

function updateElapsed() {
  // 경과 시간: setStartedAt 기준으로 현 시각에서 1초씩 증가
  if (!game.value?.setStartedAt ||isSetOver.value) return
  const startedAt = new Date(game.value.setStartedAt)
  const now = new Date()
  const elapsed = Math.floor((now - startedAt) / 1000)
  elapsedSeconds.value = game.value.limitSeconds === -1 ? elapsed : Math.min(elapsed, game.value.limitSeconds)
  elapsedTimeStr.value = getTimeStr(elapsedSeconds.value)

  // 제한 시간 표시(최초 1회만)
  if (game.value.limitSeconds !== -1) {
    limitTimeStr.value = getTimeStr(game.value.limitSeconds)
  } else {
    limitTimeStr.value = "제한 없음"
  }
  // 세트 종료 자동 감지
  if (!isSetOver.value && !isGameOver.value) {
    checkSetOver()
  }
}

function getTimeStr(seconds) {
  if (seconds <= 0) return '0분 0초'
  const min = Math.floor(seconds / 60)
  const sec = seconds % 60
  return `${min}분 ${sec}초`
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
      // 시간 차이 (분:초 포맷)
      const start = new Date(game.value.totalGameStartedAt)
      const current = new Date(log.time)
      const diffSec = Math.floor((current - start) / 1000)
      const minutes = String(Math.floor(diffSec / 60)).padStart(2, '0')
      const seconds = String(diffSec % 60).padStart(2, '0')
      const elapsed = `${minutes}:${seconds}`

      // 메시지 내용 생성
      let message = ''
      if (log.type === 'SCORE') {
        message = `@${log.targetId == user1.value.id?user1.value.nickname : user2.value.nickname} ${log.delta}점 ${log.delta>0?"득점":"실점"} (변경자 - @${log.userSummary.nickname})`
      } else if (log.type === 'SET') {
        message = `@${log.userSummary.nickname} 세트를 증가시킴`
      } else if (log.type === 'RESET') {
        message = `@${log.userSummary.nickname} 게임을 리셋함`
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
  const res = await api.get(`/api/games/${gameId}/detail`)
  
  /**
   * 진행 중인 게임이 아니라면, 이 페이지에 잘못 들어선 것임
   */
  if(res.data.gameStatus != 'IN_PROGRESS') {
    alert("잘못된 접근입니다. 진행 중인 게임이 아닙니다.")
    router.go(-1)
  }

  
  game.value = res.data

  chatRoomId.value = res.data.chatRoomId

  currentScore1.value = res.data.score1
  currentScore2.value = res.data.score2


  currentSet.value = res.data.currentSet|| 0
  user1SetsWon.value = res.data.set1
  user2SetsWon.value = res.data.set2
  user1.value = res.data.user1
  user2.value = res.data.user2

  if (game.value.pointsToWin != -1 && currentScore1.value >= game.value.pointsToWin) {
    
    /**
     * 체크 종료되었다고 표시 
     */
      
    isSetOver.value = true
    isGameOver.value = false

    user1SetsWon.value += 1
    currentSet.value += 1

  }  
  else if (game.value.pointsToWin != -1 && currentScore2.value >= game.value.pointsToWin) {
        
    /**
     * 체크 종료되었다고 표시
     */
    isSetOver.value = true
    isGameOver.value = false

    user2SetsWon.value += 1
    currentSet.value += 1

  }
  else if (game.value.limitSeconds !== -1 && elapsedSeconds.value >= game.value.limitSeconds) {
      
    /**
     * 체크 종료되었다고 표시
     */

    isSetOver.value = true
    isGameOver.value = false

    if(game.value.winBy == 'MOST_SETS_AND_POINTS') {
      if(currentScore1.value > currentScore2.value) {
            user1SetsWon.value += 1
            currentSet.value += 1
      } else if(currentScore2.value > currentScore1.value) {
            user2SetsWon.value += 1
            currentSet.value += 1
      }
    }

  }

  else {
    isSetOver.value = false
    isGameOver.value = false
    console.log(game.value)

    updateElapsed()
    startTimer()
  }

  const logResponse = await api.get(`/api/games/${gameId}/game-logs`)
  const rawLogs = logResponse.data  

  rawLogs.forEach(log => addLog(log)) // 기록된 모든 로그 추가

  // startSet()
  socket.connect(chatRoomId.value, () => {
    socket.subscribe(`${chatRoomId.value}`)
    socket.onMessage((payload) => {
      console.log(payload)
      if (payload.type === 'SCORE') {
        addScore(payload.targetId, payload.delta)
        addLog(payload)

      } else if (payload.type === 'SET') {
        game.value.setStartedAt = new Date()
        startSet()
        addLog(payload)

      } else if (payload.type === 'FINISH') {
        isGameOver.value = true
        addLog(payload)

          const setsToWin = game.value.setsToWin  // 예: 5판
          const requiredWins = Math.ceil(setsToWin / 2)  // 절반 이상 승리 필요

        // 아무도 세트 수에 도달하지 못핬는데 종료됐다면 강제종료로 판단 (백엔드에서는 강제종료되어도 일반종료와 동일하게 동작한다)
        if (user1SetsWon.value < requiredWins && user2SetsWon.value < requiredWins) {
          if(game.value.winBy=='MOST_SETS_AND_POINTS') {
            if(currentScore1.value > currentScore2.value) user1SetsWon.value ++
            else if(currentScore2.value > currentScore1.value) user2SetsWon.value ++
          }
        }

        if(user1SetsWon.value >user2SetsWon.value) {
          gameWinner.value = '@' + game.value.user1.nickname
        }
        else if(user2SetsWon.value >user1SetsWon.value) {
          gameWinner.value = '@' + game.value.user2.nickname
        }
        else  {
          gameWinner.value = '무승부'
        }
      }

      else if (payload.type === 'RESET') {
        router.replace({
              path: route.fullPath,
              query: { ...route.query, reload: Date.now() }
        })
        
        addLog(payload)
      } 
    })
  })
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

const socket_sendScore = (userId, scoreDelta) => {
  socket.sendGameEvent(chatRoomId.value, {
    type: 'SCORE',
    userId: userId==1 ? user1.value.id : user2.value.id, // 점수 변화하는 사람 
    setIndex: currentSet.value,
    scoreDelta: scoreDelta
  })
}

 const socket_nextSet = () => {
  console.log("세트 증가함")
  socket.sendGameEvent(chatRoomId.value, {
    type: 'SET',

    /**
     * these are no-valuable
     */
    setIndex: currentSet.value,
    userId: 0,
    scoreDelta: 0
    /***********************/
  })
}

const forced_finishGame = () => {
  if(confirm("정말로 게임을 즉시 종료합니까?")) {

    socket_finishGame()
  
  }
}

const socket_finishGame = () => {
  socket.sendGameEvent(chatRoomId.value, {
    type: 'FINISH'
  })
}

const socket_resetGame = () => {
  socket.sendGameEvent(chatRoomId.value, {
    type: 'RESET'
  })
}

onUnmounted(() => {
  clearInterval(timerRef.value)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  socket.disconnect()

})
</script>

<style scoped>
@keyframes fade-in {
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes blink {
  0%, 50%, 100% { opacity: 1; }
  25%, 75% { opacity: 0.3; }
}
@keyframes vs-jump-blink {
  0% { transform: translateY(0); opacity: 1; }
  25% { transform: translateY(3px); opacity: 0.7; } /* 살짝 웅크림 + 투명도 감소 */
  50% { transform: translateY(-6px); opacity: 1; } /* 점프 위로 */
  75% { transform: translateY(3px); opacity: 0.7; } /* 착지 반동 + 투명도 감소 */
  100% { transform: translateY(0); opacity: 1; }
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