<template>
      <HeaderComp />
    <div class="min-h-screen bg-gray-50 pb-16">
    <!-- Status Bar -->
    <div class="bg-white h-6 w-full"></div>
    
    <!-- Header with Logo and Actions -->
    <header class="px-4 py-3 mt-5 ">
    <!-- -->
      
      <!-- Navigation Tabs 
      <div class="flex mt-4">
        <button
          v-for="(tab, index) in tabs"
          :key="index"
          @click="activeTab = tab.id"
          class="flex-1 py-2 text-center relative cursor-pointer"
          :class="activeTab === tab.id ? 'text-orange-500 font-medium' : 'text-gray-500'"
        >
          {{ tab.name }}
          <div
            v-if="activeTab === tab.id"
            class="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-orange-500 rounded-full"
          ></div>
        </button>
      </div>-->
    </header>
    
    <!-- Main Content -->
    <main class="pt-3 px-4 pb-4">
      <!-- Menu Items -->
      <div class="grid grid-cols-2 gap-3 mb-6">
        <div v-for="(action, index) in menuItems" :key="index" @click="router.push(action.link)"
          class="bg-white rounded-xl shadow-sm py-2 px-4 flex flex-row gap-2 items-center justify-left cursor-pointer hover:shadow-md transition relative">
          <div class="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center ">
            <i :class="`${action.icon} text-orange-500 text-md`"></i>
          </div>
          <span class="text-[0.86rem] text-gray-700 font-[500] text-center text-gray-500 whitespace-nowrap overflow-hidden text-overflow-ellipsis">{{ action.name }}</span>
          <div v-if="action.badge" class="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
            <span class="text-xs text-white font-medium">{{ action.badge }}</span>
          </div>
        </div>
      </div>
      
      <!-- 게임리스트 -->
      <div v-if="activeTab === 'available'" class="space-y-4">
        
    
      <!-- 필터 버튼 -->
      <div class="relative flex justify-between itemw-full pt-3  border-t">
        <div class="text-gray-700 font-[500]  pl-1 ">
                <button @click="showRegionModal = true" class="flex items-center border rounded px-4 py-2 text-sm hover:bg-gray-50 bg-white">
                  <i class="fas fa-map-marker-alt text-orange-500 mr-2"></i>
                  <span>{{ selectedSecondary || '지역 선택' }}</span>
                  <i class="fas fa-chevron-down ml-3 text-gray-500 text-xs"></i>
                </button>
        </div>
        <div class="text-right">
                <!-- 선택된 필터 표시 버튼 -->
                <button 
                  @click="showFilterMenu = !showFilterMenu"
                  class="flex items-center absolute right-0 justify-between w-[30%] bg-white px-4 py-2 border rounded text-sm bg-white hover:bg-gray-50">
                  <span>
                    {{ sortOption === 'popular' ? '인기순' : sortOption === 'latest' ? '최신순' : '필터 선택' }}
                  </span>
                  <i class="fas fa-chevron-down ml-2 text-gray-500"></i>
                </button>

                <!-- 필터 드롭다운 메뉴 -->
                <div v-if="showFilterMenu" class="absolute right-0 mt-1 bg-white border rounded shadow-md z-20 text-left w-full">
                  <button @click="setSort('popular'); showFilterMenu = false" class="block px-4 py-2 hover:bg-gray-50 w-full text-left">
                    인기순
                  </button>
                  <button @click="setSort('latest'); showFilterMenu = false" class="block px-4 py-2 hover:bg-gray-50 w-full text-left">
                    최신순
                  </button>
                </div>
        </div>
      </div>


        <div v-for="(game, index) in games" :key="index" class="bg-white rounded-xl shadow-sm overflow-hidden">
          <div class="p-4">
            <div class="flex justify-between items-start">

              <!-- 좌측: 타이틀, 카테고리, 1vs1 표시 -->
              <div>
                <h3 class="font-medium text-lg text-gray-800">{{ game.title }}</h3>

                <div class="flex items-center space-x-1 mt-0.5">
                  <span class="font-semibold">{{ game.majorCategory }}</span>
                  <span class="">/ {{ game.minorCategory }}</span>

                  <div class="pl-2">
                    <span class="bg-orange-100 text-orange-600 text-xs px-2 py-0.5  rounded-full font-medium">
                      1vs1
                    </span>
                  </div>
                </div>
              </div>

              <!-- 우측: 더보기 버튼 -->
              <button @click="alert('준비 중')" class="text-gray-400 ">
                <i class="fas fa-ellipsis-h"></i>
              </button>

            </div>

            <div class="mt-3 flex items-center text-sm text-gray-500">
              <i class="fas fa-map-marker-alt mr-2 text-orange-500"></i>
              <span>{{ game.matchLocation != ' ' ? game.matchLocation :  '미정' }}</span>
            </div>
            <div class="mt-2 flex items-center text-sm text-gray-500 mb-3">
              <i class="far fa-calendar mr-2 text-orange-500"></i>
              <span>{{ formatDate(game.matchDate) }}</span>
            </div>



              <!-- 룰 정보 -->
              <div class="border border-gray-200 p-4 rounded-[5px] mb-3 flex flex-col gap-1 relative">
                <span class="absolute right-0 top-0 bg-[#f97316] text-white font-bold text-[0.8rem] px-4 py-1" style="border-radius :0px 0px 0px 8px">
                  경기 규칙
                </span>
                <h4 class="text-md font-semibold text-gray-800">{{ game.ruleTitle }}</h4>
                <p class="text-sm text-gray-700 mt-1 py-2">{{ game.ruleDescription }}</p>
            
                <div class="text-sm text-gray-600 mb-2 mt-2 flex flex-col gap-1 mt-5">
                  <div class="flex items-start mb-2">
                    <i class="fas fa-trophy text-[#f97316] w-4 mr-2 mt-1"></i>
                    <div class="w-[30dvw] font-light text-gray-500">
                      세트 승리 조건
                    </div>
                    <div class="text-[0.88rem] w-[40dvw] ">
                      {{ game.winCondition=='SETS_HALF_WIN' ? '승리 점수 달성' : '시간 도달' }}
                    </div>
                  </div>

                  <div class="flex items-center mb-2">
                    <i class="fas fa-star text-[#f97316] w-4 mr-2"></i> 
                    <div class="w-[30dvw] font-light text-gray-500">
                      세트 승리 점수
                    </div>
                    <div>
                      {{ game.points == -1  ?'제한 없음' : game.points + '점'}}
                    </div>
                  </div>

                  <div class="flex items-center mb-2">
                    <i class="fas fa-layer-group text-[#f97316] w-4 mr-2"></i>
                    <div class="w-[30dvw] font-light text-gray-500">
                      총 세트
                    </div>
                    <div>
                      {{ game.sets }}세트
                    </div>
                  </div>

                  <div class="flex items-center">
                    <i class="fas fa-clock text-[#f97316] w-4 mr-2"></i>
                    <div class="w-[30dvw] font-light text-gray-500">
                      세트 제한시간
                    </div>
                    <div>
                      {{ game.duration >= 60 ? Math.floor(game.duration / 60) + '분 ' + (game.duration % 60) + '초' : game.duration + '초' }}
                    </div>
                  </div>

   
                </div>
              </div>

            <div class="mt-5 flex items-center justify-between">

              <div class="flex items-center">
                <div class="w-8 h-8 rounded-full overflow-hidden border-2 border-white">
                  <img :src="game.ownerProfileUrl || 'https://chelseafc360blog.files.wordpress.com/2013/03/mario-gomez.jpg'" alt="프로필" class="w-full h-full object-cover" />
                </div>

                <div class="ml-2 flex items-center space-x-1">
                  <!-- 닉네임 -->
                  <p class="text-sm font-medium text-gray-800">@{{ game.ownerNickname }}</p>

                  <!-- 매너점수 -->
                  <div 
                    class="flex items-center text-xs font-semibold pl-2"
                    :class="[
                      game.mannerScore >= 4 ? 'text-green-500' : 
                      game.mannerScore >= 2 ? 'text-orange-500' : 
                      game.mannerScore > 0 ? 'text-red-500' : 
                      'text-gray-400'
                    ]"
                  >
                            <i 
                          :class="[
                            game.mannerScore >= 4 ? 'fas fa-face-smile' : 
                            game.mannerScore >= 2 ? 'fas fa-face-meh' : 
                            game.mannerScore > 0 ? 'fas fa-face-frown' : 
                            'fas fa-user-slash'
                          ]" 
                          class="mr-1"
                        ></i>
                        {{  game.mannerScore.toFixed(1)}}
                  </div>
                </div>
              </div>

              <!-- 우측: 생성 시각 -->
              <div class="text-xs text-gray-500">
                {{ formatTimeAgo(game.createdAt) }}
              </div>

            </div>


            <div class="flex items-center mt-3 space-x-2">

              <!-- 참가하기 버튼 (70%) -->
              <button 
                :disabled="game.applied"
                @click="() => !game.applied && confirmApply(game)"
                :class="[
                  'h-12 flex-grow py-2.5 font-semibold rounded-full transition text-white',
                  game.applied 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-orange-500 hover:bg-orange-600 cursor-pointer'
                ]">
                {{ game.applied ? '신청 완료' : '참가하기' }}
              </button>

              <!-- 댓글 버튼 -->
              <button 
                @click="goToComments(game)"
                class="w-12 h-12 flex items-center justify-center bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition">
                <i class="fas text-gray-500 fa-comment"></i>
              </button>

              <!-- 공유 버튼 -->
              <button 
                @click="shareGame(game)"
                class="w-12 h-12 flex items-center justify-center bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition">
                <i class="fas text-gray-500 fa-share"></i>
              </button>

            </div>


          </div>
        </div>
      </div>
      
      <!-- My Games 
      <div v-if="activeTab === 'my'" class="space-y-4">
        <div class="flex justify-between items-center mb-2">
          <h2 class="text-lg font-semibold text-gray-800">My Matches</h2>
          <button class="text-orange-500 text-sm font-medium cursor-pointer">History</button>
        </div>
        <div v-for="(game, index) in myGames" :key="index" class="bg-white rounded-xl shadow-sm overflow-hidden">
          <div class="p-4">
            <div class="flex justify-between items-start">
              <div>
                <h3 class="font-medium text-lg text-gray-800">{{ game.title }}</h3>
                <p class="text-gray-500 text-sm mt-1">{{ game.type }}</p>
              </div>
              <span :class="`text-xs px-3 py-1 rounded-full font-medium ${game.status === 'Active' ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'}`">
                {{ game.status }}
              </span>
            </div>
            <div class="mt-3 flex items-center text-sm text-gray-500">
              <i class="fas fa-map-marker-alt mr-2 text-orange-500"></i>
              <span>{{ game.location }}</span>
            </div>
            <div class="mt-2 flex items-center text-sm text-gray-500">
              <i class="far fa-calendar mr-2 text-orange-500"></i>
              <span>{{ game.date }} • {{ game.time }}</span>
            </div>
            <div class="mt-3 flex items-center justify-between">
              <div class="flex items-center">
                <div class="w-8 h-8 rounded-full overflow-hidden border-2 border-white">
                  <img :src="userAvatar" alt="You" class="w-full h-full object-cover" />
                </div>
                <div class="mx-2 text-gray-400 font-medium">VS</div>
                <div class="w-8 h-8 rounded-full overflow-hidden border-2 border-white">
                  <img :src="game.opponent.avatar" alt="Opponent" class="w-full h-full object-cover" />
                </div>
              </div>
            </div>
            <button @click="openGameDetails(game)" class="mt-3 w-full py-2.5 bg-gray-100 text-gray-700 rounded-full font-medium !rounded-button cursor-pointer hover:bg-gray-200 transition">
              View Details
            </button>
          </div>
        </div>
      </div>-->
    </main>
    
    <!-- Bottom Tab Bar -->
    <div class="fixed bottom-0 left-0 right-0 bg-white shadow-md px-2 py-2 grid grid-cols-3 z-10">
      <div
        v-for="(item, index) in navItems"
        :key="index"
        @click="currentTab = item.id"
        class="flex flex-col items-center cursor-pointer"
      >
        <i :class="`${item.icon} ${currentTab === item.id ? 'text-orange-500' : 'text-gray-400'} text-xl`"></i>
        <span class="text-xs mt-1" :class="currentTab === item.id ? 'text-orange-500' : 'text-gray-500'">{{ item.label }}</span>
      </div>
    </div>
    
    <!-- FAB -->
    <!-- <button class="fixed right-5 bottom-20 w-14 h-14 bg-orange-500 rounded-full shadow-lg flex items-center justify-center cursor-pointer !rounded-button hover:bg-orange-600 transition z-20">
      <i class="fas fa-plus text-white text-xl"></i>
    </button> -->
    
    <!-- Game Details Modal -->
    <div v-if="showGameDetails" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
      <div class="bg-white rounded-xl w-11/12 max-h-[80vh] overflow-y-auto">
        <div class="p-5">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-bold text-gray-800">{{ selectedGame.title }}</h3>
            <button @click="showGameDetails = false" class="text-gray-500 cursor-pointer">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="space-y-4">
            <div class="bg-orange-50 p-3 rounded-lg">
              <p class="text-sm text-gray-700"><span class="font-medium">Category:</span> {{ selectedGame.type }}</p>
              <p class="text-sm text-gray-700 mt-1"><span class="font-medium">Status:</span> {{ selectedGame.status }}</p>
            </div>
            
            <div>
              <h4 class="font-medium text-gray-800 mb-2">Match Details</h4>
              <p class="text-sm text-gray-700 mb-1"><i class="fas fa-map-marker-alt mr-2 text-orange-500"></i> {{ selectedGame.location }}</p>
              <p class="text-sm text-gray-700"><i class="far fa-calendar mr-2 text-orange-500"></i> {{ selectedGame.date }} • {{ selectedGame.time }}</p>
            </div>
            
            <div>
              <h4 class="font-medium text-gray-800 mb-2">Opponent</h4>
              <div class="flex items-center">
                <div class="w-10 h-10 rounded-full overflow-hidden">
                  <img :src="selectedGame.opponent.avatar" alt="Opponent" class="w-full h-full object-cover" />
                </div>
                <div class="ml-3">
                  <p class="text-sm font-medium text-gray-800">{{ selectedGame.opponent.name }}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h4 class="font-medium text-gray-800 mb-2">Rules & Description</h4>
              <p class="text-sm text-gray-700">{{ selectedGame.description }}</p>
            </div>
            
            <div>
              <h4 class="font-medium text-gray-800 mb-2">References</h4>
              <ul class="text-sm text-gray-700 list-disc pl-5">
                <li v-for="(ref, index) in selectedGame.references" :key="index" class="mb-1">
                  {{ ref }}
                </li>
              </ul>
            </div>
          </div>
          
          <div class="mt-6 flex space-x-3">
            <button class="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-full font-medium !rounded-button cursor-pointer hover:bg-gray-200 transition">
              Cancel Match
            </button>
            <button class="flex-1 py-2.5 bg-orange-500 text-white rounded-full font-medium !rounded-button cursor-pointer hover:bg-orange-600 transition">
              Contact Opponent
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 지역 선택 모달 -->
  <div v-if="showRegionModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
    <div class="bg-white rounded-xl w-11/12 max-w-md p-5 space-y-4">
      <h3 class="text-lg font-bold text-gray-800 mb-4">지역 선택</h3>
      <select v-model="selectedPrimary" @change="selectedSecondary = ''" class="w-full border rounded px-3 py-2 text-sm">
        <option value="" disabled selected>시/도 선택</option>
        <option v-for="(districts, primary) in regionMap" :key="primary" :value="primary">{{ primary }}</option>
      </select>
      <select v-model="selectedSecondary" :disabled="!selectedPrimary" class="w-full border rounded px-3 py-2 text-sm">
        <option value="" disabled selected>시/군/구 선택</option>
        <option v-for="sub in regionMap[selectedPrimary] || []" :key="sub" :value="sub">{{ sub }}</option>
      </select>
      <div class="flex justify-end space-x-2 pt-3">
        <button @click="showRegionModal = false" class="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 text-sm">취소</button>
        <button :disabled="!selectedSecondary" @click="applyRegionFilter" class="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm disabled:opacity-50">적용</button>
      </div>
    </div>
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
import {useRouter} from "vue-router"
import regionMap from "../../assets/regionMap.json"

function formatTimeAgo(dateString) {
    const now = new Date();
    const createdAt = new Date(dateString);
    const diff = (now - createdAt) / 1000; // 초 단위

    if (diff < 60) {
      return `${Math.floor(diff)}초 전`;
    } else if (diff < 3600) {
      return `${Math.floor(diff / 60)}분 전`;
    } else if (diff < 86400) {
      return `${Math.floor(diff / 3600)}시간 전`;
    } else if (diff < 2592000) {
      return `${Math.floor(diff / 86400)}일 전`;
    } else if (diff < 31104000) {
      return `${Math.floor(diff / 2592000)}개월 전`;
    } else {
      return `${Math.floor(diff / 31104000)}년 전`;
    }
  }

const router = useRouter()

const { showToast } = useToast()

// Menu items
const menuItems = [
 // { name: '경기 찾기', icon: 'fas fa-search', link: '/find-match' },
  { name: '경기 생성', icon: 'fas fa-plus', link: '/create-game' },
 // { name: '리더보드', icon: 'fas fa-trophy', link: '/leader-board' },
  { name: '경기 요청', icon: 'fas fa-envelope', badge: '2', link: '/inbox' }
];
const showGameDetails = ref(false);
const activeTab = ref('available');
const showRegionModal = ref(false)

const applyRegionFilter = () => {
  showRegionModal.value = false
  fetchGames()
}


const games = ref([])
const loading = ref(true)
const alertMsg = ref('')
const selectedGame = ref(null)

const sortOption = ref('latest')
const showFilterMenu = ref(false)


const selectedPrimary = ref('전국')
const selectedSecondary = ref('전국')

// const handlePrimaryChange = () => {
//   selectedSecondary.value = ''
// }


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

// const openGameDetails = (game) => {
//   selectedGame.value = game;
//   showGameDetails.value = true;
// };

onMounted(fetchGames)
</script>

<style scoped>
  .fa-search {
  font-size: 14px;
}

input:focus {
  outline: none;
}

input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.text-overflow-ellipsis {
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}
</style>