<template>
  <div>
  <UiTopBar title="경기 결과" back="/game" />

  <!-- 결과를 보여줄 수 없을 때 (아직 안 끝난 경기 등) -->
  <main v-if="!isLoading && resultError" class="px-4 pt-4 max-w-xl mx-auto">
    <UiEmptyState icon="fas fa-flag-checkered" :title="resultError" description="경기가 끝나면 여기서 결과를 볼 수 있어요">
      <UiButton to="/game">내 경기로</UiButton>
    </UiEmptyState>
  </main>

  <main v-else class="px-4 pt-4 max-w-xl mx-auto space-y-8" :class="isParticipant && (confirmed || pending.canAnswer) ? 'pb-32' : 'pb-12'">
    <!-- 불러오는 중 -->
    <div v-if="isLoading" class="space-y-4 pt-6">
      <UiSkeleton class="h-8 w-1/2 mx-auto" />
      <UiSkeleton class="h-40 w-full" />
    </div>

    <template v-else>
      <!-- 결과 한 줄 + 점수판 -->
      <section class="text-center">
        <p class="t-caption">{{ game.rule?.ruleTitle }}</p>
        <h1 class="t-display mt-1" :class="headline.tone">{{ headline.text }}</h1>

        <div class="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <button
            v-for="(side, i) in sides"
            :key="side.user.id || i"
            type="button"
            class="flex flex-col items-center gap-2 min-w-0"
            :class="i === 1 ? 'order-3' : 'order-1'"
            @click="router.push('/profile/' + side.user.id)"
          >
            <span class="relative">
              <UiAvatar :src="side.user.profileUrl" :name="side.user.nickname" size="lg" />
              <span
                v-if="side.champion"
                class="absolute -top-2 -right-1 w-6 h-6 rounded-full bg-primary text-primary-fg flex items-center justify-center text-xs"
                aria-label="새 챔피언"
              >
                <i class="fas fa-crown" aria-hidden="true"></i>
              </span>
            </span>
            <span class="text-sm text-fg truncate max-w-full">{{ side.user.nickname }}<span v-if="side.isMe" class="text-fg-subtle"> (나)</span></span>
            <span class="text-6xl font-bold tabular-nums leading-none" :class="side.won ? 'text-fg' : 'text-fg-subtle'">{{ side.sets }}</span>
          </button>
          <span class="order-2 t-micro px-2 self-end pb-3">세트</span>
        </div>

        <!-- 세트별 점수 -->
        <div v-if="setResults.length" class="mt-6 flex flex-wrap justify-center gap-2">
          <span
            v-for="s in setResults"
            :key="s.setIdx"
            class="px-3 h-8 rounded-lg bg-surface-2 text-sm text-fg-muted flex items-center tabular-nums"
          >
            {{ s.setIdx }}세트 {{ idxCorrect ? s.user1Score : s.user2Score }}:{{ idxCorrect ? s.user2Score : s.user1Score }}
          </span>
        </div>
      </section>

      <!-- 상대 확인을 기다리는 결과 -->
      <UiCard v-if="!confirmed" class="space-y-3">
        <div class="flex items-start gap-3">
          <span class="w-10 h-10 rounded-full bg-surface-2 text-fg-muted flex items-center justify-center flex-shrink-0" aria-hidden="true">
            <i class="fas fa-hourglass-half"></i>
          </span>
          <div class="min-w-0">
            <p class="t-heading">{{ pending.title }}</p>
            <p class="t-caption mt-0.5">{{ pending.description }}</p>
          </div>
        </div>
        <UiButton v-if="pending.canAnswer" variant="ghost" block :loading="isAnswering === 'reject'" @click="rejectResult">점수가 달라요, 다시 맞출게요</UiButton>
      </UiCard>

      <!-- 새 챔피언 -->
      <UiCard v-if="championUser" class="flex items-center gap-3">
        <span class="w-10 h-10 rounded-full bg-primary-soft text-primary flex items-center justify-center flex-shrink-0" aria-hidden="true">
          <i class="fas fa-crown"></i>
        </span>
        <div class="min-w-0">
          <p class="t-heading">{{ championUser.id === currentUserId ? '새 챔피언이 됐어요' : `${championUser.nickname}님이 새 챔피언이에요` }}</p>
          <p class="t-caption mt-0.5">이 규칙의 챔피언 자리는 다음 승자에게 넘어가요</p>
        </div>
      </UiCard>

      <!-- 친구 · 공유 -->
      <div class="flex gap-2">
        <UiButton v-if="isParticipant" variant="secondary" icon="fas fa-user-plus" class="flex-1" @click="sendFriendRequest">친구 요청</UiButton>
        <UiButton variant="secondary" icon="fas fa-share" class="flex-1" @click="onShare">공유하기</UiButton>
      </div>

      <template v-if="isParticipant && confirmed">
        <!-- 사진·동영상 -->
        <UiSection title="경기 사진·동영상">
          <template #action><span class="t-micro">{{ allPictures.length }}/5</span></template>

          <UiCard v-if="allPictures.length === 0">
            <UiEmptyState icon="fas fa-images" title="남길 사진이 없어요" description="경기 장면을 찍어 피드에 함께 올려보세요">
              <div class="flex gap-2">
                <UiButton variant="secondary" icon="fas fa-camera" @click="openCamera">사진</UiButton>
                <UiButton variant="secondary" icon="fas fa-video" @click="openVideoRecorder">동영상</UiButton>
              </div>
            </UiEmptyState>
          </UiCard>

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
                  <span class="absolute top-1 left-1 min-w-6 h-6 px-1.5 rounded-full bg-primary text-primary-fg text-xs font-bold flex items-center justify-center">{{ index + 1 }}</span>
                  <span v-if="pic.type === 'video'" class="absolute bottom-1 left-1 px-1.5 rounded bg-black/60 text-white text-xs">{{ formatDuration(pic.duration) }}</span>
                  <button
                    type="button"
                    class="absolute top-0 right-0 w-11 h-11 flex items-start justify-end p-1.5"
                    aria-label="올리지 않기"
                    @click.stop="deselectPicture(pic.id)"
                  >
                    <span class="w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center text-xs"><i class="fas fa-xmark" aria-hidden="true"></i></span>
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
                    <span class="w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center text-xs"><i class="fas fa-trash" aria-hidden="true"></i></span>
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
                  <i :class="n <= row.value ? 'fas fa-star' : 'far fa-star'" aria-hidden="true"></i>
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
            <p class="t-caption">재미·명확함·균형을 생각해 별을 눌러주세요. 다음 사람이 규칙을 고를 때 참고해요.</p>
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
                <i :class="n <= ruleRating ? 'fas fa-star' : 'far fa-star'" aria-hidden="true"></i>
              </button>
              <span class="t-caption ml-1">{{ ruleRating ? `${ruleRating}/5` : '선택' }}</span>
            </div>
            <UiInput v-if="ruleRating" v-model="ruleReview" multiline :rows="2" label="규칙 의견" optional placeholder="고치면 좋을 점이 있나요?" />
          </UiCard>
        </UiSection>
      </template>
    </template>
  </main>

  <!-- 하단 고정: 확인할 사람은 확인, 확정된 뒤에는 참가자만 평가 제출 -->
  <div v-if="pending.canAnswer && !isLoading" class="fixed bottom-0 inset-x-0 z-nav bg-canvas border-t border-line pb-safe">
    <div class="max-w-xl mx-auto px-4 py-3">
      <UiButton block size="lg" :loading="isAnswering === 'confirm'" @click="confirmResult">결과가 맞아요</UiButton>
    </div>
  </div>
  <div v-else-if="isParticipant && confirmed && !isLoading && !resultError" class="fixed bottom-0 inset-x-0 z-nav bg-canvas border-t border-line pb-safe">
    <div class="max-w-xl mx-auto px-4 py-3">
      <UiButton block size="lg" :loading="isSubmitting" :disabled="!review.manner || !review.performance" @click="submitReviewAndGoHome">
        {{ review.manner && review.performance ? '평가 보내기' : '매너와 실력에 별을 눌러주세요' }}
      </UiButton>
    </div>
  </div>

  <!-- 숨겨진 카메라·동영상 입력 -->
  <input ref="cameraInputRef" type="file" accept="image/*" capture="environment" class="hidden" @change="onCameraChange" />
  <input ref="videoInputRef" type="file" accept="video/*" capture="environment" class="hidden" @change="onVideoChange" />
  </div>
</template>


<script setup>
// 경기 결과: 누가 이겼나 → 사진 고르기 → 상대·규칙 평가 → 보내기. 평가는 경기에 뛴 사람에게만 보인다

import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../api/api'
import { POST } from '../../api/client'
import { refreshOnChange } from '../../websocket/userChannel'
import { matchTime } from '../../utils/format'
import {
  UiAvatar, UiButton, UiCard, UiEmptyState, UiInput, UiSection, UiSkeleton, UiTopBar,
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
    showToast('매너와 실력에 별을 눌러주세요')
    return
  }
  if (containsProfanity(review.value.text) || containsProfanity(ruleReview.value)) {
    showToast('쓰면 안 되는 말이 들어 있어요. 고쳐서 다시 보내주세요')
    return
  }

  // 바로 제출
  isSubmitting.value = true
  submitPictures()
    .then(() => {
      // 상대방 리뷰 제출
      return api.post(`/api/games/${gameId}/review`, review.value)
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
      showToast(error.response?.data?.message || '보내지 못했어요. 잠시 뒤 다시 시도해주세요')
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
const isParticipant = computed(() => !!currentUserId.value && (user1.value.id === currentUserId.value || user2.value.id === currentUserId.value))
const opponent = computed(() => (user1.value.id === currentUserId.value ? user2.value : user1.value))
// newChampionIdx는 서버 기준 순서라 화면 순서로 바꾼다
const championUser = computed(() => {
  if (!championIdx.value) return null
  return (championIdx.value === 1) === idxCorrect.value ? user1.value : user2.value
})
const sides = computed(() => [
  { user: user1.value, sets: user1SetCount.value, won: winnerIdx.value === 1, isMe: user1.value.id === currentUserId.value, champion: championUser.value?.id === user1.value.id },
  { user: user2.value, sets: user2SetCount.value, won: winnerIdx.value === 2, isMe: user2.value.id === currentUserId.value, champion: championUser.value?.id === user2.value.id },
])
const headline = computed(() => {
  if (winnerIdx.value === 0) return { text: '무승부', tone: 'text-fg' }
  const winner = winnerIdx.value === 1 ? user1.value : user2.value
  if (!isParticipant.value) return { text: `${winner.nickname}님 승리`, tone: 'text-fg' }
  return winner.id === currentUserId.value ? { text: '이겼어요', tone: 'text-primary' } : { text: '졌어요', tone: 'text-fg-muted' }
})
const pending = computed(() => {
  if (confirmed.value) return { canAnswer: false }
  const submitter = [user1.value, user2.value].find((u) => u.id === resultSubmittedById.value)
  const until = autoConfirmAt.value ? `${matchTime(autoConfirmAt.value)}까지` : '24시간 안에'
  if (!isParticipant.value) return { canAnswer: false, title: '확인 중인 결과예요', description: '두 선수가 확인하면 기록돼요' }
  if (resultSubmittedById.value === currentUserId.value) {
    return { canAnswer: false, title: `${opponent.value.nickname}님의 확인을 기다려요`, description: `확인하면 전적과 레이팅에 반영돼요. ${until} 답이 없으면 그대로 확정돼요` }
  }
  return {
    canAnswer: true,
    title: `${submitter?.nickname || '상대'}님이 낸 결과예요. 맞나요?`,
    description: `맞으면 전적과 레이팅에 반영돼요. ${until} 확인하지 않으면 그대로 확정돼요`,
  }
})

async function confirmResult() {
  isAnswering.value = 'confirm'
  try {
    await POST('/api/games/{id}/result/confirm', { path: { id: Number(gameId) } })
    await load()
  } catch (e) {
    showToast(e.response?.data?.message || '확인하지 못했어요. 다시 시도해 주세요')
  } finally {
    isAnswering.value = ''
  }
}

async function rejectResult() {
  const ok = await confirmDialog({
    title: '결과를 돌려보낼까요?',
    message: `경기가 다시 진행 중이 돼요. ${opponent.value.nickname}님과 점수를 맞춰 다시 내주세요.`,
    confirmText: '돌려보내기',
  })
  if (!ok) return
  isAnswering.value = 'reject'
  try {
    await POST('/api/games/{id}/result/reject', { path: { id: Number(gameId) } })
    router.replace(`/games/${gameId}/play`)
  } catch (e) {
    showToast(e.response?.data?.message || '돌려보내지 못했어요. 다시 시도해 주세요')
  } finally {
    isAnswering.value = ''
  }
}

const reviewRows = computed(() => [
  { key: 'manner', label: '매너', value: review.value.manner, set: setManner },
  { key: 'performance', label: '실력', value: review.value.performance, set: setPerformance },
])

async function load() {
  try {
    const myIdRes = await api.get('/api/auth/current-user-id')
    currentUserId.value = myIdRes.data

    const res = await api.get(`/api/games/${gameId}/result`)
    confirmed.value = res.data.confirmed !== false
    resultSubmittedById.value = res.data.resultSubmittedById
    autoConfirmAt.value = res.data.autoConfirmAt
    game.value = res.data.gameSummary
    startDate.value = res.data.startDate
    setResults.value = res.data.setResults
    totalSetCount.value = res.data.totalSetCount
    drawCount.value = res.data.drawCount
    winnerIdx.value = res.data.winnerIdx
    championIdx.value = res.data.newChampionIdx
    // 내가 user2일 때만 순서를 뒤집어 나를 왼쪽에 둔다 (구경하는 사람은 서버 순서 그대로)
    idxCorrect.value = res.data.user2.id !== currentUserId.value

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
        showToast('저장 공간이 부족합니다. 일부 사진을 삭제한 후 다시 시도해주세요.')
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
      showToast('저장 공간이 부족합니다. 일부 미디어를 삭제한 후 다시 시도해주세요.')
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
