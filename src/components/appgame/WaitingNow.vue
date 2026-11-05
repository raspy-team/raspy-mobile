<template>
  <div v-if="list && (anyButton || list.tonight || list.lobbies.length || residents.length || showEmpty)">
    <!-- 아무거나 바로 붙기: 어느 게임이든 기다리는 사람에게, 없으면 오늘 밤의 게임으로 (docs/lobby.md 5) -->
    <template v-if="anyButton">
      <UiButton block class="mb-4" :disabled="joining" @click="joinAny">아무거나 바로 붙기</UiButton>
    </template>
    <!-- 오늘 밤의 게임: 밤 9시대에 사람을 게임 하나에 모은다 (docs/lobby.md 4-C) -->
    <UiCard v-if="list.tonight" class="flex items-center gap-3 py-3 mb-3" :class="list.goldenHour ? 'bg-signal-soft' : ''">
      <UiIcon :name="gameIcon(list.tonight.key, list.tonight.icon)" class="text-fg-muted" />
      <div class="flex-1 min-w-0">
        <p class="t-label truncate">{{ list.goldenHour ? `지금은 ${list.tonight.title} 시간` : `오늘 밤 ${nightHour}시 · ${list.tonight.title}` }}</p>
        <!-- 좁은 화면에서 '8시 / 55분'처럼 시각이 갈라지지 않게 덩어리마다 줄을 바꾼다 (11/5 c6 320 검토) -->
        <p v-if="!list.goldenHour" class="t-micro tabular-nums">{{ left }} 남음</p>
      </div>
      <UiButton v-if="list.goldenHour" size="sm" @click="join(list.tonight.key)">바로 하기</UiButton>
      <UiSwitch v-else :model-value="list.nightAlarm" :disabled="saving" :label="`${nightHour - 1}시 55분에 알려 주기`" @update:model-value="setAlarm" />
    </UiCard>
    <UiSection v-if="list.lobbies.length || residents.length || showEmpty" :title="title">
      <div v-if="list.lobbies.length || residents.length" class="space-y-2">
        <UiCard v-for="l in list.lobbies" :key="l.gameId" class="flex items-center gap-3 py-3">
          <UiIcon :name="gameIcon(l.key, l.icon)" class="text-fg-muted" />
          <div class="flex-1 min-w-0">
            <p class="t-label truncate">{{ l.nickname }}님 · {{ l.title }}</p>
            <p class="t-micro tabular-nums">{{ l.waitedSeconds + since }}초째 기다리는 중</p>
          </div>
          <UiButton size="sm" @click="join(l.key)">참여</UiButton>
        </UiCard>
        <!-- 사람이 2명보다 적으면 AI 주민이 기다린다 (docs/ai-residents.md 6). 누르면 그 AI와 바로 한 판. 사람이 늘면 서버가 빼 준다 -->
        <UiCard v-for="r in residents" :key="`ai-${r.userId}`" class="flex items-center gap-3 py-3">
          <!-- AI 주민 자리는 게임 아이콘 대신 비비 (docs/mascots.md). 게임 이름은 오른쪽 글에 있다 -->
          <MatchMascot who="bibi" :size="24" class="-mx-0.5" />
          <div class="flex-1 min-w-0">
            <p class="t-label flex items-center min-w-0"><span class="truncate">{{ r.nickname }}</span><UiAiBadge /><span class="truncate">&nbsp;· {{ r.title }}</span></p>
            <p class="t-micro">기다리는 중</p>
          </div>
          <UiButton size="sm" variant="secondary" :disabled="joining" @click="playAi(r)">한 판</UiButton>
        </UiCard>
      </div>
      <!-- AI 주민만 기다릴 때 '기다리는 사람이 없어요'라고 하면 바로 위 목록과 어긋난다 (first10 검토) -->
      <p v-if="!list.lobbies.length && !residents.length" class="t-caption">지금 기다리는 사람이 없어요</p>
    </UiSection>
  </div>
</template>

<script setup lang="ts">
import { gameIcon } from '@/utils/appGameIcon'
import MatchMascot from '../mascot/MatchMascot.vue'
// 지금 기다리는 사람: 사람이 적을 때 게임마다 흩어지면 서로 못 만난다. 누가 어디서 기다리는지 보여 주고 한 번에 붙게 한다
// 목록은 /topic/lobbies 신호가 올 때만 다시 불러온다 (폴링하지 않는다)
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { GET, POST } from '@/api/client'
import { track } from '@/utils/trackLog'
import type { components } from '@/api/schema'
import { onLobbyChange, openUserChannel } from '@/websocket/userChannel'
import { UiAiBadge, UiButton, UiCard, UiIcon, UiSection, UiSwitch } from '../ui'
import { liveRoute } from '@/utils/battle'
import { waitText } from '@/utils/format'
import { useToast } from '../../composables/useToast'

const { showToast } = useToast()

// ai: 기다리는 AI 주민을 보일까. 내 대기실 안(RealtimeView)에서는 끈다: 거기서 AI와 붙으면 기다리던 내 방이 남는다
const props = withDefaults(defineProps<{ title?: string; showEmpty?: boolean; excludeGameId?: number; anyButton?: boolean; ai?: boolean }>(), { title: '지금 기다리는 사람', showEmpty: false, excludeGameId: 0, anyButton: false, ai: true })
const emit = defineEmits<{ join: [key: string] }>()
const router = useRouter()
const list = ref<components['schemas']['LobbyList'] | null>(null)
// 불러온 뒤 흐른 초 (화면 시계로만 센다. 서버에 다시 묻지 않는다)
let aiShown = false
const since = ref(0)
let loadedAt = Date.now()
const tick = setInterval(() => { since.value = Math.floor((Date.now() - loadedAt) / 1000) }, 1000)

function show(data: components['schemas']['LobbyList']) {
  list.value = { ...data, lobbies: data.lobbies.filter((l) => l.gameId !== props.excludeGameId) }
  // 대기실에 AI 주민을 보인 때는 원본 기록에 ai=true로 (docs/ai-residents.md '숫자는 따로'). 같은 화면에서 다시 불러와도 한 번
  if (props.ai && data.residents?.length && !aiShown) {
    aiShown = true
    track('lobby_ai_shown', { step: data.residents.length, value: 'ai=true' })
  }
  loadedAt = Date.now()
  since.value = 0
}

async function load() {
  try {
    show((await GET('/api/app-games/realtime/lobbies')).data)
  } catch {
    // 목록은 덤이라 실패해도 화면은 그대로
  }
}

type Resident = components['schemas']['LobbyResident']
const residents = computed<Resident[]>(() => (props.ai ? list.value?.residents ?? [] : []))

// 서버는 24시간제(21)로 준다. 화면은 '밤 9시'
const nightHour = computed(() => (list.value ? list.value.goldenHourStart % 12 || 12 : 9))

// 오늘 밤 9시까지 남은 시간: 서버 시각 기준으로, 불러온 뒤 흐른 시간은 화면 시계로 센다
const left = computed(() => {
  const t = list.value?.tonight
  if (!t || !list.value) return ''
  const minutes = Math.max(0, Math.ceil((Date.parse(t.startsAt) - Date.parse(list.value.serverNow)) / 60000 - since.value / 60))
  return minutes >= 60 ? `${Math.floor(minutes / 60)}시간 ${minutes % 60}분` : `${minutes}분`
})

const saving = ref(false)
async function setAlarm(on: boolean) {
  saving.value = true
  try {
    show((await POST('/api/app-games/realtime/night-alarm', { body: { on } })).data)
  } catch {
    // 스위치는 서버 값(list)을 따르니 그대로 돌아간다. 아무 말 없이 안 바뀐 것처럼 보이지 않게 알린다
    showToast('알림을 바꾸지 못했어요. 잠시 뒤 다시 해 주세요')
  } finally {
    saving.value = false
  }
}

// 붙을 게임은 서버가 정한다. 그 게임 화면으로 가면 들어가 있는 판을 이어서 보여 준다
const joining = ref(false)
async function joinAny() {
  joining.value = true
  try {
    const state = (await POST('/api/app-games/realtime/any')).data
    emit('join', state.key)
    router.push(liveRoute(state.key))
  } catch (e) {
    showToast((e as { response?: { data?: { message?: string } } }).response?.data?.message || '붙지 못했어요. 잠시 뒤 다시 해 주세요')
  } finally {
    joining.value = false
  }
}

// AI 주민과 바로 한 판: 기다리는 사람에게 붙지 않고 그 AI가 바로 들어온 판으로 간다
async function playAi(r: Resident) {
  joining.value = true
  track('lobby_ai_play', { gameKey: r.key, value: 'ai=true' })
  try {
    await POST('/api/app-games/{key}/realtime/ai', { path: { key: r.key }, query: { botId: r.userId } })
    emit('join', r.key)
    router.push(`/play/${r.key}/live`)
  } finally {
    joining.value = false
  }
}

function join(key: string) {
  emit('join', key)
  router.push(liveRoute(key))
}

let off: (() => void) | undefined
onMounted(() => {
  load()
  openUserChannel()
  off = onLobbyChange(load)
})
onBeforeUnmount(() => {
  off?.()
  clearInterval(tick)
})
</script>
