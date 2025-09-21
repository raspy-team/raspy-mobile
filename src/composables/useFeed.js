import { ref, computed } from 'vue'
import api from '@/api/api.js'

const FEED_EXPIRY_HOURS = 72 * 30 // 임시로 90일로 설정하여 테스트

export function useFeed() {
  const posts = ref([])
  const currentUser = ref(null)
  const loading = ref(false)
  const hasMore = ref(true)


  // 시간 기반 필터링
  const isPostValid = (post) => {
    const now = new Date()
    const expiryTime = FEED_EXPIRY_HOURS * 60 * 60 * 1000

    // 초대 포스트는 항상 유효
    if (post.type === 'invite') {
      return true
    }

    // 완료된 경기
    if (post.type === 'game' && post.isCompleted) {
      const completedTime = new Date(post.date)
      return (now - completedTime) < expiryTime
    }

    // 예정된 경기
    if (post.type === 'upcoming_game' || (post.type === 'game' && !post.isCompleted)) {
      const scheduledTime = new Date(post.date)

      // 과거 경기는 제외
      if (scheduledTime < now) return false

      return true
    }

    return true
  }

  // 정렬된 피드 계산
  const sortedFeed = computed(() => {
    const validPosts = posts.value.filter(isPostValid)

    // 1. 친구 완료 경기 (최근 끝난 순)
    const friendsCompleted = validPosts
      .filter(p => p.type === 'game' && p.isCompleted && p.isFriend)
      .sort((a, b) => new Date(b.date) - new Date(a.date))

    // 2. 친구 예정 경기 (최근 날짜 순)
    const friendsScheduled = validPosts
      .filter(p => (p.type === 'upcoming_game' || (p.type === 'game' && !p.isCompleted)) && p.isFriend)
      .sort((a, b) => new Date(a.date) - new Date(b.date))

    // 3. 앱 초대 링크
    const invitePost = validPosts.filter(p => p.type === 'invite')

    // 4. 모든 완료 경기 (최근 끝난 순)
    const allCompleted = validPosts
      .filter(p => p.type === 'game' && p.isCompleted && !p.isFriend)
      .sort((a, b) => new Date(b.date) - new Date(a.date))

    // 5. 모든 예정 경기 (가까운 날짜 순)
    const allScheduled = validPosts
      .filter(p => (p.type === 'upcoming_game' || (p.type === 'game' && !p.isCompleted)) && !p.isFriend)
      .sort((a, b) => new Date(a.date) - new Date(b.date))

    return [
      ...friendsCompleted,
      ...friendsScheduled,
      ...invitePost,
      ...allCompleted,
      ...allScheduled
    ]
  })

  // 피드 로드
  const loadFeed = async () => {
    loading.value = true
    try {
      const response = await api.get('/api/feed')
      posts.value = response.data.items || []
      console.log('API 응답 데이터:', response.data.items)
      console.log('유효한 포스트:', posts.value.filter(isPostValid))
    } catch (error) {
      console.error('피드 로드 실패:', error)
      posts.value = []
    } finally {
      loading.value = false
    }
  }

  // 액션 핸들러들
  const handleLike = async (postId) => {
    console.log('좋아요:', postId)
    // API 호출
  }

  const handleComment = async (postId) => {
    console.log('댓글:', postId)
    // 댓글 모달 열기
  }

  const handleShare = async (postId) => {
    console.log('공유:', postId)
    // 공유 기능
  }

  const handleJoin = async (postId) => {
    console.log('참가:', postId)
    // 경기 참가 로직
  }

  const handleInvite = async () => {
    console.log('친구 초대')
    // 친구 초대 로직
  }

  const handleSkipInvite = () => {
    console.log('초대 건너뛰기')
    // 초대 포스트 제거
    posts.value = posts.value.filter(p => p.type !== 'invite')
  }

  return {
    posts,
    sortedFeed,
    currentUser,
    loading,
    hasMore,
    loadFeed,
    handleLike,
    handleComment,
    handleShare,
    handleJoin,
    handleInvite,
    handleSkipInvite
  }
}