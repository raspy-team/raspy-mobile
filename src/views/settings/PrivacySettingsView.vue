<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar title="내 정보 공개" back="/settings" />

    <main class="max-w-2xl mx-auto px-4 pt-2 pb-16">
      <!-- 스위치와 '모두/나만' 글이 함께 있어 켠 게 숨기는 건지 보이는 건지 헷갈렸다 (경로 6 리뷰): 스위치 하나로, 뜻은 한 줄로 -->
      <p class="t-caption py-3">켜면 다른 사람에게 보이고, 끄면 나만 봐요</p>

      <UiListSkeleton v-if="loading" :rows="4" />
      <UiEmptyState v-else-if="error" icon="fas fa-triangle-exclamation" title="설정을 불러오지 못했어요">
        <UiButton variant="secondary" @click="load">다시 시도</UiButton>
      </UiEmptyState>

      <ul v-else class="divide-y divide-line ui-appear">
        <li v-for="item in ITEMS" :key="item.key" class="flex items-center gap-4 py-4">
          <span class="flex-1 min-w-0">
            <span class="block t-body">{{ item.label }}</span>
            <span v-if="item.description" class="block t-caption mt-0.5">{{ item.description }}</span>
          </span>
          <span class="t-caption whitespace-nowrap text-right">{{ settings[item.key] === 'EVERYONE' ? '보여요' : '나만 봐요' }}</span>
          <UiSwitch
            :model-value="settings[item.key] === 'EVERYONE'"
            :label="`${item.label} 다른 사람에게 보이기`"
            :disabled="saving.includes(item.key)"
            @update:model-value="toggle(item.key, $event)"
          />
        </li>
      </ul>

      <!-- 소속(조직마다 모두·같은 조직만·숨김)은 설정 > 소속에서 (org-verify) -->
      <UiList v-if="!loading && !error && hasOrgPage" class="mt-6">
        <UiListItem icon="building" title="소속" subtitle="인증한 학교·회사를 누가 볼지는 소속에서 정해요" chevron @click="router.push(ORG_PATH)" />
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
import { useToast } from '../../composables/useToast'

type Settings = components['schemas']['PrivacySettings']
type Key = 'age' | 'gender' | 'region' | 'records'

const ITEMS: { key: Key; label: string; description: string }[] = [
  { key: 'age', label: '나이', description: '' },
  { key: 'gender', label: '성별', description: '' },
  { key: 'region', label: '동네', description: '' },
  { key: 'records', label: '경기 기록·전적', description: '함께 뛴 사람은 그 경기를 봐요' },
]
const ORG_PATH = '/settings/organizations'

const router = useRouter()
// 소속 화면(org-verify)이 붙은 뒤에만 줄을 보인다
const hasOrgPage = router.resolve(ORG_PATH).matched.some((r) => r.path === ORG_PATH)
const { showToast } = useToast()
const settings = ref<Settings>({ age: 'ONLY_ME', gender: 'ONLY_ME', region: 'EVERYONE', records: 'EVERYONE' })
const loading = ref(true)
const error = ref(false)
// 저장 중인 항목들 (스위치 둘을 잇달아 눌러도 먼저 끝난 쪽이 다른 쪽의 '저장 중'을 풀지 않게)
const saving = ref<Key[]>([])

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
  saving.value = [...saving.value, key]
  try {
    // 이 항목만 서버 값으로 맞춘다: 다른 스위치를 그사이 눌렀으면 그 값이 이 응답(옛 값)으로 잠깐 되돌아가 보였다
    const saved = (await PATCH('/api/privacy/me', { body: { [key]: settings.value[key] } })).data
    settings.value = { ...settings.value, [key]: saved[key] }
  } catch {
    settings.value = { ...settings.value, [key]: before }
    showToast('바꾸지 못했어요. 잠시 뒤 다시 해 주세요')
  } finally {
    saving.value = saving.value.filter((k) => k !== key)
  }
}

onMounted(load)
</script>
