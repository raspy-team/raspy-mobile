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
        <SquatPlay
          v-else-if="key === 'squat'"
          :problem="play.problem"
          :time-limit-seconds="secondsLeft(play)"
          :submitting="submitting"
          @submit-video="submitVideo"
        />
        <PredictPlay
          v-else-if="key === 'predict'"
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
        <QuizSetPlay
          v-else-if="key === 'daily-chosung'"
          :problem="play.problem"
          :time-limit-seconds="secondsLeft(play)"
          :submitting="submitting"
          @submit="submit"
        />
        <WritePlay
          v-else-if="WRITING[key]"
          :problem="play.problem"
          :time-limit-seconds="secondsLeft(play)"
          :submitting="submitting"
          :guide="WRITING[key].guide"
          :placeholder="WRITING[key].placeholder"
          @submit="submit"
        />
        <p v-if="submitError" class="t-caption text-danger mt-3">{{ submitError }}</p>
      </template>

      <!-- 방금 끝낸 판 -->
      <template v-else-if="result">
        <UiCard class="text-center py-8">
          <template v-if="result.status === 'COMPLETED'">
            <!-- 진 순간에도 얼굴이 곁에 있다. 표정만 담담하게 -->
            <BrandFace :mood="result.result === 'WIN' ? 'wow' : 'neutral'" :size="64" class="mx-auto mb-3" />
            <p class="t-display">{{ VERDICT[result.result || 'DRAW'] }}</p>
            <p class="t-caption mt-2">
              <router-link v-if="result.opponent" :to="`/profile/${result.opponent.userId}`" class="underline underline-offset-2">{{ who(result.opponent) }}</router-link>님과 경기
            </p>
            <p v-if="NEXT_ROUND[result.result || '']" class="t-body mt-3">{{ NEXT_ROUND[result.result || ''] }}</p>
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
              실력 점수 {{ result.ratingAfter }} ({{ result.ratingChange >= 0 ? '+' : '' }}{{ result.ratingChange }})
            </p>
          </template>
          <template v-else-if="result.myJudging">
            <UiSpinner class="mx-auto" />
            <p class="t-heading mt-4">{{ isVote ? '문장을 확인하고 있어요' : `${judgeName}가 채점하고 있어요` }}</p>
            <p class="t-caption mt-1">몇 초면 끝나요. 다른 화면으로 가도 끝나면 알림으로 알려 드릴게요</p>
          </template>
          <!-- 스코어 맞히기: 둘 다 냈고 실제 경기가 끝나길 기다린다 -->
          <template v-else-if="result.status === 'AWAITING_RESULT'">
            <p class="t-title">경기 결과를 기다려요</p>
            <p class="t-caption mt-1">{{ kickoffLabel(fixtureOf(result.problem).kickoff) }} 경기가 끝나면 채점하고 알려 드릴게요</p>
            <p class="t-body mt-5">내 예상 <b class="tabular-nums">{{ predictionLine(result.problem, result.myAnswer) }}</b></p>
            <p v-if="result.opponentAnswer" class="t-caption mt-1">{{ who(result.opponent) }}님 예상 {{ predictionLine(result.problem, result.opponentAnswer) }}</p>
          </template>
          <template v-else-if="result.status === 'VOTING'">
            <p class="t-title">투표 중이에요</p>
            <p class="t-caption mt-1">{{ until(result.votingEndsAt) }}까지 사람들이 투표해요. 끝나면 알려 드릴게요</p>
            <UiButton size="sm" variant="secondary" icon="share" class="mt-4" @click="shareVote(result.gameId)">투표 링크 보내기</UiButton>
          </template>
          <template v-else-if="result.status === 'CANCELED'">
            <p class="t-title">취소된 경기예요</p>
          </template>
          <template v-else-if="key === 'predict' && result.status === 'WAITING'">
            <p class="t-heading">내 예상 {{ predictionLine(result.problem, result.myAnswer) }}</p>
            <p class="t-caption mt-1">같은 경기를 맞힐 상대를 찾고 있어요. 경기가 끝나면 채점해요</p>
            <UiButton size="sm" variant="secondary" icon="share" class="mt-4" :loading="challenging" @click="sendChallenge(result.gameId)">친구에게 도전장 보내기</UiButton>
          </template>
          <template v-else-if="isVote">
            <p class="t-heading">{{ (result.myScore ?? 0) > 0 ? '문장이 올라갔어요' : '투표에 올리지 못했어요' }}</p>
            <p class="t-caption mt-1">{{ (result.myScore ?? 0) > 0 ? '같은 제시어로 다른 사람이 쓰면 24시간 투표가 시작돼요' : '' }}</p>
            <UiButton v-if="(result.myScore ?? 0) > 0 && result.status === 'WAITING'" size="sm" variant="secondary" icon="share" class="mt-4" :loading="challenging" @click="sendChallenge(result.gameId)">친구에게 도전장 보내기</UiButton>
          </template>
          <template v-else>
            <UiRollNumber class="t-display tabular-nums" :value="result.myScore ?? 0" />
            <p class="t-caption">{{ game?.scoreUnit }}</p>
            <!-- 신뢰 사다리·소식 도전: 아무나가 아니라 그 사람을 기다린다 (11/4 밤샘) -->
            <template v-if="ladderTo">
              <p class="t-heading mt-6">{{ ladderName }}님을 기다려요</p>
              <p class="t-caption mt-1">도전장을 메시지로 보냈어요. {{ ladderName }}님이 같은 문제를 풀면 승패가 나요</p>
            </template>
            <template v-else>
              <p class="t-heading mt-6">상대를 찾고 있어요</p>
              <p class="t-caption mt-1">같은 문제를 다른 사람이 풀면 승패가 나요. 결과가 나오면 알려 드릴게요</p>
            </template>
            <UiButton v-if="!ladderTo && (result.myScore ?? 0) > 0" size="sm" variant="secondary" icon="share" class="mt-4" :loading="challenging" @click="sendChallenge(result.gameId)">친구에게 도전장 보내기</UiButton>
          </template>
        </UiCard>
        <!-- 다음 행동은 결과 바로 밑에. 긴 답·한마디는 그 아래 -->
        <!-- 하루 한 판 게임(오늘의 초성)은 '한 판 더'를 눌러도 할 수 없어 빼고, 공유가 다음 행동이 된다 -->
        <UiButton v-if="game?.dailyLimit !== 1" block size="lg" class="mt-4" :loading="starting" :disabled="!game?.available" @click="start">한 판 더</UiButton>
        <UiButton block variant="ghost" class="mt-2" @click="closeResult">돌아가기</UiButton>
        <!-- 끝난 판은 소식 카드와 같은 그림·링크로 보낸다 (11/4 밤샘: 이기고 스토리에 올릴 길이 소식 탭에만 있었다) -->
        <UiButton v-if="result.status === 'COMPLETED' && game?.dailyLimit !== 1" block variant="secondary" icon="share" class="mt-3" :loading="sharingResult" @click="openShare(result.gameId)">결과 보내기</UiButton>
        <UiCard v-if="result.myFeedback && result.status !== 'AWAITING_RESULT'" class="mt-3">
          <p class="t-micro">{{ game?.judge === 'AI' ? `${judgeName} 한마디` : '알림' }}</p>
          <p class="t-body mt-1">{{ result.myFeedback }}</p>
        </UiCard>
        <!-- 하루 퍼즐은 결과를 칸으로 공유한다 (답은 가리고) -->
        <UiButton v-if="key === 'daily-chosung' && result.myFeedback" block variant="secondary" icon="share" class="mt-3" @click="shareDaily(result.myFeedback)">오늘 결과 공유</UiButton>
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
            <p class="t-micro">{{ who(result.opponent) }}님의 말싸움 · {{ result.opponentScore }}{{ game?.scoreUnit }}</p>
            <p class="t-caption mt-1 whitespace-pre-line">{{ result.opponentAnswer }}</p>
            <p v-if="result.opponentFeedback" class="t-caption mt-2">{{ judgeName }}: {{ result.opponentFeedback }}</p>
          </UiCard>
        </template>
        <template v-else-if="key === 'recipe'">
          <UiCard v-if="result.myAnswer" class="mt-3">
            <p class="t-micro">내 요리</p>
            <p class="t-heading mt-1">{{ dish(result.myAnswer).name }}</p>
            <p class="t-caption mt-1 whitespace-pre-line">{{ dish(result.myAnswer).steps }}</p>
          </UiCard>
          <UiCard v-if="result.opponentAnswer" class="mt-3">
            <p class="t-micro">{{ who(result.opponent) }}님의 요리 · {{ result.opponentScore }}{{ game?.scoreUnit }}</p>
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
            <!-- 안 해 본 게임의 1500·0승 0패는 정보가 아니다. 첫 판을 권한다 (11/3) -->
            <p v-if="!played" class="t-body mt-3">아직 안 해 봤어요. 첫 판부터 실력 점수가 쌓여요.</p>
            <div v-else class="grid gap-2 mt-4 text-center" :class="game.recordable && game.myBest == null ? 'grid-cols-2' : 'grid-cols-3'">
              <span>
                <span class="block t-title tabular-nums">{{ game.myRating }}</span>
                <span class="block t-micro">실력 점수</span>
              </span>
              <span>
                <span class="block t-title tabular-nums">{{ game.myWins }}<span class="t-caption">승</span> {{ game.myLosses }}<span class="t-caption">패</span></span>
                <span class="block t-micro">전적</span>
              </span>
              <span v-if="game.recordable && game.myBest != null">
                <span class="block t-title tabular-nums">{{ game.myBest }}</span>
                <span class="block t-micro">최고 기록</span>
              </span>
              <span v-else-if="!game.recordable">
                <span class="block t-title tabular-nums">{{ game.myDraws }}</span>
                <span class="block t-micro">무승부</span>
              </span>
            </div>
            <p v-if="played" class="t-micro mt-3 text-center">전적·실력 점수는 사람과 한 판만 세요. 봇과 한 판은 연습이에요</p>
          </UiCard>
          <UiButton block size="lg" class="mt-4" :loading="starting" :disabled="!game.available" @click="start">한 판 하기</UiButton>
          <p v-if="!game.available" class="t-caption text-center mt-2">준비 중인 게임이에요</p>
          <p v-else class="t-caption text-center mt-2">
            <!-- 하루 한 판 퍼즐은 상대를 기다리는 게 아니라 같은 문제를 푼 사람들과 견준다 -->
            <template v-if="ladderTo && game.playMode === 'REALTIME'">{{ ladderName }}님만 들어오는 방을 열고 메시지로 도전장을 보내요. 들어오면 바로 시작해요</template>
            <template v-else-if="ladderTo && fromFeed">{{ ladderName }}님에게 도전해요. 먼저 한 판 하면 같은 문제로 도전장을 메시지로 보내요</template>
            <template v-else-if="ladderTo">만나기 전에 {{ ladderName }}님과 한 판 해요. 끝나면 같은 문제로 도전장을 메시지로 보내요</template>
            <template v-else-if="game.dailyLimit === 1">하루 한 번 풀 수 있어요. 오늘 같은 문제를 푼 사람들과 견줘요</template>
            <template v-else>기다리는 사람이 있으면 바로 시작하고, 없으면 다음 사람을 기다려요<template v-if="game.dailyLimit"> · 하루 {{ game.dailyLimit }}판</template></template>
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
                    <UiAvatar :src="r.userAvatar" :name="r.userName" :user-id="r.userId" size="sm" />
                  </template>
                  <template #trailing><span class="t-mono">{{ r.rating }}</span></template>
                </UiListItem>
              </UiList>
              <UiEmptyState v-else icon="fas fa-ranking-star" title="아직 순위가 비어 있어요" description="5판을 넘기면 첫 이름이 올라가요. 먼저 올라가 보세요" />
              <UiButton v-if="ranking.length" block variant="ghost" class="mt-2" :to="`/rules/${game.ruleId}/ranking`">순위 전체 보기</UiButton>
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
                    <UiAvatar :src="e.player.profilePicture" :name="e.player.nickname" :user-id="e.player.userId" size="sm" />
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
            <UiEmptyState v-else icon="fas fa-trophy" title="아직 끝난 경기가 없어요" description="첫 판을 해 보세요" />
          </section>

          <section v-else class="mt-4">
            <div v-if="votes.length" class="space-y-3">
              <VoteCard v-for="(c, i) in votes" :key="c.gameId" :card="c" @voted="votes[i] = $event" />
            </div>
            <UiEmptyState v-else icon="fas fa-check" title="지금 투표할 경기가 없어요" description="다른 사람들의 문장이 모이면 여기에 올라와요" />
          </section>
        </template>
      </template>
    </main>
    <ShareSheet :post="sharePost" :my-id="myId" @close="sharePost = null" />
  </div>
</template>

<script setup lang="ts">
import { who } from '@/utils/format'
// 앱 게임 한 개 (/play/:key): 대결 시작 → 3·2·1 → 플레이 → 결과. 아래에 내 대결과 기록 순위
// 대결 결과 알림을 누르면 ?duel={id}로 들어와 그 결과를 바로 보여준다
import { liveRoute } from '@/utils/battle'
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { GET, POST } from '@/api/client'
import api from '../../api/api'
import type { components } from '@/api/schema'
import { refreshOnChange } from '@/websocket/userChannel'
import BrandFace from '../../components/BrandFace.vue'
import { NEXT_ROUND } from '@/utils/verdict'
import { feel } from '@/utils/feel'
import TypingPlay from '../../components/appgame/TypingPlay.vue'
import RecipePlay from '../../components/appgame/RecipePlay.vue'
import SentencePlay from '../../components/appgame/SentencePlay.vue'
import DialogPlay from '../../components/appgame/DialogPlay.vue'
import { shareLink } from '@/utils/share'
import ShareSheet from '../../components/feed/story/ShareSheet.vue'
import { getMyId } from '@/utils/me'
import WritePlay from '../../components/appgame/WritePlay.vue'
import QuizSetPlay from '../../components/appgame/QuizSetPlay.vue'

// 글로 겨루는 게임: 같은 화면(WritePlay)에 안내만 다르게
const WRITING: Record<string, { guide: string; placeholder: string }> = {
  excuse: { guide: '이 상황에서 빠져나갈 한 줄 변명', placeholder: '그럴듯하고 웃긴 변명' },
  balance: { guide: '둘 중 하나를 골라 이유로 설득해 주세요', placeholder: '예) 여름: 수박이 있으니까요' },
  trial: { guide: '피고가 되어 AI 판사를 설득하는 변론', placeholder: '존경하는 재판장님, 사실은…' },
}
import PredictPlay from '../../components/appgame/PredictPlay.vue'
import SquatPlay from '../../components/appgame/SquatPlay.vue'
import { fixtureOf, kickoffLabel, predictionLine } from '@/utils/predict'
import VoteCard from '../../components/appgame/VoteCard.vue'
import AppCountdown from '../../components/appgame/AppCountdown.vue'
import { useToast } from '../../composable/useToast'
import {
  UiAvatar, UiBadge, UiButton, UiCard, UiEmptyState, UiList, UiListItem, UiRollNumber, UiSection, UiSkeleton, UiSpinner, UiTabs, UiTopBar,
} from '../../components/ui'

type Schemas = components['schemas']
type Duel = Schemas['AppDuelResponse']
type Play = Schemas['AppPlayResponse']

const VERDICT = { WIN: '이겼어요', LOSE: '졌어요', DRAW: '비겼어요' } as const
const BOARDS = [
  { value: 'RATING', label: '실력 점수' },
  { value: 'WEEK', label: '이번 주 기록' },
  { value: 'ALL', label: '전체 기록' },
]
const DONE = ['COMPLETED', 'CANCELED']

const route = useRoute()
const router = useRouter()
const key = computed(() => String(route.params.key))
const game = ref<Schemas['AppGameSummary'] | null>(null)
// 봇과만 한 판은 전적(사람과 한 판)에 안 들어가니, 해 봤는지는 마지막으로 한 때로도 본다 (11/3 통계 개편)
const played = computed(() => !!game.value && (!!game.value.myLastPlayedAt || (game.value.myWins || 0) + (game.value.myLosses || 0) + (game.value.myDraws || 0) > 0))
const duels = ref<Duel[]>([])
const board = ref<Schemas['AppRecordBoard'] | null>(null)
const boardKind = ref<'RATING' | 'WEEK' | 'ALL'>('RATING')
const play = ref<Play | null>(null)
const counting = ref(false)
let offset = 0 // 서버 시각 - 기기 시각
const result = ref<Duel | null>(null)
// 신뢰 사다리 (안전·신뢰 D): 경기 신청자와 만나기 전에 한 판. ?to=사람&toName=이름으로 오면 새 판을 열고, 끝나면 그 사람에게 도전장을 메시지로 보낸다
const ladderTo = Number(route.query.to) || null
const ladderName = String(route.query.toName || '상대')
// 소식 카드의 '도전해요'로 왔다 (같은 길, 문구만 다르다)
const fromFeed = route.query.from === 'feed'
let ladderSent = false
watch(() => result.value?.gameId, async (gameId) => {
  if (!ladderTo || ladderSent || !gameId || result.value?.status !== 'WAITING') return
  ladderSent = true
  try {
    await POST('/api/app-games/duels/{gameId}/challenge', { path: { gameId }, query: { to: ladderTo, from: fromFeed ? 'feed' : undefined } })
    showToast(`${ladderName}님에게 도전장을 메시지로 보냈어요. 받으면 같은 문제로 붙어요`)
  } catch (e) {
    ladderSent = false
    showToast(errorMessage(e, '도전장을 보내지 못했어요'))
  }
})
// 결과가 '끝남'으로 바뀌는 순간 한 번 (지난 경기를 다시 열어 볼 때는 조용히)
watch(result, (now, before) => {
  if (now?.status !== 'COMPLETED' || !now.result) return
  if (before?.gameId === now.gameId ? before.status === 'COMPLETED' : !justSubmitted) return
  justSubmitted = false
  const r = now.result
  feel(r === 'WIN' ? 'win' : r === 'DRAW' ? 'success' : 'lose')
})
let justSubmitted = false
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
  { value: 'mine', label: '내 경기', count: finished.value.length || undefined },
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
  // 실시간 게임은 대기실 화면으로. 정한 사람에게 도전하면 그 사람만 들어오는 방(턴제만. 함께 쓰는 판·실시간 대전은 아직 없다)
  if (ladderTo && (game.value?.shared || game.value?.battle)) {
    startError.value = '이 게임은 아직 도전장을 보낼 수 없어요'
    return
  }
  if (ladderTo && game.value?.playMode === 'REALTIME') return router.push({ path: `/play/${key.value}/live`, query: { to: ladderTo, toName: ladderName } })
  if (game.value?.shared) return router.push(`/play/${key.value}/board`)
  if (game.value?.playMode === 'REALTIME') return router.push(game.value.battle ? `/play/${key.value}/battle` : liveRoute(key.value))
  starting.value = true
  startError.value = ''
  try {
    begin((await POST('/api/app-games/{key}/plays', { path: { key: key.value }, query: ladderTo ? { solo: true } : undefined })).data)
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
    justSubmitted = true
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

/** 기록 인증(스쿼트): 영상을 올리면 서버가 AI에게 세게 하고, 영상은 남기지 않는다 */
async function submitVideo(video: Blob) {
  if (!play.value) return
  submitting.value = true
  try {
    const fd = new FormData()
    fd.append('video', video, video.type.includes('mp4') ? 'proof.mp4' : 'proof.webm')
    justSubmitted = true
    result.value = (await api.post(`/api/app-games/plays/${play.value.playId}/proof`, fd, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 })).data
    play.value = null
    load()
  } catch (e) {
    submitError.value = errorMessage(e, '영상을 올리지 못했어요')
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
    // 폰에서는 공유 시트(카톡으로 바로), 안 되면 복사 (11/4 밤샘: 복사만 하면 카톡을 따로 열어 붙여 넣어야 했다)
    const msg = await shareLink(`${window.location.origin}/challenge/${gameId}`, `${game.value?.title ?? '한 판'} 도전장이에요. 나보다 잘할 수 있어요?`)
    if (msg) showToast(`${msg}. 하루 동안 이 링크로만 받을 수 있어요`)
  } catch (e) {
    showToast(errorMessage(e, '도전장을 만들지 못했어요'))
  } finally {
    challenging.value = false
  }
}

/** 오늘의 초성 결과: "4/5 맞힘 · 38초" → 칸 그림과 함께. 같은 날이면 친구도 같은 문제를 푼다 */
async function shareDaily(feedback: string) {
  const right = Number(feedback.match(/(\d)\/5/)?.[1] ?? 0)
  const boxes = '■'.repeat(right) + '□'.repeat(5 - right)
  const msg = await shareLink(`${window.location.origin}/play/daily-chosung`, `오늘의 초성 ${feedback}\n${boxes}\n같은 문제로 붙어 봐요`)
  if (msg) showToast(msg)
}

/** 끝난 판 보내기: 소식 카드를 받아 ShareSheet(링크 미리보기·스토리 그림)로 */
const sharePost = ref<unknown>(null)
const sharingResult = ref(false)
const myId = ref<number | null>(null)
getMyId().then((id) => (myId.value = id))
async function openShare(gameId: number) {
  sharingResult.value = true
  try {
    sharePost.value = (await GET('/api/feed/game/{gameId}', { path: { gameId } })).data
  } catch {
    showToast('결과를 불러오지 못했어요')
  } finally {
    sharingResult.value = false
  }
}

/** 투표 공유 링크: 친구에게 보내 표를 받는다 */
async function shareVote(gameId: number) {
  const msg = await shareLink(`${window.location.origin}/vote/${gameId}`, `${game.value?.title ?? '대결'} 투표 좀 해 줘요. 어느 쪽이 나아요?`)
  if (msg) showToast(msg)
}

/** 요리 답: 첫 줄은 이름, 나머지는 만드는 법 */
// AI가 채점하는 게임마다 심판 이름
const judgeName = computed(() => (key.value === 'recipe' ? 'AI 셰프' : key.value === 'trial' ? 'AI 판사' : 'AI 심판'))

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
  if (d.opponent) return `${who(d.opponent)}님과`
  return d.status === 'CANCELED' ? '상대 없이 끝난 경기' : '상대를 찾는 중'
}
function duelSubtitle(d: Duel) {
  const unit = game.value?.scoreUnit ?? ''
  if (d.status === 'COMPLETED') return `${d.myScore ?? 0} : ${d.opponentScore ?? 0}${unit}`
  if (d.status === 'CANCELED') return d.myFeedback || '시간 안에 내지 않아 취소됐어요'
  if (d.status === 'VOTING') return `투표 마감 ${until(d.votingEndsAt)}`
  if (d.status === 'AWAITING_RESULT' || (key.value === 'predict' && d.myAnswer)) return `내 예상 ${predictionLine(d.problem, d.myAnswer)}`
  if (d.myJudging) return isVote.value ? '문장을 확인하고 있어요' : `${judgeName.value}가 채점하고 있어요`
  if (isVote.value) return d.myAnswer ?? ''
  return d.myScore != null ? `내 기록 ${d.myScore}${unit}` : '아직 내지 않았어요'
}
function duelBadge(d: Duel) {
  if (d.status === 'COMPLETED') return VERDICT[d.result || 'DRAW']
  if (d.status === 'CANCELED') return '취소'
  if (d.status === 'VOTING') return '투표 중'
  if (d.status === 'AWAITING_RESULT') return '결과 기다림'
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
