<template>
  <div>
    <div class="flex items-center justify-between">
      <span class="t-caption">{{ fixture.league }} · {{ kickoffText }}</span>
      <span class="t-mono tabular-nums" :class="remaining <= 20 ? 'text-danger' : 'text-fg-muted'">{{ clock }}</span>
    </div>

    <!-- 두 팀과 내 예상 스코어 -->
    <!-- 320px 폭에서도 두 팀 칸이 화면 밖으로 넘치지 않게 칸 최소 폭을 0으로, 간격은 좁게 -->
    <div class="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3 mt-8">
      <div v-for="(side, i) in sides" :key="side.team" class="flex flex-col items-center text-center" :class="i === 1 ? 'col-start-3' : ''">
        <p class="t-heading min-h-[3rem] flex items-center break-keep">{{ side.team }}</p>
        <p class="t-micro">{{ i === 0 ? '홈' : '원정' }}</p>
        <div class="flex items-center gap-1 sm:gap-3 mt-4">
          <UiIconButton icon="minus" :label="`${side.team} 한 골 빼기`" :disabled="goals[i] === 0" @click="goals[i]--" />
          <span class="t-display tabular-nums w-8 sm:w-10 text-center" aria-live="polite">{{ goals[i] }}</span>
          <UiIconButton icon="plus" :label="`${side.team} 한 골 더하기`" :disabled="goals[i] >= 20" @click="goals[i]++" />
        </div>
      </div>
      <span class="t-title text-fg-subtle row-start-1 col-start-2">:</span>
    </div>

    <UiButton block size="lg" class="mt-10" :loading="submitting" @click="finish">{{ goals[0] }} : {{ goals[1] }}로 낼게요</UiButton>
    <p class="t-caption text-center mt-2">경기가 끝나면 실제 스코어로 채점해요. 승패를 맞히면 5점, 골 차까지 +2, 골 수가 가까울수록 +3, 다 맞히면 10점</p>
  </div>
</template>

<script setup lang="ts">
// 스코어 맞히기 한 판 (2-8 경기 밖 결과). 문제는 서버가 준 실제 경기(JSON). 시간이 다 되면 고른 스코어로 낸다
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { UiButton, UiIconButton } from '../ui'
import { fixtureOf, kickoffLabel } from '@/utils/predict'

const props = defineProps<{ problem: string; timeLimitSeconds: number; submitting: boolean }>()
const emit = defineEmits<{ submit: [answer: string] }>()

const fixture = computed(() => fixtureOf(props.problem))
const sides = computed(() => [{ team: fixture.value.home }, { team: fixture.value.away }])
const kickoffText = computed(() => kickoffLabel(fixture.value.kickoff))
const goals = reactive([1, 1])

const startedAt = Date.now()
const remaining = ref(props.timeLimitSeconds)
const clock = computed(() => `${Math.floor(remaining.value / 60)}:${String(remaining.value % 60).padStart(2, '0')}`)
let timer: ReturnType<typeof setInterval> | undefined

let done = false
function finish() {
  if (done || props.submitting) return
  done = true
  emit('submit', `${goals[0]}-${goals[1]}`)
}

onMounted(() => {
  timer = setInterval(() => {
    remaining.value = Math.max(0, props.timeLimitSeconds - Math.floor((Date.now() - startedAt) / 1000))
    if (remaining.value === 0) finish()
  }, 500)
})
onBeforeUnmount(() => clearInterval(timer))
</script>
