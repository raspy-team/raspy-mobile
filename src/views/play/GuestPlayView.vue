<template>
  <div class="min-h-dvh bg-canvas">
    <!-- 앱 안에서 왔으면 뒤로 (광고·카톡 링크로 바로 열었으면 갈 곳이 없어 두지 않는다, 경로 3 훑기 '나가는 길 없음') -->
    <UiTopBar :title="meta?.title || '한 판'" :back="hasHistory" />

    <main class="max-w-xl mx-auto px-4 pt-4 pb-16">
      <!-- '시작하면'이 가입을 뜻하는 줄 몰랐다. 대안은 지금 미는 손님 게임 (경로 3 훑기, 목적 판정 3) -->
      <UiEmptyState v-if="!meta" mascot="kok" title="가입하고 할 수 있는 게임이에요" description="가입하면 모든 게임을 할 수 있어요. 가입 없이 바로 해 볼 수 있는 게임도 있어요">
        <div class="flex flex-col items-center gap-2">
          <UiButton to="/init">가입하기</UiButton>
          <UiButton to="/try/improv" variant="ghost">가입 없이 임기응변 등급</UiButton>
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
        <!-- 내기가 막혀도 판을 닫지 않고 같은 답으로 다시 낸다 (걷기 C7, 경로 3 훑기: 판이 닫히고 시작 화면으로 가 하던 판이 사라진 것 같았다).
             초성·감 잡기는 판 안에 '다시 내기'가 있다 -->
        <template v-if="submitError && lastAnswer != null && (key === 'improv' || key === 'nunchi')">
          <UiButton block class="mt-2" :loading="submitting" @click="submit(lastAnswer)">{{ key === 'improv' ? '다시 채점하기' : '다시 내기' }}</UiButton>
          <UiButton block variant="ghost" class="mt-1" :disabled="submitting" @click="again">처음부터 새 판</UiButton>
        </template>
      </template>

      <!-- 끝난 판: 점수를 보여 주고, 저장하고 사람과 붙으려면 가입 -->
      <template v-else-if="result">
        <UiCard class="text-center py-8">
          <MatchMascot :who="key === 'improv' ? 'match' : 'kok'" :mood="improv ? (improv.grade && improv.grade <= 4 ? 'cheer' : improv.grade >= 7 ? 'sad' : 'smile') : result.score > 0 ? 'cheer' : 'smile'" :size="72" class="mx-auto mb-3" />
          <p v-if="key === 'nunchi'" class="t-micro">눈치 점수</p>
          <p v-if="improv?.empty" class="t-micro">임기응변 등급</p>
          <!-- 등급이 안 나온 판(셋 다 빈 답·마감 넘김)도 임기응변 틀 그대로, 할 일은 '다시 하기' 하나 -->
          <template v-if="improv?.empty">
            <p class="t-title mt-2 break-keep">{{ improv.empty }}</p>
            <p class="t-caption mt-2 break-keep">상황마다 한마디만 써도 등급이 나와요</p>
            <UiButton block size="lg" class="mt-5" :loading="starting" @click="again">다시 하기</UiButton>
          </template>
          <template v-else-if="improv">
            <!-- 게임 이름은 위 막대에 있다. 점수는 '다음 등급까지'에서만 쓴다 (경로 10 훑기: 같은 말 둘, 숫자 넷) -->
            <p class="t-display tabular-nums">{{ improv.grade }}<span class="t-title ml-1">등급</span></p>
            <p class="t-caption mt-1">100명 중 {{ improv.rank }}등</p>
            <!-- 초대받은 1:1 (11/14): 승패와 친구의 답은 가입하면 본다. 처음부터 가입을 걸면 안 누르니, 다 푼 지금 건다 -->
            <div v-if="result.versus" class="mt-5 rounded-xl bg-surface-2 px-4 py-4">
              <p class="t-heading break-keep">{{ friendName === '친구' ? '친구와' : `${friendName}님과` }}의 승부가 났어요</p>
              <p class="t-caption mt-1 break-keep">누가 이겼는지, {{ friendName === '친구' ? '친구가' : `${friendName}님이` }} 뭐라고 답했는지는 가입하면 바로 보여요</p>
              <UiButton block class="mt-3" @click="join('versus_join')">누가 이겼는지 보기</UiButton>
            </div>
            <!-- 보내기는 등급 바로 밑: 등급을 막 본 순간이 자랑하고 싶은 마음이 가장 센 때다. '한 판 더'를 다음 목표 옆으로 올리며
                 보내기가 그 아래로 밀려났었다 (11/11 목적 다시 보기: 자랑·교류 동기, 3단계가 재는 것이 공유율) -->
            <!-- 320폭에서는 두 버튼의 글이 두 줄로 꺾였다: 좁으면 위아래로 쌓는다 (11/14) -->
            <div class="grid grid-cols-1 gap-2 mt-5">
              <!-- 그림을 못 찍었으면 눌리지 않는 버튼만 남기지 않고 거둔다 (11/11) -->
              <!-- 주 버튼은 친구에게 보내기 (11/14 피터 모델: 링크를 보내는 사람이 스토리 올리는 사람의 네 배) -->
              <UiButton icon="share" :loading="sharing === 'challenge'" @click="challengeFriend">친구에게 한 판 붙자</UiButton>
              <UiButton v-if="!storyFailed" variant="secondary" icon="instagram" :disabled="!storyReady" @click="onStory">인스타 스토리</UiButton>
            </div>
            <!-- 링크 스티커 안내는 누르기 전에: 공유가 끝난 뒤 뜬 토스트는 인스타 편집기에 있는 동안 못 봤다 (경로 10 훑기) -->
            <!-- 한 번 올려 본 사람에게는 같은 말이라 뺀다 (11/11 쌓이는 피로: 판마다 같은 안내) -->
            <!-- 올릴 이유 (11/14): 등급 자랑만이 아니라, 올리면 친구들이 같은 상황으로 들어오고 그 답과 승패가 나에게 온다 -->
            <p class="t-micro mt-2 break-keep">친구가 링크로 풀면 같은 상황으로 승패가 나요</p>
            <!-- 왜 이 등급인가, 다음엔 무엇을 (걷기 P1-7) -->
            <p v-if="improv.weak" class="t-body mt-4 break-keep"><template v-if="improv.strong">잘한 것 <b>{{ improv.strong }}</b> · </template>아쉬운 것 <b>{{ improv.weak }}</b></p>
            <p v-if="improv.tip" class="t-caption mt-1 break-keep">다음엔 {{ improv.tip }}</p>
            <!-- 다음 판의 목표 (3-5 마지막 걷기: "다음 판 목표가 안 보임") -->
            <p v-if="improv.next" class="t-label mt-3"><span class="hl">{{ improv.next }}</span></p>
            <!-- 한 판 더는 다음 목표 바로 밑 (네 화면 아래 회색 글자였다, 경로 10 훑기) -->
            <UiButton v-if="!startLimit" class="mt-4" size="sm" variant="secondary" :loading="starting" @click="again">한 판 더</UiButton>
          </template>
          <template v-if="!improv">
          <UiRollNumber class="t-display tabular-nums" :value="result.score" />
          <p class="t-caption">{{ result.scoreUnit }}</p>
          </template>
          <!-- 같은 말 둘("상위 n%" + "m명 중 k등")을 하나로, 임기응변과 같은 말로 (경로 3 훑기) -->
          <p v-if="topPercent != null && !improv" class="t-heading mt-5">100명 중 <span class="hl">{{ topPercent }}등</span></p>
          <p v-if="result.feedback && !improv" class="t-body mt-3 whitespace-pre-line">{{ result.feedback }}</p>
          <!-- 친구의 도전장으로 온 판 -->
          <p v-if="review?.challengerScore != null" class="t-heading mt-4">
            친구 {{ review.challengerScore }}점 ·
            {{ result.score > review.challengerScore ? '내가 이겼어요' : result.score < review.challengerScore ? '친구가 이겼어요' : '비겼어요' }}
          </p>
        </UiCard>

        <!-- 결과 바로 밑으로 올렸다: 상황 카드 셋 아래 맨 끝이라 결과를 본 사람이 거기까지 내리지 않았다 (11/13 실제 기기 한 바퀴) -->
        <!-- 임기응변: 학교 대항이 가입의 이유다. 이 칸이 뜨면 아래 '등급 남기기' 칸은 같은 가입 버튼이라 뺀다 (11/14) -->
        <ImprovSchools v-if="improv && !improv.empty" guest :grade="improv.grade" :no-cta="result.versus" class="mt-4" @join="join('school_join')" @ready="(ok) => (schoolsShown = ok)" />
        <UiCard v-if="!improv?.empty && !result.versus && !(improv && schoolsShown)" class="mt-4">
          <!-- 가입하며 옮긴 판은 기록(최고 기록·기록 순위)에만 남고 승패는 없다(0승 0패). 지키지 못하는 말을 하지 않는다 (first10 검토) -->
          <!-- 임기응변은 제목 없이: 제목과 버튼이 같은 '등급 남기기'였다 (11/13 실제 기기 한 바퀴) -->
          <p v-if="!improv" class="t-title">점수 저장하고 사람과 붙기</p>
          <!-- '시작'은 판 시작과 가입 두 뜻이었다: 가입은 '가입' (경로 3·10 훑기) -->
          <p :class="improv ? 't-body' : 't-caption mt-1'">{{ improv ? `가입하면 ${improvKeepLine(improv.grade)}. 친구에게 한 판 붙자고 할 수 있어요` : '가입하면 이 점수가 내 기록에 남아요. 다음 판부터는 사람과 승패를 내요' }}</p>
          <UiButton block size="lg" class="mt-4" @click="join('result_join')">{{ improv ? '등급 남기기' : '점수 남기기' }}</UiButton>
        </UiCard>

        <!-- 임기응변 등급: 보내기가 등급 바로 밑 (걷기 C5: 카드 셋 아래라 "버튼이 어디 있어"), 그 아래 상황마다 내 대답과 인물 반응 -->
        <template v-if="improv">
          <UiCard v-for="(s, i) in improvShown" :key="s.id" class="mt-3">
            <p class="t-micro">{{ s.who }}</p>
            <p class="t-caption mt-1 break-keep">“{{ s.line }}”</p>
            <p class="t-body mt-2 break-keep">나: {{ improvSaid[i] || '(대답 없음)' }}</p>
            <p v-if="improv.reactions[i]" class="t-caption mt-1 break-keep">→ {{ improv.reactions[i] }}</p>
            <!-- 도전장: 친구의 답을 나란히 (놀림 거리가 바로 이것, 걷기 P4) -->
            <p v-if="friendSaid.length" class="t-body mt-3 pt-3 border-t border-line break-keep text-fg-muted">친구: {{ friendSaid[i] || '(대답 없음)' }}</p>
          </UiCard>
          <ImprovSentChallenges :visitor-id="visitorIdNow" class="mt-4" @join="join('versus_join')" />
        </template>

        <!-- 다음 행동: 친구에게 도전 · 공유 -->
        <!-- 보내기는 하나: '결과 공유'로 받은 친구는 내 점수와 붙지 못했다 (경로 3 훑기, 목적 판정 3) -->
        <UiButton v-if="key === 'nunchi'" block variant="secondary" icon="share" class="mt-4" :loading="sharing === 'challenge'" @click="challengeFriend">친구에게 한 판 붙자</UiButton>

        <UiButton v-if="key !== 'daily-chosung' && !improv && !startLimit" block variant="ghost" class="mt-2" :loading="starting" @click="again">한 판 더</UiButton>
        <!-- 하루 판 수를 넘기면 이유와 함께 가입 버튼 (가장 하고 싶은 사람이 '시작'만 되풀이하며 막혔다, 경로 3 리뷰 R5) -->
        <p v-if="startError" class="t-caption text-danger mt-2 text-center">{{ startError }}</p>
        <UiButton v-if="startLimit" block size="lg" class="mt-2" @click="join('limit_join')">가입하고 계속하기</UiButton>

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
                <span v-else class="block t-caption">나와 같은 답을 고른 사람 <b class="text-fg">{{ t.sameRate }}%</b> ({{ t.people }}명 중)</span>
              </li>
            </ul>
            <p v-if="tasteResults.some((t) => t.byAi)" class="t-micro mt-3">AI 추정은 사람이 {{ tasteResults[0]?.minVotes ?? 5 }}명 모이면 실제 비율로 바뀌어요</p>
          </template>
          <template v-else>
            <p class="t-title">다음 사람의 정답이 돼요</p>
            <!-- '당신'은 이 앱에서 이곳만 썼다. 왜 고르는지 한 줄 더 (경로 3 훑기) -->
            <p class="t-caption mt-1 break-keep">내 취향으로 3개만 골라 주세요. 다음에 푸는 사람의 정답이 돼요</p>
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
            <!-- 한 줄 안에 반말과 존댓말이 섞였다 (경로 10 훑기) -->
            <p class="t-caption mt-2 break-keep">45초 안에 뭐라고 할까요? 교수님·선배·동기, 상황 셋이면 등급이 나와요</p>
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
          <!-- 초대받은 1:1 (11/14): 누가 초대했는지만 말한다. 친구의 등급은 풀기 전에 보이지 않는다(풀고 나면 가입 전에 승패를 알게 된다).
               서버가 그 판을 도전장으로 받아 줄 때만 말한다 (버린 판이면 다른 문제가 나와 거짓이었다, 경로 3 훑기) -->
          <!-- 임기응변은 초대가 곧 제목이다(intro): 초대받아 온 사람에게 광고 문구가 제목이고 초대는 그 밑 작은 줄이었다 (11/14 화면 확인) -->
          <template v-if="invited && (key !== 'improv' || adSituation)">
            <p class="t-heading mt-4 break-keep">{{ inviter ? `${inviter}님이` : '친구가' }} 경기에 초대했어요</p>
            <p class="t-caption mt-1 break-keep">같은 {{ key === 'improv' ? '상황 셋으로' : '문제로' }} 1:1. 다 풀면 승패가 나요</p>
          </template>
          <p v-else-if="challenge?.answered" class="t-caption mt-4 break-keep">이미 푼 한 판이에요. 새 {{ key === 'improv' ? '상황으로' : '문제로' }} 한 판 해요</p>
        </UiCard>
        <UiButton block size="lg" class="mt-4" :loading="starting" @click="start('start')">{{ key === 'improv' ? '시작하기' : '한 판 하기' }}</UiButton>
        <!-- 지금 사람이 있나: 실제 수가 넉넉할 때만 (11/14 '빈 식당') -->
        <ImprovPulse v-if="key === 'improv'" />
        <!-- 임기응변: 내가 보낸 도전장의 결과 (손님은 알림이 없어 다시 오면 여기서 본다, 걷기 C2) -->
        <ImprovSentChallenges v-if="key === 'improv'" :visitor-id="visitorIdNow" class="mt-6" @join="join('versus_join')" />
        <p v-if="startError" class="t-caption text-danger mt-3 text-center">{{ startError }}</p>
        <UiButton v-if="startLimit" block size="lg" class="mt-2" @click="join('limit_join')">가입하고 계속하기</UiButton>
        <UiButton v-else block variant="ghost" class="mt-2" @click="join('intro_join')">이미 계정이 있어요</UiButton>
      </template>
    </main>
  </div>
    <StoryLinkGuide v-model="guideOpen" @go="guideGo" />
  <SaveImageSheet :src="saveView" @close="saveView = null" />
</template>

<script setup lang="ts">
// 가입 없이 한 판 (/try/:key, 3단계 수요 조사 '로그인을 미룰까' C, 11/5)
// 조사 링크로 온 사람이 로그인 전에 도착 게임을 한 판 한다. 개인정보 없이 무작위 기기 번호(visitor_id)만 쓰고,
// 끝나면 "점수 저장하고 상대와 붙기"로 시작 화면에 보낸다. 로그인하면 claimGuestPlays가 이 판을 기록으로 옮긴다
// 눈치 한 판(?q=첫 질문, ?c=친구의 판)은 결과에 문제마다 정답, 내 취향 받기, 친구 도전·공유가 붙는다. 버튼 하나하나 원본 기록(trackLog)에 남긴다
import SaveImageSheet from '../../components/share/SaveImageSheet.vue'
import { hasNativeInstagram } from '@/utils/nativeBridge'
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { GET, POST } from '@/api/client'
import type { components } from '@/api/schema'
import MatchMascot from '../../components/mascot/MatchMascot.vue'
import AppCountdown from '../../components/appgame/AppCountdown.vue'
import QuizSetPlay from '../../components/appgame/QuizSetPlay.vue'
import TimeSensePlay from '../../components/appgame/TimeSensePlay.vue'
import NunchiPlay from '../../components/appgame/NunchiPlay.vue'
import ImprovPlay from '../../components/appgame/ImprovPlay.vue'
import ImprovSentChallenges from '../../components/appgame/ImprovSentChallenges.vue'
import ImprovSchools from '../../components/appgame/ImprovSchools.vue'
import ImprovPulse from '../../components/appgame/ImprovPulse.vue'
import StoryLinkGuide, { storyGuideNeeded, storyGuideSeen } from '../../components/share/StoryLinkGuide.vue'
import { improvFeedback, improvShareLine, improvKeepLine, improvSituations, improvAnswers } from '@/utils/improv'
// 스토리 그림 찍기(snapdom, 압축 100KB 넘음)는 결과가 나올 때 받는다. 광고로 온 첫 화면에 실려
// 느린 폰에서 '시작하기'가 3.9초에야 보였다 (11/11 몸과 시간). 누른 순간 바로 공유해야 사파리가 막지 않으니, 누를 때가 아니라 결과가 뜰 때 미리 받는다
let story: typeof import('@/utils/storyShare') | null = null
let storyCard: typeof import('../../components/share/ImprovStoryCard.vue').default | null = null
async function loadStory() {
  if (!story) [story, storyCard] = await Promise.all([import('@/utils/storyShare'), import('../../components/share/ImprovStoryCard.vue').then((m) => m.default)])
  return story
}
import { withShareRef } from '@/utils/shareRef'
import { copyText } from '@/utils/clipboard'
import { UiButton, UiCard, UiEmptyState, UiRollNumber, UiSection, UiTopBar } from '../../components/ui'
import { GUEST_GAMES } from '@/utils/guestGames'
import { claimGuestPlays, getVisitorId, markGuestPlayed, trackEvent } from '@/utils/visit'
import { tokenAlive } from '@/utils/tokenAlive'
import { track } from '@/utils/trackLog'
import { rememberReturnTo } from '@/utils/authRedirect'
import { shareLink, sendLink } from '@/utils/share'
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
// 가입한 사람이 보낸 도전장(?d=대결 번호): 가입 없이 같은 문제로 붙는다 (경로 2 리뷰 N1)
const fromDuel = Number(route.query.d) || undefined
// 대결 링크를 보낸 사람 (스토리·공유 링크 ?d=&u=&k=). 없으면 대결을 연 사람
const fromUser = Number(route.query.u) || undefined
// 도전장 열쇠 (?k=): 손님 판 번호는 차례로 늘어, 열쇠가 맞아야 친구 등급·친구 답을 보여 준다 (열쇠 없는 옛 링크도 같은 상황으로는 붙는다)
const challengeK = typeof route.query.k === 'string' ? route.query.k : undefined

// 이미 로그인했으면 원래 게임 화면으로. 단 친구의 초대 링크(?c= · ?d=)면 여기서 그대로 푼다 (11/14: 가입한 사람이 친구 링크를 누르면
// 게임 화면으로 넘어가며 초대가 사라져, 아무 문제나 나오는 새 판이 됐고 보낸 친구는 결과를 못 받았다).
// 다 풀면 그 판을 곧바로 내 기록으로 옮겨(claim) 친구와의 1:1이 된다. 끝난 토큰은 없는 것으로 친다
const signedIn = tokenAlive()
if (!signedIn) { try { localStorage.removeItem('raspy_access_token2') } catch { /* 그대로 손님으로 */ } }
const memberOnInvite = signedIn && !!(fromPlay || fromDuel)
if (signedIn && !memberOnInvite) router.replace({ path: `/play/${key.value}`, query: route.query })

const play = ref<Play | null>(null)
const playId = ref<number | null>(null)
const result = ref<Result | null>(null)
const review = ref<Review | null>(null)
const counting = ref(false)
let offset = 0 // 서버 시각 - 기기 시각
const starting = ref(false)
const submitting = ref(false)
const startError = ref('')
// 하루 판 수·브라우저 때문에 가입해야 이어 할 수 있다: 오류 옆에 가입 버튼을 둔다 (경로 3 리뷰 R5)
const startLimit = computed(() => startError.value.includes('가입하면') || startError.value.includes('가입하고'))
const submitError = ref('')
// 앱 안에서 이 화면으로 왔나 (vue-router가 history.state.back에 적는다)
const hasHistory = !!window.history.state?.back
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
  // 결과가 남아 있으면 결과, 하던 판이 이 탭에 있으면 그 판으로 바로
  if (openSaved()) start('resume')
  else restoreLast()
  // 들어온 곳: 꼬리표(utm)·첫 질문·도전장. 방문(visit)과 같은 기기 번호로 잇는다
  track('try_open', { gameKey: key.value, value: window.location.search.slice(1, 400) || undefined })
})

function errorMessage(e: unknown, fallback: string) {
  return (e as { response?: { data?: { message?: string } } }).response?.data?.message || fallback
}

// 하던 판 이어 하기: 새로 고침·인스타 앱 안 브라우저를 닫았다 연 사람이 시작 화면을 한 번 더 거치지 않고 바로 판으로 (경로 3 리뷰 R1).
// 이 탭에 열린 판 번호와 마감만 둔다. 서버가 같은 판을 돌려준다(내지 않은 판·같은 도전장의 열린 판)
const OPEN_KEY = `guest_open_${key.value}`
function rememberOpen(p: Play | null) {
  try {
    if (p) sessionStorage.setItem(OPEN_KEY, JSON.stringify({ playId: p.playId, deadlineAt: p.deadlineAt }))
    else sessionStorage.removeItem(OPEN_KEY)
  } catch { /* 저장이 막히면 시작 화면부터 */ }
}
function openSaved(): boolean {
  try {
    const v = JSON.parse(sessionStorage.getItem(OPEN_KEY) || 'null')
    return !!v && new Date(v.deadlineAt).getTime() > Date.now()
  } catch {
    return false
  }
}

async function start(from: 'start' | 'again' | 'resume') {
  const visitorId = getVisitorId()
  if (!visitorId) {
    startError.value = '이 브라우저에서는 가입 없이 할 수 없어요. 가입하고 해 주세요'
    return
  }
  starting.value = true
  startError.value = ''
  try {
    // 한 판 더는 광고 질문·도전장 없이 새 문제로
    const first = from !== 'again'
    const body = { visitorId, key: key.value, first: first ? firstQuestion : undefined, from: first ? fromPlay : undefined, k: first ? challengeK : undefined, duel: first ? fromDuel : undefined, u: first ? fromUser : undefined }
    const p = (await POST('/api/guest/plays', { body })).data
    offset = new Date(p.serverNow).getTime() - Date.now()
    counting.value = new Date(p.startedAt).getTime() > Date.now() + offset
    play.value = p
    rememberOpen(p)
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
    try { sessionStorage.removeItem(`improv_play_${play.value.playId}`) } catch { /* 없음 */ } // 성공한 뒤에만 지운다 (가로 훑기 4)
    rememberOpen(null)
    feel(result.value.score > 0 ? 'success' : 'lose')
    track('guest_play_result', { gameKey: key.value, step: rounds.value, value: `score=${result.value.score};rank=${result.value.rank ?? ''}/${result.value.rankOf ?? ''}` })
    play.value = null
    if (key.value === 'nunchi') loadReview()
    if (key.value === 'improv') prepareStory()
    saveLast()
    // 가입한 사람이 푼 초대 판: 바로 내 기록으로 옮기고 게임 화면에서 친구와의 승패를 본다
    if (memberOnInvite) {
      await claimGuestPlays().catch(() => 0)
      return void router.replace(`/play/${key.value}`)
    }
  } catch (e) {
    // 인터넷이 끊긴 것이면 그렇다고 말한다: '채점이 막혔어요'는 서버 탓처럼 들렸다. 연결이 돌아오면 저절로 다시 낸다 (11/11 몸과 시간: 지하철)
    submitError.value = !navigator.onLine
      ? '인터넷이 끊겨 내지 못했어요. 쓴 답은 그대로 있고, 연결되면 바로 다시 내요'
      : key.value === 'improv' ? '채점이 잠깐 막혔어요. 쓴 답은 그대로 있어요' : errorMessage(e, '답을 내지 못했어요. 쓴 답은 그대로 있어요')
    track('guest_play_submit_failed', { gameKey: key.value, value: submitError.value })
    // 판을 닫지 않는다: 쓴 답을 그대로 두고 같은 답으로 다시 낸다 (예전엔 임기응변 밖의 게임은 판이 닫히고 시작 화면으로 가 하던 판이 사라진 것 같았다, 경로 3 훑기)
  } finally {
    submitting.value = false
  }
}

// 연결이 돌아오면 못 낸 답을 저절로 다시 낸다 (사람이 '다시 채점하기'를 눌러야 했다)
function resubmitWhenOnline() {
  if (submitError.value && lastAnswer.value && !submitting.value && play.value) submit(lastAnswer.value)
}
window.addEventListener('online', resubmitWhenOnline)
onBeforeUnmount(() => window.removeEventListener('online', resubmitWhenOnline))

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

/** 기록에 붙이는 등급 (';grade=7'). 등급마다 보내고 가입하는 비율이 다른지 본다 (11/11 감정과 체면) */
function gradeTag() {
  return improv.value?.grade ? `;grade=${improv.value.grade}` : ''
}

/** 시작 화면으로. 가입하면 이 게임 화면으로 돌아오고, 시작 화면은 버튼 누름을 '가입 전 한 판 끝'에서 센다 */
const schoolsShown = ref(false)
function join(name: 'result_join' | 'intro_join' | 'limit_join' | 'versus_join' | 'school_join') {
  track(name, { gameKey: key.value, step: rounds.value, value: gradeTag().slice(1) || undefined })
  // 학교로 참전하려고 가입하는 사람은 가입 뒤 곧바로 학교 고르기로 (11/14 피터로 걷기: 게임 첫 화면으로 돌아와 '학교 고르기'를 다시 찾아야 했다)
  // 아직 풀기 전에 로그인하러 가는 초대받은 사람(이미 계정이 있어요): 돌아와서 이 초대를 그대로 풀게 주소를 통째로 (11/14: 초대가 떨어져 새 판이 됐다)
  const invitedBefore = !result.value && (fromPlay || fromDuel)
  rememberReturnTo(invitedBefore ? route.fullPath : name === 'school_join' ? `/settings/organizations?back=${encodeURIComponent(`/play/${key.value}`)}` : `/play/${key.value}`)
  router.push({ path: '/init', query: { from: result.value ? 'guest' : undefined } })
}

// ── 임기응변 등급: 결과 남겨 두기 ──
// 결과를 보고 인스타 스토리에 올리러 갔다가 같은 링크로 돌아오면 결과가 사라져 처음 화면이었다 (걷기 P1).
// 이 기기에 2시간 남겨 두고, 친구 도전장(?c=)으로 온 게 아니면 돌아왔을 때 그 결과를 다시 보여 준다
// 임기응변은 가입 뒤 게임 화면(AppGameView)이 같은 이름으로 '방금 판'을 읽는다. 다른 손님 게임도 새로 고침에 결과가 사라졌다 (경로 3 훑기)
const LAST_KEY = key.value === 'improv' ? 'improv_last_result' : `guest_last_${key.value}`
const LAST_MS = 2 * 3600_000
function saveLast() {
  try {
    localStorage.setItem(LAST_KEY, JSON.stringify({ at: Date.now(), playId: playId.value, from: fromPlay ?? null, q: firstQuestion ?? null, result: result.value, problem: lastProblem.value, answer: lastAnswer.value }))
  } catch {
    // 못 남기면 돌아왔을 때 처음 화면일 뿐이다
  }
}
function restoreLast(): boolean {
  try {
    const v = JSON.parse(localStorage.getItem(LAST_KEY) || 'null')
    if (!v?.result || Date.now() - v.at > LAST_MS) return false
    // 다른 도전장 링크로 왔으면 그 도전장을 풀게 한다 (같은 도전장이거나 도전장 없이 왔을 때만 되살린다)
    if (fromPlay && v.from !== fromPlay && v.playId !== fromPlay) return false
    // 다른 광고(?q=다른 상황)를 보고 왔으면 그 상황부터 (옛 결과가 광고 상황을 가렸다, 경로 10 리뷰 I6)
    if (firstQuestion && v.q !== firstQuestion) return false
    playId.value = v.playId
    result.value = v.result
    lastProblem.value = v.problem
    lastAnswer.value = v.answer
    if (key.value === 'improv') prepareStory()
    if (key.value === 'nunchi') loadReview()
    track(key.value === 'improv' ? 'improv_result_restored' : 'guest_result_restored', { gameKey: key.value })
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
  invited.value
    ? { title: `${inviter.value ? `${inviter.value}님이` : '친구가'} 경기에 초대했어요`, body: '같은 상황 셋으로 1:1. 교수님·선배·처음 보는 동기한테 45초 안에 한마디. 다 풀면 승패가 나요' }
    : route.query.utm_source === 'fmkorea'
    ? { title: 'AI가 매기는 임기응변 등급', body: '교수님·선배·처음 보는 동기한테 45초 안에 한마디. 수능처럼 1~9등급이에요. 서울대 의대생은 4등급' }
    : route.query.utm_source === 'everytime'
      ? { title: '새내기 때로 돌아가면 몇 등급?', body: '교수님·선배·처음 보는 동기, 상황마다 45초. 서울대 의대생은 4등급' }
      // '우리 중'은 혼자 온 사람에게 누구인지 몰랐다 (경로 10 훑기)
      : { title: '서울대 의대생도 4등급 맞은 시험', body: '나는 대학생이 될 준비가 됐을까? 교수님·선배·처음 보는 동기, 상황마다 45초' },
)
const friendSaid = computed(() => improvAnswers(result.value?.challengerAnswer))
// 서버가 이 링크를 도전장으로 받아 줄지 (같은 게임의 낸 판이고, 이 기기가 아직 안 푼 것). 못 받으면 도전장이라고 말하지 않는다
const challenge = ref<{ answered: boolean; name?: string } | null>(null)
if (fromPlay) {
  GET('/api/guest/plays/{playId}/challenge', { path: { playId: fromPlay }, query: { k: challengeK, visitorId: getVisitorId() ?? undefined } })
    .then(({ data }) => {
      if (data?.gameKey && data.gameKey !== key.value) return
      challenge.value = { answered: !!data?.answered, name: data?.name ?? '' }
    })
    .catch(() => {})
}
// 가입한 친구의 도전장(?d=대결): 누가 보냈는지, 그 친구의 등급 (11/13 안드로이드 실제 기기 한 바퀴: '친구가'만 있고 누구인지 없었다)
const duelBy = ref<{ name: string; open: boolean } | null>(null)
if (fromDuel && !fromPlay) {
  GET('/api/guest/plays/duels/{gameId}', { path: { gameId: fromDuel }, query: { u: fromUser, k: challengeK } })
    .then(({ data }) => (duelBy.value = { name: data.name, open: !!data.open }))
    .catch(() => {})
}
// 서버가 이 링크를 초대로 받아 준다 (아직 안 푼 도전장, 열려 있는 대결 링크)
const invited = computed(() => !!((challenge.value && !challenge.value.answered) || (fromDuel && !fromPlay && duelBy.value?.open)))
// 초대한 사람 이름 (가입한 사람이 보냈을 때만 안다)
const inviter = computed(() => duelBy.value?.name || challenge.value?.name || '')
// 결과 줄의 상대 이름 (가입한 친구의 도전장이면 그 이름, 아니면 '친구')
const friendName = computed(() => result.value?.challengerName || '친구')
// 도전장을 보낸 친구의 등급 줄에서 "N등급"만
// 스토리 그림은 결과가 나오자마자 미리 찍어 둔다 (누른 순간 바로 넘겨야 사파리가 공유를 막지 않는다)
const storyFile = ref<File | null>(null)
const storyFailed = ref(false)
const storyReady = computed(() => !!storyFile.value)
async function prepareStory() {
  storyFile.value = null
  storyFailed.value = false
  const r = improv.value
  if (!r || r.empty || !result.value) return
  // 가장 잘한 대답: 서버가 가장 높게 매긴 상황 (경로 10 리뷰 I7). 옛 판엔 없어서 그때만 가장 긴 대답
  const i = r.best ?? improvSaid.value.reduce((best, a, k) => ((a?.length ?? 0) > (improvSaid.value[best]?.length ?? 0) ? k : best), 0)
  const s = improvShown.value[i]
  const best = s && improvSaid.value[i] ? { who: s.who, line: s.line, answer: improvSaid.value[i], reaction: r.reactions[i] } : null
  try {
    const { componentFile } = await loadStory()
    storyFile.value = await componentFile(storyCard!, { grade: r.grade, rank: r.rank, score: result.value!.score, best }, 'dark', `match-improv-${playId.value}.png`)
  } catch {
    storyFile.value = null
    storyFailed.value = true
  }
}
// 그림을 넘기면서, 그림을 누른 사람이 같은 상황을 풀 링크(공유 번호 포함)를 클립보드에 (인스타 링크 스티커에 붙인다)
// 스토리 링크: 누른 친구는 같은 상황으로 풀고, 가입하면 나와의 승부가 된다
const storyLink = () => withShareRef(`${window.location.origin}/try/improv?c=${playId.value}&k=${result.value?.challengeKey ?? ''}&utm_source=instagram&utm_medium=story`)
// 처음 두 번은 올리기 전에 링크 스티커 붙이는 법을 보여 준다 (11/14: 뺐다가 고병연이 되돌렸다. 읽는 사람이 적어도, 읽은 사람은 링크를 붙인다)
const guideOpen = ref(false)
function onStory() {
  if (!storyGuideNeeded()) return shareStory()
  void copyText(storyLink())
  track('story_guide', { gameKey: key.value, value: 'open' })
  guideOpen.value = true
}
function guideGo() {
  storyGuideSeen()
  guideOpen.value = false
  shareStory()
}
function shareStory() {
  const file = storyFile.value
  if (!file || !playId.value || !story) return  // 그림이 있으면 모듈도 이미 받았다
  const { shareFiles } = story
  track('result_share', { gameKey: key.value, step: rounds.value, value: `story${gradeTag()}` })
  try { localStorage.setItem('story_shared', '1') } catch { /* 못 남기면 안내가 다시 보일 뿐 */ }
  const link = storyLink()
  void copyText(link)
  // 앱: 소식 공유와 같이 인스타 스토리 편집기를 바로 열고 결과 카드를 붙인다 (11/11: 임기응변 결과만 일반 공유 창이라 그림 저장으로 끝났다)
  if (hasNativeInstagram) {
    void story.openInstagramStoryNative(file, 'dark', link).then((r) => {
      if (r === 'opened') return
      if (r === 'not_installed') return showToast('인스타그램 앱이 있어야 스토리에 올릴 수 있어요')
      void story!.shareFiles([file])
    })
    return
  }
  void shareFiles([file]).then((r) => {
    track('result_share_shared', { gameKey: key.value, value: `story:${r}` })
    // 링크 스티커 안내는 버튼 밑에 미리 있다(공유 뒤 토스트는 인스타 편집기에선 못 봤다). 저장으로 끝난 때만 알린다
    // 앱 안 브라우저는 내려받기가 저장되지 않는다: 그림을 띄워 길게 눌러 저장하게 (11/11 몸과 시간)
    if (r === 'saved' && story?.inAppBrowser) saveView.value = URL.createObjectURL(file)
    else if (r === 'saved') showToast('그림을 저장했어요. 링크도 복사했어요')
  })
}
const saveView = ref<string | null>(null)

// ── 눈치 한 판: 친구 도전·공유 ──
async function challengeFriend() {
  if (!playId.value) return
  track('result_challenge', { gameKey: key.value, step: rounds.value, value: `play=${playId.value}${gradeTag()}` })
  trackEvent('challenge', key.value === 'improv' ? 'improv' : 'nunchi')
  sharing.value = 'challenge'
  try {
    // 승패는 가입 전엔 모른다(11/14): 받은 판이든 아니든 내 등급으로 부른다
    const text = improv.value
      // 끊음이 없어 한 문장처럼 읽혔다 (경로 10 훑기): 앞 말이 끝나지 않았으면 마침표를 찍는다
      ? `${improvShareLine(improv.value.grade)}${/[.?!]$/.test(improvShareLine(improv.value.grade)) ? '' : '.'} 같은 상황으로 붙자`
      : `눈치 한 판 ${result.value?.score ?? 0}점. 같은 문제로 붙어 볼래요? 문제당 3초예요`
    const ck = key.value === 'improv' && result.value?.challengeKey ? `&k=${result.value.challengeKey}` : ''
    // 보내기 시트 (11/14): 카카오톡·스토리·메시지·복사·QR. 그림이 있으면 함께 보인다
    const dest = await sendLink(`${window.location.origin}/try/${key.value}?c=${playId.value}${ck}`, text, {
      title: '친구에게 한 판 붙자', file: storyFile.value, onStory: key.value === 'improv' && storyFile.value ? onStory : null, button: '같은 상황으로 붙기', place: `guest_${key.value}`,
    })
    if (!dest || dest === 'story') return
    track('result_challenge_shared', { gameKey: key.value, value: dest })
    // 보낸 사람에게 결과를 볼 곳을 알린다 (손님은 알림이 없어 이 링크(/try/improv)로 다시 와야 본다)
    if (key.value === 'improv' && dest !== 'copy') showToast('친구가 풀면 이 화면에 떠요')
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
