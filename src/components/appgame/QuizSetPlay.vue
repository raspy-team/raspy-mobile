<template>
  <div>
    <div class="flex items-center justify-between">
      <span class="t-caption">초성과 분류를 보고 낱말을 적어 주세요</span>
      <span class="t-mono tabular-nums" :class="remaining <= 20 ? 'text-danger' : 'text-fg-muted'">{{ clock }}</span>
    </div>

    <ol class="mt-4 space-y-3">
      <li v-for="(q, i) in questions" :key="i">
        <p class="flex items-baseline gap-2">
          <span class="t-micro tabular-nums">{{ i + 1 }}</span>
          <span class="t-title tracking-widest">{{ q.split(' · ')[0] }}</span>
          <span class="t-caption">{{ q.split(' · ')[1] }}</span>
        </p>
        <UiInput :ref="(el) => setInput(i, el)" v-model="answers[i]" class="mt-1" :maxlength="20" placeholder="정답" @enter="next(i)" />
      </li>
    </ol>
    <UiButton block size="lg" class="mt-5" :loading="submitting" :disabled="!answers.some((a) => a.trim())" @click="finish">다 풀었어요</UiButton>
    <p class="t-caption text-center mt-2">맞힌 개수가 먼저, 같으면 빨리 푼 쪽이 위예요. 오늘은 한 번만</p>
  </div>
</template>

<script setup lang="ts">
// 문제 여러 줄을 한 번에 푸는 판 (오늘의 초성). 문제는 줄마다 하나, 답도 줄마다 하나로 낸다
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { UiButton, UiInput } from '../ui'

const props = defineProps<{ problem: string; timeLimitSeconds: number; submitting: boolean }>()
const emit = defineEmits<{ submit: [answer: string] }>()

const questions = computed(() => props.problem.split('\n'))
const answers = ref<string[]>(questions.value.map(() => ''))
const startedAt = Date.now()
const remaining = ref(props.timeLimitSeconds)
const clock = computed(() => `${Math.floor(remaining.value / 60)}:${String(remaining.value % 60).padStart(2, '0')}`)
let timer: ReturnType<typeof setInterval> | undefined

// 엔터를 누르면 다음 빈칸으로 (마지막 다음은 처음부터). 다 채웠을 때만 낸다: 하루 한 번이라 빈칸으로 잘못 내지 않게
const inputs = ref<({ focus: () => void } | null)[]>([])
const setInput = (i: number, el: unknown) => (inputs.value[i] = el as { focus: () => void } | null)
function next(i: number) {
  const n = questions.value.length
  const j = [...Array(n - 1).keys()].map((k) => (i + 1 + k) % n).find((k) => !answers.value[k].trim())
  if (j !== undefined) inputs.value[j]?.focus()
  else if (answers.value[i].trim()) finish()
}

let done = false
function finish() {
  if (done || props.submitting) return
  done = true
  emit('submit', answers.value.map((a) => a.trim()).join('\n'))
}

onMounted(() => {
  timer = setInterval(() => {
    remaining.value = Math.max(0, props.timeLimitSeconds - Math.floor((Date.now() - startedAt) / 1000))
    if (remaining.value === 0) finish()
  }, 500)
})
onBeforeUnmount(() => clearInterval(timer))
</script>
