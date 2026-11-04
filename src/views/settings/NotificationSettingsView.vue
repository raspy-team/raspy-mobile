<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar title="알림 설정" back />

    <main class="max-w-2xl mx-auto px-4 pt-2 pb-16">
      <p class="t-caption py-3">끈 알림은 휴대폰으로 오지 않아요. 앱 안 알림 목록에는 그대로 남아요.</p>

      <UiListSkeleton v-if="loading" :rows="8" />
      <UiEmptyState v-else-if="error" icon="fas fa-triangle-exclamation" title="설정을 불러오지 못했어요">
        <UiButton variant="secondary" @click="load">다시 불러오기</UiButton>
      </UiEmptyState>

      <ul v-else class="divide-y divide-line ui-appear">
        <li v-for="s in settings" :key="s.category" class="flex items-center gap-4 py-4">
          <span class="flex-1 min-w-0">
            <span class="block t-body">{{ s.label }}</span>
            <span class="block t-caption mt-0.5">{{ s.description }}</span>
          </span>
          <UiSwitch :model-value="s.enabled" :label="`${s.label} 알림`" :disabled="savingKey === s.category" @update:model-value="toggle(s, $event)" />
        </li>
      </ul>
    </main>
  </div>
</template>

<script setup>
// 알림 종류별 켜기·끄기. 누르면 바로 저장하고, 실패하면 되돌린다
import { ref, onMounted } from 'vue'
import api from '../../api/api'
import { UiButton, UiEmptyState, UiListSkeleton, UiSwitch, UiTopBar } from '../../components/ui'
import { useToast } from '../../composable/useToast'

const { showToast } = useToast()
const settings = ref([])
const loading = ref(true)
const error = ref(false)
const savingKey = ref('')

async function load() {
  loading.value = true
  error.value = false
  try {
    settings.value = (await api.get('/api/notification-settings')).data
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

async function toggle(s, enabled) {
  s.enabled = enabled
  savingKey.value = s.category
  try {
    await api.put(`/api/notification-settings/${s.category}`, { enabled })
  } catch {
    s.enabled = !enabled
    showToast('바꾸지 못했어요. 잠시 뒤 다시 해 주세요')
  } finally {
    savingKey.value = ''
  }
}

onMounted(load)
</script>
