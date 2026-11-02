<template>
  <UiTopBar title="내 경기">
    <template #right><InboxButtons /></template>
  </UiTopBar>

  <main class="px-4 pt-4 pb-32 max-w-xl mx-auto space-y-8">
    <UiPullIndicator :pull="pull" :refreshing="refreshing" />

    <div v-if="loading" class="space-y-3">
      <UiCard v-for="n in 2" :key="n">
        <div class="flex gap-3">
          <UiSkeleton class="w-10 h-10" />
          <div class="flex-1 space-y-2">
            <UiSkeleton class="h-4 w-2/3" />
            <UiSkeleton class="h-3 w-1/2" />
          </div>
        </div>
        <UiSkeleton class="h-11 w-full mt-4" />
      </UiCard>
    </div>

    <!-- 아직 경기가 없을 때: 무엇을 하면 되는지 순서로 -->
    <section v-else-if="!allGames.length && !appDuels.length" class="pt-6">
      <h2 class="t-title">첫 경기를 잡아볼까요</h2>
      <p class="t-caption mt-2">잡힌 경기는 여기에 모여요. 할 일이 생기면 맨 위에 보여요.</p>
      <ol class="mt-8 bg-surface rounded-xl divide-y divide-line">
        <li v-for="(s, i) in FIRST_STEPS" :key="s.title" class="flex items-baseline gap-4 px-4 py-4">
          <span class="t-mono w-6 flex-shrink-0">{{ String(i + 1).padStart(2, '0') }}</span>
          <span>
            <span class="block text-[15px] font-semibold text-fg">{{ s.title }}</span>
            <span class="block t-caption mt-0.5">{{ s.body }}</span>
          </span>
        </li>
      </ol>
      <div class="flex gap-2 mt-6">
        <UiButton class="flex-1" to="/">열린 경기 보기</UiButton>
        <UiButton class="flex-1" variant="secondary" to="/create-game">경기 만들기</UiButton>
      </div>
    </section>

    <template v-else>
      <!-- 앱 게임에서 아직 안 끝난 대결: 게임마다 흩어지지 않게 여기 모은다 -->
      <UiSection v-if="appDuels.length" :title="`앱 대결 ${appDuels.length}`">
        <AppDuelList :duels="appDuels" />
      </UiSection>
      <UiSection v-for="g in groups" :key="g.key" :title="`${g.title} ${g.items.length}`">
        <div class="space-y-3">
          <MyGameCard
            v-for="game in g.items"
            :key="game.type + game.id"
            :game="game"
            :me="me"
            @profile="(id) => id && router.push('/profile/' + id)"
            @play="router.push(`/games/${game.id}/play`)"
            @result="router.push(`/games/${game.id}/result`)"
            @start="openStart(game)"
            @applicants="applicantsGame = game"
            @share="share(game)"
            @cancel-request="cancelRequest(game)"
            @more="menuGame = game"
            @schedule="openSchedule(game)"
          />
        </div>
      </UiSection>
    </template>
  </main>

  <!-- 신청자: 한 명을 승인하면 경기가 확정된다 -->
  <UiSheet :model-value="!!applicantsGame" :title="`신청자 ${applicantsGame?.applicants?.length || 0}명`" @update:model-value="applicantsGame = null">
    <p class="t-caption mb-4">한 명을 승인하면 경기가 확정되고, 나머지 신청은 자동으로 마감돼요.</p>
    <UiList v-if="applicantsGame?.applicants?.length">
      <UiListItem
        v-for="a in applicantsGame.applicants"
        :key="a.userId"
        :title="a.applicantNickname"
        :subtitle="ratingLine(a.applicantGameStatisticsDTO) || '첫 경기를 앞두고 있어요'"
        plain
      >
        <template #leading>
          <button type="button" :aria-label="`${a.applicantNickname} 프로필`" @click="router.push('/profile/' + a.userId)"><UiAvatar :src="a.applicantProfileUrl" :name="a.applicantNickname" size="sm" /></button>
        </template>
        <template #trailing>
          <UiButton v-if="a.approved" size="sm" variant="secondary" :loading="busy" @click.stop="cancelApproval(applicantsGame, a)">승인 취소</UiButton>
          <UiButton v-else size="sm" :disabled="hasApproved(applicantsGame)" :loading="busy" @click.stop="approve(applicantsGame, a)">승인</UiButton>
        </template>
      </UiListItem>
    </UiList>
    <UiEmptyState v-else icon="fas fa-user-group" title="아직 신청한 사람이 없어요" description="링크를 공유하면 더 빨리 모여요" />
  </UiSheet>

  <!-- 더보기 -->
  <UiSheet :model-value="!!menuGame" @update:model-value="menuGame = null">
    <UiList v-if="menuGame">
      <UiListItem icon="fas fa-book-open" title="규칙 보기" @click="openRule(menuGame)" />
      <UiListItem v-if="dmTarget(menuGame)" icon="far fa-paper-plane" :title="`${dmTarget(menuGame).name}에게 메시지`" @click="router.push('/chat/' + dmTarget(menuGame).id)" />
      <UiListItem v-if="menuGame.type === 'my-game' && menuGame.status === 'MATCHING'" icon="fas fa-share" title="링크 공유하기" @click="share(menuGame)" />
      <UiListItem v-if="canDelete(menuGame)" icon="fas fa-trash" title="경기 삭제" danger @click="removeGame(menuGame)" />
    </UiList>
  </UiSheet>

  <!-- 시간·장소 정하기 (시작 전 언제든). 보낸 칸만 바뀌고 상대에게 알림이 간다 -->
  <UiSheet :model-value="!!scheduleGame" title="언제, 어디서 할까요?" @update:model-value="scheduleGame = null">
    <div class="space-y-5">
      <div>
        <p class="t-label mb-2">시간</p>
        <div class="flex flex-wrap gap-2 mb-2">
          <UiChip v-for="w in quick" :key="w.label" :selected="schedTime === w.date()" @click="schedTime = w.date()">{{ w.label }}</UiChip>
        </div>
        <UiInput v-model="schedTime" type="datetime-local" />
      </div>
      <div>
        <p class="t-label mb-2">장소</p>
        <div class="grid grid-cols-2 gap-2">
          <UiSelect v-model="schedRegion1" :options="region1Options" placeholder="시·도" />
          <UiSelect v-model="schedRegion2" :options="schedRegion2Options" placeholder="구·시·군" :disabled="!schedRegion1" />
        </div>
        <UiInput v-model="schedPlace" class="mt-2" placeholder="장소 이름 (예: 관악구민체육센터 3층)" />
      </div>
    </div>
    <template #footer>
      <UiButton block :disabled="!schedTime && !(schedRegion1 && schedRegion2)" :loading="busy" @click="submitSchedule">정하기</UiButton>
    </template>
  </UiSheet>

  <!-- 경기 시작 ① 정해둔 장소가 있으면 그대로 시작할지 -->
  <UiSheet v-model="showPlaceConfirm" title="이 장소에서 하나요?">
    <UiCard class="flex items-center gap-3">
      <UiIcon name="fas fa-location-dot" class="text-fg-muted" aria-hidden="true" />
      <span class="t-body">{{ startGame?.matchLocation }}</span>
    </UiCard>
    <template #footer>
      <div class="flex gap-2">
        <UiButton variant="secondary" block @click="openPlaceForm">장소 바꾸기</UiButton>
        <UiButton block @click="goCamera">이 장소로 시작</UiButton>
      </div>
    </template>
  </UiSheet>

  <!-- 경기 시작 ② 장소 정하기: 지역(챔피언 단위) + 장소 이름. Google 자동완성은 키가 있을 때 덤 -->
  <UiSheet v-model="showPlaceForm" title="어디서 하나요?">
    <div class="space-y-4">
      <div v-if="!selectedPlace" class="grid grid-cols-2 gap-2">
        <UiSelect v-model="manualRegion1" :options="region1Options" placeholder="시·도" />
        <UiSelect v-model="manualRegion2" :options="region2Options" placeholder="구·시·군" :disabled="!manualRegion1" />
      </div>
      <UiInput ref="placeInput" v-model="searchQuery" label="장소 이름" placeholder="예: 관악구민체육센터" icon="fas fa-location-dot" />
      <UiCard v-if="selectedPlace" class="flex items-start gap-3">
        <div class="flex-1 min-w-0">
          <p class="t-body truncate">{{ selectedPlace.name }}</p>
          <p class="t-micro truncate">{{ selectedPlace.address }}</p>
        </div>
        <UiIconButton icon="fas fa-xmark" label="다시 고르기" @click="clearSelection" />
      </UiCard>
      <UiInput v-model="detailedPlace" label="자세한 위치" optional placeholder="예: 3층, A코트" />
    </div>
    <template #footer>
      <UiButton block :disabled="!canSubmitPlace" :loading="busy" @click="submitPlace">다음</UiButton>
    </template>
  </UiSheet>

  <!-- 경기 시작 ③ 인증샷 (선택) -->
  <CameraCapture
    :is-visible="showCameraModal"
    title="경기 시작 인증샷"
    subtitle="피드에 표시될 사진을 촬영해주세요"
    allow-skip
    @capture="onPhotoCapture"
    @skip="onPhotoCapture(null)"
    @cancel="showCameraModal = false"
  />

  <!-- 경기 시작 ④ 마지막 확인 -->
  <UiDialog
    v-model="showStartConfirm"
    title="경기를 시작할까요?"
    :message="startMessage"
    confirm-text="시작하기"
    :loading="busy"
    @confirm="confirmStart"
  />

  <MatchRuleModal v-if="ruleGame" :rule="ruleGame.rule" @close="ruleGame = null" />
</template>

<script setup>
// 내 경기: 할 일(시작·승인·참여) / 기다리는 중 / 끝난 경기로 나눠 보여준다
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../api/api'
import InboxButtons from '../../components/inbox/InboxButtons.vue'
import MatchRuleModal from '../../components/MatchModal.vue'
import CameraCapture from '../../components/CameraCapture.vue'
import MyGameCard from '../../components/game/MyGameCard.vue'
import AppDuelList from '../../components/appgame/AppDuelList.vue'
import { GET } from '@/api/client'
import {
  UiAvatar, UiButton, UiCard, UiChip, UiDialog, UiEmptyState, UiIconButton, UiInput, UiList, UiListItem,
  UiPullIndicator, UiSection, UiSelect, UiSheet, UiSkeleton, UiTopBar
} from '../../components/ui'
import regionMap from '../../assets/regionMap.json'
import { useToast } from '../../composable/useToast'
import { usePullToRefresh } from '../../composables/usePullToRefresh'
import { confirmDialog } from '../../composables/useConfirm'
import { refreshOnChange } from '../../websocket/userChannel'
import { parseRegion } from '../../utils/regionParser'
import { compressImage, dataUrlToFile } from '../../utils/gamePictureStorage'
import { copyText } from '../../utils/clipboard'
import { ratingLine } from '../../utils/format'
import { quickTimes } from '../../utils/when'

const FIRST_STEPS = [
  { title: '열린 경기에 신청하거나 직접 열기', body: '규칙을 고르면 누구나 신청할 수 있게 올라가요' },
  { title: '상대가 정해지면 장소·시간 맞추기', body: '채팅으로 정하고, 그날 경기 화면에서 시작해요' },
  { title: '끝나면 결과 남기기', body: '상대가 확인하면 레이팅과 챔피언에 반영돼요' },
]

const router = useRouter()
const { showToast } = useToast()

const loading = ref(true)
const busy = ref(false)
const sentGames = ref([])
const myGames = ref([])
const applicantsMap = ref({})
const appDuels = ref([])
const me = ref({ name: '나' })
const applicantsGame = ref(null)
const menuGame = ref(null)
const ruleGame = ref(null)

// ---------- 목록 ----------

const allGames = computed(() => [
  ...myGames.value.map((g) => ({ ...g, type: 'my-game', applicants: applicantsMap.value[g.id] || [] })),
  ...sentGames.value.map((g) => ({ ...g, type: 'sent' })),
])

// 할 일: 진행 중, 상대가 낸 결과 확인, 내가 시작해야 하는 확정 경기, 승인 기다리는 신청자가 있는 경기
function bucket(g) {
  if (g.status === 'IN_PROGRESS' || g.gameStatus === 'IN_PROGRESS') return 'todo'
  // 결과 확인: 상대가 낸 결과는 내 할 일, 내가 낸 결과는 기다리는 중
  if (g.status === 'RESULT_PENDING' || g.gameStatus === 'RESULT_PENDING') {
    return g.resultSubmittedById === (g.myId ?? me.value.id) ? 'waiting' : 'todo'
  }
  if (g.type === 'my-game') {
    if (g.status === 'COMPLETED' || g.status === 'CANCELED') return 'done'
    if (g.status === 'SCHEDULED' && g.isOwner !== false) return 'todo'
    if (g.status === 'MATCHING' && g.applicants.length) return 'todo'
    return 'waiting'
  }
  return g.status === 'REJECTED' ? 'done' : 'waiting'
}
const byTime = (a, b) => new Date(a.matchDate || a.startedAt || 0) - new Date(b.matchDate || b.startedAt || 0)
const groups = computed(() =>
  [
    { key: 'todo', title: '할 일' },
    { key: 'waiting', title: '기다리는 중' },
    { key: 'done', title: '끝난 경기' },
  ]
    .map((g) => ({ ...g, items: allGames.value.filter((x) => bucket(x) === g.key).sort(byTime) }))
    .filter((g) => g.items.length),
)

async function fetchGames() {
  try {
    const [applicantsRes, sentRes, myRes, duels] = await Promise.all([
      api.get('/api/games/my-games/applicants'),
      api.get('/api/games/my-requests'),
      api.get('/api/games/my-games'),
      // 앱 대결은 못 불러와도 오프라인 경기 목록은 보여 준다
      GET('/api/app-games/duels/active').then(({ data }) => data).catch(() => null),
    ])
    if (duels) appDuels.value = duels
    applicantsMap.value = Object.fromEntries(applicantsRes.data.map((g) => [g.gameId, g.applicants || []]))
    sentGames.value = sentRes.data
    myGames.value = myRes.data
    // 열려 있는 신청자 시트도 새 값으로
    if (applicantsGame.value) applicantsGame.value = allGames.value.find((g) => g.type === 'my-game' && g.id === applicantsGame.value.id) || null
  } finally {
    loading.value = false
  }
}
const { pull, refreshing } = usePullToRefresh(fetchGames)

// ---------- 신청·승인 ----------

const hasApproved = (game) => (game.applicants || []).some((a) => a.approved)

async function approve(game, a) {
  busy.value = true
  try {
    await api.post('/api/games/approve', { gameId: game.id, userId: a.userId })
    showToast(`${a.applicantNickname}님과 경기가 확정됐어요`)
    applicantsGame.value = null
    await fetchGames()
  } catch (e) {
    showToast(e.response?.data?.message || '승인하지 못했어요')
  } finally {
    busy.value = false
  }
}

async function cancelApproval(game, a) {
  busy.value = true
  try {
    await api.post('/api/games/cancel-approve', { gameId: game.id, userId: a.userId })
    showToast('승인을 취소했어요. 다시 신청을 받아요')
    await fetchGames()
  } finally {
    busy.value = false
  }
}

async function cancelRequest(game) {
  if (!(await confirmDialog({ title: '신청을 취소할까요?', confirmText: '신청 취소' }))) return
  await api.post('/api/games/cancel-request', { gameId: game.id })
  sentGames.value = sentGames.value.filter((g) => g.id !== game.id)
  showToast('신청을 취소했어요')
}

// ---------- 더보기 ----------

function dmTarget(g) {
  if (g.type === 'sent') return { id: g.ownerId, name: g.ownerNickname }
  if (g.opponentId) return { id: g.opponentId, name: g.opponentNickname }
  return null
}
const canDelete = (g) => g.type === 'my-game' && g.isOwner !== false && ['MATCHING', 'SCHEDULED'].includes(g.status)

function openRule(g) {
  menuGame.value = null
  ruleGame.value = g
}

async function share(g) {
  menuGame.value = null
  try {
    const { data } = await api.post('/api/invite', null, { params: { gameId: g.id } })
    showToast((await copyText(data.url)) ? '링크를 복사했어요. 같이 할 사람에게 보내보세요' : '복사하지 못했어요')
  } catch {
    showToast('링크를 만들지 못했어요')
  }
}

async function removeGame(g) {
  menuGame.value = null
  const ok = await confirmDialog({
    title: '경기를 삭제할까요?',
    message: '신청한 사람들에게서도 사라져요.',
    confirmText: '삭제',
    danger: true,
  })
  if (!ok) return
  try {
    await api.delete(`/api/games/${g.id}/delete`)
    myGames.value = myGames.value.filter((x) => x.id !== g.id)
    showToast('경기를 삭제했어요')
  } catch (e) {
    showToast(e.response?.data?.message || '삭제하지 못했어요')
  }
}

// ---------- 경기 시작: 장소 → 인증샷(선택) → 확인 ----------

const startGame = ref(null)
const showPlaceConfirm = ref(false)
const showPlaceForm = ref(false)
const showCameraModal = ref(false)
const showStartConfirm = ref(false)
const capturedPhotoFile = ref(null)
const searchQuery = ref('')
const detailedPlace = ref('')
const selectedPlace = ref(null)
const placeInput = ref(null)
// ---------- 시간·장소 정하기 ----------
const scheduleGame = ref(null)
const quick = quickTimes()
const schedTime = ref('')
const schedRegion1 = ref('')
const schedRegion2 = ref('')
const schedPlace = ref('')
const schedRegion2Options = computed(() => (regionMap[schedRegion1.value] || []).filter((r) => r !== '전체'))
watch(schedRegion1, () => (schedRegion2.value = ''))

function openSchedule(g) {
  scheduleGame.value = g
  schedTime.value = g.matchDate ? String(g.matchDate).slice(0, 16) : ''
  const parsed = g.matchLocation ? parseRegion(g.matchLocation) : null
  schedRegion1.value = parsed?.region1 || ''
  nextTick(() => (schedRegion2.value = parsed?.region2 || ''))
  schedPlace.value = ''
}

async function submitSchedule() {
  busy.value = true
  try {
    const hasPlace = schedRegion1.value && schedRegion2.value
    await api.post(`/api/games/${scheduleGame.value.id}/schedule`, {
      matchDate: schedTime.value ? (schedTime.value.length === 16 ? `${schedTime.value}:00` : schedTime.value) : null,
      roadAddress: hasPlace ? `${schedRegion1.value} ${schedRegion2.value}` : null,
      detailAddress: hasPlace ? schedPlace.value.trim() || null : null,
    })
    scheduleGame.value = null
    showToast('정했어요. 상대에게 알렸어요')
    await fetchGames()
  } catch (e) {
    showToast(e.response?.data?.message || '정하지 못했어요')
  } finally {
    busy.value = false
  }
}

const manualRegion1 = ref('')
const manualRegion2 = ref('')
const region1Options = Object.keys(regionMap).filter((r) => r !== '전국')
const region2Options = computed(() => (regionMap[manualRegion1.value] || []).filter((r) => r !== '전체'))
watch(manualRegion1, () => (manualRegion2.value = ''))
const canSubmitPlace = computed(
  () => !!selectedPlace.value || !!(manualRegion1.value && manualRegion2.value && searchQuery.value.trim()),
)

const startMessage = computed(() => {
  const dur = startGame.value?.rule?.duration
  const time = !dur || dur < 0 ? '시간 제한 없이' : `${Math.floor(dur / 60) ? Math.floor(dur / 60) + '분 ' : ''}${dur % 60 ? (dur % 60) + '초 ' : ''}동안`
  return `${time} 진행돼요. 시작하면 상대에게도 바로 보여요.`
})

function openStart(game) {
  startGame.value = game
  if (game.matchLocation && game.matchLocation.trim()) showPlaceConfirm.value = true
  else openPlaceForm()
}

function openPlaceForm() {
  showPlaceConfirm.value = false
  searchQuery.value = ''
  detailedPlace.value = ''
  selectedPlace.value = null
  manualRegion1.value = ''
  showPlaceForm.value = true
  nextTick(initGoogleAutocomplete)
}

// Google 장소 자동완성 (키가 있을 때만). 고르면 지역까지 자동으로 정해진다
function initGoogleAutocomplete() {
  const el = placeInput.value?.el
  if (!window.google?.maps?.places || !el) return
  const ac = new window.google.maps.places.Autocomplete(el, {
    componentRestrictions: { country: 'kr' },
    fields: ['formatted_address', 'name', 'geometry'],
    types: ['establishment', 'geocode'],
  })
  ac.addListener('place_changed', () => {
    const p = ac.getPlace()
    const parsed = p.formatted_address && parseRegion(p.formatted_address)
    if (!parsed) return showToast('지역을 알 수 없는 주소예요. 지역을 직접 골라주세요')
    selectedPlace.value = { name: p.name || '', address: parsed.fullAddress }
  })
}

function clearSelection() {
  selectedPlace.value = null
  searchQuery.value = ''
}

async function submitPlace() {
  const placeInfo = selectedPlace.value || {
    name: searchQuery.value.trim(),
    address: `${manualRegion1.value} ${manualRegion2.value}`,
  }
  busy.value = true
  try {
    await api.post(`/api/games/${startGame.value.id}/set-region`, {
      roadAddress: placeInfo.address,
      detailAddress: detailedPlace.value ? `${placeInfo.name} ${detailedPlace.value}` : placeInfo.name,
    })
    showPlaceForm.value = false
    goCamera()
  } catch (e) {
    showToast(e.response?.data?.message || '장소를 저장하지 못했어요')
  } finally {
    busy.value = false
  }
}

function goCamera() {
  showPlaceConfirm.value = false
  capturedPhotoFile.value = null
  showCameraModal.value = true
}

function onPhotoCapture(file) {
  capturedPhotoFile.value = file
  showCameraModal.value = false
  showStartConfirm.value = true
}

async function confirmStart() {
  busy.value = true
  try {
    const form = new FormData()
    if (capturedPhotoFile.value) form.append('photo', capturedPhotoFile.value)
    await api.post(`/api/games/${startGame.value.id}/start`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
    showStartConfirm.value = false
    router.push(`/games/${startGame.value.id}/play`)
  } catch (e) {
    showToast(e.response?.data?.message || '경기를 시작하지 못했어요')
  } finally {
    busy.value = false
  }
}

// iOS 앱의 네이티브 카메라는 결과를 전역 콜백으로 돌려준다
async function handleNativeCamera(base64Image) {
  try {
    onPhotoCapture(dataUrlToFile(await compressImage(base64Image), 'camera-photo.jpg'))
  } catch {
    showToast('사진을 저장하지 못했어요')
  }
}

// ---------- 시작·정리 ----------

let stopWatching = null
onMounted(async () => {
  window.onCameraResult = handleNativeCamera
  window.onGameViewCameraResult = handleNativeCamera
  api.get('/api/user-profile/0').then(({ data }) => (me.value = { id: data.id, name: data.nickname, avatar: data.avatar })).catch(() => {})
  await fetchGames()
  // 신청·승인·시작·종료 신호가 오거나 앱으로 돌아왔을 때 다시 불러온다
  stopWatching = refreshOnChange(fetchGames)
})
onBeforeUnmount(() => {
  stopWatching?.()
  if (window.onCameraResult === handleNativeCamera) window.onCameraResult = null
  if (window.onGameViewCameraResult === handleNativeCamera) window.onGameViewCameraResult = null
})
</script>
