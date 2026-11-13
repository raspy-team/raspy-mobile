<template>
  <!-- 내가 보낸 한 판을 친구들이 풀었다 (임기응변 등급, 가입 전). 손님에게는 알림이 없어서 다시 오면 여기서 안다.
       누가 이겼는지·친구 답은 가입하면 본다 (11/14 초대받은 1:1: 예전엔 여기서 승패를 다 보여 가입할 이유가 없었다) -->
  <UiCard v-if="rows.length">
    <p class="t-title">내 링크로 친구 {{ rows.length }}명이 풀었어요</p>
    <p class="t-caption mt-1 break-keep">누가 이겼는지, 친구가 뭐라고 답했는지는 가입하면 바로 보여요. 친구도 가입하면 둘의 1:1 기록으로 남아요</p>
    <UiButton block class="mt-3" @click="emit('join')">누가 이겼는지 보기</UiButton>
  </UiCard>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { GET } from '@/api/client'
import type { components } from '@/api/schema'
import { UiButton, UiCard } from '../ui'

type Sent = components['schemas']['SentChallenge']

const props = defineProps<{ visitorId: string }>()
const emit = defineEmits<{ (e: 'join'): void }>()
const rows = ref<Sent[]>([])

onMounted(async () => {
  if (!props.visitorId) return
  try {
    rows.value = (await GET('/api/guest/plays/challenges', { query: { visitorId: props.visitorId, key: 'improv' } })).data ?? []
  } catch {
    // 못 불러와도 판은 그대로 한다
  }
})
</script>
