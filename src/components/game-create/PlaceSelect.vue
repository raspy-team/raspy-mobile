<template>
  <div class="flex flex-col min-h-screen bg-gradient-to-b from-white to-gray-50 px-5 pt-10">
    <div class="max-w-lg mx-auto w-full">
      <section class="rounded-2xl shadow-lg bg-white p-6 mt-16 mb-4">
        <div class="flex items-center justify-between mb-3">
          <span class="text-lg font-bold text-gray-900">경기 장소</span>
          <button
            type="button"
            @click="setUnset"
            :class="placeRoad === null
              ? 'bg-orange-100 text-orange-500 border border-orange-300'
              : 'bg-gray-100 text-gray-400 border border-gray-200'"
            class="rounded-full px-4 py-1 text-xs font-semibold shadow-sm transition hover:scale-105"
          >미정</button>
        </div>

        <transition name="fade">
          <div v-if="placeRoad !== null">
            <button
              type="button"
              @click="openAddressSearch"
              class="flex items-center w-full border border-gray-200 rounded-xl p-3 text-left bg-gray-50 hover:bg-orange-50 transition mb-3"
            >
              <i class="far fa-building text-orange-400 mr-3"></i>
              <div class="flex-1">
                <div class="text-sm text-gray-700 mt-0.5">{{ placeRoad || '도로명 주소 입력' }}</div>
              </div>
              <i class="fas fa-chevron-right text-gray-300"></i>
            </button>

            <div class="mb-3">
              <input
                v-model="placeDetail"
                id="place-detail"
                placeholder="상세주소 입력"
                class="w-full text-gray-700 text-base rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-orange-400 transition"
                autocomplete="off"
              />
              <p class="text-xs text-gray-500 mt-1">예: ○○빌딩 3층, ○○체육관 등</p>
            </div>

            <!-- 추천 장소 리스트 -->
            <div class="mt-6">
              <p class="text-sm font-medium text-gray-700 mb-2">추천 장소</p>
              <div class="flex flex-col gap-2">
                <button
                  v-for="(item, idx) in recommendedPlaces"
                  :key="idx"
                  type="button"
                  @click="onRecommendClick(item)"
                  class="flex flex-col text-left p-3 rounded-xl  bg-blue-50 hover:bg-orange-100 transition"
                >
                  <div class="text-base font-semibold text-blue-600">{{ item.placeDetail }}</div>
                  <div class="text-[0.7rem] text-gray-600 mt-0.5">{{ item.placeRoad }}</div>
                </button>
              </div>
            </div>
          </div>
          <div v-else class="text-gray-400 text-sm mt-4">미정으로 설정됨</div>
        </transition>
      </section>
    </div>

    <!-- 커스텀 confirm 모달 -->
    <div v-if="showConfirm" class="fixed inset-0 flex items-center justify-center bg-black p-5 bg-opacity-30 z-50">
      <div class="bg-white rounded-xl p-6 max-w-sm w-full shadow-lg">
        <p class="text-gray-800 text-lg mb-4">
          <strong class="text-orange-600">{{ confirmItem.placeDetail }}</strong><br>
          으로 하시겠습니까?
        </p>
        <div class="flex justify-end gap-3">
          <button @click="cancelConfirm" class="px-4 py-2 rounded-xl bg-gray-100 text-gray-600">취소</button>
          <button @click="acceptConfirm" class="px-4 py-2 rounded-xl bg-orange-500 text-white">확인</button>
        </div>
      </div>
    </div>

    <div class="fixed bottom-0 left-0 w-full bg-white p-5 shadow-xl flex gap-2">
      <button
        @click="emitBack"
        class="flex-1 py-4 text-lg font-bold rounded-xl border border-gray-200 bg-gray-100 text-gray-400"
      >이전</button>
      <button
        @click="submitPlace"
        class="flex-1 py-4 text-lg font-bold rounded-xl bg-orange-500 text-white transition disabled:opacity-60"
      >다음</button>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, defineEmits } from 'vue'
const emit = defineEmits(['select', 'back'])

const placeRoad = ref('')
const placeDetail = ref('')

const recommendedPlaces = ref([
  { placeRoad: '서울 서초구 동광로 65', placeDetail: '서초탁구장' },
  { placeRoad: '서울 동대문구 경희대로 26', placeDetail: '경희대 대운동장' },
  { placeRoad: '서울 송파구 잠실동 1-1', placeDetail: '잠실한강공원' },
])

const showConfirm = ref(false)
const confirmItem = ref({ placeRoad: '', placeDetail: '' })

function setUnset() {
  placeRoad.value = placeRoad.value === null ? '' : null
  placeDetail.value = ''
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
  emit('select', { placeRoad: placeRoad.value, placeDetail: placeDetail.value })
}

function emitBack() {
  placeRoad.value = null
  placeDetail.value = ''
  emit('back')
}

function onRecommendClick(item) {
  confirmItem.value = item
  showConfirm.value = true
}

function cancelConfirm() {
  showConfirm.value = false
}

function acceptConfirm() {
  placeRoad.value = confirmItem.value.placeRoad
  placeDetail.value = confirmItem.value.placeDetail
  showConfirm.value = false
  submitPlace()
}
</script>
