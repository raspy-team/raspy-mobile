<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar title="내 정보 공개" back="/settings" />

    <main class="max-w-2xl mx-auto px-4 pt-2 pb-16">
      <p class="t-caption py-3">끄면 나만 봐요. 다른 사람의 화면에는 서버가 빼고 보내요. 짝짓기·나이 제한·동네 경기에는 그대로 써요.</p>

      <UiListSkeleton v-if="loading" :rows="4" />
      <UiEmptyState v-else-if="error" icon="fas fa-triangle-exclamation" title="설정을 불러오지 못했어요">
        <UiButton variant="secondary" @click="load">다시 불러오기</UiButton>
      </UiEmptyState>

      <ul v-else class="divide-y divide-line ui-appear">
        <li v-for="item in ITEMS" :key="item.key" class="flex items-center gap-4 py-4">
          <span class="flex-1 min-w-0">
            <span class="block t-body">{{ item.label }}</span>
            <span class="block t-caption mt-0.5">{{ item.description }}</span>
          </span>
          <span class="t-caption w-8 text-right">{{ settings[item.key] === 'EVERYONE' ? '모두' : '나만' }}</span>
          <UiSwitch
            :model-value="settings[item.key] === 'EVERYONE'"
            :label="`${item.label} 다른 사람에게 보이기`"
            :disabled="savingKey === item.key"
            @update:model-value="toggle(item.key, $event)"
          />
        </li>
      </ul>

      <!-- 소속(조직마다 모두·같은 조직만·숨김)은 설정 > 소속에서 (org-verify) -->
      <UiList v-if="!loading && !error && hasOrgPage" class="mt-6">
        <UiListItem icon="user-group" title="소속" subtitle="인증한 학교·회사를 누가 볼지는 소속에서 정해요" chevron @click="router.push(ORG_PATH)" />
      </UiList>
    </main>
  </div>
</template>

<script setup lang="ts">
// 내 정보 공개 (docs/organizations.md 5). 항목마다 모두/나만. 누르면 바로 저장하고, 실패하면 되돌린다
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { GET, PATCH } from '../../api/client'
import type { components } from '../../api/schema'
import { UiButton, UiEmptyState, UiList, UiListItem, UiListSkeleton, UiSwitch, UiTopBar } from '../../components/ui'
import { useToast } from '../../composable/useToast'

type Settings = components['schemas']['PrivacySettings']
type Key = 'age' | 'gender' | 'region' | 'records'

const ITEMS: { key: Key; label: string; description: string }[] = [
  { key: 'age', label: '나이', description: '프로필에 만 나이' },
  { key: 'gender', label: '성별', description: '프로필에 성별' },
  { key: 'region', label: '동네', description: '프로필의 지금 동네와 적어 둔 지역' },
  { key: 'records', label: '경기 기록·전적', description: '승패·최근 경기·기록 화면, 순위표, 소식 카드, 공유 그림의 이름. 함께 뛴 사람은 그 경기를 봐요' },
]
const ORG_PATH = '/settings/organizations'

const router = useRouter()
// 소속 화면(org-verify)이 붙은 뒤에만 줄을 보인다
const hasOrgPage = router.resolve(ORG_PATH).matched.some((r) => r.path === ORG_PATH)
const { showToast } = useToast()
const settings = ref<Settings>({ age: 'ONLY_ME', gender: 'ONLY_ME', region: 'EVERYONE', records: 'EVERYONE' })
const loading = ref(true)
const error = ref(false)
const savingKey = ref<Key | ''>('')

async function load() {
  loading.value = true
  error.value = false
  try {
    settings.value = (await GET('/api/privacy/me')).data
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

async function toggle(key: Key, on: boolean) {
  const before = settings.value[key]
  settings.value = { ...settings.value, [key]: on ? 'EVERYONE' : 'ONLY_ME' }
  savingKey.value = key
  try {
    settings.value = (await PATCH('/api/privacy/me', { body: { [key]: settings.value[key] } })).data
  } catch {
    settings.value = { ...settings.value, [key]: before }
    showToast('바꾸지 못했어요. 잠시 뒤 다시 해 주세요')
  } finally {
    savingKey.value = ''
  }
}

onMounted(load)
</script>
