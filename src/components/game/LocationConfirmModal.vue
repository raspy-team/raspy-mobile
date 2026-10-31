<template>
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[100000]"
  >
    <div class="bg-gray-900 p-6 m-5 rounded-2xl w-full max-w-md shadow-2xl">
      <!-- 헤더 -->
      <div class="text-center mb-6">
        <div
          class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-500/15 mb-4"
        >
          <i class="fas fa-map-marker-alt text-orange-500 text-3xl"></i>
        </div>
        <h2 class="text-xl font-bold text-white mb-2">경기 장소 확인</h2>
        <p class="text-sm text-gray-500">선택하신 장소에서 경기를 진행합니다</p>
      </div>

      <!-- 장소 정보 카드 -->
      <div
        class="mb-6 p-5 bg-orange-500/10 rounded-xl border-2 border-orange-500/30"
      >
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0 mt-1">
            <i class="fas fa-location-dot text-orange-600 text-xl"></i>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-base font-medium text-white mb-1 break-words">
              {{ location }}
            </p>
            <p class="text-xs text-orange-600 font-medium">
              <i class="fas fa-info-circle mr-1"></i>이 장소로 경기를 시작합니다
            </p>
          </div>
        </div>
      </div>

      <!-- 버튼 영역 -->
      <div class="space-y-3">
        <button
          @click="emit('continue')"
         class="w-full py-4 px-6 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg active:scale-95 transition-all"
        >
          <i class="fas fa-check-circle mr-2"></i>이 장소로 계속하기
        </button>
        <button
          @click="emit('change')"
         class="w-full py-3 px-6 rounded-xl bg-gray-900 border-2 border-gray-800 hover:border-orange-300 hover:bg-orange-500/10 text-gray-200 font-bold active:scale-95 transition-all"
        >
          <i class="fas fa-edit mr-2"></i>다른 장소로 변경
        </button>
        <button
          @click="emit('close')"
          class="w-full py-2 text-gray-500 hover:text-gray-200 font-medium transition"
        >
          취소
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
// 경기를 시작하기 전에 정해둔 장소가 맞는지 묻는다. 그대로 시작하거나 장소를 바꾼다
import { defineProps, defineEmits } from 'vue'
defineProps({ location: { type: String, default: '' } })
const emit = defineEmits(['close', 'change', 'continue'])
</script>
