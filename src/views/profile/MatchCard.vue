<template>
  <div
    :class="[
      'relative rounded-2xl shadow-lg px-6 py-7 flex flex-col gap-3 bg-white border-l-4',
      isWin
        ? 'border-orange-400'
        : isDraw
          ? 'border-gray-400'
          : 'border-blue-400'
    ]"
  >
    <!-- 우상단 승패 강조배지 -->
    <div class="absolute right-6 top-6 z-10">
      <span
        v-if="isWin"
        class="bg-orange-500 text-white text-base px-4 py-1.5 rounded-full font-extrabold shadow-lg border-2 border-orange-500 drop-shadow"
        style="letter-spacing:0.06em;"
        >승리</span>
      <span
        v-else-if="isDraw"
        class="bg-gray-300 text-gray-700 text-base px-4 py-1.5 rounded-full font-extrabold border shadow"
        style="letter-spacing:0.05em;"
        >무승부</span>
      <span
        v-else
        class="bg-blue-400 text-white text-base px-4 py-1.5 rounded-full font-extrabold border shadow"
        style="letter-spacing:0.05em;"
        >패배</span>
    </div>
    <!-- 상단: 프로필/닉네임/경기일시장소 -->
    <div class="flex items-center gap-3 min-w-0">
      <router-link :to="'/profile/'+game.opponent.id" class="shrink-0">
        <img :src="game.opponent.avatar" class="w-11 h-11 rounded-full border-2 border-orange-400 shadow" />
      </router-link>
      <div class="min-w-0 flex flex-col justify-center">
        <router-link :to="'/profile/'+game.opponent.id">
          <div class="font-bold text-gray-900 text-[1.08rem] truncate max-w-[160px]">
            @{{ game.opponent.nickname }}
          </div>
        </router-link>
        <div class="flex flex-col gap-0.5 text-xs text-gray-500 mt-1 min-w-0">
          <span class="flex items-center gap-1 min-w-0">
            <i class="far fa-calendar"></i>
            <span class="truncate">{{ formatDate(game.date) }}</span>
          </span>
          <span class="flex items-center gap-1 min-w-0">
            <i class="fas fa-map-marker-alt"></i>
            <span class="truncate">{{ game.location ? game.location : "미정"}}</span>
          </span>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-between mt-0 mb-0">
      <div class="flex flex-row items-center gap-3">
        <span class="text-xl text-gray-800 font-bold">
          {{ game.ruleTitle }}
        </span>
        <span class="font-semibold text-gray-500 flex items-center gap-1 text-xs ">
          <i class="fas fa-tag"></i> {{ game.mainCategory + ' > ' + game.subCategory }}
        </span>
      </div>
    </div>

    <!-- 게임 설명 (접기/펼치기) -->
    <div v-if="game.ruleDescription" class="relative">
      <p
        :class="[
          'text-gray-700 text-sm leading-relaxed transition-all whitespace-pre-line',
          expandedDescription ? '' : 'line-clamp-2'
        ]"
      >
        {{ game.ruleDescription }}
      </p>
      <div class="flex justify-end mt-1">
        <button @click="toggleExpand" class="text-xs text-orange-400 hover:underline px-1">
          {{ expandedDescription ? '접기' : '펼치기' }}
        </button>
      </div>
    </div>

    <!-- 룰/카테고리 -->
      <span class="text-xs text-gray-400 font-medium">진행 세트: {{ game.setCount }}</span>

    <!-- 총 점수 -->
    <div class="flex flex-col items-center mt-2">
      <div
        class="flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-white px-6 py-3 shadow-sm"
        :class="isWin ? 'border-orange-400' : isDraw ? 'border-gray-400' : 'border-blue-400'"
      >
        <span
          class="text-4xl font-black tracking-widest"
          :class="isWin ? 'text-orange-500' : isDraw ? 'text-gray-500' : 'text-blue-500'"
        >
          {{ game.myScore }} : {{ game.opponentScore }}
        </span>
        <span class="text-xs text-gray-500 mt-1 font-bold">최종 세트 스코어</span>
      </div>
    </div>
    <!-- 세트별 결과 세로 리스트 -->
    <div class="max-h-64 overflow-y-auto mt-4 flex flex-col gap-2">
      <div
        v-for="(set, i) in game.setResults"
        :key="i"
        class="w-full px-3 py-2 rounded-xl flex items-center justify-between border bg-gray-50 font-semibold shadow-sm"
        :class="set.winnerIdx === 1 ? 'border-orange-200' : set.winnerIdx === 2 ? 'border-blue-200' : 'border-gray-200'"
      >
        <span class="text-xs font-bold text-gray-400 flex-1">{{ set.setIdx }}세트</span>
        <span class="text-lg font-extrabold"
          :class="set.winnerIdx === 1 ? 'text-orange-500' : set.winnerIdx === 2 ? 'text-blue-500' : 'text-gray-400'">
          {{ set.user1Score }} : {{ set.user2SCore }}
        </span>
        <span class="flex items-center gap-1 font-semibold flex-1 justify-end">
          <i
            :class="set.winnerIdx === 1 ? 'fas fa-trophy text-orange-500' : set.winnerIdx === 2 ? 'fas fa-times text-blue-500' : 'fas fa-handshake text-gray-400'"
          ></i>
          <span class="text-xs font-bold"
            :class="set.winnerIdx === 1 ? 'text-orange-500' : set.winnerIdx === 2 ? 'text-blue-500' : 'text-gray-400'">
            {{
              set.winnerIdx === 1
                ? '승리'
                : set.winnerIdx === 2
                  ? '패배'
                  : '무승부'
            }}
          </span>
        </span>
      </div>
    </div>
    <!-- 경기 리뷰 및 매너점수 -->
    <div v-if="game.review || game.mannerScore || game.performanceScore" class="bg-gray-50 rounded-xl mt-5 p-4 flex flex-col gap-0 border border-gray-100">
      <div v-if="game.review" class="flex items-start gap-2">
        <i class="fas fa-quote-left text-orange-400 mt-0.5"></i>
        <span class="text-sm text-gray-700 font-medium leading-snug">{{ game.review }}</span>
      </div>
      <div v-if="game.mannerScore !== undefined" class="flex items-center gap-2 mt-4">
        <span class="text-xs text-gray-500">상대가 남긴 매너 점수:</span>
        <span class="text-base font-bold"
          :class="[
            game.mannerScore >= 4
              ? 'text-green-500'
              : game.mannerScore >= 2
                ? 'text-yellow-500'
                : game.mannerScore > 0
                  ? 'text-red-500'
                  : 'text-gray-400'
          ]"
        >{{ game.mannerScore?.toFixed(1) ?? '-' }}</span>
      </div>
      <div v-if="game.performanceScore !== undefined" class="flex items-center gap-2 mt-0">
        <span class="text-xs text-gray-500">상대가 남긴 퍼포먼스 점수:</span>
        <span class="text-base font-bold"
          :class="[
            game.performanceScore >= 4
              ? 'text-green-500'
              : game.performanceScore >= 2
                ? 'text-yellow-500'
                : game.performanceScore > 0
                  ? 'text-red-500'
                  : 'text-gray-400'
          ]"
        >{{ game.performanceScore?.toFixed(1) ?? '-' }}</span>
      </div>
    </div>
    <!-- 하단 액션 버튼 -->
    <div class="flex justify-end gap-3 pt-2 mt-2 border-t border-gray-100">
      <button
        class="flex items-center gap-2 text-gray-500 hover:text-orange-500 font-md text-sm px-3 py-2 transition"
        @click="goComment(game.id)"
        title="댓글"
      >
        <i class="far fa-comment-dots text-base"></i>
        댓글
      </button>
      <button
        class="flex items-center gap-2 text-gray-500 hover:text-blue-500 font-md text-sm px-3 py-2 transition"
        @click="openInstaModal"
        title="결과 공유"
      >
        <i class="fas fa-share-alt text-base"></i>
        결과 공유
      </button>
    </div>
  </div>

  <!-- 인스타그램 공유 모달 -->
  <InstagramModal
    v-if="isOpenInsta"
    :game="game"
    :me="game.me"
    @close="isOpenInsta = false"
  />
</template>

<script setup>
import { defineProps, ref } from 'vue'
import { useRouter } from 'vue-router'
import InstagramModal from "../../components/InstagramShare.vue"

const router = useRouter()
const goComment = (id) => {
  router.push(`/games/${id}/comments`)
}

const isOpenInsta = ref(false)
const openInstaModal = () => { isOpenInsta.value = true }

defineProps({
  game: Object,
  isWin: Boolean,
  isDraw: Boolean,
})

const expandedDescription = ref(false)
const toggleExpand = () => {
  expandedDescription.value = !expandedDescription.value
}

function formatDate(str) {
  if (!str) return "미정"
  const d = new Date(str)
  return d.toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })
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
