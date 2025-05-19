<template>
  <HeaderComp />
  <div class="p-5 mt-20">
    <h1 class="text-xl font-bold mb-4">내 경기 목록</h1>

    <div v-if="games.length > 0" class="space-y-5">
      <div
        v-for="game in games"
        :key="game.id"
        class="rounded-2xl border border-gray-200 shadow-sm p-5 bg-white hover:shadow-md transition"
      >
        <!-- 룰 제목과 설명 -->
        <div class="mb-3">
          <h2 class="text-lg font-semibold text-gray-900">{{ game.ruleTitle }}</h2>
          <p class="text-sm text-gray-500 mt-1">{{ game.ruleDescription }}</p>
        </div>

        <!-- 메타 정보 -->
        <div class="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-4">
          <div>📍 {{ game.matchLocation || '미정' }}</div>
          <div>📆 {{ formatDate(game.matchDate) }}</div>
          <div>🏷 {{ game.majorCategory }} > {{ game.minorCategory }}</div>
          <div>🕒 <span :class="statusColor(game.status)" class="font-semibold">{{ translateStatus(game.status) }}</span></div>
        </div>

        <!-- 상대 정보 -->
        <div class="flex justify-between items-center border-t pt-4">
          <div class="flex items-center gap-3">
            <img
              v-if="game.opponentProfileUrl"
              :src="game.opponentProfileUrl"
              alt="상대 프로필"
              class="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <p class="text-sm font-medium text-gray-800">{{ game.opponentNickname }}</p>
              <p class="text-xs text-gray-500">
                {{ game.opponentWins }}승 {{ game.opponentDraws }}무 {{ game.opponentLosses }}패 ·
                승률 {{ game.opponentRating.toFixed(1) }}%
              </p>
            </div>
          </div>

          <!-- 채팅 버튼 -->
          <router-link
            :to="`/chat/${game.id}`"
            class="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg"
          >
            채팅
          </router-link>
        </div>
      </div>
    </div>

    <div v-else class="text-center text-sm text-gray-400 mt-10">
      참여한 게임이 없습니다.
    </div>
  </div>
  <FooterNav tab="my-game" />
</template>


<script setup>
import { onMounted, ref } from 'vue'
import client from '../../api/api'
import HeaderComp from '../../components/HeaderComp.vue'
import FooterNav from '../../components/FooterNav.vue'

const games = ref([])

onMounted(async () => {
  const res = await client.get('/api/games/my-games')
  games.value = res.data
})

function formatDate(dateStr) {
  if (!dateStr) return '미정'
  const date = new Date(dateStr)
  return date.toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })
}

function translateStatus(status) {
  switch (status) { 
    case 'UPCOMING': return '진행 예정'
    case 'LIVE': return '진행 중'
    case 'COMPLETED': return '완료됨'
    case 'TBD': return '미정'
    default: return status
  }
}

function statusColor(status) {
  switch (status) {
    case 'UPCOMING': return 'text-indigo-600'
    case 'LIVE': return 'text-green-600'
    case 'COMPLETED': return 'text-gray-600'
    default: return 'text-gray-400'
  }
}
</script>
