<template>
  <div @click="goToRanking" class="group relative flex items-center gap-4 p-4 bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-md hover:shadow-xl border border-gray-200 transition-all duration-300 overflow-hidden cursor-pointer">
    <!-- Hover effect background -->
    <div class="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/5 to-orange-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

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
      <h4 class="text-base font-bold text-gray-900 truncate mb-1">
        {{ rule.ruleTitle }}
      </h4>
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-1">
          <i class="fas fa-star text-yellow-500 text-xs"></i>
          <span class="text-sm font-semibold text-gray-700">{{ rule.rating }}</span>
        </div>
        <div class="w-1 h-1 rounded-full bg-gray-300"></div>
        <div class="flex items-center gap-1">
          <i class="fas fa-gamepad text-orange-500 text-xs"></i>
          <span class="text-sm text-gray-600 font-medium">{{ rule.playCount }}회</span>
        </div>
      </div>
    </div>

    <!-- Arrow indicator -->
    <div class="relative flex-shrink-0">
      <i class="fas fa-chevron-right text-gray-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all duration-200"></i>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  rule: Object,
})

const router = useRouter()

const goToRanking = () => {
  router.push(`/rules/${props.rule.ruleId}/ranking`)
}
</script>

<style scoped>
/* Add any specific styles for TopRuleCard here if needed */
</style>
