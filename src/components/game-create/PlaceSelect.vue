<template>
  <div class="flex flex-col min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 px-5 pt-10">
    <div class="max-w-lg mx-auto w-full">
      <section class="rounded-2xl shadow-2xl bg-gray-800 p-6 mt-16 mb-4 border border-gray-700">
        <div class="mb-4">
          <span class="text-xl font-bold text-white block mb-3">경기 장소</span>
          <button
            type="button"
            @click="setUnset"
            :class="placeRoad === null
              ? 'bg-orange-500 text-white border-orange-400 shadow-lg'
              : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'"
            class="w-full py-3 text-sm font-semibold rounded-xl border transition-all duration-200 active:scale-98"
          >
            <i class="fas fa-question-circle mr-2"></i>
            {{ placeRoad === null ? '장소 미정으로 설정됨' : '장소 미정으로 변경' }}
          </button>
        </div>

        <transition name="fade">
          <div v-if="placeRoad !== null">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-300 mb-2">
                <i class="fas fa-search mr-1 text-orange-400"></i>
                장소 검색
              </label>
              <div class="relative">
                <input
                  ref="addressInput"
                  v-model="searchQuery"
                  placeholder="장소명 또는 주소 입력 (예: 서초탁구장)"
                  class="w-full text-base px-4 py-3 rounded-xl border-2 border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:border-orange-400 outline-none transition"
                  autocomplete="off"
                />
                <i v-if="!searchQuery" class="fas fa-location-dot absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"></i>
              </div>
              <p class="text-xs text-gray-500 mt-2">
                <i class="fas fa-lightbulb text-yellow-400 mr-1"></i>
                장소명이나 주소를 입력하면 자동으로 검색됩니다.
              </p>
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-300 mb-2">
                <i class="fas fa-map-pin mr-1 text-orange-400"></i>
                상세 장소 (선택)
              </label>
              <input
                v-model="detailedPlace"
                placeholder="상세 장소를 입력하세요 (예: 3층, A코트)"
                class="w-full text-base px-4 py-3 rounded-xl border-2 border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:border-orange-400 outline-none transition"
                autocomplete="off"
              />
              <p class="text-xs text-gray-500 mt-2">
                <i class="fas fa-info-circle text-blue-400 mr-1"></i>
                추가 정보를 입력하면 장소에 함께 표시됩니다
              </p>
            </div>

            <div v-if="selectedPlace" class="mb-4 p-4 bg-gray-700 rounded-xl border border-gray-600">
              <div class="flex items-start gap-3">
                <i class="fas fa-map-marker-alt text-orange-400 mt-1"></i>
                <div class="flex-1 min-w-0">
                  <p class="font-semibold text-white mb-1">{{ selectedPlace.name }}</p>
                  <p class="text-sm text-gray-300">{{ selectedPlace.address }}</p>
                </div>
                <button
                  @click="clearSelection"
                  class="text-gray-400 hover:text-gray-200 transition"
                >
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>

          </div>
          <div v-else class="mb-4">
            <label class="block text-sm font-medium text-gray-300 mb-2">
              <i class="fas fa-heart mr-1 text-orange-400"></i>
              선호 장소 (선택)
            </label>
            <div class="relative">
              <input
                ref="preferredPlaceInput"
                v-model="preferredSearchQuery"
                placeholder="선호하는 경기 장소를 검색하세요 (예: 서초탁구장)"
                class="w-full text-base px-4 py-3 rounded-xl border-2 border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:border-orange-400 outline-none transition"
                autocomplete="off"
              />
              <i v-if="!preferredSearchQuery" class="fas fa-location-dot absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"></i>
            </div>
            <p class="text-xs text-gray-500 mt-2">
              <i class="fas fa-info-circle text-blue-400 mr-1"></i>
              입력하신 선호 장소는 경기 생성 시 "A 장소 선호, 협의 가능" 형태로 표시됩니다
            </p>

            <div v-if="selectedPreferredPlace" class="mt-3 p-4 bg-gray-700 rounded-xl border border-gray-600">
              <div class="flex items-start gap-3">
                <i class="fas fa-map-marker-alt text-orange-400 mt-1"></i>
                <div class="flex-1 min-w-0">
                  <p class="font-semibold text-white mb-1">{{ selectedPreferredPlace.name }}</p>
                  <p class="text-sm text-gray-300">{{ selectedPreferredPlace.address }}</p>
                </div>
                <button
                  @click="clearPreferredSelection"
                  class="text-gray-400 hover:text-gray-200 transition"
                >
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>
        </transition>
      </section>
    </div>

    <!-- 커스텀 confirm 모달 -->
    <div v-if="showConfirm" class="fixed inset-0 flex items-center justify-center bg-black p-5 bg-opacity-60 z-50">
      <div class="bg-gray-800 rounded-xl p-6 max-w-sm w-full shadow-2xl border border-gray-700">
        <p class="text-gray-200 text-lg mb-4">
          <strong class="text-orange-400">{{ confirmItem.placeDetail }}</strong><br>
          으로 하시겠습니까?
        </p>
        <div class="flex justify-end gap-3">
          <button @click="cancelConfirm" class="px-4 py-2 rounded-xl bg-gray-700 text-gray-300 hover:bg-gray-600 transition">취소</button>
          <button @click="acceptConfirm" class="px-4 py-2 rounded-xl bg-orange-500 text-white hover:bg-orange-600 transition">확인</button>
        </div>
      </div>
    </div>

    <!-- 주소 오류 모달 -->
    <div
      v-if="showAddressErrorModal"
      class="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50"
    >
      <div class="bg-gray-800 p-6 m-5 rounded-2xl w-full max-w-sm shadow-2xl border border-gray-700">
        <div class="text-center mb-4">
          <i class="fas fa-exclamation-triangle text-orange-400 text-4xl mb-3"></i>
          <h3 class="text-lg font-bold text-white mb-2">선택하신 곳의 주소가 정확하지 않습니다.</h3>
          <p class="text-sm text-gray-300">
            다른 장소를 선택하신 후 추가 정보를 입력해주세요.<br />
            <span class="text-xs text-gray-400 mt-2 block">예: 서초탁구장, 강남체육관</span>
          </p>
        </div>
        <button
          @click="showAddressErrorModal = false"
          class="w-full bg-orange-500 text-white font-semibold py-3 rounded-xl hover:bg-orange-600 transition shadow-lg"
        >
          확인
        </button>
      </div>
    </div>

    <div class="fixed bottom-0 left-0 w-full bg-gray-800 p-5 shadow-2xl flex gap-3 border-t border-gray-700">
      <button
        @click="emitBack"
        class="flex-1 py-4 text-lg font-bold rounded-xl border border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600 active:scale-98 transition-all duration-200"
      >이전</button>
      <button
        @click="submitPlace"
        class="flex-1 py-4 text-lg font-bold rounded-xl bg-orange-500 text-white hover:bg-orange-600 active:scale-98 transition-all duration-200 disabled:opacity-60 shadow-lg"
      >다음</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, defineEmits, watch } from 'vue'
import { parseRegion } from '../../utils/regionParser'
const emit = defineEmits(['select', 'back'])

const placeRoad = ref('')
const searchQuery = ref('')
const selectedPlace = ref(null)
const detailedPlace = ref('')
const preferredSearchQuery = ref('')
const selectedPreferredPlace = ref(null)
const addressInput = ref(null)
const preferredPlaceInput = ref(null)


const showConfirm = ref(false)
const confirmItem = ref({ placeRoad: '', placeDetail: '' })
const showAddressErrorModal = ref(false)

let autocomplete = null
let preferredAutocomplete = null

function setUnset() {
  placeRoad.value = placeRoad.value === null ? '' : null
  searchQuery.value = ''
  selectedPlace.value = null
  detailedPlace.value = ''
  preferredSearchQuery.value = ''
  selectedPreferredPlace.value = null
}

function clearSelection() {
  selectedPlace.value = null
  searchQuery.value = ''
  detailedPlace.value = ''
}

function clearPreferredSelection() {
  selectedPreferredPlace.value = null
  preferredSearchQuery.value = ''
}

function initializePreferredAutocomplete() {
  if (window.google?.maps?.places && preferredPlaceInput.value && !preferredAutocomplete) {
    preferredAutocomplete = new window.google.maps.places.Autocomplete(preferredPlaceInput.value, {
      componentRestrictions: { country: 'kr' },
      fields: ['formatted_address', 'address_components', 'geometry', 'name'],
      types: ['establishment', 'geocode']
    })

    preferredAutocomplete.addListener('place_changed', () => {
      const place = preferredAutocomplete.getPlace()
      if (place.geometry && place.formatted_address) {
        // 주소 파싱 및 검증
        const parsed = parseRegion(place.formatted_address)

        if (!parsed) {
          showAddressErrorModal.value = true
          preferredSearchQuery.value = ''
          selectedPreferredPlace.value = null
          return
        }

        selectedPreferredPlace.value = {
          name: place.name || '',
          address: parsed.fullAddress,
          region1: parsed.region1,
          region2: parsed.region2,
          geometry: place.geometry
        }
      }
    })
  }
}

onMounted(() => {
  if (window.google?.maps?.places) {
    // 일반 장소 검색 (장소 미정이 아닐 때)
    if (addressInput.value) {
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
  }
})

// 선호 장소 입력에 대한 Google API autocomplete 설정
watch(() => placeRoad.value, (newValue) => {
  if (newValue === null) {
    // 장소 미정일 때 선호 장소 입력 필드에 autocomplete 설정
    setTimeout(() => {
      initializePreferredAutocomplete()
    }, 100)
  } else {
    // 일반 장소 선택으로 돌아갈 때 선호 장소 autocomplete 정리
    if (preferredAutocomplete) {
      window.google?.maps?.event?.clearInstanceListeners(preferredPlaceInput.value)
      preferredAutocomplete = null
    }
  }
})

function submitPlace() {
  if (placeRoad.value === null) {
    // 장소 미정인 경우: 선호 장소가 있으면 끝에 " 선호, 협의 가능" 추가
    if (selectedPreferredPlace.value) {
      // 선호 장소가 선택된 경우: placeRoad와 placeDetail 모두 전송
      emit('select', {
        placeRoad: selectedPreferredPlace.value.address,
        placeDetail: `${selectedPreferredPlace.value.name} 선호, 협의 가능`
      })
    } else {
      // 선호 장소가 없는 경우: placeRoad는 null, placeDetail만 전송
      emit('select', { placeRoad: null, placeDetail: '협의 가능' })
    }
  } else if (selectedPlace.value) {
    // 일반 장소 선택인 경우: Google API 장소 이름과 상세 장소를 공백으로 합침
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
  preferredSearchQuery.value = ''
  selectedPreferredPlace.value = null
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
