<template>
  <div
    class="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-[100000] p-4"
  >
    <div
      class="bg-gray-800 p-6 rounded-2xl w-full max-w-md shadow-2xl border border-gray-700 relative max-h-[80vh] overflow-y-auto"
    >
      <button
        @click.stop="emit('close')"
        class="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-1"
      >
        <i class="fas fa-times text-xl"></i>
      </button>

      <h2 class="text-xl font-bold mb-6 text-white pr-8">신청자</h2>

      <!-- 생성자 정보 (신청한 게임의 경우) -->
      <template v-if="game.type === 'sent'">
        <div class="p-4 bg-gray-700/50 rounded-xl border border-gray-600 mb-6">
          <h3 class="text-sm font-medium text-gray-300 mb-3 flex items-center">
            <i class="fas fa-crown text-yellow-400 mr-2"></i>
            생성자
          </h3>
          <div class="flex items-center gap-3">
            <img
              :src="
                game.ownerProfileUrl ||
                game.myProfileUrl ||
                '/default.png'
              "
              class="w-12 h-12 rounded-full object-cover border-2 border-orange-400"
              alt="Owner Profile"
            />
            <div class="flex-1">
              <p
               class="text-base font-medium flex items-center gap-2 text-white"
                :class="
                  game.championId ==
                  (game.ownerId || game.myId)
                    ? 'text-yellow-400'
                    : 'text-white'
                "
              >
                {{
                  game.ownerNickname || game.myNickname
                }}
                <i
                  v-if="
                    game.championId ==
                    (game.ownerId || game.myId)
                  "
                  class="fas fa-crown text-yellow-400 text-sm"
                ></i>
              </p>
              <p class="text-sm text-gray-400">
                {{ game.ownerStatistics?.wins }}승
                {{ game.ownerStatistics?.draws }}무
                {{ game.ownerStatistics?.losses }}패 · 승률
                {{
                  getWinRate(
                    game.ownerStatistics || {
                      wins: 0,
                      draws: 0,
                      losses: 0,
                    },
                  )
                }}%
              </p>
              <p class="text-sm flex items-center gap-1 text-gray-400">
                <i
                  :class="[
                    (game.ownerStatistics?.manner || 4.5) >= 4
                      ? 'fas fa-face-smile text-green-400'
                      : (game.ownerStatistics?.manner || 4.5) >= 2
                        ? 'fas fa-face-meh text-orange-400'
                        : (game.ownerStatistics?.manner || 4.5) > 0
                          ? 'fas fa-face-frown text-red-400'
                          : 'fas fa-user-slash text-gray-500',
                  ]"
                ></i>
                {{ (game.ownerStatistics?.manner || 4.5).toFixed(1) }}
              </p>
            </div>
          </div>
        </div>
      </template>

      <!-- 도전자 목록 -->
      <div
        v-if="
          game.applicants && game.applicants.length > 0
        "
      >
        <h3 class="text-sm font-medium text-gray-300 mb-3 flex items-center">
          <i class="fas fa-users text-orange-400 mr-2"></i>
          신청자 ({{ game.applicants.length }}명)
        </h3>
        <div class="space-y-3">
          <div
            v-for="user in game.applicants"
            :key="user.userId"
            class="p-4 bg-gray-700/50 rounded-xl border border-gray-600 hover:bg-gray-700/70 transition-colors"
          >
            <div class="flex items-center justify-between">
              <router-link
                :to="'/profile/' + user.userId"
                class="flex items-center gap-3 flex-1"
              >
                <img
                  :src="user.applicantProfileUrl || '/default.png'"
                  class="w-12 h-12 rounded-full object-cover border-2 border-blue-400"
                />
                <div class="flex-1">
                  <p
                   class="text-base font-medium flex items-center gap-2 text-white"
                    :class="
                      game.championId == user.userId
                        ? 'text-yellow-400'
                        : 'text-white'
                    "
                  >
                    {{ user.applicantNickname }}
                    <i
                      v-if="game.championId == user.userId"
                      class="fas fa-crown text-yellow-400 text-sm"
                    ></i>
                  </p>
                  <p class="text-sm text-gray-400">
                    {{ user.applicantGameStatisticsDTO.wins }}승
                    {{ user.applicantGameStatisticsDTO.draws }}무
                    {{ user.applicantGameStatisticsDTO.losses }}패 · 승률
                    {{ getWinRate(user.applicantGameStatisticsDTO) }}%
                  </p>
                </div>
              </router-link>

              <div class="flex flex-col gap-2 ml-3">
                <template v-if="game.type === 'my-game'">
                  <button
                    v-if="!user.approved"
                    @click.stop="emit('approve', game.id, user.userId)"
                    :disabled="approvedExists(game.applicants)"
                    class="px-4 py-2 text-xs rounded-lg text-white font-medium transition-all duration-200"
                    :class="
                      approvedExists(game.applicants)
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-orange-500 hover:bg-orange-600 active:scale-95'
                    "
                  >
                    승인
                  </button>
                  <button
                    v-else
                    @click.stop="emit('cancel', game.id, user.userId)"
                    class="px-4 py-2 text-xs rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 active:scale-95 transition-all duration-200"
                  >
                    취소
                  </button>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-center text-gray-400 text-sm py-8">
        <i class="fas fa-users text-3xl text-gray-400 mb-3"></i>
        <p>아직 신청자가 없어요.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
// 내 경기에 들어온 신청자 목록. 주최자는 여기서 승인하거나 승인을 취소한다
import { defineProps, defineEmits } from 'vue'
defineProps({ game: { type: Object, required: true } })
const emit = defineEmits(['close', 'approve', 'cancel'])

function getWinRate(stats) {
  const total = stats.wins + stats.draws + stats.losses
  if (total === 0) return 0
  return Math.round((stats.wins / total) * 100)
}

function approvedExists(applicants) {
  return applicants.some((user) => user.approved)
}
</script>
