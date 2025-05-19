<template>
      <HeaderComp />

  <div class="min-h-screen bg-gray-50 flex flex-col mb-20">

    <div class="bg-white shadow-sm z-10 px-4 md:px-8 pt-20 mb-2">
<!-- 지역 선택 박스 -->
      <div class="bg-white shadow-sm z-10 px-4 md:px-8 py-4">
        <div class="max-w-4xl mx-auto w-full">
          <label class="block text-sm text-gray-700 font-medium mb-2">📍 지역 선택</label>
          <div class="flex flex-col md:flex-row md:space-x-4 space-y-2 md:space-y-0">
            <!-- 1차 지역 -->
            <select v-model="selectedPrimary" @change="handlePrimaryChange"
                    class="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-indigo-200">
              <option value="" disabled selected>시/도 선택</option>
              <option v-for="(districts, primary) in regionMap" :key="primary" :value="primary">
                {{ primary }}
              </option>
            </select>

            <!-- 2차 지역 -->
            <select v-model="selectedSecondary" :disabled="!selectedPrimary" @change="fetchGames"
                    class="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-indigo-200 disabled:bg-gray-100 disabled:text-gray-400">
              <option value="" disabled selected>시/군/구 선택</option>
              <option v-for="sub in regionMap[selectedPrimary] || []" :key="sub" :value="sub">
                {{ sub }}
              </option>
            </select>
            

            
          </div>

                 
        </div>
 
      </div>
    </div>
    <div class="fixed bottom-20 left-5 text-center"> 
            <router-link to="/create-game" >
              <div class="bg-blue-500 inline-block text-white w-full md:mx-8 py-3 px-3 mt-3 rounded-[30px] text-center text-sm font-semibold">
                <div class="flex items-center justify-center gap-2">
                    <span>
                    <svg width="14" height="14" viewBox="0 0 7 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 3.5H1" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M3.5 1V6" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    </span>
                    <span>
                      게임 만들기
                    </span>
                  </div>
                </div>
            </router-link>
    </div>
    <main class="flex-1 pt-6 pb-16 px-4 md:px-8 max-w-4xl mx-0">
      <h2 class="text-2xl font-semibold text-gray-800 mb-4 text-center flex justify-between items-center">
        <span>
          모집 중인 경기
        </span>
        <div class="text-left">
          <button @click="showFilterMenu = !showFilterMenu" class=" text-[0.7rem] border bg-blue-500 text-white px-5  text-center items-center py-0 rounded">
                  필터
          </button>
        </div>
      </h2>
        <div class="text-sm mt-[-0.6rem]">
          <!-- 필터 버튼 -->
          <div class="relative w-[100%]">
            <div v-if="showFilterMenu" class="absolute right-0 mt-0 bg-white border rounded shadow-md z-20 text-right">
              <button @click="setSort('popular')" class="block px-4 py-2 hover:bg-gray-50 w-full text-left">
                인기순
              </button>
              <button @click="setSort('latest')" class="block px-4 py-2 hover:bg-gray-50 w-full text-left">
                최신순
              </button>
            </div>
          </div>
        </div>
      <div v-if="loading" class="text-center text-gray-500">불러오는 중...</div>
      <div v-else-if="games.length === 0" class="text-center text-gray-400">표시할 경기가 없습니다</div>

      <div v-else class="space-y-6">
        <div v-for="game in games" :key="game.id" class="bg-white border rounded-lg shadow-sm p-6">
          <div class="flex justify-between items-center mb-2">
            <h3 class="text-xl font-bold text-gray-900">{{ game.title }}</h3>
            <p class="text-sm text-gray-400">생성: {{ formatDate(game.createdAt) }}</p>
          </div>

          <!-- 참가자 -->
          <div class="flex items-center space-x-3 mb-3">
            <img :src="game.ownerProfileUrl" alt="profile" class="w-9 h-9 rounded-full object-cover" />
            <p class="text-sm text-gray-700 font-medium">{{ game.ownerNickname }}</p>
          </div>

          <!-- 카테고리 -->
          <div class="text-sm text-gray-600 mb-2">
            카테고리: <span class="font-semibold">{{ game.majorCategory }}</span> / {{ game.minorCategory }}
          </div>

          <!-- 일정, 장소 -->
          <div class="text-sm text-gray-700 mb-3">
            🕒 {{ formatDate(game.matchDate) }}<br />
            📍 {{ game.matchLocation || '장소 미정' }}
          </div>

          <!-- 룰 정보 -->
          <div class="bg-gray-100 p-4 rounded mb-3">
            <p class="text-sm text-gray-500 mb-1">룰 제목</p>
            <h4 class="text-md font-semibold text-gray-800">{{ game.ruleTitle }}</h4>
            <p class="text-sm text-gray-700 mt-1">{{ game.ruleDescription }}</p>
            <p class="text-sm text-gray-600 mt-2"><strong>승리 조건:</strong>  {{ game.winCondition=='SETS_HALF_WIN' ? '과반 세트 승리' : '최다 세트/점수 획득' }}</p>
          </div>

          <!-- 포맷 -->
          <div class="text-sm text-gray-600 mb-2">
            포인트: {{ game.points }} / 세트: {{ game.sets }} / 듀레이션: {{ game.duration }}
          </div>

          <!-- 하단: 인원 + 버튼 -->
          <div class="flex justify-between items-center mt-4">
            <p class="text-sm text-gray-500">
              인원: {{ game.currentParticipantCounts }} / {{ game.maxPlayers }}
            </p>
            <button
              class="px-4 py-2 rounded text-white text-sm font-medium"
              :class="game.applied ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-500 hover:bg-indigo-600'"
              :disabled="game.applied"
              @click="() => !game.applied && confirmApply(game)"
            >
              {{ game.applied ? '신청 완료' : '참가' }}
            </button>
          </div>
        </div>
      </div>
    </main>



  </div>
      <FooterNav tab="home" />
    <CustomAlert v-if="alertMsg" :message="alertMsg" @confirm="applyConfirmed" @cancel="() => alertMsg = ''" />
    <CustomToast />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../api/api'
import HeaderComp from '../../components/HeaderComp.vue'
import FooterNav from '../../components/FooterNav.vue'
import CustomAlert from '../../components/CustomAlert.vue'
import CustomToast from '../../components/CustomToast.vue'
import { useToast } from '../../composable/useToast'

const { showToast } = useToast()

const games = ref([])
const loading = ref(true)
const alertMsg = ref('')
const selectedGame = ref(null)

const sortOption = ref('latest')
const showFilterMenu = ref(false)

const regionMap = {
  '서울시': ['강남구', '마포구', '송파구'],
  '경기도': ['수원시', '성남시', '고양시'],
  '부산시': ['해운대구', '금정구'],
  '대구시': ['수성구', '중구']
}

const selectedPrimary = ref('')
const selectedSecondary = ref('')

const handlePrimaryChange = () => {
  selectedSecondary.value = ''
}


const fetchGames = async () => {
  loading.value = true
  try {
    const res = await api.get('/api/games/list', {
      params: {
      region: selectedPrimary.value && selectedSecondary.value
            ? `${selectedPrimary.value} ${selectedSecondary.value}`
            : null,       
       sort: sortOption.value,
      },
    })
    games.value = res.data.map(game => ({
      ...game,
      applied: false
    }))
  } catch (err) {
    console.error('게임 목록 로드 실패', err)
  } finally {
    loading.value = false
  }
}

const setSort = (option) => {
  sortOption.value = option
  showFilterMenu.value = false
  fetchGames()
}

const formatDate = (dateStr) => {
  if (!dateStr) return '미정'
  const date = new Date(dateStr)
  return date.toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })
}

const confirmApply = (game) => {
  selectedGame.value = game
  alertMsg.value = `${game.ownerNickname}님의 경기에 신청하시겠습니까?`
}

const applyConfirmed = async () => {
  if (!selectedGame.value) return
  try {
    await api.post(`/api/games/${selectedGame.value.id}/apply`)
    showToast('신청이 완료되었습니다!')
  } catch (err) {
    showToast(err.response?.data?.message || '신청 실패. 다시 시도해주세요.')
  } finally {
    alertMsg.value = ''
    selectedGame.value = null
  }
}

onMounted(fetchGames)
</script>
