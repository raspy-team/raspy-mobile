<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar :title="meta?.title || '한 판'" />

    <main class="max-w-xl mx-auto px-4 pt-4 pb-16">
      <UiEmptyState v-if="!meta" mascot="kok" title="가입하고 할 수 있는 게임이에요" description="시작하면 모든 게임을 할 수 있어요. 가입 없이 바로 해 볼 수 있는 게임도 있어요">
        <div class="flex flex-col items-center gap-2">
          <UiButton to="/init">시작하기</UiButton>
          <UiButton to="/try/nunchi" variant="ghost">가입 없이 눈치 한 판</UiButton>
        </div>
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
        <ImprovPlay
          v-else-if="key === 'improv'"
          :play-id="play.playId"
          :visitor-id="visitorIdNow"
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
        <!-- 임기응변: 채점이 막혀도 쓴 답을 잃지 않는다. 같은 답으로 다시 낸다 (걷기 C7) -->
        <UiButton v-if="submitError && key === 'improv' && lastAnswer" block class="mt-2" :loading="submitting" @click="submit(lastAnswer)">다시 채점하기</UiButton>
      </template>

      <!-- 끝난 판: 점수를 보여 주고, 저장하고 사람과 붙으려면 가입 -->
      <template v-else-if="result">
        <UiCard class="text-center py-8">
          <MatchMascot :who="key === 'improv' ? 'match' : 'kok'" :mood="result.score > 0 ? 'cheer' : 'smile'" :size="72" class="mx-auto mb-3" />
          <p v-if="key === 'nunchi'" class="t-micro">눈치 점수</p>
          <!-- 등급이 안 나온 판(셋 다 빈 답·마감 넘김)도 임기응변 틀 그대로, 할 일은 '다시 하기' 하나 -->
          <template v-if="improv?.empty">
            <p class="t-micro">임기응변 등급</p>
            <p class="t-title mt-2 break-keep">{{ improv.empty }}</p>
            <p class="t-caption mt-2 break-keep">상황마다 한마디만 써도 등급이 나와요</p>
            <UiButton block size="lg" class="mt-5" :loading="starting" @click="again">다시 하기</UiButton>
          </template>
          <template v-else-if="improv">
            <p class="t-micro">임기응변 등급</p>
            <p class="t-display tabular-nums">{{ improv.grade }}<span class="t-title ml-1">등급</span></p>
            <p class="t-caption mt-1">100명 중 {{ improv.rank }}등 · {{ result.score }}점</p>
            <!-- 친구의 도전장으로 온 판: 누가 이겼나 (걷기 C1: "붙자고 해서 했는데 누가 이겼는지가 안 나와") -->
            <p v-if="result.challengerScore != null" class="t-heading mt-4">
              친구 {{ challengerGrade }} ·
              {{ result.score > result.challengerScore ? '내가 이겼어요' : result.score < result.challengerScore ? '친구가 이겼어요' : '비겼어요' }}
            </p>
            <!-- 왜 이 등급인가, 다음엔 무엇을 (걷기 P1-7) -->
            <p v-if="improv.strong" class="t-body mt-4 break-keep">잘한 것 <b>{{ improv.strong }}</b> · 아쉬운 것 <b>{{ improv.weak }}</b></p>
            <p v-if="improv.tip" class="t-caption mt-1 break-keep">다음엔 {{ improv.tip }}</p>
            <!-- 다음 판의 목표 (3-5 마지막 걷기: "다음 판 목표가 안 보임") -->
            <p v-if="improv.next" class="t-label mt-3"><span class="hl">{{ improv.next }}</span></p>
          </template>
          <template v-if="!improv">
          <UiRollNumber class="t-display tabular-nums" :value="result.score" />
          <p class="t-caption">{{ result.scoreUnit }}</p>
          </template>
          <p v-if="topPercent != null && !improv" class="t-heading mt-5">
            상위 <span class="hl">{{ topPercent }}%</span>
            <span class="t-caption block mt-1">{{ result.rankOf }}명 중 {{ result.rank }}등</span>
          </p>
          <p v-if="result.feedback && !improv" class="t-body mt-3 whitespace-pre-line">{{ result.feedback }}</p>
          <!-- 친구의 도전장으로 온 판 -->
          <p v-if="review?.challengerScore != null" class="t-heading mt-4">
            친구 {{ review.challengerScore }}점 ·
            {{ result.score > review.challengerScore ? '내가 이겼어요' : result.score < review.challengerScore ? '친구가 이겼어요' : '비겼어요' }}
          </p>
        </UiCard>

        <!-- 임기응변 등급: 보내기가 등급 바로 밑 (걷기 C5: 카드 셋 아래라 "버튼이 어디 있어"), 그 아래 상황마다 내 대답과 인물 반응 -->
        <template v-if="improv">
          <div v-if="!improv.empty" class="grid grid-cols-2 gap-2 mt-4">
            <UiButton icon="instagram" :disabled="!storyReady" @click="shareStory">인스타 스토리</UiButton>
            <!-- 도전장으로 온 판이면 '결과 보내기': 이긴 사람이 진 사람에게 알리는 말이 곧 보낸 친구를 다시 부르는 신호다 (손님에겐 알림이 없다) -->
            <UiButton variant="secondary" icon="share" :loading="sharing === 'challenge'" @click="challengeFriend">{{ result.challengerScore != null ? '결과 보내기' : '도전장 보내기' }}</UiButton>
          </div>
          <UiCard v-for="(s, i) in improvShown" :key="s.id" class="mt-3">
            <p class="t-micro">{{ s.who }}</p>
            <p class="t-caption mt-1 break-keep">“{{ s.line }}”</p>
            <p class="t-body mt-2 break-keep">나: {{ improvSaid[i] || '(대답 없음)' }}</p>
            <p v-if="improv.reactions[i]" class="t-caption mt-1 break-keep">→ {{ improv.reactions[i] }}</p>
            <!-- 도전장: 친구의 답을 나란히 (놀림 거리가 바로 이것, 걷기 P4) -->
            <p v-if="friendSaid.length" class="t-body mt-3 pt-3 border-t border-line break-keep text-fg-muted">친구: {{ friendSaid[i] || '(대답 없음)' }}</p>
          </UiCard>
          <ImprovSentChallenges :visitor-id="visitorIdNow" class="mt-4" />
        </template>

        <!-- 다음 행동: 친구에게 도전 · 공유 -->
        <div v-if="key === 'nunchi'" class="grid grid-cols-2 gap-2 mt-4">
          <UiButton variant="secondary" icon="share" :loading="sharing === 'challenge'" @click="challengeFriend">친구에게 도전</UiButton>
          <UiButton variant="secondary" icon="share" :loading="sharing === 'share'" @click="shareResult">결과 공유</UiButton>
        </div>

        <UiCard v-if="!improv?.empty" class="mt-4">
          <!-- 가입하며 옮긴 판은 기록(최고 기록·기록 순위)에만 남고 승패는 없다(0승 0패). 지키지 못하는 말을 하지 않는다 (first10 검토) -->
          <p class="t-title">{{ improv ? '등급 남기고 사람과 붙기' : '점수 저장하고 사람과 붙기' }}</p>
          <p class="t-caption mt-1">{{ improv ? '시작하면 이 등급이 내 기록에 남아요. 다음 판부터는 같은 상황을 푼 모르는 사람과 1:1로 승패를 내요' : '시작하면 이 점수가 내 기록에 남아 기록 순위에 올라가요. 다음 판부터는 사람과 승패를 내요' }}</p>
          <UiButton block size="lg" class="mt-4" @click="join('result_join')">{{ improv ? '등급 남기기' : '1초 만에 시작하기' }}</UiButton>
        </UiCard>
        <UiButton v-if="key !== 'daily-chosung' && !improv?.empty" block variant="ghost" class="mt-2" :loading="starting" @click="again">한 판 더</UiButton>
        <!-- 하루 판 수를 넘기면 '한 판 더'가 아무 말 없이 멈추지 않게 이유를 보인다 -->
        <p v-if="startError" class="t-caption text-danger mt-2 text-center">{{ startError }}</p>

        <!-- 눈치 한 판: 문제마다 정답과 몇 명 기준 -->
        <UiSection v-if="key === 'nunchi' && review" title="문제마다" class="mt-6">
          <!-- 표가 적은 문제의 'AI 추정'은 여기 한 번만 (줄마다 열 번 되풀이되면 읽기 힘들었다) -->
          <p v-if="aiCount" class="t-caption mb-3">{{ aiCount === review.items.length ? '아직 표가 적어 정답은 AI 추정이에요' : `${aiCount}문제는 아직 표가 적어 AI 추정이에요` }}. 사람이 {{ review.items[0]?.minVotes ?? 5 }}명 모이면 실제 취향으로 바뀌어요</p>
          <ul class="space-y-2">
            <li v-for="it in review.items" :key="it.id">
              <UiCard>
                <!-- 맞음·틀림은 그림 글자 대신 아이콘 + 읽어 주는 말. 틀림을 빨강으로 칠하지 않는다 (ui/README: 패배는 흐린 글자) -->
                <p class="t-body text-fg break-keep flex items-start gap-1.5">
                  <UiIcon :name="it.correct ? 'check' : 'xmark'" class="mt-1 flex-shrink-0" :class="it.correct ? 'text-signal-fg' : 'text-fg-subtle'" aria-hidden="true" />
                  <span><span class="sr-only">{{ it.correct ? '맞힘: ' : '틀림: ' }}</span>{{ it.q }}</span>
                </p>
                <p class="t-caption mt-1">
                  <!-- 비율은 정답 쪽 것만: '정답 집 · 노래방 35%'처럼 다른 보기의 비율이 붙으면 무엇이 몇 %인지 헷갈렸다 (first10 검토) -->
                  정답 <b class="text-fg">{{ answerLabel(it) }}</b>
                  <template v-if="it.percentA != null && it.answer !== 'tie'"> · {{ it.answer === 'a' ? it.percentA : 100 - it.percentA }}%</template>
                  · {{ it.byFirst ? 'AI 추정' : `${it.people}명 기준` }}
                </p>
                <p class="t-micro mt-0.5">내 답: {{ it.mine === 'a' ? it.a : it.mine === 'b' ? it.b : '시간 안에 못 골랐어요' }}</p>
              </UiCard>
            </li>
          </ul>
        </UiSection>

        <!-- 눈치 한 판: 내 취향이 다음 사람의 정답이 된다 (건너뛸 수 있다) -->
        <UiCard v-if="key === 'nunchi' && review && tasteState !== 'skipped' && (tasteCandidates.length || tasteState === 'done')" class="mt-4">
          <template v-if="tasteState === 'done'">
            <p class="t-title">고마워요. 다음 사람의 정답이 돼요</p>
            <ul class="mt-3 space-y-2">
              <li v-for="t in tasteResults" :key="t.id" class="t-body">
                <span class="text-fg-muted">{{ itemOf(t.id)?.q }}</span> · {{ choiceLabel(t.id, t.choice) }}
                <!-- 표가 적으면 '100%(1명 중)' 대신 AI 추정 비율이라고 밝힌다 (docs/ai-residents.md 6) -->
                <span v-if="t.byAi" class="block t-caption">같은 답 <b class="text-fg">{{ t.sameRate }}%</b> · AI 추정</span>
                <span v-else class="block t-caption">당신과 같은 답을 고른 사람 <b class="text-fg">{{ t.sameRate }}%</b> ({{ t.people }}명 중)</span>
              </li>
            </ul>
            <p v-if="tasteResults.some((t) => t.byAi)" class="t-micro mt-3">AI 추정은 사람이 {{ tasteResults[0]?.minVotes ?? 5 }}명 모이면 실제 비율로 바뀌어요</p>
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
                    :variant="tastes[it.id] === side ? 'primary' : 'secondary'"
                    :aria-pressed="tastes[it.id] === side"
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

      </template>

      <!-- 시작 전 -->
      <template v-else>
        <UiCard class="py-8 text-center">
          <!-- 처음 온 사람의 길잡이는 콕이 (docs/mascots.md) -->
          <!-- 임기응변은 요리사 모자(콕이) 대신 매치 얼굴 (3-5 UI) -->
          <MatchMascot :who="key === 'improv' ? 'match' : 'kok'" mood="wow" :size="72" class="mx-auto mb-3" />
          <!-- 임기응변: 이름은 위 막대에 이미 있다 (걷기 P1-2: 두 번 보였다). 큰 글자 자리는 광고 상황·소개가 쓴다 -->
          <p v-if="key !== 'improv'" class="t-display">{{ meta.title }}</p>
          <!-- 광고에서 본 질문(?q=)을 그대로 보여 준다: 광고 → 처음 보는 화면 사이가 끊기지 않게 -->
          <!-- 임기응변: 광고·글이 보여 준 상황(?q=)이 곧 시작 화면이다 (걷기 C3·P1-1: "광고에서 본 교수님 질문은 어디 있어?") -->
          <template v-if="adSituation">
            <p class="t-caption mt-4 break-keep">{{ adSituation.who }}</p>
            <p class="t-title mt-1 break-keep">“{{ adSituation.line }}”</p>
            <p class="t-caption mt-2 break-keep">45초 안에 뭐라고 할래? 교수님·선배·동기, 상황 셋이면 등급이 나와요</p>
          </template>
          <template v-else-if="adQuestion">
            <p class="t-title mt-4 break-keep">{{ adQuestion.q }}</p>
            <p class="t-body mt-1"><b>{{ adQuestion.a }}</b> <span class="text-fg-subtle">vs</span> <b>{{ adQuestion.b }}</b></p>
            <p class="t-caption mt-2 break-keep">남들은 뭘 골랐을까? 이 문제부터 열 문제, 문제당 3초</p>
          </template>
          <!-- 임기응변: 짧은 제목 + 본문 크기 설명 (320폭에서 제목 크기 다섯 줄이라 눈 둘 곳이 없었다, 3-5 UI U2) -->
          <template v-else-if="key === 'improv'">
            <p class="t-title break-keep">{{ intro.title }}</p>
            <p class="t-body text-fg-muted mt-2 break-keep">{{ intro.body }}</p>
          </template>
          <p v-else class="t-body text-fg-muted mt-3 break-keep">{{ meta.line }}</p>
          <!-- 임기응변 도전장: 친구가 몇 등급을 받았는지가 곧 이유다 (걷기 P4: "도전장 첫 화면에 친구 등급이 없음") -->
          <p v-if="fromPlay && key === 'improv' && challengeGrade" class="t-heading mt-4 break-keep">친구가 <span class="hl">{{ challengeGrade }}</span> 받은 상황이에요. 이길 수 있어요?</p>
          <!-- 열쇠 없는 옛 임기응변 링크도 같은 상황으로 붙는다 (친구 등급은 열쇠가 있어야 보인다) -->
          <p v-else-if="fromPlay && (key !== 'improv' || !challengeK)" class="t-heading mt-4">친구가 보낸 도전장이에요. 같은 {{ key === 'improv' ? '상황' : '문제' }}으로 붙어요</p>
          <p class="t-caption mt-3">가입 없이 바로 한 판 해 볼 수 있어요</p>
        </UiCard>
        <UiButton block size="lg" class="mt-4" :loading="starting" @click="start('start')">{{ key === 'improv' ? '시작하기' : '한 판 하기' }}</UiButton>
        <!-- 임기응변: 내가 보낸 도전장의 결과 (손님은 알림이 없어 다시 오면 여기서 본다, 걷기 C2) -->
        <ImprovSentChallenges v-if="key === 'improv'" :visitor-id="visitorIdNow" class="mt-6" />
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
import MatchMascot from '../../components/mascot/MatchMascot.vue'
import AppCountdown from '../../components/appgame/AppCountdown.vue'
import QuizSetPlay from '../../components/appgame/QuizSetPlay.vue'
import TimeSensePlay from '../../components/appgame/TimeSensePlay.vue'
import NunchiPlay from '../../components/appgame/NunchiPlay.vue'
import ImprovPlay from '../../components/appgame/ImprovPlay.vue'
import ImprovStoryCard from '../../components/share/ImprovStoryCard.vue'
import ImprovSentChallenges from '../../components/appgame/ImprovSentChallenges.vue'
import { improvFeedback, improvShareLine, improvSituations, improvAnswers } from '@/utils/improv'
import { componentFile, shareFiles } from '@/utils/storyShare'
import { withShareRef } from '@/utils/shareRef'
import { copyText } from '@/utils/clipboard'
import { UiButton, UiCard, UiEmptyState, UiRollNumber, UiSection, UiTopBar } from '../../components/ui'
import { GUEST_GAMES } from '@/utils/guestGames'
import { getVisitorId, markGuestPlayed, trackEvent } from '@/utils/visit'
import { track } from '@/utils/trackLog'
import { rememberReturnTo } from '@/utils/authRedirect'
import { shareLink } from '@/utils/share'
import { useToast } from '../../composables/useToast'
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
// 도전장 열쇠 (?k=): 손님 판 번호는 차례로 늘어, 열쇠가 맞아야 친구 등급·친구 답을 보여 준다 (열쇠 없는 옛 링크도 같은 상황으로는 붙는다)
const challengeK = typeof route.query.k === 'string' ? route.query.k : undefined

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

// 광고 질문의 글자 (없거나 못 불러오면 원래 소개 한 줄)
const adQuestion = ref<{ q: string; a: string; b: string } | null>(null)
if (key.value === 'nunchi' && firstQuestion) {
  GET('/api/nunchi/questions', { query: { ids: firstQuestion } }).then(({ data }) => { adQuestion.value = data[0] ?? null }).catch(() => {})
}
// 임기응변: 광고·글이 보여 준 상황 (?q=)
const adSituation = ref<{ who: string; line: string } | null>(null)
if (key.value === 'improv' && firstQuestion) {
  GET('/api/improv/situations/{id}', { path: { id: firstQuestion } }).then(({ data }) => { adSituation.value = data ?? null }).catch(() => {})
}
const visitorIdNow = getVisitorId() ?? ''
const aiCount = computed(() => review.value?.items.filter((it) => it.byFirst).length ?? 0)

const topPercent = computed(() => {
  const r = result.value
  if (!r?.rank || !r.rankOf || r.rankOf < 2) return null
  return Math.max(1, Math.round((r.rank / r.rankOf) * 100))
})

onMounted(() => {
  // 도전장으로 온 친구도 같은 도전장 링크로 돌아오면 자기 결과를 본다 (걷기 2: 카톡 갔다 오면 결과가 없고 같은 상황을 또 풀 수 있었다)
  if (key.value === 'improv') restoreLast()
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
    const body = { visitorId, key: key.value, first: from === 'start' ? firstQuestion : undefined, from: from === 'start' ? fromPlay : undefined, k: from === 'start' ? challengeK : undefined }
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
  lastProblem.value = play.value.problem
  lastAnswer.value = answer
  submitting.value = true
  submitError.value = ''
  try {
    // 임기응변은 반응을 못 받은 답을 여기서 다시 채점해 15초를 넘을 수 있다: 60초까지 기다리고, 막히면 이 화면이 '다시 채점하기'로 알린다
    const slow = key.value === 'improv' ? { timeout: 60_000, quiet: true } : {}
    result.value = (await POST('/api/guest/plays/{playId}/submit', { path: { playId: play.value.playId }, body: { visitorId, answer, k: challengeK }, ...slow })).data
    markGuestPlayed()
    feel(result.value.score > 0 ? 'success' : 'lose')
    track('guest_play_result', { gameKey: key.value, step: rounds.value, value: `score=${result.value.score};rank=${result.value.rank ?? ''}/${result.value.rankOf ?? ''}` })
    play.value = null
    if (key.value === 'nunchi') loadReview()
    if (key.value === 'improv') {
      prepareStory()
      saveLast()
    }
  } catch (e) {
    submitError.value = key.value === 'improv' ? '채점이 잠깐 막혔어요. 쓴 답은 그대로 있어요' : errorMessage(e, '답을 내지 못했어요. 다시 해 주세요')
    track('guest_play_submit_failed', { gameKey: key.value, value: submitError.value })
    // 임기응변은 판을 닫지 않는다: 쓴 답 셋을 그대로 두고 '다시 채점하기'로 같은 답을 다시 낸다 (서버는 채점이 끝나야 판을 닫는다)
    if (key.value === 'improv') return
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

// ── 임기응변 등급: 결과 남겨 두기 ──
// 결과를 보고 인스타 스토리에 올리러 갔다가 같은 링크로 돌아오면 결과가 사라져 처음 화면이었다 (걷기 P1).
// 이 기기에 2시간 남겨 두고, 친구 도전장(?c=)으로 온 게 아니면 돌아왔을 때 그 결과를 다시 보여 준다
const LAST_KEY = 'improv_last_result'
const LAST_MS = 2 * 3600_000
function saveLast() {
  try {
    localStorage.setItem(LAST_KEY, JSON.stringify({ at: Date.now(), playId: playId.value, from: fromPlay ?? null, result: result.value, problem: lastProblem.value, answer: lastAnswer.value }))
  } catch {
    // 못 남기면 돌아왔을 때 처음 화면일 뿐이다
  }
}
function restoreLast(): boolean {
  try {
    const v = JSON.parse(localStorage.getItem(LAST_KEY) || 'null')
    if (!v?.result || Date.now() - v.at > LAST_MS) return false
    // 다른 도전장 링크로 왔으면 그 도전장을 풀게 한다 (같은 도전장이거나 도전장 없이 왔을 때만 되살린다)
    if (fromPlay && v.from !== fromPlay) return false
    playId.value = v.playId
    result.value = v.result
    lastProblem.value = v.problem
    lastAnswer.value = v.answer
    prepareStory()
    track('improv_result_restored', { gameKey: 'improv' })
    return true
  } catch {
    return false
  }
}

// ── 임기응변 등급: 결과 읽기, 스토리 그림 ──
const lastProblem = ref('')
const lastAnswer = ref('')
const improv = computed(() => (key.value === 'improv' && result.value ? improvFeedback(result.value.feedback) : null))
const improvShown = computed(() => improvSituations(lastProblem.value))
const improvSaid = computed(() => improvAnswers(lastAnswer.value))
// 소개 한 줄은 들어온 곳마다 (상황·규칙은 같고 말만 다르다). 펨코(20~30대)에게 '대학생이 될 준비'는 남의 얘기였다 (걷기 P3)
const intro = computed(() =>
  route.query.utm_source === 'fmkorea'
    ? { title: 'AI가 매기는 임기응변 등급', body: '교수님·선배·처음 보는 동기한테 45초 안에 한마디. 수능처럼 1~9등급이에요. 서울대 의대생은 4등급' }
    : route.query.utm_source === 'everytime'
      ? { title: '새내기 때로 돌아가면 몇 등급?', body: '교수님·선배·처음 보는 동기, 상황마다 45초. 서울대 의대생은 4등급' }
      : { title: '서울대 의대생도 4등급 맞은 시험', body: '우리 중 누가 가장 대학생이 될 준비가 됐을까? 교수님·선배·처음 보는 동기, 상황마다 45초' },
)
const friendSaid = computed(() => improvAnswers(result.value?.challengerAnswer))
// 도전장 링크의 첫 화면: 보낸 친구의 등급
const challengeGrade = ref('')
if (key.value === 'improv' && fromPlay) {
  GET('/api/guest/plays/{playId}/challenge', { path: { playId: fromPlay }, query: { k: challengeK } })
    .then(({ data }) => { challengeGrade.value = data?.line?.match(/\d등급/)?.[0] ?? '' })
    .catch(() => {})
}
// 도전장을 보낸 친구의 등급 줄에서 "N등급"만
const challengerGrade = computed(() => result.value?.challengerLine?.match(/\d등급/)?.[0] ?? `${result.value?.challengerScore ?? 0}점`)
// 스토리 그림은 결과가 나오자마자 미리 찍어 둔다 (누른 순간 바로 넘겨야 사파리가 공유를 막지 않는다)
const storyFile = ref<File | null>(null)
const storyReady = computed(() => !!storyFile.value)
async function prepareStory() {
  storyFile.value = null
  const r = improv.value
  if (!r || r.empty || !result.value) return
  // 가장 잘한 대답: 반응이 있는 대답 중 가장 긴 것 (점수는 상황마다 보이지 않으니 읽을거리가 많은 쪽)
  const i = improvSaid.value.reduce((best, a, k) => ((a?.length ?? 0) > (improvSaid.value[best]?.length ?? 0) ? k : best), 0)
  const s = improvShown.value[i]
  const best = s && improvSaid.value[i] ? { who: s.who, line: s.line, answer: improvSaid.value[i], reaction: r.reactions[i] } : null
  try {
    storyFile.value = await componentFile(ImprovStoryCard, { grade: r.grade, rank: r.rank, score: result.value.score, best }, 'dark', `match-improv-${playId.value}.png`)
  } catch {
    storyFile.value = null
  }
}
// 그림을 넘기면서, 그림을 누른 사람이 같은 상황을 풀 링크(공유 번호 포함)를 클립보드에 (인스타 링크 스티커에 붙인다)
function shareStory() {
  const file = storyFile.value
  if (!file || !playId.value) return
  track('result_share', { gameKey: key.value, step: rounds.value, value: 'story' })
  const link = withShareRef(`${window.location.origin}/try/improv?c=${playId.value}&k=${result.value?.challengeKey ?? ''}&utm_source=instagram&utm_medium=story`)
  void copyText(link)
  void shareFiles([file]).then((r) => {
    track('result_share_shared', { gameKey: key.value, value: `story:${r}` })
    if (r === 'shared') showToast('링크를 복사했어요. 인스타에서 링크 스티커에 붙여 넣으세요')
    else if (r === 'saved') showToast('그림을 저장했어요. 링크도 복사했어요')
  })
}

// ── 눈치 한 판: 친구 도전·공유 ──
async function challengeFriend() {
  if (!playId.value) return
  track('result_challenge', { gameKey: key.value, step: rounds.value, value: `play=${playId.value}` })
  trackEvent('challenge', key.value === 'improv' ? 'improv' : 'nunchi')
  sharing.value = 'challenge'
  try {
    const c = result.value?.challengerScore
    const text = improv.value && c != null
      ? (result.value!.score > c
          ? `네 도전장 받았는데 내가 이김 ㅋㅋ 나 ${improv.value.grade}등급. 다시 붙을래?`
          : result.value!.score < c
            ? `네 도전장… 졌다. 나 ${improv.value.grade}등급. 이번엔 내 상황으로 붙자`
            : `네 도전장 비김 ㅋ 둘 다 ${improv.value.grade}등급. 한 판 더?`)
      : improv.value
      ? `${improvShareLine(improv.value.grade)} 같은 상황으로 붙어 보자`
      : `눈치 한 판 ${result.value?.score ?? 0}점. 같은 문제로 붙어 볼래요? 문제당 3초예요`
    const ck = key.value === 'improv' && result.value?.challengeKey ? `&k=${result.value.challengeKey}` : ''
    const msg = await shareLink(`${window.location.origin}/try/${key.value}?c=${playId.value}${ck}`, text)
    track('result_challenge_shared', { gameKey: key.value, value: msg || 'share' })
    // 보낸 사람에게 결과를 볼 곳을 알린다 (손님은 알림이 없어 이 링크(/try/improv)로 다시 와야 본다)
    if (key.value === 'improv' && result.value?.challengerScore == null) showToast(msg ? `${msg}. 친구가 하면 이 화면에서 승패가 보여요` : '친구가 하면 이 화면에서 승패가 보여요')
    else if (msg) showToast(msg)
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
