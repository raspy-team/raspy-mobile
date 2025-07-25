<template>
  <div class="flex flex-col min-h-screen bg-gradient-to-b from-white to-gray-50 px-5 pt-10">
    <div class="max-w-lg mx-auto w-full">
      <section class="rounded-2xl shadow-lg bg-white p-6 mt-16 mb-4">
        <div class="flex items-center justify-between mb-3">
          <span class="text-lg font-bold text-gray-900">경기 시간</span>
          <button
            type="button"
            @click="setUnset"
            :class="
              time === null
                ? 'bg-orange-100 text-orange-500 border border-orange-300'
                : 'bg-gray-100 text-gray-400 border border-gray-200'
            "
            class="rounded-full px-4 py-1 text-xs font-semibold shadow-sm transition hover:scale-105"
          >
            미정
          </button>
        </div>
        <transition name="fade">
          <div v-if="time !== null">
            <input
              v-model="time"
              type="datetime-local"
              class="w-full border border-gray-200 rounded-xl py-3 px-4 mb-2 text-gray-700 bg-gray-50 focus:ring-2 focus:ring-orange-400 transition"
              :disabled="time === null"
            />
            <div class="text-xs text-gray-500 mb-2">
              시간은 경기 시작 시 직접 설정할 수도 있습니다.
            </div>
          </div>
          <div v-else class="text-gray-400 text-sm mt-4">미정으로 설정됨</div>
        </transition>
      </section>
    </div>
    <div class="fixed bottom-0 left-0 w-full bg-white p-5 shadow-xl flex gap-2">
      <button
        @click="emitBack"
        class="flex-1 py-4 text-lg font-bold rounded-xl border border-gray-200 bg-gray-100 text-gray-400"
      >
        이전
      </button>
      <button
        @click="submitTime"
        class="flex-1 py-4 text-lg font-bold rounded-xl bg-orange-500 text-white transition disabled:opacity-60"
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

function setUnset() {
  // 미정 처리
  if (time.value === null) {
    time.value = ''
  } else {
    time.value = null
  }
}

function submitTime() {
  emit('select', time.value)
}
function emitBack() {
  time.value = null
  emit('back')
}
</script>
