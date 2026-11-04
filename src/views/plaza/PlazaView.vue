<template>
  <div class="fixed inset-0 bg-[#2e5b3a] overflow-hidden select-none">
    <!-- 처음 들어온 사람: 기본 꾸미기부터 -->
    <div v-if="phase === 'avatar'" class="absolute inset-0 bg-canvas flex flex-col">
      <UiTopBar title="내 캐릭터 만들기" back />
      <p class="px-4 t-body text-fg-muted">광장에서 이웃을 만날 내 모습이에요. 기본 옷 중에서 골라 시작하고, 포인트가 모이면 하나씩 꾸며요</p>
      <AvatarEditor class="flex-1 min-h-0" mode="start" @saved="afterAvatar" />
    </div>

    <template v-else>
      <div ref="stage" class="absolute inset-0" />

      <!-- 위: 광장 고르기 -->
      <div class="absolute top-0 inset-x-0 z-10 px-3 pt-[calc(env(safe-area-inset-top)+8px)] flex items-center gap-2">
        <UiIconButton icon="arrow-left" label="뒤로" class="bg-canvas/80 backdrop-blur" @click="goBack" />
        <div class="flex gap-1.5 overflow-x-auto no-scrollbar flex-1">
          <button
            v-for="r in rooms"
            :key="r.id"
            type="button"
            class="shrink-0 h-9 px-3 rounded-full t-caption font-semibold backdrop-blur"
            :class="r.id === room?.id ? 'bg-fg text-canvas' : r.open ? 'bg-canvas/80 text-fg' : 'bg-canvas/60 text-fg-subtle'"
            @click="switchRoom(r)"
          >
            {{ r.name }}<span v-if="r.open && r.online" class="ml-1 opacity-70">{{ r.online }}</span>
            <UiIcon v-if="!r.open" name="lock" class="ml-1 text-[10px]" />
          </button>
        </div>
        <UiIconButton icon="list" label="게임 목록으로 보기" class="bg-canvas/80 backdrop-blur" @click="router.push('/games')" />
        <UiIconButton icon="shirt" label="꾸미기" class="bg-canvas/80 backdrop-blur" @click="router.push('/plaza/avatar')" />
      </div>

      <div v-if="phase === 'loading'" class="absolute inset-0 flex items-center justify-center">
        <UiSpinner />
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
          <MatchMascot who="match" :size="30" class="text-fg shrink-0" />
          <span class="t-caption text-fg">{{ hint }}</span>
        </div>
      </div>

      <!-- 아래: 말하기 -->
      <div v-if="phase === 'plaza'" class="absolute bottom-0 inset-x-0 z-10 px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2 space-y-2">
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
            class="flex-1 h-11 rounded-full bg-canvas/85 px-4 t-body text-fg placeholder:text-fg-subtle outline-none"
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
          <p class="t-body text-fg flex items-center gap-1.5">
            {{ card.name }}
            <span v-if="card.bot" class="t-micro px-1.5 rounded bg-[#9ad0ff] text-[#121214] font-semibold">AI</span>
          </p>
          <p v-if="card.bot" class="t-caption flex items-center gap-1"><MatchMascot who="bibi" :size="20" /> AI 주민 · 매치가 만든 연습 상대예요</p>
          <p v-if="card.champion" class="t-caption text-fg">👑 {{ card.champion }}</p>
          <p v-if="card.area" class="t-caption">{{ card.area }}</p>
          <p v-if="restingText(card)" class="t-caption">{{ restingText(card) }}</p>
        </div>
      </div>
      <template #footer>
        <div v-if="card && card.id !== enter?.me.id" class="space-y-2">
          <UiButton block size="lg" @click="pickerOpen = true">{{ card.bot ? 'AI와 한 판' : restingText(card) ? '도전장 남기기' : '한 판 하자고 하기' }}</UiButton>
          <div class="flex gap-2">
            <UiButton v-if="!card.bot" class="flex-1" variant="secondary" @click="router.push(`/profile/${card.id}`)">프로필</UiButton>
            <UiButton v-if="!card.bot" class="flex-1" variant="secondary" @click="reportOpen = true">신고</UiButton>
            <UiButton v-if="!card.bot" class="flex-1" variant="secondary" @click="block(card.id)">차단</UiButton>
          </div>
        </div>
        <UiButton v-else block variant="secondary" @click="router.push('/plaza/avatar')">꾸미기</UiButton>
      </template>
    </UiSheet>

    <!-- 게임 고르기 -->
    <UiSheet v-model="pickerOpen" title="어떤 게임으로 할까요?">
      <UiSkeleton v-if="!games.length" class="h-40 w-full" />
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
    <UiSheet v-model="inviteOpen" title="한 판 하재요">
      <p v-if="invite" class="t-body text-fg">{{ invite.from }}님이 <strong>{{ invite.title }}</strong> 한 판 하재요</p>
      <template #footer>
        <div class="flex gap-2">
          <UiButton class="flex-1" variant="secondary" @click="inviteOpen = false">다음에</UiButton>
          <UiButton class="flex-1" @click="acceptInvite">받기</UiButton>
        </div>
      </template>
    </UiSheet>

    <ReportSheet v-model="reportOpen" target-type="USER" :target-id="card?.id" :context="`광장 ${room?.name ?? ''}`" :title="`${card?.name ?? ''}님을 신고할까요?`" />
  </div>
</template>

<script setup lang="ts">
// 광장 (/plaza, 11/5): 앱 게임 화면을 2D 로비로. 전국 → 도시 → 동네 광장에서 사람을 마주치고, 말을 걸고, 게임을 신청한다.
// 처음 들어오면 기본 꾸미기부터. 걷기·말은 웹소켓(/app/plaza/…), 들어가기는 REST. 지도·그림은 서버가 준다
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import type Phaser from 'phaser'
import { GET, POST } from '@/api/client'
import type { components } from '@/api/schema'
import { API_BASE_URL } from '@/config/server'
import { subscribeTopic, publish, onUserEvent, openUserChannel } from '@/websocket/userChannel'
import { useToast } from '@/composable/useToast'
import AvatarEditor from '../../components/plaza/AvatarEditor.vue'
import MatchMascot from '../../components/mascot/MatchMascot.vue'
import ReportSheet from '../../components/safety/ReportSheet.vue'
import { UiButton, UiIcon, UiIconButton, UiSheet, UiSkeleton, UiSpinner, UiTopBar } from '../../components/ui'
import type { PlazaScene, MapObj, Person } from '../../components/plaza/PlazaScene'

type S = components['schemas']
const router = useRouter()
const { showToast } = useToast()
const ART = `${API_BASE_URL}/api/plaza/art`

const phase = ref<'loading' | 'avatar' | 'plaza' | 'error'>('loading')
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
    // 열린 곳 중 가장 가까운 곳(동네 → 도시 → 전국)부터. 단, 사람이 아무도 없으면 사람이 더 있는 넓은 곳으로
    const open = rooms.value.filter((r) => r.open)
    const near = [...open].reverse()
    const pick = near.find((r) => r.online > 0) ?? near.find((r) => r.kind === 'dong') ?? open[0]
    await go(pick)
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
  pingTimer = setInterval(() => publish(`/app/plaza/${data.instance}/ping`), 25_000)
  const others = data.people.filter((p) => !p.bot).length
  hint.value = others ? `지금 ${others}명이 광장에 있어요. 땅을 누르면 걸어가요` : '땅을 누르면 걸어가요. 노점을 누르면 그 게임으로 가요'
  setTimeout(() => (hint.value = ''), 5000)
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

function say(raw: string) {
  const t = raw.trim()
  if (!t || !enter.value) return
  if (!publish(`/app/plaza/${enter.value.instance}/say`, { text: t })) return showToast('연결하는 중이에요. 잠깐 뒤 다시 해 주세요')
  // 내 말은 서버가 거른 글로 돌아오지 않으니(내 신호는 무시) 바로 띄운다. 거른 글자는 남에게 #으로 보인다
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

function openCard(id: number) {
  const p = scene()?.person(id)
  if (!p) return
  card.value = p
  cardOpen.value = true
  loadGames()
}

async function loadGames() {
  if (games.value.length) return
  const list = (await GET('/api/app-games')).data
  games.value = list
    .filter((g) => g.playMode === 'REALTIME' && g.available && !g.battle && !g.shared)
    .sort((a, b) => b.playCount - a.playCount)
    .map((g) => ({ key: g.key, title: g.title }))
}

function tapObject(o: MapObj) {
  const a = o.action ?? ''
  if (a.startsWith('game:')) router.push(`/play/${a.slice(5)}`)
  else if (a === 'games') router.push('/games')
  else if (a === 'board') router.push('/')
  else if (a === 'champion') {
    const s = enter.value?.statue
    if (!s) return showToast('아직 이 광장의 챔피언이 없어요. 첫 챔피언이 되어 보세요')
    card.value = { id: s.id, name: s.name, sheet: s.sheet, x: 0, y: 0, bot: false, champion: `챔피언 자리 ${s.belts}개 · 이 광장 챔피언` }
    cardOpen.value = true
    loadGames()
  }
}

/** 한 판: 사람이면 그 사람만 들어오는 방을 열고(받는 사람 화면에 '받기'가 뜬다), AI면 그 AI 주민을 바로 부른다 */
function challenge(key: string) {
  const p = card.value
  if (!p) return
  pickerOpen.value = false
  cardOpen.value = false
  if (p.bot) router.push({ path: `/play/${key}/live`, query: { ai: String(p.id) } }) // 그 AI 주민이 바로 들어온다 (ai-a)
  else router.push({ path: `/play/${key}/live`, query: { to: String(p.id) } })
}

async function block(id: number) {
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
    const s = (await GET('/api/app-games/realtime/{gameId}', { path: { gameId } })).data
    key = s.key
    from = (s.me.userId === enter.value?.me.id ? s.opponent?.nickname : s.me.nickname) ?? from
    title = games.value.find((g) => g.key === s.key)?.title ?? title
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
    showToast((e as { response?: { data?: { message?: string } } }).response?.data?.message || '도전이 끝났어요')
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

onBeforeUnmount(() => {
  offUser?.()
  teardown(true)
})
</script>

<style scoped>
/* 16×32 칸을 3배로: 0줄 넷째 칸(앞을 본 모습) */
.avatar-front {
  width: 48px;
  height: 96px;
  background-size: 2688px 288px;
  background-position: -144px 0;
  image-rendering: pixelated;
}
</style>
