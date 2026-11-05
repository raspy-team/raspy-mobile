<template>
  <div>
  <UiTopBar title="경기 결과" back="/game">
    <!-- 공유는 위 막대 아이콘 하나 (애플식: 아래 '공유' 버튼은 이름 없이도 안다) -->
    <template #right><UiIconButton icon="share" label="공유" @click="onShare" /></template>
  </UiTopBar>

  <!-- 결과를 보여줄 수 없을 때 (아직 안 끝난 경기 등) -->
  <main v-if="!isLoading && resultError" class="px-4 pt-4 max-w-xl mx-auto">
    <UiEmptyState :icon="resultMissing ? 'fas fa-circle-xmark' : ''" mascot="match" :title="resultError" :description="resultMissing ? '주소가 바뀌었거나 지워진 경기예요' : '경기가 끝나면 여기서 결과를 볼 수 있어요'">
      <UiButton to="/game">내 경기로</UiButton>
    </UiEmptyState>
  </main>

  <main v-else class="px-4 pt-4 max-w-xl mx-auto space-y-8" :class="isParticipant && (confirmed || pending.canAnswer) ? 'pb-40' : 'pb-12'">
    <!-- 불러오는 중 -->
    <div v-if="isLoading" class="space-y-4 pt-6">
      <UiSkeleton class="h-8 w-1/2 mx-auto" />
      <UiSkeleton class="h-40 w-full" />
    </div>

    <template v-else>
      <!-- 결과 한 줄 + 점수판: 이 앱에서 감정이 가장 실리는 순간이라 글자와 숫자로 크게 -->
      <section>
        <!-- 이긴 순간: 매치 얼굴이 통통 튀어 오른다 -->
        <span v-if="headline.mark && isParticipant" class="relative block w-fit mx-auto mb-4 text-fg win-bounce">
          <MatchMascot who="match" mood="cheer" :size="64" />
          <!-- 이긴 순간 얼굴 둘레로 볼트 불꽃 -->
          <span v-for="n in 10" :key="n" class="win-spark" :style="{ '--a': n * 36 + 'deg' }" aria-hidden="true"></span>
        </span>
        <!-- 진 순간에도 같은 얼굴이 곁에 있다. 표정만 담담하게 (11/3, essence: 진 판도 기록, 다음 판) -->
        <span v-else-if="headline.line && isParticipant" class="block w-fit mx-auto mb-4 text-fg"><MatchMascot who="match" mood="sad" :size="64" /></span>
        <p class="text-center t-caption">{{ game.rule?.ruleTitle }}<template v-if="playedOn"> · {{ playedOn }}</template></p>
        <h1 class="t-display text-center mt-3 feel-rise" :class="headline.tone"><span :class="headline.mark ? 'hl hl-draw' : ''">{{ headline.text }}</span></h1>
        <!-- 증인: 결과를 낸 순간 중계를 보던 관중 (docs/live-spectator-review.md C) -->
        <p v-if="witnesses" class="t-caption text-center mt-1">관중 {{ witnesses }}명이 지켜본 경기</p>
        <!-- 이 경기로 바뀐 내 실력 점수: 이긴 사람이 가장 먼저 궁금한 숫자라 결과 바로 밑에 -->
        <p v-if="myRating && confirmed && !myRating.provisional" class="mt-3 flex items-baseline justify-center gap-2 feel-rise feel-rise-2" :aria-label="`실력 점수 ${myRating.before}에서 ${myRating.after}로`">
          <span class="t-caption">실력 점수</span>
          <span class="t-heading tabular-nums">{{ myRating.before }} → {{ myRating.after }}</span>
          <span class="t-label tabular-nums" :class="ratingDelta > 0 ? 'text-signal-fg' : ''">{{ ratingDelta > 0 ? `+${ratingDelta}` : ratingDelta === 0 ? "±0" : ratingDelta }}</span>
        </p>
        <!-- 첫 몇 판은 점수가 크게 움직인다. 숫자(첫 판에 -162)를 보여 주면 이긴 쪽은 착각하고 진 쪽은 상처받는다 (UX ④: 숫자 대신 한 줄) -->
        <p v-if="myRating && confirmed && myRating.provisional" class="t-caption text-center mt-3">실력 점수는 몇 판 더 하면 나와요</p>
        <!-- 다음 판: 이기든 지든 같은 규칙으로 바로 -->
        <template v-if="isParticipant && confirmed && !disputed && !peerVoting">
          <p v-if="headline.line" class="t-body text-center mt-4">{{ headline.line }}</p>
          <div class="flex justify-center mt-4">
            <UiButton size="sm" variant="tonal" icon="rotate-right" :to="`/create-game?ruleId=${game.rule?.id}`">한 판 더</UiButton>
          </div>
        </template>

        <!-- 참가자 투표 중: 자기 말고 한 명 뽑기 -->
        <section v-if="peerVoting" class="mt-8">
          <p class="t-heading text-center">누가 제일 잘했나요?</p>
          <p class="t-caption text-center mt-1">{{ peerVotes }}/{{ resSides.length }}명이 뽑았어요. 모두 뽑거나 24시간이 지나면 표가 많은 순서로 등수가 정해져요.</p>
          <ul class="mt-4 rounded-xl bg-surface divide-y divide-line">
            <li v-for="r in ranking" :key="r.id" class="flex items-center gap-3 px-4 h-14">
              <UiAvatar :src="r.profileUrl" :name="r.nickname" :user-id="r.id" size="sm" />
              <span class="flex-1 text-sm truncate">{{ r.nickname }}<span v-if="r.id === currentUserId" class="text-fg-subtle"> (나)</span></span>
              <UiBadge v-if="myPeerVote === r.id" tone="primary">뽑음</UiBadge>
              <UiButton v-else-if="isParticipant && !myPeerVote && r.id !== currentUserId" size="sm" variant="tonal" :loading="voting === r.id" @click="peerVote(r.id)">뽑기</UiButton>
            </li>
          </ul>
        </section>

        <!-- 셋 이상이 각자: 등수 표 -->
        <ol v-else-if="format === 'FREE_FOR_ALL'" class="mt-10 rounded-xl bg-surface divide-y divide-line">
          <li v-for="r in ranking" :key="r.id" class="flex items-center gap-3 px-4 h-14">
            <span class="t-mono w-8 text-fg" :class="r.place === 1 ? 'font-bold' : 'text-fg-subtle'">{{ r.place }}등</span>
            <button type="button" class="flex items-center gap-2.5 min-w-0 flex-1 text-left" @click="router.push('/profile/' + r.id)">
              <UiAvatar :src="r.profileUrl" :name="r.nickname" :user-id="r.id" size="sm" />
              <span class="text-sm truncate" :class="r.place === 1 ? 'text-fg font-medium' : 'text-fg-muted'">{{ r.nickname }}<UiAiBadge v-if="r.isBot" /><span v-if="r.id === currentUserId" class="text-fg-subtle"> (나)</span></span>
            </button>
            <span v-if="!placesEntered" class="font-mono tabular-nums text-fg-muted">{{ r.points }}</span>
          </li>
        </ol>

        <template v-else>
        <div class="mt-10 grid grid-cols-[1fr_auto_1fr] items-center gap-3 feel-rise feel-rise-3">
          <button
            v-for="(side, i) in sides"
            :key="side.user.id || i"
            type="button"
            class="flex flex-col items-center gap-2.5 min-w-0"
            :class="i === 1 ? 'order-3' : 'order-1'"
            @click="router.push('/profile/' + side.user.id)"
          >
            <span class="relative">
              <UiAvatar :src="side.user.profileUrl" :name="side.user.nickname" :user-id="side.user.id" size="lg" />
              <span
                v-if="side.champion"
                class="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-signal text-signal-on flex items-center justify-center text-sm"
                aria-label="새 챔피언"
              >
                <UiIcon name="crown" />
              </span>
            </span>
            <span class="text-sm truncate max-w-full" :class="side.won || !winnerIdx ? 'text-fg font-medium' : 'text-fg-muted'">
              {{ side.user.nickname }}<UiAiBadge v-if="side.user.isBot" /><span v-if="side.isMe" class="text-fg-subtle"> (나)</span>
            </span>
          </button>
          <!-- 세트 점수 없이 결과만 남긴 경기는 숫자 대신 vs -->
          <!-- 한 세트뿐이면 세트 수(1:0, 비기면 0:0) 대신 그 세트 점수 -->
          <p v-if="setResults.length" class="order-2 text-[4rem] font-semibold leading-none tracking-[-0.05em] tabular-nums" :aria-label="`${bigScore.label} ${bigScore.left} 대 ${bigScore.right}`">
            <UiRollNumber :value="bigScore.left" :class="sides[0].won || !winnerIdx ? 'text-fg' : 'text-fg-subtle'" /><span class="text-fg-subtle mx-1.5">:</span><UiRollNumber :value="bigScore.right" :delay="140" :class="sides[1].won || !winnerIdx ? 'text-fg' : 'text-fg-subtle'" />
          </p>
          <p v-else class="order-2 t-mono">vs</p>
        </div>

        <!-- 세트별 점수: 표로 -->
        <!-- 세트 점수: 상자 없이 줄만 -->
        <div v-if="setResults.length > 1" class="mt-10 border-y border-line divide-y divide-line">
          <div class="grid grid-cols-[3rem_1fr_auto_1fr] items-center px-1 h-10 t-micro">
            <span>세트</span>
            <span class="text-right truncate">{{ sides[0].user.nickname }}<UiAiBadge v-if="sides[0].user.isBot" /></span>
            <span class="w-6"></span>
            <span class="truncate">{{ sides[1].user.nickname }}<UiAiBadge v-if="sides[1].user.isBot" /></span>
          </div>
          <div v-for="s in setResults" :key="s.setIdx" class="grid grid-cols-[3rem_1fr_auto_1fr] items-center px-1 h-12 tabular-nums">
            <span class="text-fg-subtle text-sm">{{ s.setIdx }}</span>
            <span class="text-right text-lg" :class="setLeft(s) >= setRight(s) ? 'text-fg' : 'text-fg-subtle'">{{ setLeft(s) }}</span>
            <span class="w-6 text-center text-fg-subtle">:</span>
            <span class="text-lg" :class="setRight(s) >= setLeft(s) ? 'text-fg' : 'text-fg-subtle'">{{ setRight(s) }}</span>
          </div>
        </div>
        <p v-else-if="!setResults.length" class="t-caption text-center mt-6">세트 점수 없이 승패만 기록한 경기예요</p>
        </template>
      </section>

      <!-- 끝내 맞지 않은 결과 -->
      <UiCard v-if="disputed" class="flex items-start gap-3">
        <span class="w-10 h-10 rounded-full bg-surface-2 text-fg-muted flex items-center justify-center flex-shrink-0" aria-hidden="true">
          <UiIcon name="fas fa-triangle-exclamation" />
        </span>
        <div class="min-w-0">
          <p class="t-heading">결과가 끝내 맞지 않았어요</p>
          <p class="t-caption mt-0.5">세 번 돌려보내서 이 경기는 전적과 실력 점수에 남기지 않아요. 관리자가 확인할게요.</p>
        </div>
      </UiCard>

      <!-- 상대 확인을 기다리는 결과 -->
      <UiCard v-else-if="!confirmed" class="space-y-3">
        <div class="flex items-start gap-3">
          <span v-if="!pending.canAnswer" class="w-10 h-10 rounded-full bg-surface-2 text-fg-muted flex items-center justify-center flex-shrink-0" aria-hidden="true">
            <UiIcon name="fas fa-hourglass-half" />
          </span>
          <div class="min-w-0">
            <p class="t-heading">{{ pending.title }}</p>
            <p class="t-caption mt-0.5">{{ pending.description }}</p>
          </div>
        </div>
        <UiButton v-if="pending.canAnswer" variant="ghost" block @click="showCounter = true">점수 고쳐 보내기</UiButton>
      </UiCard>

      <!-- 결과 화면 스크린샷 (다른 게임 안에서 한 경기, 9번). 누르면 크게 -->
      <a v-if="proofUrl" :href="proofUrl" target="_blank" rel="noopener" class="block">
        <p class="t-caption mb-2">결과 화면 스크린샷</p>
        <img :src="proofUrl" alt="결과 화면 스크린샷" class="w-full max-h-80 object-contain rounded-xl bg-surface-2" loading="lazy" />
      </a>

      <!-- 새 챔피언 -->
      <UiCard v-if="championUser" class="flex items-center gap-3">
        <!-- 내가 챔피언 자리를 차지한 순간은 매치가 신나게 (docs/mascots.md 이긴 순간). 남이 차지했으면 왕관만 -->
        <MatchMascot v-if="championUser.id === currentUserId" who="match" mood="cheer" :size="40" aria-hidden="true" />
        <span v-else class="w-10 h-10 rounded-full bg-signal-soft text-signal-fg flex items-center justify-center flex-shrink-0" aria-hidden="true">
          <UiIcon name="crown" />
        </span>
        <div class="min-w-0">
          <p class="t-heading">{{ championUser.id === currentUserId ? '새 챔피언이 됐어요' : `${championUser.nickname}님이 새 챔피언이에요` }}</p>
          <p class="t-caption mt-0.5">이 규칙의 챔피언 자리는 다음 승자에게 넘어가요</p>
        </div>
      </UiCard>

      <!-- 할 일(평가)이 먼저, 사진은 고를 사람만. 이미 평가한 경기는 묻지 않는다 -->
      <template v-if="canReview">
        <!-- 상대 평가 -->
        <UiSection :title="`${opponent.nickname || '상대'}님은 어땠나요?`">
          <UiCard class="space-y-5">
            <div v-for="row in reviewRows" :key="row.key">
              <p class="t-label mb-1">{{ row.label }}</p>
              <div class="flex items-center -ml-2" role="radiogroup" :aria-label="row.label">
                <button
                  v-for="n in 5"
                  :key="n"
                  type="button"
                  role="radio"
                  :aria-checked="row.value === n"
                  :aria-label="`${n}점`"
                  class="w-11 h-11 flex items-center justify-center text-2xl"
                  :class="n <= row.value ? 'text-primary' : 'text-line-strong'"
                  @click="row.set(n)"
                >
                  <UiIcon :name="n <= row.value ? 'fas fa-star' : 'far fa-star'" aria-hidden="true" />
                </button>
                <span v-if="row.value" class="t-caption ml-1">{{ row.value }}/5</span>
              </div>
            </div>
            <!-- 별 두 줄과 '또 만나고 싶나요'만 먼저. 한마디·규칙·사진은 남기고 싶은 사람만 (UX ④: 한 화면에 아홉 가지였다) -->
            <UiInput v-if="reviewMore" v-model="review.text" multiline :rows="3" label="한마디" optional placeholder="같이 해서 즐거웠던 점이나 아쉬웠던 점" />
            <!-- 기록에서 뽑은 사실 한 줄 (소식 이야기 줄). 누르면 한마디에 넣는다. 고르지 않아도 된다 -->
            <div v-if="reviewMore && beatChoices.length" class="-mt-2">
              <p class="t-micro mb-1.5">기록에서 한 줄 고르기</p>
              <div class="flex flex-wrap gap-2">
                <UiChip v-for="b in beatChoices" :key="b" :selected="review.text === b" @click="review.text = review.text === b ? '' : b">{{ b }}</UiChip>
              </div>
            </div>
            <!-- 또 만나고 싶나요? (만나서 한 경기만, 안전·신뢰 B). 상대에게 보이지 않고 신뢰 온도에만 -->
            <div v-if="game?.venue === 'IN_PERSON'">
              <p class="t-label mb-1">또 만나서 하고 싶나요? <span class="t-micro">상대에게 안 보여요</span></p>
              <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="또 만나서 하고 싶나요?">
                <UiChip :selected="review.meetAgain === true" @click="review.meetAgain = review.meetAgain === true ? null : true">네, 또 하고 싶어요</UiChip>
                <UiChip :selected="review.meetAgain === false" @click="review.meetAgain = review.meetAgain === false ? null : false">아니요</UiChip>
              </div>
            </div>
            <button v-if="!reviewMore" type="button" class="t-caption underline underline-offset-2" @click="reviewMore = true">더 남기기</button>
          </UiCard>
        </UiSection>

        <!-- 규칙 평가 -->
        <UiSection v-if="reviewMore" title="이 규칙은 어땠나요?">
          <UiCard class="space-y-4">
            <div class="flex items-center -ml-2" role="radiogroup" aria-label="규칙 평가">
              <button
                v-for="n in 5"
                :key="n"
                type="button"
                role="radio"
                :aria-checked="ruleRating === n"
                :aria-label="`${n}점`"
                class="w-11 h-11 flex items-center justify-center text-2xl"
                :class="n <= ruleRating ? 'text-primary' : 'text-line-strong'"
                @click="setRuleRating(n)"
              >
                <UiIcon :name="n <= ruleRating ? 'fas fa-star' : 'far fa-star'" aria-hidden="true" />
              </button>
              <span class="t-caption ml-1">{{ ruleRating ? `${ruleRating}/5` : '선택' }}</span>
            </div>
            <UiInput v-if="ruleRating" v-model="ruleReview" multiline :rows="2" label="규칙 의견" optional placeholder="고치면 좋을 점이 있나요?" />
          </UiCard>
        </UiSection>

        <!-- 사진·동영상 -->
        <UiSection v-if="reviewMore || allPictures.length" title="사진·영상">
          <template #action><span class="t-micro">{{ allPictures.length }}/5</span></template>

          <!-- 없을 때는 큰 빈 상자 대신 한 줄: 평가보다 앞서지 않게 -->
          <div v-if="allPictures.length === 0" class="flex gap-2">
            <UiButton variant="secondary" icon="fas fa-camera" class="flex-1" @click="openCamera">사진 추가</UiButton>
            <UiButton variant="secondary" icon="fas fa-video" class="flex-1" @click="openVideoRecorder">영상 추가</UiButton>
          </div>

          <div v-else class="space-y-4">
            <!-- 올릴 것 (끌어서 순서 바꾸기) -->
            <div v-if="selectedPictures.length">
              <p class="t-label mb-2">올릴 것 {{ selectedPictures.length }}개 <span class="t-micro">· 끌어서 순서 바꾸기</span></p>
              <div class="grid grid-cols-3 gap-2">
                <div
                  v-for="(pic, index) in selectedPictures"
                  :key="pic.id"
                  :data-index="index"
                  draggable="true"
                  class="relative aspect-square rounded-lg overflow-hidden bg-surface-2 ring-2 ring-primary"
                  :class="{ 'opacity-50': isDragging && (draggedIndex === index || touchStartIndex === index) }"
                  @dragstart="handleDragStart(index)"
                  @dragover.prevent="handleDragOver"
                  @drop="handleDrop(index)"
                  @dragend="handleDragEnd"
                  @touchstart="handleTouchStart(index)"
                  @touchmove.prevent="handleTouchMove($event)"
                  @touchend="handleTouchEnd(index)"
                >
                  <img v-if="pic.type === 'image'" :src="pic.dataUrl" alt="" class="w-full h-full object-cover pointer-events-none" />
                  <video v-else :src="pic.dataUrl" class="w-full h-full object-cover pointer-events-none" />
                  <span class="absolute top-1 left-1 min-w-6 h-6 px-1.5 rounded-full bg-primary text-primary-on text-xs font-bold flex items-center justify-center">{{ index + 1 }}</span>
                  <span v-if="pic.type === 'video'" class="absolute bottom-1 left-1 px-1.5 rounded bg-black/60 text-white text-xs">{{ formatDuration(pic.duration) }}</span>
                  <button
                    type="button"
                    class="absolute top-0 right-0 w-11 h-11 flex items-start justify-end p-1.5"
                    aria-label="올리지 않기"
                    @click.stop="deselectPicture(pic.id)"
                  >
                    <span class="w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center text-xs"><UiIcon name="fas fa-xmark" aria-hidden="true" /></span>
                  </button>
                </div>
              </div>
            </div>

            <!-- 찍은 것 -->
            <div v-if="unselectedPictures.length">
              <p class="t-label mb-2">{{ selectedPictures.length ? '찍은 것' : '올릴 사진을 눌러 고르세요' }}</p>
              <div class="grid grid-cols-3 gap-2">
                <div
                  v-for="pic in unselectedPictures"
                  :key="pic.id"
                  class="relative aspect-square rounded-lg overflow-hidden bg-surface-2"
                >
                  <button type="button" class="w-full h-full" :aria-label="pic.type === 'video' ? '동영상 고르기' : '사진 고르기'" @click="selectPicture(pic)">
                    <img v-if="pic.type === 'image'" :src="pic.dataUrl" alt="" class="w-full h-full object-cover" />
                    <video v-else :src="pic.dataUrl" class="w-full h-full object-cover" />
                  </button>
                  <span v-if="pic.type === 'video'" class="absolute bottom-1 left-1 px-1.5 rounded bg-black/60 text-white text-xs pointer-events-none">{{ formatDuration(pic.duration) }}</span>
                  <button
                    type="button"
                    class="absolute top-0 right-0 w-11 h-11 flex items-start justify-end p-1.5"
                    aria-label="삭제"
                    @click.stop="deletePicture(pic.id)"
                  >
                    <span class="w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center text-xs"><UiIcon name="fas fa-trash" aria-hidden="true" /></span>
                  </button>
                </div>
              </div>
            </div>

            <div v-if="allPictures.length < 5" class="flex gap-2">
              <UiButton variant="secondary" icon="fas fa-camera" class="flex-1" @click="openCamera">사진 추가</UiButton>
              <UiButton variant="secondary" icon="fas fa-video" class="flex-1" @click="openVideoRecorder">영상 추가</UiButton>
            </div>
          </div>
        </UiSection>

      </template>

      <!-- 관중이 찍은 장면: 선수·관중 모두 본다. 관중은 끝나고 하루 안까지 올린다 -->
      <!-- AI 주민의 경기에는 현장이 없다: 관중 사진을 받지 않는다 (docs/ai-residents.md 6, 사람이 찾아가지 않게) -->
      <LiveMediaStrip v-if="game?.venue === 'IN_PERSON' && !aiGame" :game-id="Number(gameId)" />

      <!-- 친구 (공유는 위 막대로 옮겼다) -->
      <div class="flex gap-2">
        <!-- 이미 친구면 숨기고, 보냈으면 '요청 보냄' (예전엔 친구 사이에도 늘 '친구 요청'이 보였다) -->
        <UiButton v-if="isParticipant && format === 'DUEL' && friendState && !friendState.isFriend" variant="secondary" icon="fas fa-user-plus" class="flex-1" :disabled="friendState.sent" @click="sendFriendRequest">{{ friendState.sent ? '요청 보냄' : friendState.received ? '친구 수락' : '친구 추가' }}</UiButton>
      </div>

    </template>
  </main>

  <!-- 하단 고정: 확인할 사람은 확인, 확정된 뒤에는 참가자만 평가 제출 -->
  <div v-if="pending.canAnswer && !isLoading" class="fixed bottom-0 inset-x-0 z-nav bg-canvas border-t border-line pb-safe">
    <div class="max-w-xl mx-auto px-4 py-3">
      <UiButton block size="lg" :loading="isAnswering === 'confirm'" @click="confirmResult">결과가 맞아요</UiButton>
    </div>
  </div>
  <!-- 평가 보내기는 별을 다 누른 순간 아래에서 올라온다. 그 전에는 꺼진 막대로 화면을 가리지 않는다 (11/3) -->
  <Transition name="ui-sheet">
    <div v-if="canReview && !isLoading && !resultError && review.manner && review.performance" class="fixed bottom-0 inset-x-0 z-nav bg-canvas border-t border-line pb-safe">
      <div class="max-w-xl mx-auto px-4 py-3">
        <UiButton block size="lg" :loading="isSubmitting" @click="submitReviewAndGoHome">평가 보내기</UiButton>
      </div>
    </div>
  </Transition>

  <!-- 돌려보내기: 내가 생각하는 점수를 낸다 -->
  <ResultEntrySheet
    v-model="showCounter"
    counter
    :game-id="gameId"
    :opponent-name="format === 'TEAMS' ? '상대 팀' : opponent.nickname"
    :initial="mySetScores"
    :format="format"
    :sides="resSides"
    :my-side="mySide"
    :my-name="format === 'TEAMS' ? '우리 팀' : '나'"
    :warning="rejectsLeft <= 1 ? '이번에 돌려보내면 결과가 끝내 맞지 않은 것으로 보고 이 경기는 기록하지 않아요' : ''"
    @submitted="onCountered"
  />

  <!-- 숨겨진 카메라·동영상 입력 -->
  <input ref="cameraInputRef" type="file" accept="image/*" capture="environment" class="hidden" @change="onCameraChange" />
  <input ref="videoInputRef" type="file" accept="video/*" capture="environment" class="hidden" @change="onVideoChange" />
  </div>
</template>


<script setup>
// 경기 결과: 누가 이겼나 → 사진 고르기 → 상대·규칙 평가 → 보내기. 평가는 경기에 뛴 사람에게만 보인다

import { ref, onMounted, onUnmounted, computed } from 'vue'
import { feel } from '../../utils/feel'
import { useRoute, useRouter } from 'vue-router'
import api from '../../api/api'
import { getMyId } from '@/utils/me'
import { GET, POST } from '../../api/client'
import { refreshOnChange } from '../../websocket/userChannel'
import { useActiveGamePolling } from '../../composable/useActiveGamePolling'
import { matchTime, who } from '../../utils/format'
import { TEAM_NAMES } from '../../utils/gameFormat'
import MatchMascot from '../../components/mascot/MatchMascot.vue'
import { NEXT_ROUND } from '@/utils/verdict'
import ResultEntrySheet from '../../components/game/ResultEntrySheet.vue'
import LiveMediaStrip from '../../components/live/LiveMediaStrip.vue'
import {
  UiAiBadge, UiAvatar, UiBadge, UiButton, UiCard, UiChip, UiEmptyState, UiIconButton, UiInput, UiSection, UiRollNumber, UiSkeleton, UiTopBar,
} from '../../components/ui'
import { confirmDialog } from '../../composables/useConfirm'
import { containsProfanity } from '../../utils/profanity'
import { copyText } from '../../utils/clipboard'
import { useToast } from '../../composable/useToast'
import {
  getGamePictures,
  removeGamePicture,
  addGamePicture,
  addGameVideo,
  compressImage,
  compressVideo,
} from '../../utils/gamePictureStorage'

const { showToast } = useToast()
const isSubmitting = ref(false)
const cameraInputRef = ref(null)
const videoInputRef = ref(null)

// 자동 제출 함수들
function setManner(n) {
  feel('select')
  review.value.manner = n
}
function setPerformance(n) {
  feel('select')
  review.value.performance = n
}
function setRuleRating(n) {
  feel('select')
  ruleRating.value = n
}

function submitReviewAndGoHome() {
  // 리뷰 제출 전 유효성 검사
  if (review.value.manner === 0 || review.value.performance === 0) {
    showToast('매너와 실력에 별을 눌러 주세요')
    return
  }
  if (containsProfanity(review.value.text) || containsProfanity(ruleReview.value)) {
    showToast('쓰면 안 되는 말이 들어 있어요. 고쳐서 다시 보내 주세요')
    return
  }

  // 바로 제출
  isSubmitting.value = true
  submitPictures()
    .then(() => {
      // 상대방 리뷰 제출
      // 화면이 "○○님은 어땠나요?"라고 묻는 그 사람을 평가한다 (팀·각자 경기는 서버가 대상을 꼭 받는다)
      return api.post(`/api/games/${gameId}/review`, { ...review.value, targetId: opponent.value.id })
    })
    .then(() => {
      // 규칙 평가 제출 (점수가 있을 때만)
      if (ruleRating.value > 0) {
        return api.post(`/api/rules/${game.value.rule.id}/rating`, {
          gameId: game.value.id,
          rating: ruleRating.value,
          comment: ruleReview.value || null,
        })
      }
      return Promise.resolve()
    })
    .then(() => {
      showToast('평가를 보냈어요')
      setTimeout(() => {
        goHome()
      }, 500)
    })
    .catch((error) => {
      isSubmitting.value = false
      console.error('제출 실패:', error)
      showToast(error.response?.data?.message || '보내지 못했어요. 잠시 뒤 다시 해 주세요')
    })
}

const route = useRoute()
const router = useRouter()
const gameId = route.params.gameId

const isLoading = ref(true)
const review = ref({ manner: 0, performance: 0, text: '', meetAgain: null })
// 소식 카드의 이야기 줄(feed_story beats) 중 셋. 남의 연승을 끊었다 같은 줄은 한마디로 쓰기 어색해 뺀다
const beatChoices = ref([])
async function loadBeats() {
  try {
    const { data } = await api.get(`/api/feed/game/${gameId}`)
    beatChoices.value = (data?.story?.beats || [])
      .filter((b) => b?.text && b.kind !== 'STREAK_STOP')
      .map((b) => b.text)
      .slice(0, 3)
  } catch {
    beatChoices.value = []
  }
}
const ruleRating = ref(0) // 규칙 평가 점수 (0~5)
const ruleReview = ref('') // 규칙 평가 의견
const game = ref({})
const user1 = ref({})
const user2 = ref({})
const totalSetCount = ref(0)
const setResults = ref([])
const drawCount = ref(0)
const user1SetCount = ref(0)
const user2SetCount = ref(0)
const startDate = ref('')
const winnerIdx = ref(0)
const currentUserId = ref(0)
const championIdx = ref(0)
const idxCorrect = ref(true)
// 상대 확인 전 결과 (확인 전에는 전적·레이팅·챔피언에 반영되지 않는다)
const confirmed = ref(true)
const resultSubmittedById = ref(null)
const autoConfirmAt = ref(null)
const isAnswering = ref('')
const rejectsLeft = ref(3)
const proofUrl = ref(null) // 결과 스크린샷 (9번)
const disputed = ref(false)
const showCounter = ref(false)
// 이 경기로 바뀐 내 실력 점수 { before, after } (확정 뒤 선수만)
const myRating = ref(null)
const ratingDelta = computed(() => (myRating.value ? myRating.value.after - myRating.value.before : 0))
// 평가는 아직 안 남긴 1:1 경기에서만 묻는다 (이미 낸 사람에게 다시 묻지 않게)
const { pendingReviewGameIds } = useActiveGamePolling()
const canReview = computed(() => isParticipant.value && confirmed.value && format.value === 'DUEL' && pendingReviewGameIds.value.includes(Number(gameId)))

// 사진 관련 상태
const allPictures = ref([])
const selectedPictures = ref([])
const draggedIndex = ref(null)
const touchStartIndex = ref(null)
const touchCurrentIndex = ref(null)
const isDragging = ref(false)

// 선택되지 않은 사진들
const unselectedPictures = computed(() => {
  const selectedIds = new Set(selectedPictures.value.map((p) => p.id))
  return allPictures.value.filter((p) => !selectedIds.has(p.id))
})

const resultError = ref('')
// 없는 경기(404)에 '끝나면 여기서 볼 수 있어요'는 맞지 않는다 (11/5 밤샘 C)
const resultMissing = ref(false)

// 화면 계산: user1이 나(참가자면), winnerIdx 1·2도 user1·user2 기준으로 맞춰져 있다
// 팀·각자 경기: 서버의 편(sides) 순서, 등수만 낸 결과인지
const format = ref('DUEL')
const resSides = ref([])
const placesEntered = ref(false)
// 참가자 투표 중이면 뽑은 사람 수와 내가 뽑은 사람
const peerVoting = ref(false)
const peerVotes = ref(0)
const myPeerVote = ref(null)
const voting = ref(null)
async function peerVote(targetId) {
  voting.value = targetId
  try {
    await POST('/api/games/{id}/result/peer-vote', { path: { id: Number(gameId) }, body: { targetId } })
    feel('success')
    await load()
  } catch (e) {
    showToast(e.response?.data?.message || '뽑지 못했어요')
  } finally {
    voting.value = null
  }
}
const mySide = computed(() => resSides.value.findIndex((s) => s.members.some((m) => m.id === currentUserId.value)))
const ranking = computed(() =>
  resSides.value.map((s) => ({ ...s.members[0], place: s.place, points: s.points })).sort((a, b) => a.place - b.place),
)
const submitterSide = computed(() => resSides.value.findIndex((s) => s.members.some((m) => m.id === resultSubmittedById.value)))

// AI 주민끼리 남긴 경기 (결과 생성기)
const aiGame = computed(() => [user1.value, user2.value].some((u) => u?.isBot) || resSides.value.some((s) => s.members.some((m) => m.isBot)))
const isParticipant = computed(() => !!currentUserId.value && (format.value === 'DUEL'
  ? user1.value.id === currentUserId.value || user2.value.id === currentUserId.value
  : mySide.value >= 0))
const opponent = computed(() => (user1.value.id === currentUserId.value ? user2.value : user1.value))
// newChampionIdx는 서버 기준 순서라 화면 순서로 바꾼다
const championUser = computed(() => {
  if (!championIdx.value) return null
  return (championIdx.value === 1) === idxCorrect.value ? user1.value : user2.value
})
// 이 칸이 나(팀 경기면 내 팀)인가. 팀 칸의 id는 그 팀 첫 사람이다
const isMine = (u) => (format.value === 'TEAMS'
  ? resSides.value.some((side) => side.members[0].id === u.id && side.members.some((m) => m.id === currentUserId.value))
  : u.id === currentUserId.value)
const sides = computed(() => [
  { user: user1.value, sets: user1SetCount.value, won: winnerIdx.value === 1, isMe: isMine(user1.value), champion: championUser.value?.id === user1.value.id },
  { user: user2.value, sets: user2SetCount.value, won: winnerIdx.value === 2, isMe: isMine(user2.value), champion: championUser.value?.id === user2.value.id },
])
const setLeft = (s) => (idxCorrect.value ? s.user1Score : s.user2Score)
const setRight = (s) => (idxCorrect.value ? s.user2Score : s.user1Score)
const bigScore = computed(() => setResults.value.length === 1
  ? { label: '점수', left: setLeft(setResults.value[0]), right: setRight(setResults.value[0]) }
  : { label: '세트', left: sides.value[0].sets, right: sides.value[1].sets })
const playedOn = computed(() =>
  // 한국어로 읽히게: 11월 3일 (올해가 아니면 연도도). 고정폭 숫자를 제목에 붙이지 않는다
  startDate.value ? (() => { const d = new Date(startDate.value); const y = d.getFullYear() !== new Date().getFullYear() ? `${d.getFullYear()}년 ` : ''; return `${y}${d.getMonth() + 1}월 ${d.getDate()}일` })() : '',
)
const headline = computed(() => {
  if (disputed.value) return { text: '기록하지 않은 경기', tone: 'text-fg-muted' }
  if (peerVoting.value) return { text: '투표하는 중', tone: 'text-fg' }
  if (format.value === 'FREE_FOR_ALL') {
    const first = ranking.value.filter((r) => r.place === 1)
    if (first.length === ranking.value.length) return { text: '모두 같은 등수', tone: 'text-fg' }
    if (!isParticipant.value) return { text: `${first.map((r) => who(r)).join('·')}님 1등`, tone: 'text-fg', mark: true }
    const me = ranking.value.find((r) => r.id === currentUserId.value)
    return me?.place === 1 ? { text: '1등이에요', tone: 'text-fg', mark: true } : { text: `${me?.place}등`, tone: 'text-fg', line: '1등은 다음 판에서 가려요' }
  }
  if (winnerIdx.value === 0) return { text: '비겼어요', tone: 'text-fg', line: NEXT_ROUND.DRAW }
  const winner = winnerIdx.value === 1 ? user1.value : user2.value
  if (!isParticipant.value) return { text: `${format.value === 'TEAMS' ? winner.nickname : who(winner)}${format.value === 'TEAMS' ? '' : '님'} 승리`, tone: 'text-fg', mark: true }
  // 진 쪽도 회색으로 깎지 않는다. 같은 크기의 말로 다음 판을 권한다 (essence: 지면 낙오가 아니라 다음 판)
  return isMine(winner) ? { text: '이겼어요', tone: 'text-fg', mark: true } : { text: '졌어요', tone: 'text-fg', line: NEXT_ROUND.LOSE }
})
const pending = computed(() => {
  if (confirmed.value || disputed.value) return { canAnswer: false }
  // 참가자 투표는 위의 뽑기가 확인이다
  if (peerVoting.value) return { canAnswer: false, title: '투표로 정하는 중이에요', description: '함께 한 사람들이 모두 뽑으면 바로 기록돼요' }
  const submitter = resSides.value.flatMap((s) => s.members).find((u) => u.id === resultSubmittedById.value)
    || [user1.value, user2.value].find((u) => u.id === resultSubmittedById.value)
  const at = autoConfirmAt.value ? `${matchTime(autoConfirmAt.value)}에` : '24시간 뒤에'
  if (!isParticipant.value) return { canAnswer: false, title: '확인 중인 결과예요', description: '두 선수가 확인하면 기록돼요' }
  // 팀 경기는 상대 팀이, 각자 경기는 낸 사람 말고 누구든 확인한다
  const waitingFor = format.value === 'TEAMS' ? '상대 팀' : format.value === 'FREE_FOR_ALL' ? '다른 사람' : `${opponent.value.nickname}님`
  const sameTeam = format.value === 'TEAMS' && mySide.value === submitterSide.value
  if (resultSubmittedById.value === currentUserId.value || sameTeam) {
    return { canAnswer: false, title: `${waitingFor}의 확인을 기다려요`, description: `답이 없으면 ${at} 확정돼요` }
  }
  return {
    canAnswer: true,
    title: `${submitter?.nickname || '상대'}님이 ${rejectsLeft.value < 3 ? '고쳐 보낸' : '낸'} 결과예요. 맞나요?`,
    description: `답이 없으면 ${at} 그대로 확정돼요` + (rejectsLeft.value <= 1 ? '. 한 번 더 돌려보내면 기록하지 않아요' : ''),
  }
})

async function confirmResult() {
  isAnswering.value = 'confirm'
  try {
    await POST('/api/games/{id}/result/confirm', { path: { id: Number(gameId) } })
    feel('success')
    // 확인 칸이 사라지기만 하면 눌렸는지 모른다 (웹은 진동도 없다)
    showToast('확정했어요. 전적과 실력 점수에 반영돼요')
    await load()
  } catch (e) {
    showToast(e.response?.data?.message || '확인하지 못했어요. 다시 해 주세요')
  } finally {
    isAnswering.value = ''
  }
}

// 지금 결과를 내 쪽에서 본 세트 점수 [내 점수, 상대 점수]. 돌려보내기 칸의 처음 값
const mySetScores = computed(() => setResults.value.map((s) => (sides.value[0].isMe ? [setLeft(s), setRight(s)] : [setRight(s), setLeft(s)])))

async function onCountered() {
  feel('success')
  await load()
  const by = format.value === 'TEAMS' ? '상대 팀이' : format.value === 'FREE_FOR_ALL' ? '다른 사람이' : `${opponent.value.nickname}님이`
  showToast(disputed.value ? '결과가 맞지 않아 이 경기는 기록하지 않아요' : `고친 결과를 보냈어요. ${by} 확인해요`)
}

const reviewMore = ref(false)
const reviewRows = computed(() => [
  { key: 'manner', label: '매너', value: review.value.manner, set: setManner },
  { key: 'performance', label: '실력', value: review.value.performance, set: setPerformance },
])

async function load() {
  try {
    currentUserId.value = await getMyId()

    const res = await api.get(`/api/games/${gameId}/result`)
    confirmed.value = res.data.confirmed !== false
    resultSubmittedById.value = res.data.resultSubmittedById
    autoConfirmAt.value = res.data.autoConfirmAt
    proofUrl.value = res.data.resultProofUrl || null
    rejectsLeft.value = res.data.rejectsLeft ?? 3
    disputed.value = !!res.data.disputed
    myRating.value = res.data.myRating ?? null
    game.value = res.data.gameSummary
    startDate.value = res.data.startDate
    setResults.value = res.data.setResults
    totalSetCount.value = res.data.totalSetCount
    drawCount.value = res.data.drawCount
    winnerIdx.value = res.data.winnerIdx
    championIdx.value = res.data.newChampionIdx
    format.value = res.data.format || 'DUEL'
    resSides.value = res.data.sides || []
    placesEntered.value = !!res.data.placesEntered
    peerVoting.value = !!res.data.peerVoting
    peerVotes.value = res.data.peerVotes ?? 0
    myPeerVote.value = res.data.myPeerVoteTargetId ?? null
    // 팀 경기: 두 팀을 두 사람처럼 보인다 (이름은 팀 이름과 팀원, 누르면 첫 사람 프로필)
    if (format.value === 'TEAMS' && resSides.value.length === 2) {
      const asUser = (side) => ({ ...side.members[0], nickname: `${TEAM_NAMES[side.key] || '팀'} · ${side.members.map((m) => m.nickname).join('·')}` })
      res.data.user1 = asUser(resSides.value[0])
      res.data.user2 = asUser(resSides.value[1])
    }
    // 내가 user2(팀 경기는 내 팀이 둘째 편)일 때만 순서를 뒤집어 나를 왼쪽에 둔다 (구경하는 사람은 서버 순서 그대로)
    idxCorrect.value = format.value === 'TEAMS' ? mySide.value !== 1 : res.data.user2.id !== currentUserId.value

    if (idxCorrect.value) {
      user1.value = res.data.user1
      user2.value = res.data.user2
      user1SetCount.value = res.data.user1SetCount
      user2SetCount.value = res.data.user2SetCount
    } else {
      user1.value = res.data.user2
      user2.value = res.data.user1
      user1SetCount.value = res.data.user2SetCount
      user2SetCount.value = res.data.user1SetCount
      winnerIdx.value = res.data.winnerIdx === 2 ? 1 : res.data.winnerIdx === 1 ? 2 : 0
    }

    feelResult()
    if (isParticipant.value) loadFriendState()
    // 저장된 사진 불러오기
    allPictures.value = await getGamePictures(gameId)
  } catch (err) {
    resultError.value = err.response?.data?.message || '결과를 불러오지 못했어요'
    resultMissing.value = err.response?.status === 404
  } finally {
    isLoading.value = false
  }
}

// 결과가 확정된 걸 처음 보는 순간 한 번만: 이기면 짧은 화음, 지면 부드럽게 내려가는 소리 (같은 화면을 다시 열면 조용히)
function feelResult() {
  if (!isParticipant.value || !confirmed.value || disputed.value || peerVoting.value) return
  const key = `felt_result_${gameId}`
  try {
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
  } catch {
    // 저장소를 못 쓰면 매번 난다
  }
  feel(headline.value.mark ? 'win' : headline.value.line ? 'lose' : 'success')
}

// 증인 수 (만나서 한 경기만. 앱 게임·볼 수 없는 경기는 조용히 0)
const witnesses = ref(0)
async function loadWitnesses() {
  witnesses.value = (await GET('/api/games/{gameId}/live', { path: { gameId: Number(gameId) } }).catch(() => ({ data: null }))).data?.witnesses ?? 0
}

let stopWatching = null
onMounted(() => {
  // 소식 카드(이야기 줄)는 확정된 경기에만 있다. 확인 전에 부르면 404가 났다
  const withBeats = () => load().then(() => confirmed.value && loadBeats())
  withBeats()
  loadWitnesses()
  // 확인을 기다리는 동안 상대가 확인하거나 돌려보내면 다시 불러온다
  stopWatching = refreshOnChange(() => {
    if (!confirmed.value) withBeats()
  })
})
onUnmounted(() => stopWatching?.())

// 카메라 열기
const openCamera = () => {
  if (allPictures.value.length >= 5) {
    showToast('사진·동영상은 5개까지 남길 수 있어요')
    return
  }
  cameraInputRef.value?.click()
}

// 동영상 촬영기 열기
const openVideoRecorder = () => {
  if (allPictures.value.length >= 5) {
    showToast('사진·동영상은 5개까지 남길 수 있어요')
    return
  }
  videoInputRef.value?.click()
}

// 카메라 파일 선택 완료
const onCameraChange = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return

  if (allPictures.value.length >= 5) {
    showToast('사진·동영상은 5개까지 남길 수 있어요')
    e.target.value = ''
    return
  }

  const reader = new FileReader()

  reader.onload = async (event) => {
    try {
      const dataUrl = event.target.result

      // 이미지 압축 (기본값 사용: 1200px, quality 0.6)
      const compressed = await compressImage(dataUrl)

      // IndexedDB에 저장
      await addGamePicture(gameId, compressed)

      // 목록 갱신
      allPictures.value = await getGamePictures(gameId)

      showToast('사진을 저장했어요')
    } catch (error) {
      console.error('사진 저장 실패:', error)
      if (error.message === 'QUOTA_EXCEEDED') {
        showToast('폰 저장 공간이 모자라요. 사진 몇 장을 지우고 다시 해 주세요')
      } else {
        showToast('사진을 저장하지 못했어요')
      }
    }
  }

  reader.onerror = () => {
    console.error('파일 읽기 실패')
    showToast('사진을 저장하지 못했어요')
  }

  reader.readAsDataURL(file)

  // input 초기화
  e.target.value = ''
}

// 동영상 파일 선택 완료
const onVideoChange = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return

  if (allPictures.value.length >= 5) {
    showToast('사진·동영상은 5개까지 남길 수 있어요')
    e.target.value = ''
    return
  }

  showToast('동영상을 저장하는 중이에요')

  try {
    // 동영상 압축 (최대 2분)
    const { dataUrl, duration } = await compressVideo(file, 120)

    // IndexedDB에 저장
    await addGameVideo(gameId, dataUrl, duration)

    // 목록 갱신
    allPictures.value = await getGamePictures(gameId)

    showToast(`동영상을 저장했어요 (${Math.floor(duration)}초)`)
  } catch (error) {
    console.error('동영상 저장 실패:', error)
    if (error.message === 'QUOTA_EXCEEDED') {
      showToast('폰 저장 공간이 모자라요. 사진·영상 몇 개를 지우고 다시 해 주세요')
    } else {
      showToast('동영상을 저장하지 못했어요')
    }
  }

  // input 초기화
  e.target.value = ''
}

// 동영상 길이 포맷팅 (초 -> mm:ss)
const formatDuration = (seconds) => {
  if (!seconds) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 사진 선택
const selectPicture = (pic) => {
  if (selectedPictures.value.length >= 5) {
    showToast('5개까지 고를 수 있어요')
    return
  }
  selectedPictures.value.push(pic)
}

// 사진 선택 해제
const deselectPicture = (picId) => {
  selectedPictures.value = selectedPictures.value.filter((p) => p.id !== picId)
}

// 사진 삭제 (기기에만 있던 것이라 되돌릴 수 없다)
const deletePicture = async (picId) => {
  const ok = await confirmDialog({ title: '삭제할까요?', message: '지우면 되돌릴 수 없어요', confirmText: '삭제', danger: true })
  if (!ok) return
  allPictures.value = await removeGamePicture(gameId, picId)
  selectedPictures.value = selectedPictures.value.filter((p) => p.id !== picId)
}

// 드래그 시작 (마우스)
const handleDragStart = (index) => {
  draggedIndex.value = index
  isDragging.value = true
}

// 드래그 오버
const handleDragOver = (e) => {
  e.preventDefault()
}

// 드래그 종료
const handleDragEnd = () => {
  isDragging.value = false
  draggedIndex.value = null
}

// 드롭 (마우스)
const handleDrop = (dropIndex) => {
  if (draggedIndex.value === null) return

  const draggedItem = selectedPictures.value[draggedIndex.value]
  selectedPictures.value.splice(draggedIndex.value, 1)
  selectedPictures.value.splice(dropIndex, 0, draggedItem)

  isDragging.value = false
  draggedIndex.value = null
}

// 터치 드래그 시작
const handleTouchStart = (index) => {
  touchStartIndex.value = index
  isDragging.value = true
}

// 터치 드래그 중
const handleTouchMove = (e) => {
  if (touchStartIndex.value === null) return

  const touch = e.touches[0]
  const elementAtPoint = document.elementFromPoint(touch.clientX, touch.clientY)

  if (elementAtPoint) {
    const closestItem = elementAtPoint.closest('[data-index]')
    if (closestItem) {
      const newIndex = parseInt(closestItem.getAttribute('data-index'))
      touchCurrentIndex.value = newIndex
    }
  }
}

// 터치 드래그 종료
const handleTouchEnd = (dropIndex) => {
  if (touchStartIndex.value === null) return

  const targetIndex = touchCurrentIndex.value !== null ? touchCurrentIndex.value : dropIndex

  if (touchStartIndex.value !== targetIndex) {
    const draggedItem = selectedPictures.value[touchStartIndex.value]
    selectedPictures.value.splice(touchStartIndex.value, 1)
    selectedPictures.value.splice(targetIndex, 0, draggedItem)
  }

  isDragging.value = false
  touchStartIndex.value = null
  touchCurrentIndex.value = null
}

// 사진/동영상 제출
const submitPictures = async () => {
  if (selectedPictures.value.length === 0) {
    return Promise.resolve()
  }

  try {
    const formData = new FormData()

    selectedPictures.value.forEach((pic, index) => {
      if (pic.type === 'image') {
        const file = dataUrlToFile(pic.dataUrl, `game_${gameId}_${index}.jpg`)
        formData.append('pictures', file)
      } else if (pic.type === 'video') {
        const file = dataUrlToFile(pic.dataUrl, `game_${gameId}_${index}.webm`)
        formData.append('videos', file)
      }
    })

    await api.post(`/api/games/${gameId}/pictures`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return Promise.resolve()
  } catch (err) {
    console.error('미디어 제출 실패:', err)
    return Promise.reject(err)
  }
}

// base64를 File 객체로 변환
const dataUrlToFile = (dataUrl, filename) => {
  const arr = dataUrl.split(',')
  const mime = arr[0].match(/:(.*?);/)[1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new File([u8arr], filename, { type: mime })
}

const goHome = () => router.push(`/profile/0?id=${gameId}`)

// 친구 요청
const friendState = ref(null)
const opponentId = () => (user1.value?.id === currentUserId.value ? user2.value?.id : user1.value?.id)
async function loadFriendState() {
  if (format.value !== 'DUEL' || !opponentId()) return
  friendState.value = (await api.get(`/api/friends/status/${opponentId()}`).catch(() => null))?.data ?? null
}
async function sendFriendRequest() {
  const received = friendState.value?.received
  try {
    // 상대가 먼저 보냈으면 받는다
    await api.post(received ? `/api/friends/accept/${opponentId()}` : `/api/friends/request/${opponentId()}`)
    showToast(received ? '친구가 됐어요' : '친구 요청을 보냈어요')
    friendState.value = { ...friendState.value, sent: !received, isFriend: !!received }
  } catch (e) {
    showToast(e?.response?.data?.message || '친구 요청을 보내지 못했어요')
  }
}

// 경기 공유
async function onShare() {
  try {
    const res = await api.post('/api/invite', null, { params: { gameId: `${gameId}` } })
    const url = res.data.url
    const opponentName = who(user1.value.id === currentUserId.value ? user2.value : user1.value)
    const text = `${opponentName}님과의 경기 결과 – Match`

    if (navigator.share) {
      await navigator.share({ title: 'Match', text, url })
    } else {
      showToast((await copyText(url)) ? '링크를 복사했어요' : '복사하지 못했어요')
    }
  } catch (e) {
    if (e?.name !== 'AbortError' && e?.message !== 'Share canceled') showToast('링크를 만들지 못했어요')
  }
}
</script>

<style>
.win-bounce { animation: win-bounce 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both; }
@keyframes win-bounce {
  0% { transform: translateY(16px) scale(0.6); opacity: 0; }
  60% { transform: translateY(-6px) scale(1.08); opacity: 1; }
  100% { transform: translateY(0) scale(1); }
}
@media (prefers-reduced-motion: reduce) { .win-bounce { animation: none; } }
</style>
