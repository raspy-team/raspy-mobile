<template>
  <div class="flex flex-col min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 px-5 pt-10">
    <div class="max-w-lg mx-auto w-full">
      <section class="rounded-2xl shadow-2xl bg-gray-800 p-6 mt-16 mb-4 border border-gray-700">
        <div class="mb-4">
          <span class="text-xl font-bold text-white block mb-3">경기 시간</span>
          <input
            v-model="time"
            type="datetime-local"
            class="w-full border-2 border-gray-600 rounded-xl py-3 px-4 mb-2 text-white bg-gray-700 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition"
          />
          <div class="text-xs text-gray-500 mb-2">
            <i class="fas fa-info-circle text-blue-400 mr-1"></i>
            시간은 경기 시작 시 직접 설정할 수도 있습니다.
          </div>
        </div>
      </section>
    </div>
    <div class="fixed bottom-0 left-0 w-full bg-gray-800 p-5 shadow-2xl flex gap-3 border-t border-gray-700">
      <button
        @click="emitBack"
        class="flex-1 py-4 text-lg font-bold rounded-xl border border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600 active:scale-98 transition-all duration-200"
      >
        이전
      </button>
      <button
        @click="submitTime"
        class="flex-1 py-4 text-lg font-bold rounded-xl bg-orange-500 text-white hover:bg-orange-600 active:scale-98 transition-all duration-200 disabled:opacity-60 shadow-lg"
      >
        다음
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, defineEmits } from 'vue'
const emit = defineEmits(['select', 'back'])
const time = ref('')

function submitTime() {
  emit('select', time.value)
}

function emitBack() {
  time.value = ''
  emit('back')
}
</script>
