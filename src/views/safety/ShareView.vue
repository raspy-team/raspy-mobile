<template>
  <main class="min-h-full bg-canvas px-4 pt-safe pb-12 max-w-xl mx-auto">
    <header class="flex items-center gap-2 h-14">
      <BrandMark size="18px" />
      <p class="t-caption flex-1">· 위치 공유</p>
      <UiIconButton icon="rotate-right" label="새로 고침" :disabled="loading" @click="load" />
    </header>

    <UiListSkeleton v-if="loading" :rows="3" />
    <UiEmptyState v-else-if="!v" icon="circle-xmark" title="열 수 없는 링크예요" description="공유가 끝나고 하루가 지났거나 잘못된 주소예요" />

    <template v-else>
      <!-- 지금 상태가 가장 먼저 -->
      <section class="rounded-xl px-4 py-4" :class="TONE[v.status]">
        <p class="t-title">{{ HEAD[v.status](v.nickname) }}</p>
        <p class="t-caption mt-1">{{ SUB[v.status] }}</p>
        <p v-if="v.status === 'OVERDUE'" class="t-caption mt-2 text-fg font-semibold">전화나 메시지로 괜찮은지 확인해 보세요. 위험해 보이면 112에 신고하세요</p>
      </section>

      <section class="mt-6 space-y-2 t-body">
        <p><span class="t-caption">경기</span><br />{{ v.ruleTitle }}{{ v.opponents.length ? ` · ${v.opponents.join(', ')}님과` : '' }}</p>
        <p><span class="t-caption">언제</span><br />{{ matchTime(v.matchDate) }}</p>
        <p v-if="v.place"><span class="t-caption">어디서</span><br />{{ v.place }}</p>
      </section>

      <section v-if="v.lastLat != null" class="mt-6">
        <p class="t-caption mb-2">마지막 위치 · {{ timeAgo(v.lastAt) }}</p>
        <KakaoMap v-if="kakaoMapKey" class="mb-2" :center="{ lat: v.lastLat, lon: v.lastLon }" :pins="[{ id: 'me', lat: v.lastLat, lon: v.lastLon, label: v.nickname }]" :level="4" height="220px" />
        <UiButton block variant="secondary" icon="location-dot" @click="openMap">지도에서 보기</UiButton>
      </section>
      <p v-else-if="v.status === 'LIVE'" class="t-caption mt-6">아직 위치가 오지 않았어요. {{ v.nickname }}님이 앱을 열면 보내져요</p>

      <p class="t-micro mt-6">매치는 처음 보는 사람과 운동·게임을 하는 앱이에요. 만나서 하는 경기 동안 친구에게 위치를 공유하고, 끝나면 '잘 끝났어요'를 알려요</p>
    </template>
  </main>
</template>

<script setup>
// 위치 공유 링크 (안전·신뢰 C). 받은 친구가 로그인 없이 본다. 앱으로 돌아올 때와 '새로고침'에만 다시 묻는다 (폴링 없음)
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { GET } from '../../api/client'
import { matchTime, timeAgo } from '../../utils/format'
import { UiButton, UiEmptyState, UiIconButton, UiListSkeleton } from '../../components/ui'
import BrandMark from '../../components/BrandMark.vue'
import KakaoMap from '../../components/map/KakaoMap.vue'
import { kakaoMapKey, kakaoMapLink } from '../../utils/kakaoMap'

const route = useRoute()
const v = ref(null)
const loading = ref(true)

const HEAD = {
  LIVE: (n) => `${n}님이 경기 중이에요`,
  OVERDUE: (n) => `${n}님이 아직 '잘 끝났어요'를 누르지 않았어요`,
  FINISHED: (n) => `${n}님이 잘 끝났대요`,
  STOPPED: (n) => `${n}님이 공유를 그만뒀어요`,
  EXPIRED: (n) => `${n}님의 공유 시간이 끝났어요`,
}
const SUB = {
  LIVE: '경기가 끝나면 여기에 "잘 끝났어요"가 떠요',
  OVERDUE: '경기 시간이 꽤 지났어요',
  FINISHED: '위치 공유도 끝났어요',
  STOPPED: '더는 위치가 오지 않아요',
  EXPIRED: '경기 시간에서 4시간이 지나 공유가 닫혔어요',
}
const TONE = { LIVE: 'bg-surface', OVERDUE: 'bg-surface-2 border border-danger', FINISHED: 'bg-surface', STOPPED: 'bg-surface', EXPIRED: 'bg-surface' }

const mapUrl = computed(() => v.value && kakaoMapLink(v.value.nickname, v.value.lastLat, v.value.lastLon))
function openMap(e) {
  e?.preventDefault?.()
  window.open(mapUrl.value, '_blank', 'noopener')
}
async function load() {
  loading.value = true
  try {
    v.value = (await GET('/api/share/{token}', { path: { token: String(route.params.token) } })).data
  } catch {
    v.value = null
  } finally {
    loading.value = false
  }
}
const onVisible = () => document.visibilityState === 'visible' && load()
onMounted(() => { load(); document.addEventListener('visibilitychange', onVisible) })
onBeforeUnmount(() => document.removeEventListener('visibilitychange', onVisible))
</script>
