<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar title="메시지" back>
      <template #right>
        <UiIconButton icon="fas fa-pen-to-square" label="새 메시지" @click="openFriends" />
      </template>
    </UiTopBar>

    <main class="max-w-2xl mx-auto px-4 pb-16">
      <UiPullIndicator :pull="pull" :refreshing="refreshing" />
      <UiListSkeleton v-if="loading" :rows="6" />

      <UiEmptyState v-else-if="error" class="pt-16" icon="fas fa-triangle-exclamation" title="메시지를 불러오지 못했어요" description="잠시 뒤 다시 해 주세요">
        <UiButton variant="secondary" @click="load">다시 불러오기</UiButton>
      </UiEmptyState>

      <UiEmptyState v-else-if="!rooms.length" class="pt-16" mascot="match" title="아직 주고받은 메시지가 없어요">
        <UiButton @click="openFriends">친구에게 메시지 보내기</UiButton>
      </UiEmptyState>

      <ul v-else class="ui-appear">
        <li v-for="dm in rooms" :key="dm.targetUserId">
          <button type="button" class="w-full flex items-center gap-3 py-3 text-left rounded-lg -mx-2 px-2 active:bg-surface-2 transition-colors" @click="router.push(`/chat/${dm.targetUserId}`)">
            <UiAvatar :src="dm.targetUserProfileUrl" :name="dm.targetUserNickname" :user-id="dm.targetUserId" size="md" />
            <span class="flex-1 min-w-0">
              <span class="flex items-baseline gap-2">
                <span class="flex-1 truncate" :class="dm.unreadCount ? 't-heading' : 't-body'">{{ dm.targetUserNickname }}</span>
                <span class="t-micro flex-shrink-0">{{ dm.lastMessageTimestamp ? timeAgo(dm.lastMessageTimestamp) : '' }}</span>
              </span>
              <span class="flex items-center gap-2 mt-0.5">
                <span class="flex-1 truncate text-sm" :class="dm.unreadCount ? 'text-fg' : 'text-fg-muted'">{{ dm.lastMessageContent || '대화를 시작해 보세요' }}</span>
                <span v-if="dm.unreadCount" class="min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-on text-xs font-bold leading-5 text-center flex-shrink-0" :aria-label="`안 읽은 메시지 ${dm.unreadCount}개`">
                  {{ dm.unreadCount > 99 ? '99+' : dm.unreadCount }}
                </span>
              </span>
            </span>
          </button>
        </li>
      </ul>
    </main>

    <!-- 새 메시지: 친구 고르기 -->
    <UiSheet v-model="friendsOpen" title="누구에게 보낼까요?">
      <UiListSkeleton v-if="friendsLoading" :rows="4" />
      <UiList v-else-if="friends.length">
        <UiListItem v-for="f in friends" :key="f.id" :title="f.nickname" :subtitle="`@${f.username}`" chevron @click="startChat(f.id)">
          <template #leading><UiAvatar :src="f.avatar" :name="f.nickname" :user-id="f.id" size="sm" /></template>
        </UiListItem>
      </UiList>
      <UiEmptyState v-else mascot="match" title="아직 친구가 없어요" description="경기를 함께한 사람의 프로필에서 메시지를 보낼 수 있어요" />
    </UiSheet>
  </div>
</template>

<script setup>
// 메시지 목록: 안 읽은 방은 굵게 + 개수. 새 메시지가 오면(서버 신호) 다시 불러온다
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api/api'
import {
  UiAvatar, UiButton, UiEmptyState, UiIconButton, UiList, UiListItem, UiListSkeleton, UiPullIndicator, UiSheet, UiTopBar,
} from '../components/ui'
import { usePullToRefresh } from '../composables/usePullToRefresh'
import { refreshInbox } from '../stores/inbox'
import { timeAgo } from '../utils/format'
import { refreshOnChange } from '../websocket/userChannel'

const router = useRouter()
const rooms = ref([])
const loading = ref(true)
const error = ref(false)
const friendsOpen = ref(false)
const friendsLoading = ref(false)
const friends = ref([])

async function load() {
  error.value = false
  try {
    rooms.value = (await api.get('/api/chat-room/my-dm-rooms')).data
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}
const { pull, refreshing } = usePullToRefresh(load)

async function openFriends() {
  friendsOpen.value = true
  friendsLoading.value = true
  try {
    friends.value = (await api.get('/api/friends/my', { params: { userId: 0 } })).data
  } catch {
    friends.value = []
  } finally {
    friendsLoading.value = false
  }
}
function startChat(id) {
  friendsOpen.value = false
  router.push(`/chat/${id}`)
}

let stop = null
onMounted(() => {
  load()
  refreshInbox()
  stop = refreshOnChange(load)
})
onBeforeUnmount(() => stop?.())
</script>
