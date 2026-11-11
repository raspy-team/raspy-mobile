<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar title="알림 설정" back />

    <main class="max-w-2xl mx-auto px-4 pt-2 pb-16">
      <!-- 이 기기가 휴대폰 알림을 받는지, 받게 켜는 곳이 없었다 (경로 6 리뷰 P6) -->
      <div class="rounded-xl bg-surface px-4 py-4 mt-2">
        <template v-if="isCapacitorApp">
          <p class="t-body">휴대폰 알림</p>
          <p class="t-caption mt-0.5">결과·도전장·내 차례를 휴대폰으로 받아요. 허락 창이 뜨면 '허용'을 눌러 주세요</p>
          <UiButton size="sm" variant="secondary" class="mt-3" @click="turnOnPush">휴대폰 알림 켜기</UiButton>
        </template>
        <template v-else>
          <p class="t-body">알림은 알림함에 모여요</p>
          <p class="t-caption mt-0.5">웹에서는 휴대폰으로 알림이 오지 않아요. 위 종 모양에서 확인해 주세요. 매치 앱에서는 휴대폰으로도 와요</p>
        </template>
      </div>
      <p class="t-caption py-3">끈 알림은 휴대폰으로 오지 않아요</p>

      <UiListSkeleton v-if="loading" :rows="8" />
      <UiEmptyState v-else-if="error" icon="fas fa-triangle-exclamation" title="설정을 불러오지 못했어요">
        <UiButton variant="secondary" @click="load">다시 시도</UiButton>
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
import { useToast } from '../../composables/useToast'
import { askPushPermission, isCapacitorApp } from '../../utils/nativeBridge'

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

function turnOnPush() {
  askPushPermission()
  showToast('켰어요. 알림이 안 오면 휴대폰 설정 > 매치 > 알림을 켜 주세요')
}

onMounted(load)
</script>
