<template>
  <div>
    <div class="flex items-start justify-between gap-3">
      <span class="t-caption break-keep">{{ guide }}</span>
      <span class="t-mono tabular-nums shrink-0 whitespace-nowrap" :class="remaining <= 20 ? 'text-danger-fg' : 'text-fg-muted'">{{ clock }}</span>
    </div>

    <p class="t-title mt-4 break-keep">{{ problem }}</p>

    <div class="mt-5">
      <UiInput v-model="text" multiline :rows="4" :maxlength="120" :placeholder="placeholder" />
      <p class="t-micro text-right mt-1">{{ text.length }}/120</p>
    </div>
    <UiButton block size="lg" class="mt-3" :loading="submitting" :disabled="text.trim().length < 5" @click="finish">다 썼어요</UiButton>
    <!-- AI가 채점하는 글쓰기에는 투표가 없다: 투표 게임에만 (경로 2 리뷰) -->
    <p v-if="vote" class="t-caption text-center mt-2">두 사람의 글이 모이면 이름을 가리고 24시간 동안 투표를 받아요</p>
  </div>
</template>

<script setup lang="ts">
// 글로 겨루는 게임 한 판 (한 줄 변명·밸런스 설득): 문제 한 줄을 보고 쓴다. 시간이 다 되면 쓴 데까지 낸다
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { UiButton, UiInput } from '../ui'

const props = defineProps<{ problem: string; timeLimitSeconds: number; submitting: boolean; guide: string; placeholder: string; vote?: boolean }>()
const emit = defineEmits<{ submit: [answer: string] }>()

const text = ref('')
const startedAt = Date.now()
const remaining = ref(props.timeLimitSeconds)
const clock = computed(() => `${Math.floor(remaining.value / 60)}:${String(remaining.value % 60).padStart(2, '0')}`)
let timer: ReturnType<typeof setInterval> | undefined

let done = false
function finish() {
  if (done || props.submitting) return
  done = true
  emit('submit', text.value.trim())
}

onMounted(() => {
  timer = setInterval(() => {
    remaining.value = Math.max(0, props.timeLimitSeconds - Math.floor((Date.now() - startedAt) / 1000))
    if (remaining.value === 0) finish()
  }, 500)
})
onBeforeUnmount(() => clearInterval(timer))
</script>
