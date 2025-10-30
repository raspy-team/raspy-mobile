<template>
  <div @click="goToRanking" class="group relative flex items-center gap-4 p-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-md hover:shadow-xl border border-gray-600 transition-all duration-300 overflow-hidden cursor-pointer">
    <!-- Hover effect background -->
    <div class="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/10 to-orange-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

    <!-- Icon/Image Section -->
    <div class="relative flex-shrink-0">
      <div class="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
        <img
          :src="`/category-picture/${rule.minorCategory || '미분류'}.png`"
          alt="rule category"
          class="w-10 h-10 object-contain"
        />
      </div>
    </div>

    <!-- Content Section -->
    <div class="flex-1 min-w-0 relative">
      <h4 class="text-base font-bold text-gray-200 truncate mb-1">
        {{ rule.ruleTitle }}
      </h4>
      <div class="flex items-center gap-3 flex-wrap">
        <div class="flex items-center gap-1">
          <i class="fas fa-star text-yellow-500 text-xs"></i>
          <span class="text-sm font-semibold text-gray-300">{{ rule.rating }}</span>
        </div>
        <div class="w-1 h-1 rounded-full bg-gray-500"></div>
        <div class="flex items-center gap-1">
          <i class="fas fa-gamepad text-orange-500 text-xs"></i>
          <span class="text-sm text-gray-400 font-medium">{{ rule.playCount }}회</span>
        </div>
        <!-- Ranking Badge -->
        <div v-if="rule.myRank && rule.totalPlayers"
             :class="rankBadgeStyle"
             class="flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-lg ring-2 ring-white/20">
          <i :class="`fas ${rankIcon} text-white text-xs`"></i>
          <span class="text-xs font-bold text-white">
            {{ rule.myRank }}위
          </span>
          <span class="text-[10px] text-white/80">
            (상위 {{ rankPercentile }}%)
          </span>
        </div>
      </div>
    </div>

    <!-- Arrow indicator -->
    <div class="relative flex-shrink-0">
      <i class="fas fa-chevron-right text-gray-500 group-hover:text-orange-500 group-hover:translate-x-1 transition-all duration-200"></i>
    </div>
  </div>
</template>

<script setup>
import { defineProps, computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  rule: Object,
})

const router = useRouter()

const goToRanking = () => {
  router.push(`/rules/${props.rule.ruleId}/ranking`)
}

// 랭킹 백분위 계산
const rankPercentile = computed(() => {
  if (!props.rule.myRank || !props.rule.totalPlayers) return null
  return ((props.rule.myRank / props.rule.totalPlayers) * 100).toFixed(1)
})

// 랭킹 등급 결정 (상위 몇%인지에 따라)
const rankTier = computed(() => {
  if (!rankPercentile.value) return null
  const percent = parseFloat(rankPercentile.value)
  if (percent <= 1) return 'legendary' // 상위 1%
  if (percent <= 5) return 'master' // 상위 5%
  if (percent <= 10) return 'diamond' // 상위 10%
  if (percent <= 25) return 'gold' // 상위 25%
  return 'normal'
})

// 티어별 스타일
const rankBadgeStyle = computed(() => {
  switch (rankTier.value) {
    case 'legendary':
      return 'bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 animate-pulse-slow'
    case 'master':
      return 'bg-gradient-to-r from-orange-500 to-red-500'
    case 'diamond':
      return 'bg-gradient-to-r from-cyan-500 to-blue-500'
    case 'gold':
      return 'bg-gradient-to-r from-yellow-500 to-orange-500'
    default:
      return 'bg-gradient-to-r from-gray-600 to-gray-700'
  }
})

// 티어별 아이콘
const rankIcon = computed(() => {
  switch (rankTier.value) {
    case 'legendary':
      return 'fa-crown'
    case 'master':
    case 'diamond':
    case 'gold':
      return 'fa-trophy'
    default:
      return 'fa-medal'
  }
})
</script>

<style scoped>
@keyframes pulse-slow {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.85;
  }
}

.animate-pulse-slow {
  animation: pulse-slow 2s ease-in-out infinite;
}
</style>
