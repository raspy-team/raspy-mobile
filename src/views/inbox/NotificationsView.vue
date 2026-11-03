<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar title="알림" back>
      <template #right>
        <UiButton v-if="hasUnread" size="sm" variant="ghost" @click="readAll">모두 읽음</UiButton>
        <UiIconButton icon="fas fa-gear" label="알림 설정" @click="router.push('/settings/notifications')" />
      </template>
    </UiTopBar>

    <main class="max-w-2xl mx-auto px-4 pb-16">
      <UiPullIndicator :pull="pull" :refreshing="refreshing" />

      <UiListSkeleton v-if="!inbox.loaded" :rows="6" />

      <template v-else>
        <!-- 친구 요청: 알림과 섞지 않고 맨 위 한 줄 -->
        <button
          v-if="inbox.friendRequests.length"
          type="button"
          class="w-full flex items-center gap-3 py-4 border-b border-line text-left"
          @click="requestsOpen = true"
        >
          <span class="relative flex -space-x-3">
            <UiAvatar v-for="r in inbox.friendRequests.slice(0, 2)" :key="r.id" :src="r.avatar" :name="r.nickname" :user-id="r.id" size="md" class="ring-2 ring-canvas" />
          </span>
          <span class="flex-1 min-w-0">
            <span class="block t-heading">친구 요청 {{ inbox.friendRequests.length }}개</span>
            <span class="block t-caption truncate">{{ inbox.friendRequests.map((r) => r.nickname).join(', ') }}</span>
          </span>
          <span class="w-2 h-2 rounded-full bg-primary" aria-hidden="true"></span>
          <UiIcon name="fas fa-chevron-right" class="text-fg-subtle text-sm" aria-hidden="true" />
        </button>

        <!-- 비었을 때: 무엇이 오는지 보여주고 설정으로 -->
        <section v-if="!groups.length && !inbox.friendRequests.length" class="pt-10">
          <UiEmptyState icon="far fa-bell" title="새 알림이 없어요" description="이럴 때 알려드려요" class="!pb-6" />
          <UiList>
            <UiListItem plain icon="user-plus" title="누가 내 경기에 신청했을 때" />
            <UiListItem plain icon="clipboard-check" title="상대가 결과를 확인해 달라고 할 때" />
            <UiListItem plain icon="comment" title="댓글·친구 요청·메시지가 왔을 때" />
          </UiList>
          <UiButton block variant="ghost" class="mt-3" to="/settings/notifications">알림 설정</UiButton>
        </section>

        <section v-for="g in groups" :key="g.label" class="pt-6 ui-appear">
          <h2 class="t-label mb-1">{{ g.label }}</h2>
          <ul>
            <li v-for="item in g.items" :key="item.head.id">
              <button
                type="button"
                class="w-full flex items-start gap-3 py-3 text-left rounded-lg -mx-2 px-2 active:bg-surface-2 transition-colors"
                @click="open(item)"
              >
                <span class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" :class="kind(item.head.type).bg">
                  <UiIcon :name="kind(item.head.type).icon" aria-hidden="true" />
                </span>
                <span class="flex-1 min-w-0">
                  <span class="block text-sm leading-snug" :class="item.unread ? 'text-fg font-medium' : 'text-fg-muted'">{{ item.head.title }}</span>
                  <span v-if="item.head.message && item.head.message !== item.head.title" class="block t-caption mt-0.5 line-clamp-2">{{ item.head.message }}</span>
                  <span class="block t-micro mt-1">
                    {{ timeAgo(item.head.createdAt) }}<template v-if="item.more"> · 비슷한 알림 {{ item.more }}개 더</template>
                  </span>
                </span>
                <span v-if="item.unread" class="w-2 h-2 mt-2 rounded-full bg-primary flex-shrink-0" aria-label="안 읽음"></span>
              </button>
            </li>
          </ul>
        </section>
      </template>
    </main>

    <!-- 친구 요청 -->
    <UiSheet v-model="requestsOpen" :title="`친구 요청 ${inbox.friendRequests.length}개`">
      <UiList v-if="inbox.friendRequests.length">
        <UiListItem v-for="r in inbox.friendRequests" :key="r.id" plain :title="r.nickname" :subtitle="r.intro || (r.username ? `@${r.username}` : '')">
          <template #leading>
            <button type="button" :aria-label="`${r.nickname} 프로필`" @click="goProfile(r.id)"><UiAvatar :src="r.avatar" :name="r.nickname" :user-id="r.id" size="sm" /></button>
          </template>
          <template #trailing>
            <span class="flex gap-1.5">
              <UiButton size="sm" :loading="busyId === r.id && busyKind === 'accept'" :disabled="busyId === r.id" @click="answer(r, 'accept')">수락</UiButton>
              <UiButton size="sm" variant="secondary" :loading="busyId === r.id && busyKind === 'reject'" :disabled="busyId === r.id" @click="answer(r, 'reject')">거절</UiButton>
            </span>
          </template>
        </UiListItem>
      </UiList>
      <UiEmptyState v-else icon="fas fa-user-check" title="모두 답했어요" />
    </UiSheet>
  </div>
</template>

<script setup>
// 알림: 친구 요청은 맨 위 한 줄로, 나머지는 오늘·어제·이번 주로 나누고 같은 경기의 같은 종류는 묶는다
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../api/api'
import {
  UiAvatar, UiButton, UiEmptyState, UiIconButton, UiList, UiListItem, UiListSkeleton, UiPullIndicator, UiSheet, UiTopBar,
} from '../../components/ui'
import { useToast } from '../../composable/useToast'
import { usePullToRefresh } from '../../composables/usePullToRefresh'
import { markAllNotificationsRead, markNotificationRead, refreshInbox, useInbox } from '../../stores/inbox'
import { timeAgo } from '../../utils/format'

const router = useRouter()
const { showToast } = useToast()
const { inbox } = useInbox()
const { pull, refreshing } = usePullToRefresh(refreshInbox)

const requestsOpen = ref(false)
const busyId = ref(null)
const busyKind = ref('')

// 종류 → 아이콘·색 (색은 의미가 있을 때만)
const KINDS = {
  GAME: { icon: 'fas fa-trophy', bg: 'bg-primary-soft text-primary' },
  CHALLENGE: { icon: 'fas fa-bolt', bg: 'bg-primary-soft text-primary' },
  FRIEND: { icon: 'fas fa-user-group', bg: 'bg-surface-2 text-fg' },
  COMMENT: { icon: 'far fa-comment', bg: 'bg-surface-2 text-fg' },
  LIKE: { icon: 'fas fa-heart', bg: 'bg-danger-soft text-danger-fg' },
  OTHER: { icon: 'far fa-bell', bg: 'bg-surface-2 text-fg' },
}
function kind(type = '') {
  if (type.startsWith('PLAY_WITH_ME_TOO')) return KINDS.CHALLENGE
  if (type.startsWith('FRIEND')) return KINDS.FRIEND
  if (type.includes('COMMENT')) return KINDS.COMMENT
  if (type === 'GAME_LIKE') return KINDS.LIKE
  if (type.startsWith('GAME') || ['INBOX', 'MY_GAME', 'CREATOR_NEW_GAME'].includes(type)) return KINDS.GAME
  return KINDS.OTHER
}

function dayLabel(iso) {
  const d = new Date(iso)
  const today = new Date()
  const start = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diff = Math.round((start(today) - start(d)) / 86400000)
  return diff <= 0 ? '오늘' : diff === 1 ? '어제' : '이번 주'
}

// 같은 날, 같은 종류, 같은 이동 주소(같은 경기)는 하나로 묶는다 ("비슷한 알림 N개 더")
const groups = computed(() => {
  const out = []
  for (const n of inbox.notifications) {
    const label = dayLabel(n.createdAt)
    let g = out.find((x) => x.label === label)
    if (!g) out.push((g = { label, items: [] }))
    const same = g.items.find((it) => it.head.type === n.type && it.head.url && it.head.url === n.url)
    if (same) {
      same.more++
      same.all.push(n)
      same.unread = same.unread || !n.isRead
    } else g.items.push({ head: n, more: 0, all: [n], unread: !n.isRead })
  }
  return out
})
const hasUnread = computed(() => inbox.notifications.some((n) => !n.isRead))

async function open(item) {
  item.all.forEach(markNotificationRead)
  const url = item.head.url
  if (!url) return
  try {
    const u = new URL(url, window.location.origin)
    router.push(u.pathname + u.search + u.hash)
  } catch {
    router.push(url)
  }
}
async function readAll() {
  try {
    await markAllNotificationsRead()
  } catch {
    showToast('처리하지 못했어요. 잠시 뒤 다시 시도해주세요')
  }
}
async function answer(r, kindName) {
  busyId.value = r.id
  busyKind.value = kindName
  try {
    // 주소를 그대로 적어 둔다 (빌드 때 서버에 있는 API인지 검사한다)
    if (kindName === 'accept') await api.post(`/api/friends/accept/${r.id}`)
    else await api.post(`/api/friends/reject/${r.id}`)
    showToast(kindName === 'accept' ? `${r.nickname}님과 친구가 됐어요` : '요청을 거절했어요')
    inbox.friendRequests = inbox.friendRequests.filter((x) => x.id !== r.id)
    if (!inbox.friendRequests.length) requestsOpen.value = false
  } catch (e) {
    showToast(e.response?.data?.message || '처리하지 못했어요. 잠시 뒤 다시 시도해주세요')
  } finally {
    busyId.value = null
  }
}
function goProfile(id) {
  requestsOpen.value = false
  router.push('/profile/' + id)
}

onMounted(refreshInbox)
</script>
