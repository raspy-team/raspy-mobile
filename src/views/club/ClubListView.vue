<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar title="동호회" back />
    <main class="max-w-xl mx-auto px-4 pt-4 pb-16">
      <p class="t-caption">같이 붙고, 같이 기록이 쌓이는 팀이에요. 정모·번개를 잡고, 우리끼리 순위를 보고, 다른 동호회와 교류전을 해요. 이미 있는 동호회는 초대 링크를 단톡방에 올리면 다 같이 들어와요.</p>
      <UiButton block class="mt-4" icon="plus" @click="createOpen = true">동호회 만들기</UiButton>

      <UiSection title="내 동호회" class="mt-8">
        <UiListSkeleton v-if="!mine" :rows="2" />
        <div v-else-if="mine.length" class="space-y-2">
          <ClubRow v-for="c in mine" :key="c.id" :club="c" @click="router.push(`/clubs/${c.id}`)" />
        </div>
        <p v-else class="t-caption">아직 든 동호회가 없어요</p>
      </UiSection>

      <UiSection title="우리 동네 동호회" class="mt-8">
        <UiListSkeleton v-if="!nearby" :rows="2" />
        <div v-else-if="nearby.length" class="space-y-2">
          <ClubRow v-for="c in nearby" :key="c.id" :club="c" @click="router.push(`/clubs/${c.id}`)">
            <UiButton size="sm" variant="secondary" :loading="joining === c.id" @click.stop="join(c)">{{ c.joinMode === 'APPROVAL' ? '신청하기' : '들어가기' }}</UiButton>
          </ClubRow>
        </div>
        <p v-else class="t-caption">동네에 아직 동호회가 없어요. 처음으로 만들어 보세요</p>
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
import { UiButton, UiInput, UiListSkeleton, UiSection, UiSheet, UiTopBar } from '../../components/ui'

type Club = components['schemas']['ClubSummary']
const router = useRouter()
const mine = ref<Club[] | null>(null)
const nearby = ref<Club[] | null>(null)
const joining = ref(0)
const createOpen = ref(false)
const name = ref('')
const intro = ref('')
const creating = ref(false)
const error = ref('')

async function load() {
  const [a, b] = await Promise.all([GET('/api/clubs/mine'), GET('/api/clubs/nearby')])
  mine.value = a.data
  nearby.value = b.data
}

// 승인 가입 동호회는 가입 질문에 답해야 해서 동호회 화면에서 신청한다
async function join(club: Club) {
  const clubId = club.id
  if (club.joinMode === 'APPROVAL') return router.push(`/clubs/${clubId}`)
  joining.value = clubId
  try {
    await POST('/api/clubs/join', { body: { clubId } })
    router.push(`/clubs/${clubId}`)
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
