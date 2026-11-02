<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar :title="game?.title || '게임'" back />

    <main class="max-w-xl mx-auto px-4 pt-4 pb-16">
      <!-- 시작 전 3·2·1: 끝날 때까지 문제를 가린다 -->
      <AppCountdown v-if="play && counting" :until="new Date(play.startedAt).getTime()" :offset="offset" @done="counting = false" />

      <!-- 플레이 중: 게임마다 다른 판 -->
      <template v-else-if="play">
        <TypingPlay
          v-if="key === 'typing'"
          :problem="play.problem"
          :time-limit-seconds="secondsLeft(play)"
          :submitting="submitting"
          @submit="submit"
        />
        <RecipePlay
          v-else-if="key === 'recipe'"
          :problem="play.problem"
          :time-limit-seconds="secondsLeft(play)"
          :submitting="submitting"
          @submit="submit"
        />
        <SentencePlay
          v-else-if="key === 'sentence'"
          :problem="play.problem"
          :time-limit-seconds="secondsLeft(play)"
          :submitting="submitting"
          @submit="submit"
        />
        <DialogPlay
          v-else-if="key === 'debate'"
          :play-id="play.playId"
          :problem="play.problem"
          :time-limit-seconds="secondsLeft(play)"
          :submitting="submitting"
          @submit="submit"
        />
        <p v-if="submitError" class="t-caption text-danger mt-3">{{ submitError }}</p>
      </template>

      <!-- 방금 끝낸 판 -->
      <template v-else-if="result">
        <UiCard class="text-center py-8">
          <template v-if="result.status === 'COMPLETED'">
            <BrandFace v-if="result.result === 'WIN'" mood="wow" :size="64" class="mx-auto mb-3" />
            <p class="t-display">{{ VERDICT[result.result || 'DRAW'] }}</p>
            <p class="t-caption mt-2">
              <router-link v-if="result.opponent" :to="`/profile/${result.opponent.userId}`" class="underline underline-offset-2">{{ result.opponent.nickname }}</router-link>님과 대결
            </p>
            <div class="flex items-center justify-center gap-6 mt-6">
              <span>
                <UiRollNumber class="t-title tabular-nums" :value="result.myScore ?? 0" />
                <span class="block t-micro">나{{ isVote ? ' (표)' : '' }}</span>
              </span>
              <span class="t-caption">:</span>
              <span>
                <span class="block t-title tabular-nums text-fg-muted">{{ result.opponentScore ?? 0 }}</span>
                <span class="block t-micro">상대{{ isVote ? ' (표)' : '' }}</span>
              </span>
            </div>
            <p v-if="result.ratingChange != null" class="t-mono mt-4">
              레이팅 {{ result.ratingAfter }} ({{ result.ratingChange >= 0 ? '+' : '' }}{{ result.ratingChange }})
            </p>
          </template>
          <template v-else-if="result.myJudging">
            <UiSpinner class="mx-auto" />
            <p class="t-heading mt-4">{{ isVote ? '문장을 확인하고 있어요' : `${judgeName}가 채점하고 있어요` }}</p>
            <p class="t-caption mt-1">몇 초면 끝나요. 다른 화면으로 가도 끝나면 알림으로 알려 드릴게요</p>
          </template>
          <template v-else-if="result.status === 'VOTING'">
            <p class="t-title">투표 중이에요</p>
            <p class="t-caption mt-1">{{ until(result.votingEndsAt) }}까지 사람들이 투표해요. 끝나면 알려 드릴게요</p>
            <UiButton size="sm" variant="secondary" icon="share" class="mt-4" @click="shareVote(result.gameId)">투표 링크 복사</UiButton>
          </template>
          <template v-else-if="result.status === 'CANCELED'">
            <p class="t-title">취소된 대결이에요</p>
          </template>
          <template v-else-if="isVote">
            <p class="t-heading">{{ (result.myScore ?? 0) > 0 ? '문장이 올라갔어요' : '투표에 올리지 못했어요' }}</p>
            <p class="t-caption mt-1">{{ (result.myScore ?? 0) > 0 ? '같은 제시어로 다른 사람이 쓰면 24시간 투표가 시작돼요' : '' }}</p>
            <UiButton v-if="(result.myScore ?? 0) > 0 && result.status === 'WAITING'" size="sm" variant="secondary" icon="share" class="mt-4" :loading="challenging" @click="sendChallenge(result.gameId)">친구에게 도전장 보내기</UiButton>
          </template>
          <template v-else>
            <UiRollNumber class="t-display tabular-nums" :value="result.myScore ?? 0" />
            <p class="t-caption">{{ game?.scoreUnit }}</p>
            <p class="t-heading mt-6">상대를 찾고 있어요</p>
            <p class="t-caption mt-1">같은 문제를 다른 사람이 풀면 승패가 나요. 결과가 나오면 알려 드릴게요</p>
            <UiButton v-if="(result.myScore ?? 0) > 0" size="sm" variant="secondary" icon="share" class="mt-4" :loading="challenging" @click="sendChallenge(result.gameId)">친구에게 도전장 보내기</UiButton>
          </template>
        </UiCard>
        <!-- 다음 행동은 결과 바로 밑에. 긴 답·한마디는 그 아래 -->
        <UiButton block size="lg" class="mt-4" :loading="starting" :disabled="!game?.available" @click="start">한 판 더</UiButton>
        <UiButton block variant="ghost" class="mt-2" @click="closeResult">돌아가기</UiButton>
        <UiCard v-if="result.myFeedback" class="mt-3">
          <p class="t-micro">{{ game?.judge === 'AI' ? `${judgeName} 한마디` : '알림' }}</p>
          <p class="t-body mt-1">{{ result.myFeedback }}</p>
        </UiCard>
        <template v-if="isVote && (result.myAnswer || result.opponentAnswer)">
          <UiCard v-if="result.myAnswer" class="mt-3">
            <p class="t-micro">내 문장</p>
            <p class="t-body mt-1">{{ result.myAnswer }}</p>
          </UiCard>
          <UiCard v-if="result.opponentAnswer" class="mt-3">
            <p class="t-micro">상대 문장</p>
            <p class="t-body mt-1">{{ result.opponentAnswer }}</p>
          </UiCard>
        </template>
        <!-- 말싸움: 주고받은 말 -->
        <template v-if="key === 'debate'">
          <UiCard v-if="result.myAnswer" class="mt-3">
            <p class="t-micro">내 말싸움</p>
            <p class="t-caption mt-1 whitespace-pre-line">{{ result.myAnswer }}</p>
          </UiCard>
          <UiCard v-if="result.opponentAnswer" class="mt-3">
            <p class="t-micro">{{ result.opponent?.nickname }}님의 말싸움 · {{ result.opponentScore }}{{ game?.scoreUnit }}</p>
            <p class="t-caption mt-1 whitespace-pre-line">{{ result.opponentAnswer }}</p>
            <p v-if="result.opponentFeedback" class="t-caption mt-2">{{ judgeName }}: {{ result.opponentFeedback }}</p>
          </UiCard>
        </template>
        <template v-else-if="game?.judge === 'AI'">
          <UiCard v-if="result.myAnswer" class="mt-3">
            <p class="t-micro">내 요리</p>
            <p class="t-heading mt-1">{{ dish(result.myAnswer).name }}</p>
            <p class="t-caption mt-1 whitespace-pre-line">{{ dish(result.myAnswer).steps }}</p>
          </UiCard>
          <UiCard v-if="result.opponentAnswer" class="mt-3">
            <p class="t-micro">{{ result.opponent?.nickname }}님의 요리 · {{ result.opponentScore }}{{ game?.scoreUnit }}</p>
            <p class="t-heading mt-1">{{ dish(result.opponentAnswer).name }}</p>
            <p class="t-caption mt-1 whitespace-pre-line">{{ dish(result.opponentAnswer).steps }}</p>
            <p v-if="result.opponentFeedback" class="t-caption mt-2">AI 셰프: {{ result.opponentFeedback }}</p>
          </UiCard>
        </template>
      </template>

      <!-- 게임 첫 화면 -->
      <template v-else>
        <div v-if="!game" class="space-y-3">
          <UiSkeleton class="h-28 w-full" />
          <UiSkeleton class="h-14 w-full" />
        </div>
        <template v-else>
          <UiCard>
            <p class="t-caption">{{ game.summary }}</p>
            <div class="grid grid-cols-3 gap-2 mt-4 text-center">
              <span>
                <span class="block t-title tabular-nums">{{ game.myRating }}</span>
                <span class="block t-micro">레이팅</span>
              </span>
              <span>
                <span class="block t-title tabular-nums">{{ game.myWins }}<span class="t-caption">승</span> {{ game.myLosses }}<span class="t-caption">패</span></span>
                <span class="block t-micro">전적</span>
              </span>
              <span v-if="game.recordable">
                <span class="block t-title tabular-nums">{{ game.myBest ?? '-' }}</span>
                <span class="block t-micro">최고 기록</span>
              </span>
              <span v-else>
                <span class="block t-title tabular-nums">{{ game.myDraws }}</span>
                <span class="block t-micro">무승부</span>
              </span>
            </div>
          </UiCard>
          <UiButton block size="lg" class="mt-4" :loading="starting" :disabled="!game.available" @click="start">대결 시작</UiButton>
          <p v-if="!game.available" class="t-caption text-center mt-2">준비 중인 게임이에요</p>
          <p v-else class="t-caption text-center mt-2">
            기다리는 사람이 있으면 바로 붙고, 없으면 다음 사람을 기다려요<template v-if="game.dailyLimit"> · 하루 {{ game.dailyLimit }}판</template>
          </p>
          <p v-if="startError" class="t-caption text-danger text-center mt-2">{{ startError }}</p>

          <!-- 아직 안 끝난 내 대결은 시작 버튼 바로 밑에 -->
          <UiSection v-if="unfinished.length" title="진행 중" class="mt-8">
            <UiList>
              <UiListItem v-for="d in unfinished" :key="d.gameId" :title="duelTitle(d)" :subtitle="duelSubtitle(d)" @click="result = d">
                <template #trailing><UiBadge>{{ duelBadge(d) }}</UiBadge></template>
              </UiListItem>
            </UiList>
          </UiSection>

          <!-- 나머지는 탭 하나로: 순위 · 내 대결 · 투표 -->
          <UiTabs v-model="tab" :options="tabs" class="mt-8" />

          <section v-if="tab === 'rank'" class="mt-4">
            <UiTabs v-if="game.recordable" v-model="boardKind" :options="BOARDS" class="mb-3" />
            <template v-if="boardKind === 'RATING'">
              <UiList v-if="ranking.length">
                <UiListItem
                  v-for="r in ranking"
                  :key="r.userId"
                  :title="r.isCurrentUser ? `${r.userName} (나)` : r.userName"
                  :subtitle="`${r.playCount}판`"
                  chevron
                  @click="router.push('/profile/' + r.userId)"
                >
                  <template #leading>
                    <span class="w-6 t-mono text-center">{{ r.rank }}</span>
                    <UiAvatar :src="r.userAvatar" :name="r.userName" size="sm" />
                  </template>
                  <template #trailing><span class="t-mono">{{ r.rating }}</span></template>
                </UiListItem>
              </UiList>
              <UiEmptyState v-else icon="fas fa-ranking-star" title="아직 순위가 없어요" description="5판 넘게 한 사람부터 순위에 올라요" />
              <UiButton v-if="ranking.length" block variant="ghost" class="mt-2" :to="`/rules/${game.ruleId}/ranking`">레이팅 순위 전체 보기</UiButton>
            </template>
            <template v-else>
              <UiList v-if="board?.entries.length">
                <UiListItem
                  v-for="e in board.entries"
                  :key="e.player.userId"
                  :title="e.player.userId === board.mine?.player.userId ? `${e.player.nickname} (나)` : e.player.nickname"
                  @click="router.push('/profile/' + e.player.userId)"
                >
                  <template #leading>
                    <span class="w-6 t-mono text-center">{{ e.rank }}</span>
                    <UiAvatar :src="e.player.profilePicture" :name="e.player.nickname" size="sm" />
                  </template>
                  <template #trailing><span class="t-mono">{{ e.score }}{{ game.scoreUnit }}</span></template>
                </UiListItem>
              </UiList>
              <UiEmptyState v-else icon="fas fa-ranking-star" title="아직 기록이 없어요" description="첫 기록의 주인공이 되어 보세요" />
              <p v-if="board?.mine && !board.entries.some((e) => e.player.userId === board?.mine?.player.userId)" class="t-caption mt-3">
                내 순위 {{ board.mine.rank }}위 · {{ board.mine.score }}{{ game.scoreUnit }}
              </p>
            </template>
          </section>

          <section v-else-if="tab === 'mine'" class="mt-4">
            <UiList v-if="finished.length">
              <UiListItem v-for="d in finished" :key="d.gameId" :title="duelTitle(d)" :subtitle="duelSubtitle(d)" @click="result = d">
                <template #trailing>
                  <UiBadge :tone="d.result === 'WIN' ? 'primary' : 'neutral'">{{ duelBadge(d) }}</UiBadge>
                </template>
              </UiListItem>
            </UiList>
            <UiEmptyState v-else icon="fas fa-trophy" title="아직 끝난 대결이 없어요" description="첫 판을 해 보세요" />
          </section>

          <section v-else class="mt-4">
            <div v-if="votes.length" class="space-y-3">
              <VoteCard v-for="(c, i) in votes" :key="c.gameId" :card="c" @voted="votes[i] = $event" />
            </div>
            <UiEmptyState v-else icon="fas fa-check" title="지금 투표할 대결이 없어요" description="다른 사람들의 문장이 모이면 여기에 올라와요" />
          </section>
        </template>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
// 앱 게임 한 개 (/play/:key): 대결 시작 → 3·2·1 → 플레이 → 결과. 아래에 내 대결과 기록 순위
// 대결 결과 알림을 누르면 ?duel={id}로 들어와 그 결과를 바로 보여준다
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { GET, POST } from '@/api/client'
import type { components } from '@/api/schema'
import { refreshOnChange } from '@/websocket/userChannel'
import BrandFace from '../../components/BrandFace.vue'
import TypingPlay from '../../components/appgame/TypingPlay.vue'
import RecipePlay from '../../components/appgame/RecipePlay.vue'
import SentencePlay from '../../components/appgame/SentencePlay.vue'
import DialogPlay from '../../components/appgame/DialogPlay.vue'
import VoteCard from '../../components/appgame/VoteCard.vue'
import AppCountdown from '../../components/appgame/AppCountdown.vue'
import { copyText } from '../../utils/clipboard'
import { useToast } from '../../composable/useToast'
import {
  UiAvatar, UiBadge, UiButton, UiCard, UiEmptyState, UiList, UiListItem, UiRollNumber, UiSection, UiSkeleton, UiSpinner, UiTabs, UiTopBar,
} from '../../components/ui'

type Schemas = components['schemas']
type Duel = Schemas['AppDuelResponse']
type Play = Schemas['AppPlayResponse']

const VERDICT = { WIN: '이겼어요', LOSE: '졌어요', DRAW: '비겼어요' } as const
const BOARDS = [
  { value: 'RATING', label: '레이팅' },
  { value: 'WEEK', label: '이번 주 기록' },
  { value: 'ALL', label: '전체 기록' },
]
const DONE = ['COMPLETED', 'CANCELED']

const route = useRoute()
const router = useRouter()
const key = computed(() => String(route.params.key))
const game = ref<Schemas['AppGameSummary'] | null>(null)
const duels = ref<Duel[]>([])
const board = ref<Schemas['AppRecordBoard'] | null>(null)
const boardKind = ref<'RATING' | 'WEEK' | 'ALL'>('RATING')
const play = ref<Play | null>(null)
const counting = ref(false)
let offset = 0 // 서버 시각 - 기기 시각
const result = ref<Duel | null>(null)
const votes = ref<Schemas['AppVoteCard'][]>([])
const ranking = ref<Schemas['UserRankingDto'][]>([])
const isVote = computed(() => game.value?.judge === 'VOTE')
const unfinished = computed(() => duels.value.filter((d) => !DONE.includes(d.status)))
const finished = computed(() => duels.value.filter((d) => DONE.includes(d.status)))
// 투표 게임은 투표가 먼저 (남의 글에 표를 주는 게 이 게임의 절반)
const tab = ref<'rank' | 'mine' | 'vote'>('rank')
const tabs = computed(() => [
  ...(isVote.value ? [{ value: 'vote', label: '투표', count: votes.value.length || undefined }] : []),
  { value: 'rank', label: '순위' },
  { value: 'mine', label: '내 대결', count: finished.value.length || undefined },
])
const { showToast } = useToast()
const starting = ref(false)
const submitting = ref(false)
const startError = ref('')
const submitError = ref('')

async function load() {
  const [games, mine] = await Promise.all([
    GET('/api/app-games'),
    GET('/api/app-games/{key}/duels', { path: { key: key.value } }),
  ])
  const first = !game.value
  game.value = games.data.find((g) => g.key === key.value) ?? null
  if (first && game.value?.judge === 'VOTE') tab.value = 'vote'
  duels.value = mine.data
  // 결과 화면을 보고 있는 대결이 끝났으면 바로 바꿔 보여준다
  if (result.value) result.value = duels.value.find((d) => d.gameId === result.value?.gameId) ?? result.value
  if (game.value) ranking.value = ((await GET('/api/rules/{ruleId}/rankings', { path: { ruleId: game.value.ruleId } })).data.rankings ?? []).slice(0, 10)
  if (game.value?.recordable) await loadBoard()
  if (game.value?.judge === 'VOTE') votes.value = (await GET('/api/app-games/{key}/votes', { path: { key: key.value } })).data
}

async function loadBoard() {
  if (boardKind.value === 'RATING') return
  board.value = (await GET('/api/app-games/{key}/records', { path: { key: key.value }, query: { period: boardKind.value } })).data
}

function errorMessage(e: unknown, fallback: string) {
  return (e as { response?: { data?: { message?: string } } }).response?.data?.message || fallback
}

/** 판을 받는다. 서버가 정한 시작 시각이 아직이면 3·2·1부터 (이어서 하는 판은 바로) */
function begin(p: Play) {
  offset = new Date(p.serverNow).getTime() - Date.now()
  counting.value = new Date(p.startedAt).getTime() > Date.now() + offset
  play.value = p
}

async function start() {
  // 실시간 게임은 대기실 화면으로
  if (game.value?.playMode === 'REALTIME') return router.push(`/play/${key.value}/live`)
  starting.value = true
  startError.value = ''
  try {
    begin((await POST('/api/app-games/{key}/plays', { path: { key: key.value } })).data)
    result.value = null
    submitError.value = ''
  } catch (e) {
    startError.value = errorMessage(e, '시작하지 못했어요. 잠시 뒤 다시 해 주세요')
  } finally {
    starting.value = false
  }
}

async function submit(answer: string) {
  if (!play.value) return
  submitting.value = true
  try {
    result.value = (await POST('/api/app-games/plays/{playId}/submit', { path: { playId: play.value.playId }, body: { answer } })).data
    play.value = null
    load()
  } catch (e) {
    submitError.value = errorMessage(e, '내지 못했어요')
    play.value = null
    load()
  } finally {
    submitting.value = false
  }
}

/** 이어서 하는 판은 서버의 마감까지 남은 만큼만 */
function secondsLeft(p: Play) {
  const left = Math.floor((new Date(p.deadlineAt).getTime() - (Date.now() + offset)) / 1000)
  return Math.max(1, Math.min(p.timeLimitSeconds, left))
}

function until(at?: string) {
  if (!at) return ''
  const d = new Date(at)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** 도전장: 먼저 한 판을 친구에게 보낸다. 하루 동안은 그 링크로만 받을 수 있다 */
const challenging = ref(false)
async function sendChallenge(gameId: number) {
  challenging.value = true
  try {
    await POST('/api/app-games/duels/{gameId}/challenge', { path: { gameId } })
    showToast((await copyText(`${window.location.origin}/challenge/${gameId}`)) ? '도전장 링크를 복사했어요. 하루 동안 친구만 받을 수 있어요' : '복사하지 못했어요')
  } catch (e) {
    showToast(errorMessage(e, '도전장을 만들지 못했어요'))
  } finally {
    challenging.value = false
  }
}

/** 투표 공유 링크: 친구에게 보내 표를 받는다 */
async function shareVote(gameId: number) {
  showToast((await copyText(`${window.location.origin}/vote/${gameId}`)) ? '투표 링크를 복사했어요' : '복사하지 못했어요')
}

/** 요리 답: 첫 줄은 이름, 나머지는 만드는 법 */
// AI가 채점하는 게임마다 심판 이름
const judgeName = computed(() => (key.value === 'debate' ? 'AI 심판' : 'AI 셰프'))

function dish(answer: string) {
  const [name, ...rest] = answer.split('\n')
  return { name, steps: rest.join('\n') }
}

/**
 * 주소의 ?challenge·?resume를 지운다 (새로고침해도 다시 받지 않게).
 * router.replace를 쓰면 화면이 주소마다 새로 만들어져(App.vue) 방금 받은 판이 사라진다
 */
function dropQuery() {
  window.history.replaceState(window.history.state, '', route.path)
}

function closeResult() {
  result.value = null
  if (route.query.duel) router.replace({ query: {} })
}

function duelTitle(d: Duel) {
  if (d.opponent) return `${d.opponent.nickname}님과`
  return d.status === 'CANCELED' ? '상대 없이 끝난 대결' : '상대를 찾는 중'
}
function duelSubtitle(d: Duel) {
  const unit = game.value?.scoreUnit ?? ''
  if (d.status === 'COMPLETED') return `${d.myScore ?? 0} : ${d.opponentScore ?? 0}${unit}`
  if (d.status === 'CANCELED') return d.myFeedback || '시간 안에 내지 않아 취소됐어요'
  if (d.status === 'VOTING') return `투표 마감 ${until(d.votingEndsAt)}`
  if (d.myJudging) return isVote.value ? '문장을 확인하고 있어요' : 'AI 셰프가 채점하고 있어요'
  if (isVote.value) return d.myAnswer ?? ''
  return d.myScore != null ? `내 기록 ${d.myScore}${unit}` : '아직 내지 않았어요'
}
function duelBadge(d: Duel) {
  if (d.status === 'COMPLETED') return VERDICT[d.result || 'DRAW']
  if (d.status === 'CANCELED') return '취소'
  if (d.status === 'VOTING') return '투표 중'
  if (d.myJudging) return isVote.value ? '확인 중' : '채점 중'
  return d.opponent ? '상대 차례' : '기다리는 중'
}

watch(boardKind, loadBoard)

let stop: (() => void) | undefined
onMounted(async () => {
  await load()
  // 도전 링크로 왔으면 그 문제로 바로 시작
  const challengeId = Number(route.query.challenge)
  if (challengeId) {
    try {
      begin((await POST('/api/app-games/challenges/{gameId}/accept', { path: { gameId: challengeId } })).data)
    } catch (e) {
      startError.value = errorMessage(e, '도전을 받지 못했어요')
    }
    dropQuery()
  }
  // 내 경기의 '이어서 하기'로 왔으면 내지 않은 판을 바로 이어서 (서버가 같은 판을 돌려준다)
  if (route.query.resume) {
    dropQuery()
    await start()
  }
  const duelId = Number(route.query.duel)
  if (duelId) {
    result.value = duels.value.find((d) => d.gameId === duelId)
      ?? (await GET('/api/app-games/duels/{gameId}', { path: { gameId: duelId } })).data
  }
  // 상대가 플레이해서 결과가 나오면 서버가 신호를 보낸다
  stop = refreshOnChange(() => {
    if (!play.value) load()
  })
})
onBeforeUnmount(() => stop?.())
</script>
