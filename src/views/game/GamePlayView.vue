<template>
  <div v-if="game" class="max-w-2xl mx-auto px-4 py-6 space-y-6">
    <div class="fixed top-0 left-0 w-full bg-gray-900 text-white py-2 px-4 text-sm z-50 flex justify-between items-center">
      <span>⏱ 제한 시간: {{ timeLeft }}</span>
      <button @click="goBack" class="text-white text-xs underline">← 돌아가기</button>
    </div>

    <div class="pt-10 space-y-8">
      <div class="flex justify-between items-center">
        <div class="flex flex-col items-center gap-1">
          <img v-if="game.user1.profileUrl" :src="game.user1.profileUrl" class="w-12 h-12 rounded-full object-cover" />
          <p class="text-sm">{{ game.user1.nickname }}</p>
          <p class="text-2xl font-bold">{{ score1 }}</p>
          <div class="flex gap-1">
            <button @click="sendScore(game.user1.id, 1)">➕</button>
            <button @click="sendScore(game.user1.id, -1)">➖</button>
          </div>
        </div>

        <p class="text-3xl font-bold text-gray-700">VS</p>

        <div class="flex flex-col items-center gap-1">
          <img v-if="game.user2.profileUrl" :src="game.user2.profileUrl" class="w-12 h-12 rounded-full object-cover" />
          <p class="text-sm">{{ game.user2.nickname }}</p>
          <p class="text-2xl font-bold">{{ score2 }}</p>
          <div class="flex gap-1">
            <button @click="sendScore(game.user2.id, 1)">➕</button>
            <button @click="sendScore(game.user2.id, -1)">➖</button>
          </div>
        </div>
      </div>

      <div class="text-center text-sm text-gray-600">
        <p>현재 세트: {{ currentSet + 1 }}</p>
        <p class="mt-2">{{ game.majorCategory }} - {{ game.minorCategory }} / {{ game.ruleTitle }}</p>
        <p class="mt-1">{{ game.place }} · {{ formatDate(game.matchDate) }}</p>
      </div>

      <div class="flex justify-around mt-8">
        <button @click="nextSet" class="bg-gray-200 px-4 py-2 rounded-full">다음 세트</button>
        <button @click="pauseGame" class="bg-gray-200 px-4 py-2 rounded-full">일시 중지</button>
        <button @click="finishGame" class="bg-red-600 text-white px-4 py-2 rounded-full">경기 종료</button>
      </div>
    </div>

    <!-- 종료 모달 -->
    <div v-if="showFinishModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-xl text-center space-y-4">
        <h2 class="text-lg font-bold">경기가 종료되었습니다!</h2>
        <button @click="goToResult" class="bg-blue-500 text-white px-4 py-2 rounded-full">결과 보기</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../api/api'
import { socket } from '../../websocket'

const route = useRoute()
const router = useRouter()
const gameId = route.params.gameId

const chatRoomId = ref()
const game = ref()
const score1 = ref(0)
const score2 = ref(0)
const currentSet = ref(0)
const timeLeft = ref('')
const remainSeconds = ref(0)
const showFinishModal = ref(false)

const formatDate = (dateStr) => {
  const d = new Date(dateStr)
  return d.toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })
}


const startTimer = () => {
  if (remainSeconds.value <= 0) {
    timeLeft.value = '제한 없음'
    return
  }
   setInterval(() => {
    if (remainSeconds.value > 0) {
      remainSeconds.value--
      const min = Math.floor(remainSeconds.value / 60)
      const sec = remainSeconds.value % 60
      timeLeft.value = `${min}분 ${sec}초`
    }
  }, 1000)
}
const connectWebSocket = () => {
  socket.connect(chatRoomId.value, () => {
    socket.subscribe(`${chatRoomId.value}`)
    socket.onMessage((payload) => {
      console.log("<받은 페이로드>")
      console.log(payload)
      switch (payload.type) {
        case 'SCORE':
          if (payload.userId === game.value.user1.id) {
            score1.value += payload.delta
          } else if (payload.userId === game.value.user2.id) {
            score2.value += payload.delta
          }
          break
        case 'SET':
          currentSet.value = payload.set
          break
        case 'FINISH':
          showFinishModal.value = true
          break
      }
    })
  })
}

const sendScore = (userId, delta) => {
  socket.sendGameEvent(chatRoomId.value, {
    type: 'SCORE',
    userId,
    delta
  })
}

const nextSet = () => {
  socket.sendGameEvent(chatRoomId.value, {
    type: 'SET',
    set: currentSet.value
  })
}

const finishGame = () => {
  socket.sendGameEvent(chatRoomId.value, {
    type: 'FINISH'
  })
}

const goToResult = () => {
  router.push(`/games/${chatRoomId.value}/result`)
}

const goBack = () => {
  router.back()
}

onMounted(async () => {
  const res = await api.get(`/api/games/${gameId}/detail`)
  game.value = res.data
  score1.value = res.data.score1
  score2.value = res.data.score2
  chatRoomId.value = res.data.chatRoomId
  
  currentSet.value = res.data.currentSet || 0
  if (res.data.limitSeconds !== -1 && res.data.startedAt) {
    const startedAt = new Date(res.data.startedAt)
    const now = new Date()
    const elapsed = Math.floor((now - startedAt) / 1000)
    remainSeconds.value = Math.max(0, res.data.limitSeconds - elapsed)
    startTimer()
  } else {
    timeLeft.value = '제한 없음'
  }

  connectWebSocket()
})
</script>