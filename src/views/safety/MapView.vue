<template>
  <UiTopBar title="지도" back="/" />
  <main class="px-4 pt-4 pb-32 max-w-xl mx-auto">
    <UiTabs v-model="tab" :options="TABS" class="mb-3" />

    <KakaoMap v-if="kakaoMapKey && center" :center="center" :pins="pins" :selected-id="selected" :level="7" @select="openPin" @moved="onMoved" />
    <p v-else-if="center" class="t-caption rounded-xl bg-surface px-4 py-3">지도가 아직 켜지지 않아 목록으로 보여 드려요</p>
    <UiEmptyState v-else-if="checked" mascot="kok" title="동네를 먼저 인증해 주세요">
      <UiButton to="/neighborhood">동네 인증하기</UiButton>
    </UiEmptyState>

    <UiListSkeleton v-if="center && !data" :rows="3" class="mt-4" />
    <template v-else-if="data">
      <p class="t-micro mt-3">{{ tab === 'open' ? '모집 중인 경기만 보여요. 장소를 아직 안 정한 경기는 동네 가운데(점선)에 있어요. 상대가 정해진 경기의 위치는 안전을 위해 보이지 않아요' : '최근 90일 동안 공공장소에서 끝난 경기를 장소마다 모았어요. 누가 했는지는 보이지 않아요' }}</p>
      <div v-if="group" class="flex items-center gap-2 mt-3">
        <p class="t-label flex-1 truncate">{{ group.name }} · {{ shown.length }}개</p>
        <UiChip icon="xmark" @click="selected = null">전체 보기</UiChip>
      </div>
      <UiEmptyState v-if="!items.length" class="mt-6" mascot="match" :title="tab === 'open' ? '이 근처에 모집 중인 경기가 없어요' : '이 근처에서 끝난 경기가 없어요'">
        <UiButton v-if="tab === 'open'" to="/create-game" variant="secondary">경기 열기</UiButton>
      </UiEmptyState>
      <UiList v-else class="mt-3">
        <UiListItem
          v-for="p in shown"
          :key="(p.gameId ?? '') + p.placeName"
          icon="location-dot"
          :title="tab === 'open' ? `${p.ruleTitle} · ${p.approx ? `${p.placeName} 근처` : p.placeName}` : p.placeName"
          :subtitle="subtitle(p)"
          chevron
          @click="openItem(p)"
        />
      </UiList>
    </template>
  </main>
</template>

<script setup>
// 지도 (안전·신뢰 G, 사용자 11/3 보류에서 꺼냄). 모집 중인 경기와 끝난 경기의 장소. 지도를 옮기면 그 가운데로 다시 묻는다 (폴링 없음)
// 같은 자리(같은 장소, 또는 장소를 안 정해 같은 동 가운데)의 경기는 핀 하나로 묶는다. 묶음 핀을 누르면 아래 목록을 그 자리로 거른다
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { GET } from '../../api/client'
import { matchTime } from '../../utils/format'
import { kakaoMapKey, kakaoMapLink } from '../../utils/kakaoMap'
import KakaoMap from '../../components/map/KakaoMap.vue'
import { UiButton, UiChip, UiEmptyState, UiList, UiListItem, UiListSkeleton, UiTabs, UiTopBar } from '../../components/ui'

const router = useRouter()
const TABS = [{ value: 'open', label: '모집 중' }, { value: 'done', label: '끝난 경기' }]
const tab = ref('open')
const center = ref(null)
const checked = ref(false)
const data = ref(null)
const selected = ref(null)

const items = computed(() => (tab.value === 'open' ? data.value?.recruiting : data.value?.finished) || [])
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
  const label = tab.value === 'done'
    ? `${g.items[0].placeName} ${g.items[0].count}`
    : one && !one.approx ? one.ruleTitle : `${g.items[0].placeName} ${g.items.length}`
  return {
    id: g.id, lat: g.lat, lon: g.lon, label,
    aria: tab.value === 'done' ? `${g.name}, 경기 ${g.items[0].count}번` : `${g.name}, 모집 중 ${g.items.length}개`,
    tone: tab.value === 'done' ? 'muted' : g.approx ? 'approx' : 'primary',
  }
}))
const group = computed(() => groups.value.find((g) => g.id === selected.value) || null)
const shown = computed(() => group.value?.items || items.value)

function subtitle(p) {
  if (tab.value === 'done') return `경기 ${p.count}번${p.ruleTitle ? ` · 주로 ${p.ruleTitle}` : ''}`
  return [matchTime(p.matchDate), `${p.hostNickname}님`, p.approx ? '장소는 상대와 정해요' : p.public && '공공장소'].filter(Boolean).join(' · ')
}

async function load() {
  if (!center.value) return
  data.value = (await GET('/api/map/games', { query: { lat: center.value.lat, lon: center.value.lon, radiusKm: 5 } }).catch(() => ({ data: { recruiting: [], finished: [] } }))).data
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
watch(tab, () => { selected.value = null })

function openItem(p) {
  if (p.gameId) router.push(`/games/${p.gameId}`)
  else window.open(kakaoMapLink(p.placeName, p.lat, p.lon), '_blank', 'noopener')
}
// 핀: 하나면 바로 연다 (모집 중은 그 경기, 끝난 경기는 카카오맵의 그 장소). 여럿이면 목록을 그 자리로 거른다 (한 번 더 누르면 풀린다)
function openPin(pin) {
  const g = groups.value.find((x) => x.id === pin.id)
  if (!g) return
  if (g.items.length === 1) return openItem(g.items[0])
  selected.value = selected.value === g.id ? null : g.id
}

onMounted(async () => {
  const mine = (await GET('/api/neighborhoods/me').catch(() => ({ data: null }))).data
  const n = mine?.neighborhoods?.find((x) => x.active)
  if (n?.lat) { center.value = { lat: n.lat, lon: n.lon }; last = center.value }
  checked.value = true
})
</script>
