<template>
  <div>
    <UiSkeleton v-if="!list.length && !loadError" class="h-64 rounded-2xl" />
    <!-- 못 불러오면 빠져나갈 길: 다시 불러오기 (누르는 동안 문구는 그대로, 다시 실패해도 그대로) -->
    <div v-else-if="loadError" class="py-10 text-center">
      <p class="t-caption text-danger">{{ loadError }}</p>
      <UiButton variant="secondary" class="mt-4" :loading="loading" @click="load">다시 시도</UiButton>
    </div>

    <template v-else-if="current">
      <div class="flex items-center justify-between t-micro tabular-nums">
        <span>{{ index + 1 }} / {{ list.length }}</span>
        <span>맞힌 건 끝나고 알려 드려요</span>
      </div>

      <!-- 3초 막대는 질문 카드 아래 가장자리에: '1 / 10' 바로 밑에 두면 진행 막대로 읽혔다 (첫 문제인데 80% 찬 막대) -->
      <UiCard :pad="false" class="mt-3 px-4 pt-8 text-center overflow-hidden">
        <p class="t-micro">남들은 어느 쪽을 더 많이 골랐을까요?</p>
        <p class="t-title mt-2 break-keep">{{ current.q }}</p>
        <div class="h-1 bg-surface-2 mt-7 -mx-4" aria-hidden="true">
          <div :key="index" class="h-full bg-primary nunchi-bar" :style="{ animationDuration: `${LIMIT_MS}ms` }" />
        </div>
      </UiCard>

      <div class="grid grid-cols-2 gap-3 mt-4">
        <button
          v-for="side in (['a', 'b'] as const)"
          :key="side"
          type="button"
          class="rounded-2xl border px-3 py-8 text-heading font-semibold break-keep active:scale-[0.98] transition"
          :class="picked === side ? 'border-fg bg-fg text-canvas' : picked ? 'border-line bg-surface text-fg opacity-40' : 'border-line bg-surface text-fg'"
          :disabled="locked"
          @click="pick(side)"
        >
          {{ current[side] }}
        </button>
      </div>
    </template>

    <div v-else class="py-16 text-center">
      <UiSpinner class="mx-auto" />
      <p class="t-caption mt-3">맞혔는지 보고 있어요</p>
    </div>
  </div>
</template>

<script setup lang="ts">
// 눈치 한 판의 판: 질문마다 3초, 남들이 더 많이 고른 쪽을 고른다. 답은 "a:812"(고른 쪽:밀리초) 또는 "-"(못 고름) 열 개
// 문제마다 고른 것·걸린 시간·넘어간 것을 원본 기록으로 남기고, 중간에 떠나면 몇 번째에서 그만뒀는지 남긴다
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { GET } from '@/api/client'
import type { components } from '@/api/schema'
import { UiButton, UiCard, UiSkeleton, UiSpinner } from '../ui'
import { track, flush } from '@/utils/trackLog'
import { feel } from '@/utils/feel'

type Question = components['schemas']['QuestionView']

const LIMIT_MS = 3000
const props = defineProps<{ problem: string; timeLimitSeconds: number; submitting: boolean }>()
const emit = defineEmits<{ submit: [answer: string] }>()

const list = ref<Question[]>([])
const loadError = ref('')
const index = ref(0)
const answers: string[] = []
const locked = ref(false)
/** 방금 고른 쪽: 다음 문제로 넘어가기 전 잠깐 뒤집어 보여 준다 (눌렸는지 몰랐다) */
const picked = ref<'a' | 'b' | null>(null)
let shownAt = 0
let timer: ReturnType<typeof setTimeout> | null = null
let finished = false
const current = computed(() => (index.value < list.value.length ? list.value[index.value] : null))

function show() {
  locked.value = false
  picked.value = null
  shownAt = performance.now()
  track('nunchi_view', { gameKey: 'nunchi', step: index.value, value: current.value?.id })
  timer = setTimeout(() => record('-', LIMIT_MS), LIMIT_MS)
}

function pick(side: 'a' | 'b') {
  if (locked.value) return
  record(side, Math.min(LIMIT_MS, Math.round(performance.now() - shownAt)))
}

function record(choice: 'a' | 'b' | '-', ms: number) {
  if (timer) clearTimeout(timer)
  timer = null
  locked.value = true
  answers.push(choice === '-' ? '-' : `${choice}:${ms}`)
  track(choice === '-' ? 'nunchi_timeout' : 'nunchi_answer', { gameKey: 'nunchi', step: index.value, value: `${current.value?.id}:${choice}:${ms}` })
  if (choice !== '-') { feel('tap'); picked.value = choice }
  const last = index.value + 1 >= list.value.length
  if (!last) {
    // 누른 쪽이 눌린 게 보이게 잠깐 두고 다음으로. 그사이 화면을 떠나면 다음 문제의 3초를 켜지 않는다 (떠난 뒤 저절로 답이 나가지 않게)
    timer = setTimeout(() => {
      timer = null
      index.value++
      if (!unmounted) show()
    }, choice === '-' ? 0 : 260)
  } else {
    index.value++
    finished = true
    track('nunchi_done', { gameKey: 'nunchi', step: list.value.length, value: answers.join(',') })
    emit('submit', answers.join(','))
  }
}

const loading = ref(false)
async function load() {
  if (loading.value) return
  loading.value = true
  try {
    const ids = props.problem.split(',')
    const data = (await GET('/api/nunchi/questions', { query: { ids: ids.join(',') } })).data
    // 빈 목록이면 스피너만 돌다 3초 뒤 빈 답이 나갔다: 실패와 같게 다시 시도 (경로 8 2절)
    if (!data?.length) throw new Error('empty')
    loadError.value = ''
    list.value = data
    show()
  } catch {
    loadError.value = '질문을 불러오지 못했어요. 다시 해 주세요'
  } finally {
    loading.value = false
  }
}

onMounted(load)

// 끝내지 않고 떠났다: 몇 번째 문제에서 그만뒀는지 (다른 화면으로 가거나 창을 닫거나)
let quitSent = false
function leave() {
  if (finished || quitSent || !list.value.length) return
  quitSent = true
  track('nunchi_quit', { gameKey: 'nunchi', step: index.value })
  flush(true)
}
window.addEventListener('pagehide', leave)

let unmounted = false
onBeforeUnmount(() => {
  unmounted = true
  if (timer) clearTimeout(timer)
  window.removeEventListener('pagehide', leave)
  leave()
})
</script>

<style scoped>
.nunchi-bar {
  animation-name: nunchi-shrink;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
  transform-origin: left;
}
@keyframes nunchi-shrink {
  from { transform: scaleX(1); }
  to { transform: scaleX(0); }
}
</style>
