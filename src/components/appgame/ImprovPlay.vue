<template>
  <div>
    <div class="flex items-center justify-between">
      <span class="t-caption">상황 {{ index + 1 }}/{{ situations.length }} · {{ SLOT[current?.slot ?? ''] ?? '' }}</span>
      <span v-if="phase === 'answer'" class="t-mono tabular-nums" :class="remaining <= 10 ? 'text-danger-fg' : 'text-fg-muted'">0:{{ String(remaining).padStart(2, '0') }}</span>
    </div>

    <template v-if="current">
      <p class="t-caption mt-4 break-keep">{{ current.who }}</p>
      <p class="t-micro mt-0.5 break-keep">{{ current.context }}</p>
      <!-- 인물의 첫 마디 -->
      <div class="mt-3 rounded-2xl rounded-tl-md bg-surface-2 px-4 py-3">
        <p class="t-title break-keep">“{{ current.line }}”</p>
      </div>

      <!-- 내 대답 -->
      <template v-if="phase === 'answer'">
        <div class="mt-5">
          <UiInput ref="input" v-model="text" multiline :rows="3" :maxlength="120" placeholder="그 자리에서 할 말을 써요" />
          <!-- 한 번만 말한다는 걸 먼저 알린다 (걷기 P1-3: "고칠 수 있는 줄 알고 대충 눌렀는데 바로 넘어갔어") -->
          <p class="t-micro mt-1 flex justify-between gap-2"><span>한 번만 말할 수 있어요. 시간이 다 되면 쓴 데까지 보내요</span><span class="shrink-0 tabular-nums">{{ text.length }}/120</span></p>
        </div>
        <UiButton block size="lg" class="mt-3" :disabled="!text.trim()" @click="say">말하기</UiButton>
      </template>

      <!-- 내가 한 말과 인물의 반응 -->
      <template v-else>
        <div class="mt-4 ml-auto max-w-[85%] rounded-2xl rounded-tr-md bg-signal px-4 py-3 text-signal-on">
          <!-- t-body가 글자색을 정하므로 볼트 바탕의 글자색을 여기서 다시 준다 (흐리게 읽혔다) -->
          <p class="t-body !text-signal-on break-keep whitespace-pre-line">{{ said[index] || '(아무 말도 못 했다)' }}</p>
        </div>
        <div class="mt-3 max-w-[85%] rounded-2xl rounded-tl-md bg-surface-2 px-4 py-3">
          <!-- 반응을 기다리는 동안 인물이 '생각 중'이다. 도는 표시만 있으면 "멈췄나?" (걷기 P1-4: 첫 반응 10.9초) -->
          <p v-if="phase === 'reacting'" class="t-body text-fg-muted" aria-live="polite">
            <span class="thinking" aria-hidden="true"><i></i><i></i><i></i></span>
            <span v-if="slow" class="ml-2">{{ whoShort }} 생각하는 중이에요</span>
          </p>
          <p v-else class="t-body break-keep">{{ reactions[index] }}</p>
        </div>
        <UiButton v-if="phase === 'reacted'" block size="lg" class="mt-5" :loading="submitting" @click="next">
          {{ index + 1 < situations.length ? '다음 상황' : '점수 보기' }}
        </UiButton>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
// 임기응변 등급 한 판 (3단계 첫 게임, product/growth/game-plan.md ③): 상황 셋, 상황마다 45초 안에 한 번 대답한다.
// 대답하면 인물이 한 줄로 반응하고(/api/improv/react, 가입 전에도), 되받아칠 수 없이 다음 상황으로. 셋이 끝나면 답 셋을 낸다.
// 반응을 받으며 서버가 채점해 두므로 점수는 낼 때 바로 나온다. 반응을 못 받아도 판은 이어 간다
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { POST } from '@/api/client'
import { track } from '@/utils/trackLog'
import { UiButton, UiInput } from '../ui'

type Shown = { id: string; slot: string; who: string; context: string; line: string }

// playId·visitorId: 반응을 이 판에 묶는다 (서버가 판에 없는 상황·낸 판이면 거절한다). 손님이면 visitorId, 로그인 판이면 비운다
const props = defineProps<{ problem: string; timeLimitSeconds: number; submitting: boolean; playId: number; visitorId?: string }>()
const emit = defineEmits<{ submit: [answer: string] }>()

const SLOT: Record<string, string> = { UP: '윗사람', SENIOR: '선배', PEER: '동기' }
const PER_SITUATION = 45

const situations = computed<Shown[]>(() => {
  try {
    return JSON.parse(props.problem).situations ?? []
  } catch {
    return []
  }
})
const index = ref(0)
const current = computed(() => situations.value[index.value])
const phase = ref<'answer' | 'reacting' | 'reacted'>('answer')
const text = ref('')
const said = ref<string[]>([])
const reactions = ref<string[]>([])
const remaining = ref(PER_SITUATION)
const input = ref<{ focus?: () => void } | null>(null)
// 반응이 5초를 넘으면 "생각하는 중" 한 줄을 더한다. 인물 이름은 짧게 (교수님·선배·동기)
const slow = ref(false)
const whoShort = computed(() => ({ UP: '교수님이', SENIOR: '선배가', PEER: '동기가' })[current.value?.slot ?? ''] ?? '상대가')
// 반응은 AI라 가끔 10초를 넘는다(걷기: 첫 반응 10.9·15.3초). 45초까지 기다리되, 5초부터 '생각하는 중'으로 안심시킨다
const REACT_TIMEOUT_MS = 45_000

let shownAt = Date.now()
const startedAt = Date.now()
let timer: ReturnType<typeof setInterval> | undefined
let done = false

function finish() {
  if (done) return
  done = true
  clearInterval(timer)
  emit('submit', JSON.stringify(situations.value.map((_, i) => said.value[i] ?? '')))
}

async function say() {
  if (phase.value !== 'answer' || !current.value) return
  const line = text.value.trim()
  said.value[index.value] = line
  // 잴 것 (game-plan.md ③ 11): 상황마다 답했나·시간 초과·답 길이·쓴 시간
  const sec = Math.round((Date.now() - shownAt) / 1000)
  track('improv_say', { gameKey: 'improv', step: index.value + 1, value: `id=${current.value.id};len=${line.length};sec=${sec};timeout=${remaining.value === 0 ? 1 : 0}` })
  phase.value = 'reacting'
  if (!line) {
    reactions.value[index.value] = '…'
    phase.value = 'reacted'
    return
  }
  slow.value = false
  const slowTimer = setTimeout(() => (slow.value = true), 5000)
  try {
    // 45초를 넘기면 기다리지 않고 넘어간다. 점수는 끝에 다시 채점된다 (같은 답이면 저장한 채점을 쓴다)
    const { data } = await POST('/api/improv/react', { body: { situationId: current.value.id, text: line, playId: props.playId, visitorId: props.visitorId || undefined }, timeout: REACT_TIMEOUT_MS, quiet: true })
    reactions.value[index.value] = data?.reaction || '…'
  } catch {
    reactions.value[index.value] = '(반응을 받지 못했어요. 점수는 끝에 나와요)'
    track('improv_react_failed', { gameKey: 'improv', step: index.value + 1 })
  } finally {
    clearTimeout(slowTimer)
  }
  phase.value = 'reacted'
}

function next() {
  if (index.value + 1 >= situations.value.length) return finish()
  index.value++
  text.value = ''
  phase.value = 'answer'
  shownAt = Date.now()
  remaining.value = PER_SITUATION
  nextTick(() => input.value?.focus?.())
}

onMounted(() => {
  timer = setInterval(() => {
    // 판 전체 마감(서버)이 먼저 오면 쓴 데까지 낸다
    if ((Date.now() - startedAt) / 1000 >= props.timeLimitSeconds) return finish()
    if (phase.value !== 'answer') return
    remaining.value = Math.max(0, PER_SITUATION - Math.floor((Date.now() - shownAt) / 1000))
    if (remaining.value === 0) say()
  }, 250)
})
onBeforeUnmount(() => clearInterval(timer))
</script>

<style scoped>
/* 말줄임 점 셋이 차례로 떠오른다 (메신저의 '입력 중') */
.thinking { display: inline-flex; gap: 4px; vertical-align: middle; }
.thinking i { width: 6px; height: 6px; border-radius: 9999px; background: currentColor; opacity: 0.35; animation: think 1.2s infinite ease-in-out; }
.thinking i:nth-child(2) { animation-delay: 0.15s; }
.thinking i:nth-child(3) { animation-delay: 0.3s; }
@keyframes think { 0%, 60%, 100% { opacity: 0.35; transform: translateY(0); } 30% { opacity: 1; transform: translateY(-3px); } }
@media (prefers-reduced-motion: reduce) { .thinking i { animation: none; } }
</style>
