<template>
  <div class="fixed inset-0 bg-[#2e5b3a] overflow-hidden select-none">
    <!-- 처음 들어온 사람: 기본 꾸미기부터 -->
    <div v-if="phase === 'avatar'" class="absolute inset-0 bg-canvas flex flex-col">
      <UiTopBar title="내 캐릭터 만들기" back />
      <AvatarEditor class="flex-1 min-h-0" mode="start" @saved="afterAvatar" />
    </div>

    <template v-else>
      <div ref="stage" class="absolute inset-0" />

      <!-- 위: 광장 고르기 -->
      <div class="absolute top-0 inset-x-0 z-10 max-w-xl mx-auto px-3 pt-[calc(env(safe-area-inset-top)+8px)] flex items-center gap-2">
        <UiIconButton icon="arrow-left" label="뒤로" class="bg-canvas/80 backdrop-blur" @click="goBack" />
        <!-- 광장은 하나라 고르기가 없다 (11/13) -->
        <p class="min-w-0 flex-1 h-10 px-3 rounded-full bg-canvas/80 backdrop-blur flex items-center t-body font-semibold text-fg"><span class="truncate">{{ room?.name ?? '광장' }}</span></p>
        <!-- 나도 센다: 둘이 서 있는데 '1'이었다 (11/13 실제 기기 한 바퀴) -->
        <button v-if="phase === 'plaza'" type="button" class="shrink-0 h-10 px-3 rounded-full bg-canvas/80 backdrop-blur t-caption font-semibold text-fg flex items-center gap-1" aria-label="지금 여기 있는 사람" @click="peopleOpen = true">
          <UiIcon name="users" /> {{ peopleHere.filter((p) => p.restingMinutes == null).length + 1 }}
        </button>
      </div>

      <div v-if="phase === 'loading'" class="absolute inset-0 flex items-center justify-center">
        <UiSpinner />
      </div>
      <!-- 닫힌 시간: 광장은 매일 밤 10시~11시에만 연다 (11/13 앱 기능 좁히기: 공간 대신 시간으로 사람을 모은다). 꾸미기는 늘 열려 있다 -->
      <div v-if="phase === 'closed'" class="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
        <p class="t-heading text-white">{{ closedReason }}</p>
        <p class="t-caption text-white/80">그 시간에 모두 한곳에 모여요. 그 전에 캐릭터를 꾸며 둘 수 있어요</p>
        <UiButton @click="router.push('/plaza/avatar')">캐릭터 꾸미기</UiButton>
        <UiButton variant="secondary" @click="router.push('/games')">게임 목록으로 보기</UiButton>
      </div>
      <div v-if="phase === 'error'" class="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
        <p class="t-body text-white">{{ error }}</p>
        <UiButton @click="start">다시 들어가기</UiButton>
        <UiButton variant="secondary" @click="router.push('/games')">게임 목록으로 보기</UiButton>
      </div>
      <!-- 들어오면 매치가 한 줄 안내 (docs/mascots.md: 광장 입구의 매치) -->
      <!-- 아래 말하기 칸 바로 위에 (위에 두면 노점 이름을 가렸다, 11/6) -->
      <div v-if="phase === 'plaza' && hint" class="absolute bottom-[calc(env(safe-area-inset-bottom)+84px)] inset-x-0 z-10 flex justify-center pointer-events-none">
        <div class="flex items-center gap-2 rounded-full bg-canvas/85 backdrop-blur pl-1.5 pr-4 py-1.5 max-w-[92%]">
          <MatchMascot who="match" :size="32" class="shrink-0" />
          <span class="t-caption text-fg">{{ hint }}</span>
        </div>
      </div>

      <!-- 아래: 말하기 -->
      <div v-if="phase === 'plaza'" class="absolute bottom-0 inset-x-0 z-10 max-w-xl mx-auto px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2 space-y-2">
        <div v-if="quickOpen" class="flex gap-1.5 overflow-x-auto no-scrollbar">
          <button v-for="e in enter?.emotes ?? []" :key="e" type="button" class="shrink-0 w-11 h-11 rounded-full bg-canvas/85 text-xl" :aria-label="`이모티콘 ${e}`" @click="emote(e)">{{ e }}</button>
        </div>
        <div v-if="quickOpen" class="flex gap-1.5 overflow-x-auto no-scrollbar">
          <button v-for="p in enter?.presets ?? []" :key="p" type="button" class="shrink-0 h-9 px-3 rounded-full bg-canvas/85 t-caption text-fg" @click="say(p)">{{ p }}</button>
        </div>
        <!-- 그림 크레딧 (LimeZu 라이선스: 크레딧 필수) -->
        <a href="https://limezu.itch.io" target="_blank" rel="noopener" class="block text-right text-[10px] text-white/60 pr-1">Pixel art by LimeZu</a>
        <form class="flex items-center gap-2" @submit.prevent="say(text)">
          <UiIconButton icon="smile" :label="quickOpen ? '빠른 말 닫기' : '빠른 말·이모티콘'" class="bg-canvas/85" @click="quickOpen = !quickOpen" />
          <input
            v-model="text"
            maxlength="60"
            enterkeyhint="send"
            class="flex-1 min-w-0 h-11 rounded-full bg-canvas/85 px-4 text-base text-fg placeholder:text-fg-subtle outline-none"
            placeholder="광장에 말하기"
            aria-label="광장에 말하기"
          />
          <UiIconButton icon="paper-plane" label="보내기" class="bg-canvas/85" :disabled="!text.trim()" @click="say(text)" />
        </form>
      </div>
    </template>

    <!-- 사람 카드 -->
    <UiSheet v-model="cardOpen" :title="card?.name ?? ''">
      <div v-if="card" class="flex items-center gap-4">
        <div class="w-16 h-24 rounded-2xl bg-surface-2 flex items-end justify-center overflow-hidden shrink-0">
          <div class="avatar-front" :style="{ backgroundImage: `url(${ART}/avatar/${card.sheet}.png)` }" />
        </div>
        <div class="min-w-0 space-y-1">
          <!-- 이름은 시트 제목에 있다 (두 번 쓰지 않는다). AI는 아래 줄이 말한다 -->
          <p v-if="card.bot" class="t-caption flex items-center gap-1"><MatchMascot who="bibi" :size="24" /> AI</p>
          <p v-if="card.champion" class="t-caption text-fg">👑 {{ card.champion }}</p>
          <p v-if="card.area" class="t-caption">{{ card.area }}</p>
          <p v-if="restingText(card)" class="t-caption">{{ restingText(card) }}</p>
        </div>
      </div>
      <template #footer>
        <div v-if="card && card.id !== enter?.me.id" class="space-y-2">
          <UiButton block size="lg" @click="pickerOpen = true">{{ restingText(card) ? '한 판 붙자 남기기' : '한 판 붙자' }}</UiButton>
          <!-- 주된 버튼 하나 + 작은 버튼 (애플식). 신고·차단은 글자로 -->
          <div class="flex items-center gap-2">
            <!-- 친구 추가 (UX ⑤: 광장에서 만난 사람을 친구로 할 길이 없었다). 이미 친구면 숨긴다 -->
            <UiButton v-if="!card.bot && friend && !friend.isFriend" size="sm" variant="secondary" :disabled="friend.sent" @click="addFriend(card.id)">{{ friend.sent ? '요청 보냄' : friend.received ? '친구 수락' : '친구 추가' }}</UiButton>
            <UiButton v-if="!card.bot" size="sm" variant="secondary" @click="router.push(`/profile/${card.id}`)">프로필</UiButton>
            <span class="flex-1" />
            <UiButton v-if="!card.bot" size="sm" variant="ghost" @click="reportOpen = true">신고</UiButton>
            <UiButton v-if="!card.bot" size="sm" variant="ghost" @click="block(card.id)">차단</UiButton>
          </div>
        </div>
        <UiButton v-else block variant="secondary" @click="router.push('/plaza/avatar')">꾸미기</UiButton>
      </template>
    </UiSheet>

    <!-- 게임 고르기 -->
    <UiSheet v-model="pickerOpen" title="어떤 게임으로 할까요?">
      <!-- 불러오기 실패면 회색 칸이 끝나지 않았다 (목적 판정 11/11 3번) -->
      <div v-if="gamesError" class="py-6 text-center">
        <p class="t-caption">게임을 불러오지 못했어요</p>
        <UiButton class="mt-3" size="sm" variant="secondary" @click="loadGames">다시 시도</UiButton>
      </div>
      <UiSkeleton v-else-if="!games.length" class="h-40 w-full" />
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="g in games"
          :key="g.key"
          type="button"
          class="h-14 rounded-2xl bg-surface px-3 text-left t-body text-fg active:bg-surface-2"
          @click="challenge(g.key)"
        >
          {{ g.title }}
        </button>
      </div>
    </UiSheet>

    <!-- 받은 도전 -->
    <!-- 앱 어디서나 받는 창(RealtimeInviteHost)과 같은 말로 (11/13 '한 판 붙자' 하나로) -->
    <UiSheet v-model="inviteOpen" :title="invite ? `${invite.from}님이 한 판 붙자고 해요` : '한 판 붙자'">
      <p v-if="invite" class="t-body text-fg"><strong>{{ invite.title.replace(/ 한 판$/, '') }}</strong> · 받으면 바로 시작해요</p>
      <template #footer>
        <div class="flex gap-2">
          <UiButton class="flex-1" variant="secondary" @click="inviteOpen = false">나중에</UiButton>
          <UiButton class="flex-1" @click="acceptInvite">받기</UiButton>
        </div>
      </template>
    </UiSheet>


    <!-- 지금 여기 있는 사람: 걷지 않고 바로 한 판 -->
    <UiSheet v-model="peopleOpen" title="지금 여기 있는 사람">
      <p v-if="!peopleHere.length" class="t-body text-fg-muted">아직 아무도 없어요</p>
      <ul class="space-y-1">
        <li v-for="p in peopleHere" :key="p.id" class="flex items-center gap-2">
          <button type="button" class="flex-1 min-w-0 flex items-center gap-3 rounded-2xl px-2 py-2 active:bg-surface-2 text-left" @click="peopleOpen = false; openCardFor(p)">
            <span class="w-9 h-12 rounded-xl bg-surface-2 overflow-hidden flex items-end justify-center shrink-0"><span class="avatar-mini" :style="{ backgroundImage: `url(${ART}/avatar/${p.sheet}.png)` }" /></span>
            <span class="min-w-0 flex-1">
              <span class="t-body text-fg flex items-center gap-1.5"><span class="truncate">{{ p.name }}</span><span v-if="p.bot" class="t-micro px-1.5 rounded bg-[#9ad0ff] text-[#121214] font-semibold">AI</span></span>
              <span class="block t-caption truncate">{{ p.champion ? `👑 ${p.champion}` : restingText(p) || p.area || '광장에 있어요' }}</span>
            </span>
          </button>
          <!-- 걷지 않고 바로 게임 고르기 -->
          <UiButton size="sm" variant="secondary" class="shrink-0" @click="peopleOpen = false; card = p; loadGames(); pickerOpen = true">한 판 붙자</UiButton>
        </li>
      </ul>
    </UiSheet>

    <!-- 게시판: 이 동네 모집 중인 경기 -->
    <UiSheet v-model="boardOpen" title="모집 중인 경기">
      <!-- 못 불러온 것과 없는 것을 가른다: 실패를 "없어요. 처음으로 열어 보세요"로 보였다 (경로 3 리뷰 R3) -->
      <div v-if="boardFailed" class="py-4 text-center">
        <p class="t-caption">모집 중인 경기를 불러오지 못했어요</p>
        <UiButton class="mt-3" size="sm" variant="secondary" @click="retryBoard">다시 시도</UiButton>
      </div>
      <UiSkeleton v-else-if="!board" class="h-32 w-full" />
      <p v-else-if="!board.length" class="t-body text-fg-muted">지금 모집 중인 경기가 없어요. 처음으로 열어 보세요</p>
      <ul v-else class="space-y-1">
        <li v-for="g in board" :key="g.id">
          <button type="button" class="w-full rounded-2xl px-3 py-2.5 active:bg-surface-2 text-left" @click="router.push(`/games/${g.id}`)">
            <span class="t-body text-fg block">{{ g.title }}</span>
            <span class="t-caption block">{{ g.when }} · {{ g.where }} · {{ g.people }}</span>
          </button>
        </li>
      </ul>
      <template #footer><UiButton block @click="router.push('/create-game')">경기 만들기</UiButton></template>
    </UiSheet>

    <!-- 실제 장소 팻말 -->
    <UiSheet v-model="placeOpen" :title="place?.name ?? ''">
      <p v-if="place" class="t-body text-fg">{{ PLACE_KIND[place.kind] ?? '장소' }}<template v-if="place.kind !== 'city' && place.kind !== 'gu'"> · {{ place.dir }}쪽 {{ place.distanceM < 1000 ? `${place.distanceM}m` : `${(place.distanceM / 1000).toFixed(1)}km` }}</template></p>
      <!-- '모집 중인 경기'(장소와 상관없는 전국 목록)와 '여기서 경기 만들기'(장소를 넘기지 못해 처음부터 다시 고름)는 뺐다 (목적 판정 11/11 3번) -->
      <template v-if="place?.target" #footer>
        <UiButton block @click="placeOpen = false; goRoom(place.target!)">이 광장으로 가기</UiButton>
      </template>
    </UiSheet>

    <ReportSheet v-model="reportOpen" target-type="USER" :target-id="card?.id" :context="`광장 ${room?.name ?? ''}`" :title="`${card?.name ?? ''}님을 신고할까요?`" />
  </div>
</template>

<script setup lang="ts">
// 광장 (/plaza, 11/5): 앱 게임 화면을 2D 로비로. 전국 → 도시 → 동네 광장에서 사람을 마주치고, 말을 걸고, 게임을 신청한다.
// 처음 들어오면 기본 꾸미기부터. 걷기·말은 웹소켓(/app/plaza/…), 들어가기는 REST. 지도·그림은 서버가 준다
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import api from '@/api/api'
import { matchTime } from '@/utils/format'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import { keepSpot, cameBack, STAY_ROUTES } from '../../components/plaza/plazaAway'
import type Phaser from 'phaser'
import { GET, POST } from '@/api/client'
import type { components } from '@/api/schema'
import { API_BASE_URL } from '@/config/server'
import { subscribeTopic, publish, onUserEvent, openUserChannel } from '@/websocket/userChannel'
import { useToast } from '@/composables/useToast'
import { confirmDialog } from '@/composables/useConfirm'
import AvatarEditor from '../../components/plaza/AvatarEditor.vue'
import MatchMascot from '../../components/mascot/MatchMascot.vue'
import ReportSheet from '../../components/safety/ReportSheet.vue'
import { UiButton, UiIcon, UiIconButton, UiSheet, UiSkeleton, UiSpinner, UiTopBar } from '../../components/ui'
import type { PlazaScene, MapObj, Person } from '../../components/plaza/PlazaScene'

type S = components['schemas']
const router = useRouter()
const { showToast } = useToast()
const ART = `${API_BASE_URL}/api/plaza/art`

const phase = ref<'loading' | 'avatar' | 'plaza' | 'error' | 'closed'>('loading')
const closedReason = ref('')
const error = ref('')
const rooms = ref<S['RoomInfo'][]>([])
const room = ref<S['RoomInfo'] | null>(null)
const enter = ref<S['EnterResponse'] | null>(null)
const stage = ref<HTMLElement | null>(null)
const text = ref('')
const quickOpen = ref(false)
const hint = ref('')
const card = ref<Person | null>(null)
const cardOpen = ref(false)
const pickerOpen = ref(false)
const reportOpen = ref(false)
const games = ref<{ key: string; title: string }[]>([])
const invite = ref<{ gameId: number; key: string; title: string; from: string } | null>(null)
const inviteOpen = ref(false)

let game: Phaser.Game | null = null
let offTopic: (() => void) | null = null
let offUser: (() => void) | null = null
let pingTimer: ReturnType<typeof setInterval> | null = null

const scene = () => game?.scene.getScene('plaza') as PlazaScene | undefined

async function start() {
  phase.value = 'loading'
  error.value = ''
  try {
    const avatar = (await GET('/api/plaza/avatar')).data
    if (!avatar.exists) {
      phase.value = 'avatar'
      return
    }
    rooms.value = (await GET('/api/plaza/rooms')).data
    // 광장은 하나다 (11/13). 닫힌 시간이면 언제 열리는지 보인다
    const only = rooms.value[0]
    if (!only?.open) {
      closedReason.value = only?.reason || '광장은 매일 밤 10시부터 11시까지 열려요'
      phase.value = 'closed'
      return
    }
    await go(only)
  } catch (e) {
    error.value = (e as { response?: { data?: { message?: string } } }).response?.data?.message || '광장에 들어가지 못했어요'
    phase.value = 'error'
  }
}

function afterAvatar() {
  showToast('캐릭터를 만들었어요')
  start()
}

async function go(r: S['RoomInfo']) {
  // 들어가기가 거절되면 지금 광장을 그대로 두도록, 먼저 들어가고 나서 지금 장면을 닫는다 (11/6 리뷰)
  const data = (await POST('/api/plaza/rooms/{room}/enter', { path: { room: r.id } })).data
  teardown(false)
  phase.value = 'loading'
  room.value = r
  enter.value = data
  rooms.value = rooms.value.map((x) => (x.id === data.room.id ? data.room : x))
  phase.value = 'plaza'
  await nextTick()
  const { createPlaza } = await import('../../components/plaza/PlazaScene')
  game = createPlaza(stage.value!, data, {
    onTapPerson: openCard,
    onTapObject: tapObject,
    onMove: (path) => publish(`/app/plaza/${data.instance}/move`, { path }),
  })
  // 개발 서버에서만: 브라우저 시험이 장면을 직접 누를 수 있게
  if (import.meta.env.DEV) (window as unknown as { __plaza?: unknown }).__plaza = { scene, openCard, tapObject }
  offTopic = subscribeTopic(`/topic/plaza/${data.instance}`, onEvent)
  board.value = null
  setTimeout(pinGames, 1500)
  pingTimer = setInterval(() => publish(`/app/plaza/${data.instance}/ping`), 25_000)
  // 걷는 법은 처음 한 번만 (UX ⑤: 들어올 때마다 같은 안내가 떴다)
  let seen = false
  try { seen = localStorage.getItem('plazaHintSeen') === '1'; localStorage.setItem('plazaHintSeen', '1') } catch { /* 이번만 */ }
  if (!seen) {
    hint.value = '땅을 누르면 걸어가요'
    setTimeout(() => (hint.value = ''), 5000)
  }
}

async function switchRoom(r: S['RoomInfo']) {
  if (r.id === room.value?.id) return
  if (!r.open) return showToast(r.reason || '아직 열리지 않았어요')
  try {
    await go(r)
  } catch (e) {
    showToast((e as { response?: { data?: { message?: string } } }).response?.data?.message || '들어가지 못했어요')
  }
}

function onEvent(e: { t: string; id?: number; p?: Person; path?: number[][]; text?: string }) {
  const s = scene()
  if (!s || e.id === enter.value?.me.id) return
  if (e.t === 'join' && e.p) s.join(e.p)
  else if (e.t === 'leave' && e.id) s.removeWalker(e.id)
  else if (e.t === 'move' && e.id && e.path) s.walkPath(e.id, e.path)
  else if (e.t === 'say' && e.id && e.text) s.sayBubble(e.id, e.text)
  else if (e.t === 'emote' && e.id && e.text) s.sayBubble(e.id, e.text, true)
}

// 서버가 버리는 말(2초 안 다시, 10초 안 같은 말)은 내 화면에도 띄우지 않는다: 내 화면엔 말풍선이 떴는데 남에게는 안 보였다 (경로 3 훑기)
let lastSayAt = 0
let lastSaid = ''
function say(raw: string) {
  const t = raw.trim()
  if (!t || !enter.value) return
  const now = Date.now()
  if (now - lastSayAt < 2000 || (t === lastSaid && now - lastSayAt < 10_000)) return showToast(t === lastSaid ? '같은 말은 잠깐 뒤에 다시 할 수 있어요' : '잠깐 뒤에 말할 수 있어요')
  if (!publish(`/app/plaza/${enter.value.instance}/say`, { text: t })) return showToast('연결하는 중이에요. 잠깐 뒤 다시 해 주세요')
  // 내 말은 서버가 거른 글로 돌아오지 않으니(내 신호는 무시) 바로 띄운다. 거른 글자는 남에게 #으로 보인다
  lastSayAt = now
  lastSaid = t
  scene()?.sayBubble(enter.value.me.id, t)
  text.value = ''
  quickOpen.value = false
}

function emote(e: string) {
  if (!enter.value) return
  publish(`/app/plaza/${enter.value.instance}/emote`, { text: e })
  scene()?.sayBubble(enter.value.me.id, e, true)
}

function restingText(p: Person) {
  if (p.restingMinutes == null) return ''
  const m = p.restingMinutes
  return `쉬는 중 · ${m < 60 ? `${Math.max(1, m)}분` : `${Math.floor(m / 60)}시간`} 전에 다녀갔어요`
}

function openCardFor(p: Person) {
  card.value = p
  cardOpen.value = true
  loadGames()
  loadFriend(p)
}

function openCard(id: number) {
  const p = scene()?.person(id)
  if (p) openCardFor(p)
}

// 친구 상태 (카드의 '친구 추가'). 받은 요청이 있으면 받는다
const friend = ref<{ isFriend?: boolean; sent?: boolean; received?: boolean } | null>(null)
async function loadFriend(p: Person) {
  friend.value = null
  if (p.bot || p.id === enter.value?.me.id) return
  friend.value = (await api.get(`/api/friends/status/${p.id}`).catch(() => null))?.data ?? null
}
async function addFriend(id: number) {
  const received = friend.value?.received
  try {
    await api.post(received ? `/api/friends/accept/${id}` : `/api/friends/request/${id}`)
    friend.value = { ...friend.value, sent: !received, isFriend: !!received }
    showToast(received ? '친구가 됐어요' : '친구 요청을 보냈어요')
  } catch (e) {
    showToast((e as { response?: { data?: { message?: string } } }).response?.data?.message || '친구 요청을 보내지 못했어요')
  }
}

const gamesError = ref(false)
async function loadGames() {
  if (games.value.length) return
  gamesError.value = false
  let list
  try {
    list = (await GET('/api/app-games')).data
  } catch {
    gamesError.value = true
    return
  }
  games.value = list
    .filter((g) => g.playMode === 'REALTIME' && g.available && !g.battle && !g.shared)
    .sort((a, b) => b.playCount - a.playCount)
    .map((g) => ({ key: g.key, title: g.title }))
}

function tapObject(o: MapObj) {
  const a = o.action ?? ''
  if (a.startsWith('game:')) router.push(`/play/${a.slice(5)}`)
  else if (a.startsWith('gameid:')) router.push(`/games/${a.slice(7)}`)
  else if (a === 'games') router.push('/games')
  else if (a === 'board') openBoard()
  else if (a === 'shop') router.push('/plaza/avatar')
  // 분수 누르기는 뺐다: 누르면 사람 목록이 나올 줄 아무도 몰랐고, 위 막대 사람 수가 같은 일을 한다 (목적 판정 3, 고병연 확인)
  else if (a.startsWith('room:')) goRoom(a.slice(5))
  else if (a.startsWith('place:')) {
    const p = enter.value?.map.places[Number(a.slice(6))]
    if (p) {
      place.value = p
      placeOpen.value = true
    }
  } else if (a === 'champion') {
    const s = enter.value?.statue
    if (!s) return showToast('아직 이 광장의 챔피언이 없어요. 첫 챔피언이 되어 보세요')
    card.value = { id: s.id, name: s.name, sheet: s.sheet, x: 0, y: 0, bot: false, champion: `챔피언 ${s.belts}개 · 이 광장 챔피언` }
    cardOpen.value = true
    loadGames()
  }
}

/** 문·도시 팻말: kr·city·dong을 내 실제 방으로 바꿔 들어간다 */
function goRoom(target: string) {
  const r = target.startsWith('city-') ? rooms.value.find((x) => x.id === target) : rooms.value.find((x) => x.kind === target)
  // 막힌 이유만 말하고 갈 길이 없었다: 누르면 동네 인증으로 가서 인증 뒤 광장으로 돌아온다
  if (!r) return target === 'dong' || target === 'city'
    ? showToast('동네를 인증하면 열려요', `/neighborhood?back=${encodeURIComponent('/plaza')}`)
    : showToast('내 동네가 있는 도시 광장만 들어갈 수 있어요')
  switchRoom(r)
}

// 게시판: 이 동네(내 동네 범위) 모집 중인 경기. 지도 위 핀과 같은 목록
const boardOpen = ref(false)
const board = ref<{ id: number; title: string; when: string; where: string; people: string }[] | null>(null)
async function loadBoard() {
  const list = (await api.get('/api/games/list', { params: { sort: 'latest' } })).data as S['GameSummaryResponse'][]
  board.value = list.slice(0, 12).map((g) => ({
    id: g.id,
    title: g.rule?.ruleTitle ?? '경기',
    when: g.matchDate ? matchTime(g.matchDate) : '시간 정하는 중',
    where: g.dongName || g.matchLocation || '',
    people: `${g.currentParticipantCounts}/${g.maxPlayers}명`,
  }))
  return list
}
const boardFailed = ref(false)
function openBoard() {
  boardOpen.value = true
  if (!board.value) retryBoard()
}
function retryBoard() {
  boardFailed.value = false
  loadBoard().catch(() => (boardFailed.value = true))
}
/** 동네 광장이면 모집 중인 경기를 실제 방향에 핀으로 꽂는다 */
async function pinGames() {
  if (!enter.value?.map.center) return
  try {
    const list = await loadBoard()
    const pins = list
      .filter((g) => g.placeLat != null && g.placeLon != null && g.placePublic !== false)
      .map((g) => ({ id: g.id, title: g.rule?.ruleTitle ?? '경기', when: g.matchDate ? matchTime(g.matchDate) : '시간 정하는 중', lat: g.placeLat!, lon: g.placeLon! }))
    scene()?.addPins(pins)
  } catch {
    // 핀이 없어도 광장은 쓴다
  }
}

// 지금 여기 있는 사람 (분수·위 막대): 걷지 않고 바로 카드로
const peopleOpen = ref(false)
const peopleHere = computed(() => {
  void peopleTick.value
  const s = scene()
  if (!s) return []
  return s.everyone().filter((p) => p.id !== enter.value?.me.id).sort((a, b) => Number(a.restingMinutes != null) - Number(b.restingMinutes != null) || Number(a.bot) - Number(b.bot))
})
const peopleTick = ref(0)
// 화면을 나가면 멈춘다 (예전엔 들어올 때마다 하나씩 늘어 계속 돌았다)
const peopleTimer = setInterval(() => peopleTick.value++, 3000)

// 실제 장소 팻말
const placeOpen = ref(false)
const place = ref<S['Place'] | null>(null)
const PLACE_KIND: Record<string, string> = { station: '지하철역', school: '학교', hospital: '병원', mall: '마트', cafe: '카페', park: '공원·명소', store: '편의점', dong: '이웃 동네', gu: '구·군', city: '도시' }

/** 한 판: 사람이면 그 사람만 들어오는 방을 열고(받는 사람 화면에 '받기'가 뜬다), AI면 그 AI를 바로 부른다 */
function challenge(key: string) {
  const p = card.value
  if (!p) return
  pickerOpen.value = false
  cardOpen.value = false
  if (p.bot) router.push({ path: `/play/${key}/live`, query: { ai: String(p.id) } }) // 그 AI가 바로 들어온다 (ai-a)
  else router.push({ path: `/play/${key}/live`, query: { to: String(p.id) } })
}

async function block(id: number) {
  // 확인 없이 바로 차단돼 잘못 누르면 되돌릴 길이 없었다. 프로필의 차단과 같게 한 번 묻는다
  if (!(await confirmDialog({ title: `${card.value?.name ?? '이 사람'}님을 차단할까요?`, message: '서로 메시지·신청·도전을 할 수 없고, 광장에서도 보이지 않아요', confirmText: '차단', danger: true }))) return
  try {
    await POST('/api/block/{targetId}', { path: { targetId: id } })
  } catch {
    return showToast('차단하지 못했어요')
  }
  POST('/api/plaza/hide/{targetId}', { path: { targetId: id } }).catch(() => {})
  scene()?.hide(id)
  cardOpen.value = false
  showToast('차단했어요. 서로 광장에서 보이지 않아요')
}

/** 광장에서 받은 도전: 누가 무엇을 하재는지 불러와 '받기'를 띄운다 */
async function onInvite(gameId: number) {
  // 받기 전이라 판 내용을 못 볼 수도 있다: 그러면 누가 무엇인지 없이 띄우고, 받으면 서버가 알려 준 게임으로 간다
  let key = ''
  let title = '한 판'
  let from = '누군가'
  try {
    // 받기 전에는 판을 못 봐서(403) 예전엔 '누군가님이 한 판 한 판 하재요'였다 (UX ⑤). 받는 사람만 보는 미리 보기로
    const s = (await GET('/api/app-games/realtime/{gameId}/invite', { path: { gameId } })).data
    if (!s.open) return
    key = s.key
    from = s.fromNickname
    title = `${s.title} 한 판`
  } catch {
    // 그대로
  }
  invite.value = { gameId, key, title, from }
  inviteOpen.value = true
}

async function acceptInvite() {
  const i = invite.value
  if (!i) return
  inviteOpen.value = false
  try {
    const s = (await POST('/api/app-games/realtime/{gameId}/accept', { path: { gameId: i.gameId } })).data
    router.push({ path: `/play/${s.key}/live`, query: { invite: String(i.gameId) } })
  } catch (e) {
    showToast((e as { response?: { data?: { message?: string } } }).response?.data?.message || '끝난 한 판이에요')
  }
}

function goBack() {
  if (window.history.state?.back) router.back()
  else router.push('/')
}

function teardown(leave = true) {
  offTopic?.()
  offTopic = null
  if (pingTimer) clearInterval(pingTimer)
  pingTimer = null
  game?.destroy(true)
  game = null
  if (leave) POST('/api/plaza/leave').catch(() => {})
}

onMounted(() => {
  cameBack()
  openUserChannel()
  offUser = onUserEvent((e: { type: string; gameId?: number }) => {
    if (e.type === 'REALTIME_INVITE' && e.gameId) onInvite(e.gameId)
    // 나를 차단한 사람은 내 화면에서도 지운다 (gameId 자리에 그 사람 번호)
    else if (e.type === 'PLAZA_HIDE' && e.gameId) scene()?.hide(e.gameId)
    // 연결이 끊겼다 다시 붙으면 서버는 나를 내보냈을 수 있다: 같은 광장에 다시 들어간다
    else if (e.type === 'RECONNECTED' && phase.value === 'plaza' && room.value) go(room.value).catch(() => {})
  })
  start()
})

// 프로필·꾸미기·메시지·모집 경기로 잠깐 가면 광장을 나가지 않는다 (UX ⑤: 남들 화면에서 사라졌다 다시 생겼다). 게임·다른 탭이면 나간다
let away = false
onBeforeRouteLeave((to) => {
  away = phase.value === 'plaza' && !!enter.value && STAY_ROUTES.some((r) => r.test(to.path))
})

onBeforeUnmount(() => {
  clearInterval(peopleTimer)
  offUser?.()
  const inst = enter.value?.instance
  teardown(!away)
  if (away && inst) keepSpot(inst)
})
</script>

<style scoped>
/* 16×32 칸을 3배로: 0줄 넷째 칸(앞을 본 모습) */
.avatar-mini {
  width: 32px;
  height: 64px;
  background-size: 1792px 192px;
  background-position: -96px 0;
  image-rendering: pixelated;
  transform: scale(0.75);
  transform-origin: bottom center;
}
.avatar-front {
  width: 48px;
  height: 96px;
  background-size: 2688px 288px;
  background-position: -144px 0;
  image-rendering: pixelated;
}
</style>
