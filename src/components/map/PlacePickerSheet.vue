<template>
  <UiSheet :model-value="modelValue" title="공공장소 찾기" @update:model-value="(v) => emit('update:modelValue', v)">
    <p class="t-caption mb-3">처음 만나는 경기는 체육관·공원·탁구장처럼 사람이 오가는 곳에서 해요. 집·숙소는 고를 수 없어요</p>
    <form class="flex gap-2" @submit.prevent="search">
      <UiInput v-model="q" class="flex-1" placeholder="예: 망원 탁구장, 체육공원" enterkeyhint="search" />
      <UiButton type="submit" :loading="busy" :disabled="!q.trim()">찾기</UiButton>
    </form>
    <KakaoMap v-if="kakaoMapKey && results.length" class="mt-3" :center="{ lat: results[0].lat, lon: results[0].lon }" :pins="pins" :level="5" height="200px" fit @select="(p) => pick(results.find((r) => r.kakaoId === p.id))" />
    <p v-if="error" class="t-caption text-danger-fg mt-3">{{ error }}</p>
    <UiList v-if="results.length" class="mt-3">
      <UiListItem
        v-for="r in results"
        :key="r.kakaoId"
        :icon="r.public ? 'location-dot' : 'circle-xmark'"
        :title="r.name"
        :subtitle="`${r.public ? '' : '고를 수 없어요 · '}${shortCategory(r.category)} · ${r.roadAddress || r.address}${r.distanceM != null ? ` · ${km(r.distanceM)}` : ''}`"
        :disabled="!r.public"
        @click="r.public && pick(r)"
      />
    </UiList>
  </UiSheet>
</template>

<script setup>
// 장소 고르기 (안전·신뢰 G). 카카오 장소 검색(서버가 대신 부른다)에서 공공장소만 고른다. 서버가 고른 곳을 다시 찾아 확인한다
import { computed, ref, defineProps, defineEmits } from 'vue'
import { UiButton, UiInput, UiList, UiListItem, UiSheet } from '../ui'
import { GET } from '../../api/client'
import KakaoMap from './KakaoMap.vue'
import { kakaoMapKey } from '../../utils/kakaoMap'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /** 가까운 순으로 찾을 기준 (내 동네 가운데) */
  near: { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue', 'picked'])
const q = ref('')
const busy = ref(false)
const error = ref('')
const results = ref([])
const pins = computed(() => results.value.filter((r) => r.public).map((r) => ({ id: r.kakaoId, lat: r.lat, lon: r.lon, label: r.name })))
const shortCategory = (c) => (c || '').split('>').pop().trim()
const km = (m) => (m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`)

async function search() {
  busy.value = true
  error.value = ''
  try {
    results.value = (await GET('/api/places/search', { query: { q: q.value.trim(), lat: props.near?.lat, lon: props.near?.lon } })).data
    if (!results.value.length) error.value = '찾은 곳이 없어요. 다른 이름으로 찾아보세요'
  } catch (e) {
    error.value = e?.response?.data?.message || '찾지 못했어요'
  } finally {
    busy.value = false
  }
}
function pick(r) {
  if (!r?.public) return
  emit('picked', r)
  emit('update:modelValue', false)
}
</script>
