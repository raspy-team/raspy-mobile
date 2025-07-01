<template>
  <HeaderComp />
  <div class="pt-24 pb-28 px-5 max-w-md mx-auto space-y-6">
    <h1 class="text-xl font-black text-left mb-7 tracking-tight text-neutral-900">
      진행 예정된 게임
    </h1>
    <template v-if="games.length">
      <div
        v-for="game in games"
        :key="game.id"
        class="mb-8 rounded-2xl border border-orange-100 shadow-xl bg-white/95 hover:shadow-2xl transition-shadow"
      >
        <!-- VS AREA -->
        <div class="flex justify-between items-center px-7 pt-7 pb-4">
          <div @click="router.push('/profile/0')" class="flex-1 flex flex-col items-center gap-2">
            <div class="relative">
              <img :src="game.myProfileUrl" class="w-14 h-14 rounded-full border-2 border-orange-400 shadow-lg bg-white" />
              <span class="absolute bottom-0 right-0 bg-orange-400 text-xs text-white font-bold px-1.5 py-0.5 rounded-lg shadow">나</span>
            </div>
            <div class="text-gray-700 font-[600] text-sm">
              @{{ game.myNickname }}
            </div>
            <div class="flex gap-2 mt-2 font-bold text-xs text-neutral-700 tracking-wider">
              <div>
                <span class="block text-gray-400 font-medium">승</span>
                <span class="text-base text-orange-500">{{ game.myStatistics.wins }}</span>
              </div>
              <div>
                <span class="block text-gray-400 font-medium">무</span>
                <span class="text-base text-blue-400">{{ game.myStatistics.draws }}</span>
              </div>
              <div>
                <span class="block text-gray-400 font-medium">패</span>
                <span class="text-base text-red-400">{{ game.myStatistics.losses }}</span>
              </div>
            </div>
          </div>
          <div class="vs-area flex flex-col items-center justify-center mx-3 animate-pulse">
            <div class="text-lg font-black tracking-tight text-orange-500 mb-1">VS</div>
            <i class="fas fa-bolt text-yellow-400 text-lg"></i>
          </div>
          <div @click="router.push('/profile/'+game.opponentId)" class="flex-1 flex flex-col items-center gap-2">
            <template v-if="game.opponentNickname">
              <img :src="game.opponentProfileUrl" class="w-14 h-14 rounded-full border-2 border-gray-200 shadow bg-gradient-to-tr from-gray-100 to-blue-100" />
              <div class="text-gray-700 font-[600] text-sm">
                @{{ game.opponentNickname }}
              </div>
              <div class="flex gap-2 mt-2 font-bold text-xs text-neutral-700 tracking-wider">
                <div>
                  <span class="block text-gray-400 font-medium">승</span>
                  <span class="text-base text-orange-500">{{ game.opponentStatistics?.wins ?? '-' }}</span>
                </div>
                <div>
                  <span class="block text-gray-400 font-medium">무</span>
                  <span class="text-base text-blue-400">{{ game.opponentStatistics?.draws ?? '-' }}</span>
                </div>
                <div>
                  <span class="block text-gray-400 font-medium">패</span>
                  <span class="text-base text-red-400">{{ game.opponentStatistics?.losses ?? '-' }}</span>
                </div>
              </div>
            </template>
            <template v-else>
              <div class="w-14 h-14 bg-gradient-to-tr from-gray-100 to-gray-200 rounded-full border border-gray-200 flex items-center justify-center">
                <i class="fas fa-user-clock text-2xl text-gray-400"></i>
              </div>
              <div class="flex gap-1 mt-2 font-semibold text-xs text-gray-400 opacity-70 tracking-wide">
                <span>-</span><span>-</span><span>-</span>
              </div>
            </template>
          </div>
        </div>

   <!-- RULE BOX 개선 -->
<div class="bg-gray-50 rounded-xl mx-4 mt-2 mb-3 p-5 border ">
  <div class="flex justify-between items-start mb-3">
    <div class="font-bold text-lg text-gray-900 leading-tight">
      {{ game.rule.ruleTitle }}
    </div>
    <span class="badge bg-orange-100 text-orange-700 font-semibold text-xs px-2 py-1 rounded-xl">
      {{ game.rule.majorCategory }} &gt; {{ game.rule.minorCategory }}
    </span>
  </div>
  <div class="text-sm text-gray-600 mb-4 leading-relaxed">
    {{ game.rule.ruleDescription }}
  </div>
  <div class="grid grid-cols-3 gap-x-4 gap-y-2 text-xs text-gray-700">
    <div class="flex flex-col">
      <span class="font-semibold">세트점수</span>
      <span class="mt-1">{{ game.rule.pointsToWin == -1 ? '제한 없음' : game.rule.pointsToWin + '점'}}</span>
    </div>
    <div class="flex flex-col">
      <span class="font-semibold">총 세트</span>
      <span class="mt-1">{{ game.rule.setsToWin }}세트</span>
    </div>
    <div class="flex flex-col">
      <span class="font-semibold">세트 제한 시간</span>
      <span class="mt-1">
        
          {{
            (game.rule.duration >= 60 
              ? Math.floor(game.rule.duration / 60) + '시간 ' : '') +
            (game.rule.duration % 60 ? (game.rule.duration % 60) + '분' : '')
          }}
          
      </span>
    </div>
    <div class="flex flex-col">
      <span class="font-semibold">장소</span>
      <span class="mt-1">{{ game.matchLocation || '미정' }}</span>
    </div>
    <div class="flex flex-col col-span-2">
      <span class="font-semibold">일정</span>
      <span class="mt-1">{{ formatDate(game.matchDate) }}</span>
    </div>
  </div>
</div>


        <!-- 상태 및 액션 -->
        <div class="px-5 pb-5 space-y-2">
          <div class="flex justify-between items-center text-base font-bold mb-2">
            <div :class="['flex items-center', statusColor(game.status)]">
              <i :class="statusIcon(game.status)" class="mr-2" v-if="game.status!=='IN_PROGRESS'"></i>
              <i :class="statusIcon(game.status)" class="mr-2 animate-spin-slow" v-else></i>
              <span>{{ translateStatus(game.status) }}</span>
              <span v-if="game.status==='IN_PROGRESS' && game.startedAt" class="ml-3 text-orange-500 font-black animate-pulse text-sm">
                ({{ elapsedTimes[game.id] }})
              </span>
            </div>
          </div>
          <button
            v-if="game.status==='IN_PROGRESS'"
            class="w-full bg-orange-500 text-white font-bold rounded-xl py-3 shadow hover:bg-orange-400 transition active:scale-95"
            @click="joinGame(game.id)"
          ><i class="fas fa-sign-in-alt mr-2"></i>경기 참여</button>

          <button
            v-else-if="game.isOwner && canStart(game)"
            class="w-full bg-[#56b97b] text-white font-bold rounded-xl py-3 shadow  transition active:scale-95"
            @click="startGame(game.id)"
          ><i class="fas fa-play mr-2"></i>경기 시작</button>

          <button
            v-else-if="game.isOwner && !game.opponentNickname"
            class="w-full bg-blue-500 text-white font-bold rounded-xl py-3 shadow hover:bg-blue-400 transition active:scale-95"
            @click="inviteOpponent(game)"
          ><i class="fas fa-user-plus mr-2"></i>상대 초대하기</button>

          <div v-else class="text-center text-gray-400 text-sm py-3">대기 중...</div>

          <!-- <button
            class="w-full border-[0.1px] border-red-300 text-red-400 bg-white font-bold rounded-xl py-2 mt-1 shadow-sm hover:bg-red-50 transition active:scale-95"
            @click="deleteGame(game.id)"
          ><i class="fas fa-trash-alt mr-1"></i>경기 삭제</button> -->
        </div>
      </div>
    </template>

    <div v-else class="text-center text-gray-400 py-0 space-y-6">
      <div><i class="fas fa-info-circle mr-1"></i>참여한 게임이 없습니다.</div>
      <router-link to="/create-game" class="block w-fit mx-auto px-7 py-3 mt-10 bg-orange-500 text-white font-bold rounded-xl shadow hover:bg-orange-400">+ 새 경기 만들기</router-link>
    </div>
  </div>
  <FooterNav tab="my-game" />
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import client from '../../api/api'
import HeaderComp from '../../components/HeaderComp.vue'
import FooterNav from '../../components/FooterNav.vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const games = ref([])
const elapsedTimes = ref({})

let interval

onMounted(async () => {
  const res = await client.get('/api/games/my-games')
  games.value = res.data
  updateElapsed()
  interval = setInterval(updateElapsed, 1000)
})

onUnmounted(() => {
  clearInterval(interval)
})

function updateElapsed() {
  games.value.forEach(game => {
    if (game.status === 'IN_PROGRESS' && game.startedAt) {
      elapsedTimes.value[game.id] = getElapsedTime(game.startedAt)
    }
  })
}

function getElapsedTime(startedAt) {
  if (!startedAt) return ''
  const start = new Date(startedAt)
  const now = new Date()
  let diff = Math.max(0, now - start)
  const hours = Math.floor(diff / 3600000)
  diff = diff % 3600000
  const min = Math.floor(diff / 60000)
  const sec = Math.floor((diff % 60000) / 1000)
  if (hours > 0) return `${hours}시간 ${min}분 ${sec}초 경과`
  else if (min > 0) return `${min}분 ${sec}초 경과`
  else return `${sec}초 경과`
}

// const deleteGame = async (id) => {
//   if (!confirm('정말 삭제하시겠습니까?')) return
//   await client.delete(`/api/games/${id}`)
//   games.value = games.value.filter(g => g.id !== id)
//   delete elapsedTimes.value[id]
// }

const startGame = async (id) => {
  try {
    await client.post(`/api/games/${id}/start`)
    router.push(`/games/${id}/play`)
  } catch (e) {
    if (e.response?.data?.message === 'playing game') alert('이미 진행 중인 게임이 존재합니다.')
  }
}

const joinGame = (id) => router.push(`/games/${id}/play`)
function canStart(g) {
  return g.status === 'SCHEDULED' && !!g.opponentNickname
}
function inviteOpponent(game) {
  const url = `${window.location.origin}/games/${game.id}/invite`
  navigator.clipboard.writeText(url).then(() => alert('초대 링크가 복사되었습니다!'))
}
function formatDate(s) {
  if (!s) return '미정'
  return new Date(s).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })
}

function translateStatus(status) {
  return { MATCHING: '매칭 중', SCHEDULED: '진행 예정', IN_PROGRESS: '진행 중', COMPLETED: '완료됨', CANCELED: '취소됨' }[status] || status
}
function statusIcon(status) {
  return { MATCHING:'fas fa-search', SCHEDULED:'fas fa-calendar-alt', IN_PROGRESS:'fas fa-play-circle', COMPLETED:'fas fa-flag-checkered', CANCELED:'fas fa-times-circle' }[status]
}
function statusColor(status) {
  return { MATCHING: 'text-orange-400', SCHEDULED: 'text-orange-500', IN_PROGRESS: 'text-green-500', COMPLETED: 'text-gray-400', CANCELED: 'text-red-400' }[status]
}
</script>

<style>
.game-card {
  margin-bottom: 24px;
  box-shadow: 0 7px 22px 0 rgba(251,146,60,0.08), 0 0px 0px #fff;
  border-radius: 22px;
  border: 1.3px solid #f2ece6;
  transition: box-shadow 0.18s, border-color 0.2s;
  background: #fff;
}

.rule-box {
  background: #f6f6f7;
  border-radius: 14px;
  margin: 0 10px 0 10px;
  border: 1px solid #f1f1f1;
  box-shadow: 0 2px 6px 0 rgba(251,146,60,0.018);
  padding: 17px 14px 13px 14px;
}

.stat-label {
  color: #b3b3b3;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.01em;
  margin-right: 0px;
}
.stat-num {
  font-size: 1.17rem;
  font-weight: 900;
  margin: 0 6px 0 2px;
  color: #222;
  letter-spacing: -0.01em;
}

.vs-area {
  min-width: 66px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.action-btn {
  background: #fb923c;
  color: white;
  padding: 13px 0;
  border-radius: 8px;
  font-weight: 800;
  text-align: center;
  font-size: 1.02rem;
  transition: background .18s, box-shadow .18s;
  border: none;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(251,146,60,0.08);
}
.action-btn:hover {
  background: #ea7c23;
  box-shadow: 0 6px 12px rgba(251,146,60,0.14);
}

.delete-btn {
  background: #fff;
  border: 2px solid #ef4444;
  color: #ef4444;
  padding: 13px 0;
  border-radius: 8px;
  font-weight: 800;
  text-align: center;
  font-size: 1.02rem;
  transition: background .18s, color .18s, border-color .18s, box-shadow .15s;
  cursor: pointer;
  margin-top: 2px;
}
.delete-btn:hover {
  background: #fff0f0;
  color: #b91c1c;
  border-color: #b91c1c;
  box-shadow: 0 4px 9px rgba(251,146,60,0.10);
}

.icon-btn {
  padding: 8px;
  background: #f4f4f4;
  border-radius: 8px;
  font-size: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fb923c;
  transition: background .15s;
  border: none;
}
.icon-btn:hover {
  background: #ffe2c2;
}

.animate-spin-slow {
  animation: spin 1.4s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 420px) {
  .game-card { margin-bottom: 14px; }
  .action-btn, .delete-btn { font-size: .98rem; padding: 10px 0; }
  .rule-box .rule-row { width: 100% !important; }
  .rule-box { padding: 13px 7px 9px 7px; }
  .stat-label, .stat-num { font-size: 11.4px; }
}
</style>
