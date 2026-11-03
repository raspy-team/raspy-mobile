<template>
  <div>
    <div class="flex items-center justify-between">
      <span class="t-caption">{{ index + 1 }} / {{ questions.length }}</span>
      <span class="t-mono tabular-nums" :class="remaining <= 15 ? 'text-danger' : 'text-fg-muted'">{{ clock }}</span>
    </div>
    <!-- 한 번에 한 문제. 고르면 바로 다음으로 넘어가 손이 멈추지 않는다 -->
    <p class="t-title mt-6 min-h-[3.5rem]">{{ current.question }}</p>
    <div class="mt-5 space-y-2">
      <button
        v-for="c in current.choices"
        :key="c"
        type="button"
        class="w-full min-h-[52px] px-4 py-3 rounded-xl text-left t-body border transition-colors"
        :class="answers[index] === c ? 'bg-primary text-primary-on border-primary' : 'bg-surface border-line active:bg-surface-2'"
        :aria-pressed="answers[index] === c"
        @click="pick(c)"
      >
        {{ c }}
      </button>
    </div>
    <div class="flex gap-2 mt-5">
      <UiButton v-if="index > 0" variant="ghost" @click="index--">이전</UiButton>
      <UiButton v-if="index === questions.length - 1" class="flex-1" size="lg" :loading="submitting" :disabled="answers.some((a) => !a)" @click="finish">다 골랐어요</UiButton>
    </div>
    <p class="t-caption text-center mt-3">맞힌 개수가 먼저, 같으면 빨리 푼 쪽이 위예요. 오늘은 한 번만</p>
  </div>
</template>

<script setup lang="ts">
// 오늘의 낱말: 문제는 줄마다 "번호\t질문\t보기1..보기4", 답은 줄마다 고른 보기 글자 (서버 DailyWordGame)
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { UiButton } from '../ui'
import { haptic } from '../../utils/haptics'

const props = defineProps<{ problem: string; timeLimitSeconds: number; submitting: boolean }>()
const emit = defineEmits<{ submit: [answer: string] }>()

const questions = computed(() =>
  props.problem.split('\n').map((line) => {
    const [, question, ...choices] = line.split('\t')
    return { question, choices }
  }),
)
const answers = ref<string[]>(questions.value.map(() => ''))
const index = ref(0)
const current = computed(() => questions.value[index.value])

function pick(c: string) {
  answers.value[index.value] = c
  haptic('select')
  // 마지막이 아니면 잠깐 고른 것을 보여 준 뒤 다음 문제로. 빨리 두 번 눌러도 한 칸만 간다
  const from = index.value
  if (from < questions.value.length - 1) setTimeout(() => { if (index.value === from) index.value = from + 1 }, 180)
}

const startedAt = Date.now()
const remaining = ref(props.timeLimitSeconds)
const clock = computed(() => `${Math.floor(remaining.value / 60)}:${String(remaining.value % 60).padStart(2, '0')}`)
let timer: ReturnType<typeof setInterval> | undefined

let done = false
function finish() {
  if (done || props.submitting) return
  done = true
  emit('submit', answers.value.join('\n'))
}

onMounted(() => {
  timer = setInterval(() => {
    remaining.value = Math.max(0, props.timeLimitSeconds - Math.floor((Date.now() - startedAt) / 1000))
    if (remaining.value === 0) finish()
  }, 500)
})
onBeforeUnmount(() => clearInterval(timer))
</script>
