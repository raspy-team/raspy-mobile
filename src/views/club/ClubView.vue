<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar :title="detail?.club.name || '동호회'" back="/clubs" />
    <main class="max-w-xl mx-auto px-4 pt-4 pb-16">
      <UiSkeleton v-if="!detail && !error" class="h-40 w-full" />
      <UiEmptyState v-else-if="error" class="pt-16" icon="fas fa-triangle-exclamation" :title="error" />
      <template v-else-if="detail">
        <p class="t-caption">{{ [detail.club.dongName, `멤버 ${detail.club.memberCount}명`].filter(Boolean).join(' · ') }}</p>
        <p v-if="detail.club.intro" class="t-body mt-2">{{ detail.club.intro }}</p>

        <!-- 막 만든 동호회: 단톡방에 링크부터 -->
        <UiCard v-if="route.query.made && detail.inviteCode" class="mt-4">
          <p class="t-heading">동호회를 만들었어요</p>
          <p class="t-caption mt-1">초대 링크를 동호회 단톡방에 올리면 누르기만 해도 들어와요</p>
        </UiCard>

        <template v-if="detail.club.isMember">
          <UiButton block size="lg" class="mt-5" icon="plus" @click="openGame">동호회 경기 열기</UiButton>
          <UiButton block variant="secondary" class="mt-2" icon="share" @click="share">초대 링크 보내기</UiButton>
        </template>
        <UiButton v-else block size="lg" class="mt-5" :loading="joining" @click="join">들어가기</UiButton>

        <UiSection title="동호회 경기" class="mt-8">
          <div v-if="detail.games.length" class="space-y-2">
            <UiCard v-for="g in detail.games" :key="g.gameId" class="py-3 cursor-pointer active:bg-surface-2" role="button" @click="router.push(`/game?id=${g.gameId}`)">
              <p class="t-heading">{{ g.title }}</p>
              <p class="t-caption mt-0.5">{{ g.hostNickname }}님이 열었어요 · {{ STATUS[g.status] || g.status }}</p>
            </UiCard>
          </div>
          <p v-else class="t-caption">아직 동호회 경기가 없어요. 경기를 열면 멤버 모두에게 알림이 가요</p>
        </UiSection>

        <UiSection :title="`멤버 ${detail.members.length}`" class="mt-8">
          <UiList>
            <UiListItem v-for="m in detail.members" :key="m.userId" :title="m.nickname" :subtitle="m.isOwner ? '만든 사람' : undefined" :to="`/profile/${m.userId}`">
              <template #leading><UiAvatar :src="m.profilePicture || undefined" :name="m.nickname" :user-id="m.userId" size="sm" /></template>
            </UiListItem>
          </UiList>
        </UiSection>

        <UiButton v-if="detail.club.isMember" block variant="ghost" class="mt-8 text-danger" @click="leave">동호회 나가기</UiButton>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
// 동호회 한 곳 (/clubs/:id). 하는 일은 하나: 멤버에게 경기를 열어 알리기. 게시판·채팅은 단톡방에 맡긴다
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { GET, POST } from '@/api/client'
import type { components } from '@/api/schema'
import { shareLink } from '@/utils/share'
import { confirmDialog } from '@/composables/useConfirm'
import { useToast } from '@/composable/useToast'
import { UiAvatar, UiButton, UiCard, UiEmptyState, UiList, UiListItem, UiSection, UiSkeleton, UiTopBar } from '../../components/ui'

const STATUS: Record<string, string> = { MATCHING: '모집 중', SCHEDULED: '시작 예정', IN_PROGRESS: '하는 중', RESULT_PENDING: '결과 확인 중', COMPLETED: '끝남', CANCELED: '취소' }
const route = useRoute()
const router = useRouter()
const { showToast } = useToast()
const detail = ref<components['schemas']['ClubDetail'] | null>(null)
const error = ref('')
const joining = ref(false)
const id = Number(route.params.id)

async function load() {
  try {
    detail.value = (await GET('/api/clubs/{id}', { path: { id } })).data
  } catch {
    error.value = '동호회를 찾지 못했어요'
  }
}

async function join() {
  joining.value = true
  try {
    detail.value = (await POST('/api/clubs/join', { body: { clubId: id } })).data
  } finally {
    joining.value = false
  }
}

// 규칙을 고르고 오는 동안 어느 동호회인지 기억해 둔다 (경기 만들기 화면이 꺼내 쓴다)
function openGame() {
  sessionStorage.setItem('match_club_for_game', String(id))
  router.push('/rules?fromGameCreate=true')
}

async function share() {
  if (!detail.value?.inviteCode) return
  const msg = await shareLink(`${window.location.origin}/club/join/${detail.value.inviteCode}`, `${detail.value.club.name} 매치 동호회에 들어와요. 경기가 열리면 알림이 가요`)
  if (msg) showToast(msg)
}

async function leave() {
  if (!(await confirmDialog({ title: '동호회를 나갈까요?', message: '동호회 경기 알림이 더는 오지 않아요', confirmText: '나가기', danger: true }))) return
  await POST('/api/clubs/{id}/leave', { path: { id } })
  router.replace('/clubs')
}

onMounted(load)
</script>
