<template>
  <section
    class="w-screen shrink-0 h-full relative p-5 flex items-center justify-center"
  >
    <div class="absolute inset-0 bg-black" />
    <div class="relative z-10 max-w-xl w-full">
      <!-- 랭킹 데이터가 있는 경우 -->
      <template v-if="status === 'available' && ranking.length > 0">
        <div class="flex items-center justify-between mb-2">
          <div class="text-xl font-bold">규칙 랭킹</div>
          <div class="text-xs text-white/70">총 {{ ranking.length }}명</div>
        </div>
        <div
          class="bg-white/10 border border-white/15 rounded-2xl backdrop-blur-md max-h-[70vh] overflow-auto no-scrollbar touch-scroll"
          @touchstart.stop
          @touchmove.stop
          @touchend.stop
        >
          <div
            v-for="r in ranking"
            :key="r.userId"
            class="flex items-center gap-3 px-4 py-3 border-b border-white/10 last:border-b-0 cursor-pointer active:scale-[0.98] transition"
            :class="r.isPlayer ? 'bg-blue-400/10' : ''"
            @click="emit('profile', r.userId)"
          >
            <div
             class="w-10 text-center font-medium flex-shrink-0"
              :class="r.rankAfter <= 3 ? 'text-amber-300' : 'text-white'"
            >
              {{ r.rankAfter }}
            </div>
            <img
              :src="
                r.profilePicture ||
                'https://d1iimlpplvq3em.cloudfront.net/service/default-profile.png'
              "
              class="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <div class="truncate font-medium">{{ r.nickname }}</div>
                <div
                  v-if="r.isPlayer"
                  class="px-1.5 py-0.5 bg-blue-400/20 border border-blue-300/30 text-blue-200 text-xs rounded-full flex-shrink-0"
                >
                  참여자
                </div>
              </div>
              <div class="text-xs text-white/70 truncate mt-0.5">
                레이팅 {{ r.ratingAfter }}
                <span
                  v-if="r.ratingChange !== 0"
                  :class="r.ratingChange > 0 ? 'text-emerald-300' : 'text-red-300'"
                >
                  ({{ r.ratingChange > 0 ? '+' : '' }}{{ r.ratingChange }})
                </span>
              </div>
            </div>
            <div v-if="r.rankChange !== null && r.rankChange !== 0" class="flex-shrink-0">
              <div
                class="text-xs font-medium flex items-center gap-0.5"
                :class="r.rankChange > 0 ? 'text-emerald-300' : 'text-red-300'"
              >
                <i
                  :class="r.rankChange > 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down'"
                  class="text-xs"
                ></i>
                {{ Math.abs(r.rankChange) }}
              </div>
            </div>
          </div>
        </div>
  
        <!-- 전체 랭킹 보기 버튼 -->
        <button
          @click="emit('open-all')"
         class="w-full mt-4 px-6 py-3 bg-amber-500 text-white font-medium rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2"
        >
          <i class="fas fa-trophy text-white/90"></i>
          <span>전체 랭킹 보기</span>
          <i class="fas fa-chevron-right text-sm text-white/70"></i>
        </button>
      </template>
  
      <!-- 랭킹 시스템 도입 전 경기인 경우 -->
      <template v-else-if="status === 'unavailable'">
        <div class="flex items-center justify-between mb-2">
          <div class="text-xl font-bold">경기 랭킹</div>
        </div>
        <div
          class="bg-white/10 border border-white/15 rounded-2xl backdrop-blur-md p-8 text-center"
        >
          <div class="mb-4">
            <div
              class="w-16 h-16 mx-auto bg-white/10 rounded-2xl flex items-center justify-center"
            >
              <i class="fas fa-clock text-3xl text-white/60"></i>
            </div>
          </div>
          <h3 class="text-lg font-bold text-white mb-2">랭킹 정보 없음</h3>
          <p class="text-sm text-white/70 leading-relaxed">
            이 경기는 랭킹 시스템 도입 이전에<br />
            진행된 경기입니다.
          </p>
          <div class="mt-4 pt-4 border-t border-white/10">
            <p class="text-xs text-white/50">
              <i class="fas fa-info-circle mr-1"></i>
              2025.10.07 이후 경기부터 랭킹이 기록됩니다
            </p>
          </div>
        </div>
      </template>
    </div>
  </section>
</template>

<script setup>
// 이 경기 뒤 규칙 랭킹. 랭킹 기록 전 경기면 안내만
import { defineProps, defineEmits } from 'vue'
defineProps({
  ranking: { type: Array, default: () => [] },
  status: { type: String, default: null }, // 'available' | 'unavailable'
})
const emit = defineEmits(['profile', 'open-all'])
</script>
