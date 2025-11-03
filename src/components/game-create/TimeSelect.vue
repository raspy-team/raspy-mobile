<template>
  <div class="flex flex-col min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 px-5 pt-10">
    <div class="max-w-lg mx-auto w-full">
      <section class="rounded-2xl shadow-2xl bg-gray-800 p-6 mt-16 mb-4 border border-gray-700">
        <div class="mb-4">
          <span class="text-xl font-bold text-white block mb-3">경기 시간</span>
          <button
            type="button"
            @click="setUnset"
            :class="time === null
              ? 'bg-orange-500 text-white border-orange-400 shadow-lg'
              : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'"
            class="w-full py-3 text-sm font-semibold rounded-xl border transition-all duration-200 active:scale-98"
          >
            <i class="fas fa-question-circle mr-2"></i>
            {{ time === null ? '시간 미정으로 설정됨' : '시간 미정으로 변경' }}
          </button>
        </div>
        <transition name="fade">
          <div v-if="time !== null">
            <input
              v-model="time"
              type="datetime-local"
              class="w-full border-2 border-gray-600 rounded-xl py-3 px-4 mb-2 text-white bg-gray-700 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition"
              :disabled="time === null"
            />
            <div class="text-xs text-gray-500 mb-2">
              시간은 경기 시작 시 직접 설정할 수도 있습니다.
            </div>
          </div>
          <div v-else class="mb-4">
            <label class="block text-sm font-medium text-gray-300 mb-2">
              <i class="fas fa-clock mr-1 text-orange-400"></i>
              선호 시간 (선택)
            </label>
            <input
              v-model="preferredTime"
              placeholder="선호하는 시간대를 입력하세요."
              class="w-full text-base px-4 py-3 rounded-xl border-2 border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:border-orange-400 outline-none transition"
              autocomplete="off"
            />
            <p class="text-xs text-gray-500 mt-2">
              <i class="fas fa-info-circle text-blue-400 mr-1"></i>
              입력하신 선호 시간은 경기 생성 시 "주말 저녁 선호, 협의 가능" 형태로 표시됩니다
            </p>
          </div>
        </transition>
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
const emit = defineEmits(['select', 'skip'])
const time = ref('')
const preferredTime = ref('')

function setUnset() {
  // 미정 처리
  if (time.value === null) {
    time.value = ''
  } else {
    time.value = null
  }
  preferredTime.value = ''
}

function submitTime() {
  if (time.value === null) {
    const timeDetail = preferredTime.value
      ? `${preferredTime.value} 선호, 협의 가능`
      : '협의 가능'
    emit('select', { time: null, timeDetail })
  } else {
    emit('select', time.value)
  }
}

function emitBack() {
  time.value = null
  preferredTime.value = ''
  emit('back')
}
</script>
