<template>
  <UiSheet :model-value="modelValue" :title="title" @update:model-value="(v) => emit('update:modelValue', v)">
    <p class="t-caption mb-4">신고하면 <strong class="text-fg">운영진이 바로 확인하고 조치해요.</strong> 상대에게는 누가 신고했는지 알리지 않아요</p>
    <div class="flex flex-wrap gap-2 mb-4">
      <UiChip v-for="r in reasons" :key="r" :selected="reason === r" @click="reason = r">{{ r }}</UiChip>
    </div>
    <UiInput v-if="reason === '기타'" v-model="detail" multiline :rows="3" placeholder="자세히 적어 주세요" />
    <template #footer>
      <UiButton block variant="danger" :disabled="!ready" :loading="sending" @click="submit">신고하기</UiButton>
    </template>
  </UiSheet>
</template>

<script setup>
// 신고 한 곳 (안전·신뢰 A, 11/3). 서버가 돌려주는 한 줄("운영진이 바로 확인하고 조치해요")을 그대로 보여 준다.
// 서로 다른 3명이 30일 안에 신고하면 운영진이 확인하는 동안 7일 정지된다 (서버 SanctionService)
import { computed, ref, watch, defineProps, defineEmits } from 'vue'
import { UiButton, UiChip, UiInput, UiSheet } from '../ui'
import { POST } from '../../api/client'
import { useToast } from '../../composable/useToast'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '신고할까요?' },
  targetType: { type: String, required: true },
  targetId: { type: Number, default: null },
  /** 맥락 (채팅방 번호 등). 운영진이 앞뒤를 본다 */
  context: { type: String, default: null },
  reasons: { type: Array, default: () => ['욕설·비방', '성희롱·불쾌한 요구', '노쇼·비매너', '사칭·사기', '기타'] },
})
const emit = defineEmits(['update:modelValue', 'done'])
const { showToast } = useToast()

const reason = ref('')
const detail = ref('')
const sending = ref(false)
watch(() => props.modelValue, (open) => { if (open) { reason.value = ''; detail.value = '' } })
const ready = computed(() => !!reason.value && (reason.value !== '기타' || !!detail.value.trim()))

async function submit() {
  sending.value = true
  try {
    const text = reason.value === '기타' ? detail.value.trim() : reason.value
    const { data } = await POST('/api/reports', { body: { targetType: props.targetType, targetId: props.targetId, reason: text, context: props.context } })
    showToast(data?.message || '신고가 접수됐어요. 운영진이 바로 확인하고 조치해요')
    emit('done')
  } catch (e) {
    showToast(e?.response?.data?.message || '신고하지 못했어요. 잠시 뒤 다시 해 주세요')
  } finally {
    sending.value = false
    emit('update:modelValue', false)
  }
}
</script>
