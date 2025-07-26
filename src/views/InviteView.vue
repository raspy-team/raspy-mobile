<template>
  <Header :has-referer="true" title="경기 정보" />
  <div class="bg-gray-50 flex flex-col items-center py-20 px-5">
    <div v-if="loading" class="flex justify-center items-center h-[50vh]">
      <i class="fas fa-spinner fa-spin text-3xl text-orange-400"></i>
    </div>
    <div v-else-if="errorMsg" class="text-red-500 text-center my-10">
      <i class="fas fa-times-circle text-2xl mb-2"></i><br />
      {{ errorMsg }}
    </div>
    <div v-else-if="game" class="w-full max-w-lg bg-white shadow-lg rounded-xl p-5">
      <!-- 타이틀/카테고리/생성자/시간 -->
      <div class="flex justify-between items-start mb-3">
        <div class="flex flex-col flex-1">
          <h2 class="text-xl font-extrabold text-gray-900 flex items-center gap-1 mb-2">
            {{ game.rule.ruleTitle }}
          </h2>
          <div class="text-xs text-orange-500 font-medium mb-2 flex gap-1 items-center">
            {{ game.rule.majorCategory }} <span class="mx-1 text-orange-500">&gt;</span>
            {{ game.rule.minorCategory }}
          </div>
        </div>
        <div class="text-gray-600 text-[0.82rem] text-right min-w-[64px]">
          {{ formatTimeAgo(game.createdAt ?? game.startedAt) }}
        </div>
      </div>
      <!-- VS AREA -->
      <div class="flex flex-col gap-2">
        <div class="flex justify-between items-center px-7 pt-1 pb-4">
          <!-- 생성자(왼쪽) -->
          <div
            @click="router.push('/profile/' + game.ownerId)"
            class="flex-1 flex flex-col items-center gap-1 cursor-pointer"
          >
            <div class="h-7 flex items-end">
              <ChampionBadge v-if="game.championId === game.ownerId" />
            </div>
            <img
              :src="game.ownerProfileUrl || Default"
              class="w-14 h-14 rounded-full border-2 border-orange-400 shadow bg-white"
            />
            <div class="text-gray-700 font-semibold text-sm">{{ game.ownerNickname }}</div>
          </div>
          <!-- VS 중앙 -->
          <div class="vs-area flex flex-col gap-1 items-center justify-center mx-3 mt-5">
            <div class="text-lg font-black tracking-tight text-orange-500">VS</div>
            <div class="text-sm font-semibold text-orange-400">{{ statusLabel(game.status) }}</div>
          </div>
          <!-- 상대방(오른쪽) -->
          <div
            v-if="game.status !== 'MATCHING'"
            @click="goOpponentProfile"
            class="flex-1 flex flex-col items-center gap-1 cursor-pointer"
          >
            <div class="h-7 flex items-end">
              <ChampionBadge v-if="game.championId === game.opponentId" />
            </div>
            <img
              :src="game.opponentProfileUrl || Default"
              class="w-14 h-14 rounded-full border-2 border-gray-300 shadow bg-white"
            />
            <div class="text-gray-700 font-semibold text-sm">
              {{ game.opponentNickname || '-' }}
            </div>
          </div>
          <div v-else class="flex-1 flex flex-col items-center gap-2 mt-6">
            <div
              class="w-14 h-14 bg-gradient-to-tr from-gray-100 to-gray-200 rounded-full border border-gray-200 flex items-center justify-center"
            >
              <i class="fas fa-user-clock text-2xl text-gray-400"></i>
            </div>
            <div
              class="flex justify-center gap-1 mt-2 font-semibold text-xs text-gray-400 opacity-70"
            >
              <span>-</span><span>-</span><span>-</span>
            </div>
          </div>
        </div>
        <!-- 👇 종료된 경기일 때 결과 보기 버튼 노출 -->
        <div
          v-if="game.status === 'COMPLETED'"
          class="text-center font-light text-orange-500 text-[0.85rem] py-2"
        >
          경기가 종료되었어요!
        </div>
        <button
          v-if="game.status === 'COMPLETED'"
          @click="goToResult(game.ownerId, game.id)"
          class="w-full h-11 mt-2 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-semibold transition shadow"
        >
          결과 보기
        </button>
      </div>
      <!-- 규칙/세부정보 -->
      <div class="bg-white rounded-xl py-6 max-w-lg w-full">
        <div class="flex gap-3 mb-3 items-center">
          <div class="font-semibold text-gray-700">{{ game.rule.ruleTitle }}</div>
          <div class="text-xs text-orange-500 font-medium flex gap-1 items-center">
            {{ game.rule.majorCategory }} <span class="mx-1 text-orange-500">&gt;</span>
            {{ game.rule.minorCategory }}
          </div>
        </div>
        <div class="relative">
          <div
            ref="ruleContent"
            :class="[
              'overflow-hidden transition-[max-height] duration-300',
              expanded ? 'max-h-none' : 'max-h-[250px]',
            ]"
          >
            <template v-for="(label, key) in sectionMap" :key="key">
              <ModalSection :label="label" :value="game.rule[key]" />
            </template>
          </div>

          <!-- 흐림 효과 -->
          <div
            v-if="!expanded && isOverflowing"
            class="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
          >
            <div class="w-full h-full bg-gradient-to-b from-transparent to-white opacity-90"></div>
          </div>

          <!-- ruleContent 하단 -->
          <div
            v-if="!expanded && isOverflowing"
            class="absolute bottom-0 left-0 right-0 h-16 flex justify-center items-end pb-4 pointer-events-none"
          >
            <!-- 버튼은 실제 클릭 가능하게 pointer-events-auto 줘야함 -->
            <button
              @click="expanded = true"
              class="pointer-events-auto px-5 py-2 text-orange-500 bg-white text-sm font-medium rounded-full shadow-md border border-orange-500"
            >
              전체보기
            </button>
          </div>

          <!-- 접기 버튼은 아래에 일반 배치 -->
          <button
            v-if="expanded && isOverflowing"
            @click="expanded = false"
            class="mt-3 w-full text-center text-sm font-medium text-orange-500 hover:text-orange-600 transition"
          >
            접기
          </button>
        </div>
      </div>

      <!-- 장소/날짜 -->
      <div class="mt-3 flex flex-col justify-start items-start text-sm text-gray-500 gap-1 mb-2">
        <div class="flex items-center gap-2">
          <i class="fas w-3 fa-map-marker-alt text-orange-500"></i>
          <span>{{
            !game.matchLocation || game.matchLocation === ' ' ? '미정' : game.matchLocation
          }}</span>
        </div>
        <div class="flex items-center gap-2">
          <i class="far w-3 fa-calendar text-orange-500"></i>
          <span>{{ formatDate(game.matchDate) }}</span>
        </div>
      </div>
      <!-- 참가/공유/댓글 버튼 -->
      <div class="mt-4 flex items-center gap-2">
        <template v-if="game.status === 'MATCHING'">
          <button
            :disabled="game.applied"
            @click="applyGame(game.id)"
            :class="[
              'h-11 flex-grow font-semibold rounded-full transition text-white',
              game.applied
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-orange-500 hover:bg-orange-600 cursor-pointer',
            ]"
          >
            {{ game.applied ? '신청 완료' : '참가하기' }}
          </button>
          <button
            @click="toggleComment(game.id)"
            class="w-11 h-11 flex items-center justify-center bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition"
          >
            <i class="fas fa-comment"></i>
          </button>
          <button
            @click="shareGame(game.id)"
            class="w-11 h-11 flex items-center justify-center bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition"
          >
            <i class="fas fa-share"></i>
          </button>
        </template>
        <template v-else>
          <button
            @click="toggleComment(game.id)"
            class="h-11 flex-grow font-semibold rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
          >
            <i class="fas fa-comment mr-2"></i> 댓글
          </button>
          <button
            @click="shareGame(game.id)"
            class="w-11 h-11 flex items-center justify-center bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition"
          >
            <i class="fas fa-share"></i>
          </button>
        </template>
      </div>
    </div>
  </div>
  <!-- 댓글 모달 -->
  <Comment v-if="commentId !== 0" :id="commentId" @close="commentId = 0" />
  <!-- 공유 안내 토스트 -->
  <custom-toast />
</template>

<script setup>
import { ref, onMounted, defineComponent, h, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api/api'
import Header from '@/components/HeaderComp.vue'
import ChampionBadge from '@/components/ChampionBadge.vue'
import Comment from '@/views/GameCommentView.vue'
import Default from '@/assets/default.png'

const route = useRoute()
const router = useRouter()
const expanded = ref(false)
const game = ref(null)
const loading = ref(true)
const errorMsg = ref('')
const commentId = ref(0)

const gameId = route.params.gameId
const isOverflowing = ref(true)
const ruleContent = ref(null)

const sectionMap = {
  ruleGoal: '1. 경기 목표',
  ruleScoreDefinition: '2. 점수 정의',
  rulePreparation: '3. 경기 준비물',
  ruleOrder: '4. 경기 순서',
  ruleDecision: '5. 판정 방식',
  ruleFoul: '6. 반칙',
  ruleExtraInfo: '7. 기타',
}

onMounted(async () => {
  await nextTick()
  const el = ruleContent.value
  if (el && el.scrollHeight > 250) {
    isOverflowing.value = true
  }
})
// 경기 정보 fetch
onMounted(async () => {
  loading.value = true
  try {
    const res = await api.get(`/api/invite/${gameId}`)
    game.value = res.data
  } catch (e) {
    errorMsg.value = '존재하지 않는 경기이거나, 접근 권한이 없습니다.'
  } finally {
    loading.value = false
  }
})

import { useToast } from '../composable/useToast'
import CustomToast from '../components/CustomToast.vue'
const { showToast } = useToast()

const applyGame = async (id) => {
  try {
    await api.post(`/api/games/${id}/apply`)
    game.value.applied = true
    showToast('참가 신청이 완료되었습니다!', `/inbox?tab=sent&id=${id}`)
  } catch (e) {
    showToast(e.response?.data?.message || '신청에 실패했습니다.')
  }
}

const goOpponentProfile = () => {
  if (game.value.opponentId) {
    router.push('/profile/' + game.value.opponentId)
  }
}

// function formatDuration(duration) {
//   if (duration === -1) return '제한 없음'
//   if (duration >= 60) return `${Math.floor(duration / 60)}분 ${duration % 60}초`
//   return `${duration}초`
// }
// ModalSection (setup 내에서 바로 선언)
const ModalSection = defineComponent({
  props: {
    label: String,
    value: String,
  },
  setup(props) {
    return () =>
      props.value && props.value.trim() !== ''
        ? h('div', [
            h('div', { class: 'font-bold text-sm text-gray-800 mb-1' }, props.label),
            h(
              'pre',
              {
                class:
                  'whitespace-pre-line text-[15px] text-gray-700 leading-snug bg-orange-50/60 rounded-lg p-3 border border-orange-50 mb-1 overflow-x-auto',
                style: 'max-height:180px',
              },
              props.value,
            ),
          ])
        : null
  },
})

// 👇 결과보기 라우팅
function goToResult(ownerId, gameId) {
  router.push(`/profile/${ownerId}?id=${gameId}`)
}

async function shareGame(gameId) {
  showToast('공유 링크가 복사되었습니다!')
  const res = await api.post('/api/invite', null, { params: { gameId } })
  const url = res.data.url

  // iOS WebView (WKWebView)
  if (
    window.webkit &&
    window.webkit.messageHandlers &&
    window.webkit.messageHandlers.clipboardCopy
  ) {
    window.webkit.messageHandlers.clipboardCopy.postMessage(url)
    return
  }

  // (Android WebView는 그대로. clipboard 잘 동작하니 아래 코드 유지)
  try {
    await navigator.clipboard.writeText(url)
    return
  } catch (err) {
    // Safari 등 일부 환경에서 clipboard API가 막힌 경우 fallback
    try {
      const input = document.createElement('input')
      input.value = url
      document.body.appendChild(input)
      input.select()
      const success = document.execCommand('copy')
      document.body.removeChild(input)
      if (!success) {
        showToast('복사에 실패했습니다!')
      }
    } catch (err2) {
      showToast('복사에 실패했습니다!')
    }
  }
}

function toggleComment(id) {
  commentId.value = id
}

function formatTimeAgo(dateString) {
  if (!dateString) return ''
  const now = new Date()
  const createdAt = new Date(dateString)
  const diff = (now - createdAt) / 1000
  if (diff < 60) return `방금 전`
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  if (diff < 2592000) return `${Math.floor(diff / 86400)}일 전`
  if (diff < 31104000) return `${Math.floor(diff / 2592000)}개월 전`
  return `${Math.floor(diff / 31104000)}년 전`
}

function formatDate(dateStr) {
  if (!dateStr) return '미정'
  const date = new Date(dateStr)
  return date.toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })
}

function statusLabel(status) {
  switch (status) {
    case 'MATCHING':
      return '경기 전'
    case 'SCHEDULED':
      return '시작 예정'
    case 'IN_PROGRESS':
      return '진행 중'
    case 'COMPLETED':
      return '종료'
    case 'CANCELED':
      return '취소됨'
    default:
      return ''
  }
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
