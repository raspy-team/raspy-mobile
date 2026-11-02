<template>
  <div>
    <!-- 찾기 전 -->
    <div v-if="!found" class="flex flex-col items-center text-center py-6">
      <span class="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center text-2xl" aria-hidden="true">
        <UiIcon name="location-dot" />
      </span>
      <p class="t-heading mt-4">지금 있는 곳으로 동네를 찾아요</p>
      <p class="t-caption mt-1">위치는 동네를 찾는 데만 쓰고 저장하지 않아요</p>
      <p v-if="error" class="t-caption text-danger-fg mt-4" role="alert">{{ error }}</p>
      <UiButton class="mt-6" size="lg" :loading="locating" icon="location-dot" @click="locate">{{ error ? '다시 찾기' : '내 위치로 찾기' }}</UiButton>
    </div>

    <!-- 찾은 동네 -->
    <div v-else class="py-4">
      <p class="t-caption">지금 계신 곳은</p>
      <p class="t-title mt-1">{{ found.name }}</p>
      <p class="t-caption mt-0.5">{{ found.fullName }}</p>

      <!-- 이미 2개면 하나를 바꾼다 -->
      <div v-if="needReplace" class="mt-6">
        <p class="t-label">동네는 {{ maxCount }}개까지예요. 어느 동네 대신 넣을까요?</p>
        <div class="flex flex-wrap gap-2 mt-2">
          <UiChip v-for="n in current" :key="n.code" :selected="replaceCode === n.code" @click="replaceCode = n.code">{{ n.name }}</UiChip>
        </div>
      </div>

      <p v-if="error" class="t-caption text-danger-fg mt-4" role="alert">{{ error }}</p>
      <div class="flex gap-2 mt-6">
        <UiButton variant="secondary" :disabled="saving" @click="reset">다시 찾기</UiButton>
        <UiButton class="flex-1" :loading="saving" :disabled="needReplace && !replaceCode" @click="verify">{{ found.name }}으로 인증하기</UiButton>
      </div>
    </div>

    <!-- 공공누리 제1유형 · CC BY 4.0 출처 표시 (raspy-api resources/neighborhood/README.md) -->
    <p class="t-micro mt-6 text-center">행정동 경계: 통계청 SGIS(공공누리 제1유형) 가공 vuski/admdongkor, CC BY 4.0</p>
  </div>
</template>

<script setup lang="ts">
// 동네 인증: GPS → 서버가 행정동을 찾아 보여 줌 → 맞으면 인증. 가입·내 동네·경기 열기 전에 같이 쓴다
import { ref, computed } from 'vue'
import { GET, POST } from '@/api/client'
import type { components } from '@/api/schema'
import { getPosition, type Position } from '@/utils/geo'
import { UiButton, UiChip } from '../ui'

type Mine = components['schemas']['MyNeighborhoods']
type Found = components['schemas']['DongView']

const props = withDefaults(defineProps<{ current?: Mine['neighborhoods']; maxCount?: number }>(), { current: () => [], maxCount: 2 })
const emit = defineEmits<{ verified: [Mine] }>()

const locating = ref(false)
const saving = ref(false)
const error = ref('')
const found = ref<Found | null>(null)
const pos = ref<Position | null>(null)
const replaceCode = ref('')

const needReplace = computed(() => !!found.value && props.current.length >= props.maxCount && !props.current.some((n) => n.code === found.value!.code))

function reset() {
  found.value = null
  error.value = ''
  replaceCode.value = ''
}

async function locate() {
  locating.value = true
  error.value = ''
  try {
    pos.value = await getPosition()
    const { data } = await GET('/api/neighborhoods/locate', { query: { lat: pos.value.lat, lon: pos.value.lon } })
    if (!data) error.value = '동네를 찾지 못했어요. 한국 안에서만 인증할 수 있어요'
    else found.value = data
  } catch (e: any) {
    error.value = e?.response?.data?.message || e?.message || '위치를 찾지 못했어요'
  } finally {
    locating.value = false
  }
}

async function verify() {
  if (!pos.value) return
  saving.value = true
  error.value = ''
  try {
    const { data } = await POST('/api/neighborhoods/verify', {
      body: { lat: pos.value.lat, lon: pos.value.lon, accuracy: pos.value.accuracy, replaceCode: replaceCode.value || undefined },
    })
    emit('verified', data)
    reset()
  } catch (e: any) {
    error.value = e?.response?.data?.message || '인증하지 못했어요. 잠시 뒤 다시 해 주세요'
  } finally {
    saving.value = false
  }
}
</script>
