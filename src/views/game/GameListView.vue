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
      <div class="grid grid-cols-1 gap-3 mb-2">
        <div class="flex flex-row gap-6 justify-between mb-4">
          <div
            v-for="(action, index) in menuItems"
            :key="index"
            @click="router.push(action.link)"
            class="flex flex-col items-center cursor-pointer relative group"
            style="min-width: 64px;"
          >
            <div class="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center hover:shadow-xl transition-all border border-gray-100 group-hover:bg-orange-50">
              <i :class="`${action.icon} text-orange-500 text-2xl`"></i>
            </div>
            <span class="mt-2 text-sm text-gray-700 font-[400] text-[0.8rem] whitespace-nowrap overflow-hidden text-overflow-ellipsis text-center max-w-[80px]">
              {{ action.name }}
            </span>
            <div
              v-if="requestCount > 0 && action.name == '경기 요청'"
              class="absolute top-0 right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center border-2 border-white"
              style="transform: translateY(-25%);"
            >
              <span class="text-xs text-white font-medium">{{ requestCount }}</span>
            </div>
          </div>
          <div
            @click="showInviteModal=true"
            class="flex flex-col items-center cursor-pointer relative group"
            style="min-width: 64px;"
          >
            <div class="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center hover:shadow-xl transition-all border border-gray-100 group-hover:bg-orange-50">
              <i :class="`fas fa-user-plus  text-orange-500 text-2xl`"></i>
            </div>
            <span class="mt-2 text-sm text-gray-700 font-[400] text-[0.8rem] whitespace-nowrap overflow-hidden text-overflow-ellipsis text-center max-w-[80px]">
              초대 참여
            </span>

          </div>
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
          <div v-for="(game, index) in games" :key="index" class="bg-white rounded-2xl shadow-sm overflow-hidden mb-4 p-4">
            <!-- 타이틀과 생성자 정보(우측 상단) -->

            <div class="flex justify-between items-center">
              <div class="flex justify-between items-center mb-2">
                <!-- 생성자 프로필 + 매너점수 -->
                <div class="flex flex-col items-start text-left">
                  <div class="flex items-center gap-2" @click="router.push('/profile/'+game.ownerId)">
                    <img :src="game.ownerProfileUrl || Default" class="w-8 h-8 rounded-full object-cover border" />
                    <span class="text-sm font-medium text-gray-800">@{{ game.ownerNickname }}</span>
                  </div>
    
                </div>

                <div class="flex-1">
                  <div class="flex items-center text-sm mt-1 ml-0 gap-1">        
                  <div class="text-xs font-semibold flex mr-2 items-center justify-end pr-2" :class="[game.mannerScore >= 4 ? 'text-orange-500' : game.mannerScore >= 2 ? 'text-orange-500' : game.mannerScore > 0 ? 'text-red-500' : 'text-gray-400']">
                    <i :class="[game.mannerScore >= 4 ? 'fas fa-face-smile' : game.mannerScore >= 2 ? 'fas fa-face-meh' : game.mannerScore > 0 ? 'fas fa-face-frown' : 'fas fa-user-slash']" class="mr-1"></i>
                    {{ game.mannerScore.toFixed(1) }}
                  </div>       
                    <ChampionBadge v-if="game.championId == game.ownerId" />
                  </div>
                </div>
              </div>

              <div class="text-gray-600 text-[0.79rem]">
                {{ formatTimeAgo(game.createdAt) }}
              </div>
            </div>
            <!-- 장소 & 날짜 -->
            <div class="mt-3 flex flex-col justify-start items-start text-sm text-gray-500 gap-1 mb-2">
              <div class="flex gap-2">
                <i class="fas fa-map-marker-alt text-orange-500"></i>
                <span>{{ (game.matchLocation == ' ' || game.matchLocation=="") ? "미정" : game.matchLocation  }}</span>
              </div>
              <div class="flex gap-2">
                <i class="far fa-calendar text-orange-500"></i>
                <span>{{ formatDate(game.matchDate) }}</span>
              </div>
            </div>

            <!-- 경기 규칙 박스 -->
            <div class="mt-3 relative border border-gray-200 rounded-xl p-4 bg-gray-50 text-sm">
              <span class="absolute top-0 right-0 text-xs bg-orange-500 text-white font-bold px-3 py-1 rounded-bl-xl">
                경기 규칙
              </span>
              <h4 class="text-lg font-extrabold text-gray-800 mb-1">{{ game.ruleTitle }}</h4>
            <div class="text-xs text-orange-500 font-medium mb-2 flex gap-1 items-center">
              {{ game.majorCategory }} <span class="mx-1 text-orange-500">&gt;</span> {{ game.minorCategory }}
            </div>
              <!-- 접기/펼치기 텍스트 -->
              <div class="relative mb-6">
                <p :class="['text-gray-700 leading-relaxed whitespace-pre-line transition-all', expanded.includes(game.id) ? '' : 'line-clamp-2']">
                  {{ game.ruleDescription }}
                </p>
                <div class="flex justify-end mt-1">
                  <button @click="toggleExpand(game.id)"  class="text-xs text-orange-400 mt-1 hover:underline">
                    {{ expanded.includes(game.id) ? '접기' : '더보기' }}
                  </button>
                </div>
              </div>

              <!-- 룰 상세 -->
              <div class="text-sm text-gray-600 flex flex-col gap-2 mt-2">
                <div class="flex items-center gap-2">
                  <i class="fas fa-trophy text-orange-400"></i>
                  <span class="w-36 font-light">세트 승리 조건</span>
                  <span>{{ game.winCondition=='SETS_HALF_WIN' ? '점수 달성' : '제한시간동안 더 많은 점수 획득' }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <i class="fas fa-star text-orange-400"></i>
                  <span class="w-36 font-light">한세트 승리에 필요한 점수</span>
                  <span>{{ game.points == -1 ? '제한 없음' : game.points + '점' }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <i class="fas fa-layer-group text-orange-400"></i>
                  <span class="w-36 font-light">총 세트</span>
                  <span>{{ game.sets }}세트</span>
                </div>
                <div class="flex items-center gap-2">
                  <i class="fas fa-clock text-orange-400"></i>
                  <span class="w-36 font-light">제한 시간</span>
                  <span>{{ game.duration == -1 ? '제한 없음' : game.duration >= 60 ? Math.floor(game.duration / 60) + '분 ' + (game.duration % 60) + '초' : game.duration + '초' }}</span>
                </div>
              </div>
            </div>

            <!-- 참가 버튼들 -->
            <div class="mt-4 flex items-center gap-2">
              <button 
                :disabled="game.applied"
                @click="() => !game.applied && confirmApply(game)"
                :class="[
                  'h-11 flex-grow font-semibold rounded-full transition text-white',
                  game.applied ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 cursor-pointer'
                ]">
                {{ game.applied ? '신청 완료' : '참가하기' }}
              </button>
              <button @click="goToComments(game)" class="w-11 h-11 flex items-center justify-center bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition">
                <i class="fas fa-comment"></i>
              </button>
              <button @click="shareGame(game)" class="w-11 h-11 flex items-center justify-center bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition">
                <i class="fas fa-share"></i>
              </button>
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
          <div class="text-sm text-gray-600 font-medium whitespace-pre-line leading-relaxed  mb-1 line-clamp-2" :title="inviteGame.description">
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
              {{ (inviteGame.matchLocation==' ' || inviteGame.matchLocation=="") ? '미정'  : inviteGame.matchLocation}}
            </div>
          </div>
          <!-- Rule Summary -->
          <div class="bg-white rounded-xl px-4 py-4 text-xs text-gray-700 flex flex-col gap-3 border">
            <div class="flex items-center gap-1">
              <i class="fas fa-star text-orange-400"></i>
              <span class="font-semibold">세트 승리 조건:</span>
              <span>{{ inviteGame.winCondition === 'SETS_HALF_WIN' ? '점수 달성' : '제한시간동안 더 많은 점수 획득' }}</span>
            </div>
            <div class="flex items-center gap-1">
              <i class="fas fa-trophy text-orange-400"></i>
              <span class="font-semibold">한세트 승리에 필요한 점수:</span>
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

  <!-- 맨 위로 버튼 (스크롤 시에만) -->
<button
  v-if="showScrollTop"
  @click="scrollToTop"
  class="fixed z-[99] bottom-20 right-6 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-xl w-12 h-12 flex items-center justify-center transition"
  aria-label="맨 위로"
  style="box-shadow:0 6px 18px 0 rgba(255,115,0,0.12);"
>
  <i class="fas fa-arrow-up text-xl"></i>
</button>

</template>

<script setup>
import { ref, onMounted , onUnmounted} from 'vue'
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
const expanded = ref([])
const toggleExpand = (id) => {
  if (expanded.value.includes(id)) {
    expanded.value = expanded.value.filter(x => x !== id)
  } else {
    expanded.value.push(id)
  }
}
const showScrollTop = ref(false)
const handleScroll = () => {
  showScrollTop.value = window.scrollY > 120 // 120px 넘게 스크롤 시 노출
}
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

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

const requestCount  = ref(0)

const menuItems = [
  { name: '경기 생성', icon: 'fas fa-plus', link: '/create-game' },
  { name: '경기 요청', icon: 'fas fa-envelope', link: '/inbox' },
  { name: '규칙 탐색', icon: 'fas fa-book-open', link: '/rules' }
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
    const requestCountRes = await api.get("/api/games/request-count")
    requestCount.value = requestCountRes.data

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
    showToast('신청이 완료되었습니다!', `/inbox?tab=sent&id=${selectedGame.value.id}`)
    requestCount.value += 1
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

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
