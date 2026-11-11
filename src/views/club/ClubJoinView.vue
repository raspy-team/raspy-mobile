<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar title="동호회 초대" back="/" />
    <main class="max-w-xl mx-auto px-4 pt-10 pb-16 text-center">
      <UiSkeleton v-if="!club && !error" class="h-32 w-full" />
      <!-- 연결 오류도 '초대 링크가 맞지 않아요'였고 누를 것이 없었다 (경로 7 리뷰) -->
      <UiEmptyState v-else-if="error" icon="fas fa-triangle-exclamation" :title="error" :description="badLink ? '링크를 보낸 사람에게 새 링크를 받아 주세요' : '잠시 뒤 다시 해 주세요'">
        <UiButton v-if="!badLink" variant="secondary" @click="load">다시 시도</UiButton>
        <UiButton v-else variant="secondary" to="/">처음으로</UiButton>
      </UiEmptyState>
      <template v-else-if="club">
        <span class="w-16 h-16 mx-auto rounded-full bg-surface-2 flex items-center justify-center text-fg-muted" aria-hidden="true"><UiIcon name="users" /></span>
        <p class="t-title mt-4">{{ club.name }}</p>
        <p class="t-caption mt-1">{{ [club.dongName, `멤버 ${club.memberCount}명`].filter(Boolean).join(' · ') }}</p>
        <p v-if="club.intro" class="t-body mt-3">{{ club.intro }}</p>
        <!-- '시작'이 가입을 뜻하는 줄 몰랐다 (경로 7 리뷰) -->
        <UiButton block size="lg" class="mt-8" :loading="joining" @click="join">{{ !signedIn ? '가입하고 들어가기' : club.isMember ? '동호회로 가기' : '들어가기' }}</UiButton>
        <!-- 들어가지 못한 이유(동호회 10개 등)는 카드 아래에. 예전엔 카드가 사라지고 오류 글만 남았다 (경로 7 리뷰) -->
        <p v-if="joinError" class="t-caption text-danger-fg mt-3" role="alert">{{ joinError }}</p>
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

const badLink = ref(false)
const joinError = ref('')
async function load() {
  error.value = ''
  try {
    club.value = (await GET('/api/clubs/invite/{code}', { path: { code } })).data
    return true
  } catch (e) {
    const res = (e as { response?: { status?: number; data?: { message?: string } } }).response
    badLink.value = res?.status === 404 || res?.status === 400
    error.value = badLink.value ? res?.data?.message || '초대 링크가 맞지 않아요' : '동호회를 불러오지 못했어요'
    return false
  }
}
onMounted(async () => {
  if (!(await load())) return
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
  joinError.value = ''
  try {
    const done = (await POST('/api/clubs/join', { body: { code } })).data
    router.replace(`/clubs/${done.club.id}`)
  } catch (e) {
    // 가입 뒤 바로 들어가기(자동)에서도 왜 안 됐는지 보이게
    joinError.value = (e as { response?: { data?: { message?: string } } }).response?.data?.message || '들어가지 못했어요. 다시 해 주세요'
  } finally {
    joining.value = false
  }
}
</script>
