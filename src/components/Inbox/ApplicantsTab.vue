<template>
  <div class="flex flex-col">
    <div class="flex-1 overflow-y-auto space-y-5">
      <div
        v-for="group in groups"
        :key="group.gameId"
        :id="'game-' + group.gameId"
        class="p-5 border bg-white rounded-2xl shadow space-y-5"
      >
        <div class="flex justify-between items-start">
          <div>

                  <div class="">
                    <div class=" mb-1 flex">
                      <span class="font-semibold text-gray-700">
                       {{ group.rule.ruleTitle }}

                      </span>
                      <span class="flex ml-3">
                        <champion-badge v-if="group.championId == group.myId"></champion-badge>
                      </span>
                    </div>

                  </div>
                  <div class="text-xs text-orange-500 font-medium flex gap-1 items-center">
                      {{ group.rule.majorCategory }} <span class="mx-1 text-orange-500">&gt;</span> {{ group.rule.minorCategory }}
                  </div>  
          </div>
          <span class="text-xs font-semibold px-2 py-2 rounded-full w-[5rem] text-center" 
            :class="{
              'bg-blue-100 text-blue-600': group.gameStatus === 'SCHEDULED',
              'bg-gray-100 text-gray-500': group.gameStatus === 'MATCHING',
              'bg-red-100 text-red-500': group.gameStatus === 'CANCELLED'
            }">
            {{ translateGameStatus(group.gameStatus) }}
          </span>
        </div>
            <!-- 장소 & 날짜 -->
            <div class="mt-3 flex flex-col justify-start items-start text-sm text-gray-500 gap-1 mb-2">
              <div class="flex items-center gap-2">
                <i class="fas w-3 fa-map-marker-alt text-orange-500"></i>
                  <span>{{ (group.matchLocation == ' ' || group.matchLocation=="" || group.matchLocation==null) ? "장소 미정" : group.matchLocation  }}</span>
              </div>
              <div class="flex items-center gap-2">
                <i class="far w-3 fa-calendar text-orange-500"></i>
                <span>{{ formatDate(group.matchDate) }}</span>
              </div>
            </div>
        <button @click="group.showRuleDetail = !group.showRuleDetail" class="mt-2 w-full py-3 text-xs bg-gray-100 rounded-[5px] text-gray-600 flex items-center justify-center gap-2">
          <i :class="group.showRuleDetail ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
          {{ group.showRuleDetail ? '간략히 보기' : '상세 보기' }}
        </button>
        <transition name="fade">
          <div v-if="group.showRuleDetail" class="mt-3 space-y-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
            <h4 class="text-base font-bold text-gray-600">규칙</h4>
            <div class="text-sm text-gray-700 space-y-2">
              <div>
              
                <p class="text-sm text-gray-700 leading-snug whitespace-pre-line leading-relaxed border-b pb-4 mb-4">{{ group.rule.ruleDescription }}</p>

              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">세트 승리 기준</span>
                <span>{{ group.rule.winBy === 'SETS_HALF_WIN' ? '점수 달성' : '시간 도달' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">한세트 승리에 필요한 점수</span>
                <span>{{ group.rule.pointsToWin === -1 ? '제한 없음' : group.rule.pointsToWin + '점' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">총 세트 수</span>
                <span>{{ group.rule.setsToWin }}세트</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">세트 제한 시간</span>
                <span>{{ group.rule.duration == -1 ? '제한 없음' : group.rule.duration >= 60 ? Math.floor(group.rule.duration / 60) + '분 ' + (group.rule.duration % 60) + '초' : group.rule.duration + '초' }}</span>
              </div>
            </div>
          </div>
        </transition>
        <div class=" border-t border-gray-300 pt-5 space-y-3">
          <h4 class="text-sm font-semibold text-gray-700">신청자 목록</h4>
          <div
            v-for="user in group.applicants"
            :key="user.userId"
            class="p-3 bg-white rounded-xl flex items-center justify-between shadow"
          >
            <router-link :to="'/profile/'+user.userId">
              <div class="flex items-center gap-3" >
                <img :src="user.applicantProfileUrl ? user.applicantProfileUrl:Default" class="w-10 h-10 rounded-full object-cover" />
                <div class="space-y-1">
                  <p class="text-sm font-bold text-gray-800 flex items-center gap-2">
                    {{ user.applicantNickname }}
                    <champion-badge v-if="group.championId == user.userId"></champion-badge>
                  </p>
                  <p class="text-xs text-gray-500">
                    {{ user.applicantGameStatisticsDTO.wins }}승 {{ user.applicantGameStatisticsDTO.draws }}무 {{ user.applicantGameStatisticsDTO.losses }}패 · 승률 {{ getWinRate(user.applicantGameStatisticsDTO) }}%
                  </p>
                </div>
              </div>
            </router-link>
            <div class="flex flex-col gap-2">
              <button
                v-if="!user.approved"
                @click="approve(group.gameId, user.userId)"
                :disabled="approvedExists(group.applicants)"
                class="px-4 py-3 text-xs rounded-[3px] text-white font-[600]"
                :class="approvedExists(group.applicants) ? 'bg-gray-300' : 'bg-orange-500'"
              >
                승인
              </button>
              <button
                v-else
                @click="cancelApproval(group.gameId, user.userId)"
                class="px-4 py-3 text-xs rounded-[3px] e bg-red-100 text-red-400 font-[600]"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      </div>
      <div v-if="!groups.length" class="text-center text-gray-400 text-sm py-10">받은 요청이 없습니다.</div>
    </div>
  </div>

  <CustomToast />
</template>

<script setup>
import { ref, onMounted, watch, nextTick, defineProps } from 'vue'
import client from '../../api/api'
import { useToast } from '../../composable/useToast'
import Default from '../../assets/default.png'
import ChampionBadge from '../../components/ChampionBadge.vue'
import CustomToast from '../CustomToast.vue'
const props = defineProps({
  scrollToId: {
    type: String,
    default: null
  }
})

const { showToast } = useToast()
const groups = ref([])

onMounted(async () => {
  const res = await client.get('/api/games/my-games/applicants')
  groups.value = res.data.map(g => ({ ...g, showRuleDetail: false }))
  if (props.scrollToId) nextTick(() => scrollToGame(props.scrollToId))
})

watch(
  () => props.scrollToId,
  id => {
    if (id) nextTick(() => scrollToGame(id))
  }
)

function scrollToGame(id) {
  const el = document.getElementById('game-' + id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('highlight-orange')
    setTimeout(() => el.classList.remove('highlight-orange'), 2000)
  }
}
function getWinRate(stats) {
  const total = stats.wins + stats.draws + stats.losses
  if (total === 0) return 0
  return Math.round((stats.wins / total) * 100)
}

function approvedExists(applicants) {
  return applicants.some(user => user.approved)
}

async function approve(gameId, userId) {
  try {
    await client.post(`/api/games/approve`, { gameId, userId })
    const group = groups.value.find(g => g.gameId === gameId)
    const user = group?.applicants?.find(a => a.userId === userId)
    if (user) user.approved = true
    if (group) group.gameStatus = 'SCHEDULED' 
    showToast(`@${user.applicantNickname}님을 승인했습니다!`, `/my-games?id=${gameId}`)
  } catch (err) {
    if (err.response?.data?.message?.includes('한 명만 승인 가능')) {
      alert('이미 다른 사용자가 승인되었습니다.')
    } else {
      console.error(err)
      alert('승인 중 오류가 발생했습니다.')
    }
  }
}

async function cancelApproval(gameId, userId) {
  await client.post(`/api/games/cancel-approve`, { gameId, userId })
  const group = groups.value.find(g => g.gameId === gameId)
  const user = group?.applicants?.find(a => a.userId === userId)
  if (user) user.approved = false
  if (group) group.gameStatus = 'MATCHING' 
  showToast(`${user.applicantNickname}님의 참여를 취소했습니다!`)
}

function formatDate(dateStr) {
  if (!dateStr) return '시간 미정'
  const date = new Date(dateStr)
  return date.toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })
}

function translateGameStatus(status) {
  switch (status) {
    case 'SCHEDULED': return '준비 완료'
    case 'MATCHING': return '대기 중'
    case 'CANCELLED': return '취소됨'
    default: return '알 수 없음'
  }
}
</script>

<style scoped>
@import url("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css");

.fade-enter-active, .fade-leave-active {
  transition: all 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.highlight-orange {
  animation: highlight-orange-fade 1s cubic-bezier(.49,.38,.27,1.18);
}
@keyframes highlight-orange-fade {
  0%   { background: #ffe4ba; }
  40%  { background: #ffa565; }
  70%  { background: #ffa565; }
  100% { background: white; }
}
</style>
