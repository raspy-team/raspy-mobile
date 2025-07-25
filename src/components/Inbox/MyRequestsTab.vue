<template>
  <div>
    <div v-if="loading" class="space-y-5">
      <div
        v-for="i in 2"
        :key="i"
        class="p-5 border bg-white rounded-2xl shadow space-y-5 animate-pulse"
      >
        <div class="flex justify-between items-start">
          <div class="space-y-2 w-full">
            <div class="mb-1 flex">
              <span class="font-semibold text-gray-300 block w-32 h-5 bg-gray-200 rounded"></span>
              <span class="flex ml-3 w-6 h-6 bg-gray-200 rounded-full"></span>
            </div>
            <div class="text-xs flex gap-1 items-center">
              <span class="block w-16 h-3 bg-gray-200 rounded"></span>
              <span class="mx-1 text-gray-200">&gt;</span>
              <span class="block w-12 h-3 bg-gray-200 rounded"></span>
            </div>
            <div class="block w-full h-6 bg-gray-200 rounded"></div>
          </div>
          <span
            class="text-xs font-semibold px-1 w-[5rem] text-center py-2 rounded-full bg-gray-200"
          ></span>
        </div>
        <div class="mt-3 flex flex-col justify-start items-start text-sm text-gray-500 gap-1 mb-2">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 bg-gray-200 rounded-full"></span>
            <span class="block w-20 h-4 bg-gray-200 rounded"></span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 bg-gray-200 rounded-full"></span>
            <span class="block w-24 h-4 bg-gray-200 rounded"></span>
          </div>
        </div>
        <div class="w-full h-10 bg-gray-200 rounded-[5px]"></div>
        <div class="flex justify-between items-center pt-3 border-t">
          <div>
            <div class="w-24 h-4 bg-gray-200 rounded mb-2"></div>
            <div class="w-32 h-3 bg-gray-200 rounded"></div>
          </div>
          <div>
            <span class="w-8 h-8 bg-gray-200 rounded-full block"></span>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3 pt-1">
          <div class="w-full h-10 bg-gray-200 rounded"></div>
          <div class="w-full h-10 bg-gray-100 rounded"></div>
        </div>
      </div>
    </div>
    <div v-else>
      <div v-if="games.length" class="space-y-5">
        <div
          @click="game.showRuleDetail = true"
          v-for="game in games"
          :key="game.id"
          :id="'game-' + game.id"
          class="p-5 border bg-white rounded-2xl shadow space-y-5"
        >
          <div class="flex justify-between items-start">
            <div class="space-y-2">
              <div class="">
                <div class="mb-1 flex">
                  <span class="font-semibold text-gray-700">
                    {{ game.rule.ruleTitle }}
                  </span>
                  <span class="flex ml-3">
                    <champion-badge v-if="game.championId == game.myId"></champion-badge>
                  </span>
                </div>
              </div>
              <div class="text-xs text-orange-500 font-medium flex gap-1 items-center">
                {{ game.rule.majorCategory }} <span class="mx-1 text-orange-500">&gt;</span>
                {{ game.rule.minorCategory }}
              </div>
              <p class="text-sm text-gray-700 leading-snug whitespace-pre-line leading-relaxed">
                {{ game.rule.ruleDescription }}
              </p>
            </div>
            <span
              class="text-xs font-semibold px-1 w-[5rem] text-center py-2 rounded-full"
              :class="{
                'bg-blue-100 text-blue-600': game.status === 'APPROVED',
                'bg-gray-100 text-gray-500': game.status === 'REQUESTED',
                'bg-red-100 text-red-500': game.status === 'REJECTED',
              }"
            >
              {{ translateStatus(game.status) }}
            </span>
          </div>
          <div
            class="mt-3 flex flex-col justify-start items-start text-sm text-gray-500 gap-1 mb-2"
          >
            <div class="flex items-center gap-2">
              <i class="fas w-3 fa-map-marker-alt text-orange-500"></i>
              <span>{{
                game.matchLocation == ' ' || game.matchLocation == '' || game.matchLocation == null
                  ? '장소 미정'
                  : game.matchLocation
              }}</span>
            </div>
            <div class="flex items-center gap-2">
              <i class="far w-3 fa-calendar text-orange-500"></i>
              <span>{{ formatDate(game.matchDate) }}</span>
            </div>
          </div>
          <MatchRuleModal
            v-if="game.showRuleDetail"
            :rule="game.rule"
            @close="game.showRuleDetail = false"
          />
          <div class="flex justify-between items-center pt-3 border-t">
            <div>
              <p class="text-sm font-semibold text-gray-800 flex items-center gap-2">
                {{ game.ownerNickname }}
                <span class="text-xs flex items-center gap-1">
                  <i
                    :class="[
                      (game.ownerStatistics.manner || 4.5) >= 4
                        ? 'fas fa-face-smile text-green-500'
                        : (game.ownerStatistics.manner || 4.5) >= 2
                          ? 'fas fa-face-meh text-orange-500'
                          : (game.ownerStatistics.manner || 4.5) > 0
                            ? 'fas fa-face-frown text-red-500'
                            : 'fas fa-user-slash text-gray-400',
                    ]"
                  ></i>
                  {{ (game.ownerStatistics.manner || 4.5).toFixed(1) }}
                </span>
              </p>
              <p class="text-xs text-gray-500">
                {{ game.ownerStatistics.wins }}승 {{ game.ownerStatistics.draws }}무
                {{ game.ownerStatistics.losses }}패 · 승률 {{ getWinRate(game.ownerStatistics) }}%
              </p>
            </div>
            <div>
              <champion-badge v-if="game.championId == game.ownerId"></champion-badge>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3 pt-1">
            <button
              v-if="game.status === 'REQUESTED'"
              @click.stop="cancelRequest(game.id)"
              class="flex items-center justify-center gap-2 text-red-400 text-sm text-red-400 border-[1px] border-red-400 py-3 rounded-[8px]"
            >
              <i class="fas fa-xmark"></i> 신청 취소
            </button>
            <button
              v-else-if="game.status === 'APPROVED'"
              class="flex items-center justify-center gap-2 bg-[#afafaf] text-sm text-white border-[1px] py-3 rounded-[8px]"
            >
              승인 완료
            </button>
            <button
              v-else-if="game.status === 'REJECTED'"
              class="flex items-center justify-center gap-2 bg-[#afafaf] text-sm text-white border-[1px] py-3 rounded-[8px]"
            >
              승인 거부
            </button>
            <button
              @click.stop="goDM(game.ownerId)"
              class="flex items-center justify-center gap-2 text-sm text-white bg-blue-400 py-3 rounded-[8px]"
            >
              <i class="fas fa-paper-plane"></i> DM
            </button>
          </div>
        </div>
      </div>
      <div v-else class="text-center text-gray-400 text-sm py-10">신청한 게임이 없습니다.</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, defineProps } from 'vue'
import client from '../../api/api'
import ChampionBadge from '../ChampionBadge.vue'
import { useRouter } from 'vue-router'
import MatchRuleModal from '../../components/MatchModal.vue'

const router = useRouter()

const props = defineProps({
  scrollToId: {
    type: String,
    default: null,
  },
})

const games = ref([])
const loading = ref(true)

const goDM = (ownerId) => router.push('/chat/' + ownerId)

onMounted(async () => {
  try {
    const res = await client.get('/api/games/my-requests')
    games.value = res.data.map((g) => ({ ...g, showRuleDetail: false }))
  } finally {
    loading.value = false
  }
  if (props.scrollToId) nextTick(() => scrollToGame(props.scrollToId))
})

watch(
  () => props.scrollToId,
  (id) => {
    if (id) nextTick(() => scrollToGame(id))
  },
)

function scrollToGame(id) {
  const el = document.getElementById('game-' + id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('highlight-orange')
    setTimeout(() => el.classList.remove('highlight-orange'), 1200)
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '일정 미정'
  const date = new Date(dateStr)
  return date.toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })
}

function translateStatus(status) {
  switch (status) {
    case 'APPROVED':
      return '승인됨'
    case 'REQUESTED':
      return '대기 중'
    case 'REJECTED':
      return '거절됨'
    default:
      return '알 수 없음'
  }
}

function getWinRate(stat) {
  const total = stat.wins + stat.draws + stat.losses
  if (total === 0) return 0
  return Math.round((stat.wins / total) * 100)
}

async function cancelRequest(gameId) {
  await client.post('/api/games/cancel-request', { gameId })
  games.value = games.value.filter((g) => g.id !== gameId)
}
</script>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css');

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.highlight-orange {
  animation: highlight-orange-fade 0.7s cubic-bezier(0.49, 0.38, 0.27, 1.18);
}
@keyframes highlight-orange-fade {
  0% {
    background: #ffe4ba;
  }
  40% {
    background: #f97316;
  }
  70% {
    background: #f97316;
  }
  100% {
    background: white;
  }
}
</style>
