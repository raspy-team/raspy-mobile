<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar title="상대 구하기" />

    <main class="max-w-xl mx-auto px-4 pt-4 pb-16">
      <!-- 끝: 등록됨 → 가입 -->
      <template v-if="done">
        <UiCard class="text-center py-8">
          <BrandFace mood="wow" :size="64" class="mx-auto mb-3" />
          <p class="t-display">등록했어요</p>
          <p class="t-body mt-3">{{ done.dongName }} · {{ sportLabel }}</p>
          <p class="t-caption mt-2">
            {{ done.waiting > 0 ? `이 동네에서 ${done.waiting}명이 먼저 기다리고 있어요` : '이 동네 첫 등록이에요' }}
          </p>
        </UiCard>
        <UiCard class="mt-4">
          <p class="t-title">상대가 생기면 알려 드릴게요</p>
          <p class="t-caption mt-1">알림을 받으려면 시작해 주세요. 등록한 내용은 그대로 이어져요</p>
          <UiButton block size="lg" class="mt-4" @click="join">1초 만에 시작하기</UiButton>
        </UiCard>
      </template>

      <template v-else>
        <p class="t-display">같이 할 사람,<br />동네에서 구해요</p>
        <p class="t-caption mt-2">가입 없이 세 가지만 골라 주세요</p>

        <!-- 1. 종목 -->
        <UiSection title="1. 무엇을" class="mt-6">
          <div class="flex flex-wrap gap-2">
            <UiButton
              v-for="s in options?.sports ?? []"
              :key="s.value"
              size="sm"
              :variant="sport === s.value ? 'primary' : 'secondary'"
              @click="pickSport(s.value)"
            >
              {{ s.label }}
            </UiButton>
          </div>
        </UiSection>

        <!-- 2. 동네 -->
        <UiSection title="2. 어디서" class="mt-6">
          <UiCard v-if="dong" class="flex items-center justify-between gap-2">
            <span class="t-body text-fg">{{ dong.name }}</span>
            <UiButton size="sm" variant="ghost" @click="clearDong">바꾸기</UiButton>
          </UiCard>
          <template v-else>
            <UiButton block variant="secondary" icon="location-dot" :loading="locating" @click="useGps">지금 있는 동네로</UiButton>
            <p v-if="gpsError" class="t-caption text-danger mt-2">{{ gpsError }}</p>
            <UiInput v-model="query" class="mt-3" placeholder="동네 이름으로 찾기 (예: 합정)" @update:model-value="onQuery" />
            <ul v-if="found.length" class="mt-2 space-y-1">
              <li v-for="d in found" :key="d.code">
                <button type="button" class="w-full text-left px-3 py-2.5 rounded-xl bg-surface active:bg-surface-2 t-body" @click="pickDong(d, 'search')">
                  {{ d.name }}
                </button>
              </li>
            </ul>
            <p class="t-micro mt-2">위치는 동네를 찾는 데만 쓰고 남기지 않아요</p>
          </template>
        </UiSection>

        <!-- 3. 편한 때 -->
        <UiSection title="3. 언제 (여럿 골라도 돼요)" class="mt-6">
          <div class="flex flex-wrap gap-2">
            <UiButton
              v-for="t in options?.times ?? []"
              :key="t.value"
              size="sm"
              :variant="times.includes(t.value) ? 'primary' : 'secondary'"
              @click="toggleTime(t.value)"
            >
              {{ t.label }}
            </UiButton>
          </div>
        </UiSection>

        <UiButton block size="lg" class="mt-8" :disabled="!ready" :loading="sending" @click="register">
          {{ ready ? '상대 구하기 등록' : '세 가지를 골라 주세요' }}
        </UiButton>
        <p v-if="error" class="t-caption text-danger mt-3 text-center">{{ error }}</p>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
// 상대 구하기 등록 (/try/partner, 3단계 수요 조사 H2, 11/5): 가입 없이 종목·동네·편한 때를 남긴다.
// 개인정보는 받지 않는다(기기 번호, 행정동, 고른 칸). 위치 좌표는 동네를 찾는 데만 쓰고 서버도 남기지 않는다.
// 단계마다(무엇을 골랐나, 어디서 그만뒀나) 원본 기록에 남긴다. 가입하면 claimGuestPlays가 계정에 붙인다
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { GET, POST } from '@/api/client'
import type { components } from '@/api/schema'
import BrandFace from '../../components/BrandFace.vue'
import { UiButton, UiCard, UiInput, UiSection, UiTopBar } from '../../components/ui'
import { getVisitorId, markPartnerRegistered } from '@/utils/visit'
import { track, flush } from '@/utils/trackLog'
import { rememberReturnTo } from '@/utils/authRedirect'

type Schemas = components['schemas']
type DongOption = Schemas['DongOption']

const router = useRouter()
if (localStorage.getItem('raspy_access_token2')) track('partner_open_loggedin')

const options = ref<Schemas['Options'] | null>(null)
const sport = ref('')
const dong = ref<DongOption | null>(null)
const dongSource = ref<'gps' | 'search' | ''>('')
const times = ref<string[]>([])
const query = ref('')
const found = ref<DongOption[]>([])
const locating = ref(false)
const gpsError = ref('')
const sending = ref(false)
const error = ref('')
const done = ref<Schemas['RegisterResponse'] | null>(null)
const ready = computed(() => !!sport.value && !!dong.value && times.value.length > 0)
const sportLabel = computed(() => options.value?.sports.find((s) => s.value === sport.value)?.label ?? '')
// 지금 몇 단계까지 왔나 (그만둔 곳을 남기려고): 1 종목, 2 동네, 3 때, 4 등록함
const stage = computed(() => (done.value ? 4 : times.value.length && dong.value && sport.value ? 3 : dong.value ? 2 : sport.value ? 1 : 0))

onMounted(async () => {
  track('partner_open', { value: window.location.search.slice(1, 400) || undefined })
  try {
    options.value = (await GET('/api/partner-requests/options')).data
  } catch {
    error.value = '불러오지 못했어요. 다시 열어 주세요'
  }
})

function pickSport(v: string) {
  sport.value = v
  track('partner_sport', { step: 1, value: v })
}

function pickDong(d: DongOption, source: 'gps' | 'search') {
  dong.value = d
  dongSource.value = source
  found.value = []
  track('partner_dong', { step: 2, value: `${d.code}:${source}` })
}

function clearDong() {
  track('partner_dong_change', { step: 2, value: dong.value?.code })
  dong.value = null
}

function useGps() {
  gpsError.value = ''
  track('partner_gps_try', { step: 2 })
  if (!navigator.geolocation) {
    gpsError.value = '이 브라우저는 위치를 못 써요. 이름으로 찾아 주세요'
    track('partner_gps_fail', { step: 2, value: 'unsupported' })
    return
  }
  locating.value = true
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      try {
        const d = (await GET('/api/partner-requests/locate', { query: { lat: pos.coords.latitude, lon: pos.coords.longitude } })).data
        if (d?.code) pickDong(d, 'gps')
        else {
          gpsError.value = '동네를 찾지 못했어요. 이름으로 찾아 주세요'
          track('partner_gps_fail', { step: 2, value: 'not_found' })
        }
      } catch {
        gpsError.value = '동네를 찾지 못했어요. 이름으로 찾아 주세요'
        track('partner_gps_fail', { step: 2, value: 'error' })
      } finally {
        locating.value = false
      }
    },
    (e) => {
      locating.value = false
      gpsError.value = '위치를 못 받았어요. 이름으로 찾아 주세요'
      track('partner_gps_fail', { step: 2, value: e.code === 1 ? 'denied' : `code${e.code}` })
    },
    { timeout: 10000, maximumAge: 60000 },
  )
}

let searchTimer: ReturnType<typeof setTimeout> | null = null
function onQuery() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(async () => {
    const q = query.value.trim()
    if (q.length < 1) return (found.value = [])
    try {
      found.value = (await GET('/api/partner-requests/dongs', { query: { q } })).data
      track('partner_search', { step: 2, value: `${q}:${found.value.length}` })
    } catch {
      found.value = []
    }
  }, 300)
}

function toggleTime(v: string) {
  times.value = times.value.includes(v) ? times.value.filter((t) => t !== v) : [...times.value, v]
  track('partner_time', { step: 3, value: times.value.join(',') })
}

async function register() {
  const visitorId = getVisitorId()
  if (!visitorId || !dong.value) {
    error.value = '이 브라우저에서는 등록할 수 없어요. 시작하고 해 주세요'
    return
  }
  sending.value = true
  error.value = ''
  track('partner_submit', { step: 4, value: `${sport.value};${dong.value.code};${times.value.join(',')}` })
  try {
    done.value = (
      await POST('/api/partner-requests', {
        body: { visitorId, sport: sport.value, dongCode: dong.value.code, times: times.value, dongSource: dongSource.value || undefined },
      })
    ).data
    markPartnerRegistered()
    track('partner_done', { step: 4, value: `waiting=${done.value.waiting}` })
  } catch (e) {
    error.value = (e as { response?: { data?: { message?: string } } }).response?.data?.message || '등록하지 못했어요'
    track('partner_submit_failed', { step: 4, value: error.value })
  } finally {
    sending.value = false
  }
}

function join() {
  track('partner_join', { step: 5 })
  rememberReturnTo('/')
  router.push({ path: '/init', query: { from: 'partner' } })
}

// 등록하지 않고 떠났다: 몇 단계까지 왔는지
let left = false
function leave() {
  if (left || done.value) return
  left = true
  track('partner_quit', { step: stage.value, value: `${sport.value};${dong.value?.code ?? ''};${times.value.join(',')}` })
  flush(true)
}
window.addEventListener('pagehide', leave)
onBeforeUnmount(() => {
  window.removeEventListener('pagehide', leave)
  leave()
})
</script>
