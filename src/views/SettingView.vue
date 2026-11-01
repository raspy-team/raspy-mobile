<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar title="설정" back="/profile/0" />

    <main class="max-w-2xl mx-auto px-4 pt-2 pb-32 space-y-8">
      <!-- 나 -->
      <button type="button" class="w-full flex items-center gap-3 py-3 text-left" @click="router.push('/set-profile')">
        <UiAvatar :src="me.avatar" :name="me.nickname || '나'" size="md" />
        <span class="flex-1 min-w-0">
          <span class="block t-heading truncate">{{ me.nickname || ' ' }}</span>
          <span class="block t-caption truncate">{{ me.username ? `@${me.username}` : '' }}</span>
        </span>
        <span class="t-caption">프로필 편집</span>
        <i class="fas fa-chevron-right text-fg-subtle text-sm" aria-hidden="true"></i>
      </button>

      <UiSection title="알림과 사람">
        <UiList>
          <UiListItem icon="far fa-bell" title="알림 설정" subtitle="경기·도전·친구·댓글·좋아요·메시지" chevron @click="router.push('/settings/notifications')" />
          <UiListItem icon="fas fa-ban" title="차단한 사람" chevron @click="openBlocked" />
        </UiList>
      </UiSection>

      <UiSection v-if="isAdmin" title="운영">
        <UiList>
          <UiListItem icon="fas fa-shield-halved" title="관리자" subtitle="신고·규칙 수정 요청" chevron @click="router.push('/admin')" />
        </UiList>
      </UiSection>

      <UiSection title="도움말과 정보">
        <UiList>
          <UiListItem icon="far fa-envelope" title="문의하기" subtitle="yeonkoh@protonmail.com" chevron @click="contact" />
          <UiListItem icon="fab fa-instagram" title="인스타그램" subtitle="@matchmobileapp" chevron @click="openInstagram" />
          <UiListItem v-for="t in TERMS" :key="t.id" icon="far fa-file-lines" :title="t.title" chevron @click="openTerm = t" />
        </UiList>
      </UiSection>

      <div class="space-y-2">
        <UiButton block variant="secondary" :loading="loggingOut" @click="logout">로그아웃</UiButton>
        <UiButton block variant="ghost" class="text-danger" @click="deleteAccount">계정 삭제</UiButton>
        <p class="text-center t-micro pt-2">Match {{ version }}</p>
      </div>
    </main>

    <!-- 차단한 사람 -->
    <UiSheet v-model="blockedOpen" title="차단한 사람">
      <UiListSkeleton v-if="blockedLoading" :rows="3" />
      <UiList v-else-if="blocked.length">
        <UiListItem v-for="u in blocked" :key="u.id" plain :title="u.nickname">
          <template #leading><UiAvatar :src="u.profile?.profilePicture" :name="u.nickname" size="sm" /></template>
          <template #trailing>
            <UiButton size="sm" variant="secondary" :loading="unblockingId === u.id" @click="unblock(u)">차단 풀기</UiButton>
          </template>
        </UiListItem>
      </UiList>
      <UiEmptyState v-else icon="fas fa-ban" title="차단한 사람이 없어요" />
    </UiSheet>

    <!-- 약관·고지 원문 -->
    <UiSheet :model-value="!!openTerm" :title="openTerm?.title" @update:model-value="openTerm = null">
      <p class="t-caption whitespace-pre-line">{{ openTerm?.body.trim() }}</p>
    </UiSheet>
  </div>
</template>

<script setup>
// 설정: 나 → 알림과 사람 → 도움말과 정보 → 로그아웃 → (맨 아래) 계정 삭제
import { ref, onMounted, defineOptions } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api/api'
import {
  UiAvatar, UiButton, UiEmptyState, UiList, UiListItem, UiListSkeleton, UiSection, UiSheet, UiTopBar,
} from '../components/ui'
import { TERMS } from '../content/legal'
import { confirmDialog } from '../composables/useConfirm'
import { useToast } from '../composable/useToast'
import { stopInbox } from '../stores/inbox'
import { closeUserChannel } from '../websocket/userChannel'
import pkg from '../../package.json'

defineOptions({ name: 'SettingsView' })

const router = useRouter()
const { showToast } = useToast()
const version = pkg.version
const me = ref({})
const openTerm = ref(null)
const blockedOpen = ref(false)
const blockedLoading = ref(false)
const blocked = ref([])
const unblockingId = ref(null)
const loggingOut = ref(false)

function leave() {
  stopInbox()
  closeUserChannel()
  localStorage.removeItem('raspy_access_token2')
  router.replace('/init')
}

async function logout() {
  if (!(await confirmDialog({ title: '로그아웃할까요?', confirmText: '로그아웃' }))) return
  loggingOut.value = true
  // 이 기기로 푸시가 더 오지 않게 (실패해도 로그아웃은 한다)
  await api.post('/api/push/remove-device').catch(() => {})
  leave()
}

async function deleteAccount() {
  const ok = await confirmDialog({
    title: '계정을 삭제할까요?',
    message: '경기 기록·규칙·친구가 모두 지워지고 되돌릴 수 없어요',
    confirmText: '삭제',
    danger: true,
  })
  if (!ok) return
  try {
    await api.post('/api/user/remove')
    leave()
  } catch {
    showToast('삭제하지 못했어요. 잠시 뒤 다시 시도해주세요')
  }
}

async function openBlocked() {
  blockedOpen.value = true
  blockedLoading.value = true
  try {
    blocked.value = (await api.get('/api/block')).data
  } catch {
    blocked.value = []
    showToast('목록을 불러오지 못했어요')
  } finally {
    blockedLoading.value = false
  }
}
async function unblock(u) {
  unblockingId.value = u.id
  try {
    await api.delete(`/api/block/${u.id}`)
    blocked.value = blocked.value.filter((x) => x.id !== u.id)
    showToast(`${u.nickname}님 차단을 풀었어요`)
  } catch {
    showToast('풀지 못했어요. 잠시 뒤 다시 시도해주세요')
  } finally {
    unblockingId.value = null
  }
}

function contact() {
  window.location.href = 'mailto:yeonkoh@protonmail.com?subject=' + encodeURIComponent('[Match] 문의')
}
function openInstagram() {
  window.open('https://www.instagram.com/matchmobileapp/', '_blank', 'noopener')
}

const isAdmin = ref(false)

onMounted(async () => {
  api.get('/api/auth/onboarding').then(({ data }) => (isAdmin.value = !!data.isAdmin)).catch(() => {})
  const { data } = await api.get('/api/user-profile/my/profile').catch(() => ({ data: {} }))
  me.value = { nickname: data.nickname, username: data.username, avatar: data.profilePicture }
})
</script>
