<template>
<Header :has-referer="true" title="초대 정보" />
  <div class="min-h-screen bg-gray-50 flex flex-col items-center py-20 px-5">
    <div v-if="loading" class="flex justify-center items-center h-[50vh]">
      <i class="fas fa-spinner fa-spin text-3xl text-orange-400"></i>
    </div>
    <div v-else-if="errorMsg" class="text-red-500 text-center my-10">
      <i class="fas fa-times-circle text-2xl mb-2"></i><br>
      {{ errorMsg }}
    </div>
    <div v-else-if="game" class="w-full max-w-lg bg-white shadow-lg rounded-xl p-5">
      <!-- 타이틀/카테고리/생성자/시간 -->
      <div class="flex justify-between items-start mb-3">
        <div class="flex flex-col flex-1">
          <h2 class="text-xl font-extrabold text-gray-900">{{ game.ruleTitle }}</h2>
          <div class="text-xs text-orange-500 font-medium mb-2 flex gap-1 items-center">
            {{ game.majorCategory }} <span class="mx-1 text-orange-500">&gt;</span> {{ game.minorCategory }}
          </div>
        </div>
        <div class="text-gray-600 text-[0.82rem] text-right min-w-[64px]">{{ formatTimeAgo(game.createdAt) }}</div>
      </div>
      <!-- VS AREA -->
      <div class="flex justify-between items-center px-7 pt-1 pb-4">
        <div @click="router.push('/profile/'+game.ownerId)" class="flex-1 flex flex-col items-center gap-1 cursor-pointer">
          <img :src="game.ownerProfileUrl || Default" class="w-14 h-14 rounded-full border-2 border-orange-400 shadow bg-white" />
          <div class="text-gray-700 font-semibold text-sm">{{ game.ownerNickname }}</div>
          <div class="text-xs font-semibold flex items-center pr-2"
               :class="mannerColor(game.mannerScore)">
            <i :class="mannerIcon(game.mannerScore)" class="mr-1"></i>
            {{ game.mannerScore.toFixed(1) }}
          </div>
        </div>
        <div class="vs-area flex flex-col gap-1 items-center justify-center mx-3 mt-5">
          <div class="text-lg font-black tracking-tight text-orange-500">VS</div>
          <div class="text-sm font-semibold text-orange-400">경기 전</div>
        </div>
        <div class="flex-1 flex flex-col items-center gap-2 mt-6">
          <div class="w-14 h-14 bg-gradient-to-tr from-gray-100 to-gray-200 rounded-full border border-gray-200 flex items-center justify-center">
            <i class="fas fa-user-clock text-2xl text-gray-400"></i>
          </div>
          <div class="flex justify-center gap-1 mt-2 font-semibold text-xs text-gray-400 opacity-70">
            <span>-</span><span>-</span><span>-</span>
          </div>
        </div>
      </div>
      <!-- 규칙/세부정보 -->
      <div class="bg-white rounded-xl py-6 max-w-lg w-full">
        <div class="flex gap-3 mb-3 items-center">
          <div class="font-semibold text-gray-700">{{ game.ruleTitle }}</div>
          <div class="text-xs text-orange-500 font-medium flex gap-1 items-center">
            {{ game.majorCategory }} <span class="mx-1 text-orange-500">&gt;</span> {{ game.minorCategory }}
          </div>
        </div>
        <div class="text-sm text-gray-700 space-y-4">
          <div>
            <!-- 규칙 설명 접기/펼치기 -->
            <div v-if="!expanded" class="relative text-right">
              <p class="line-clamp-2 leading-relaxed text-left whitespace-pre-line border-b pb-4">
                {{ game.ruleDescription }}
              </p>
              <button @click="expanded = true" class="text-blue-600 text-sm hover:underline mt-1">
                펼치기
              </button>
            </div>
            <div v-else class="relative text-right">
              <p class="leading-relaxed whitespace-pre-line text-left border-b pb-4">
                {{ game.ruleDescription }}
              </p>
              <button @click="expanded = false" class="text-blue-600 text-sm hover:underline mt-1">
                접기
              </button>
            </div>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">세트 승리 기준</span>
            <span>{{ game.winCondition === 'SETS_HALF_WIN' ? '점수 달성' : '시간 도달' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">한세트 승리에 필요한 점수</span>
            <span>{{ game.points === -1 ? '제한 없음' : game.points + '점' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">총 세트 수</span>
            <span>{{ game.sets }}세트</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">세트 제한 시간</span>
            <span>
              {{ game.duration === -1 ? '제한 없음' :
                game.duration >= 60
                  ? Math.floor(game.duration / 60) + '분 ' + (game.duration % 60) + '초'
                  : game.duration + '초' }}
            </span>
          </div>
        </div>
      </div>
      <!-- 장소/날짜 -->
      <div class="mt-3 flex flex-col justify-start items-start text-sm text-gray-500 gap-1 mb-2">
        <div class="flex items-center gap-2">
          <i class="fas w-3 fa-map-marker-alt text-orange-500"></i>
          <span>{{ (!game.matchLocation || game.matchLocation === ' ') ? '미정' : game.matchLocation }}</span>
        </div>
        <div class="flex items-center gap-2">
          <i class="far w-3 fa-calendar text-orange-500"></i>
          <span>{{ formatDate(game.matchDate) }}</span>
        </div>
      </div>
      <!-- 참가/공유 버튼 -->
      <div class="mt-4 flex items-center gap-2">
        <button 
          :disabled="game.applied"
          @click="applyGame(game.id)"
          :class="[
            'h-11 flex-grow font-semibold rounded-full transition text-white',
            game.applied ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 cursor-pointer'
          ]">
          {{ game.applied ? '신청 완료' : '참가하기' }}
        </button>
      </div>
    </div>
  </div>

  <custom-toast />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api/api'
import Header from "@/components/HeaderComp.vue"
import Default from '@/assets/default.png'

const route = useRoute()
const router = useRouter()
const expanded = ref(false)

const game = ref(null)
const loading = ref(true)
const errorMsg = ref('')

// 1. 라우트에서 :gameId 파라미터 추출
const gameId = route.params.gameId

// 2. 경기 정보 fetch (mounted)
onMounted(async () => {
  loading.value = true
  try {
    const res = await api.get('/api/games/summary', { params: { gameId } })
    game.value = res.data
  } catch (e) {
    errorMsg.value = '존재하지 않는 경기이거나, 접근 권한이 없습니다.'
  } finally {
    loading.value = false
  }
})

// 상단 import 유지
import { useToast } from '../composable/useToast'
import CustomToast from '../components/CustomToast.vue'
const { showToast } = useToast()

// 참가하기 함수
const applyGame = async (id) => {
  try {
    await api.post(`/api/games/${id}/apply`)
    game.value.applied = true
    showToast('참가 신청이 완료되었습니다!', `/inbox?tab=sent&id=${id}`)
  } catch (e) {
    showToast(e.response?.data?.message || '신청에 실패했습니다.')
  }
}



// 유틸: 시간 포맷
function formatTimeAgo(dateString) {
  const now = new Date();
  const createdAt = new Date(dateString);
  const diff = (now - createdAt) / 1000;
  if (diff < 60) return `방금 전`;
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}일 전`;
  if (diff < 31104000) return `${Math.floor(diff / 2592000)}개월 전`;
  return `${Math.floor(diff / 31104000)}년 전`;
}

function formatDate(dateStr) {
  if (!dateStr) return '미정'
  const date = new Date(dateStr)
  return date.toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })
}

// 유틸: 매너점수 색상/아이콘
function mannerColor(score) {
  if (score >= 4) return 'text-orange-500'
  if (score >= 2) return 'text-orange-500'
  if (score > 0) return 'text-red-500'
  return 'text-gray-400'
}
function mannerIcon(score) {
  if (score >= 4) return 'fas fa-face-smile'
  if (score >= 2) return 'fas fa-face-meh'
  if (score > 0) return 'fas fa-face-frown'
  return 'fas fa-user-slash'
}
</script>
