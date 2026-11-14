<template>
  <div :class="typing ? 'pb-[50vh]' : ''">
    <div class="flex items-center justify-between">
      <span class="t-caption">{{ topic }} · 나는 <b class="text-fg">{{ mine }}</b> 편</span>
      <span class="t-mono tabular-nums" :class="remaining <= 30 ? 'text-danger' : 'text-fg-muted'">{{ clock }}</span>
    </div>

    <!-- 주고받은 말 -->
    <ol class="mt-4 space-y-2" aria-live="polite">
      <li v-for="(l, i) in lines" :key="i" class="flex" :class="l.mine ? 'justify-end' : 'justify-start'">
        <p class="max-w-[80%] rounded-2xl px-4 py-2.5 t-body whitespace-pre-line" :class="l.mine ? 'bg-signal !text-signal-on' : 'bg-surface text-fg'">{{ l.text }}</p>
      </li>
      <li v-if="saying" class="flex justify-start"><p class="rounded-2xl px-4 py-2.5 bg-surface t-caption">AI가 받아치는 중…</p></li>
    </ol>

    <!-- 키보드가 오르면 바로 앞 말과 내는 버튼이 함께 보이게 맞춘다 (11/14 전수 평가) -->
    <form v-if="turnsLeft > 0" ref="root" class="mt-4 scroll-mt-[calc(env(safe-area-inset-top)+10rem)]" @submit.prevent="say" @focusout="onTypeEnd">
      <UiInput v-model="text" multiline :rows="2" :maxlength="maxChars" :placeholder="`${mine} 편에서 한 마디 (${turnsLeft}번 남음)`" @focusin="onTypeStart" />
      <p v-if="error" class="t-caption text-danger mt-1">{{ error }}</p>
      <div ref="action" class="mt-3"><UiButton block size="lg" :loading="saying" :disabled="!text.trim() || submitting" @click="say">말하기</UiButton></div>
    </form>
    <UiButton block :variant="turnsLeft > 0 ? 'ghost' : 'primary'" :size="turnsLeft > 0 ? 'md' : 'lg'" class="mt-2" :loading="submitting" :disabled="saying" @click="finish">
      {{ turnsLeft > 0 ? '여기까지 하고 채점받기' : '채점받기' }}
    </UiButton>
  </div>
</template>

<script setup lang="ts">
// 따로 풀기 대화형 한 판 (AI랑 말싸움). AI 첫마디 → 내가 한 마디 → AI가 받아친다를 몇 번. 끝내면 주고받은 말 전부를 AI 심판이 채점한다.
// 판을 열면 서버에서 지금까지의 말을 받아 와 이어서 한다. 시간이 다 되면 한 데까지 낸다
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { GET, POST } from '@/api/client'
import type { components } from '@/api/schema'
import { UiButton, UiInput } from '../ui'
import { useKeyboardFit } from '@/utils/keyboardFit'

type Line = components['schemas']['DialogLine']

const props = defineProps<{ playId: number; problem: string; timeLimitSeconds: number; submitting: boolean }>()
const emit = defineEmits<{ submit: [answer: string] }>()

// 문제: "주제|내 편|AI 편"
const [topic, mine] = props.problem.split('|')
const lines = ref<Line[]>([])
const root = ref<HTMLElement | null>(null)
const action = ref<HTMLElement | null>(null)
const { typing, onTypeStart, onTypeEnd } = useKeyboardFit(root, action)
const turnsLeft = ref(0)
const maxChars = ref(200)
const text = ref('')
const error = ref('')
const saying = ref(false)

function message(e: unknown, fallback: string) {
  return (e as { response?: { data?: { message?: string } } }).response?.data?.message || fallback
}

async function say() {
  if (!text.value.trim() || saying.value) return
  saying.value = true
  error.value = ''
  const said = text.value.trim()
  // 보낸 말은 바로 보이고, AI의 받아침은 오면 붙는다
  lines.value = [...lines.value, { mine: true, text: said }]
  text.value = ''
  try {
    const { data } = await POST('/api/app-games/plays/{playId}/say', { path: { playId: props.playId }, body: { text: said } })
    lines.value = data.lines
    turnsLeft.value = data.turnsLeft
  } catch (e) {
    lines.value = lines.value.slice(0, -1)
    text.value = said
    error.value = message(e, '보내지 못했어요')
  } finally {
    saying.value = false
  }
}

let done = false
function finish() {
  if (done || props.submitting) return
  done = true
  // 서버는 화면이 보낸 답 대신 주고받은 말을 채점한다
  emit('submit', '')
}

const startedAt = Date.now()
const remaining = ref(props.timeLimitSeconds)
const clock = computed(() => `${Math.floor(remaining.value / 60)}:${String(remaining.value % 60).padStart(2, '0')}`)
let timer: ReturnType<typeof setInterval> | undefined

onMounted(async () => {
  try {
    const { data } = await GET('/api/app-games/plays/{playId}/dialog', { path: { playId: props.playId } })
    lines.value = data.lines
    turnsLeft.value = data.turnsLeft
    maxChars.value = data.maxChars
  } catch (e) {
    error.value = message(e, '대화를 불러오지 못했어요')
  }
  timer = setInterval(() => {
    remaining.value = Math.max(0, props.timeLimitSeconds - Math.floor((Date.now() - startedAt) / 1000))
    if (remaining.value === 0 && !saying.value) finish()
  }, 500)
})
onBeforeUnmount(() => clearInterval(timer))
</script>
