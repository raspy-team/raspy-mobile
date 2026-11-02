<template>
  <div>
    <div class="flex items-center justify-between">
      <span class="t-caption">아래 문장을 그대로 쳐 주세요</span>
      <span class="t-mono tabular-nums" :class="remaining <= 10 ? 'text-danger' : 'text-fg-muted'">{{ remaining }}s</span>
    </div>

    <!-- 친 만큼 글자색이 바뀐다. 틀린 글자만 빨강 -->
    <UiCard class="mt-3">
      <p class="t-title leading-relaxed break-keep select-none" aria-live="off">
        <span v-for="(c, i) in chars" :key="i" :class="charClass(i)">{{ c }}</span>
      </p>
    </UiCard>

    <!-- 붙여넣기와 끌어다 놓기는 막는다 -->
    <div class="mt-4" @paste.capture.prevent @drop.capture.prevent>
      <UiInput ref="input" v-model="answer" placeholder="여기에 치세요" @enter="finish" />
    </div>
    <UiButton block size="lg" class="mt-4" :loading="submitting" @click="finish">다 쳤어요</UiButton>
  </div>
</template>

<script setup lang="ts">
// 타자 대결 한 판. 시간은 서버가 재고, 여기 남은 시간은 보여주기만 한다. 시간이 다 되면 친 데까지 낸다
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { UiButton, UiCard, UiInput } from '../ui'

const props = defineProps<{ problem: string; timeLimitSeconds: number; submitting: boolean }>()
const emit = defineEmits<{ submit: [answer: string] }>()

const answer = ref('')
const input = ref<{ focus: () => void } | null>(null)
const chars = computed(() => [...props.problem])
const startedAt = Date.now()
const remaining = ref(props.timeLimitSeconds)
let timer: ReturnType<typeof setInterval> | undefined

function charClass(i: number) {
  const typed = answer.value[i]
  if (typed === undefined) return 'text-fg-subtle'
  // 마지막 글자는 조합 중일 수 있어 틀려도 빨강으로 칠하지 않는다
  if (typed === props.problem[i]) return 'text-fg'
  return i === answer.value.length - 1 ? 'text-fg' : 'text-danger underline'
}

let done = false
function finish() {
  if (done || props.submitting) return
  done = true
  emit('submit', answer.value)
}

onMounted(() => {
  input.value?.focus()
  timer = setInterval(() => {
    remaining.value = Math.max(0, props.timeLimitSeconds - Math.floor((Date.now() - startedAt) / 1000))
    if (remaining.value === 0) finish()
  }, 250)
})
onBeforeUnmount(() => clearInterval(timer))
</script>
