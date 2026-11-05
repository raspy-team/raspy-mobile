<template>
  <UiTopBar title="지도" back="/" />
  <main class="px-4 pt-4 pb-32 max-w-xl mx-auto">
    <UiTabs v-model="tab" :options="TABS" class="mb-3" />

    <KakaoMap v-if="kakaoMapKey && center" :center="center" :pins="pins" @select="openPin" @moved="onMoved" />
    <p v-else-if="center" class="t-caption rounded-xl bg-surface px-4 py-3">지도가 아직 켜지지 않아 목록으로 보여 드려요</p>
    <UiEmptyState v-else mascot="kok" title="동네를 먼저 인증해 주세요" description="내 동네 가까운 곳의 경기를 지도에서 보여 드려요">
      <UiButton to="/neighborhood">동네 인증하기</UiButton>
    </UiEmptyState>

    <UiListSkeleton v-if="center && !data" :rows="3" class="mt-4" />
    <template v-else-if="data">
      <p class="t-micro mt-3">{{ tab === 'open' ? '모집 중인 경기만 보여요. 상대가 정해진 경기의 위치는 안전을 위해 보이지 않아요' : '최근 90일 동안 끝난 경기를 장소마다 모았어요. 누가 했는지는 보이지 않아요' }}</p>
      <UiEmptyState v-if="!items.length" class="mt-6" mascot="match" :title="tab === 'open' ? '이 근처에 모집 중인 경기가 없어요' : '이 근처에서 끝난 경기가 없어요'" description="지도를 옮기면 그 근처를 다시 찾아요" />
      <UiList v-else class="mt-3">
        <UiListItem
          v-for="p in items"
          :key="(p.gameId ?? '') + p.placeName"
          icon="location-dot"
          :title="tab === 'open' ? `${p.ruleTitle} · ${p.placeName}` : p.placeName"
          :subtitle="tab === 'open' ? `${matchTime(p.matchDate)} · ${p.hostNickname}님${p.public ? ' · 공공장소' : ''}` : `경기 ${p.count}번${p.ruleTitle ? ` · 주로 ${p.ruleTitle}` : ''}`"
          chevron
          @click="openPin({ id: p.gameId ?? p.placeName, ...p })"
        />
      </UiList>
    </template>
  </main>
</template>

<script setup>
// 지도 (안전·신뢰 G, 사용자 11/3 보류에서 꺼냄). 모집 중인 경기와 끝난 경기의 장소. 지도를 옮기면 그 가운데로 다시 묻는다 (폴링 없음)
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { GET } from '../../api/client'
import { matchTime } from '../../utils/format'
import { kakaoMapKey, kakaoMapLink } from '../../utils/kakaoMap'
import KakaoMap from '../../components/map/KakaoMap.vue'
import { UiButton, UiEmptyState, UiList, UiListItem, UiListSkeleton, UiTabs, UiTopBar } from '../../components/ui'

const router = useRouter()
const TABS = [{ value: 'open', label: '모집 중' }, { value: 'done', label: '끝난 경기' }]
const tab = ref('open')
const center = ref(null)
const data = ref(null)

const items = computed(() => (tab.value === 'open' ? data.value?.recruiting : data.value?.finished) || [])
const pins = computed(() => items.value.map((p) => ({
  id: p.gameId ?? p.placeName, lat: p.lat, lon: p.lon,
  label: tab.value === 'open' ? p.ruleTitle : `${p.placeName} ${p.count}`, tone: tab.value === 'open' ? 'primary' : 'muted', ...p,
})))

async function load() {
  if (!center.value) return
  data.value = (await GET('/api/map/games', { query: { lat: center.value.lat, lon: center.value.lon, radiusKm: 5 } }).catch(() => ({ data: { recruiting: [], finished: [] } }))).data
}

// 지도를 크게 옮겼을 때만 다시 묻는다 (1km 넘게)
let last = null
function onMoved(c) {
  if (last && Math.hypot((c.lat - last.lat) * 111, (c.lon - last.lon) * 88) < 1) return
  last = c
  center.value = c
}
watch(center, load)

function openPin(p) {
  if (p.gameId) router.push(`/games/${p.gameId}`)
  else window.open(kakaoMapLink(p.placeName, p.lat, p.lon), '_blank', 'noopener')
}

onMounted(async () => {
  const mine = (await GET('/api/neighborhoods/me').catch(() => ({ data: null }))).data
  const n = mine?.neighborhoods?.find((x) => x.active)
  if (n?.lat) { center.value = { lat: n.lat, lon: n.lon }; last = center.value }
})
</script>
