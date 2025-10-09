<template>
  <div
    @click="openModal"
    @click.stop
    :class="[
      'relative rounded-2xl shadow-lg px-6 py-7 flex flex-col gap-3 bg-white border-l-4',
      isWin ? 'border-orange-400' : isDraw ? 'border-gray-400' : 'border-blue-400',
    ]"
  >
    <div class="absolute right-6 top-6 z-10">
      <span
        v-if="isWin"
        class="bg-orange-500 text-white text-base px-4 py-1.5 rounded-full font-extrabold shadow-lg border-2 border-orange-500 drop-shadow"
        style="letter-spacing: 0.06em"
        >승리</span
      >
      <span
        v-else-if="isDraw"
        class="bg-gray-300 text-gray-700 text-base px-4 py-1.5 rounded-full font-extrabold border shadow"
        style="letter-spacing: 0.05em"
        >무승부</span
      >
      <span
        v-else
        class="bg-blue-400 text-white text-base px-4 py-1.5 rounded-full font-extrabold border shadow"
        style="letter-spacing: 0.05em"
        >패배</span
      >
    </div>
    <div class="min-w-0 flex items-center gap-2">
      <div>
        <div>
                      <img
                        class="w-10"
                        :src="`/category-picture/${game.minorCategory || '미분류'}.png`"
                        alt="카테고리 이미지"
                      />
                    </div>
                  </div>
                  <div>
                    <span class="text-base font-extrabold text-gray-900 truncate block">
                      {{ game.ruleTitle }}
                    </span>
                    <div class="flex gap-1 items-center mt-1 text-xs text-orange-500 font-medium">
                      {{ game.majorCategory }}
                      <span v-if="game.minorCategory" class="mx-1 text-orange-500">&gt;</span>
                      <span v-if="game.minorCategory">{{ game.minorCategory }}</span>
                    </div>
                  </div>    </div>

    <div class="flex flex-col items-center mt-0">
      <div class="flex flex-col items-center w-full justify-center">
        <span
          class="text-4xl font-black w-full"
          :class="isWin ? 'text-orange-500' : isDraw ? 'text-gray-500' : 'text-blue-500'"
        >
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-3 w-[42%]">
              <div class="flex flex-col items-center pt-7 w-[80%]">
                <img
                  :src="myAvatar == null ? Default : myAvatar"
                  class="w-12 h-12 rounded-full border-2 border-orange-400 shadow"
                />
                <div
                  class="font-semibold text-gray-800 text-[0.88rem] mt-[-5px] truncate max-w-[160px]"
                >
                  나
                </div>
              </div>
              <div class="font-extrabold w-[20%]">
                {{ game.myScore }}
              </div>
            </div>

            <div class="flex justify-center font-extrabold text-2xl w-[16%]">:</div>

            <div class="flex items-center gap-3 justify-end w-[42%]">
              <div class="font-extrabold w-[20%]">
                {{ game.opponentScore }}
              </div>
              <div class="flex flex-col items-center pt-7 w-[80%]">
                <img
                  :src="Default"
                  class="w-12 h-12 rounded-full border-2 border-orange-400 shadow"
                />
                <div
                  class="font-semibold text-gray-800 text-[0.88rem] mt-[-5px] truncate max-w-[160px]"
                >
                  {{ game.opponentNickname }}
                </div>
              </div>
            </div>
          </div>
        </span>
      </div>
    </div>
    <div class="my-0">
      <button
        type="button"
        @click.stop="showSetResults = !showSetResults"
        class="w-full flex items-center justify-between px-5 py-3 rounded-2xl bg-white border border-gray-200 shadow-[0_1.5px_8px_0_rgba(20,22,23,0.06)] font-semibold text-[1.05rem] text-gray-900 transition active:bg-gray-100 hover:bg-orange-50 select-none cursor-pointer outline-none focus:outline-none"
        style="outline: none"
      >
        <span
          :class="showSetResults ? 'text-orange-500' : 'text-gray-900'"
          class="tracking-tight text-sm font-semibold"
          >{{ showSetResults ? '세트 결과 접기' : '세트 결과 보기' }}</span
        >
        <i
          :class="[
            'fas',
            showSetResults ? 'fa-chevron-up' : 'fa-chevron-down',
            showSetResults ? 'text-orange-400' : 'text-gray-400',
            'text-[19px]',
            'transition-transform',
          ]"
        ></i>
      </button>

      <transition name="fade">
        <div v-if="showSetResults">
          <div
            v-for="(set, i) in setResults"
            :key="i"
            class="w-full px-3 py-2 rounded-xl flex items-center justify-between border bg-gray-50 font-semibold shadow-sm mt-2"
            :class="
              set.winnerIdx === 1
                ? 'border-orange-200'
                : set.winnerIdx === 2
                  ? 'border-blue-200'
                  : 'border-gray-200'
            "
          >
            <span class="text-xs font-bold text-gray-400 flex-1">{{ set.setIdx }}세트</span>
            <span
              class="text-lg font-extrabold"
              :class="
                set.winnerIdx === 1
                  ? 'text-orange-500'
                  : set.winnerIdx === 2
                    ? 'text-blue-500'
                    : 'text-gray-400'
              "
            >
              {{ set.user1Score == null ? 0 : set.user1Score }} :
              {{ set.user2Score == null ? 0 : set.user2Score }}
            </span>
            <span class="flex items-center gap-1 font-semibold flex-1 justify-end">
              <i
                :class="
                  set.winnerIdx === 1
                    ? 'fas fa-trophy text-orange-500'
                    : set.winnerIdx === 2
                      ? 'fas fa-times text-blue-500'
                      : 'fas fa-handshake text-gray-400'
                "
              ></i>
              <span
                class="text-xs font-bold"
                :class="
                  set.winnerIdx === 1
                    ? 'text-orange-500'
                    : set.winnerIdx === 2
                      ? 'text-blue-500'
                      : 'text-gray-400'
                "
              >
                {{ set.winnerIdx === 1 ? '승리' : set.winnerIdx === 2 ? '패배' : '무승부' }}
              </span>
            </span>
          </div>
        </div>
      </transition>
    </div>

    <div class="bg-gray-50 rounded-xl p-4 mt-2 flex flex-col gap-2 border border-gray-100">
      <template
        v-if="game.review || game.mannerScore !== undefined || game.performanceScore !== undefined"
      >
        <div class="text-xs text-gray-500 font-bold mb-1">
          {{ game.opponent?.nickname ?? '상대' }}님의 리뷰
        </div>
        <div v-if="game.review" class="flex items-start gap-2 mb-2">
          <i class="fas fa-quote-left text-orange-400 mt-0.5"></i>
          <span class="text-sm text-gray-800 font-medium leading-snug"> "{{ game.review }}" </span>
        </div>
        <div v-else class="text-sm text-gray-400 italic mb-2">등록된 텍스트 리뷰가 없습니다.</div>
        <div class="flex gap-3">
          <div class="flex items-center gap-1">
            <span class="text-xs text-gray-500">매너 :</span>
            <span
              class="font-bold text-base"
              :class="[
                game.mannerScore >= 4
                  ? 'text-green-500'
                  : game.mannerScore >= 2
                    ? 'text-yellow-500'
                    : game.mannerScore > 0
                      ? 'text-red-500'
                      : 'text-gray-400',
              ]"
            >
              {{ game.mannerScore !== null ? game.mannerScore?.toFixed(1) : '-' }}
            </span>
          </div>
          <div class="flex items-center gap-1">
            <span class="text-xs text-gray-500">퍼포먼스 :</span>
            <span
              class="font-bold text-base"
              :class="[
                game.performanceScore >= 4
                  ? 'text-green-500'
                  : game.performanceScore >= 2
                    ? 'text-yellow-500'
                    : game.performanceScore > 0
                      ? 'text-red-500'
                      : 'text-gray-400',
              ]"
            >
              {{ game.performanceScore !== null ? game.performanceScore?.toFixed(1) : '-' }}
            </span>
          </div>
        </div>
      </template>
      <template v-else>
        <div class="text-sm text-gray-400 italic">상대가 아직 리뷰와 점수를 등록하지 않았어요.</div>
      </template>
    </div>

    <div class="min-w-0 flex flex-col justify-center">
      <div class="flex flex-col gap-2 text-xs text-gray-500 mt-1 min-w-0">
        <span class="flex items-center gap-1 min-w-0">
          <i class="far fa-calendar"></i>
          <span class="truncate">{{ formatDate(game.date) }}</span>
        </span>
        <span class="flex items-center gap-1 min-w-0">
          <i class="fas fa-map-marker-alt"></i>
          <span class="truncate">{{ game.location ? game.location : '미정' }}</span>
        </span>
      </div>
    </div>

    <div class="flex justify-between items-center pt-2 mt-2 border-t border-gray-100">
      <div v-if="likeCount > 0" class="flex items-center gap-2 text-sm text-gray-600">
        <i class="fas fa-heart text-red-500"></i>
        <span class="font-gray-500 font-bold">{{ likeCount }}명이 또 보고싶어해요</span>
      </div>
      <div v-else></div>

      <div class="flex gap-3">
        <button
          @click.stop="toggleComment(game.id)"
          class="w-11 h-11 flex items-center justify-center bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition"
        >
          <i class="fas fa-comment"></i>
        </button>

        <button
          @click.stop="openInstaModal"
          class="w-11 h-11 flex items-center justify-center bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition"
          title="이미지로 저장"
        >
          <i class="far fa-image"></i>
        </button>
      </div>
    </div>
  </div>

  <InstagramModal v-if="isOpenInsta" :game="game" :me="game.me" @close="isOpenInsta = false" />

  <transition name="fade">
    <MatchRuleModal
      v-if="showRuleDetail"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-5 z-[10000000]"
      :rule="game.rule"
      @close="showRuleDetail = false"
      @click.stop
    />
  </transition>

  <Comment v-if="commentId != 0" :id="commentId" @close="commentId = 0" />
</template>

<script setup>
import { defineProps, ref, onMounted } from 'vue'
// import { useRouter } from 'vue-router'
import InstagramModal from '../../components/InstagramShare.vue'
import MatchRuleModal from '../../components/MatchModal.vue'
import api from '../../api/api' // API 인스턴스 import

import Default from '../../assets/default.png'

import Comment from '../GameCommentView.vue'
const commentId = ref(0)
const toggleComment = (id) => {
  commentId.value = id
}
const setResults = ref([])
const likeCount = ref(0) // 좋아요 수를 저장할 ref

const showRuleDetail = ref(false)
function openModal() {
  showRuleDetail.value = true
}
// const router = useRouter()

const isOpenInsta = ref(false)
const openInstaModal = () => {
  isOpenInsta.value = true
}

const props = defineProps({
  game: Object,
  isWin: Boolean,
  isDraw: Boolean,
  myAvatar: String,
})

function formatDate(str) {
  if (!str) return '미정'
  const d = new Date(str)
  return d.toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })
}

function isWinner1More(results) {
  let winner1 = 0,
    winner2 = 0
  for (const r of results) {
    if (r.winnerIdx === 1) winner1++
    else if (r.winnerIdx === 2) winner2++
  }
  return winner1 > winner2
}

const showSetResults = ref(false)

// 좋아요 수를 가져오는 함수
const fetchLikeCount = async () => {
  if (!props.game || !props.game.id) return
  try {
    const response = await api.get(`/api/games/${props.game.id}/like`)
    likeCount.value = response.data.totalCount
  } catch (error) {
    console.error('좋아요 수를 가져오는데 실패했습니다:', error)
    likeCount.value = 0 // 에러 발생 시 0으로 설정
  }
}

onMounted(() => {
  // 컴포넌트 마운트 시 좋아요 수 조회
  fetchLikeCount()

  if (props.game.myScore >= props.game.opponentScore) {
    // 내 점수가 더 높음
    if (isWinner1More(props.game.setResults)) {
      // 내가 유저 1임 (미변화)
      setResults.value = props.game.setResults
    } else {
      props.game.setResults.forEach((item) => {
        // 내가 유저 2임 (재졍렬)
        setResults.value.push({
          setIdx: item.setIdx,
          user1Score: item.user2Score,
          user2Score: item.user1Score,
          winnerIdx: item.winnerIdx === 1 ? 2 : item.winnerIdx === 2 ? 1 : item.winnerIdx,
        })
      })
    }
  } else {
    // 내가 점수가 더 적음.
    if (isWinner1More(props.game.setResults)) {
      // 상대가 유저 1임 (재정렬)
      props.game.setResults.forEach((item) => {
        setResults.value.push({
          setIdx: item.setIdx,
          user1Score: item.user2Score,
          user2Score: item.user1Score,
          winnerIdx: item.winnerIdx === 1 ? 2 : item.winnerIdx === 2 ? 1 : item.winnerIdx,
        })

        console.log(item)
      })
    } else {
      // 내가 유저 2임 (미변화)
      setResults.value = props.game.setResults
    }
  }
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
