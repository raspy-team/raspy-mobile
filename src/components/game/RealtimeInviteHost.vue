<template><span hidden /></template>

<script setup lang="ts">
// 앱 어디에 있든 '한 판 붙자'(실시간)를 받으면 그 자리에서 받기를 묻는다.
// 11/13 실제 기기 한 바퀴: 받는 사람은 앱을 켜 두고도 메시지 아이콘의 '1'만 보았고, 보낸 사람은 10분 타이머를 보며 기다렸다.
// 광장은 자기 창이 있어 거기서는 묻지 않는다. 게임 중이면 끊지 않는다(메시지·알림 목록에 남는다)
import { onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { GET, POST } from '@/api/client'
import { onUserEvent } from '../../websocket/userChannel'
import { confirmDialog } from '../../composables/useConfirm'
import { useToast } from '../../composables/useToast'

const route = useRoute()
const router = useRouter()
const { showToast } = useToast()
const BUSY = [/^\/plaza/, /^\/play\/[^/]+\/live/, /^\/games\/\d+\/play/]
let asking = false

async function onInvite(gameId: number) {
  if (asking || BUSY.some((r) => r.test(route.path))) return
  let s
  try {
    s = (await GET('/api/app-games/realtime/{gameId}/invite', { path: { gameId } })).data
  } catch {
    return // 못 보면 묻지 않는다 (메시지에 남아 있다)
  }
  if (!s?.open) return
  asking = true
  const yes = await confirmDialog({
    title: `${s.fromNickname}님이 한 판 붙자고 해요`,
    message: `${s.title} · 받으면 바로 시작해요`,
    confirmText: '받기',
    cancelText: '나중에',
  }).finally(() => (asking = false))
  if (!yes) return
  try {
    const r = (await POST('/api/app-games/realtime/{gameId}/accept', { path: { gameId } })).data
    router.push({ path: `/play/${r.key}/live`, query: { invite: String(gameId) } })
  } catch (e) {
    showToast((e as { response?: { data?: { message?: string } } }).response?.data?.message || '끝난 한 판이에요')
  }
}

let off: (() => void) | null = null
onMounted(() => {
  // 채널은 로그인한 사람에게 App이 연다 (useActiveGamePolling). 여기선 듣기만
  off = onUserEvent((e: { type: string; gameId?: number }) => {
    if (e.type === 'REALTIME_INVITE' && e.gameId) onInvite(e.gameId)
  })
})
onBeforeUnmount(() => off?.())
</script>
