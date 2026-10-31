<template>
  <div class="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm">
    <div class="h-full flex flex-col">
      <div
        class="flex-shrink-0 px-6 py-4 bg-slate-900/95 border-b border-white/10"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <i class="fas fa-book text-blue-400 text-sm"></i>
            </div>
            <div>
              <h2 class="text-xl font-bold text-white">경기 규칙</h2>
              <p class="text-sm text-white/60">{{ rule?.ruleTitle || '규칙 제목 없음' }}</p>
              <div
                v-if="rule?.averageRating && rule.averageRating > 0"
                class="flex items-center gap-1 mt-1"
              >
                <i class="fas fa-star text-purple-400 text-xs"></i>
                <span class="text-xs text-white/70">
                  {{ rule.averageRating.toFixed(1) }}/5 ({{ rule.ratingCount || 0 }}명)
                </span>
              </div>
            </div>
          </div>
          <button
            class="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/80 flex items-center justify-center transition-all duration-200 active:scale-95"
            @click="emit('close')"
          >
            <i class="fas fa-times text-sm"></i>
          </button>
        </div>
      </div>
  
      <div class="flex-1 overflow-hidden">
        <div class="h-full overflow-y-auto no-scrollbar" style="scroll-behavior: smooth">
          <div class="px-6 py-6 space-y-6">
            <div
              class=" bg-blue-500/10 border border-blue-500/20 rounded-2xl overflow-hidden"
            >
              <div class="px-5 py-4 bg-blue-500/10 border-b border-blue-500/20">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <i class="fas fa-target text-blue-400 text-xs"></i>
                  </div>
                  <h3 class="font-bold text-white">경기 목표</h3>
                </div>
              </div>
              <div class="px-5 py-4">
                <p class="text-white/80 leading-relaxed whitespace-pre-line">
                  {{ rule?.ruleGoal || '목표 정보 없음' }}
                </p>
              </div>
            </div>
  
            <div
              class=" bg-emerald-500/10 border border-emerald-500/20 rounded-2xl overflow-hidden"
            >
              <div class="px-5 py-4 bg-emerald-500/10 border-b border-emerald-500/20">
                <div class="flex items-center gap-2">
                  <div
                    class="w-6 h-6 bg-emerald-500/20 rounded-lg flex items-center justify-center"
                  >
                    <i class="fas fa-calculator text-emerald-400 text-xs"></i>
                  </div>
                  <h3 class="font-bold text-white">점수 계산</h3>
                </div>
              </div>
              <div class="px-5 py-4">
                <p class="text-white/80 leading-relaxed whitespace-pre-line">
                  {{ rule?.ruleScoreDefinition || '점수 정보 없음' }}
                </p>
              </div>
            </div>
  
            <div
              class=" bg-orange-500/10 border border-orange-500/20 rounded-2xl overflow-hidden"
            >
              <div class="px-5 py-4 bg-orange-500/10 border-b border-orange-500/20">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <i class="fas fa-tools text-orange-400 text-xs"></i>
                  </div>
                  <h3 class="font-bold text-white">경기 준비</h3>
                </div>
              </div>
              <div class="px-5 py-4">
                <p class="text-white/80 leading-relaxed whitespace-pre-line">
                  {{ rule?.rulePreparation || '준비 정보 없음' }}
                </p>
              </div>
            </div>
  
            <div
              class=" bg-purple-500/10 border border-purple-500/20 rounded-2xl overflow-hidden"
            >
              <div class="px-5 py-4 bg-purple-500/10 border-b border-purple-500/20">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <i class="fas fa-list-ol text-purple-400 text-xs"></i>
                  </div>
                  <h3 class="font-bold text-white">경기 순서</h3>
                </div>
              </div>
              <div class="px-5 py-4">
                <p class="text-white/80 leading-relaxed whitespace-pre-line">
                  {{ rule?.ruleOrder || '순서 정보 없음' }}
                </p>
              </div>
            </div>
  
            <div
              class=" bg-indigo-500/10 border border-indigo-500/20 rounded-2xl overflow-hidden"
            >
              <div class="px-5 py-4 bg-indigo-500/10 border-b border-indigo-500/20">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                    <i class="fas fa-gavel text-indigo-400 text-xs"></i>
                  </div>
                  <h3 class="font-bold text-white">판정 기준</h3>
                </div>
              </div>
              <div class="px-5 py-4">
                <p class="text-white/80 leading-relaxed whitespace-pre-line">
                  {{ rule?.ruleDecision || '판정 정보 없음' }}
                </p>
              </div>
            </div>
  
            <div
              class=" bg-red-500/10 border border-red-500/20 rounded-2xl overflow-hidden"
            >
              <div class="px-5 py-4 bg-red-500/10 border-b border-red-500/20">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <i class="fas fa-exclamation-triangle text-red-400 text-xs"></i>
                  </div>
                  <h3 class="font-bold text-white">반칙</h3>
                </div>
              </div>
              <div class="px-5 py-4">
                <p class="text-white/80 leading-relaxed whitespace-pre-line">
                  {{ rule?.ruleFoul || '반칙 정보 없음' }}
                </p>
              </div>
            </div>
  
            <div
              v-if="rule?.ruleExtraInfo"
              class=" bg-gray-500/10 border border-gray-500/20 rounded-2xl overflow-hidden"
            >
              <div class="px-5 py-4 bg-gray-500/10 border-b border-gray-500/20">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 bg-gray-500/20 rounded-lg flex items-center justify-center">
                    <i class="fas fa-info-circle text-gray-400 text-xs"></i>
                  </div>
                  <h3 class="font-bold text-white">추가 정보</h3>
                </div>
              </div>
              <div class="px-5 py-4">
                <p class="text-white/80 leading-relaxed whitespace-pre-line">
                  {{ rule?.ruleExtraInfo }}
                </p>
              </div>
            </div>
  
            <div class="h-4"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// 피드 게시물(경기)의 규칙 전체를 보여주는 모달
import { defineProps, defineEmits } from 'vue'
defineProps({ rule: { type: Object, default: null } })
const emit = defineEmits(['close'])
</script>
