<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar title="동호회 초대" back="/" />
    <main class="max-w-xl mx-auto px-4 pt-10 pb-16 text-center">
      <UiSkeleton v-if="!club && !error" class="h-32 w-full" />
      <UiEmptyState v-else-if="error" icon="fas fa-triangle-exclamation" :title="error" />
      <template v-else-if="club">
        <span class="w-16 h-16 mx-auto rounded-full bg-surface-2 flex items-center justify-center text-fg-muted" aria-hidden="true"><UiIcon name="users" /></span>
        <p class="t-title mt-4">{{ club.name }}</p>
        <p class="t-caption mt-1">{{ [club.dongName, `멤버 ${club.memberCount}명`].filter(Boolean).join(' · ') }}</p>
        <p v-if="club.intro" class="t-body mt-3">{{ club.intro }}</p>
        <UiButton block size="lg" class="mt-8" :loading="joining" @click="join">{{ !signedIn ? '시작하고 들어가기' : club.isMember ? '동호회로 가기' : '들어가기' }}</UiButton>
        <p class="t-caption mt-2">들어가면 동호회 경기가 열릴 때 알림이 와요</p>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
// 동호회 초대 링크 (/club/join/:code). 기존 동호회 단톡방에 올린 링크를 누르면 한 번에 들어온다
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { GET, POST } from '@/api/client'
import type { components } from '@/api/schema'
import { rememberReturnTo } from '@/utils/authRedirect'
import { UiButton, UiEmptyState, UiIcon, UiSkeleton, UiTopBar } from '../../components/ui'

const route = useRoute()
const router = useRouter()
const code = String(route.params.code)
const club = ref<components['schemas']['ClubSummary'] | null>(null)
const error = ref('')
const joining = ref(false)

onMounted(async () => {
  try {
    club.value = (await GET('/api/clubs/invite/{code}', { path: { code } })).data
  } catch {
    error.value = '초대 링크가 맞지 않아요'
    return
  }
  // '시작하고 들어가기'로 가입하고 돌아왔으면 한 번 더 누르게 하지 않고 바로 들어간다 (11/4 밤샘)
  if (signedIn && route.query.join) join()
})

// 가입 전이면 시작 화면으로. 가입·로그인이 끝나면 이 주소로 돌아와 들어간다
const signedIn = !!localStorage.getItem('raspy_access_token2')
async function join() {
  if (!club.value) return
  if (!signedIn) {
    rememberReturnTo(`${route.path}?join=1`)
    router.push('/init')
    return
  }
  joining.value = true
  try {
    const done = (await POST('/api/clubs/join', { body: { code } })).data
    router.replace(`/clubs/${done.club.id}`)
  } catch (e) {
    // 가입 뒤 바로 들어가기(자동)에서도 왜 안 됐는지 보이게
    error.value = (e as { response?: { data?: { message?: string } } }).response?.data?.message || '들어가지 못했어요. 다시 해 주세요'
  } finally {
    joining.value = false
  }
}
</script>
