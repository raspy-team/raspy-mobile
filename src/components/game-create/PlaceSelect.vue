<template>
  <div class="flex flex-col min-h-screen bg-gradient-to-b from-white to-gray-50 px-5 pt-10">
    <div class="max-w-lg mx-auto w-full">
      <section class="rounded-2xl shadow-lg bg-white p-6 mt-16 mb-4">
        <div class="flex items-center justify-between mb-3">
          <span class="text-lg font-bold text-gray-900">경기 장소</span>
          <button
            type="button"
            @click="setUnset"
            :class="
              placeRoad === null
                ? 'bg-orange-100 text-orange-500 border border-orange-300'
                : 'bg-gray-100 text-gray-400 border border-gray-200'
            "
            class="rounded-full px-4 py-1 text-xs font-semibold shadow-sm transition hover:scale-105"
          >
            미정
          </button>
        </div>
        <transition name="fade">
          <div v-if="placeRoad !== null">
            <button
              type="button"
              @click="openAddressSearch"
              class="flex items-center w-full border border-gray-200 rounded-xl p-3 text-left bg-gray-50 hover:bg-orange-50 transition mb-3"
            >
              <i class="far fa-building text-orange-400 mr-3"></i>
              <span class="flex-1 text-base text-gray-700">{{
                placeRoad || '도로명 주소 입력'
              }}</span>
              <i class="fas fa-chevron-right text-gray-300"></i>
            </button>
            <input
              v-model="placeDetail"
              id="place-detail"
              placeholder="상세주소 입력"
              class="w-full text-gray-700 text-base rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-orange-400 transition"
              autocomplete="off"
            />
            <p class="text-xs text-gray-500 mt-1">예: ○○빌딩 3층, ○○체육관 등</p>
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
        @click="submitPlace"
        class="flex-1 py-4 text-lg font-bold rounded-xl bg-orange-500 text-white transition disabled:opacity-60"
      >
        다음
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, defineEmits } from 'vue'
const emit = defineEmits(['select', 'skip'])

const placeRoad = ref('')
const placeDetail = ref('')

function setUnset() {
  if (placeRoad.value === null) {
    placeRoad.value = ''
    placeDetail.value = ''
  } else {
    placeRoad.value = null
    placeDetail.value = ''
  }
}

function openAddressSearch() {
  if (!window.daum?.Postcode) {
    alert('주소 검색 서비스를 사용할 수 없습니다.')
    return
  }
  new window.daum.Postcode({
    oncomplete(data) {
      placeRoad.value = data.roadAddress || data.jibunAddress
      nextTick(() => {
        const input = document.getElementById('place-detail')
        if (input) input.focus()
      })
    },
  }).open()
}

function submitPlace() {
  emit('select', {
    placeRoad: placeRoad.value,
    placeDetail: placeDetail.value,
  })
}

function emitBack() {
  placeRoad.value = null
  placeDetail.value = ''
  emit('back')
}
</script>
