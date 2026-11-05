<template>
  <!-- 팀 경기 단톡방 (11/5 C): 팀 대 팀·여럿이 각자에서 승인된 사람끼리 시간·장소를 맞추고 늦음을 알린다 -->
  <div class="min-h-dvh bg-canvas flex flex-col">
    <UiTopBar :title="title" :back="`/games/${gameId}`" />

    <!-- 누가 있나: 얼굴 줄 -->
    <div v-if="info" class="px-4 pt-2 pb-3 border-b border-line">
      <div class="flex items-center gap-2 overflow-x-auto no-scrollbar">
        <button v-for="m in info.members" :key="m.userId" type="button" class="flex flex-col items-center gap-1 w-14 flex-shrink-0" :aria-label="m.nickname" @click="router.push(`/profile/${m.userId}`)">
          <UiAvatar :src="m.profileUrl || undefined" :name="m.nickname" :user-id="m.userId" size="sm" />
          <span class="t-micro truncate max-w-full">{{ m.userId === me ? '나' : m.nickname }}</span>
          <span v-if="m.team != null" class="t-micro text-fg-subtle">{{ TEAM_NAMES[m.team] }}</span>
        </button>
      </div>
      <p class="t-label text-fg mt-2">{{ [info.ruleTitle, matchTime(info.matchDate)].join(' · ') }}</p>
      <p class="t-caption mt-0.5">{{ info.writable ? '승인된 사람만 들어와요. 경기에서 빠지면 이 방에서도 나가요' : closedLine }}</p>
    </div>

    <main ref="listRef" class="flex-1 overflow-y-auto px-4 py-3 space-y-2" :style="{ paddingBottom: info?.writable ? '88px' : '24px' }" aria-live="polite">
      <UiListSkeleton v-if="loading" :rows="4" />
      <UiEmptyState v-else-if="error" class="pt-16" icon="fas fa-triangle-exclamation" :title="error">
        <UiButton :to="`/games/${gameId}`">경기로 돌아가기</UiButton>
      </UiEmptyState>
      <UiEmptyState v-else-if="!talks.length" class="pt-12" mascot="match" title="첫 말을 남겨 보세요" description="언제 어디서 볼지, 늦으면 몇 분 늦는지 여기서 나눠요">
        <div class="flex flex-wrap justify-center gap-2">
          <UiChip v-for="q in QUICK" :key="q" :disabled="!info?.writable" @click="send(q)">{{ q }}</UiChip>
        </div>
      </UiEmptyState>
      <template v-else>
        <template v-for="(m, i) in talks" :key="m.id ?? i">
          <p v-if="newDay(i)" class="text-center t-micro py-2">{{ day(m.timestamp) }}</p>
          <div v-if="m.senderId === me" class="flex justify-end items-end gap-1.5 pl-12">
            <span class="t-micro pb-1 flex-shrink-0">{{ time(m.timestamp) }}</span>
            <p class="px-3.5 py-2.5 rounded-2xl rounded-br-md bg-primary text-primary-on text-sm whitespace-pre-line break-words">{{ m.content }}</p>
          </div>
          <div v-else class="flex items-end gap-2 pr-12">
            <UiAvatar v-if="firstOfRun(i)" :src="avatarOf(m.senderId)" :name="m.sender" :user-id="m.senderId" size="xs" class="mb-0.5" />
            <span v-else class="w-6 flex-shrink-0" aria-hidden="true"></span>
            <div class="min-w-0">
              <p v-if="firstOfRun(i)" class="t-micro mb-0.5">{{ m.sender }}</p>
              <p class="px-3.5 py-2.5 rounded-2xl rounded-bl-md bg-surface-2 text-fg text-sm whitespace-pre-line break-words">{{ m.content }}</p>
            </div>
            <span class="t-micro pb-1 flex-shrink-0">{{ time(m.timestamp) }}</span>
          </div>
        </template>
      </template>
    </main>

    <!-- 쓰기: 닫힌 방이면 숨긴다 -->
    <div v-if="info?.writable" class="fixed bottom-0 inset-x-0 z-header bg-canvas border-t border-line pb-safe">
      <div v-if="talks.length" class="flex gap-2 px-3 pt-2 overflow-x-auto no-scrollbar">
        <UiChip v-for="q in QUICK" :key="q" @click="send(q)">{{ q }}</UiChip>
      </div>
      <form class="px-3 py-2 flex items-end gap-2" @submit.prevent="send()">
        <textarea v-model="draft" rows="1" class="ui-control py-3 resize-none flex-1" placeholder="메시지 보내기" enterkeyhint="send" aria-label="메시지" maxlength="1000" @keydown.enter.exact="onEnter" />
        <button type="submit" aria-label="보내기" :disabled="!draft.trim()" class="w-12 h-12 flex-shrink-0 rounded-full bg-primary text-primary-on flex items-center justify-center active:bg-primary-press disabled:bg-surface-2 disabled:text-fg-subtle transition-colors">
          <UiIcon name="fas fa-paper-plane" aria-hidden="true" />
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
// 팀 경기 단톡방. 방은 서버 TeamChatService가 연다(승인된 둘 이상). 메시지는 DM과 같은 웹소켓 길(/app/chat/{roomId})을 쓴다.
// 멤버가 바뀌거나 경기가 끝나 닫히는 것은 내 채널 신호(refreshOnChange)로 다시 불러온다 (폴링하지 않는다)
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { GET } from '@/api/client'
import api from '@/api/api'
import type { components } from '@/api/schema'
import { socket } from '@/websocket'
import { refreshOnChange } from '@/websocket/userChannel'
import { getMyId } from '@/utils/me'
import { useToast } from '@/composable/useToast'
import { matchTime } from '@/utils/format'
import { TEAM_NAMES } from '@/utils/gameFormat'
import { UiAvatar, UiButton, UiChip, UiEmptyState, UiIcon, UiListSkeleton, UiTopBar } from '@/components/ui'

type Info = components['schemas']['TeamChatInfo']
type Msg = { id?: number; sender: string; senderId: number; content: string; timestamp: string; messageType: string }

const QUICK = ['저 가는 중이에요', '10분쯤 늦어요', '도착했어요', '시간 바꿀까요?']

const route = useRoute()
const router = useRouter()
const gameId = Number(route.params.gameId)
const info = ref<Info | null>(null)
const messages = ref<Msg[]>([])
const loading = ref(true)
const error = ref('')
const draft = ref('')
const me = ref<number | null>(null)
const listRef = ref<HTMLElement | null>(null)

const title = computed(() => (info.value ? `단톡방 · ${info.value.members.length}명` : '단톡방'))
const talks = computed(() => messages.value.filter((m) => m.messageType === 'TALK'))
// 끝난 경기는 3일 뒤, 취소된 경기는 바로 읽기만 된다 (서버 TeamChatService.closesAt)
const closedLine = '이 방은 이제 읽기만 할 수 있어요'

const avatarOf = (id: number) => info.value?.members.find((m) => m.userId === id)?.profileUrl || undefined
const firstOfRun = (i: number) => i === 0 || talks.value[i - 1].senderId !== talks.value[i].senderId || newDay(i)
const day = (t: string) => { const d = new Date(t); return `${d.getMonth() + 1}월 ${d.getDate()}일` }
const time = (t: string) => new Date(t).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })
const newDay = (i: number) => i === 0 || day(talks.value[i - 1].timestamp) !== day(talks.value[i].timestamp)

function scrollToBottom() {
  nextTick(() => { if (listRef.value) listRef.value.scrollTop = listRef.value.scrollHeight })
}

async function load() {
  try {
    info.value = (await GET('/api/games/{gameId}/team-chat', { path: { gameId } })).data
    const { data } = await api.get(`/api/chat-room/${info.value.roomId}/chat-messages`)
    messages.value = data
    error.value = ''
    scrollToBottom()
  } catch (e) {
    error.value = (e as { response?: { data?: { message?: string } } }).response?.data?.message || '단톡방을 열지 못했어요'
  } finally {
    loading.value = false
  }
}

function send(text?: string) {
  const content = (text ?? draft.value).trim()
  if (!content || !info.value?.writable) return
  // 연결이 끊겨 못 보냈으면 쓴 글을 남기고 알린다 (예전엔 글이 조용히 사라졌다, ChatView와 같이)
  if (!socket.sendChat(info.value.roomId, content)) {
    showToast('연결이 잠시 끊겼어요. 잠시 뒤 다시 보내 주세요')
    return
  }
  if (!text) draft.value = ''
}

// 엔터로 보내기 (줄바꿈은 Shift+엔터). 한글 조합 중의 엔터는 글자 확정이라 보내지 않는다
function onEnter(e: KeyboardEvent) {
  if (e.isComposing || e.keyCode === 229) return
  e.preventDefault()
  send()
}

const { showToast } = useToast()
let stop: (() => void) | null = null
onMounted(async () => {
  me.value = await getMyId()
  await load()
  if (info.value) {
    socket.onMessage((msg: Msg) => {
      messages.value.push(msg)
      if (msg.senderId !== me.value) api.post(`/api/chat-room/${info.value!.roomId}/read`).catch(() => {})
      scrollToBottom()
    })
    socket.connect(info.value.roomId)
  }
  stop = refreshOnChange(load)
})
// 나갈 때 콜백과 방 번호까지 지운다: 남겨 두면 끊긴 소켓이 다시 붙어 이 방의 새 글을 '읽음'으로 보냈다 (ChatView와 같은 문제)
onBeforeUnmount(() => {
  stop?.()
  socket.onMessage(null)
  socket.disconnect({ clearRoomId: true })
})
</script>
