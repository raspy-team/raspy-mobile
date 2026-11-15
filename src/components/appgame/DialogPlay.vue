<template>
  <div :class="typing ? 'pb-[50vh]' : ''">
    <div class="flex items-start justify-between gap-3">
      <span v-if="kind === 'debate'" class="t-body">{{ topic }} · 나는 <b>{{ mine }}</b> 편</span>
      <!-- 읽씹 탈출: 누구와의 대화인가 -->
      <span v-else-if="kind === 'ghosted'" class="min-w-0">
        <span class="block t-heading break-keep">{{ head }}</span>
        <span class="block t-caption mt-0.5">읽고 답이 없어요. 세 번 안에 답장을 받아 보세요</span>
      </span>
      <!-- 재판: 사건 이름과 내 역할 -->
      <span v-else class="min-w-0">
        <span class="block t-heading break-keep">{{ head }}</span>
        <span class="block t-label !text-signal-fg mt-0.5">{{ role }}</span>
      </span>
      <GameClock class="t-mono shrink-0" muted :remaining="remaining" :warn="30" />
    </div>

    <!-- 재판: 먼저 읽는 법정 기록 (배경 + 오간 말). 빈틈은 여기 있다 -->
    <!-- 쓰는 동안에도 기록이 보여야 빈틈을 짚는다: 키보드가 오르면 기록을 머리줄 밑에 붙여 두고 그 안에서 밀어 본다 (11/15: 쓰기 시작하면 기록이 화면 밖으로 밀려났다) -->
    <section v-if="kind === 'trial'" class="mt-4 rounded-2xl bg-surface p-4" :class="typing ? 'sticky z-10 top-[calc(env(safe-area-inset-top)+3.75rem)] max-h-[26vh] overflow-y-auto overscroll-contain shadow-lg' : ''" aria-label="법정 기록">
      <p class="t-body break-keep">{{ background }}</p>
      <ol class="mt-3 space-y-2 border-t border-line pt-3">
        <li v-for="(r, i) in record" :key="i" class="t-body break-keep"><b class="text-fg">{{ r.who }}</b> <span class="text-fg-muted">{{ r.said }}</span></li>
      </ol>
    </section>

    <!-- 주고받은 말 -->
    <ol class="mt-4 space-y-2" aria-live="polite">
      <li v-for="(l, i) in lines" :key="i" class="flex" :class="l.mine ? 'justify-end' : 'justify-start'">
        <!-- 읽고 넘긴 것은 말풍선이 아니라 메신저의 '읽음'으로 -->
        <p v-if="isRead(l)" class="t-micro w-full text-right pr-1">읽음</p>
        <p v-else class="bubble" :class="l.mine ? 'bubble-mine' : 'bubble-theirs'">{{ l.text }}</p>
      </li>
      <li v-if="saying" class="flex justify-start"><p class="bubble bubble-theirs !text-fg-muted">{{ T.waiting }}</p></li>
    </ol>

    <!-- 키보드가 오르면 바로 앞 말과 내는 버튼이 함께 보이게 맞춘다 (11/14 전수 평가) -->
    <form v-if="turnsLeft > 0" ref="root" class="mt-4 scroll-mt-[calc(env(safe-area-inset-top)+10rem)]" @submit.prevent="say" @focusout="onTypeEnd">
      <UiInput v-model="text" multiline :rows="2" :maxlength="maxChars" :placeholder="`${T.placeholder} (${turnsLeft}번 남음)`" @focusin="onTypeStart" />
      <!-- 글자 수: 칸이 다 차면 말없이 더 안 써졌다 -->
      <p class="t-micro mt-1 flex justify-between gap-3"><span class="text-danger">{{ error }}</span><span class="tabular-nums shrink-0" :class="text.length >= maxChars ? 'text-danger' : ''">{{ text.length }}/{{ maxChars }}</span></p>
      <div ref="action" class="mt-3"><UiButton block size="lg" :loading="saying" :disabled="!text.trim() || submitting" @click="say">{{ T.say }}</UiButton></div>
    </form>
    <!-- 한 마디도 안 했으면 끝낼 것이 없다: 끝내기는 한 번 말한 뒤에 -->
    <UiButton v-if="spoken || turnsLeft === 0" block :variant="turnsLeft > 0 ? 'ghost' : 'primary'" :size="turnsLeft > 0 ? 'md' : 'lg'" class="mt-2" :loading="submitting" :disabled="saying" @click="finishAsked">
      {{ turnsLeft > 0 ? T.finishEarly : T.finish }}
    </UiButton>
    <!-- 쓰는 자리에서 누가 보는지 말한다 (quality-rules Y-4) -->
    <p ref="tail" class="t-micro text-center mt-2 pb-2 break-keep">주고받은 말은 붙은 상대가 볼 수 있고, 소식에도 실려요</p>
  </div>
</template>

<script setup lang="ts">
import GameClock from './GameClock.vue'
// 따로 풀기 대화형 한 판 (AI랑 말싸움). AI 첫마디 → 내가 한 마디 → AI가 받아친다를 몇 번. 끝내면 주고받은 말 전부를 AI 심판이 채점한다.
// 판을 열면 서버에서 지금까지의 말을 받아 와 이어서 한다. 시간이 다 되면 한 데까지 낸다
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { confirmDialog } from '@/composables/useConfirm'
import { GET, POST } from '@/api/client'
import type { components } from '@/api/schema'
import { UiButton, UiInput } from '../ui'
import { useKeyboardFit } from '@/utils/keyboardFit'

type Line = components['schemas']['DialogLine']

const props = defineProps<{ playId: number; problem: string; timeLimitSeconds: number; submitting: boolean; gameKey?: string }>()

// 대화하는 게임 셋이 이 화면을 같이 쓴다: 말싸움(AI와 세 마디) · 읽씹 탈출(그 사람에게 세 번) · AI 재판(판사에게 두 번)
const kind = props.gameKey === 'ghosted' || props.gameKey === 'trial' ? props.gameKey : 'debate'
const TEXT = {
  debate: { waiting: 'AI가 받아치는 중이에요', placeholder: '한 마디', say: '말하기', finishEarly: '여기까지 하고 채점받기', finish: '채점받기' },
  ghosted: { waiting: '읽는 중이에요', placeholder: '보낼 메시지', say: '보내기', finishEarly: '여기까지 하고 결과 보기', finish: '결과 보기' },
  trial: { waiting: '판사가 기록을 살피는 중이에요', placeholder: '판사에게 할 말', say: '말하기', finishEarly: '여기서 변론을 마치고 판결받기', finish: '판결받기' },
}
const T = TEXT[kind]
// 읽씹 탈출·재판의 문제는 줄마다 뜻이 있다. 읽씹: 누구 / 그 전 대화…  재판: 사건 이름 / 내 역할 / 배경 / 법정 기록…
const rows = props.problem.split('\n')
const head = rows[0]
const role = rows[1]
const background = rows[2]
const record = rows.slice(3).map((r) => ({ who: r.slice(0, r.indexOf(':')), said: r.slice(r.indexOf(':') + 1).trim() }))
const isRead = (l: Line) => kind === 'ghosted' && !l.mine && l.text.trim() === '(읽음)'
// 한 번이라도 말했나 (말할 수 있는 횟수: 읽씹 셋, 재판 둘). 말싸움은 예전대로 늘 끝낼 수 있다
const MAX_TURNS = { debate: 0, ghosted: 3, trial: 2 }
const spoken = computed(() => kind === 'debate' || turnsLeft.value < MAX_TURNS[kind])
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
  follow()
  try {
    const { data } = await POST('/api/app-games/plays/{playId}/say', { path: { playId: props.playId }, body: { text: said } })
    lines.value = data.lines
    turnsLeft.value = data.turnsLeft
    follow()
  } catch (e) {
    lines.value = lines.value.slice(0, -1)
    text.value = said
    error.value = message(e, '보내지 못했어요')
  } finally {
    saying.value = false
  }
}

// 새 말이 붙으면 입력칸과 버튼이 화면 아래로 밀려났다: 붙을 때마다 맨 아래(다음에 누를 것)가 보이게 따라 내려간다
const tail = ref<HTMLElement | null>(null)
function follow() {
  nextTick(() => tail.value?.scrollIntoView({ block: 'end', behavior: 'smooth' }))
}
// 말할 기회가 남았는데 끝내는 버튼은 보내기 바로 밑이라 잘못 누르기 쉽다: 남았으면 한 번 묻는다
async function finishAsked() {
  if (turnsLeft.value > 0 && !(await confirmDialog({ title: `아직 ${turnsLeft.value}번 더 말할 수 있어요`, message: text.value.trim() ? '쓰던 말은 보내지 않고 여기서 끝나요' : '여기서 끝낼까요?', confirmText: '끝내기', cancelText: '계속하기' }))) return
  finish()
}
let done = false
function finish() {
  if (done || props.submitting) return
  done = true
  // 서버는 화면이 보낸 답 대신 주고받은 말을 채점한다
  emit('submit', '')
}

let lastCall = false
const startedAt = Date.now()
const remaining = ref(props.timeLimitSeconds)
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
    // 시간이 끝나 갈 때 쓰던 말이 있으면 그 말까지 보내고 끝낸다 (예전엔 쓰던 말이 사라진 채 끝났다. 글쓰기 판은 쓴 데까지 낸다)
    if (remaining.value <= 3 && remaining.value > 0 && text.value.trim() && turnsLeft.value > 0 && !saying.value && !lastCall) { lastCall = true; say() }
    if (remaining.value === 0 && !saying.value) finish()
  }, 500)
})
onBeforeUnmount(() => clearInterval(timer))
</script>
