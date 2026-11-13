<template>
  <UiTopBar title="지도" back="/" />
  <main class="px-4 pt-4 pb-32 max-w-xl mx-auto">
    <!-- '끝난 경기' 탭은 뺐다: 열린 경기를 찾으러 온 사람에게 지난 경기 장소였고, 누구와 했는지도 보이지 않았다 (목적 판정 11/11 5번) -->

    <!-- 지도가 주인공: 화면 높이에 맞춰 크게 (예전 260px는 작았다, UX 리뷰 ⑦) -->
    <KakaoMap v-if="kakaoMapKey && center" :center="center" :pins="pins" :selected-id="selected" :level="6" height="min(64dvh, 620px)" @select="openPin" @moved="onMoved" />
    <p v-else-if="center" class="t-caption rounded-xl bg-surface px-4 py-3">지도가 아직 켜지지 않아 목록으로 보여 드려요</p>
    <!-- 동네를 못 불러온 것을 '동네를 먼저 인증해 주세요'로 보였다 -->
    <UiEmptyState v-else-if="checked && hoodFailed" icon="fas fa-rotate-right" title="동네를 불러오지 못했어요">
      <UiButton variant="secondary" @click="init">다시 시도</UiButton>
    </UiEmptyState>
    <UiEmptyState v-else-if="checked" mascot="kok" title="동네를 먼저 인증해 주세요">
      <UiButton to="/neighborhood">동네 고르기</UiButton>
    </UiEmptyState>

    <UiListSkeleton v-if="center && !data" :rows="3" class="mt-4" />
    <template v-else-if="data">
      <p class="t-micro mt-3">상대가 정해진 경기는 위치를 감춰요</p>
      <div v-if="group" class="flex items-center gap-2 mt-3">
        <p class="t-label flex-1 truncate">{{ group.name }} · {{ shown.length }}개</p>
        <UiChip icon="xmark" @click="selected = null">모두 보기</UiChip>
      </div>
      <!-- 못 불러온 것을 '근처에 없어요'로 보였다 -->
      <UiEmptyState v-if="loadFailed" class="mt-6" icon="fas fa-rotate-right" title="경기를 불러오지 못했어요">
        <UiButton variant="secondary" @click="load">다시 시도</UiButton>
      </UiEmptyState>
      <UiEmptyState v-else-if="!items.length" class="mt-6" mascot="match" title="이 근처에 모집 중인 경기가 없어요">
        <UiButton to="/create-game" variant="secondary">경기 만들기</UiButton>
      </UiEmptyState>
      <UiList v-else class="mt-3">
        <UiListItem
          v-for="p in shown"
          :key="(p.gameId ?? '') + p.placeName"
          icon="location-dot"
          :title="`${p.ruleTitle} · ${p.approx ? `${p.placeName} 근처` : p.placeName}`"
          :subtitle="subtitle(p)"
          chevron
          @click="openItem(p)"
        />
      </UiList>
    </template>
  </main>
</template>

<script setup>
// 지도 (안전·신뢰 G, 사용자 11/3 보류에서 꺼냄). 모집 중인 경기의 장소. 지도를 옮기면 그 가운데로 다시 묻는다 (폴링 없음)
// 같은 자리(같은 장소, 또는 장소를 안 정해 같은 동 가운데)의 경기는 핀 하나로 묶는다. 묶음 핀을 누르면 아래 목록을 그 자리로 거른다
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { GET } from '../../api/client'
import { matchTime } from '../../utils/format'
import { kakaoMapKey, kakaoMapLink } from '../../utils/kakaoMap'
import KakaoMap from '../../components/map/KakaoMap.vue'
import { UiButton, UiChip, UiEmptyState, UiList, UiListItem, UiListSkeleton, UiTopBar } from '../../components/ui'

const router = useRouter()
const center = ref(null)
const checked = ref(false)
const data = ref(null)
const selected = ref(null)

const items = computed(() => data.value?.recruiting || [])
const keyOf = (p) => `${p.lat.toFixed(5)},${p.lon.toFixed(5)}`
const groups = computed(() => {
  const m = new Map()
  items.value.forEach((p) => {
    const k = keyOf(p)
    if (!m.has(k)) m.set(k, { id: k, lat: p.lat, lon: p.lon, name: p.approx ? `${p.placeName} 근처` : p.placeName, approx: !!p.approx, items: [] })
    m.get(k).items.push(p)
  })
  return [...m.values()]
})
const pins = computed(() => groups.value.map((g) => {
  const one = g.items.length === 1 ? g.items[0] : null
  // 이름표는 짧게: 한 경기면 종목, 여럿이면 장소(동) 이름. 개수는 머리의 숫자로
  const label = one && !one.approx ? one.ruleTitle : g.approx ? `${g.items[0].placeName} 근처` : g.items[0].placeName
  const titles = [...new Set(g.items.map((x) => x.ruleTitle).filter(Boolean))]
  return {
    id: g.id, lat: g.lat, lon: g.lon, label,
    // 머리 아이콘: 종목이 하나면 그 종목, 섞였으면 점
    icon: titles.length === 1 ? { ruleTitle: titles[0] } : null,
    count: g.items.length,
    aria: `${g.name}, 모집 중 ${g.items.length}개`,
    tone: g.approx ? 'approx' : 'primary',
  }
}))
const group = computed(() => groups.value.find((g) => g.id === selected.value) || null)
const shown = computed(() => group.value?.items || items.value)

function subtitle(p) {
  return [matchTime(p.matchDate), `${p.hostNickname}님`, p.approx ? '장소는 상대와 정해요' : p.public && '공공장소'].filter(Boolean).join(' · ')
}

async function load() {
  if (!center.value) return
  try {
    data.value = (await GET('/api/map/games', { query: { lat: center.value.lat, lon: center.value.lon, radiusKm: 5 } })).data
    loadFailed.value = false
  } catch {
    data.value = data.value ?? { recruiting: [], finished: [] }
    loadFailed.value = true
  }
  if (selected.value && !group.value) selected.value = null
}

// 지도를 크게 옮겼을 때만 다시 묻는다 (1km 넘게)
let last = null
function onMoved(c) {
  if (last && Math.hypot((c.lat - last.lat) * 111, (c.lon - last.lon) * 88) < 1) return
  last = c
  center.value = c
}
watch(center, load)

function openItem(p) {
  if (p.gameId) router.push(`/games/${p.gameId}`)
  else window.open(kakaoMapLink(p.placeName, p.lat, p.lon), '_blank', 'noopener')
}
// 핀: 하나면 바로 그 경기를 연다. 여럿이면 목록을 그 자리로 거른다 (한 번 더 누르면 풀린다)
function openPin(pin) {
  const g = groups.value.find((x) => x.id === pin.id)
  if (!g) return
  if (g.items.length === 1) return openItem(g.items[0])
  selected.value = selected.value === g.id ? null : g.id
}

const loadFailed = ref(false)
const hoodFailed = ref(false)
async function init() {
  hoodFailed.value = false
  let mine = null
  try {
    mine = (await GET('/api/neighborhoods/me')).data
  } catch {
    hoodFailed.value = true
  }
  const n = mine?.neighborhoods?.find((x) => x.active)
  if (n?.lat) { center.value = { lat: n.lat, lon: n.lon }; last = center.value }
  checked.value = true
}
onMounted(init)
</script>
