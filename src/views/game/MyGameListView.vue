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
        <div class="flex justify-between items-center  px-7 pt-1 pb-4">
          <div @click="router.push('/profile/0')" class="flex-1 flex flex-col items-center gap-1">
            <div class="h-8 flex items-end">
                                   <champion-badge v-if="game.myId == game.championId" />
            </div>
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
          <div @click="router.push('/profile/'+game.opponentId)" class="flex-1 flex flex-col flex-start items-center gap-2">
            <template v-if="game.opponentNickname">
                <div class="h-8 flex items-end">
                    <champion-badge v-if="game.opponentId == game.championId" />
                </div>
              <img :src="game.opponentProfileUrl" class="w-14 h-14 rounded-full border-2 border-gray-200 shadow bg-gradient-to-tr from-gray-100 to-blue-100" />
              <div class="text-gray-700 font-[600] text-sm">
                @{{ game.opponentNickname }}
              </div>
                

              <div class="flex gap-2 mt-0 font-bold text-xs text-neutral-700 tracking-wider">
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
                {{ game.rule.duration ? 
                  (game.rule.duration >= 60 
                    ? Math.floor(game.rule.duration / 60) + '시간 ' : '') +
                  (game.rule.duration % 60 ? (game.rule.duration % 60) + '분' : '') : "제한 없음"
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
            @click="openStartModal(game)"
          ><i class="fas fa-play mr-2"></i>경기 시작</button>
          <button
            v-else-if="game.isOwner && !game.opponentNickname"
            class="w-full bg-blue-500 text-white font-bold rounded-xl py-3 shadow hover:bg-blue-400 transition active:scale-95"
            @click="shareGame(game)"
          ><i class="fas fa-user-plus mr-2"></i>상대 초대하기</button>
          <div v-else class="text-center text-gray-400 text-sm py-3">경기 시작 대기 중</div>
        </div>
      </div>
    </template>
    <div v-else class="text-center text-gray-400 py-0 space-y-6">
      <div class="text-sm"><i class="fas fa-info-circle mr-1"></i>표시할 게임이 없습니다.</div>
      <router-link to="/create-game" class="block w-fit mx-auto px-7 py-3 mt-10 bg-orange-500 text-white font-bold rounded-xl shadow hover:bg-orange-400">+ 새 경기 만들기</router-link>
    </div>
  </div>
  <FooterNav tab="my-game" />

  <!-- 장소/진행 모달 추가 -->
  <div v-if="showAddressModal" class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div class="bg-white p-6 m-5 rounded-2xl w-full max-w-md shadow-lg ">
      <h2 class="text-lg font-semibold mb-4">경기 장소 설정</h2>
      <!-- 도로명 주소 선택 -->
      <div @click="openAddressSearch" class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">도로명 주소</label>
        <div class="flex items-center p-3 bg-white rounded-xl border border-gray-200 cursor-pointer">
          <input 
            v-model="placeRoad" 
            readonly 
            class="text-sm flex-1 bg-white border-none outline-none cursor-not-allowed"
            placeholder="도로명 주소 선택" 
          />
        </div>
        <p class="text-xs text-gray-400 mt-1">도로명 주소를 입력하세요 (미입력 시 협의결정)</p>
      </div>
      <!-- 상세 주소 입력 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">상세주소</label>
        <div :class="[placeRoad ? 'bg-white border-gray-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed']"
             class="rounded-xl border p-3">
          <input 
            v-model="placeDetail" 
            :disabled="!placeRoad"
            class="w-full text-sm text-gray-700 outline-none bg-transparent"
            placeholder="상세주소 입력" 
          />
        </div>
        <p class="text-xs text-gray-500 mt-1">예: ○○빌딩 3층, ○○체육관</p>
      </div>
      <div class="mt-4 text-xs text-gray-500">
        <template v-if="!placeRoad || placeRoad.trim() === ''">
          도로명 주소를 반드시 입력해야 게임을 시작할 수 있습니다.
        </template>
        <template v-else>
          현재 장소: {{ placeRoad + " " +placeDetail }}<br>
          이 장소가 맞는지 확인하거나, 수정해주세요.
        </template>
      </div>
      <!-- 버튼 -->
      <div class="flex justify-end mt-6 space-x-2">
        <button @click="closeModal" class="px-4 py-2 rounded-[5px] bg-gray-100 text-gray-700 text-sm">취소</button>
        <button 
          :disabled="!placeRoad || placeRoad.trim() === ''" 
          class="px-5 py-2 rounded-[5px] bg-green-600 text-white text-sm disabled:opacity-50"
          @click="submitAndStartGame"
        >
          경기 진행
        </button>
      </div>
    </div>
  </div>
  
<!-- 리디자인된 초대코드 공유 모달 (shareModal, 코드만 대체/추가) -->
<div
  v-if="shareModal"
  class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
  style="backdrop-filter: blur(2px);"
>
  <div
    class="relative bg-white rounded-3xl shadow-2xl w-[95%] max-w-[380px] px-7 py-8 flex flex-col items-center gap-2"
    style="box-shadow:0 8px 32px 0 rgba(0,0,0,0.15);"
  >
    <!-- X 버튼 -->
    <button
      @click="shareModal = false"
      aria-label="닫기"
      class="absolute right-4 top-4 w-9 h-9 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition text-gray-500 hover:text-gray-900 z-10"
      style="box-shadow:0 2px 8px rgba(0,0,0,0.04);"
    >
      <i class="fas fa-times text-xl"></i>
    </button>

    <!-- 아이콘 및 타이틀 -->
    <div class="mb-3 flex flex-col items-center w-full">
      <div class="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-2">
        <i class="fas fa-link text-orange-500 text-2xl"></i>
      </div>
      <div class="text-lg font-bold text-gray-900 tracking-tight text-center mb-1">
        친구에게 초대 코드 보내기
      </div>
      <div class="text-gray-500 text-xs text-center">
        아래 코드를 복사해서 공유하세요
      </div>
    </div>

    <!-- 코드 카드 -->
    <div class="w-full my-5 flex flex-col items-center">
      <div
        class="rounded-2xl bg-gray-50 border border-orange-100 px-0 py-5 w-full flex flex-col items-center gap-2 shadow-sm"
      >
        <div class="text-3xl font-extrabold text-orange-600 tracking-widest select-all font-mono">
          {{ inviteCode }}
        </div>
        <div class="mt-1 text-xs text-gray-400 text-center">4자리 숫자 코드</div>
      </div>
    </div>

    <!-- 복사 버튼 -->
    <button
      @click="copyInviteCode"
      class="w-full mb-2 py-3 bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white rounded-full font-bold transition text-base shadow-md flex items-center justify-center gap-2"
    >
      <i class="fas fa-copy"></i> 코드 복사하기
    </button>
    <transition name="fade">
      <div v-if="copied" class="text-orange-500 text-xs font-medium text-center mb-2">복사 완료!</div>
    </transition>
    <!-- 닫기 버튼 -->
    <button
      @click="shareModal = false"
      class="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full font-semibold transition text-sm mt-1"
    >
      닫기
    </button>
  </div>
</div>

</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import client from '../../api/api'
import HeaderComp from '../../components/HeaderComp.vue'
import FooterNav from '../../components/FooterNav.vue'
import ChampionBadge from '../../components/ChampionBadge.vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const games = ref([])
const elapsedTimes = ref({})

const showAddressModal = ref(false)
const placeRoad = ref('')
const placeDetail = ref('')
const currentGameId = ref(null)

const openAddressSearch = () => {
  new window.daum.Postcode({
    oncomplete: function (data) {
      placeRoad.value = data.roadAddress || data.jibunAddress
      nextTick(() => {
        const detailInput = document.getElementById('place-detail')
        if (detailInput) detailInput.focus()
      })
    }
  }).open()
}

const openStartModal = (game) => {
  showAddressModal.value = true
  placeRoad.value = game.matchLocation || ''
  placeDetail.value = ''
  currentGameId.value = game.id
}

const submitAndStartGame = async () => {
  if (!placeRoad.value || placeRoad.value.trim() === '') {
    alert('도로명 주소를 반드시 입력해야 합니다.')
    return
  }
  try {
    await client.post(`/api/games/${currentGameId.value}/set-region`, {
      roadAddress: placeRoad.value,
      detailAddress: placeDetail.value
    })
    await client.post(`/api/games/${currentGameId.value}/start`)
    router.push(`/games/${currentGameId.value}/play`)
    showAddressModal.value = false
  } catch (e) {
    console.error(e)
    alert('진행 중인 게임이 존재하거나, 잘못된 접근입니다.')
  }
}

const closeModal = () => {
  showAddressModal.value = false
  placeRoad.value = ''
  placeDetail.value = ''
  currentGameId.value = null
}

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

const joinGame = (id) => router.push(`/games/${id}/play`)
function canStart(g) {
  return g.status === 'SCHEDULED' && !!g.opponentNickname
}

// Share modal state & invite code
const shareModal = ref(false)
const inviteCode = ref('')

// 상수 설정 (10000과 서로소)
const OFFSET         = 538;   // 임의의 시프트 값
const MULTIPLIER     = 7;     // 10000과 서로소여야 함

// 초대코드 생성 (4자리 숫자 문자열)
function generateInviteCode(id) {
  // (id + OFFSET) * MULTIPLIER mod 10000 → 4자리 패딩
  const ob = ((id + OFFSET) * MULTIPLIER) % 10000;
  return ob.toString().padStart(4, '0');
}
// const INV_MULTIPLIER = 7143;  // MULTIPLIER의 모듈러 역원 (7*7143 %10000 = 1)

// // 복호화: 원래 ID 복원
// function decodeInviteCode(code) {
//   const num = parseInt(code, 10);
//   // 곱셈 역원 적용 → OFFSET 빼기 → 음수 보정
//   const x  = (num * INV_MULTIPLIER) % 10000;
//   return ((x - OFFSET) + 10000) % 10000;
// }


// shareGame 함수
const shareGame = (game) => {
  inviteCode.value = generateInviteCode(game.id)
  shareModal.value = true
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
