<template>
  <div>
    <div class="flex items-center justify-between">
      <span class="t-body">이 재료로 요리를 지어내 주세요</span>
      <GameClock class="t-mono" muted :remaining="remaining" :warn="30" />
    </div>

    <!-- 키보드가 오르면 재료가 화면 밖으로 밀려, 다섯 재료를 외워서 써야 했다 (11/14): 쓰는 동안 재료 줄이 제목 바 바로 밑에 오게 맞춘다 -->
    <div ref="chips" class="flex flex-wrap gap-2 mt-3 scroll-mt-[calc(env(safe-area-inset-top)+4.25rem)]">
      <!-- 누르는 것이 아니라 보여 주는 것: 버튼(칩) 대신 표시로 (quality-rules N-2). 쓴 재료는 형광으로 칠해진다 -->
      <span v-for="i in ingredients" :key="i" class="inline-flex items-center h-9 px-3.5 rounded-full text-sm transition-colors" :class="used(i) ? 'bg-signal text-signal-on font-semibold' : 'bg-surface-2 text-fg-muted'">{{ i }}</span>
    </div>
    <p class="t-micro mt-2">만드는 법에 쓴 재료는 칠해져요. 다 쓸수록 점수가 높아요</p>

    <div class="space-y-3 mt-5">
      <UiInput v-model="name" label="요리 이름" :maxlength="30" placeholder="예: 김치 치즈 떡볶이" @focusin="onTypeStart" />
      <UiInput v-model="steps" label="만드는 법" multiline :rows="6" @focusin="onTypeStart" :maxlength="500" placeholder="재료를 어떻게 손질하고 익히는지 적어 주세요" />
    </div>
    <p v-if="!name.trim() || steps.trim().length < 10" class="t-micro text-center mt-3">요리 이름과 만드는 법(열 글자부터)을 쓰면 낼 수 있어요</p>
    <UiButton block size="lg" class="mt-2" :loading="submitting" :disabled="!name.trim() || steps.trim().length < 10" @click="finish">
      다 만들었어요
    </UiButton>
    <!-- 쓰는 자리에서 누가 보는지 말한다 (quality-rules Y-4) -->
    <p class="t-micro text-center mt-2 break-keep">낸 요리는 붙은 상대가 볼 수 있고, 소식에도 실려요</p>
  </div>
</template>

<script setup lang="ts">
import GameClock from './GameClock.vue'
// 레시피 대결 한 판. 시간이 다 되면 적은 데까지 낸다. 채점은 서버의 AI 셰프가 뒤에서 하고, 끝나면 알림이 온다
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { UiButton, UiInput } from '../ui'

const props = defineProps<{ problem: string; timeLimitSeconds: number; submitting: boolean }>()
const emit = defineEmits<{ submit: [answer: string] }>()

const ingredients = computed(() => props.problem.split(', '))
const name = ref('')
const chips = ref<HTMLElement | null>(null)
function onTypeStart() {
  const align = () => chips.value?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  setTimeout(align, 250)
  window.visualViewport?.addEventListener('resize', () => setTimeout(align, 60), { once: true })
  setTimeout(align, 800)
}
const steps = ref('')
const startedAt = Date.now()
const remaining = ref(props.timeLimitSeconds)
let timer: ReturnType<typeof setInterval> | undefined

const used = (i: string) => steps.value.includes(i) || name.value.includes(i)

let done = false
function finish() {
  if (done || props.submitting) return
  done = true
  // 서버는 첫 줄을 요리 이름, 나머지를 만드는 법으로 읽는다
  emit('submit', `${name.value.trim().replace(/\n/g, ' ')}\n${steps.value.trim()}`)
}

onMounted(() => {
  timer = setInterval(() => {
    remaining.value = Math.max(0, props.timeLimitSeconds - Math.floor((Date.now() - startedAt) / 1000))
    if (remaining.value === 0) finish()
  }, 500)
})
onBeforeUnmount(() => clearInterval(timer))
</script>
