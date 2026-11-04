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
        <QuizSetPlay
          v-if="key === 'daily-chosung'"
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
          <UiRollNumber class="t-display tabular-nums" :value="result.score" />
          <p class="t-caption">{{ result.scoreUnit }}</p>
          <p v-if="result.rank && result.rankOf && result.rankOf > 1" class="t-heading mt-5">
            {{ result.rankOf }}명 중 <span class="hl">{{ result.rank }}등</span>쯤이에요
          </p>
          <p v-if="result.feedback" class="t-body mt-3 whitespace-pre-line">{{ result.feedback }}</p>
        </UiCard>

        <UiCard class="mt-4">
          <p class="t-title">점수 저장하고 상대와 붙기</p>
          <p class="t-caption mt-1">시작하면 이 점수가 내 기록에 남고, 같은 문제로 다른 사람과 승패를 내요</p>
          <UiButton block size="lg" class="mt-4" @click="join">1초 만에 시작하기</UiButton>
        </UiCard>
        <UiButton v-if="key !== 'daily-chosung'" block variant="ghost" class="mt-2" :loading="starting" @click="start">한 판 더</UiButton>
      </template>

      <!-- 시작 전 -->
      <template v-else>
        <UiCard class="py-8 text-center">
          <BrandFace mood="wow" :size="64" class="mx-auto mb-3" />
          <p class="t-display">{{ meta.title }}</p>
          <p class="t-body text-fg-muted mt-3 break-keep">{{ meta.line }}</p>
          <p class="t-caption mt-3">가입 없이 바로 한 판 해 볼 수 있어요</p>
        </UiCard>
        <UiButton block size="lg" class="mt-4" :loading="starting" @click="start">한 판 하기</UiButton>
        <p v-if="startError" class="t-caption text-danger mt-3 text-center">{{ startError }}</p>
        <UiButton block variant="ghost" class="mt-2" @click="join">이미 계정이 있어요</UiButton>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
// 가입 없이 한 판 (/try/:key, 3단계 수요 조사 '로그인을 미룰까' C, 11/5)
// 조사 링크로 온 사람이 로그인 전에 도착 게임을 한 판 한다. 개인정보 없이 무작위 기기 번호(visitor_id)만 쓰고,
// 끝나면 "점수 저장하고 상대와 붙기"로 시작 화면에 보낸다. 로그인하면 claimGuestPlays가 이 판을 기록으로 옮긴다
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { POST } from '@/api/client'
import type { components } from '@/api/schema'
import BrandFace from '../../components/BrandFace.vue'
import AppCountdown from '../../components/appgame/AppCountdown.vue'
import QuizSetPlay from '../../components/appgame/QuizSetPlay.vue'
import TimeSensePlay from '../../components/appgame/TimeSensePlay.vue'
import { UiButton, UiCard, UiEmptyState, UiRollNumber, UiTopBar } from '../../components/ui'
import { GUEST_GAMES } from '@/utils/guestGames'
import { getVisitorId, markGuestPlayed } from '@/utils/visit'
import { rememberReturnTo } from '@/utils/authRedirect'
import { feel } from '@/utils/feel'

type Play = components['schemas']['GuestPlayResponse']
type Result = components['schemas']['GuestResultResponse']

const route = useRoute()
const router = useRouter()
const key = computed(() => String(route.params.key))
const meta = computed(() => (GUEST_GAMES as Record<string, { title: string; line: string }>)[key.value] ?? null)

// 이미 로그인했으면 원래 게임 화면으로
if (localStorage.getItem('raspy_access_token2')) router.replace(`/play/${key.value}`)

const play = ref<Play | null>(null)
const result = ref<Result | null>(null)
const counting = ref(false)
let offset = 0 // 서버 시각 - 기기 시각
const starting = ref(false)
const submitting = ref(false)
const startError = ref('')
const submitError = ref('')

function errorMessage(e: unknown, fallback: string) {
  return (e as { response?: { data?: { message?: string } } }).response?.data?.message || fallback
}

async function start() {
  const visitorId = getVisitorId()
  if (!visitorId) {
    startError.value = '이 브라우저에서는 가입 없이 할 수 없어요. 시작하고 해 주세요'
    return
  }
  starting.value = true
  startError.value = ''
  try {
    const p = (await POST('/api/guest/plays', { body: { visitorId, key: key.value } })).data
    offset = new Date(p.serverNow).getTime() - Date.now()
    counting.value = new Date(p.startedAt).getTime() > Date.now() + offset
    play.value = p
    result.value = null
    submitError.value = ''
  } catch (e) {
    startError.value = errorMessage(e, '시작하지 못했어요. 잠시 뒤 다시 해 주세요')
  } finally {
    starting.value = false
  }
}

async function submit(answer: string) {
  const visitorId = getVisitorId()
  if (!play.value || !visitorId) return
  submitting.value = true
  try {
    result.value = (await POST('/api/guest/plays/{playId}/submit', { path: { playId: play.value.playId }, body: { visitorId, answer } })).data
    markGuestPlayed()
    feel(result.value.score > 0 ? 'success' : 'lose')
    play.value = null
  } catch (e) {
    submitError.value = errorMessage(e, '내지 못했어요')
    play.value = null
  } finally {
    submitting.value = false
  }
}

/** 이어서 하는 판은 서버의 마감까지 남은 만큼만 */
function secondsLeft(p: Play) {
  const left = Math.floor((new Date(p.deadlineAt).getTime() - (Date.now() + offset)) / 1000)
  return Math.max(1, Math.min(p.timeLimitSeconds, left))
}

/** 시작 화면으로. 가입하면 이 게임 화면으로 돌아오고, 시작 화면은 버튼 누름을 '가입 전 한 판 끝'에서 센다 */
function join() {
  rememberReturnTo(`/play/${key.value}`)
  router.push({ path: '/init', query: { from: result.value ? 'guest' : undefined } })
}
</script>
