<template>
  <div>
    <UiSkeleton v-if="!list.length && !loadError" class="h-64 rounded-2xl" />
    <!-- 못 불러오면 빠져나갈 길: 다시 불러오기 (누르는 동안 문구는 그대로, 다시 실패해도 그대로) -->
    <div v-else-if="loadError" class="py-10 text-center">
      <p class="t-caption text-danger">{{ loadError }}</p>
      <UiButton variant="secondary" class="mt-4" :loading="loading" @click="load">다시 불러오기</UiButton>
    </div>

    <template v-else-if="current">
      <div class="flex items-center justify-between t-micro tabular-nums">
        <span>{{ index + 1 }} / {{ list.length }}</span>
        <span>맞힌 건 끝나고 알려 드려요</span>
      </div>
      <!-- 3초 막대: 줄어드는 것만 보여 준다 (숫자보다 덜 조급하게) -->
      <div class="h-1.5 rounded-full bg-surface-2 mt-2 overflow-hidden">
        <div :key="index" class="h-full bg-primary nunchi-bar" :style="{ animationDuration: `${LIMIT_MS}ms` }" />
      </div>

      <UiCard class="mt-4 py-8 text-center">
        <p class="t-micro">남들은 어느 쪽을 더 많이 골랐을까요?</p>
        <p class="t-title mt-2 break-keep">{{ current.q }}</p>
      </UiCard>

      <div class="grid grid-cols-2 gap-3 mt-4">
        <button
          v-for="side in (['a', 'b'] as const)"
          :key="side"
          type="button"
          class="rounded-2xl border border-line bg-surface px-3 py-8 text-[1.0625rem] font-semibold text-fg break-keep active:scale-[0.98] transition disabled:opacity-50"
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
let shownAt = 0
let timer: ReturnType<typeof setTimeout> | null = null
let finished = false
const current = computed(() => (index.value < list.value.length ? list.value[index.value] : null))

function show() {
  locked.value = false
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
  if (choice !== '-') feel('tap')
  index.value++
  if (index.value < list.value.length) {
    // 누른 쪽이 눌린 게 보이게 잠깐 두고 다음으로. 그사이 화면을 떠나면 다음 문제의 3초를 켜지 않는다 (떠난 뒤 저절로 답이 나가지 않게)
    timer = setTimeout(() => {
      timer = null
      if (!unmounted) show()
    }, 180)
  } else {
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
