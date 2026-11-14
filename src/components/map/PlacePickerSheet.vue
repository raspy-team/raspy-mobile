<template>
  <UiSheet :model-value="modelValue" title="장소 고르기" @update:model-value="(v) => emit('update:modelValue', v)">
    <!-- 지도가 먼저다 (11/14 고병연: 글자를 치고 찾는 창이 아니라 지도에서 고르는 창).
         열면 내 동네 둘레의 곳이 핀으로 떠 있고, 종류를 누르거나 지도를 옮겨 다시 찾는다. 이름으로 찾기는 맨 아래 -->
    <div class="min-w-0 overflow-x-hidden">
      <div v-if="kakaoMapKey" class="relative">
        <KakaoMap :center="center" :pins="pins" :level="5" height="300px" fit :selected-id="picked?.kakaoId ?? null" @select="(p) => select(results.find((r) => r.kakaoId === p.id))" @moved="onMoved" />
        <div v-if="movedAway && !busy" class="absolute top-3 left-1/2 -translate-x-1/2 shadow-lg rounded-xl"><UiButton size="sm" @click="search(keyword, mapCenter)">이 지역에서 다시 찾기</UiButton></div>
      </div>
      <!-- 무엇을 찾나: 이 경기의 종목이 맨 앞 -->
      <div class="flex flex-wrap gap-2 mt-3">
        <UiChip v-for="k in KINDS" :key="k" :selected="keyword === k" @click="search(k)">{{ k }}</UiChip>
      </div>
      <p v-if="error" class="t-caption text-danger-fg mt-3">{{ error }}</p>
      <p v-else-if="busy && !results.length" class="t-caption mt-3">가까운 곳을 찾는 중</p>
      <UiList v-if="results.length" class="mt-3">
        <UiListItem
          v-for="r in results"
          :key="r.kakaoId"
          :icon="picked?.kakaoId === r.kakaoId ? 'circle-check' : 'location-dot'"
          :title="r.name"
          :subtitle="[shortCategory(r.category), r.distanceM != null ? km(r.distanceM) : '', r.roadAddress || r.address].filter(Boolean).join(' · ')"
          @click="select(r)"
        />
      </UiList>
      <form class="flex gap-2 mt-4 min-w-0" @submit.prevent="search(q.trim())">
        <UiInput v-model="q" class="flex-1 min-w-0" placeholder="이름으로 찾기 (예: 망원 탁구장)" enterkeyhint="search" />
        <UiButton type="submit" variant="secondary" :loading="busy && keyword === q.trim()" :disabled="!q.trim()">찾기</UiButton>
      </form>
    </div>
    <template #footer>
      <UiButton block size="lg" :disabled="!picked" @click="confirm">{{ picked ? `${picked.name} 고르기` : '지도나 목록에서 한 곳을 골라 주세요' }}</UiButton>
    </template>
  </UiSheet>
</template>

<script setup>
// 장소 고르기. 카카오 장소 검색(서버가 대신 부른다)에서 고른다. 서버가 고른 곳을 다시 찾아 확인한다.
// 11/14: '처음 만나는 상대는 공공장소만'을 뺐다(고병연). 지도에서 고르는 것이 필수가 되면서 이름 있는 곳만 남고, 아파트 단지 코트 같은 곳이 막혔었다
import { computed, ref, watch, defineProps, defineEmits } from 'vue'
import { UiButton, UiChip, UiInput, UiList, UiListItem, UiSheet } from '../ui'
import { GET } from '../../api/client'
import KakaoMap from './KakaoMap.vue'
import { kakaoMapKey } from '../../utils/kakaoMap'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /** 가까운 순으로 찾을 기준 (내 동네 가운데) */
  near: { type: Object, default: null },
  /** 이 경기의 규칙 이름: 종목에 맞는 곳을 먼저 찾는다 (풋살 → 풋살장) */
  ruleTitle: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue', 'picked'])

// 종목 낱말 → 찾을 곳. 규칙 이름에 든 첫 낱말을 쓴다
const VENUE = { 풋살: '풋살장', 축구: '축구장', 농구: '농구장', 탁구: '탁구장', 배드민턴: '배드민턴장', 테니스: '테니스장', 스쿼시: '스쿼시장', 볼링: '볼링장', 당구: '당구장', 포켓볼: '당구장',
  족구: '족구장', 골프: '스크린골프', 클라이밍: '클라이밍', 수영: '수영장', 복싱: '복싱장', 달리기: '공원', 러닝: '공원', 턱걸이: '공원', 보드게임: '보드게임카페', 바둑: '기원' }
const hint = computed(() => { const k = Object.keys(VENUE).find((w) => props.ruleTitle.includes(w)); return k ? VENUE[k] : '' })
const KINDS = computed(() => [...new Set([hint.value, '체육관', '공원', '운동장', '카페'].filter(Boolean))])

const SEOUL = { lat: 37.5665, lon: 126.978 }
const center = computed(() => props.near || SEOUL)
const q = ref('')
const keyword = ref('')
const busy = ref(false)
const error = ref('')
const results = ref([])
const picked = ref(null)
const pins = computed(() => results.value.map((r) => ({ id: r.kakaoId, lat: r.lat, lon: r.lon, label: r.name })))
const shortCategory = (c) => (c || '').split('>').pop().trim()
const km = (m) => (m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`)

// 지도를 옮겼나: 마지막으로 찾은 자리에서 300m 넘게 벗어나면 '이 지역에서 다시 찾기'
const mapCenter = ref(null)
const searchedAt = ref(null)
const far = (a, b) => !!a && !!b && Math.hypot((a.lat - b.lat) * 111_000, (a.lon - b.lon) * 88_000) > 300
const movedAway = computed(() => !!keyword.value && far(mapCenter.value, searchedAt.value))
let settle = 0 // 찾은 직후 지도가 핀에 맞춰 스스로 움직인다: 그 움직임은 '옮김'으로 치지 않는다
function onMoved(c) {
  mapCenter.value = c
  if (Date.now() < settle) searchedAt.value = c
}

async function search(word, at = null) {
  if (!word) return
  const from = at || mapCenter.value || center.value
  keyword.value = word
  busy.value = true
  error.value = ''
  try {
    results.value = (await GET('/api/places/search', { query: { q: word, lat: from.lat, lon: from.lon } })).data
    if (!results.value.some((r) => r.kakaoId === picked.value?.kakaoId)) picked.value = null
    if (!results.value.length) error.value = '가까이에 찾은 곳이 없어요. 지도를 옮기거나 다른 종류를 눌러 보세요'
    settle = Date.now() + 1500
    searchedAt.value = from
  } catch (e) {
    error.value = e?.response?.data?.message || '찾지 못했어요'
  } finally {
    busy.value = false
  }
}
function select(r) {
  if (r) picked.value = r
}
function confirm() {
  if (!picked.value) return
  emit('picked', picked.value)
  emit('update:modelValue', false)
}
// 열릴 때 종목에 맞는 곳(없으면 체육관)을 바로 찾아 둔다: 빈 지도와 빈 입력칸으로 시작하지 않는다
watch(() => props.modelValue, (open) => { if (open && !results.value.length) search(KINDS.value[0]) })
</script>
