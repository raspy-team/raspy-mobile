<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar title="동호회" back />
    <main class="max-w-xl mx-auto px-4 pt-4 pb-16">
      <p class="t-caption">같이 붙고, 같이 기록이 쌓이는 팀이에요. 정모·번개를 잡고, 우리끼리 순위를 보고, 다른 동호회와 교류전을 해요. 이미 있는 동호회는 초대 링크를 단톡방에 올리면 다 같이 들어와요.</p>
      <div class="flex gap-2 mt-4">
        <UiButton class="flex-1" icon="plus" @click="createOpen = true">동호회 만들기</UiButton>
        <UiButton class="flex-1" variant="secondary" icon="trophy" to="/tournaments">대회</UiButton>
      </div>

      <UiSection title="내 동호회" class="mt-8">
        <UiEmptyState v-if="loadError" icon="fas fa-triangle-exclamation" title="동호회를 불러오지 못했어요" description="잠시 뒤 다시 해 주세요">
          <UiButton variant="secondary" @click="load">다시 불러오기</UiButton>
        </UiEmptyState>
        <UiListSkeleton v-else-if="!mine" :rows="2" />
        <div v-else-if="mine.length" class="space-y-2">
          <ClubRow v-for="c in mine" :key="c.id" :club="c" @click="router.push(`/clubs/${c.id}`)" />
        </div>
        <p v-else class="t-caption">아직 든 동호회가 없어요</p>
      </UiSection>

      <UiSection title="우리 동네 동호회" class="mt-8">
        <p v-if="loadError" class="t-caption">위에서 다시 불러와 주세요</p>
        <UiListSkeleton v-else-if="!nearby" :rows="2" />
        <div v-else-if="nearby.length" class="space-y-2">
          <ClubRow v-for="c in nearby" :key="c.id" :club="c" @click="router.push(`/clubs/${c.id}`)">
            <UiButton size="sm" variant="secondary" :loading="joining === c.id" @click.stop="join(c)">{{ c.joinMode === 'APPROVAL' ? '신청하기' : '들어가기' }}</UiButton>
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
    </main>

    <UiSheet v-model="createOpen" title="동호회 만들기">
      <div class="space-y-3">
        <UiInput v-model="name" :maxlength="30" placeholder="이름 (예: 망원 아침 탁구회)" />
        <UiInput v-model="intro" :maxlength="100" placeholder="한 줄 소개 (선택)" />
        <p class="t-caption">지금 동네로 만들어져 동네 사람들에게 보여요</p>
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
import { UiButton, UiEmptyState, UiInput, UiListSkeleton, UiSection, UiSheet, UiTopBar } from '../../components/ui'
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

// 승인 가입 동호회는 가입 질문에 답해야 해서 동호회 화면에서 신청한다
async function join(club: Club) {
  const clubId = club.id
  if (club.joinMode === 'APPROVAL') return router.push(`/clubs/${clubId}`)
  joining.value = clubId
  try {
    await POST('/api/clubs/join', { body: { clubId } })
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
