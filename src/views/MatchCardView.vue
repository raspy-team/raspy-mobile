<template>
  <div class="min-h-dvh bg-canvas flex flex-col">
    <UiTopBar title="맞붙기 카드" back>
      <template #right>
        <UiIconButton icon="fas fa-user-group" label="매치한 사람" @click="openMatches" />
      </template>
    </UiTopBar>

    <main class="flex-1 flex flex-col max-w-md w-full mx-auto px-4 pt-2 pb-10">
      <p v-if="deck?.joined" class="t-caption">
        <template v-if="deck?.areaName">{{ deck.areaName }}, 최근에 들어온 사람부터.</template>
        서로 붙어 보고 싶어야 연결돼요. 넘기면 상대는 몰라요.
      </p>

      <div v-if="loading" class="mt-4 flex-1"><UiSkeleton class="h-[26rem] w-full rounded-2xl" /></div>

      <!-- 나이를 넣지 않았거나 만 19세 미만 -->
      <UiEmptyState v-else-if="blocked" class="mt-16" icon="shield-halved" :title="blocked" description="처음 보는 사람과 만나는 기능이라 성인만 쓸 수 있어요">
        <UiButton variant="secondary" to="/set-profile#age">내 정보에서 나이 넣기</UiButton>
      </UiEmptyState>

      <!-- 처음: 내 카드도 보이게 켜야 시작한다 (본인 모르게 남의 덱에 오르지 않게) -->
      <div v-else-if="deck && !deck.joined" class="mt-10 text-center">
        <UiIcon name="swords" class="text-4xl" aria-hidden="true" />
        <h1 class="t-title mt-4">동네에서 한 판 붙을 사람 찾기</h1>
        <ul class="t-body text-fg-muted mt-4 space-y-2 text-left max-w-xs mx-auto">
          <li>· 켜면 내 카드(닉네임·동네·온도·많이 쓴 능력)가 동네 사람에게 보여요</li>
          <li>· 서로 '붙어 보고 싶어요'를 눌러야만 연결돼요. 넘기면 상대는 몰라요</li>
          <li>· 만 19세 이상만 쓸 수 있고, 언제든 끌 수 있어요</li>
        </ul>
        <UiButton class="mt-8" :loading="busy" @click="setJoined(true)">켜고 시작하기</UiButton>
      </div>

      <UiEmptyState
        v-else-if="!current"
        class="mt-16"
        icon="user-group"
        title="지금은 새 카드가 없어요"
        description="동네 범위를 넓히거나, 내일 다시 와 보세요. 경기를 열어 두면 동네 사람이 먼저 신청할 수도 있어요"
      >
        <div class="flex gap-2 justify-center">
          <UiButton variant="secondary" to="/neighborhood">동네 범위</UiButton>
          <UiButton to="/create-game">경기 열기</UiButton>
        </div>
      </UiEmptyState>

      <template v-else>
        <!-- 카드 한 장. 옆으로 밀어도 되고 아래 버튼을 눌러도 된다 -->
        <div class="mt-4">
          <article
            :key="current.userId"
            class="relative rounded-2xl bg-surface border border-line p-5 flex flex-col touch-pan-y select-none ui-appear"
            :style="cardStyle"
            :aria-label="`${current.nickname} 카드`"
            @pointerdown="onDown"
            @pointermove="onMove"
            @pointerup="onUp"
            @pointercancel="onUp"
          >
            <span v-if="dx > 40" class="absolute top-5 left-5 rotate-[-12deg] border-2 border-signal text-signal-fg rounded-md px-2 font-bold">붙자!</span>
            <span v-if="dx < -40" class="absolute top-5 right-5 rotate-[12deg] border-2 border-line-strong text-fg-muted rounded-md px-2 font-bold">넘기기</span>

            <div class="flex flex-col items-center text-center pt-4">
              <UiAvatar :src="current.avatar" :name="current.nickname" size="xl" />
              <h1 class="t-title mt-3">{{ current.nickname }}</h1>
              <p class="t-caption mt-0.5">
                <template v-if="current.dongName"><UiIcon name="location-dot" class="text-xs" aria-hidden="true" /> {{ current.dongName }}</template>{{ current.dongName && seenText(current.lastSeen) ? ' · ' : '' }}{{ seenText(current.lastSeen) }}
              </p>
            </div>

            <TrustCard :trust="current.trust" compact class="mt-5" />
            <p class="t-caption mt-2 text-center">
              만나서 한 경기 {{ current.trust.offlineGames }}번 ·
              <template v-if="current.trust.mannerCount">매너 {{ current.trust.mannerAverage }} ({{ current.trust.mannerCount }}명)</template>
              <template v-else>매너 평가 아직 없음</template>
            </p>

            <div v-if="current.abilities.length" class="flex flex-wrap justify-center gap-1.5 mt-4">
              <UiBadge v-for="a in current.abilities" :key="a">{{ a }}</UiBadge>
            </div>
            <p v-if="current.bio" class="t-body text-fg-muted mt-4 text-center line-clamp-3 break-words">{{ current.bio }}</p>

            <button type="button" class="mt-5 t-micro underline underline-offset-2 self-center" @click="router.push(`/profile/${current.userId}`)">프로필 자세히</button>
          </article>
        </div>

        <div class="flex items-center justify-center gap-4 mt-5">
          <UiButton variant="secondary" size="lg" icon="fas fa-xmark" :disabled="busy" @click="choose(false)">넘기기</UiButton>
          <UiButton size="lg" icon="swords" :disabled="busy || !deck?.likesLeft" @click="choose(true)">붙어 보고 싶어요</UiButton>
        </div>
        <p class="t-micro text-center mt-2">오늘 남은 '붙어 보고 싶어요' {{ deck?.likesLeft ?? 0 }}번</p>
      </template>
    </main>

    <!-- 매치! -->
    <UiSheet :model-value="!!matched" title="맞붙기 매치!" @update:model-value="matched = null">
      <div v-if="matched" class="text-center">
        <UiAvatar :src="matched.avatar" :name="matched.nickname" size="xl" class="mx-auto" />
        <p class="t-heading mt-3">{{ matched.nickname }}님도 한 판 붙어 보고 싶대요</p>
        <p class="t-caption mt-1">메시지로 무엇을, 언제, 어디서 할지 정해 보세요. 처음 만날 땐 사람 많은 곳에서요</p>
        <div class="flex gap-2 mt-5">
          <UiButton class="flex-1" variant="secondary" @click="matched = null">계속 보기</UiButton>
          <UiButton class="flex-1" icon="far fa-paper-plane" :to="`/chat/${matched.userId}`">메시지 보내기</UiButton>
        </div>
      </div>
    </UiSheet>

    <UiSheet v-model="matchesOpen" title="매치한 사람">
      <UiList v-if="matches.length">
        <UiListItem
          v-for="m in matches"
          :key="m.userId"
          :title="m.nickname"
          :subtitle="`${m.trust.temperature.toFixed(1)}° · ${m.trust.label}`"
          chevron
          @click="router.push(`/chat/${m.userId}`)"
        >
          <template #leading><UiAvatar :src="m.avatar" :name="m.nickname" size="sm" /></template>
        </UiListItem>
      </UiList>
      <p v-else class="t-caption py-6 text-center">아직 매치한 사람이 없어요</p>
      <UiButton block variant="ghost" class="mt-4" @click="setJoined(false)">내 카드 끄기</UiButton>
    </UiSheet>
  </div>
</template>

<script setup lang="ts">
// 맞붙기 카드 (/match, 사용자 11/3 '틴더에서 배울 점'): 동네 사람을 한 장씩 보고 붙어 보고 싶으면 오른쪽, 아니면 왼쪽.
// 둘 다 원해야 매치 (거절당할 걱정 없음), 넘기기는 알리지 않는다, 하루 20번. 매치되면 서버가 두 사람에게 알리고 DM 방을 연다
// 만 19세 이상, 스스로 켠 사람만 (처음엔 '켜고 시작하기'). 고른 건 되돌리지 않는다
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { GET, POST } from '@/api/client'
import type { components } from '@/api/schema'
import TrustCard from '../components/profile/TrustCard.vue'
import { UiAvatar, UiBadge, UiButton, UiEmptyState, UiIcon, UiIconButton, UiList, UiListItem, UiSheet, UiSkeleton, UiTopBar } from '../components/ui'
import { useToast } from '../composable/useToast'

type Deck = components['schemas']['MatchDeck']
type Card = Deck['cards'][number]
type Matched = components['schemas']['MatchedPerson']

const router = useRouter()
const { showToast } = useToast()

const loading = ref(true)
const busy = ref(false)
const deck = ref<Deck | null>(null)
const index = ref(0)
const current = computed<Card | undefined>(() => deck.value?.cards[index.value])
const matched = ref<{ userId: number; nickname: string; avatar?: string } | null>(null)
const matches = ref<Matched[]>([])
const matchesOpen = ref(false)
const blocked = ref('')

function seenText(day?: string) {
  if (!day) return ''
  const days = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(day + 'T00:00:00').getTime()) / 86400000)
  return days <= 0 ? '오늘 들어왔어요' : days === 1 ? '어제 들어왔어요' : days < 7 ? `${days}일 전에 들어왔어요` : '일주일 넘게 안 들어왔어요'
}

// 밀기: 화면 너비의 1/4을 넘기면 고른다
const dx = ref(0)
let startX: number | null = null
const cardStyle = computed(() => ({
  transform: `translateX(${dx.value}px) rotate(${dx.value / 20}deg)`,
  transition: startX == null ? 'transform 0.25s ease' : 'none',
}))
function onDown(e: PointerEvent) {
  if ((e.target as HTMLElement).closest('button')) return
  startX = e.clientX
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}
function onMove(e: PointerEvent) {
  if (startX != null) dx.value = e.clientX - startX
}
function onUp() {
  if (startX == null) return
  startX = null
  const limit = window.innerWidth / 4
  if (dx.value > limit && deck.value?.likesLeft) choose(true)
  else if (dx.value < -limit) choose(false)
  else dx.value = 0
}

async function choose(like: boolean) {
  const card = current.value
  if (!card || busy.value) return
  busy.value = true
  dx.value = like ? window.innerWidth : -window.innerWidth
  try {
    const res = (await POST('/api/match-cards/{userId}', { path: { userId: card.userId }, body: { like } })).data
    deck.value!.likesLeft = res.likesLeft
    if (res.matched) matched.value = { userId: card.userId, nickname: card.nickname, avatar: card.avatar }
    index.value += 1
  } catch (e: any) {
    showToast(e.response?.data?.message || '다시 시도해 주세요')
  } finally {
    dx.value = 0
    busy.value = false
  }
  if (!current.value) load()
}

async function load() {
  loading.value = true
  blocked.value = ''
  try {
    deck.value = (await GET('/api/match-cards')).data
    index.value = 0
  } catch (e: any) {
    if (e.response?.status === 400) blocked.value = e.response.data?.message || '쓸 수 없어요'
  } finally {
    loading.value = false
  }
}

async function setJoined(joined: boolean) {
  busy.value = true
  try {
    await POST('/api/match-cards/join', { body: { joined } })
    matchesOpen.value = false
    if (!joined) showToast('내 카드를 껐어요. 동네 사람의 덱에서 빠져요')
    await load()
  } catch (e: any) {
    showToast(e.response?.data?.message || '다시 시도해 주세요')
  } finally {
    busy.value = false
  }
}

async function openMatches() {
  matchesOpen.value = true
  matches.value = (await GET('/api/match-cards/matches')).data
}

onMounted(load)
</script>
