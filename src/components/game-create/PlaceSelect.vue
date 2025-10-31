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
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                <i class="fas fa-search mr-1 text-orange-500"></i>
                장소 검색
              </label>
              <div class="relative">
                <input
                  ref="addressInput"
                  v-model="searchQuery"
                  placeholder="장소명 또는 주소 입력 (예: 서초탁구장)"
                  class="w-full text-base px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-400 outline-none transition"
                  autocomplete="off"
                />
                <i v-if="!searchQuery" class="fas fa-location-dot absolute right-4 top-1/2 -translate-y-1/2 text-gray-300"></i>
              </div>
              <p class="text-xs text-gray-400 mt-2">
                <i class="fas fa-lightbulb text-yellow-500 mr-1"></i>
                장소명이나 주소를 입력하면 자동으로 검색됩니다.
              </p>
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                <i class="fas fa-map-pin mr-1 text-orange-500"></i>
                상세 장소 (선택)
              </label>
              <input
                v-model="detailedPlace"
                placeholder="상세 장소를 입력하세요 (예: 3층, A코트)"
                class="w-full text-base px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-400 outline-none transition"
                autocomplete="off"
              />
              <p class="text-xs text-gray-400 mt-2">
                <i class="fas fa-info-circle text-blue-400 mr-1"></i>
                추가 정보를 입력하면 장소에 함께 표시됩니다
              </p>
            </div>

            <div v-if="selectedPlace" class="mb-4 p-4 bg-orange-50 rounded-xl border border-orange-200">
              <div class="flex items-start gap-3">
                <i class="fas fa-map-marker-alt text-orange-500 mt-1"></i>
                <div class="flex-1 min-w-0">
                  <p class="font-semibold text-gray-800 mb-1">{{ selectedPlace.name }}</p>
                  <p class="text-sm text-gray-600">{{ selectedPlace.address }}</p>
                </div>
                <button
                  @click="clearSelection"
                  class="text-gray-400 hover:text-gray-600 transition"
                >
                  <i class="fas fa-times"></i>
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

    <!-- 주소 오류 모달 -->
    <div
      v-if="showAddressErrorModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
    >
      <div class="bg-white p-6 m-5 rounded-2xl w-full max-w-sm shadow-2xl">
        <div class="text-center mb-4">
          <i class="fas fa-exclamation-triangle text-orange-500 text-4xl mb-3"></i>
          <h3 class="text-lg font-bold text-gray-900 mb-2">선택하신 곳의 주소가 정확하지 않습니다.</h3>
          <p class="text-sm text-gray-600">
            다른 장소를 선택하신 후 추가 정보를 입력해주세요.<br />
            <span class="text-xs text-gray-500 mt-2 block">예: 서초탁구장, 강남체육관</span>
          </p>
        </div>
        <button
          @click="showAddressErrorModal = false"
          class="w-full bg-orange-500 text-white font-semibold py-3 rounded-xl hover:bg-orange-600 transition shadow"
        >
          확인
        </button>
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
import { ref, onMounted, defineEmits } from 'vue'
import { parseRegion } from '../../utils/regionParser'
const emit = defineEmits(['select', 'back'])

const placeRoad = ref('')
const searchQuery = ref('')
const selectedPlace = ref(null)
const detailedPlace = ref('')
const addressInput = ref(null)


const showConfirm = ref(false)
const confirmItem = ref({ placeRoad: '', placeDetail: '' })
const showAddressErrorModal = ref(false)

let autocomplete = null

function setUnset() {
  placeRoad.value = placeRoad.value === null ? '' : null
  searchQuery.value = ''
  selectedPlace.value = null
  detailedPlace.value = ''
}

function clearSelection() {
  selectedPlace.value = null
  searchQuery.value = ''
  detailedPlace.value = ''
}

onMounted(() => {
  if (window.google?.maps?.places && addressInput.value) {
    autocomplete = new window.google.maps.places.Autocomplete(addressInput.value, {
      componentRestrictions: { country: 'kr' },
      fields: ['formatted_address', 'address_components', 'geometry', 'name'],
      types: ['establishment', 'geocode']
    })

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      if (place.geometry && place.formatted_address) {
        // 주소 파싱 및 검증
        const parsed = parseRegion(place.formatted_address)

        if (!parsed) {
          showAddressErrorModal.value = true
          searchQuery.value = ''
          selectedPlace.value = null
          return
        }

        selectedPlace.value = {
          name: place.name || '',
          address: parsed.fullAddress, // "경기 수원시 영통구 ..." 형태
          region1: parsed.region1, // "경기" (변환됨)
          region2: parsed.region2, // "수원시 영통구"
          geometry: place.geometry
        }
      }
    })
  }
})

function submitPlace() {
  if (placeRoad.value === null) {
    emit('select', { placeRoad: null, placeDetail: '' })
  } else if (selectedPlace.value) {
    // Google API 장소 이름과 상세 장소를 공백으로 합침
    const combinedPlaceDetail = detailedPlace.value
      ? `${selectedPlace.value.name} ${detailedPlace.value}`
      : selectedPlace.value.name

    emit('select', {
      placeRoad: selectedPlace.value.address,
      placeDetail: combinedPlaceDetail
    })
  }
}

function emitBack() {
  placeRoad.value = null
  searchQuery.value = ''
  selectedPlace.value = null
  detailedPlace.value = ''
  emit('back')
}


function cancelConfirm() {
  showConfirm.value = false
}

function acceptConfirm() {
  selectedPlace.value = {
    name: confirmItem.value.placeDetail,
    address: confirmItem.value.placeRoad
  }
  showConfirm.value = false
  submitPlace()
}
</script>
