<template>
  <!-- 만나서 하는 경기의 안전 (안전·신뢰 C): 도착·끝 확인, 노쇼, 위치 공유. 할 일이 없을 때는 그리지 않는다 -->
  <div v-if="s && visible" class="rounded-xl border border-line px-4 py-3 space-y-3">
    <div class="flex items-center gap-2">
      <UiIcon name="shield-halved" class="text-fg-muted" aria-hidden="true" />
      <p class="t-label flex-1">만남 안전</p>
      <span v-if="s.shareUrl" class="t-micro text-signal-fg">위치 공유 중{{ s.shareFriendNickname ? ` · ${s.shareFriendNickname}` : '' }}</span>
    </div>

    <!-- 내가 노쇼로 기록됐을 때 -->
    <div v-if="s.noShowReportId" class="rounded-lg bg-surface-2 px-3 py-2.5 t-caption">
      <p class="text-danger-fg font-semibold">노쇼로 기록됐어요</p>
      <p class="mt-0.5">{{ s.noShowAppealed ? '이의를 냈어요. 운영진이 확인하고 있어요' : '갔는데 잘못 기록됐다면 이의를 내 주세요. 운영진이 확인해요' }}</p>
      <UiButton v-if="!s.noShowAppealed" size="sm" variant="secondary" class="mt-2" @click="appealOpen = true">이의 내기</UiButton>
    </div>

    <!-- 도착 -->
    <ul class="space-y-1.5 t-caption">
      <li class="flex items-center gap-2">
        <UiIcon :name="s.arrivedAt ? 'circle-check' : 'circle'" :class="s.arrivedAt ? 'text-signal-fg' : 'text-fg-subtle'" aria-hidden="true" />
        <span class="flex-1">나 {{ s.arrivedAt ? `${hm(s.arrivedAt)} 도착` : '아직 도착 전' }}{{ s.finishedAt ? ' · 잘 끝났어요' : '' }}</span>
      </li>
      <li v-for="o in s.others" :key="o.userId" class="flex items-center gap-2">
        <UiIcon :name="o.arrivedAt ? 'circle-check' : 'circle'" :class="o.arrivedAt ? 'text-signal-fg' : 'text-fg-subtle'" aria-hidden="true" />
        <span class="flex-1">{{ o.nickname }}님 {{ o.arrivedAt ? `${hm(o.arrivedAt)} 도착` : '아직 도착 전' }}<template v-if="o.near != null"> · {{ o.near ? '가까이 있어요' : '멀리 있어요' }}</template></span>
        <UiButton v-if="o.canReportNoShow" size="sm" variant="secondary" :loading="busy" @click="noShow(o)">안 왔어요</UiButton>
      </li>
    </ul>

    <div class="flex gap-2 flex-wrap">
      <UiButton v-if="s.canArrive && !s.arrivedAt" size="sm" class="flex-1" icon="location-dot" :loading="busy" @click="arrive">도착했어요</UiButton>
      <UiButton v-if="s.arrivedAt && !s.finishedAt" size="sm" class="flex-1" variant="secondary" icon="circle-check" :loading="busy" @click="finish">잘 끝났어요</UiButton>
      <UiButton v-if="s.canShare && !s.shareUrl && !s.finishedAt" size="sm" class="flex-1" variant="secondary" icon="share" @click="shareOpen = true">친구에게 내 위치 공유</UiButton>
      <template v-if="s.shareUrl">
        <UiButton size="sm" variant="secondary" icon="share" @click="send(s.shareUrl)">링크 다시 보내기</UiButton>
        <UiButton size="sm" variant="ghost" :loading="busy" @click="stop">공유 그만</UiButton>
      </template>
    </div>
    <p v-if="s.shareUrl" class="t-micro">앱을 열어 둔 동안 1분마다 위치가 갱신돼요. '잘 끝났어요'를 누르면 공유가 끝나요</p>
    <p v-else-if="s.canArrive && !s.arrivedAt" class="t-micro">도착을 눌러 두면 상대가 안 왔을 때 노쇼로 알릴 수 있어요</p>
  </div>

  <!-- 위치 공유: 링크는 누구에게나, 매치 친구를 고르면 끝 확인이 늦을 때 그 친구에게 알림이 가요 -->
  <UiSheet v-model="shareOpen" title="친구에게 내 위치 공유">
    <p class="t-caption mb-4">경기 동안 링크를 받은 사람이 내 마지막 위치와 '잘 끝났어요'를 봐요. 경기 시간 3시간 반이 지나도 끝 확인이 없으면 고른 매치 친구에게 알려요</p>
    <p class="t-label mb-2">매치 친구에게도 알리기 <span class="t-micro">(고르지 않아도 돼요)</span></p>
    <div class="flex flex-wrap gap-2 mb-2">
      <UiChip v-for="f in friends" :key="f.id" :selected="friendId === f.id" @click="friendId = friendId === f.id ? null : f.id">{{ f.nickname }}</UiChip>
      <p v-if="!friends.length" class="t-caption">매치 친구가 없어요. 링크만 보내도 돼요</p>
    </div>
    <template #footer>
      <UiButton block :loading="busy" @click="startShare">링크 만들어 보내기</UiButton>
    </template>
  </UiSheet>

  <UiSheet v-model="appealOpen" title="노쇼 이의">
    <p class="t-caption mb-3">무슨 일이 있었는지 적어 주세요. 운영진이 확인하고, 맞으면 기록을 지우고 처벌을 풀어요</p>
    <UiInput v-model="appealText" multiline :rows="3" placeholder="예: 시간 맞춰 갔는데 도착 버튼을 못 눌렀어요" />
    <template #footer>
      <UiButton block :disabled="!appealText.trim()" :loading="busy" @click="appeal">이의 보내기</UiButton>
    </template>
  </UiSheet>
</template>

<script setup>
// 안전·신뢰 C (11/3). 서버 MeetService가 판단하고, 여기는 보여 주고 누르게만 한다.
// 위치 공유 중에는 화면이 열려 있는 동안 위치가 바뀌면 1분에 한 번까지만 보낸다 (서버에 묻는 폴링은 없다)
import { computed, onBeforeUnmount, onMounted, ref, watch, defineProps } from 'vue'
import { UiButton, UiChip, UiIcon, UiInput, UiSheet } from '../ui'
import { GET, POST } from '../../api/client'
import { refreshOnChange } from '../../websocket/userChannel'
import { confirmDialog } from '../../composables/useConfirm'
import { useToast } from '../../composable/useToast'
import { copyText } from '../../utils/clipboard'

const props = defineProps({ gameId: { type: Number, required: true } })
const { showToast } = useToast()

const s = ref(null)
const busy = ref(false)
const shareOpen = ref(false)
const appealOpen = ref(false)
const appealText = ref('')
const friends = ref([])
const friendId = ref(null)

const visible = computed(() => s.value.inPerson && (s.value.canArrive || s.value.arrivedAt || s.value.canShare || s.value.noShowReportId || s.value.others.some((o) => o.canReportNoShow)))
const hm = (t) => new Date(t).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })

async function load() {
  try {
    s.value = (await GET('/api/meet/{gameId}', { path: { gameId: props.gameId } })).data
  } catch {
    s.value = null
  }
}

function position() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('이 기기에서는 위치를 쓸 수 없어요'))
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
      () => reject(new Error('위치를 켜 주세요. 도착을 확인하는 데만 써요')),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  })
}

async function run(fn, ok) {
  busy.value = true
  try {
    s.value = (await fn())?.data ?? s.value
    if (ok) showToast(ok)
  } catch (e) {
    showToast(e?.response?.data?.message || e?.message || '처리하지 못했어요')
  } finally {
    busy.value = false
  }
}

const arrive = () => run(async () => POST('/api/meet/{gameId}/arrive', { path: { gameId: props.gameId }, body: await position() }), '도착을 남겼어요')
const finish = () => run(() => POST('/api/meet/{gameId}/finish', { path: { gameId: props.gameId } }), '잘 끝났어요. 수고했어요')

async function noShow(o) {
  if (!(await confirmDialog({ title: `${o.nickname}님이 안 왔나요?`, message: '노쇼로 기록돼요. 상대 온도가 1도 내려가고, 거듭되면 만나서 하는 경기가 막혀요. 1:1 경기는 취소돼요', confirmText: '노쇼로 알리기', danger: true }))) return
  run(() => POST('/api/meet/{gameId}/no-show/{userId}', { path: { gameId: props.gameId, userId: o.userId } }), '노쇼로 알렸어요. 오느라 수고했어요')
}

async function appeal() {
  await run(() => POST('/api/meet/no-show/{reportId}/appeal', { path: { reportId: s.value.noShowReportId }, body: { text: appealText.value.trim() } }), '이의를 보냈어요. 운영진이 확인해요')
  appealOpen.value = false
  load()
}

async function send(text) {
  if (navigator.share) {
    try {
      await navigator.share({ text })
      return
    } catch (e) {
      if (e.name === 'AbortError') return
    }
  }
  showToast((await copyText(text)) ? '링크를 복사했어요. 친구에게 붙여 넣어 보내세요' : '복사하지 못했어요')
}

async function startShare() {
  busy.value = true
  try {
    const { data } = await POST('/api/meet/{gameId}/share', { path: { gameId: props.gameId }, body: { friendId: friendId.value } })
    shareOpen.value = false
    await load()
    pushLocation(true)
    await send(data.text)
  } catch (e) {
    showToast(e?.response?.data?.message || '공유하지 못했어요')
  } finally {
    busy.value = false
  }
}

const stop = () => run(async () => {
  await POST('/api/meet/share/{token}/stop', { path: { token: token() } })
  return GET('/api/meet/{gameId}', { path: { gameId: props.gameId } })
}, '위치 공유를 그만뒀어요')

// 위치 보내기: 공유 중이고 화면이 열려 있을 때만, 1분에 한 번까지
const token = () => s.value?.shareUrl?.split('/s/')[1]
let watchId = null
let lastSent = 0
function pushLocation(force = false) {
  if (!token() || !navigator.geolocation) return
  if (!force && Date.now() - lastSent < 60_000) return
  lastSent = Date.now()
  position().then((p) => POST('/api/meet/share/{token}/location', { path: { token: token() }, body: p })).catch(() => {})
}
watch(() => s.value?.shareUrl, (url) => {
  if (watchId != null) navigator.geolocation?.clearWatch(watchId)
  watchId = null
  if (url && navigator.geolocation) watchId = navigator.geolocation.watchPosition(() => pushLocation(), () => {}, { maximumAge: 60_000 })
})

watch(shareOpen, async (open) => {
  if (!open || friends.value.length) return
  friends.value = (await GET('/api/friends/my').catch(() => ({ data: [] }))).data || []
})

let off = null
onMounted(() => { load(); off = refreshOnChange(load) })
onBeforeUnmount(() => { off?.(); if (watchId != null) navigator.geolocation?.clearWatch(watchId) })
</script>
