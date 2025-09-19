import { ref, computed } from 'vue'

const FEED_EXPIRY_HOURS = 72 // 3일 후 피드에서 제거

export function useFeed() {
  const posts = ref([])
  const currentUser = ref(null)
  const loading = ref(false)
  const hasMore = ref(true)

  // 더미 데이터 (기존 구조 유지)
  const generateDummyPosts = () => {
    const users = [
      { id: 1, name: '김민수', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', isFriend: true },
      { id: 2, name: '이영희', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b8e6?w=150', isFriend: true },
      { id: 3, name: '박준호', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', isFriend: false },
      { id: 4, name: '최지은', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', isFriend: false },
      { id: 5, name: '정현우', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', isFriend: true },
    ]

    const sports = [
      { rule: { ruleTitle: '빠른 3세트 매치', majorCategory: '라켓 스포츠', minorCategory: '탁구' }},
      { rule: { ruleTitle: '배드민턴 토너먼트', majorCategory: '라켓 스포츠', minorCategory: '배드민턴' }},
      { rule: { ruleTitle: '테니스 단식 경기', majorCategory: '라켓 스포츠', minorCategory: '테니스' }},
      { rule: { ruleTitle: '풋살 매치', majorCategory: '구기 스포츠', minorCategory: '축구' }},
      { rule: { ruleTitle: '3대3 농구', majorCategory: '구기 스포츠', minorCategory: '농구' }},
    ]

    const photos = [
      'https://images.unsplash.com/photo-1546484959-f9a53db84d8e?w=800',
      'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
      'https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=800',
    ]

    const dummyPosts = []

    // 친구 완료 경기 (최근 24시간)
    for (let i = 0; i < 3; i++) {
      const author = users.filter(u => u.isFriend)[i % 3]
      const sport = sports[i % sports.length]
      const opponent = users.find(u => u.id !== author.id)

      dummyPosts.push({
        id: `friend-completed-${i}`,
        type: 'completed',
        author,
        rule: sport.rule,
        date: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        photos: [{ url: photos[i % photos.length], isHeadline: true }],
        players: [author, opponent],
        result: {
          scoreA: Math.floor(Math.random() * 5) + 1,
          scoreB: Math.floor(Math.random() * 5) + 1,
          winner: Math.random() > 0.5 ? author.name : opponent.name
        },
        meta: {
          place: ['강남 스포츠센터', '잠실 체육관', '송파 탁구장'][i % 3],
          time: '2시간 30분'
        },
        isFriend: true,
        completedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000)
      })
    }

    // 친구 예정 경기 (최근 확정된 순)
    for (let i = 0; i < 2; i++) {
      const author = users.filter(u => u.isFriend)[i % 3]
      const sport = sports[i % sports.length]

      dummyPosts.push({
        id: `friend-scheduled-${i}`,
        type: 'scheduled',
        author,
        rule: sport.rule,
        createdAt: new Date(Date.now() - Math.random() * 12 * 60 * 60 * 1000).toISOString(),
        scheduledDate: new Date(Date.now() + (Math.random() * 7 + 1) * 24 * 60 * 60 * 1000).toISOString(),
        location: ['강남 스포츠센터', '잠실 체육관'][i % 2],
        maxPlayers: 2,
        isFriend: true,
        confirmedAt: new Date(Date.now() - Math.random() * 12 * 60 * 60 * 1000)
      })
    }

    // 앱 초대 링크
    dummyPosts.push({
      id: 'app-invite-1',
      type: 'invite',
      timestamp: Date.now()
    })

    // 모든 완료 경기 (최근 72시간)
    for (let i = 0; i < 4; i++) {
      const author = users[i % users.length]
      const sport = sports[i % sports.length]
      const opponent = users.find(u => u.id !== author.id)

      dummyPosts.push({
        id: `all-completed-${i}`,
        type: 'completed',
        author,
        rule: sport.rule,
        date: new Date(Date.now() - Math.random() * 72 * 60 * 60 * 1000).toISOString(),
        photos: [{ url: photos[i % photos.length], isHeadline: true }],
        players: [author, opponent],
        result: {
          scoreA: Math.floor(Math.random() * 5) + 1,
          scoreB: Math.floor(Math.random() * 5) + 1,
          winner: Math.random() > 0.5 ? author.name : opponent.name
        },
        meta: {
          place: ['서초 스포츠센터', '마포 체육관', '영등포 탁구장', '노원 스포츠클럽'][i % 4],
          time: `${Math.floor(Math.random() * 3) + 1}시간 ${Math.floor(Math.random() * 60)}분`
        },
        isFriend: author.isFriend,
        completedAt: new Date(Date.now() - Math.random() * 72 * 60 * 60 * 1000)
      })
    }

    // 모든 예정 경기
    for (let i = 0; i < 3; i++) {
      const author = users[i % users.length]
      const sport = sports[i % sports.length]

      dummyPosts.push({
        id: `all-scheduled-${i}`,
        type: 'scheduled',
        author,
        rule: sport.rule,
        createdAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        scheduledDate: new Date(Date.now() + (Math.random() * 14 + 1) * 24 * 60 * 60 * 1000).toISOString(),
        location: ['종로 스포츠센터', '강서 체육관', '동작 탁구장'][i % 3],
        maxPlayers: 2,
        isFriend: author.isFriend,
        confirmedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000)
      })
    }

    return dummyPosts
  }

  // 시간 기반 필터링
  const isPostValid = (post) => {
    const now = new Date()
    const expiryTime = FEED_EXPIRY_HOURS * 60 * 60 * 1000

    if (post.type === 'completed') {
      const completedTime = new Date(post.completedAt || post.date)
      return (now - completedTime) < expiryTime
    }

    if (post.type === 'scheduled') {
      const confirmedTime = new Date(post.confirmedAt || post.createdAt)
      const scheduledTime = new Date(post.scheduledDate)

      // 과거 경기는 제외
      if (scheduledTime < now) return false

      // 확정된지 너무 오래된 것도 제외
      return (now - confirmedTime) < expiryTime
    }

    return true
  }

  // 정렬된 피드 계산
  const sortedFeed = computed(() => {
    const validPosts = posts.value.filter(isPostValid)

    // 1. 친구 완료 경기 (최근 끝난 순)
    const friendsCompleted = validPosts
      .filter(p => p.type === 'completed' && p.isFriend)
      .sort((a, b) => new Date(b.completedAt || b.date) - new Date(a.completedAt || a.date))

    // 2. 친구 예정 경기 (최근 확정된 순)
    const friendsScheduled = validPosts
      .filter(p => p.type === 'scheduled' && p.isFriend)
      .sort((a, b) => new Date(b.confirmedAt || b.createdAt) - new Date(a.confirmedAt || a.createdAt))

    // 3. 앱 초대 링크
    const invitePost = validPosts.filter(p => p.type === 'invite')

    // 4. 모든 완료 경기 (최근 끝난 순)
    const allCompleted = validPosts
      .filter(p => p.type === 'completed' && !p.isFriend)
      .sort((a, b) => new Date(b.completedAt || b.date) - new Date(a.completedAt || a.date))

    // 5. 모든 예정 경기 (최근 확정된 순)
    const allScheduled = validPosts
      .filter(p => p.type === 'scheduled' && !p.isFriend)
      .sort((a, b) => new Date(b.confirmedAt || b.createdAt) - new Date(a.confirmedAt || a.createdAt))

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
      // 실제 API 호출 대신 더미 데이터 사용
      // const response = await api.get('/api/feed')
      // posts.value = response.data

      posts.value = generateDummyPosts()
    } catch (error) {
      console.error('피드 로드 실패:', error)
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