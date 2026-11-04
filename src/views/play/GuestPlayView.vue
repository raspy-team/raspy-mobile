<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar :title="meta?.title || '한 판'" />

    <main class="max-w-xl mx-auto px-4 pt-4 pb-16">
      <UiEmptyState v-if="!meta" title="가입하고 할 수 있는 게임이에요" description="시작하면 모든 게임을 할 수 있어요">
        <UiButton to="/init">시작하기</UiButton>
      </UiEmptyState>

      <!-- 시작 전 3·2·1 -->
      <AppCountdown v-else-if="play && counting" :until="new Date(play.startedAt).getTime()" :offset="offset" @done="counting = false" />

      <!-- 플레이 중 -->
      <template v-else-if="play">
        <NunchiPlay
          v-if="key === 'nunchi'"
          :problem="play.problem"
          :time-limit-seconds="secondsLeft(play)"
          :submitting="submitting"
          @submit="submit"
        />
        <QuizSetPlay
          v-else-if="key === 'daily-chosung'"
          :problem="play.problem"
          :time-limit-seconds="secondsLeft(play)"
          :submitting="submitting"
          @submit="submit"
        />
        <TimeSensePlay
          v-else-if="key === 'time-sense'"
          :problem="play.problem"
          :time-limit-seconds="secondsLeft(play)"
          :submitting="submitting"
          @submit="submit"
        />
        <p v-if="submitError" class="t-caption text-danger mt-3">{{ submitError }}</p>
      </template>

      <!-- 끝난 판: 점수를 보여 주고, 저장하고 사람과 붙으려면 가입 -->
      <template v-else-if="result">
        <UiCard class="text-center py-8">
          <BrandFace :mood="result.score > 0 ? 'wow' : 'neutral'" :size="64" class="mx-auto mb-3" />
          <p v-if="key === 'nunchi'" class="t-micro">눈치 점수</p>
          <UiRollNumber class="t-display tabular-nums" :value="result.score" />
          <p class="t-caption">{{ result.scoreUnit }}</p>
          <p v-if="topPercent != null" class="t-heading mt-5">
            상위 <span class="hl">{{ topPercent }}%</span>
            <span class="t-caption block mt-1">{{ result.rankOf }}명 중 {{ result.rank }}등</span>
          </p>
          <p v-if="result.feedback" class="t-body mt-3 whitespace-pre-line">{{ result.feedback }}</p>
          <!-- 친구의 도전장으로 온 판 -->
          <p v-if="review?.challengerScore != null" class="t-heading mt-4">
            친구 {{ review.challengerScore }}점 ·
            {{ result.score > review.challengerScore ? '내가 이겼어요' : result.score < review.challengerScore ? '친구가 이겼어요' : '비겼어요' }}
          </p>
        </UiCard>

        <!-- 다음 행동: 친구에게 도전 · 공유 -->
        <div v-if="key === 'nunchi'" class="grid grid-cols-2 gap-2 mt-4">
          <UiButton variant="secondary" icon="share" :loading="sharing === 'challenge'" @click="challengeFriend">친구에게 도전</UiButton>
          <UiButton variant="secondary" icon="share" :loading="sharing === 'share'" @click="shareResult">결과 공유</UiButton>
        </div>

        <UiCard class="mt-4">
          <p class="t-title">점수 저장하고 상대와 붙기</p>
          <p class="t-caption mt-1">시작하면 이 점수가 내 기록에 남고, 같은 문제로 다른 사람과 승패를 내요</p>
          <UiButton block size="lg" class="mt-4" @click="join('result_join')">1초 만에 시작하기</UiButton>
        </UiCard>
        <UiButton v-if="key !== 'daily-chosung'" block variant="ghost" class="mt-2" :loading="starting" @click="again">한 판 더</UiButton>
        <!-- 하루 판 수를 넘기면 '한 판 더'가 아무 말 없이 멈추지 않게 이유를 보인다 -->
        <p v-if="startError" class="t-caption text-danger mt-2 text-center">{{ startError }}</p>

        <!-- 눈치 한 판: 내 취향이 다음 사람의 정답이 된다 (건너뛸 수 있다) -->
        <UiCard v-if="key === 'nunchi' && review && tasteState !== 'skipped' && (tasteCandidates.length || tasteState === 'done')" class="mt-4">
          <template v-if="tasteState === 'done'">
            <p class="t-title">고마워요. 다음 사람의 정답이 돼요</p>
            <ul class="mt-3 space-y-2">
              <li v-for="t in tasteResults" :key="t.id" class="t-body">
                <span class="text-fg-muted">{{ itemOf(t.id)?.q }}</span> · {{ choiceLabel(t.id, t.choice) }}
                <span class="block t-caption">당신과 같은 답을 고른 사람 <b class="text-fg">{{ t.sameRate }}%</b> ({{ t.people }}명 중)</span>
              </li>
            </ul>
          </template>
          <template v-else>
            <p class="t-title">다음 사람의 정답이 돼요</p>
            <p class="t-caption mt-1">당신 취향으로 3개만 골라 주세요</p>
            <ul class="mt-3 space-y-3">
              <li v-for="it in tasteCandidates" :key="it.id">
                <p class="t-caption">{{ it.q }}</p>
                <div class="grid grid-cols-2 gap-2 mt-1">
                  <UiButton
                    v-for="side in (['a', 'b'] as const)"
                    :key="side"
                    size="sm"
                    :variant="tastes[it.id] === side ? 'primary' : 'secondary'"
                    :disabled="!tastes[it.id] && pickedCount >= 3"
                    @click="toggleTaste(it.id, side)"
                  >
                    {{ it[side] }}
                  </UiButton>
                </div>
              </li>
            </ul>
            <div class="flex gap-2 mt-4">
              <UiButton class="flex-1" :disabled="!pickedCount" :loading="tasteState === 'sending'" @click="sendTastes">
                {{ pickedCount ? `${pickedCount}개 내기` : '골라 주세요' }}
              </UiButton>
              <UiButton variant="ghost" @click="skipTastes">건너뛰기</UiButton>
            </div>
          </template>
        </UiCard>

        <!-- 눈치 한 판: 문제마다 정답과 몇 명 기준 -->
        <UiSection v-if="key === 'nunchi' && review" title="문제마다" class="mt-6">
          <ul class="space-y-2">
            <li v-for="it in review.items" :key="it.id">
              <UiCard>
                <p class="t-body text-fg break-keep">{{ it.correct ? '⭕' : '❌' }} {{ it.q }}</p>
                <p class="t-caption mt-1">
                  정답 <b class="text-fg">{{ answerLabel(it) }}</b>
                  · {{ it.byFirst ? '처음 정답 (아직 사람이 적어요)' : `${it.people}명 기준` }}
                  <template v-if="it.percentA != null"> · {{ it.a }} {{ it.percentA }}%</template>
                </p>
                <p class="t-micro mt-0.5">내 답: {{ it.mine === 'a' ? it.a : it.mine === 'b' ? it.b : '시간 안에 못 골랐어요' }}</p>
              </UiCard>
            </li>
          </ul>
        </UiSection>
      </template>

      <!-- 시작 전 -->
      <template v-else>
        <UiCard class="py-8 text-center">
          <BrandFace mood="wow" :size="64" class="mx-auto mb-3" />
          <p class="t-display">{{ meta.title }}</p>
          <p class="t-body text-fg-muted mt-3 break-keep">{{ meta.line }}</p>
          <p v-if="fromPlay" class="t-heading mt-4">친구가 보낸 도전장이에요. 같은 문제로 붙어요</p>
          <p class="t-caption mt-3">가입 없이 바로 한 판 해 볼 수 있어요</p>
        </UiCard>
        <UiButton block size="lg" class="mt-4" :loading="starting" @click="start('start')">한 판 하기</UiButton>
        <p v-if="startError" class="t-caption text-danger mt-3 text-center">{{ startError }}</p>
        <UiButton block variant="ghost" class="mt-2" @click="join('intro_join')">이미 계정이 있어요</UiButton>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
// 가입 없이 한 판 (/try/:key, 3단계 수요 조사 '로그인을 미룰까' C, 11/5)
// 조사 링크로 온 사람이 로그인 전에 도착 게임을 한 판 한다. 개인정보 없이 무작위 기기 번호(visitor_id)만 쓰고,
// 끝나면 "점수 저장하고 상대와 붙기"로 시작 화면에 보낸다. 로그인하면 claimGuestPlays가 이 판을 기록으로 옮긴다
// 눈치 한 판(?q=첫 질문, ?c=친구의 판)은 결과에 문제마다 정답, 내 취향 받기, 친구 도전·공유가 붙는다. 버튼 하나하나 원본 기록(trackLog)에 남긴다
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { GET, POST } from '@/api/client'
import type { components } from '@/api/schema'
import BrandFace from '../../components/BrandFace.vue'
import AppCountdown from '../../components/appgame/AppCountdown.vue'
import QuizSetPlay from '../../components/appgame/QuizSetPlay.vue'
import TimeSensePlay from '../../components/appgame/TimeSensePlay.vue'
import NunchiPlay from '../../components/appgame/NunchiPlay.vue'
import { UiButton, UiCard, UiEmptyState, UiRollNumber, UiSection, UiTopBar } from '../../components/ui'
import { GUEST_GAMES } from '@/utils/guestGames'
import { getVisitorId, markGuestPlayed, trackEvent } from '@/utils/visit'
import { track } from '@/utils/trackLog'
import { rememberReturnTo } from '@/utils/authRedirect'
import { shareLink } from '@/utils/share'
import { useToast } from '../../composable/useToast'
import { feel } from '@/utils/feel'

type Schemas = components['schemas']
type Play = Schemas['GuestPlayResponse']
type Result = Schemas['GuestResultResponse']
type Review = Schemas['Review']
type ReviewItem = Schemas['ReviewItem']
type TasteResult = Schemas['TasteResult']

const route = useRoute()
const router = useRouter()
const { showToast } = useToast()
const key = computed(() => String(route.params.key))
const meta = computed(() => (GUEST_GAMES as Record<string, { title: string; line: string }>)[key.value] ?? null)
// 광고가 보여 준 질문(?q=)으로 시작, 친구의 도전장(?c=그 친구의 판)이면 같은 문제
const firstQuestion = typeof route.query.q === 'string' ? route.query.q : undefined
const fromPlay = Number(route.query.c) || undefined

// 이미 로그인했으면 원래 게임 화면으로
if (localStorage.getItem('raspy_access_token2')) router.replace({ path: `/play/${key.value}`, query: route.query })

const play = ref<Play | null>(null)
const playId = ref<number | null>(null)
const result = ref<Result | null>(null)
const review = ref<Review | null>(null)
const counting = ref(false)
let offset = 0 // 서버 시각 - 기기 시각
const starting = ref(false)
const submitting = ref(false)
const startError = ref('')
const submitError = ref('')
const sharing = ref<'' | 'challenge' | 'share'>('')
const rounds = ref(0)

const topPercent = computed(() => {
  const r = result.value
  if (!r?.rank || !r.rankOf || r.rankOf < 2) return null
  return Math.max(1, Math.round((r.rank / r.rankOf) * 100))
})

onMounted(() => {
  // 들어온 곳: 꼬리표(utm)·첫 질문·도전장. 방문(visit)과 같은 기기 번호로 잇는다
  track('try_open', { gameKey: key.value, value: window.location.search.slice(1, 400) || undefined })
})

function errorMessage(e: unknown, fallback: string) {
  return (e as { response?: { data?: { message?: string } } }).response?.data?.message || fallback
}

async function start(from: 'start' | 'again') {
  const visitorId = getVisitorId()
  if (!visitorId) {
    startError.value = '이 브라우저에서는 가입 없이 할 수 없어요. 시작하고 해 주세요'
    return
  }
  starting.value = true
  startError.value = ''
  try {
    // 한 판 더는 광고 질문·도전장 없이 새 문제로
    const body = { visitorId, key: key.value, first: from === 'start' ? firstQuestion : undefined, from: from === 'start' ? fromPlay : undefined }
    const p = (await POST('/api/guest/plays', { body })).data
    offset = new Date(p.serverNow).getTime() - Date.now()
    counting.value = new Date(p.startedAt).getTime() > Date.now() + offset
    play.value = p
    playId.value = p.playId
    rounds.value++
    result.value = null
    review.value = null
    tasteState.value = ''
    tastes.value = {}
    submitError.value = ''
    track('guest_play_start', { gameKey: key.value, step: rounds.value, value: `play=${p.playId}${body.first ? `;q=${body.first}` : ''}${body.from ? `;c=${body.from}` : ''}` })
  } catch (e) {
    startError.value = errorMessage(e, '시작하지 못했어요. 잠시 뒤 다시 해 주세요')
    track('guest_play_start_failed', { gameKey: key.value, value: startError.value })
  } finally {
    starting.value = false
  }
}

function again() {
  track('result_again', { gameKey: key.value, step: rounds.value })
  start('again')
}

async function submit(answer: string) {
  const visitorId = getVisitorId()
  if (!play.value || !visitorId) return
  submitting.value = true
  try {
    result.value = (await POST('/api/guest/plays/{playId}/submit', { path: { playId: play.value.playId }, body: { visitorId, answer } })).data
    markGuestPlayed()
    feel(result.value.score > 0 ? 'success' : 'lose')
    track('guest_play_result', { gameKey: key.value, step: rounds.value, value: `score=${result.value.score};rank=${result.value.rank ?? ''}/${result.value.rankOf ?? ''}` })
    play.value = null
    if (key.value === 'nunchi') loadReview()
  } catch (e) {
    submitError.value = errorMessage(e, '답을 내지 못했어요. 다시 해 주세요')
    track('guest_play_submit_failed', { gameKey: key.value, value: submitError.value })
    // 판이 닫히면 시작 화면으로 돌아가니, 판 아래에 둔 오류 대신 시작 화면 오류 칸에 남긴다 (안 그러면 아무 말 없이 처음으로 돌아간다)
    startError.value = submitError.value
    play.value = null
  } finally {
    submitting.value = false
  }
}

async function loadReview() {
  const visitorId = getVisitorId()
  if (!visitorId || !playId.value) return
  try {
    review.value = (await GET('/api/nunchi/guest-plays/{playId}/review', { path: { playId: playId.value }, query: { visitorId } })).data
  } catch {
    // 돌아보기가 없어도 점수는 보인다
  }
}

/** 이어서 하는 판은 서버의 마감까지 남은 만큼만 */
function secondsLeft(p: Play) {
  const left = Math.floor((new Date(p.deadlineAt).getTime() - (Date.now() + offset)) / 1000)
  return Math.max(1, Math.min(p.timeLimitSeconds, left))
}

/** 시작 화면으로. 가입하면 이 게임 화면으로 돌아오고, 시작 화면은 버튼 누름을 '가입 전 한 판 끝'에서 센다 */
function join(name: 'result_join' | 'intro_join') {
  track(name, { gameKey: key.value, step: rounds.value })
  rememberReturnTo(`/play/${key.value}`)
  router.push({ path: '/init', query: { from: result.value ? 'guest' : undefined } })
}

// ── 눈치 한 판: 친구 도전·공유 ──
async function challengeFriend() {
  if (!playId.value) return
  track('result_challenge', { gameKey: key.value, step: rounds.value, value: `play=${playId.value}` })
  trackEvent('challenge', 'nunchi')
  sharing.value = 'challenge'
  try {
    const msg = await shareLink(`${window.location.origin}/try/nunchi?c=${playId.value}`, `눈치 한 판 ${result.value?.score ?? 0}점. 같은 문제로 붙어 볼래요? 문제당 3초예요`)
    track('result_challenge_shared', { gameKey: key.value, value: msg || 'share' })
    if (msg) showToast(msg)
  } finally {
    sharing.value = ''
  }
}

async function shareResult() {
  track('result_share', { gameKey: key.value, step: rounds.value })
  sharing.value = 'share'
  try {
    const top = topPercent.value != null ? ` · 상위 ${topPercent.value}%` : ''
    const msg = await shareLink(`${window.location.origin}/try/nunchi`, `내 눈치 점수 ${result.value?.score ?? 0}점${top}. 남들은 뭘 골랐을까?`)
    track('result_share_shared', { gameKey: key.value, value: msg || 'share' })
    if (msg) showToast(msg)
  } finally {
    sharing.value = ''
  }
}

// ── 눈치 한 판: 내 취향 (3개까지, 건너뛸 수 있다) ──
const tastes = ref<Record<string, 'a' | 'b'>>({})
const tasteState = ref<'' | 'sending' | 'done' | 'skipped'>('')
const tasteResults = ref<TasteResult[]>([])
const pickedCount = computed(() => Object.keys(tastes.value).length)
const tasteCandidates = computed(() => (review.value?.items ?? []).filter((it) => !it.myTaste))
const itemOf = (id: string) => review.value?.items.find((it) => it.id === id)
const choiceLabel = (id: string, c: string) => (c === 'a' ? itemOf(id)?.a : itemOf(id)?.b)
const answerLabel = (it: ReviewItem) => (it.answer === 'tie' ? '반반 (둘 다 정답)' : it.answer === 'a' ? it.a : it.b)

function toggleTaste(id: string, side: 'a' | 'b') {
  const next = { ...tastes.value }
  if (next[id] === side) delete next[id]
  else if (next[id] || pickedCount.value < 3) next[id] = side
  tastes.value = next
  track('taste_pick', { gameKey: 'nunchi', value: `${id}:${next[id] ?? '-'}` })
}

async function sendTastes() {
  const visitorId = getVisitorId()
  if (!visitorId || !pickedCount.value) return
  tasteState.value = 'sending'
  try {
    const picks = Object.entries(tastes.value).map(([id, choice]) => ({ id, choice }))
    tasteResults.value = (await POST('/api/nunchi/tastes', { body: { visitorId, picks } })).data
    tasteState.value = 'done'
    track('taste_submit', { gameKey: 'nunchi', step: picks.length, value: picks.map((p) => `${p.id}:${p.choice}`).join(',') })
  } catch (e) {
    tasteState.value = ''
    showToast(errorMessage(e, '보내지 못했어요'))
  }
}

function skipTastes() {
  tasteState.value = 'skipped'
  track('taste_skip', { gameKey: 'nunchi', step: pickedCount.value })
}
</script>
