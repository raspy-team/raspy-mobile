<template>
  <div v-if="list && (anyButton || list.tonight || list.lobbies.length || showEmpty)">
    <!-- 아무거나 바로 붙기: 어느 게임이든 기다리는 사람에게, 없으면 오늘 밤의 게임으로 (docs/lobby.md 5) -->
    <template v-if="anyButton">
      <UiButton block :disabled="joining" @click="joinAny">아무거나 바로 붙기</UiButton>
      <p class="t-micro text-center mt-2 mb-4">{{ anyLine }}</p>
    </template>
    <!-- 오늘 밤의 게임: 밤 9시대에 사람을 게임 하나에 모은다 (docs/lobby.md 4-C) -->
    <UiCard v-if="list.tonight" class="flex items-center gap-3 py-3 mb-3" :class="list.goldenHour ? 'bg-signal-soft' : ''">
      <UiIcon :name="gameIcon(list.tonight.key, list.tonight.icon)" class="text-fg-muted" />
      <div class="flex-1 min-w-0">
        <p class="t-label truncate">{{ list.goldenHour ? `지금은 ${list.tonight.title} 시간` : `오늘 밤 ${nightHour}시 · ${list.tonight.title}` }}</p>
        <p class="t-micro tabular-nums">{{ list.goldenHour ? `${nightHour}시대에는 이 게임에 사람이 모여요` : `${left} 남음 · ${list.nightAlarm ? '' : '켜면 '}${nightHour - 1}시 55분에 알려 드려요` }}</p>
      </div>
      <UiButton v-if="list.goldenHour" size="sm" @click="join(list.tonight.key)">바로 하기</UiButton>
      <UiSwitch v-else :model-value="list.nightAlarm" :disabled="saving" label="8시 55분에 알려 주기" @update:model-value="setAlarm" />
    </UiCard>
    <UiSection v-if="list.lobbies.length || showEmpty" :title="title">
      <div v-if="list.lobbies.length" class="space-y-2">
        <UiCard v-for="l in list.lobbies" :key="l.gameId" class="flex items-center gap-3 py-3">
          <UiIcon :name="gameIcon(l.key, l.icon)" class="text-fg-muted" />
          <div class="flex-1 min-w-0">
            <p class="t-label truncate">{{ l.nickname }}님 · {{ l.title }}</p>
            <p class="t-micro tabular-nums">{{ l.waitedSeconds + since }}초째 기다리는 중</p>
          </div>
          <UiButton size="sm" @click="join(l.key)">붙기</UiButton>
        </UiCard>
      </div>
      <p v-else class="t-caption">지금 기다리는 사람이 없어요. 매일 밤 {{ nightHour }}시대{{ list.tonight ? `, ${list.tonight.title}에` : '에' }} 가장 많이 모여요</p>
    </UiSection>
  </div>
</template>

<script setup lang="ts">
import { gameIcon } from '@/utils/appGameIcon'
// 지금 기다리는 사람: 사람이 적을 때 게임마다 흩어지면 서로 못 만난다. 누가 어디서 기다리는지 보여 주고 한 번에 붙게 한다
// 목록은 /topic/lobbies 신호가 올 때만 다시 불러온다 (폴링하지 않는다)
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { GET, POST } from '@/api/client'
import type { components } from '@/api/schema'
import { onLobbyChange, openUserChannel } from '@/websocket/userChannel'
import { UiButton, UiCard, UiIcon, UiSection, UiSwitch } from '../ui'

const props = withDefaults(defineProps<{ title?: string; showEmpty?: boolean; excludeGameId?: number; anyButton?: boolean }>(), { title: '지금 기다리는 사람', showEmpty: false, excludeGameId: 0, anyButton: false })
const emit = defineEmits<{ join: [key: string] }>()
const router = useRouter()
const list = ref<components['schemas']['LobbyList'] | null>(null)
// 불러온 뒤 흐른 초 (화면 시계로만 센다. 서버에 다시 묻지 않는다)
const since = ref(0)
let loadedAt = Date.now()
const tick = setInterval(() => { since.value = Math.floor((Date.now() - loadedAt) / 1000) }, 1000)

function show(data: components['schemas']['LobbyList']) {
  list.value = { ...data, lobbies: data.lobbies.filter((l) => l.gameId !== props.excludeGameId) }
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
  } finally {
    saving.value = false
  }
}

const anyLine = computed(() => {
  const n = list.value?.lobbies.length ?? 0
  if (n) return `지금 ${n}명이 기다려요. 실력이 가까운 사람과 바로 붙어요`
  return list.value?.tonight ? `기다리는 사람이 없으면 ${list.value.tonight.title}에서 상대를 기다려요` : '기다리는 사람이 없으면 상대를 기다려요'
})

// 붙을 게임은 서버가 정한다. 그 게임 화면으로 가면 들어가 있는 판을 이어서 보여 준다
const joining = ref(false)
async function joinAny() {
  joining.value = true
  try {
    const state = (await POST('/api/app-games/realtime/any')).data
    emit('join', state.key)
    router.push(`/play/${state.key}/live`)
  } finally {
    joining.value = false
  }
}

function join(key: string) {
  emit('join', key)
  router.push(`/play/${key}/live`)
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
