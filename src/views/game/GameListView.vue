<template>
  <HeaderComp />
  <div class="min-h-screen bg-gray-50 pb-16">
    <!-- Status Bar -->
    <div class="bg-white h-6 w-full"></div>
    
    <!-- Header with Logo and Actions -->
    <header class="px-4 py-3 mt-5 "></header>
    
    <!-- Main Content -->
    <main class="pt-3 px-4 pb-4">
      <!-- Menu Items -->
      <div class="grid grid-cols-2 gap-3 mb-2">
        <div
          v-for="(action, index) in menuItems"
          :key="index"
          @click="router.push(action.link)"
          class="bg-white rounded-xl shadow-sm py-2.5 px-4 flex flex-row gap-2 items-center justify-center cursor-pointer hover:shadow-md transition relative"
          style="min-width:0"
        >
          <div class="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
            <i :class="`${action.icon} text-orange-500 text-lg`"></i>
          </div>
          <span class="text-base text-gray-700 font-semibold whitespace-nowrap overflow-hidden text-overflow-ellipsis">
            {{ action.name }}
          </span>
          <div v-if="action.badge" class="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
            <span class="text-xs text-white font-medium">{{ action.badge }}</span>
          </div>
        </div>
      </div>

      <!-- 초대 번호로 참여하기 버튼 -->
      <div class="mb-4">
        <div
          @click="showInviteModal = true"
          class="bg-white rounded-xl shadow-sm py-2.5 px-4 flex flex-row gap-2 items-center justify-center cursor-pointer hover:shadow-md transition relative w-full"
        >
          <div class="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
            <i class="fas fa-user-plus text-orange-500 text-lg"></i>
          </div>
          <span class="text-base text-gray-700 font-semibold whitespace-nowrap">초대 번호로 참여하기</span>
        </div>
      </div>

      <!-- 게임리스트 (동일) -->
      <div class="space-y-4">
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
            <button 
              @click="showFilterMenu = !showFilterMenu"
              class="flex items-center absolute right-0 justify-between w-[30%] bg-white px-4 py-2 border rounded text-sm bg-white hover:bg-gray-50">
              <span>
                {{ sortOption === 'popular' ? '인기순' : sortOption === 'latest' ? '최신순' : '필터 선택' }}
              </span>
              <i class="fas fa-chevron-down ml-2 text-gray-500"></i>
            </button>
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
        <div v-if="games.length > 0">
          <div v-for="(game, index) in games" :key="index" class="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
            <div class="p-4">
              <div class="flex justify-between items-start">
                <div>
                  <h3 class="font-medium text-lg text-gray-800">{{ game.title }}</h3>
                  <div class="flex items-center space-x-1 mt-0.5">
                    <span class="font-semibold">{{ game.majorCategory }}</span>
                    <span class="">/ {{ game.minorCategory }}</span>
                    <div class="pl-2 flex items-center gap-2">
                      <span class="bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full font-medium">
                        1vs1
                      </span>
                      <ChampionBadge v-if="game.championId == game.ownerId" />
                    </div>
                  </div>
                </div>
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
              <div class="border border-gray-200 p-4 rounded-[5px] mb-3 flex flex-col gap-1 relative">
                <span class="absolute right-0 top-0 bg-[#f97316] text-white font-bold text-[0.8rem] px-4 py-1" style="border-radius :0px 0px 0px 8px">
                  경기 규칙
                </span>
                <h4 class="text-md font-semibold text-gray-800">{{ game.ruleTitle }}</h4>
                <p class="text-sm text-gray-700 mt-3 py-0">{{ game.ruleDescription }}</p>
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
                      세트 제한 시간
                    </div>
                    <div>
                      {{ game.duration == -1 ? "제한 없음" : game.duration >= 60 ? Math.floor(game.duration / 60) + '분 ' + (game.duration % 60) + '초' : game.duration + '초' }}
                    </div>
                  </div>
                </div>
              </div>
              <div class="mt-5 flex items-center justify-between">
                <div class="flex items-center" @click="router.push('/profile/'+game.ownerId)">
                  <div class="w-8 h-8 rounded-full overflow-hidden border-2 border-white">
                    <img :src="game.ownerProfileUrl || Default" alt="프로필" class="w-full h-full object-cover" />
                  </div>
                  <div class="ml-2 flex items-center space-x-1">
                    <p class="text-sm font-medium text-gray-800">@{{ game.ownerNickname }}</p>
                    <div 
                      class="flex items-center text-xs font-semibold pl-2"
                      :class="[game.mannerScore >= 4 ? 'text-orange-500' : game.mannerScore >= 2 ? 'text-orange-500' : game.mannerScore > 0 ? 'text-red-500' : 'text-gray-400']"
                    >
                      <i 
                        :class="[game.mannerScore >= 4 ? 'fas fa-face-smile' : game.mannerScore >= 2 ? 'fas fa-face-meh' : game.mannerScore > 0 ? 'fas fa-face-frown' : 'fas fa-user-slash']" 
                        class="mr-1"
                      ></i>
                      {{  game.mannerScore.toFixed(1)}}
                    </div>
                  </div>
                </div>
                <div class="text-xs text-gray-500">
                  {{ formatTimeAgo(game.createdAt) }}
                </div>
              </div>
              <div class="flex items-center mt-3 space-x-2">
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
                <button 
                  @click="goToComments(game)"
                  class="w-12 h-12 flex items-center justify-center bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition">
                  <i class="fas text-gray-500 fa-comment"></i>
                </button>
                <button 
                  @click="shareGame(game)"
                  class="w-12 h-12 flex items-center justify-center bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition">
                  <i class="fas text-gray-500 fa-share"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center mt-10 text-gray-600 text-sm">
          {{ timerDone ? '표시할 게임이 없습니다' : '로딩 중입니다...' }}
        </div>
      </div>
    </main>
<!-- 초대 번호 입력 모달 ONLY (완전 리디자인, X 버튼, UI/UX 최신 스타일, 정보 full 표현, 가독성/flat 중점) -->
<div
  v-if="showInviteModal"
  class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
  style="backdrop-filter: blur(2px);"
>
  <div
    class="relative bg-white rounded-3xl shadow-2xl w-[95%] max-w-[400px] px-7 py-8 flex flex-col items-center gap-2"
    style="box-shadow:0 8px 32px 0 rgba(0,0,0,0.15);"
  >
    <!-- X Close Button -->
    <button
      @click="closeInviteModal"
      aria-label="닫기"
      class="absolute right-4 top-4 w-9 h-9 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition text-gray-500 hover:text-gray-900 z-10"
      style="box-shadow:0 2px 8px rgba(0,0,0,0.04);"
    >
      <i class="fas fa-times text-xl"></i>
    </button>

    <!-- Icon and Title -->
    <div class="mb-1 flex flex-col items-center w-full">
      <div class="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-2">
        <i class="fas fa-key text-orange-500 text-2xl"></i>
      </div>
      <div class="text-xl font-bold text-gray-900 tracking-tight text-center">
        초대 코드로 빠른 참가
      </div>
      <div class="text-gray-500 text-xs mt-1 text-center">
        친구에게 받은 <span class="text-orange-500 font-semibold">4자리 코드</span>를 입력하세요.
      </div>
    </div>

    <!-- Input -->
    <div class="w-full flex flex-col gap-1 mt-4">
      <input
        v-model="inviteInput"
        maxlength="4"
        inputmode="numeric"
        placeholder="0000"
        class="w-full text-center text-2xl font-extrabold border-0 border-b-2 border-gray-200 focus:border-orange-500 focus:ring-0 transition placeholder-gray-300 tracking-widest bg-transparent py-2 mb-2"
        @keyup.enter="submitInvite"
        autocomplete="one-time-code"
      />
      <transition name="fade">
        <div v-if="inviteError" class="text-red-500 text-xs font-medium text-center mt-1">
          {{ inviteError }}
        </div>
      </transition>
    </div>

    <!-- 검색 버튼/로딩 -->
    <div v-if="!inviteGame" class="flex w-full mt-5 gap-2">
      <button
        @click="closeInviteModal"
        class="flex-1 py-2.5 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 text-gray-500 font-semibold transition"
      >
        취소
      </button>
      <button
        @click="submitInvite"
        :disabled="inviteLoading || inviteInput.length !== 4"
        class="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition flex justify-center items-center disabled:opacity-50"
      >
        <span v-if="!inviteLoading">확인</span>
        <i v-else class="fas fa-spinner fa-spin"></i>
      </button>
    </div>

    <!-- 초대한 사람 정보 (ownerNickname/ownerProfileUrl) -->

    <!-- 게임 정보 카드 -->
    <transition name="fade">
      <div v-if="inviteGame" class="w-full mt-5">

        <div v-if="inviteGame.ownerNickname" class="flex flex-col gap-2 mb-2">

        <span class="text-xs text-gray-500">초대한 사람</span>
        <div class="flex gap-2 items-center" @click="router.push('/profile/'+inviteGame.ownerId)">
          <img
          :src="inviteGame.ownerProfileUrl || Default"
          class="w-7 h-7 rounded-full border bg-white object-cover"
          alt="프로필"
        />
        <span class="font-bold text-gray-800 text-sm">@{{ inviteGame.ownerNickname }}</span>
        </div>
      </div>

        <!-- Card -->
        <div class="rounded-2xl bg-gray-50 border border-gray-100 p-5 flex flex-col gap-2 shadow-sm">
          <!-- 타이틀 & 상태 뱃지 -->
          <div class="flex items-center gap-2 mb-1">
            <div class="flex-1 text-lg font-bold text-gray-900 truncate" :title="inviteGame.title">
              {{ inviteGame.title }}
            </div>
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
              :class="inviteGame.gameStatus==='MATCHING' ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 text-gray-400'"
            >
              {{ inviteGame.gameStatus === 'MATCHING' ? '모집 중' : '모집마감' }}
            </span>
          </div>

          <!-- Description (최대 2줄) -->
          <div class="text-sm text-gray-600 font-medium leading-snug mb-1 line-clamp-2" :title="inviteGame.description">
            {{ inviteGame.description || inviteGame.ruleDescription }}
          </div>

          <!-- 카테고리, 인원, 일정, 장소 -->
          <div class="flex flex-wrap gap-2 my-1">
            <span class="flex items-center gap-1 px-2 py-1 bg-white rounded-md border text-xs text-gray-700 font-medium">
              <i class="fas fa-trophy text-orange-400"></i>
              {{ inviteGame.majorCategory }}
              <span v-if="inviteGame.minorCategory" class="mx-1 text-gray-300">|</span>
              <span v-if="inviteGame.minorCategory" class="text-gray-400">{{ inviteGame.minorCategory }}</span>
            </span>
            <span class="flex items-center gap-1 px-2 py-1 bg-white rounded-md border text-xs text-gray-700 font-medium">
              <i class="fas fa-users text-orange-400"></i>
              {{ inviteGame.currentParticipantCounts }} / {{ inviteGame.maxPlayers }}명
            </span>
          </div>
          <div class="flex flex-col gap-3 my-2 text-xs">
            <div class="flex items-center gap-2">
              <i class="far fa-calendar text-orange-400"></i>
              {{ formatDate(inviteGame.matchDate) }}
            </div>
            <div class="flex items-center gap-2">
              <i class="fas fa-map-marker-alt text-orange-400"></i>
              {{ inviteGame.matchLocation==' ' ? '미정'  : inviteGame.matchLocation}}
            </div>
          </div>
          <!-- Rule Summary -->
          <div class="bg-white rounded-xl px-4 py-4 text-xs text-gray-700 flex flex-col gap-3 border">
            <div class="flex items-center gap-1">
              <i class="fas fa-star text-orange-400"></i>
              <span class="font-semibold">세트 승리 조건:</span>
              <span>{{ inviteGame.winCondition === 'SETS_HALF_WIN' ? '승리 점수 달성' : '시간 도달' }}</span>
            </div>
            <div class="flex items-center gap-1">
              <i class="fas fa-trophy text-orange-400"></i>
              <span class="font-semibold">세트 승리 점수:</span>
              <span>{{ inviteGame.points == -1 ? '제한 없음' : inviteGame.points + '점' }}</span>
            </div>
            <div class="flex items-center gap-1">
              <i class="fas fa-layer-group text-orange-400"></i>
              <span class="font-semibold">총 세트:</span>
              <span>{{ inviteGame.sets }}세트</span>
            </div>
            <div class="flex items-center gap-1">
              <i class="fas fa-clock text-orange-400"></i>
              <span class="font-semibold">세트 제한 시간:</span>
              <span>
                {{ inviteGame.duration == -1 ? "제한 없음"
                  : inviteGame.duration >= 60
                    ? Math.floor(inviteGame.duration / 60) + '분 ' + (inviteGame.duration % 60) + '초'
                    : inviteGame.duration + '초'
                }}
              </span>
            </div>
          </div>
        </div>
        <!-- 참가 버튼 -->
        <button
          @click="applyInviteGame(inviteGame.id)"
          class="mt-6 w-full py-3 bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white rounded-[12px] font-bold text-base shadow-md transition"
        >참가 신청하기</button>
      </div>
    </transition>
  </div>
</div>

    <!-- 지역 선택 모달/이하 동일 -->
    <div v-if="showRegionModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
      <div class="bg-white rounded-xl w-11/12 max-w-md p-5 space-y-4">
        <h3 class="text-lg font-bold text-gray-800 mb-4">지역 선택</h3>
        <select v-model="selectedPrimary" 
                @change="selectedSecondary = selectedPrimary === '전국' ? '전국' : ''" 
                class="w-full border rounded px-3 py-2 text-sm">
          <option value="" disabled selected>시/도 선택</option>
          <option v-for="(districts, primary) in regionMap" :key="primary" :value="primary">{{ primary }}</option>
        </select>
        <select v-model="selectedSecondary" 
                :disabled="!selectedPrimary || selectedPrimary === '전국'" 
                class="w-full border rounded px-3 py-2 text-sm">
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
    <!-- Share Game Modal -->
    <div v-if="shareModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
      <div class="bg-white rounded-xl shadow-lg p-6 w-80 mx-4">
        <h3 class="text-lg font-semibold text-gray-800 mb-4 text-center">초대 코드</h3>
        <div class="text-3xl font-bold text-orange-600 mb-2 tracking-widest text-center">{{ inviteCode }}</div>
        <div class="text-xs text-gray-400 text-center mb-4">친구에게 코드를 복사해서 공유하세요</div>
        <button @click="copyInviteCode" class="w-full mb-2 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition">
          복사하기
        </button>
        <div v-if="copied" class="text-orange-500 text-xs text-center mb-2">복사 완료!</div>
        <button @click="shareModal = false" class="w-full py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition">
          닫기
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../api/api'
import HeaderComp from '../../components/HeaderComp.vue'
import FooterNav from '../../components/FooterNav.vue'
import CustomAlert from '../../components/CustomAlert.vue'
import CustomToast from '../../components/CustomToast.vue'
import { useToast } from '../../composable/useToast'
import { useRouter } from "vue-router"
import regionMap from "../../assets/regionMap.json"
import Default from "../../assets/default.png"
import ChampionBadge from '../../components/ChampionBadge.vue'

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
const router = useRouter()
const goToComments = (game) => router.push("/games/" + game.id + "/comments")

const shareModal = ref(false)
const inviteCode = ref('')
const copied = ref(false)
const OFFSET = 538
const MULTIPLIER = 7
function generateInviteCode(id) {
  const ob = ((id + OFFSET) * MULTIPLIER) % 10000;
  return ob.toString().padStart(4, '0');
}
const shareGame = (game) => {
  inviteCode.value = generateInviteCode(game.id)
  shareModal.value = true
  copied.value = false
}
const copyInviteCode = async () => {
  try {
    await navigator.clipboard.writeText(inviteCode.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch (e) {
    copied.value = false
    // clipboard API 실패 시
    if (window.AndroidApp?.copyTextToClipboard) {
      window.AndroidApp.copyTextToClipboard(inviteCode.value)
      copied.value = true
      setTimeout(() => { copied.value = false }, 2000)
      return
    }
  }
}
const { showToast } = useToast()

const showInviteModal = ref(false)
const inviteInput = ref('')
const inviteLoading = ref(false)
const inviteError = ref('')
const inviteGame = ref(null)
const closeInviteModal = () => {
  showInviteModal.value = false
  inviteInput.value = ''
  inviteLoading.value = false
  inviteError.value = ''
  inviteGame.value = null
}
const submitInvite = async () => {
  inviteError.value = ''
  inviteGame.value = null
  inviteLoading.value = true
  try {
    const INV_MULTIPLIER = 7143
    const code = inviteInput.value
    if (!/^\d{4}$/.test(code)) {
      inviteError.value = '4자리 숫자를 입력하세요.'
      inviteLoading.value = false
      return
    }
    const num = parseInt(code, 10)
    const x = (num * INV_MULTIPLIER) % 10000
    const gameId = ((x - OFFSET) + 10000) % 10000
    const res = await api.get('/api/games/summary', {
      params: { gameId }
    })
    inviteGame.value = res.data
  } catch (e) {
    inviteError.value = '잘못된 초대 번호입니다.'
  } finally {
    inviteLoading.value = false
  }
}
const applyInviteGame = async (id) => {
  try {
    await api.post(`/api/games/${id}/apply`)
    showToast('참가 신청이 완료되었습니다!')
    closeInviteModal()
  } catch (e) {
    showToast(e.response?.data?.message || '신청에 실패했습니다.')
  }
}
const menuItems = [
  { name: '경기 생성', icon: 'fas fa-plus', link: '/create-game' },
  { name: '경기 요청', icon: 'fas fa-envelope', link: '/inbox' }
]
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
const timerDone = ref(false)
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
    setTimeout(() => timerDone.value = true, 2500)
  } catch (err) {
    console.error('게임 목록 로드 실패', err)
    setTimeout(() => timerDone.value = true, 2500)
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
  alertMsg.value = `@${game.ownerNickname}님의 경기에 신청하시겠습니까?`
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
<style scoped>
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
