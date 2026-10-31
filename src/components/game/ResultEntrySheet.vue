<template>
  <UiSheet :model-value="modelValue" title="결과만 입력" @update:model-value="emit('update:modelValue', $event)">
    <p class="t-caption mb-4">한 세트만 해도 돼요. 안 한 세트는 비워두세요. {{ opponentName }}님이 확인하면 기록돼요.</p>

    <div class="grid grid-cols-[3rem_1fr_1fr_2.75rem] items-center gap-2 mb-1">
      <span></span>
      <span class="t-label text-center truncate">나</span>
      <span class="t-label text-center truncate">{{ opponentName }}</span>
      <span></span>
    </div>
    <ol class="space-y-2">
      <li v-for="(set, i) in sets" :key="set.key" class="grid grid-cols-[3rem_1fr_1fr_2.75rem] items-center gap-2">
        <span class="t-caption">{{ i + 1 }}세트</span>
        <input
          v-model.number="set.my"
          type="number"
          inputmode="numeric"
          min="0"
          max="999"
          class="ui-control h-12 text-center tabular-nums"
          :aria-label="`${i + 1}세트 내 점수`"
        />
        <input
          v-model.number="set.opponent"
          type="number"
          inputmode="numeric"
          min="0"
          max="999"
          class="ui-control h-12 text-center tabular-nums"
          :aria-label="`${i + 1}세트 ${opponentName} 점수`"
        />
        <UiIconButton v-if="sets.length > 1" icon="fas fa-xmark" :label="`${i + 1}세트 지우기`" @click="sets.splice(i, 1)" />
      </li>
    </ol>
    <UiButton v-if="sets.length < 9" variant="ghost" icon="fas fa-plus" class="mt-2" @click="addSet">세트 추가</UiButton>
    <p v-if="error" class="text-sm text-danger-fg mt-3" role="alert">{{ error }}</p>

    <template #footer>
      <UiButton block size="lg" :loading="submitting" @click="submit">결과 내기</UiButton>
    </template>
  </UiSheet>
</template>

<script setup>
// 점수판 없이, 경기가 끝난 뒤 세트별 점수만 낸다. 상대가 확인하면 확정된다
import { ref, watch, defineProps, defineEmits } from 'vue'
import { POST } from '../../api/client'
import { UiButton, UiIconButton, UiSheet } from '../ui'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  gameId: { type: [Number, String], required: true },
  opponentName: { type: String, default: '상대' },
  setCount: { type: Number, default: 1 }, // 규칙의 총 세트 수. 처음 칸 수로만 쓴다
})
const emit = defineEmits(['update:modelValue', 'submitted'])

let nextKey = 0
const blank = () => ({ key: nextKey++, my: null, opponent: null })
const sets = ref([])
const error = ref('')
const submitting = ref(false)

// 열 때마다 비워서 시작. 과반만 이기면 끝나므로 처음엔 과반 수만큼 칸을 둔다
watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    const first = Math.max(1, Math.min(9, Math.floor(props.setCount / 2) + 1))
    sets.value = Array.from({ length: first }, blank)
    error.value = ''
  },
  { immediate: true },
)

const addSet = () => sets.value.push(blank())

async function submit() {
  const valid = (n) => Number.isInteger(n) && n >= 0 && n <= 999
  const empty = (n) => n === null || n === ''
  // 두 칸 다 빈 세트는 안 한 세트로 본다 (칸은 넉넉히 두므로)
  const played = sets.value.filter((s) => !(empty(s.my) && empty(s.opponent)))
  if (!played.length || !played.every((s) => valid(s.my) && valid(s.opponent))) {
    error.value = played.length ? '세트마다 두 사람 점수를 0~999 사이로 넣어주세요' : '한 세트 이상 점수를 넣어주세요'
    return
  }
  submitting.value = true
  error.value = ''
  try {
    await POST('/api/games/{id}/result', {
      path: { id: Number(props.gameId) },
      body: { sets: played.map((s) => ({ myScore: s.my, opponentScore: s.opponent })) },
    })
    emit('update:modelValue', false)
    emit('submitted')
  } catch (e) {
    error.value = e.response?.data?.message || '결과를 내지 못했어요. 다시 시도해 주세요'
  } finally {
    submitting.value = false
  }
}
</script>
