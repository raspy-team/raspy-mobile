<template>
  <div v-if="list && (list.lobbies.length || showEmpty)">
    <p v-if="list.goldenHour" class="t-caption rounded-xl bg-signal-soft px-3 py-2 mb-3">지금은 붙는 시간이에요 (밤 {{ list.goldenHourStart }}시대). 봇을 늦게 불러 사람끼리 만나기 쉬워요</p>
    <UiSection :title="title">
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
      <p v-else class="t-caption">지금 기다리는 사람이 없어요. 매일 밤 {{ list.goldenHourStart }}시대에 가장 많이 모여요</p>
    </UiSection>
  </div>
</template>

<script setup lang="ts">
import { gameIcon } from '@/utils/appGameIcon'
// 지금 기다리는 사람: 사람이 적을 때 게임마다 흩어지면 서로 못 만난다. 누가 어디서 기다리는지 보여 주고 한 번에 붙게 한다
// 목록은 /topic/lobbies 신호가 올 때만 다시 불러온다 (폴링하지 않는다)
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { GET } from '@/api/client'
import type { components } from '@/api/schema'
import { onLobbyChange, openUserChannel } from '@/websocket/userChannel'
import { UiButton, UiCard, UiIcon, UiSection } from '../ui'

const props = withDefaults(defineProps<{ title?: string; showEmpty?: boolean; excludeGameId?: number }>(), { title: '지금 기다리는 사람', showEmpty: false, excludeGameId: 0 })
const emit = defineEmits<{ join: [key: string] }>()
const router = useRouter()
const list = ref<components['schemas']['LobbyList'] | null>(null)
// 불러온 뒤 흐른 초 (화면 시계로만 센다. 서버에 다시 묻지 않는다)
const since = ref(0)
let loadedAt = Date.now()
const tick = setInterval(() => { since.value = Math.floor((Date.now() - loadedAt) / 1000) }, 1000)

async function load() {
  try {
    const data = (await GET('/api/app-games/realtime/lobbies')).data
    list.value = { ...data, lobbies: data.lobbies.filter((l) => l.gameId !== props.excludeGameId) }
    loadedAt = Date.now()
    since.value = 0
  } catch {
    // 목록은 덤이라 실패해도 화면은 그대로
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
