<template>
  <!-- 주고받은 '한 판 붙자' (11/14 피터로 걷기): 보낸 뒤 내 경기에 아무것도 없어 보낸 줄 몰랐고, 받은 사람은 메시지 방을 찾아 들어가야 받을 수 있었다.
       받은 것은 여기서 바로 받고, 보낸 것은 답을 기다리는 중이라고 보인다. 받으면 그 자리에서 경기가 된다 -->
  <section v-if="rows.length">
    <h2 class="t-label mb-2">한 판 붙자</h2>
    <ul class="rounded-xl bg-surface divide-y divide-line">
      <li v-for="r in rows" :key="r.id" class="flex items-center gap-3 px-4 py-3">
        <RouterLink :to="`/chat/${r.other}`" class="flex-1 min-w-0">
          <span class="block t-body text-fg truncate">{{ r.mine ? `${r.name}님에게 붙자고 했어요` : `${r.name}님이 붙자고 해요` }}</span>
          <span class="block t-micro truncate">{{ r.ruleTitle }}{{ r.mine ? ' · 답을 기다리는 중' : '' }}</span>
        </RouterLink>
        <template v-if="!r.mine">
          <UiButton size="sm" :loading="busy === r.id" @click="accept(r)">받기</UiButton>
          <UiButton size="sm" variant="ghost" :disabled="busy === r.id" @click="reject(r)">거절</UiButton>
        </template>
        <UiButton v-else size="sm" variant="ghost" :loading="busy === r.id" @click="cancel(r)">취소</UiButton>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { playWithMeTooAPI } from '../../api/api'
import { UiButton } from '../ui'
import { useToast } from '../../composables/useToast'
import { refreshOnChange } from '../../websocket/userChannel'
import { useRoute, useRouter } from 'vue-router'

type Row = { id: number; mine: boolean; other: number; name: string; ruleTitle: string }
const emit = defineEmits<{ (e: 'count', n: number): void; (e: 'changed'): void }>()
const { showToast } = useToast()
const route = useRoute()
const router = useRouter()
const rows = ref<Row[]>([])
const busy = ref<number | null>(null)

async function load() {
  try {
    const [got, sent] = await Promise.all([playWithMeTooAPI.getReceivedRequests(), playWithMeTooAPI.getSentRequests()])
    const pending = (l: any[]) => (l ?? []).filter((x) => x.status === 'PENDING')
    rows.value = [
      ...pending(got).map((x) => ({ id: x.id, mine: false, other: x.fromUserId, name: x.fromUserNickname, ruleTitle: x.ruleTitle })),
      ...pending(sent).map((x) => ({ id: x.id, mine: true, other: x.toUserId, name: x.toUserNickname, ruleTitle: x.ruleTitle })),
    ]
  } catch {
    rows.value = [] // 못 불러오면 칸째 숨긴다. 메시지 방에는 그대로 있다
  }
  emit('count', rows.value.length)
}
async function act(r: Row, run: () => Promise<unknown>, done: string) {
  busy.value = r.id
  try {
    await run()
    showToast(done)
    await load()
    emit('changed')
  } catch (e) {
    showToast((e as { response?: { data?: { message?: string } } }).response?.data?.message || '하지 못했어요. 다시 해 주세요')
  } finally {
    busy.value = null
  }
}
// 받으면 경기가 생긴다: 그 경기가 있는 내 경기로 데려간다 (홈에서 받으면 아무 일도 안 일어난 것처럼 보였다)
const accept = async (r: Row) => {
  await act(r, () => playWithMeTooAPI.acceptRequest(r.other), `${r.name}님과 경기가 잡혔어요. 시간과 장소를 정해 보세요`)
  if (route.path !== '/game') router.push('/game')
}
const reject = (r: Row) => act(r, () => playWithMeTooAPI.rejectRequest(r.other), '거절했어요')
const cancel = (r: Row) => act(r, () => playWithMeTooAPI.cancelRequest(r.other), '취소했어요')

let stop: (() => void) | null = null
onMounted(() => { load(); stop = refreshOnChange(load) })
onBeforeUnmount(() => stop?.())
</script>
