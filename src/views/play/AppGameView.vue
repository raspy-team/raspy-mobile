<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar :title="game?.title || '게임'" back>
      <!-- 결과 공유는 위 막대 아이콘 (애플식). 하루 퍼즐은 칸 그림, 나머지는 소식 카드 링크 -->
      <template #right>
        <UiIconButton v-if="result && DAILY_SHARE.includes(key) && result.myFeedback" icon="share" label="오늘 결과 공유" @click="shareDaily(result.myFeedback)" />
        <UiIconButton v-else-if="result && result.status === 'COMPLETED' && game?.dailyLimit !== 1" icon="share" label="결과 공유" :disabled="sharingResult" @click="openShare(result.gameId)" />
      </template>
    </UiTopBar>

    <main class="max-w-xl mx-auto px-4 pt-4 pb-16">
      <!-- 시작 전 3·2·1: 끝날 때까지 문제를 가린다 -->
      <AppCountdown v-if="play && counting" :until="new Date(play.startedAt).getTime()" :offset="offset" :opponent="play.opponent ? who(play.opponent) : undefined" @done="counting = false" />

      <!-- 플레이 중: 게임마다 다른 판 -->
      <template v-else-if="play">
        <!-- 기다리던 사람과 짝이 지어졌으면 누구와 겨루는지 (AI 주민이면 이름 뒤에 AI, 9e) -->
        <p v-if="play.opponent" class="t-caption flex items-center min-w-0 mb-3"><span class="shrink-0">상대&nbsp;·&nbsp;</span><OpponentName :player="play.opponent" /><span class="shrink-0">&nbsp;· 먼저 풀었어요</span></p>
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
        <ImprovPlay
          v-else-if="key === 'improv'"
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
        <LiteracyPlay
          v-else-if="key === 'daily-literacy'"
          :problem="play.problem"
          :time-limit-seconds="secondsLeft(play)"
          :submitting="submitting"
          @submit="submit"
        />
        <NunchiPlay
          v-else-if="key === 'nunchi'"
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
        <NumberSpotsPlay
          v-else-if="key === 'number-spots'"
          :problem="play.problem"
          :time-limit-seconds="secondsLeft(play)"
          :submitting="submitting"
          @submit="submit"
        />
        <DailyNumberPlay
          v-else-if="key === 'daily-number'"
          :problem="play.problem"
          :time-limit-seconds="secondsLeft(play)"
          :submitting="submitting"
          @submit="submit"
        />
        <RhythmCopyPlay
          v-else-if="key === 'rhythm-copy'"
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
          :vote="isVote"
          @submit="submit"
        />
        <p v-if="submitError" class="t-caption text-danger mt-3">{{ submitError }}</p>
      </template>

      <!-- 방금 끝낸 판 -->
      <template v-else-if="result">
        <UiCard class="text-center py-8">
          <template v-if="result.status === 'COMPLETED'">
            <!-- 진 순간에도 얼굴이 곁에 있다. 표정만 담담하게 -->
            <MatchMascot who="match" :mood="result.result === 'WIN' ? 'cheer' : result.result === 'DRAW' ? 'smile' : 'sad'" :size="72" class="mx-auto mb-3" />
            <p class="t-display">{{ VERDICT[result.result || 'DRAW'] }}</p>
            <p class="t-caption mt-2">
              <router-link v-if="result.opponent" :to="`/profile/${result.opponent.userId}`" class="underline underline-offset-2">{{ who(result.opponent) }}</router-link>님과 경기
            </p>
            <p v-if="NEXT_ROUND[result.result || '']" class="t-body mt-3">{{ NEXT_ROUND[result.result || ''] }}</p>
            <!-- 임기응변: '다음 판에서 갚아요'의 그 사람과 다시 붙는 길 (신뢰 사다리 ?to=: 한 판 하면 그 사람에게 같은 상황으로 도전장이 간다, 3-5 걷기 P6) -->
            <UiButton
              v-if="key === 'improv' && result.opponent && !result.opponent.isBot"
              variant="secondary"
              class="mt-4"
              :to="{ path: '/play/improv', query: { to: result.opponent.userId, toName: result.opponent.nickname } }"
            >{{ result.opponent.nickname }}님과 다시 붙기</UiButton>
            <!-- 임기응변: 승패도 등급으로 겨룬다. 큰 숫자가 점수라 기다릴 때(등급이 크게)와 잣대가 달랐다 (경로 10 리뷰 I5) -->
            <div v-if="improvResult && !improvResult.empty" class="flex items-center justify-center gap-6 mt-6">
              <span>
                <span class="block t-title tabular-nums">{{ improvResult.grade }}등급</span>
                <span class="block t-micro">나 · {{ result.myScore ?? 0 }}점</span>
              </span>
              <span class="t-caption">:</span>
              <span>
                <span class="block t-title tabular-nums text-fg-muted">{{ opponentImprov ? `${opponentImprov.grade}등급` : `${result.opponentScore ?? 0}점` }}</span>
                <span class="flex items-center justify-center t-micro max-w-[8rem]"><OpponentName :player="result.opponent" /><span v-if="opponentImprov" class="shrink-0">&nbsp;· {{ result.opponentScore ?? 0 }}점</span></span>
              </span>
            </div>
            <div v-else class="flex items-center justify-center gap-6 mt-6">
              <span>
                <UiRollNumber class="t-title tabular-nums" :value="result.myScore ?? 0" />
                <span class="block t-micro">나{{ isVote ? ' (표)' : '' }}</span>
              </span>
              <span class="t-caption">:</span>
              <span>
                <span class="block t-title tabular-nums text-fg-muted">{{ result.opponentScore ?? 0 }}</span>
                <span class="flex items-center justify-center t-micro max-w-[8rem]"><OpponentName :player="result.opponent" /><span v-if="isVote" class="shrink-0">&nbsp;(표)</span></span>
              </span>
            </div>
            <p v-if="improvGrade && !(improvResult && !improvResult.empty)" class="t-heading mt-4">{{ improvGrade }}</p>
            <p v-else-if="improvResult && !improvResult.empty" class="t-caption mt-3">100명 중 {{ improvResult.rank }}등</p>
            <!-- 끝난 판에도 왜 그 등급인지 (3-5 UI) -->
            <p v-if="improvResult?.weak" class="t-body mt-2 break-keep"><template v-if="improvResult.strong">잘한 것 <b>{{ improvResult.strong }}</b> · </template>아쉬운 것 <b>{{ improvResult.weak }}</b></p>
            <p v-if="result.ratingChange != null" class="t-mono mt-4">
              실력 점수 {{ result.ratingAfter }} ({{ result.ratingChange >= 0 ? '+' : '' }}{{ result.ratingChange }})
            </p>
            <!-- '처음 몇 판은 크게 움직여요' 숫자 설명은 뺐다 (목적 판정 11/11 부분 2 다시 훑기) -->
          </template>
          <template v-else-if="result.myJudging">
            <UiSpinner class="mx-auto" />
            <p class="t-heading mt-4">{{ isVote ? '문장을 확인하고 있어요' : `${judgeName}${josaIga(judgeName)} 채점하고 있어요` }}</p>
            <p class="t-caption mt-1">몇 초면 끝나요. 다른 화면으로 가도 끝나면 {{ NOTICE }}</p>
          </template>
          <!-- 스코어 맞히기: 둘 다 냈고 실제 경기가 끝나길 기다린다 -->
          <template v-else-if="result.status === 'AWAITING_RESULT'">
            <p class="t-title">경기 결과를 기다려요</p>
            <p class="t-caption mt-1">{{ kickoffLabel(fixtureOf(result.problem).kickoff) }} 경기가 끝나면 채점하고 {{ NOTICE }}</p>
            <p class="t-body mt-5">내 예상 <b class="tabular-nums">{{ predictionLine(result.problem, result.myAnswer) }}</b></p>
            <p v-if="result.opponentAnswer" class="t-caption mt-1">{{ who(result.opponent) }}님 예상 {{ predictionLine(result.problem, result.opponentAnswer) }}</p>
          </template>
          <template v-else-if="result.status === 'VOTING'">
            <p class="t-title">투표 중이에요</p>
            <p class="t-caption mt-1">{{ until(result.votingEndsAt) }}까지 사람들이 투표해요. 끝나면 {{ NOTICE }}</p>
            <UiButton size="sm" variant="secondary" icon="share" class="mt-4" @click="shareVote(result.gameId)">투표 링크 공유</UiButton>
          </template>
          <template v-else-if="result.status === 'CANCELED'">
            <p class="t-title">취소된 경기예요</p>
            <!-- 왜 취소됐는지 (경로 전부 훑기 2절): AI 채점이 막혔거나, 먼저 연 사람이 시간 안에 내지 않았다 -->
            <p class="t-caption mt-1 break-keep">{{ result.myFeedback?.includes('채점') ? 'AI 채점이 막혀 이 판은 기록에 남지 않아요' : '시간 안에 답이 나지 않아 이 판은 기록에 남지 않아요' }}</p>
          </template>
          <template v-else-if="key === 'predict' && result.status === 'WAITING'">
            <p class="t-heading">내 예상 {{ predictionLine(result.problem, result.myAnswer) }}</p>
            <p class="t-caption mt-1">같은 경기를 맞힐 상대를 찾고 있어요. 경기가 끝나면 채점해요</p>
            <UiButton size="sm" variant="secondary" icon="share" class="mt-4" :loading="challenging" @click="sendChallenge(result.gameId)">친구에게 도전장 보내기</UiButton>
          </template>
          <template v-else-if="isVote">
            <p class="t-heading">{{ (result.myScore ?? 0) > 0 ? '문장이 올라갔어요' : '투표에 올리지 못했어요' }}</p>
            <!-- 못 올린 이유를 말한다 (경로 전부 훑기 2절): 서버 한마디 첫 줄, 없으면 흔한 이유 -->
            <p class="t-caption mt-1 break-keep">{{ (result.myScore ?? 0) > 0 ? '같은 제시어로 다른 사람이 쓰면 24시간 투표가 시작돼요' : (result.myFeedback?.split('\n')[0] || '글이 너무 짧거나 쓸 수 없는 말이 들어 있었어요') }}</p>
            <UiButton v-if="(result.myScore ?? 0) > 0 && result.status === 'WAITING'" size="sm" variant="secondary" icon="share" class="mt-4" :loading="challenging" @click="sendChallenge(result.gameId)">친구에게 도전장 보내기</UiButton>
          </template>
          <template v-else>
            <!-- 임기응변: 손님 결과와 같은 모양. 등급이 크게, 점수는 작게 (3-5 걷기 P6: "가입하니 점수가 커졌네") -->
            <!-- 등급이 안 나온 판(셋 다 빈 답)도 임기응변 틀 그대로 (손님 결과와 같다) -->
            <template v-if="improvResult?.empty">
              <p class="t-micro">임기응변 등급</p>
              <p class="t-title mt-2 break-keep">{{ improvResult.empty }}</p>
              <p class="t-caption mt-2 break-keep">상황마다 한마디만 써도 등급이 나와요</p>
            </template>
            <template v-else-if="improvResult">
              <p class="t-display tabular-nums">{{ improvResult.grade }}<span class="t-title ml-1">등급</span></p>
              <!-- 손님 결과처럼 점수는 빼고 등수만 (경로 2 리뷰 N5) -->
              <p class="t-caption mt-1">100명 중 {{ improvResult.rank }}등</p>
              <!-- 보내기는 등급 바로 밑 (손님 결과와 같은 순서, 11/11 목적 다시 보기: 등급을 막 본 순간이 자랑 동기가 가장 세다) -->
              <div class="flex flex-wrap justify-center gap-2 mt-4">
                <UiButton size="sm" icon="instagram" :disabled="!storyFile" @click="shareStory">인스타 스토리</UiButton>
                <UiButton v-if="!ladderTo && (result.myScore ?? 0) > 0" size="sm" variant="secondary" icon="share" :loading="challenging" @click="sendChallenge(result.gameId)">친구에게 도전장 보내기</UiButton>
              </div>
              <p v-if="improvResult.weak" class="t-body mt-4 break-keep"><template v-if="improvResult.strong">잘한 것 <b>{{ improvResult.strong }}</b> · </template>아쉬운 것 <b>{{ improvResult.weak }}</b></p>
              <p v-if="improvResult.tip" class="t-caption mt-1 break-keep">다음엔 {{ improvResult.tip }}</p>
              <p v-if="improvResult.next" class="t-label mt-3"><span class="hl">{{ improvResult.next }}</span></p>
            </template>
            <template v-else>
              <UiRollNumber class="t-display tabular-nums" :value="result.myScore ?? 0" />
              <p class="t-caption">{{ game?.scoreUnit }}</p>
            </template>
            <!-- 신뢰 사다리·소식 도전: 아무나가 아니라 그 사람을 기다린다 (11/4 밤샘) -->
            <template v-if="ladderTo">
              <p class="t-heading mt-6">{{ ladderName }}님을 기다려요</p>
              <p class="t-caption mt-1">도전장을 메시지로 보냈어요. {{ ladderName }}님이 같은 {{ key === 'improv' ? '상황' : '문제' }}을 풀면 승패가 나요</p>
            </template>
            <template v-else>
              <p class="t-heading mt-6">상대를 찾고 있어요</p>
              <p class="t-caption mt-1">같은 {{ key === 'improv' ? '상황' : '문제' }}을 다른 사람이 풀면 승패가 나요.{{ game?.botAfterSeconds && (result.myScore ?? 0) > 0 ? ` ${waitText(game.botAfterSeconds)} 안에 아무도 안 풀면 AI 주민(앱이 만든 연습 상대)이 풀어요.` : '' }} 결과가 나오면 {{ NOTICE }}</p>
            </template>
            <!-- 임기응변은 등급 밑에 이미 있다. 다른 게임은 여기 -->
            <div v-if="!improvResult || improvResult.empty" class="flex flex-wrap justify-center gap-2 mt-4">
              <UiButton v-if="!ladderTo && (result.myScore ?? 0) > 0" size="sm" variant="secondary" icon="share" :loading="challenging" @click="sendChallenge(result.gameId)">친구에게 도전장 보내기</UiButton>
            </div>
          </template>
        </UiCard>
        <!-- 다음 행동은 결과 바로 밑에. 긴 답·한마디는 그 아래 -->
        <!-- 하루 한 판 게임(오늘의 초성)은 '한 판 더'를 눌러도 할 수 없어 빼고, 공유가 다음 행동이 된다 -->
        <UiButton v-if="game?.dailyLimit !== 1" block size="lg" class="mt-4" :loading="starting" :disabled="!game?.available" @click="start">{{ improvResult?.empty ? '다시 하기' : '한 판 더' }}</UiButton>
        <UiButton block variant="ghost" class="mt-2" @click="closeResult">돌아가기</UiButton>
        <!-- 끝난 판은 소식 카드와 같은 그림·링크로 보낸다 (11/4 밤샘: 이기고 스토리에 올릴 길이 소식 탭에만 있었다) -->
        <!-- 임기응변은 한마디(등급·인물 반응)를 위 카드와 상황 카드에 나눠 보여 주므로 따로 두지 않는다 (등급이 두 번 보였다) -->
        <UiCard v-if="result.myFeedback && result.status !== 'AWAITING_RESULT' && !improvResult" class="mt-3">
          <p class="t-micro">{{ game?.judge === 'AI' ? `${judgeName} 한마디` : key === 'daily-literacy' ? '오늘의 답' : '한마디' }}</p>
          <p class="t-body mt-1 whitespace-pre-line">{{ result.myFeedback }}</p>
        </UiCard>
        <!-- 하루 퍼즐은 결과를 칸으로 공유한다 (답은 가리고) -->
        <template v-if="isVote && (result.myAnswer || result.opponentAnswer)">
          <UiCard v-if="result.myAnswer" class="mt-3">
            <p class="t-micro">내 문장</p>
            <p class="t-body mt-1 whitespace-pre-line break-keep">{{ result.myAnswer }}</p>
          </UiCard>
          <UiCard v-if="result.opponentAnswer" class="mt-3">
            <p class="t-micro">상대 문장</p>
            <p class="t-body mt-1 whitespace-pre-line break-keep">{{ result.opponentAnswer }}</p>
          </UiCard>
        </template>
        <!-- 임기응변 등급: 상황마다 내 대답과 상대 대답 -->
        <template v-if="key === 'improv' && result.myAnswer">
          <UiCard v-for="(s, i) in improvSituations(result.problem)" :key="s.id" class="mt-3">
            <p class="t-micro">{{ s.who }}</p>
            <p class="t-caption mt-1 break-keep">“{{ s.line }}”</p>
            <p class="t-body mt-2 break-keep">나: {{ improvAnswers(result.myAnswer)[i] || '(대답 없음)' }}</p>
            <p v-if="improvResult?.reactions[i]" class="t-caption mt-1 break-keep">→ {{ improvResult.reactions[i] }}</p>
            <p v-if="result.opponentAnswer" class="t-caption mt-1 break-keep">{{ who(result.opponent) }}: {{ improvAnswers(result.opponentAnswer)[i] || '(대답 없음)' }}</p>
          </UiCard>
        </template>
        <!-- 말싸움: 주고받은 말 -->
        <template v-else-if="key === 'debate'">
          <UiCard v-if="result.myAnswer" class="mt-3">
            <p class="t-micro">내 말싸움</p>
            <p class="t-caption mt-1 whitespace-pre-line break-keep">{{ result.myAnswer }}</p>
          </UiCard>
          <UiCard v-if="result.opponentAnswer" class="mt-3">
            <p class="t-micro">{{ who(result.opponent) }}님의 말싸움 · {{ result.opponentScore }}{{ game?.scoreUnit }}</p>
            <p class="t-caption mt-1 whitespace-pre-line break-keep">{{ result.opponentAnswer }}</p>
            <p v-if="result.opponentFeedback" class="t-caption mt-2">{{ judgeName }}: {{ result.opponentFeedback }}</p>
          </UiCard>
        </template>
        <template v-else-if="key === 'recipe'">
          <UiCard v-if="result.myAnswer" class="mt-3">
            <p class="t-micro">내 요리</p>
            <p class="t-heading mt-1">{{ dish(result.myAnswer).name }}</p>
            <p class="t-caption mt-1 whitespace-pre-line break-keep">{{ dish(result.myAnswer).steps }}</p>
          </UiCard>
          <UiCard v-if="result.opponentAnswer" class="mt-3">
            <p class="t-micro">{{ who(result.opponent) }}님의 요리 · {{ result.opponentScore }}{{ game?.scoreUnit }}</p>
            <p class="t-heading mt-1">{{ dish(result.opponentAnswer).name }}</p>
            <p class="t-caption mt-1 whitespace-pre-line break-keep">{{ dish(result.opponentAnswer).steps }}</p>
            <p v-if="result.opponentFeedback" class="t-caption mt-2">AI 셰프: {{ result.opponentFeedback }}</p>
          </UiCard>
        </template>
      </template>

      <!-- 게임 첫 화면 -->
      <template v-else>
        <UiEmptyState v-if="missing" class="pt-16" icon="fas fa-circle-xmark" title="없는 게임이에요" description="주소가 바뀌었거나 사라진 게임이에요">
          <UiButton class="mt-4" to="/games">게임 목록 보기</UiButton>
        </UiEmptyState>
        <UiEmptyState v-else-if="loadFailed" class="pt-16" icon="fas fa-triangle-exclamation" title="게임을 불러오지 못했어요" description="잠시 뒤 다시 해 주세요">
          <UiButton class="mt-4" @click="retry">다시 시도</UiButton>
        </UiEmptyState>
        <div v-else-if="!game" class="space-y-3">
          <UiSkeleton class="h-28 w-full" />
          <UiSkeleton class="h-14 w-full" />
        </div>
        <template v-else>
          <!-- 가입 전 한 판을 하고 막 가입한 사람: 그 판이 어디 갔는지 먼저 (3-5 걷기 P5: "내 4등급은? 60은 뭐지") -->
          <UiCard v-if="joinedFrom" class="mb-3">
            <p class="t-title">방금 판 <span class="hl">{{ joinedFrom.grade }}등급</span>이 내 기록에 남았어요</p>
            <!-- 5등급부터는 '남았다'가 박혔다로 들린다: 기록엔 가장 좋은 판만 남는다는 사실을 함께 (11/11 감정과 체면) -->
            <p class="t-caption mt-1">{{ Number(joinedFrom.grade) > 4 ? '기록엔 가장 좋은 등급만 남아요. ' : '' }}이제 같은 상황을 푼 모르는 사람과 1:1로 승패를 내요</p>
          </UiCard>
          <UiCard>
            <p class="t-caption">{{ game.summary }}</p>
            <!-- 안 해 본 게임의 1500·0승 0패는 정보가 아니다. 첫 판을 권한다 (11/3) -->
            <!-- 준비 중인 게임에는 첫 판을 권하지 않는다 (바로 밑의 '준비 중인 게임이에요'와 어긋났다) -->
            <div v-if="played" class="grid gap-2 mt-4 text-center" :class="game.recordable && game.myBest == null ? 'grid-cols-2' : 'grid-cols-3'">
              <span>
                <span class="block t-title tabular-nums">{{ game.myRating }}</span>
                <span class="block t-micro">실력 점수</span>
              </span>
              <span>
                <span class="block t-title tabular-nums">{{ game.myWins }}<span class="t-caption">승</span> {{ game.myLosses }}<span class="t-caption">패</span></span>
                <span class="block t-micro">전적</span>
              </span>
              <span v-if="game.recordable && game.myBest != null">
                <!-- 단위를 붙인다 ('44 최고 기록'은 무엇이 44인지 몰랐다, 걷기 2) -->
                <span class="block t-title tabular-nums">{{ game.myBest }}<span class="t-caption">{{ game.scoreUnit }}</span></span>
                <span class="block t-micro">최고 기록</span>
              </span>
              <span v-else-if="!game.recordable">
                <span class="block t-title tabular-nums">{{ game.myDraws }}</span>
                <span class="block t-micro">무승부</span>
              </span>
            </div>
            <!-- '전적·실력 점수는 사람과 한 판만 세요' 규칙 설명은 첫 화면에서 뺐다 (목적 판정 11/11 부분 2 다시 훑기) -->
          </UiCard>
          <!-- 하루 한 번 게임을 오늘 이미 냈으면 버튼 대신 한 줄 (누르면 '오늘은 다 했어요'만 떴다, 11/5 밤샘 C 검토) -->
          <p v-if="dailyDone" class="t-body text-center mt-5">오늘 몫을 냈어요. 새 문제는 내일 0시에 나와요</p>
          <UiButton v-else block size="lg" class="mt-4" :loading="starting" :disabled="!game.available" @click="start">한 판 하기</UiButton>
          <p v-if="!game.available" class="t-caption text-center mt-2">준비 중인 게임이에요</p>
          <p v-else class="t-caption text-center mt-2">
            <!-- 하루 한 판 퍼즐은 상대를 기다리는 게 아니라 같은 문제를 푼 사람들과 견준다 -->
            <!-- 도전장이 없는 게임(공유 판·실시간 대전)으로 '○○님에게 도전'이 왔으면 처음부터 그렇다고 말하고 그냥 한 판 (목적 판정 11/11 부분 2: 누를 수 있는 버튼이 늘 거절했다) -->
            <template v-if="noLadder">이 게임은 도전장이 없어요 · 그냥 한 판 해요</template>
            <template v-else-if="ladderTo && game.playMode === 'REALTIME'">{{ ladderName }}님에게 도전장을 보내요</template>
            <template v-else-if="ladderTo && fromFeed">한 판 하면 {{ ladderName }}님에게 같은 {{ key === 'improv' ? '상황' : '문제' }}으로 도전장이 가요</template>
            <template v-else-if="ladderTo">한 판 하면 {{ ladderName }}님에게 같은 {{ key === 'improv' ? '상황' : '문제' }}으로 도전장이 가요</template>
            <template v-else-if="game.dailyLimit === 1">하루 한 번</template>
            <!-- '하루 20판'은 다 할 사람이 없는 수라 정보가 아니다. 한도에 닿으면 서버가 말한다 (목적 판정 11/11 부분 2) -->
          </p>
          <p v-if="startError" class="t-caption text-danger text-center mt-2">{{ startError }}</p>
          <!-- 내기가 실패해도 쓴 답을 잃지 않는다: 같은 판에 같은 답을 다시 낸다 (경로 2 리뷰 N10, 가로 훑기 4절). 예전엔 '다시 열어 이어서 낼 수 있어요'라 했지만 다시 열면 빈 칸이었다 -->
          <UiButton v-if="pendingSubmit" block variant="secondary" class="mt-2" :loading="submitting" @click="resubmit">쓴 답 다시 내기</UiButton>

          <!-- 아직 안 끝난 내 대결은 시작 버튼 바로 밑에 -->
          <UiSection v-if="unfinished.length" title="진행 중" class="mt-8">
            <UiList>
              <UiListItem v-for="d in unfinished" :key="d.gameId" :title="duelTitle(d)" :subtitle="duelSubtitle(d)" @click="openUnfinished(d)">
                <template #trailing><UiBadge>{{ duelBadge(d) }}</UiBadge></template>
              </UiListItem>
            </UiList>
          </UiSection>

          <!-- 챔피언: 내가 속한 자리(소속·동네·전국). 하루 퍼즐은 맞붙는 판이 없어 벨트가 없다 -->
          <!-- 준비 중(AI 키 없음 등)인 게임은 이길 수 없으니 챔피언 자리를 보이지 않는다 (11/5 9e) -->
          <!-- 처음 하러 온 사람에게는 챔피언 자리를 미룬다: '한 판 하기' 바로 밑에서 눈을 뺏었다 (목적 판정 11/11 부분 2 다시 훑기, 고병연 확인) -->
          <ChampionSeatsCard v-if="game.dailyLimit !== 1 && game.available && played" :rule-id="game.ruleId" :app-game-key="game.key" class="mt-8" />

          <!-- 나머지는 탭 하나로: 순위 · 내 대결 · 투표 -->
          <!-- 빈 탭은 그리지 않는다. 탭이 하나뿐이면 탭 없이 목록만 (목적 판정 11/11 부분 2 다시 훑기) -->
          <UiTabs v-if="tabs.length > 1" v-model="tab" :options="tabs" class="mt-8" />
          <div v-else class="mt-8"></div>

          <section v-if="tab === 'rank'" class="mt-4">
            <UiTabs v-if="game.recordable" v-model="boardKind" :options="BOARDS" class="mb-3" />
            <template v-if="boardKind === 'RATING'">
              <UiEmptyState v-if="!ranking.length" mascot="dol" title="아직 순위가 비어 있어요" :description="game.dailyLimit === 1 ? '5일 풀면 첫 이름이 올라가요. 먼저 올라가 보세요' : '사람과 5판을 하면 첫 이름이 올라가요. 먼저 올라가 보세요'" />
              <!-- AI 기준선이 사이에 낀다 (docs/ai-residents.md 2). 사람이 20명을 넘으면 빼고 순위 전체 보기에서 편다 -->
              <UiList v-if="rankingRows.length" :class="{ 'mt-3': !ranking.length }">
                <template v-for="(x, i) in rankingRows" :key="x.kind === 'user' ? x.row.userId : `ai-${i}`">
                  <BaselineRow v-if="x.kind === 'ai'" :line="x.line" />
                  <UiListItem
                    v-else
                    :title="x.row.isCurrentUser ? `${x.row.userName} (나)` : x.row.userName"
                    :subtitle="`${x.row.playCount}판`"
                    chevron
                    @click="router.push('/profile/' + x.row.userId)"
                  >
                    <template #leading>
                      <span class="w-6 t-mono text-center">{{ x.row.rank }}</span>
                      <UiAvatar :src="x.row.userAvatar" :name="x.row.userName" :user-id="x.row.userId" size="sm" />
                    </template>
                    <template #trailing><span class="t-mono">{{ x.row.rating }}</span></template>
                  </UiListItem>
                </template>
              </UiList>
              <UiButton v-if="ranking.length" block variant="ghost" class="mt-2" :to="`/rules/${game.ruleId}/ranking`">모두 보기</UiButton>
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
              <UiEmptyState v-else mascot="dol" title="아직 기록이 없어요" description="첫 기록의 주인공이 되어 보세요" />
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
            <UiEmptyState v-else mascot="dol" title="아직 끝난 경기가 없어요" description="첫 판을 해 보세요" />
          </section>

          <section v-else class="mt-4">
            <div v-if="votes.length" class="space-y-3">
              <VoteCard v-for="(c, i) in votes" :key="c.gameId" :card="c" @voted="votes[i] = $event" />
            </div>
            <UiEmptyState v-else mascot="dol" title="지금 투표할 경기가 없어요" description="다른 사람들의 문장이 모이면 여기에 올라와요" />
          </section>
        </template>
      </template>
    </main>
    <ShareSheet v-if="sharePost" :post="sharePost" :my-id="myId" @close="sharePost = null" />
  </div>
  <SaveImageSheet :src="saveView" @close="saveView = null" />
</template>

<script setup lang="ts">
import SaveImageSheet from '../../components/share/SaveImageSheet.vue'
import { GUEST_GAMES } from '@/utils/guestGames'
import { waitText, who } from '@/utils/format'
import OpponentName from '../../components/appgame/OpponentName.vue'
// 앱 게임 한 개 (/play/:key): 대결 시작 → 3·2·1 → 플레이 → 결과. 아래에 내 대결과 기록 순위
// 대결 결과 알림을 누르면 ?duel={id}로 들어와 그 결과를 바로 보여준다
import { liveRoute } from '@/utils/battle'
import { canResumeDuel } from '@/utils/appGame'
import { ref, computed, watch, onMounted, onBeforeUnmount, defineAsyncComponent } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { GET, POST } from '@/api/client'
import api from '../../api/api'
import type { components } from '@/api/schema'
import { refreshOnChange } from '@/websocket/userChannel'
import MatchMascot from '../../components/mascot/MatchMascot.vue'
import ChampionSeatsCard from '../../components/champion/ChampionSeatsCard.vue'
import BaselineRow from '../../components/champion/BaselineRow.vue'
import { FOLD_AT, withBaselines } from '../../components/champion/rankingBaselines'
import { NEXT_ROUND } from '@/utils/verdict'
import { feel } from '@/utils/feel'
import TypingPlay from '../../components/appgame/TypingPlay.vue'
import RecipePlay from '../../components/appgame/RecipePlay.vue'
import SentencePlay from '../../components/appgame/SentencePlay.vue'
import DialogPlay from '../../components/appgame/DialogPlay.vue'
import ImprovPlay from '../../components/appgame/ImprovPlay.vue'
import { improvAnswers, improvFeedback, improvSituations, improvShareLine } from '@/utils/improv'
import { track } from '@/utils/trackLog'
import { shareLink } from '@/utils/share'
import { askPushPermission, isCapacitorApp } from '@/utils/nativeBridge'
import { guestClaimResult } from '@/utils/visit'
// 스토리 그림 찍기(snapdom, 압축 100KB 넘음)는 임기응변 결과가 나올 때 받는다. 모든 게임 화면에 실려 첫 화면을 늦췄다 (11/11 몸과 시간)
let story: typeof import('@/utils/storyShare') | null = null
let storyCard: typeof import('../../components/share/ImprovStoryCard.vue').default | null = null
async function loadStory() {
  if (!story) [story, storyCard] = await Promise.all([import('@/utils/storyShare'), import('../../components/share/ImprovStoryCard.vue').then((m) => m.default)])
  return story
}
import { withShareRef } from '@/utils/shareRef'
import { copyText } from '@/utils/clipboard'
// 공유 시트(스토리 그림 찍기 포함, 압축 100KB 넘음)는 처음 열 때 받는다. 화면을 열 때마다 받아 첫 화면을 늦췄다 (11/11 몸과 시간)
const ShareSheet = defineAsyncComponent(() => import('../../components/feed/story/ShareSheet.vue'))
import { getMyId } from '@/utils/me'
import WritePlay from '../../components/appgame/WritePlay.vue'
import QuizSetPlay from '../../components/appgame/QuizSetPlay.vue'
import LiteracyPlay from '../../components/appgame/LiteracyPlay.vue'
import TimeSensePlay from '../../components/appgame/TimeSensePlay.vue'
import NunchiPlay from '../../components/appgame/NunchiPlay.vue'
import NumberSpotsPlay from '../../components/appgame/NumberSpotsPlay.vue'
import DailyNumberPlay from '../../components/appgame/DailyNumberPlay.vue'
import RhythmCopyPlay from '../../components/appgame/RhythmCopyPlay.vue'

// 글로 겨루는 게임: 같은 화면(WritePlay)에 안내만 다르게
const WRITING: Record<string, { guide: string; placeholder: string }> = {
  excuse: { guide: '이 상황에서 빠져나갈 한 줄 변명', placeholder: '그럴듯하고 웃긴 변명' },
  balance: { guide: '둘 중 하나를 골라 이유로 설득해 주세요', placeholder: '예) 여름: 수박이 있으니까요' },
  trial: { guide: '피고가 되어 AI 판사를 설득하는 변론', placeholder: '존경하는 재판장님, 사실은…' },
  'power-level': { guide: '주제에 맞는 싸움꾼을 한 줄로 (뻔한 최강은 약해요)', placeholder: '예) 고무장갑 낀 할머니와 효자손' },
  acrostic: { guide: '글자마다 한 줄씩, 그 글자로 시작해요. 줄을 바꿔 나눠요', placeholder: '고백하려고\n양말까지 새로 샀는데\n이미 여친이 있었다' },
}
import PredictPlay from '../../components/appgame/PredictPlay.vue'
import SquatPlay from '../../components/appgame/SquatPlay.vue'
import { fixtureOf, kickoffLabel, predictionLine } from '@/utils/predict'
import VoteCard from '../../components/appgame/VoteCard.vue'
import AppCountdown from '../../components/appgame/AppCountdown.vue'
import { useToast } from '../../composables/useToast'
import {
  UiAvatar, UiBadge, UiButton, UiCard, UiEmptyState, UiIconButton, UiList, UiListItem, UiRollNumber, UiSection, UiSkeleton, UiSpinner, UiTabs, UiTopBar,
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
// 이 게임을 몇 판 안 했으면 실력 점수가 크게 움직인다 (서버는 RD가 크면 잠정으로 본다)
const played = computed(() => !!game.value && (!!game.value.myLastPlayedAt || (game.value.myWins || 0) + (game.value.myLosses || 0) + (game.value.myDraws || 0) > 0))
const duels = ref<Duel[]>([])
const board = ref<Schemas['AppRecordBoard'] | null>(null)
const boardKind = ref<'RATING' | 'WEEK' | 'ALL'>('RATING')
const play = ref<Play | null>(null)
const counting = ref(false)
let offset = 0 // 서버 시각 - 기기 시각
const result = ref<Duel | null>(null)
// 알림 권한은 쓸모가 보일 때 묻는다: 상대를 기다리는 결과가 떴을 때 (앱을 켤 때 묻지 않는다, 목적 판정 11/11 부분 1)
// 결과를 기다리게 되는 순간 알림 권한을 묻는다. 보통 게임이 상대를 기다리는 상태는 WAITING이다 (경로 2 리뷰 W1)
watch(() => result.value?.status, (st) => { if (st === 'AWAITING_RESULT' || st === 'WAITING' || st === 'VOTING') askPushPermission() })
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
const rankingTotal = ref(0)
const baselines = ref<Schemas['RankingBaseline'][]>([])
// 위 10명만 보이니, 다 보일 때만 맨 아래 기준선까지. 20명을 넘으면 기준선을 접는다 (순위 전체 보기에서 편다)
// 순위가 비었으면 기준선(1800·1500)만 덩그러니 보였다 (UX ⑤): 사람이 있을 때만
const rankingRows = computed(() => withBaselines(ranking.value, rankingTotal.value > FOLD_AT || !ranking.value.length ? [] : baselines.value, rankingTotal.value <= ranking.value.length))
const isVote = computed(() => game.value?.judge === 'VOTE')
const unfinished = computed(() => duels.value.filter((d) => !DONE.includes(d.status)))
const finished = computed(() => duels.value.filter((d) => DONE.includes(d.status)))
// 하루 한 번 게임: 오늘 마감인 내 판을 이미 냈나 (내 판의 마감 시각으로 날짜를 본다. 남의 어제 판에 붙었어도 내 판은 오늘이다)
const dailyDone = computed(() => {
  if (game.value?.dailyLimit !== 1) return false
  const today = new Date().toDateString()
  return duels.value.some((d) => new Date(d.deadlineAt ?? d.createdAt).toDateString() === today && (d.myScore != null || DONE.includes(d.status)))
})
// 처음 탭은 순위. 투표 탭은 투표할 글이 있을 때만 '투표 N'으로 알린다 (한 판 하러 온 사람에게 남의 글 투표가 첫 탭이었다, 목적 판정 11/11 부분 2)
const tab = ref<'rank' | 'mine' | 'vote'>('rank')
const tabs = computed(() => [
  { value: 'rank', label: '순위' },
  ...(finished.value.length ? [{ value: 'mine', label: '내 경기', count: finished.value.length }] : []),
  ...(isVote.value && votes.value.length ? [{ value: 'vote', label: '투표', count: votes.value.length }] : []),
])
// 공유 판·실시간 대전은 도전장이 없다
const noLadder = computed(() => !!ladderTo && !!(game.value?.shared || game.value?.battle))
const { showToast } = useToast()
const starting = ref(false)
const submitting = ref(false)
const startError = ref('')
const submitError = ref('')

// 없는 게임 주소이거나 불러오지 못했으면 뼈대만 계속 보이지 않게 (11/5 UX)
const missing = ref(false)
const loadFailed = ref(false)
async function load() {
  const games = await GET('/api/app-games')
  const first = !game.value
  game.value = games.data.find((g) => g.key === key.value) ?? null
  missing.value = !game.value
  if (!game.value) return
  // 게임 목록만 있으면 한 판은 할 수 있다. 내 대결·순위·기록·투표는 하나가 실패해도 그 칸만 비운다 (경로 2 리뷰 N11: 순위만 못 불러와도 '게임을 불러오지 못했어요'였다)
  const mine = await GET('/api/app-games/{key}/duels', { path: { key: key.value } }).catch(() => null)
  if (mine) duels.value = mine.data
  // 결과 화면을 보고 있는 대결이 끝났으면 바로 바꿔 보여준다
  if (result.value) result.value = duels.value.find((d) => d.gameId === result.value?.gameId) ?? result.value
  if (game.value) {
    const data = (await GET('/api/rules/{ruleId}/rankings', { path: { ruleId: game.value.ruleId } }).catch(() => null))?.data
    if (data) {
      ranking.value = (data.rankings ?? []).slice(0, 10)
      rankingTotal.value = data.rankings?.length ?? 0
      baselines.value = data.baselines ?? []
    }
  }
  if (game.value?.recordable) await loadBoard().catch(() => {})
  if (game.value?.judge === 'VOTE') {
    const v = await GET('/api/app-games/{key}/votes', { path: { key: key.value } }).catch(() => null)
    if (v) votes.value = v.data
  }
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
  // 스쿼트는 카메라가 있어야 한다. 판을 열기 전에 알린다 (판이 열리고 0점으로 끝났다, 목적 판정 11/11 부분 2)
  if (key.value === 'squat' && !navigator.mediaDevices?.getUserMedia) {
    startError.value = '이 브라우저에서는 카메라를 쓸 수 없어 스쿼트를 할 수 없어요. 앱이나 다른 브라우저로 열어 주세요'
    return
  }
  // 카메라가 있어도 허락하지 않았으면(가장 흔하다) 판을 열기 전에 묻고, 거절이면 알린다 (경로 2 리뷰 W2)
  if (key.value === 'squat') {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach((t) => t.stop())
    } catch {
      startError.value = '카메라를 허락해야 스쿼트를 할 수 있어요. 휴대폰 설정에서 이 앱(브라우저)의 카메라를 켜 주세요'
      return
    }
  }
  if (ladderTo && !noLadder.value && game.value?.playMode === 'REALTIME') return router.push({ path: `/play/${key.value}/live`, query: { to: ladderTo, toName: ladderName } })
  if (game.value?.shared) return router.push(`/play/${key.value}/board`)
  if (game.value?.playMode === 'REALTIME') return router.push(game.value.battle ? `/play/${key.value}/battle` : liveRoute(key.value))
  starting.value = true
  startError.value = ''
  try {
    begin((await POST('/api/app-games/{key}/plays', { path: { key: key.value }, query: ladderTo ? { solo: true } : undefined })).data)
    result.value = null
    pendingSubmit.value = null
    submitError.value = ''
  } catch (e) {
    startError.value = errorMessage(e, '시작하지 못했어요. 잠시 뒤 다시 해 주세요')
  } finally {
    starting.value = false
  }
}

// 홈 맨 위 '내 판'에 쓴다. 판을 낸 때만 남긴다: 예전엔 게임 화면을 열기만 해도 바뀌어 하지도 않은 게임이 '이어서 하기'에 떴다 (목적 판정 11/11 4번)
function rememberLastGame() {
  if (!game.value) return
  const r = result.value as { myScore?: number; myFeedback?: string } | null
  try {
    // uid: 같은 폰에서 계정을 바꾸면 홈이 앞 사람의 판을 보이지 않게 (경로 4 리뷰 G4)
    localStorage.setItem('last_app_game', JSON.stringify({ uid: myId.value, key: game.value.key, title: game.value.title, at: Date.now(), line: r?.myFeedback?.split('\n')[0]?.match(/^\d등급/) ? r.myFeedback.split('\n')[0].split(' · ')[0] : r?.myScore != null ? `${r.myScore}${game.value.scoreUnit ?? '점'}` : '' }))
  } catch {
    // 못 남기면 홈에 안 보일 뿐이다
  }
}

async function submit(answer: string) {
  if (!play.value) return
  const playId = play.value.playId
  submitting.value = true
  try {
    justSubmitted = true
    result.value = (await POST('/api/app-games/plays/{playId}/submit', { path: { playId }, body: { answer } })).data
    rememberLastGame()
    // 낸 판의 임기응변 저장은 성공한 뒤에 지운다 (실패하면 다시 열어 이어 낼 수 있게 남겨 둔다, 가로 훑기 4)
    try { sessionStorage.removeItem(`improv_play_${play.value.playId}`) } catch { /* 없음 */ }
    play.value = null
    startError.value = ''
    load().catch(() => {})
  } catch (e) {
    // 판이 닫히면 첫 화면으로 돌아가니 오류는 시작 버튼 밑 칸에 남긴다 (판 아래 칸은 판과 함께 사라져 아무 말 없이 돌아갔다)
    pendingSubmit.value = { playId, answer }
    // 끊김이면 그렇다고 말하고, 연결이 돌아오면 저절로 다시 낸다 (11/11 몸과 시간: 지하철)
    submitError.value = startError.value = !navigator.onLine ? '인터넷이 끊겨 내지 못했어요. 쓴 답은 남아 있고, 연결되면 바로 다시 내요' : errorMessage(e, '내지 못했어요. 쓴 답은 남아 있어요')
    play.value = null
    load().catch(() => {})
  } finally {
    submitting.value = false
  }
}

// 내지 못한 답: 같은 판에 그대로 다시 낸다. 연결이 돌아오면 저절로
const pendingSubmit = ref<{ playId: number; answer: string } | null>(null)
const resubmitWhenOnline = () => { if (pendingSubmit.value && !submitting.value) resubmit() }
window.addEventListener('online', resubmitWhenOnline)
onBeforeUnmount(() => window.removeEventListener('online', resubmitWhenOnline))
async function resubmit() {
  const p = pendingSubmit.value
  if (!p) return
  submitting.value = true
  try {
    justSubmitted = true
    result.value = (await POST('/api/app-games/plays/{playId}/submit', { path: { playId: p.playId }, body: { answer: p.answer } })).data
    rememberLastGame()
    pendingSubmit.value = null
    submitError.value = startError.value = ''
    load().catch(() => {})
  } catch (e) {
    submitError.value = startError.value = errorMessage(e, '내지 못했어요. 쓴 답은 남아 있어요')
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
    startError.value = ''
    load().catch(() => {})
  } catch (e) {
    submitError.value = startError.value = errorMessage(e, '영상을 올리지 못했어요. 시간이 남았으면 다시 열어 이어서 낼 수 있어요')
    play.value = null
    load().catch(() => {})
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
  track('result_challenge', { gameKey: key.value, value: `duel=${gameId}${improvResult.value?.grade ? `;grade=${improvResult.value.grade}` : ''}` })
  challenging.value = true
  try {
    await POST('/api/app-games/duels/{gameId}/challenge', { path: { gameId } })
    // 폰에서는 공유 시트(카톡으로 바로), 안 되면 복사 (11/4 밤샘: 복사만 하면 카톡을 따로 열어 붙여 넣어야 했다)
    // 가입 없이 할 수 있는 게임이면 받은 친구가 가입 없이 바로 같은 문제로 (경로 2 리뷰 N1: /challenge는 가입 벽이었다)
    const link = key.value in GUEST_GAMES ? `${window.location.origin}/try/${key.value}?d=${gameId}` : `${window.location.origin}/challenge/${gameId}`
    // 임기응변은 손님 결과와 같은 등급대 한 줄: 9등급이 '나보다 잘할 수 있어요?'를 보내면 뜻하지 않게 우스웠다 (11/11 감정과 체면)
    const g = key.value === 'improv' ? improvResult.value?.grade : 0
    const line = g ? improvShareLine(g) : ''
    const msg = await shareLink(link, line ? `${line}${/[.?!]$/.test(line) ? '' : '.'} 같은 상황으로 붙자` : `${game.value?.title ?? '한 판'} 도전장이에요. 나보다 잘할 수 있어요?`)
    // '하루 동안 이 링크로만'은 뜻이 안 읽혔고, 복사가 실패해도 붙었다 (경로 2 리뷰 N4)
    if (msg) showToast(/못/.test(msg) ? msg : `${msg}. 친구가 하루 안에 열면 같은 ${key.value === 'improv' ? '상황' : '문제'}으로 붙어요`)
    askPushPermission() // 친구가 받으면 알려 드릴 수 있게
  } catch (e) {
    showToast(errorMessage(e, '도전장을 만들지 못했어요'))
  } finally {
    challenging.value = false
  }
}

/** 오늘의 초성 결과: "4/5 맞힘 · 38초" → 칸 그림과 함께. 같은 날이면 친구도 같은 문제를 푼다 */
// 오늘의 낱말·셈도 같은 꼴: 한마디 첫 줄만 공유한다 (다음 줄은 답이라 가린다). 다섯 문제 게임은 칸 그림을 붙인다
const DAILY_SHARE = ['daily-chosung', 'daily-literacy', 'daily-number']
async function shareDaily(feedback: string) {
  const head = feedback.split('\n')[0]
  const right = head.match(/(\d)\/5/)?.[1]
  const boxes = right == null ? '' : '■'.repeat(Number(right)) + '□'.repeat(5 - Number(right)) + '\n'
  const msg = await shareLink(`${window.location.origin}/play/${key.value}`, `${game.value?.title ?? '오늘의 퍼즐'} ${head}\n${boxes}같은 문제로 붙어 봐요`)
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
// 임기응변 등급: 문제의 상황 셋, 답 셋(JSON), 한마디 첫 줄의 등급 (utils/improv.ts)
// 가입 전 한 판(임기응변)의 결과가 이 기기에 남아 있으면, 막 가입한 사람에게 한 번 보여 주고 지운다 (GuestPlayView의 improv_last_result)
const joinedFrom = ref<{ grade: number } | null>(null)
if (key.value === 'improv') {
  try {
    const v = JSON.parse(localStorage.getItem('improv_last_result') || 'null')
    const r = v && Date.now() - v.at < 2 * 3600_000 ? improvFeedback(v.result?.feedback) : null
    if (r && !r.empty) {
      // '기록에 남았어요'는 옮기기가 된 때만 (실패해도 같은 말이 떴다, 경로 2 리뷰 N12). 실패면 결과를 지우지 않아 다음에 다시 옮길 때 보인다
      guestClaimResult().then((n) => {
        if (n < 0) return
        joinedFrom.value = { grade: r.grade }
        // 가입하며 옮긴 판도 홈 '내 판'의 마지막 판으로 (예전엔 남지 않아 막 가입한 사람이 홈에서 옛 목록만 봤다)
        getMyId().then((uid) => localStorage.setItem('last_app_game', JSON.stringify({ uid, key: 'improv', title: '임기응변 등급', at: Date.now(), line: `${r.grade}등급` }))).catch(() => {})
        localStorage.removeItem('improv_last_result')
      }).catch(() => {})
    } else localStorage.removeItem('improv_last_result')
  } catch {
    // 못 읽으면 보이지 않을 뿐이다
  }
}
// '알려 드릴게요'는 앱(휴대폰 알림)에서만 지킬 수 있다. 웹(인스타 앱 안 포함)은 알림함에 남는 데까지가 사실이다 (경로 2 리뷰 N2, 가로 훑기 7절)
const NOTICE = isCapacitorApp ? '알림으로 알려 드릴게요' : '알림함(위 종)에 남겨 둘게요'

// 로그인한 임기응변 결과의 스토리 그림 (손님 결과와 같은 그림). 누른 순간 바로 넘겨야 사파리가 공유를 막지 않아 미리 찍어 둔다
const storyFile = ref<File | null>(null)
watch(() => [result.value?.gameId, result.value?.myFeedback], async () => {
  storyFile.value = null
  const r = improvResult.value
  const res = result.value
  if (!r || r.empty || !res || res.status === 'COMPLETED') return
  const shown = improvSituations(res.problem)
  const said = improvAnswers(res.myAnswer)
  const i = r.best ?? said.reduce((best, a, k) => ((a?.length ?? 0) > (said[best]?.length ?? 0) ? k : best), 0)
  const st = shown[i]
  const best = st && said[i] ? { who: st.who, line: st.line, answer: said[i], reaction: r.reactions[i] } : null
  try {
    const { componentFile } = await loadStory()
    storyFile.value = await componentFile(storyCard!, { grade: r.grade, rank: r.rank, score: res.myScore ?? 0, best }, 'dark', `match-improv-${res.gameId}.png`)
  } catch {
    storyFile.value = null
  }
})
function shareStory() {
  const file = storyFile.value
  if (!file) return
  // 손님 결과와 같은 이름: 등급마다 보내는 비율을 본다 (11/11 감정과 체면)
  track('result_share', { gameKey: key.value, value: `story${improvResult.value?.grade ? `;grade=${improvResult.value.grade}` : ''}` })
  // 그림을 누른 사람이 가입 없이 바로 해 볼 링크를 클립보드에 (인스타 링크 스티커에 붙인다)
  void copyText(withShareRef(`${window.location.origin}/try/improv?utm_source=instagram&utm_medium=story`))
  if (!story) return // 그림이 있으면 모듈도 이미 받았다
  const { shareFiles, inAppBrowser } = story
  void shareFiles([file]).then((r) => {
    // 앱 안 브라우저는 내려받기가 저장되지 않는다: 그림을 띄워 길게 눌러 저장하게 (11/11 몸과 시간)
    if (r === 'saved' && inAppBrowser) saveView.value = URL.createObjectURL(file)
    else if (r === 'saved') showToast('그림을 저장했어요. 링크도 복사했어요')
  })
}
const saveView = ref<string | null>(null)

const improvResult = computed(() => (key.value === 'improv' ? improvFeedback(result.value?.myFeedback) : null))
const opponentImprov = computed(() => (key.value === 'improv' ? improvFeedback(result.value?.opponentFeedback) : null))
const improvGrade = computed(() => (key.value === 'improv' && !improvResult.value?.empty && result.value?.myFeedback?.includes('등급') ? result.value.myFeedback.split('\n')[0] : ''))

// 이름 뒤 조사 이/가 (AI 심판이, AI 셰프가). 받침이 없는 글자·한글이 아니면 '가'
function josaIga(name: string) {
  const c = name.charCodeAt(name.length - 1) - 0xac00
  return c >= 0 && c <= 11171 && c % 28 !== 0 ? '이' : '가'
}

// AI가 채점하는 게임마다 심판 이름
// 임기응변은 판 내내 인물이 반응했으니 끝에 '심판'이라는 새 인물을 들이지 않는다 (3-5 용어 8)
const judgeName = computed(() => (key.value === 'recipe' ? 'AI 셰프' : key.value === 'trial' ? 'AI 판사' : key.value === 'improv' ? 'AI' : 'AI 심판'))

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
  if (d.myJudging) return isVote.value ? '문장을 확인하고 있어요' : `${judgeName.value}${josaIga(judgeName.value)} 채점하고 있어요`
  if (isVote.value) return d.myAnswer ?? ''
  // 실시간 판은 '내기'가 없다: 하는 중인 판으로 돌아가게 (11/5 9e)
  if (d.playMode === 'REALTIME') return d.opponent ? '하는 중이에요 · 눌러서 돌아가기' : '상대를 기다리는 중이에요'
  return d.myScore != null ? `내 기록 ${d.myScore}${unit}` : canResume(d) ? '안 냈어요 · 눌러서 이어 하기' : '아직 내지 않았어요'
}
function duelBadge(d: Duel) {
  if (d.status === 'COMPLETED') return VERDICT[d.result || 'DRAW']
  if (d.status === 'CANCELED') return '취소'
  if (d.status === 'VOTING') return '투표 중'
  // '기다리는 중'과 '결과 기다림'이 어떻게 다른지 몰랐다: 무엇을 기다리는지 말한다 (경로 전부 훑기 2절)
  if (d.status === 'AWAITING_RESULT') return '경기 결과 기다림'
  if (d.myJudging) return isVote.value ? '확인 중' : '채점 중'
  if (d.playMode === 'REALTIME') return d.opponent ? '하는 중' : '상대 기다림'
  return d.opponent ? '상대가 푸는 중' : '상대 찾는 중'
}
// 끝나지 않은 실시간 판은 결과 카드 대신 그 판으로 (대기실·대전 화면)
// 새로고침·뒤로 가기로 판을 놓쳤으면 내지 않은 판을 이어서 한다 (서버가 같은 판을 돌려준다).
// 예전에는 빈 결과 카드('상대를 찾고 있어요', 0점)가 떠서 낸 것처럼 보였다
function canResume(d: Duel) {
  return canResumeDuel(d, Date.now() + offset)
}
function openUnfinished(d: Duel) {
  if (d.playMode === 'REALTIME') router.push(liveRoute(d.key))
  else if (canResume(d)) start()
  else result.value = d
}

watch(boardKind, loadBoard)

let stop: (() => void) | undefined
onMounted(async () => {
  try {
    await load()
  } catch {
    loadFailed.value = true
    return
  }
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
  // 홈 '한 판 더'(?again=1): 게임 첫 화면을 거치지 않고 바로 판으로 (경로 4 리뷰 G3)
  if (route.query.again && !play.value && !result.value) {
    dropQuery()
    await start()
  }
  const duelId = Number(route.query.duel)
  if (duelId) {
    // 알림의 대결이 없어졌거나 내 것이 아니면 알리고 게임 화면에 둔다 (예전엔 잡히지 않은 오류로 아래 등록까지 멈췄다)
    try {
      result.value = duels.value.find((d) => d.gameId === duelId)
        ?? (await GET('/api/app-games/duels/{gameId}', { path: { gameId: duelId } })).data
    } catch (e) {
      showToast((e as { response?: { data?: { message?: string } } }).response?.data?.message || '그 대결을 찾지 못했어요')
      router.replace({ query: {} })
    }
  }
  // 상대가 플레이해서 결과가 나오면 서버가 신호를 보낸다
  stop = refreshOnChange(() => {
    if (!play.value) load().catch(() => {})
  })
})
onBeforeUnmount(() => stop?.())
async function retry() {
  loadFailed.value = false
  try { await load() } catch { loadFailed.value = true }
}
</script>
