<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar title="동호회" back />
    <main class="max-w-xl mx-auto px-4 pt-4 pb-16">
      <!-- 맨 위는 동호회 일 하나: 만들기. 대회는 목록 맨 아래 한 줄로 (목적 판정 7: 눈이 '만들기'와 '대회' 사이에서 갈렸다) -->
      <UiButton block icon="plus" @click="createOpen = true">동호회 만들기</UiButton>

      <UiEmptyState v-if="loadError" class="mt-8" icon="fas fa-triangle-exclamation" title="동호회를 불러오지 못했어요" description="잠시 뒤 다시 해 주세요">
        <UiButton variant="secondary" @click="load">다시 시도</UiButton>
      </UiEmptyState>

      <!-- 든 동호회가 없으면 칸째 숨긴다: 처음 온 사람이 '없어요'부터 보지 않게, 동네 동호회가 맨 위로 -->
      <UiSection v-if="!loadError && (!mine || mine.length)" title="내 동호회" class="mt-8">
        <UiListSkeleton v-if="!mine" :rows="2" />
        <div v-else class="space-y-2">
          <ClubRow v-for="c in mine" :key="c.id" :club="c" @click="router.push(`/clubs/${c.id}`)" />
        </div>
      </UiSection>

      <UiSection v-if="!loadError" title="우리 동네 동호회" class="mt-8">
        <UiListSkeleton v-if="!nearby" :rows="2" />
        <div v-else-if="nearby.length" class="space-y-2">
          <ClubRow v-for="c in nearby" :key="c.id" :club="c" hide-dong @click="router.push(`/clubs/${c.id}`)">
            <UiButton size="sm" variant="secondary" :loading="joining === c.id" :disabled="c.requested" @click.stop="join(c)">{{ joinLabel(c) }}</UiButton>
          </ClubRow>
        </div>
        <!-- 동네를 인증하지 않았으면 '동네에 없어요'가 아니라 인증부터 -->
        <div v-else-if="hasDong === false" class="flex items-center gap-3">
          <p class="t-caption flex-1 min-w-0">동네를 인증하면 우리 동네 동호회가 보여요</p>
          <UiButton size="sm" variant="secondary" to="/neighborhood">동네 인증</UiButton>
        </div>
        <!-- 우리 동네 목록은 내가 든 동호회를 뺀다: 내 동호회가 있으면 '아직 없어요'가 틀린 말이 된다 -->
        <p v-else class="t-caption">{{ mine?.length ? '내 동호회 말고는 동네에 아직 동호회가 없어요' : '동네에 아직 동호회가 없어요. 처음으로 만들어 보세요' }}</p>
      </UiSection>

      <UiListItem class="mt-8" icon="trophy" title="우리 동네 대회 보기" to="/tournaments" chevron />
    </main>

    <UiSheet v-model="createOpen" title="동호회 만들기">
      <div class="space-y-3">
        <UiInput v-model="name" :maxlength="30" placeholder="이름 (예: 망원 아침 탁구회)" />
        <UiInput v-model="intro" :maxlength="100" placeholder="한 줄 소개 (선택)" />
        <!-- 동네가 없으면 동네 목록에 보이지 않는다. 지키지 못하는 말을 하지 않는다 -->
        <p class="t-caption">{{ hasDong === false ? '동네가 없어 초대 링크로만 들어올 수 있어요. 동네를 인증하면 동네 사람들에게도 보여요' : '지금 동네로 만들어져 동네 사람들에게 보여요' }}</p>
        <UiButton block :loading="creating" :disabled="name.trim().length < 2" @click="create">만들기</UiButton>
        <p v-if="error" class="t-caption text-danger">{{ error }}</p>
      </div>
    </UiSheet>
  </div>
</template>

<script setup lang="ts">
// 동호회 목록 (/clubs): 내 동호회 + 우리 동네 동호회(한 번에 들어가기) + 만들기
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { GET, POST } from '@/api/client'
import type { components } from '@/api/schema'
import ClubRow from '../../components/club/ClubRow.vue'
import { UiButton, UiEmptyState, UiInput, UiListItem, UiListSkeleton, UiSection, UiSheet, UiTopBar } from '../../components/ui'
import { useToast } from '@/composables/useToast'

type Club = components['schemas']['ClubSummary']
const router = useRouter()
const { showToast } = useToast()
const mine = ref<Club[] | null>(null)
const nearby = ref<Club[] | null>(null)
const joining = ref(0)
const createOpen = ref(false)
const name = ref('')
const intro = ref('')
const creating = ref(false)
const error = ref('')

const loadError = ref(false)
const hasDong = ref<boolean | null>(null) // 모르면 null (못 불러와도 목록은 보인다)
async function load() {
  loadError.value = false
  GET('/api/neighborhoods/me').then((r) => { hasDong.value = r.data.neighborhoods.length > 0 }, () => {})
  try {
    const [a, b] = await Promise.all([GET('/api/clubs/mine'), GET('/api/clubs/nearby')])
    mine.value = a.data
    nearby.value = b.data
  } catch {
    loadError.value = true
  }
}

// 버튼 이름이 누르면 일어날 일을 그대로 말한다 (목적 판정 7: "신청"을 눌렀는데 동호회 화면으로만 넘어갔다)
function joinLabel(c: Club) {
  if (c.joinMode !== 'APPROVAL') return '들어가기'
  if (c.requested) return '신청함'
  return c.hasJoinQuestion ? '보고 신청' : '신청'
}

// 가입 질문이 있는 동호회만 동호회 화면에서 답하고 신청한다. 질문이 없으면 이 자리에서 신청
async function join(club: Club) {
  const clubId = club.id
  if (club.joinMode === 'APPROVAL' && club.hasJoinQuestion) return router.push(`/clubs/${clubId}`)
  joining.value = clubId
  try {
    await POST('/api/clubs/join', { body: { clubId } })
    if (club.joinMode === 'APPROVAL') {
      club.requested = true
      // 웹에는 휴대폰 알림이 없어 '알려 드려요'가 지킬 수 없는 약속이었다 (경로 7 리뷰 K9): 어디서 보는지 말한다
      showToast('신청했어요. 운영진이 받으면 알림함에 와요')
      return
    }
    router.push(`/clubs/${clubId}`)
  } catch (e) {
    // 동호회 수 제한 같은 이유가 보이게 (전에는 눌러도 아무 일이 없었다)
    showToast((e as { response?: { data?: { message?: string } } }).response?.data?.message || '들어가지 못했어요. 다시 해 주세요')
  } finally {
    joining.value = 0
  }
}

async function create() {
  creating.value = true
  error.value = ''
  try {
    const made = (await POST('/api/clubs', { body: { name: name.value.trim(), intro: intro.value.trim() || undefined } })).data
    router.push(`/clubs/${made.club.id}?made=1`)
  } catch (e) {
    error.value = (e as { response?: { data?: { message?: string } } }).response?.data?.message || '만들지 못했어요'
  } finally {
    creating.value = false
  }
}

onMounted(load)
</script>
