<template>
  <div>
    <div class="flex items-center justify-between">
      <span class="t-caption">제시어 3개를 모두 넣어 한 문장을 써 주세요</span>
      <span class="t-mono tabular-nums" :class="remaining <= 20 ? 'text-danger' : 'text-fg-muted'">{{ clock }}</span>
    </div>

    <div class="flex flex-wrap gap-2 mt-3">
      <UiChip v-for="w in words" :key="w" :selected="sentence.includes(w)">{{ w }}</UiChip>
    </div>
    <p class="t-micro mt-2">넣은 제시어는 칠해져요. 다 넣어야 투표에 올라가요</p>

    <div class="mt-5">
      <UiInput v-model="sentence" multiline :rows="4" :maxlength="120" placeholder="마음을 움직이는 한 문장" />
      <p class="t-micro text-right mt-1">{{ sentence.length }}/120</p>
    </div>
    <UiButton block size="lg" class="mt-3" :loading="submitting" :disabled="!allUsed" @click="finish">다 썼어요</UiButton>
    <p class="t-caption text-center mt-2">두 사람의 문장이 모이면 이름을 가리고 24시간 동안 투표를 받아요</p>
  </div>
</template>

<script setup lang="ts">
// 감동 문장 대결 한 판. 시간이 다 되면 쓴 데까지 낸다 (제시어가 빠졌으면 투표에 오르지 않는다)
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { UiButton, UiChip, UiInput } from '../ui'

const props = defineProps<{ problem: string; timeLimitSeconds: number; submitting: boolean }>()
const emit = defineEmits<{ submit: [answer: string] }>()

const words = computed(() => props.problem.split(', '))
const sentence = ref('')
const allUsed = computed(() => words.value.every((w) => sentence.value.includes(w)))
const startedAt = Date.now()
const remaining = ref(props.timeLimitSeconds)
const clock = computed(() => `${Math.floor(remaining.value / 60)}:${String(remaining.value % 60).padStart(2, '0')}`)
let timer: ReturnType<typeof setInterval> | undefined

let done = false
function finish() {
  if (done || props.submitting) return
  done = true
  emit('submit', sentence.value.trim())
}

onMounted(() => {
  timer = setInterval(() => {
    remaining.value = Math.max(0, props.timeLimitSeconds - Math.floor((Date.now() - startedAt) / 1000))
    if (remaining.value === 0) finish()
  }, 500)
})
onBeforeUnmount(() => clearInterval(timer))
</script>
