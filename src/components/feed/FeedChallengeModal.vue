<template>
  <div
    class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    @click="emit('close')"
  >
    <div
      class="bg-gray-900 rounded-2xl max-w-sm w-full max-h-[80vh] overflow-y-auto relative"
      @click.stop
    >
      <button
        @click="emit('close')"
        class="absolute top-4 right-4 text-gray-400 hover:text-gray-400 transition p-2"
        style="z-index: 10"
        aria-label="닫기"
      >
        <i class="fas fa-times text-xl"></i>
      </button>
      <div class="p-6 pt-8">
        <p class="text-sm text-gray-400 mb-4">내가 도전할 상대는?</p>
        <div class="space-y-3">
          <div
            v-for="player in players"
            :key="player.id"
            class="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-800 transition group select-none"
          >
            <img
              :src="player.avatar || '/assets/default.png'"
              :alt="player.name"
              class="w-12 h-12 rounded-full object-cover border-2 border-gray-800 transition"
            />
            <div class="flex-1 text-left">
              <div class="font-medium text-white transition">
                {{ player.name }}
              </div>
              <div class="text-sm text-gray-500">플레이어</div>
            </div>
            <button
              @click="emit('select', player)"
              class="ml-2 text-gray-400 hover:text-orange-500 transition p-2 rounded-full hover:bg-orange-500/15"
              aria-label="요청 보내기"
            >
              <i class="fas fa-chevron-right text-lg"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// 끝난 경기의 두 선수 중 누구에게 도전할지 고르는 모달
import { defineProps, defineEmits } from 'vue'
defineProps({ players: { type: Array, default: () => [] } })
const emit = defineEmits(['select', 'close'])
</script>
