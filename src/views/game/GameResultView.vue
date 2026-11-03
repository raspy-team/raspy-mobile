<template>
  <div>
  <UiTopBar title="경기 결과" back="/game" />

  <!-- 결과를 보여줄 수 없을 때 (아직 안 끝난 경기 등) -->
  <main v-if="!isLoading && resultError" class="px-4 pt-4 max-w-xl mx-auto">
    <UiEmptyState icon="fas fa-flag-checkered" :title="resultError" description="경기가 끝나면 여기서 결과를 볼 수 있어요">
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
        <span v-if="headline.mark && isParticipant" class="block w-fit mx-auto mb-4 text-fg win-bounce"><BrandFace :size="48" /></span>
        <!-- 진 순간에도 같은 얼굴이 곁에 있다. 표정만 담담하게 (11/3, essence: 진 판도 기록, 다음 판) -->
        <span v-else-if="headline.line && isParticipant" class="block w-fit mx-auto mb-4 text-fg"><BrandFace :size="48" mood="neutral" /></span>
        <p class="text-center t-caption">{{ game.rule?.ruleTitle }}<template v-if="playedOn"> · {{ playedOn }}</template></p>
        <h1 class="t-display text-center mt-3" :class="headline.tone"><span :class="headline.mark ? 'hl hl-draw' : ''">{{ headline.text }}</span></h1>
        <!-- 이 경기로 바뀐 내 실력 점수: 이긴 사람이 가장 먼저 궁금한 숫자라 결과 바로 밑에 -->
        <p v-if="myRating && confirmed" class="mt-3 flex items-baseline justify-center gap-2" :aria-label="`실력 점수 ${myRating.before}에서 ${myRating.after}로`">
          <span class="t-caption">실력 점수</span>
          <span class="t-heading tabular-nums">{{ myRating.before }} → {{ myRating.after }}</span>
          <span class="t-label tabular-nums" :class="ratingDelta > 0 ? 'text-signal-fg' : ''">{{ ratingDelta > 0 ? `+${ratingDelta}` : ratingDelta }}</span>
        </p>
        <!-- 첫 몇 판은 점수가 크게 움직인다. 숫자만 보여 주면 이긴 쪽은 착각하고 진 쪽은 상처받는다 -->
        <p v-if="myRating && confirmed && myRating.provisional" class="t-caption text-center mt-1">처음 몇 판은 크게 움직여요. 더 하면 자리를 잡아요</p>
        <!-- 다음 판: 이기든 지든 같은 규칙으로 바로 -->
        <template v-if="isParticipant && confirmed && !disputed && !peerVoting">
          <p v-if="headline.line" class="t-body text-center mt-4">{{ headline.line }}</p>
          <div class="flex justify-center mt-4">
            <UiButton size="sm" variant="tonal" icon="rotate-right" :to="`/create-game?ruleId=${game.rule?.id}`">{{ headline.mark ? '한 판 더' : '다시 한 판' }}</UiButton>
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
              <span class="text-sm truncate" :class="r.place === 1 ? 'text-fg font-medium' : 'text-fg-muted'">{{ r.nickname }}<span v-if="r.id === currentUserId" class="text-fg-subtle"> (나)</span></span>
            </button>
            <span v-if="!placesEntered" class="font-mono tabular-nums text-fg-muted">{{ r.points }}</span>
          </li>
        </ol>

        <template v-else>
        <div class="mt-10 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
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
              {{ side.user.nickname }}<span v-if="side.isMe" class="text-fg-subtle"> (나)</span>
            </span>
          </button>
          <!-- 세트 점수 없이 결과만 남긴 경기는 숫자 대신 vs -->
          <p v-if="setResults.length" class="order-2 text-[4rem] font-semibold leading-none tracking-[-0.05em] tabular-nums" :aria-label="`세트 ${sides[0].sets} 대 ${sides[1].sets}`">
            <UiRollNumber :value="sides[0].sets" :class="sides[0].won || !winnerIdx ? 'text-fg' : 'text-fg-subtle'" /><span class="text-fg-subtle mx-1.5">:</span><UiRollNumber :value="sides[1].sets" :delay="140" :class="sides[1].won || !winnerIdx ? 'text-fg' : 'text-fg-subtle'" />
          </p>
          <p v-else class="order-2 t-mono">vs</p>
        </div>

        <!-- 세트별 점수: 표로 -->
        <!-- 세트 점수: 상자 없이 줄만 -->
        <div v-if="setResults.length" class="mt-10 border-y border-line divide-y divide-line">
          <div class="grid grid-cols-[3rem_1fr_auto_1fr] items-center px-1 h-10 t-micro">
            <span>세트</span>
            <span class="text-right truncate">{{ sides[0].user.nickname }}</span>
            <span class="w-6"></span>
            <span class="truncate">{{ sides[1].user.nickname }}</span>
          </div>
          <div v-for="s in setResults" :key="s.setIdx" class="grid grid-cols-[3rem_1fr_auto_1fr] items-center px-1 h-12 tabular-nums">
            <span class="text-fg-subtle text-sm">{{ s.setIdx }}</span>
            <span class="text-right text-lg" :class="setLeft(s) >= setRight(s) ? 'text-fg' : 'text-fg-subtle'">{{ setLeft(s) }}</span>
            <span class="w-6 text-center text-fg-subtle">:</span>
            <span class="text-lg" :class="setRight(s) >= setLeft(s) ? 'text-fg' : 'text-fg-subtle'">{{ setRight(s) }}</span>
          </div>
        </div>
        <p v-else class="t-caption text-center mt-6">세트 점수 없이 승패만 기록한 경기예요</p>
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
          <span class="w-10 h-10 rounded-full bg-surface-2 text-fg-muted flex items-center justify-center flex-shrink-0" aria-hidden="true">
            <UiIcon name="fas fa-hourglass-half" />
          </span>
          <div class="min-w-0">
            <p class="t-heading">{{ pending.title }}</p>
            <p class="t-caption mt-0.5">{{ pending.description }}</p>
          </div>
        </div>
        <UiButton v-if="pending.canAnswer" variant="ghost" block @click="showCounter = true">점수 고쳐 보내기</UiButton>
      </UiCard>

      <!-- 새 챔피언 -->
      <UiCard v-if="championUser" class="flex items-center gap-3">
        <span class="w-10 h-10 rounded-full bg-signal-soft text-signal-fg flex items-center justify-center flex-shrink-0" aria-hidden="true">
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
            <UiInput v-model="review.text" multiline :rows="3" label="한마디" optional placeholder="같이 해서 즐거웠던 점이나 아쉬웠던 점" />
          </UiCard>
        </UiSection>

        <!-- 규칙 평가 -->
        <UiSection title="이 규칙은 어땠나요?">
          <UiCard class="space-y-4">
            <p class="t-caption">재미있고, 알기 쉽고, 공평했나요? 다음 사람이 규칙을 고를 때 참고해요.</p>
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
        <UiSection title="사진·영상 (선택)">
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
              <UiButton variant="secondary" icon="fas fa-video" class="flex-1" @click="openVideoRecorder">동영상 추가</UiButton>
            </div>
          </div>
        </UiSection>

      </template>

      <!-- 친구 · 공유 (덜 급한 것은 맨 아래) -->
      <div class="flex gap-2">
        <UiButton v-if="isParticipant && format === 'DUEL'" variant="secondary" icon="fas fa-user-plus" class="flex-1" @click="sendFriendRequest">친구 요청</UiButton>
        <UiButton variant="secondary" icon="share" class="flex-1" @click="onShare">공유하기</UiButton>
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
import { haptic } from '../../utils/haptics'
import { useRoute, useRouter } from 'vue-router'
import api from '../../api/api'
import { getMyId } from '@/utils/me'
import { POST } from '../../api/client'
import { refreshOnChange } from '../../websocket/userChannel'
import { useActiveGamePolling } from '../../composable/useActiveGamePolling'
import { matchTime } from '../../utils/format'
import { TEAM_NAMES } from '../../utils/gameFormat'
import BrandFace from '../../components/BrandFace.vue'
import { NEXT_ROUND } from '@/utils/verdict'
import ResultEntrySheet from '../../components/game/ResultEntrySheet.vue'
import {
  UiAvatar, UiBadge, UiButton, UiCard, UiEmptyState, UiInput, UiSection, UiRollNumber, UiSkeleton, UiTopBar,
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
  review.value.manner = n
}
function setPerformance(n) {
  review.value.performance = n
}
function setRuleRating(n) {
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
const review = ref({ manner: 0, performance: 0, text: '' })
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
    haptic('success')
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
    if (!isParticipant.value) return { text: `${first.map((r) => r.nickname).join('·')}님 1등`, tone: 'text-fg', mark: true }
    const me = ranking.value.find((r) => r.id === currentUserId.value)
    return me?.place === 1 ? { text: '1등이에요', tone: 'text-fg', mark: true } : { text: `${me?.place}등`, tone: 'text-fg', line: '1등은 다음 판에서 가려요' }
  }
  if (winnerIdx.value === 0) return { text: '비겼어요', tone: 'text-fg', line: NEXT_ROUND.DRAW }
  const winner = winnerIdx.value === 1 ? user1.value : user2.value
  if (!isParticipant.value) return { text: `${winner.nickname}${format.value === 'TEAMS' ? '' : '님'} 승리`, tone: 'text-fg', mark: true }
  // 진 쪽도 회색으로 깎지 않는다. 같은 크기의 말로 다음 판을 권한다 (essence: 지면 낙오가 아니라 다음 판)
  return isMine(winner) ? { text: '이겼어요', tone: 'text-fg', mark: true } : { text: '졌어요', tone: 'text-fg', line: NEXT_ROUND.LOSE }
})
const pending = computed(() => {
  if (confirmed.value || disputed.value) return { canAnswer: false }
  // 참가자 투표는 위의 뽑기가 확인이다
  if (peerVoting.value) return { canAnswer: false, title: '투표로 정하는 중이에요', description: '함께 한 사람들이 모두 뽑으면 바로 기록돼요' }
  const submitter = resSides.value.flatMap((s) => s.members).find((u) => u.id === resultSubmittedById.value)
    || [user1.value, user2.value].find((u) => u.id === resultSubmittedById.value)
  const until = autoConfirmAt.value ? `${matchTime(autoConfirmAt.value)}까지` : '24시간 안에'
  if (!isParticipant.value) return { canAnswer: false, title: '확인 중인 결과예요', description: '두 선수가 확인하면 기록돼요' }
  // 팀 경기는 상대 팀이, 각자 경기는 낸 사람 말고 누구든 확인한다
  const waitingFor = format.value === 'TEAMS' ? '상대 팀' : format.value === 'FREE_FOR_ALL' ? '다른 사람' : `${opponent.value.nickname}님`
  const sameTeam = format.value === 'TEAMS' && mySide.value === submitterSide.value
  if (resultSubmittedById.value === currentUserId.value || sameTeam) {
    return { canAnswer: false, title: `${waitingFor}의 확인을 기다려요`, description: `확인하면 전적과 실력 점수에 반영돼요. ${until} 답이 없으면 그대로 확정돼요` }
  }
  return {
    canAnswer: true,
    title: `${submitter?.nickname || '상대'}님이 ${rejectsLeft.value < 3 ? '고쳐 보낸' : '낸'} 결과예요. 맞나요?`,
    description: `맞으면 전적과 실력 점수에 반영돼요. ${until} 확인하지 않으면 그대로 확정돼요` + (rejectsLeft.value <= 1 ? '. 한 번 더 돌려보내면 이 경기는 기록하지 않아요' : ''),
  }
})

async function confirmResult() {
  isAnswering.value = 'confirm'
  try {
    await POST('/api/games/{id}/result/confirm', { path: { id: Number(gameId) } })
    haptic('success')
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
  haptic('success')
  await load()
  const who = format.value === 'TEAMS' ? '상대 팀이' : format.value === 'FREE_FOR_ALL' ? '다른 사람이' : `${opponent.value.nickname}님이`
  showToast(disputed.value ? '결과가 맞지 않아 이 경기는 기록하지 않아요' : `고친 결과를 보냈어요. ${who} 확인해요`)
}

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

    // 저장된 사진 불러오기
    allPictures.value = await getGamePictures(gameId)
  } catch (err) {
    resultError.value = err.response?.data?.message || '결과를 불러오지 못했어요'
  } finally {
    isLoading.value = false
  }
}

let stopWatching = null
onMounted(() => {
  load()
  // 확인을 기다리는 동안 상대가 확인하거나 돌려보내면 다시 불러온다
  stopWatching = refreshOnChange(() => {
    if (!confirmed.value) load()
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
async function sendFriendRequest() {
  try {
    const opponentId = user1.value.id === currentUserId.value ? user2.value.id : user1.value.id
    await api.post(`/api/friends/request/${opponentId}`)
    showToast('친구 요청을 보냈어요')
  } catch (e) {
    if (e?.response?.data?.message) showToast(e.response.data.message)
    else showToast('이미 요청했거나 친구 상태입니다.')
  }
}

// 경기 공유
async function onShare() {
  try {
    const res = await api.post('/api/invite', null, { params: { gameId: `${gameId}` } })
    const url = res.data.url
    const opponentName =
      user1.value.id === currentUserId.value ? user2.value.nickname : user1.value.nickname
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
