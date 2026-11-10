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
          <p class="t-micro text-right mt-1">{{ text.length }}/120</p>
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
          <UiSpinner v-if="phase === 'reacting'" />
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
import { UiButton, UiInput, UiSpinner } from '../ui'

type Shown = { id: string; slot: string; who: string; context: string; line: string }

const props = defineProps<{ problem: string; timeLimitSeconds: number; submitting: boolean }>()
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
  try {
    const { data } = await POST('/api/improv/react', { body: { situationId: current.value.id, text: line } })
    reactions.value[index.value] = data?.reaction || '…'
  } catch {
    reactions.value[index.value] = '(반응을 받지 못했어요. 점수는 끝에 나와요)'
    track('improv_react_failed', { gameKey: 'improv', step: index.value + 1 })
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
