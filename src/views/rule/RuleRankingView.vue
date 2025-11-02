<template>
  <div class="min-h-screen bg-gray-900">
    <HeaderComp
      :has-referer="true"
      :title="ruleName || '규칙 랭킹'"
      :show-bell="false"
      :show-dm="false"
      custom-class="bg-gray-900/95 backdrop-blur-md"
      back-icon-class="fas fa-arrow-left"
    />

    <!-- Loading State -->
    <div v-if="loading" class="pt-20 px-4 max-w-lg mx-auto">
      <div class="animate-pulse space-y-4">
        <div class="h-32 bg-gray-700 rounded-2xl"></div>
        <div class="space-y-3">
          <div v-for="i in 5" :key="i" class="h-20 bg-gray-700 rounded-xl"></div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="pt-20 px-4 max-w-lg mx-auto">
      <div class="bg-red-900/20 border border-red-600 rounded-2xl p-6 text-center">
        <i class="fas fa-exclamation-circle text-red-500 text-4xl mb-3"></i>
        <p class="text-red-300 font-semibold mb-2">데이터를 불러올 수 없습니다</p>
        <p class="text-red-400 text-sm">{{ error }}</p>
        <button
          @click="fetchRankings"
          class="mt-4 px-6 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition"
        >
          다시 시도
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="pt-20 pb-24 px-4 max-w-lg mx-auto space-y-6">
      <!-- Current User Highlight Card -->
      <div
        v-if="currentUserRanking"
        class="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white"
      >
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <img
              v-if="currentUserRanking.userAvatar"
              :src="currentUserRanking.userAvatar"
              :alt="currentUserRanking.userName"
              class="w-14 h-14 rounded-full border-3 border-white shadow-md object-cover"
            />
            <div
              v-else
              class="w-14 h-14 rounded-full border-3 border-white bg-white/20 flex items-center justify-center"
            >
              <i class="fas fa-user text-white text-xl"></i>
            </div>
            <div>
              <p class="text-sm opacity-90">내 순위</p>
              <p class="text-2xl font-bold">{{ currentUserRanking.rank }}위</p>
            </div>
          </div>
          <div class="text-right">
            <p class="text-sm opacity-90">레이팅</p>
            <p class="text-2xl font-bold">{{ currentUserRanking.rating }}</p>
          </div>
        </div>
        <div class="flex items-center justify-between pt-3 border-t border-white/30">
          <span class="text-sm opacity-90">플레이 횟수</span>
          <span class="font-semibold">{{ currentUserRanking.playCount }}회</span>
        </div>
      </div>

      <!-- No Ranking for Current User -->
      <div
        v-else
        class="bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl p-6 text-center"
      >
        <i class="fas fa-trophy text-gray-400 text-3xl mb-2"></i>
        <p class="text-gray-300 font-semibold mb-1">아직 이 규칙으로 플레이한 기록이 없어요</p>
        <p class="text-gray-400 text-sm">첫 경기를 시작해보세요!</p>
      </div>

      <!-- Top 3 Podium -->
      <div v-if="rankings.length > 0" class="bg-gray-800 rounded-2xl shadow-lg p-6">
        <h2 class="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <i class="fas fa-crown text-yellow-500"></i>
          상위 랭커
        </h2>

        <!-- Podium Display for Top 3 -->
        <div v-if="rankings.length >= 3" class="flex items-end justify-center gap-2 mb-8">
          <!-- 2nd Place -->
          <div class="flex-1 flex flex-col items-center" @click="goToProfile(rankings[1].userId)">
            <div class="relative cursor-pointer group">
              <img
                v-if="rankings[1].userAvatar"
                :src="rankings[1].userAvatar"
                :alt="rankings[1].userName"
                class="w-16 h-16 rounded-full border-4 border-gray-400 shadow-lg object-cover group-hover:scale-110 transition-transform"
              />
              <div
                v-else
                class="w-16 h-16 rounded-full border-4 border-gray-400 bg-gray-200 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"
              >
                <i class="fas fa-user text-gray-500"></i>
              </div>
              <div
                class="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gray-400 text-white flex items-center justify-center font-bold text-sm shadow-md"
              >
                2
              </div>
            </div>
            <div
              class="w-full mt-3 bg-gradient-to-b from-gray-600 to-gray-700 rounded-t-xl text-center py-3 h-20 flex flex-col justify-center cursor-pointer group-hover:from-gray-700 group-hover:to-gray-800 transition"
            >
              <p class="text-xs font-semibold text-white truncate px-2">
                {{ rankings[1].userName }}
              </p>
              <p class="text-sm font-bold text-white mt-1">{{ rankings[1].rating }}</p>
            </div>
          </div>

          <!-- 1st Place -->
          <div class="flex-1 flex flex-col items-center" @click="goToProfile(rankings[0].userId)">
            <div class="relative cursor-pointer group">
              <img
                v-if="rankings[0].userAvatar"
                :src="rankings[0].userAvatar"
                :alt="rankings[0].userName"
                class="w-20 h-20 rounded-full border-4 border-yellow-500 shadow-xl object-cover group-hover:scale-110 transition-transform"
              />
              <div
                v-else
                class="w-20 h-20 rounded-full border-4 border-yellow-500 bg-yellow-100 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform"
              >
                <i class="fas fa-user text-yellow-600 text-xl"></i>
              </div>
              <div
                class="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 text-white flex items-center justify-center font-bold shadow-lg"
              >
                <i class="fas fa-crown text-sm"></i>
              </div>
            </div>
            <div
              class="w-full mt-3 bg-gradient-to-b from-yellow-400 to-yellow-500 rounded-t-xl text-center py-4 h-28 flex flex-col justify-center cursor-pointer group-hover:from-yellow-500 group-hover:to-yellow-600 transition"
            >
              <p class="text-xs font-semibold text-white truncate px-2">
                {{ rankings[0].userName }}
              </p>
              <p class="text-lg font-bold text-white mt-1">{{ rankings[0].rating }}</p>
            </div>
          </div>

          <!-- 3rd Place -->
          <div class="flex-1 flex flex-col items-center" @click="goToProfile(rankings[2].userId)">
            <div class="relative cursor-pointer group">
              <img
                v-if="rankings[2].userAvatar"
                :src="rankings[2].userAvatar"
                :alt="rankings[2].userName"
                class="w-16 h-16 rounded-full border-4 border-orange-700 shadow-lg object-cover group-hover:scale-110 transition-transform"
              />
              <div
                v-else
                class="w-16 h-16 rounded-full border-4 border-orange-700 bg-orange-100 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"
              >
                <i class="fas fa-user text-orange-700"></i>
              </div>
              <div
                class="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-orange-700 text-white flex items-center justify-center font-bold text-sm shadow-md"
              >
                3
              </div>
            </div>
            <div
              class="w-full mt-3 bg-gradient-to-b from-orange-700 to-orange-800 rounded-t-xl text-center py-3 h-16 flex flex-col justify-center cursor-pointer group-hover:from-orange-800 group-hover:to-orange-900 transition"
            >
              <p class="text-xs font-semibold text-white truncate px-2">
                {{ rankings[2].userName }}
              </p>
              <p class="text-sm font-bold text-white mt-1">{{ rankings[2].rating }}</p>
            </div>
          </div>
        </div>

        <!-- Less than 3 rankings - show simple list -->
        <div v-else class="space-y-3 mb-4">
          <div
            v-for="ranking in rankings"
            :key="ranking.userId"
            @click="goToProfile(ranking.userId)"
            class="flex items-center gap-4 p-4 bg-gradient-to-r from-orange-900/20 to-gray-800 rounded-xl border border-orange-600 hover:shadow-md transition cursor-pointer"
          >
            <div class="relative">
              <img
                v-if="ranking.userAvatar"
                :src="ranking.userAvatar"
                :alt="ranking.userName"
                class="w-14 h-14 rounded-full border-3 border-orange-400 shadow-md object-cover"
              />
              <div
                v-else
                class="w-14 h-14 rounded-full border-3 border-orange-400 bg-orange-100 flex items-center justify-center shadow-md"
              >
                <i class="fas fa-user text-orange-600"></i>
              </div>
              <div
                class="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-xs"
              >
                {{ ranking.rank }}
              </div>
            </div>
            <div class="flex-1">
              <p class="font-semibold text-white">{{ ranking.userName }}</p>
              <p class="text-sm text-gray-300">{{ ranking.playCount }}회 플레이</p>
            </div>
            <div class="text-right">
              <p class="text-lg font-bold text-orange-600">{{ ranking.rating }}</p>
              <p class="text-xs text-gray-400">레이팅</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Full Rankings List (4th and below) -->
      <div v-if="rankings.length > 3" class="bg-gray-800 rounded-2xl shadow-lg p-6">
        <h2 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <i class="fas fa-list-ol text-orange-500"></i>
          전체 랭킹
        </h2>
        <div class="space-y-2">
          <div
            v-for="ranking in rankings.slice(3)"
            :key="ranking.userId"
            @click="goToProfile(ranking.userId)"
            :class="[
              'flex items-center gap-4 p-4 rounded-xl border transition cursor-pointer',
              ranking.isCurrentUser
                ? 'bg-orange-900/20 border-orange-600 hover:bg-orange-800/30'
                : 'bg-gray-700 border-gray-600 hover:bg-gray-600',
            ]"
          >
            <div class="w-8 text-center">
              <span
                :class="[
                  'font-bold',
                  ranking.isCurrentUser ? 'text-orange-400' : 'text-gray-400',
                ]"
              >
                {{ ranking.rank }}
              </span>
            </div>
            <img
              v-if="ranking.userAvatar"
              :src="ranking.userAvatar"
              :alt="ranking.userName"
              class="w-12 h-12 rounded-full border-2 border-gray-600 shadow object-cover"
            />
            <div
              v-else
              class="w-12 h-12 rounded-full border-2 border-gray-600 bg-gray-700 flex items-center justify-center shadow"
            >
              <i class="fas fa-user text-gray-400"></i>
            </div>
            <div class="flex-1">
              <p
                :class="[
                  'font-semibold',
                  ranking.isCurrentUser ? 'text-orange-400' : 'text-white',
                ]"
              >
                {{ ranking.userName }}
                <span v-if="ranking.isCurrentUser" class="text-xs ml-1">(나)</span>
              </p>
              <p class="text-sm text-gray-300">{{ ranking.playCount }}회</p>
            </div>
            <div class="text-right">
              <p
                :class="[
                  'text-lg font-bold',
                  ranking.isCurrentUser ? 'text-orange-400' : 'text-gray-300',
                ]"
              >
                {{ ranking.rating }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="rankings.length === 0" class="bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
        <i class="fas fa-users-slash text-gray-400 text-5xl mb-4"></i>
        <p class="text-gray-300 font-semibold mb-2">아직 랭킹 정보가 없습니다</p>
        <p class="text-gray-400 text-sm">이 규칙으로 첫 경기를 시작해보세요!</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '@/api/api.js'
import HeaderComp from '@/components/HeaderComp.vue'

const router = useRouter()
const route = useRoute()

const ruleId = ref(route.params.ruleId)
const ruleName = ref('')
const rankings = ref([])
const currentUserRanking = ref(null)
const loading = ref(true)
const error = ref(null)

const fetchRankings = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await api.get(`/api/rules/${ruleId.value}/rankings`)
    const data = response.data

    ruleName.value = data.ruleName || '규칙 랭킹'
    rankings.value = data.rankings || []
    currentUserRanking.value = data.currentUserRanking || null
  } catch (err) {
    console.error('랭킹 조회 실패:', err)
    if (err.response && err.response.data && err.response.data.message) {
      error.value = err.response.data.message
    } else {
      error.value = '랭킹 정보를 불러오는 데 실패했습니다.'
    }
  } finally {
    loading.value = false
  }
}

const goToProfile = (userId) => {
  router.push(`/profile/${userId}`)
}

onMounted(() => {
  fetchRankings()
})
</script>

<style scoped>
/* Custom animations and styles */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slideUp 0.3s ease-out;
}
</style>
