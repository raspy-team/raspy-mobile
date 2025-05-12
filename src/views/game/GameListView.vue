<template>
  <div class="pt-20 pb-8 bg-white min-h-screen flex flex-col">
    <Header />

    <h2 class="text-xl font-semibold mb-6 text-center">게임 목록</h2>

    <div v-if="loading" class="text-center text-gray-500">불러오는 중...</div>
    <div v-else-if="games.length === 0" class="text-center text-gray-400">표시할 게임이 없습니다</div>

    <div v-else class="space-y-4 flex-1">
      <div v-for="game in games" :key="game.id" class="p-4 border rounded-lg shadow-sm">
        <h3 class="text-lg font-bold mb-1">{{ game.title }}</h3>
        <p class="text-sm text-gray-500">{{ game.majorCategory }} > {{ game.minorCategory }}</p>
        <p class="text-sm text-gray-700 mt-1">{{ game.description }}</p>
        <p class="text-sm text-gray-500 mt-2">
          인원: {{ game.currentParticipantCounts }} / {{ game.maxPlayers }}
        </p>
        <p class="text-sm text-gray-500">일시: {{ formatDate(game.matchDate) }}</p>
        <p class="text-sm text-gray-500">장소: {{ game.matchLocation || '미정' }}</p>
        <button
          class="mt-3 px-4 py-2 rounded text-white text-sm font-medium"
          :class="game.applied ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'"
          :disabled="game.applied"
          @click="() => !game.applied && confirmApply(game)"
        >
          {{ game.applied ? '신청 완료' : '신청하기' }}
        </button>
      </div>
    </div>

    <footer class="mt-8 py-4 border-t text-center text-sm text-gray-500">
      <router-link to="/inbox" class="text-blue-600 hover:underline mr-4">📥 인박스 바로가기</router-link>
      <router-link to="/create-game" class="text-blue-600 hover:underline">🎮 게임 생성하기</router-link>
      <router-link to="/upcoming-games" class="text-blue-600 hover:underline">📥 나의 예정된 게임</router-link>
    </footer>

    <CustomAlert v-if="alertMsg" :message="alertMsg" @confirm="applyConfirmed" @cancel="() => alertMsg = ''" />
    <CustomToast />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../api/api'
import Header from '../../components/HeaderComp.vue'
import { useToast } from '../../composable/useToast'
import CustomAlert from '../../components/CustomAlert.vue'
import CustomToast from '../../components/CustomToast.vue'

const { showToast } = useToast()

const games = ref([])
const loading = ref(true)
const alertMsg = ref('')
const selectedGame = ref(null)

const fetchGames = async () => {
  try {
    const res = await api.get('/api/games/list')
    games.value = res.data.map(game => ({ ...game, applied: false }))
  } catch (err) {
    console.error('게임 목록 로드 실패', err)
  } finally {
    loading.value = false
  }
}

const formatDate = dateStr => {
  if (!dateStr) return '미정'
  const date = new Date(dateStr)
  return date.toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })
}

const confirmApply = (game) => {
  selectedGame.value = game
  alertMsg.value = `정말로 ${game.title} 게임에 신청하시겠습니까?`
}

const applyConfirmed = async () => {
  if (!selectedGame.value) return
  try {
    await api.post(`/api/games/${selectedGame.value.id}/apply`)
    showToast('신청이 완료되었습니다!')
  } catch (err) {
    console.error('신청 실패', err.response?.data?.message)
    showToast(err.response?.data?.message || '신청 실패. 다시 시도해주세요.')
  } finally {
    alertMsg.value = ''
    selectedGame.value = null
  }
}

onMounted(fetchGames)
</script>

<style>
@keyframes fadein {
  0% { opacity: 0; transform: translate(-50%, 10px); }
  100% { opacity: 1; transform: translate(-50%, 0); }
}
.animate-fadein {
  animation: fadein 0.3s ease-out;
}
</style>
