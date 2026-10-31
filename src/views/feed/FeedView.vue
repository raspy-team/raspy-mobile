<template>
  <HeaderComp
    :has-referer="isUserFeedMode"
    :show-bell="true"
    :show-dm="true"
    custom-class="bg-transparent border-none backdrop-blur-none"
    back-icon-class="fas fa-arrow-left text-orange-500 text-xl"
  />

  <div
    v-if="loading"
    class="relative inset-0 h-full w-full bg-black text-white overflow-hidden select-none"
  >
    <div class="flex items-center justify-center h-full">
      <div class="text-center">
        <div class="space-y-4 max-w-sm mx-auto p-6">
          <div class="h-4 bg-white/10 rounded animate-pulse"></div>
          <div class="h-20 bg-white/10 rounded animate-pulse"></div>
          <div class="h-4 bg-white/10 rounded w-3/4 animate-pulse"></div>
          <div class="h-4 bg-white/10 rounded w-1/2 animate-pulse"></div>
        </div>
        <p class="mt-6 text-white/70 text-base">피드를 불러오는 중...</p>
      </div>
    </div>
  </div>

  <div
    v-else-if="!loading && sortedFeed.length === 0"
    class="relative inset-0 h-full w-full bg-black text-white overflow-hidden select-none"
  >
    <div class="flex items-center justify-center h-full">
      <div class="text-center max-w-sm mx-auto p-6">
        <i class="fas fa-trophy text-lg text-white/30 mb-4"></i>
        <h3 class="text-lg font-bold mb-2">아직 경기가 없어요</h3>
        <p class="text-white/70 text-base leading-relaxed">
          친구들과 첫 경기를 시작해보세요!<br />
          새로운 도전이 기다리고 있습니다.
        </p>
        <button
         class="mt-6 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full transition-colors"
          @click="$router.push('/create-game')"
        >
          경기 만들기
        </button>
      </div>
    </div>
  </div>

  <div
    v-else-if="!loading && sortedFeed.length > 0 && post"
    class="relative inset-0 h-full w-full bg-black text-white overflow-hidden select-none feed-viewport"
    @touchstart.passive="onFeedTouchStart"
    @touchmove.passive="onFeedTouchMove"
    @touchend.passive="onFeedTouchEnd($event)"
    @mousedown="onFeedMouseDown"
    @mousemove="onFeedMouseMove"
    @mouseup="onFeedMouseUp"
    @mouseleave="onFeedMouseUp"
  >
    <div class="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <div v-if="prevPost" class="absolute inset-0" :style="prevPreviewStyle">
        <FeedPostPreview :post="prevPost" />
      </div>
      <div v-if="nextPost" class="absolute inset-0" :style="nextPreviewStyle">
        <FeedPostPreview :post="nextPost" />
      </div>
    </div>
    <div
      class="relative h-full w-full"
      :style="feedWrapperStyle"
      @transitionend="onFeedSnapTransitionEnd"
    >
      <AppInvitePost
        v-if="post.type === 'invite' || post.type === 'friend-invite'"
        @invite="handleInvite"
        @skip="handleSkipInvite"
        class="absolute inset-0 z-30"
      />
      <!-- Slides progress (top) -->
      <div
        v-if="post.type !== 'friend-invite'"
        class="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 flex gap-3 justify-center items-center"
      >
        <span
          v-for="(s, i) in sections"
          :key="'prog-dot-' + i"
          :class="[
            'w-3 h-3 rounded-full transition-all duration-200',
            i === currentSlide
              ? 'bg-orange-400 shadow-[0_0_0_2px_rgba(251,140,0,0.25)]'
              : 'bg-orange-400/30',
          ]"
        ></span>
      </div>

      <div
        class="absolute inset-0 z-0"
        @touchstart.passive="onTouchStart"
        @touchmove.passive="onTouchMove"
        @touchend.passive="onTouchEnd($event)"
        @mousedown.passive="onMouseDown"
        @mousemove.passive="onMouseMove"
        @mouseup.passive="onMouseUp($event)"
        @mouseleave.passive="onMouseUp($event)"
      >
        <div class="h-full flex" :style="wrapperStyle">
          <FeedHeadlineSlide
            v-if="post.type === 'game' && post.isCompleted && features.headline && hasPhotos"
            :post="post"
            :photo="headlinePhoto"
            @profile="goToProfile"
          />

          <FeedGameInfoSlide
            :post="post"
            :show-reviews="features.reviews"
            @profile="goToProfile"
            @rule="showRuleModal = true"
            @join="handleJoin"
            @interact="resetFeedPointer"
          />

          <FeedRankingSlide
            v-if="post.type === 'game' && post.isCompleted && currentRankingStatus"
            :ranking="currentRanking"
            :status="currentRankingStatus"
            @profile="goToProfile"
            @open-all="openRankingModal"
          />

          <template v-for="(p, idx) in galleryPhotos" :key="'gal-' + (p.url || idx)">
            <section
              v-if="post.type === 'game' && post.isCompleted && features.gallery"
              class="w-screen shrink-0 h-full relative"
            >
              <!-- 동영상 -->
              <video
                v-if="p && p.mediaType === 'VIDEO'"
                :src="p.url"
                class="absolute inset-0 w-full h-full object-contain bg-black"
                autoplay
                loop
                muted
                playsinline
                webkit-playsinline
                preload="auto"
              />

              <!-- 이미지 -->
              <img
                v-else-if="p && p.url"
                :src="p.url"
                alt="photo"
                class="absolute inset-0 w-full h-full object-contain"
                draggable="false"
              />
              <div
                class="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none"
              ></div>
            </section>
          </template>
        </div>
      </div>

      <FeedActionBar
        :post="post"
        :like-bump="likeBump"
        :reported="isReported(post.id)"
        @like="toggleLike"
        @like-press-start="onLikeLongPressStart"
        @like-press-end="onLikeLongPressEnd"
        @challenge="onDoWithMe"
        @comment="onComment"
        @share="onShare"
        @report="onReport"
      />
    </div>
  </div>

  <FeedRuleModal v-if="showRuleModal" :rule="post?.rule" @close="showRuleModal = false" />
  <div
    v-else-if="!loading && (!sortedFeed.length || !post)"
    class="relative inset-0 h-full w-full bg-black text-white overflow-hidden select-none"
  >
    <div class="flex items-center justify-center h-full">
      <div class="text-center max-w-sm mx-auto p-6">
        <i class="fas fa-trophy text-4xl text-white/30 mb-4"></i>
        <h3 class="text-lg font-bold mb-2">아직 경기가 없어요</h3>
        <p class="text-white/70 text-sm leading-relaxed">첫 번째 경기를 만들어보세요!</p>
        <button
          class="mt-6 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-full transition-colors"
          @click="$router.push('/create-game')"
        >
          경기 만들기
        </button>
      </div>
    </div>
  </div>


  <FeedChallengeModal
    v-if="showPlayerSelectModal"
    :players="post?.players || []"
    @select="sendPlayWithMeRequest"
    @close="closePlayerSelectModal"
  />

  <!-- 좋아요한 사람 말풍선 -->
  <transition name="fade-scale">
    <FeedLikersPopover
      v-if="showLikersModal"
      :likers="likersData"
      @close="closeLikersModal"
      @profile="(goToProfile($event), closeLikersModal())"
    />
  </transition>

  <Comment class="z-[100000]" v-if="commentId == 1" :id="post.id" @close="onCloseComment" />

  <!-- 랭킹 모달 -->
  <RankingModal v-model="showRankingModal" :title="rankingRuleName">
    <RankingList
      :loading="rankingLoading"
      :error="rankingError"
      :current-user-ranking="rankingCurrentUser"
      :rankings="rankingData"
      @retry="fetchRankingData"
      @profile-click="handleRankingProfileClick"
    />
  </RankingModal>

</template>

<script setup>
import FeedPostPreview from '../../components/feed/FeedPostPreview.vue'
import FeedHeadlineSlide from '../../components/feed/FeedHeadlineSlide.vue'
import FeedGameInfoSlide from '../../components/feed/FeedGameInfoSlide.vue'
import FeedRankingSlide from '../../components/feed/FeedRankingSlide.vue'
import FeedActionBar from '../../components/feed/FeedActionBar.vue'
import FeedRuleModal from '../../components/feed/FeedRuleModal.vue'
import FeedChallengeModal from '../../components/feed/FeedChallengeModal.vue'
import FeedLikersPopover from '../../components/feed/FeedLikersPopover.vue'
import { useBackClose } from '../../composable/useBackClose'
import { useFeedSwipe } from '../../composables/useFeedSwipe'
import { useSlideSwipe } from '../../composables/useSlideSwipe'
import { tryVibrate } from '../../composables/swipe'

import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import HeaderComp from '../../components/HeaderComp.vue'
import api, { playWithMeTooAPI } from '../../api/api'
import featureFlags from '../../config/features'
import { useToast } from '../../composable/useToast'
import AppInvitePost from '../../components/feed/AppInvitePost.vue'
import { useFeed } from '../../composables/useFeed.js'
import Comment from '../GameCommentView.vue'
import RankingModal from '../../components/modals/RankingModal.vue'
import RankingList from '../../components/ranking/RankingList.vue'
const router = useRouter()
// Currently available info flags for gating UI
const features = featureFlags
const { showToast } = useToast()

import { useRoute } from 'vue-router'
const route = useRoute()
// 특정 유저의 피드를 보고 있는지 확인
const isUserFeedMode = computed(() => !!route.query.userId)

// 피드 데이터 관리
const { loading, sortedFeed, loadFeed } = useFeed()

// 온보딩 상태 관리

// 나랑도해 상태 관리
const playWithMeRequests = ref(new Map()) // userId -> boolean (요청 상태)
const showPlayerSelectModal = ref(false) // 플레이어 선택 모달 표시 상태

// 신고 상태 관리 (localStorage에 저장하여 중복 신고 방지)
const reportedPosts = ref(new Set(JSON.parse(localStorage.getItem('reportedPosts') || '[]')))

function isReported(postId) {
  return reportedPosts.value.has(postId)
}

// 좋아요한 사람 목록 모달
const showLikersModal = ref(false)
const likersData = ref({ totalCount: 0, recentLikers: [] })
let likeLongPressTimer = null

function onLikeLongPressStart(e) {
  // 롱프레스 타이머 시작 (500ms)
  likeLongPressTimer = setTimeout(async () => {
    e.preventDefault()
    e.stopPropagation()

    // 피드 터치 상태 리셋
    feedIsPointerDown.value = false
    feedAnimating.value = false

    // 좋아요 정보 가져오기
    await fetchLikersData()
  }, 500)
}

function onLikeLongPressEnd() {
  // 타이머 취소
  if (likeLongPressTimer) {
    clearTimeout(likeLongPressTimer)
    likeLongPressTimer = null
  }
}

async function fetchLikersData() {
  if (!post.value?.id) return

  try {
    // GET API로 좋아요 정보만 조회 (토글하지 않음)
    const response = await api.get(`/api/games/${post.value.id}/like`)
    // null 또는 userId가 없는 데이터 필터링
    const validLikers = (response.data.recentLikers || []).filter((liker) => liker && liker.userId)
    likersData.value = {
      totalCount: response.data.totalCount || 0,
      recentLikers: validLikers,
    }
    showLikersModal.value = true
  } catch (error) {
    console.error('좋아요한 사람 목록 조회 실패:', error)
    // GET이 안되면 현재 post 데이터 사용
    likersData.value = {
      totalCount: post.value.likeCount || 0,
      recentLikers: [],
    }
    showLikersModal.value = true
  }
}

function closeLikersModal() {
  showLikersModal.value = false
  // 피드 터치 상태 리셋
  feedIsPointerDown.value = false
  feedAnimating.value = false
}

async function onReport() {
  // 피드 터치 상태 리셋
  feedIsPointerDown.value = false
  feedAnimating.value = false

  const postId = post.value?.id
  if (!postId) return

  if (isReported(postId)) {
    showToast('이미 신고한 게시물입니다')
    return
  }

  // 피드 게시물 = 경기. 서버에 신고를 남긴다 (예전에는 화면에만 '완료'라고 보이고 서버로 가지 않았다)
  try {
    await api.post('/api/reports', { targetType: 'GAME', targetId: postId, reason: '피드에서 신고' })
  } catch (e) {
    if (e.response?.status !== 409) {
      showToast('신고에 실패했어요. 잠시 뒤 다시 시도해주세요')
      return
    }
  }
  reportedPosts.value.add(postId)
  localStorage.setItem('reportedPosts', JSON.stringify([...reportedPosts.value]))
  showToast('신고가 완료되었습니다')
}

// 프로필 클릭 핸들러
function goToProfile(userId) {
  if (!userId) return
  // 피드 터치 상태 리셋
  feedIsPointerDown.value = false
  feedAnimating.value = false
  router.push(`/profile/${userId}`)
}

onMounted(() => {
  console.log('FeedView onMounted 실행')
  console.log('loadFeed 호출 예정')
  loadFeed(router.currentRoute.value)

})

// 현재 표시 중인 피드 인덱스 (gameId가 있으면 sortedFeed computed에서 자동으로 맨 위로 정렬됨)
const currentFeedIndex = ref(0)

// 현재 표시 중인 포스트
const post = computed(() => {
  return sortedFeed.value[currentFeedIndex.value] || null
})

watch(
  post,
  async (newPost) => {
    if (newPost && newPost.type === 'game' && newPost.isCompleted) {
      await fetchLikeStatus(newPost)
      await fetchRanking(newPost)
    }
  },
  { immediate: true },
)

async function fetchLikeStatus(gamePost) {
  try {
    const response = await api.get(`/api/games/${gamePost.id}/like`)
    const { isLiked, totalCount } = response.data

    const postInFeed = sortedFeed.value.find((p) => p.id === gamePost.id)
    if (postInFeed) {
      postInFeed.isLiked = isLiked
      postInFeed.likeCount = totalCount
    }
  } catch (error) {
    console.error('좋아요 상태 조회 실패:', error)
    const postInFeed = sortedFeed.value.find((p) => p.id === gamePost.id)
    if (postInFeed) {
      postInFeed.isLiked = false
      postInFeed.likeCount = postInFeed.likeCount || 0
    }
  }
}

// 랭킹 데이터 저장
const gameRankings = ref(new Map())
const rankingStatus = ref(new Map()) // 'available', 'unavailable', 'error'

async function fetchRanking(gamePost) {
  try {
    const response = await api.get(`/api/games/${gamePost.id}/ranking`)
    gameRankings.value.set(gamePost.id, response.data.rankings || [])
    rankingStatus.value.set(gamePost.id, 'available')
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('랭킹 시스템 도입 전 경기')
      rankingStatus.value.set(gamePost.id, 'unavailable')
    } else {
      console.error('랭킹 조회 실패:', error)
      rankingStatus.value.set(gamePost.id, 'error')
    }
    gameRankings.value.set(gamePost.id, [])
  }
}

// 현재 포스트의 랭킹 데이터
const currentRanking = computed(() => {
  if (!post.value || !post.value.id) return []
  return gameRankings.value.get(post.value.id) || []
})

// 현재 포스트의 랭킹 상태
const currentRankingStatus = computed(() => {
  if (!post.value || !post.value.id) return null
  return rankingStatus.value.get(post.value.id) || null
})

// ---------------------------
// Vertical feed management
// ---------------------------
// 이전 피드 관리 변수들 제거됨 - useFeed 사용

// 이전 더미 데이터 및 앱 초대 관련 함수들 제거됨

async function loadMoreFeed() {
  // 더 이상 사용하지 않음 - useFeed에서 페이지네이션 처리
  console.log('loadMoreFeed called but not implemented')
}

// 남은 미시청 항목이 5개가 되면 추가 로드
watch(currentFeedIndex, async (idx) => {
  const remaining = sortedFeed.value.length - idx - 1
  if (remaining === 5) {
    await loadMoreFeed()
  }
})

// Event handlers for app invite
const handleInvite = () => {
  console.log('Invite clicked')
  // Add invite functionality
  // Move to next post
  if (currentFeedIndex.value < sortedFeed.value.length - 1) {
    setCurrentFeed(currentFeedIndex.value + 1)
  }
}

const handleSkipInvite = () => {
  console.log('Skip invite clicked')
  // Move to next post
  if (currentFeedIndex.value < sortedFeed.value.length - 1) {
    setCurrentFeed(currentFeedIndex.value + 1)
  }
}

// Event handler for scheduled game join
const handleJoin = async (postId) => {
  console.log('Join clicked:', postId)
  try {
    await api.post(`/api/games/${postId}/apply`)

    // 현재 포스트의 신청 상태 업데이트
    const currentPost = post.value
    if (currentPost && currentPost.id === postId) {
      currentPost.isAppliedByMe = true
    }

    showToast('참가 신청이 완료되었습니다!')
  } catch (err) {
    showToast(err.response?.data?.message || '신청에 실패했습니다.')
  }
}

// fetchInitialFeed는 더 이상 필요없음 - useFeed의 loadFeed 사용

function setCurrentFeed(i) {
  const next = Math.max(0, Math.min(i, sortedFeed.value.length - 1))
  if (next === currentFeedIndex.value) return
  currentFeedIndex.value = next

  // post는 computed이므로 자동으로 업데이트됨
  // 포스트 단위 UX 상태 초기화
  currentSlide.value = 0
  tryVibrate(10)
}

// 위아래로 넘기기 (게시물 단위)
const {
  feedIsPointerDown,
  feedAnimating,
  feedWrapperStyle,
  nextPreviewStyle,
  prevPreviewStyle,
  onFeedSnapTransitionEnd,
  onFeedTouchStart,
  onFeedTouchMove,
  onFeedTouchEnd,
  onFeedMouseDown,
  onFeedMouseMove,
  onFeedMouseUp,
} = useFeedSwipe({
  index: currentFeedIndex,
  count: computed(() => sortedFeed.value.length),
  onChange: (i) => setCurrentFeed(i),
})

// 위아래로 넘길 때 미리 보이는 이전·다음 게시물
const nextPost = computed(() => sortedFeed.value[currentFeedIndex.value + 1] || null)
const prevPost = computed(() => sortedFeed.value[currentFeedIndex.value - 1] || null)

// Photos computed
const hasPhotos = computed(
  () => post.value && Array.isArray(post.value.photos) && post.value.photos.length > 0,
)

// 미디어 정렬: 동영상을 첫 번째로
const sortedPhotos = computed(() => {
  if (!post.value) return []
  const photos = post.value.photos || []
  if (photos.length === 0) return []

  // photos를 객체 형태로 정규화
  const normalized = photos
    .map((photo) => {
      if (photo?.url) {
        return {
          url: photo.url,
          mediaType: photo.mediaType || 'IMAGE', // mediaType이 없으면 IMAGE로 간주
        }
      } else if (typeof photo === 'string') {
        return { url: photo, mediaType: 'IMAGE' }
      }
      // 잘못된 형식이면 기본값 반환
      return { url: '', mediaType: 'IMAGE' }
    })
    .filter((p) => p.url) // url이 있는 것만 필터링

  // 동영상을 앞으로, 나머지는 뒤로
  const videos = normalized.filter((p) => p.mediaType === 'VIDEO')
  const images = normalized.filter((p) => p.mediaType !== 'VIDEO')

  // 디버깅: 동영상이 있으면 로그 출력
  if (videos.length > 0) {
    console.log('[FeedView] 동영상 발견:', videos)
  }

  return [...videos, ...images]
})

const headlinePhoto = computed(() => {
  // 정렬된 미디어 배열의 첫 번째가 헤드라인 (동영상 우선)
  const sorted = sortedPhotos.value
  if (sorted.length === 0) return null
  const headline = sorted[0]

  // 디버깅
  if (headline && headline.mediaType === 'VIDEO') {
    console.log('[FeedView] headlinePhoto는 동영상입니다:', headline)
  }

  return headline
})

const galleryPhotos = computed(() => {
  // 정렬된 미디어 배열의 나머지가 갤러리
  const sorted = sortedPhotos.value
  if (sorted.length <= 1) return []
  return sorted.slice(1)
})

// 동영상은 이제 서버에서 GIF로 변환되어 제공됨
// Video 관련 코드 제거됨

// Sections order
const sections = computed(() => {
  const arr = []

  if (!post.value) return arr

  // 예정된 경기는 단일 섹션 (슬라이드 없음)
  if (
    post.value.type === 'upcoming_game' ||
    (post.value.type === 'game' && !post.value.isCompleted)
  ) {
    arr.push('예정된 경기')
    return arr
  }

  // 완료된 경기는 모든 섹션 표시
  if (post.value.type === 'game' && post.value.isCompleted) {
    if (features.headline && hasPhotos.value) arr.push('헤드라인 사진')
    if (features.gameInfo) arr.push('경기 정보')
    // 평점 & 리뷰는 경기 정보 섹션 내에 표시되므로 별도 섹션 제거
    if (features.friendRanking) arr.push('친구 랭킹')
    if (features.gallery) {
      for (let i = 0; i < galleryPhotos.value.length; i++) arr.push('전체 사진')
    }
  }

  return arr
})
const totalSlides = computed(() => sections.value.length)

// const currentSectionLabel = computed(() => sections.value[currentSlide.value] || '')

// 좌우로 넘기기 (한 게시물 안의 슬라이드). 두 번 탭하면 또 보고싶어요
const { currentSlide, wrapperStyle, onTouchStart, onTouchMove, onTouchEnd, onMouseDown, onMouseMove, onMouseUp } =
  useSlideSwipe({ total: totalSlides, onDoubleTap: () => toggleLike() })

// Actions
const likeBump = ref(false)
async function toggleLike() {
  if (!post.value || post.value.type !== 'game' || !post.value.isCompleted) {
    return
  }

  // 피드 터치 상태 리셋
  feedIsPointerDown.value = false
  feedAnimating.value = false

  const currentPost = post.value
  const originalLikedState = currentPost.isLiked
  const originalLikeCount = currentPost.likeCount || 0

  // 1. Optimistic UI Update (UI 즉시 변경)
  currentPost.isLiked = !originalLikedState
  currentPost.likeCount = originalLikedState ? originalLikeCount - 1 : originalLikeCount + 1
  if (currentPost.likeCount < 0) currentPost.likeCount = 0

  // Animation & Haptic
  likeBump.value = false
  requestAnimationFrame(() => {
    likeBump.value = true
    setTimeout(() => (likeBump.value = false), 240)
  })
  tryVibrate(15)

  try {
    // 2. API 호출
    const response = await api.post(`/api/games/${currentPost.id}/like`)

    // 3. 서버 응답으로 상태 동기화 (선택적이지만 권장)
    currentPost.isLiked = response.data.isLiked
    currentPost.likeCount = response.data.totalCount
  } catch (error) {
    console.error('좋아요 토글 실패:', error)
    showToast('요청 처리 중 오류가 발생했습니다.', 'error')

    // 4. 실패 시 UI 롤백
    currentPost.isLiked = originalLikedState
    currentPost.likeCount = originalLikeCount
  }
}
function onDoWithMe() {
  if (!post.value || !post.value.players || post.value.players.length === 0) {
    showToast('플레이어 정보를 찾을 수 없습니다.', 'error')
    return
  }

  // 피드 터치 상태 리셋 (모달 열 때)
  feedIsPointerDown.value = false
  feedAnimating.value = false

  // 플레이어 선택 모달 열기
  showPlayerSelectModal.value = true
}

// 선택된 플레이어에게 나랑도해 요청 보내기
async function sendPlayWithMeRequest(selectedPlayer) {
  console.log('Selected player:', selectedPlayer)
  console.log('Rule ID:', post.value?.rule?.id)

  if (!post.value?.rule?.id) {
    showToast('경기 정보를 찾을 수 없습니다.', 'error')
    return
  }

  const targetUserId = selectedPlayer.id
  const ruleId = post.value.rule.id

  console.log('Sending request with targetUserId:', targetUserId, 'ruleId:', ruleId)

  try {
    await playWithMeTooAPI.sendRequest(targetUserId, ruleId)
    playWithMeRequests.value.set(targetUserId, true)
    showToast(`${selectedPlayer.name}님에게 도전 요청을 보냈습니다.`, `/chat/${targetUserId}`)
    showPlayerSelectModal.value = false
  } catch (error) {
    console.error('도전 요청 처리 중 오류:', error)
    showToast('이미 도전 요청을 보낸 유저입니다.', 'error')
  }
}

// 플레이어 선택 모달 닫기
function closePlayerSelectModal() {
  showPlayerSelectModal.value = false
  // 피드 터치 상태 리셋 (모달 닫을 때)
  feedIsPointerDown.value = false
  feedAnimating.value = false
}

function onComment() {
  const currentPost = post.value
  if (currentPost?.id) {
    // 피드 터치 상태 리셋 (모달 열 때)
    feedIsPointerDown.value = false
    feedAnimating.value = false
    commentId.value = 1
  }
}

function onCloseComment() {
  commentId.value = 0
  // 피드 터치 상태 리셋 (모달 닫을 때)
  feedIsPointerDown.value = false
  feedAnimating.value = false
}
async function onShare() {
  // 피드 터치 상태 리셋
  feedIsPointerDown.value = false
  feedAnimating.value = false

  const res = await api.post('/api/invite', null, { params: { gameId: `${post.value.id}` } })
  const url = res.data.url

  // 경기 상태에 따라 공유 텍스트 변경
  const ruleName = post.value.rule?.name || '경기'
  let text = ''

  if (post.value.isCompleted) {
    // 종료된 경기: 경기 결과 + 규칙명 표시
    const result = post.value.result || {}
    const players = post.value.players || []

    // winner 이름과 매칭되는 플레이어 찾기
    const winnerName = result.winner || players[0]?.name || '승자'
    const player1Name = players[0]?.name || ''
    const player2Name = players[1]?.name || ''

    // 승자가 아닌 플레이어 찾기
    const loserName =
      winnerName === player1Name ? player2Name : winnerName === player2Name ? player1Name : '패자'

    const scoreA = result.scoreA || 0
    const scoreB = result.scoreB || 0

    // 승자가 player1이면 scoreA가 승자 점수, 아니면 scoreB가 승자 점수
    const winnerScore = winnerName === player1Name ? scoreA : scoreB
    const loserScore = winnerName === player1Name ? scoreB : scoreA

    text = `[${ruleName}] ${winnerName} ${winnerScore} vs ${loserScore} ${loserName} – Match`
  } else {
    // 진행중/예정 경기: 규칙명 + 플레이어
    text = `[${ruleName}] ${post.value.players[0]?.name}의 경기 – Match`
  }

  try {
    if (navigator.share) {
      await navigator.share({ title: 'Match', text, url })
    } else {
      await navigator.clipboard.writeText(url)
      alert('링크를 복사했어요!')
    }
  } catch (e) {
    console.log(e)
  }

  // 공유 완료 후에도 터치 상태 리셋
  feedIsPointerDown.value = false
  feedAnimating.value = false
}

const showRuleModal = ref(false)
const commentId = ref(0)

// 랭킹 모달 관련 상태
const showRankingModal = ref(false)
const rankingRuleId = ref(null)
const rankingRuleName = ref('')
const rankingData = ref([])
const rankingCurrentUser = ref(null)
const rankingLoading = ref(false)
const rankingError = ref(null)

const openRankingModal = async () => {
  if (!post.value?.rule?.id) return

  // 피드 터치 상태 리셋 (모달 열 때)
  feedIsPointerDown.value = false
  feedAnimating.value = false

  showRankingModal.value = true
  rankingRuleId.value = post.value.rule.id
  rankingRuleName.value = post.value.rule.ruleTitle || '규칙 랭킹'

  await fetchRankingData()
}

const fetchRankingData = async () => {
  rankingLoading.value = true
  rankingError.value = null

  try {
    const response = await api.get(`/api/rules/${rankingRuleId.value}/rankings`)
    const data = response.data

    rankingData.value = data.rankings || []
    rankingCurrentUser.value = data.currentUserRanking || null
  } catch (err) {
    console.error('랭킹 조회 실패:', err)
    if (err.response && err.response.data && err.response.data.message) {
      rankingError.value = err.response.data.message
    } else {
      rankingError.value = '랭킹 정보를 불러오는 데 실패했습니다.'
    }
  } finally {
    rankingLoading.value = false
  }
}

const handleRankingProfileClick = (userId) => {
  showRankingModal.value = false
  setTimeout(() => {
    router.push(`/profile/${userId}`)
  }, 300)
}

// 슬라이드 안의 버튼을 누른 뒤 피드 넘김 상태가 남지 않게
const resetFeedPointer = () => {
  feedIsPointerDown.value = false
  feedAnimating.value = false
}



onBeforeUnmount(() => {})

// 뒤로가기는 열린 모달부터 닫는다
useBackClose(showPlayerSelectModal, showLikersModal, showRuleModal, showRankingModal)
</script>

<style scoped>
.feed-viewport {
  touch-action: none;
  overscroll-behavior-y: contain;
}

/* 피드 헤더 아이콘은 사진 위에서도 보이게 흰색 */
:deep(header .fa-bell),
:deep(header .fa-paper-plane) {
  color: white !important;
}
:deep(header .fa-bell + span) {
  background-color: white !important;
  border-color: transparent !important;
  color: #262626 !important;
}

/* 좋아요 툴팁 */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.2s ease;
}
.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
