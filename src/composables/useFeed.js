import { ref, computed } from 'vue'
import api from '@/api/api.js'

// 테스트/프로덕션 모드 설정 (코드로 수정 가능)
const FEED_MODE = 'prod' // 'test' 또는 'prod'

// 테스트용 더미 데이터
const DUMMY_FEED_DATA = {
  items: [
    {
      id: "test-1",
      date: "2025-09-21",
      photos: [
        "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?q=80&w=400&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=400&auto=format&fit=crop"
      ],
      caption: "테스트 완료 경기",
      meta: {
        place: "서울 강남구 테헤란로 123",
        time: "오후 2:30"
      },
      tags: [],
      players: [
        {
          id: 1,
          name: "테스트유저1",
          avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop"
        },
        {
          id: 2,
          name: "테스트유저2",
          avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?q=80&w=200&auto=format&fit=crop"
        }
      ],
      result: {
        scoreA: 2,
        scoreB: 1,
        winner: "테스트유저1",
        sets: 3,
        duration: "45분",
        setScores: [
          { set: 1, scoreA: 11, scoreB: 8 },
          { set: 2, scoreA: 7, scoreB: 11 },
          { set: 3, scoreA: 11, scoreB: 9 }
        ]
      },
      reviews: [
        {
          id: 1,
          author: {
            id: 2,
            name: "테스트유저2",
            avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?q=80&w=200&auto=format&fit=crop"
          },
          text: "재미있는 경기였습니다! 다음에도 함께 해요.",
          createdAt: "2025-09-21T14:30:00"
        }
      ],
      rule: {
        id: 1,
        ruleTitle: "테스트 탁구 규칙",
        ruleGoal: "상대방보다 먼저 11점을 획득하여 세트를 승리하고, 3세트 중 2세트를 먼저 승리하는 것이 목표입니다.",
        ruleScoreDefinition: "각 세트는 11점 선취, 10:10인 경우 2점 차이가 날 때까지 진행",
        rulePreparation: "탁구대, 탁구공, 라켓 2개",
        ruleOrder: "1. 가위바위보로 서브권 결정\n2. 서브는 2번씩 교대\n3. 세트 승리 시 서브권 획득",
        ruleDecision: "공이 네트에 걸리거나 상대 코트를 벗어나면 실점",
        ruleFoul: "네트 터치, 더블 바운스 금지",
        ruleExtraInfo: "즐겁게 경기하세요!",
        majorCategory: "기존 스포츠",
        minorCategory: "탁구"
      },
      type: "game",
      isFriend: true,
      isCompleted: true
    },
    {
      id: "test-2",
      date: "2025-09-22",
      photos: [],
      caption: "내일 예정된 경기!",
      meta: {
        place: "서울 서초구 강남대로 456",
        time: "오전 10:00"
      },
      tags: [],
      players: [
        {
          id: 3,
          name: "테스트유저3",
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop"
        }
      ],
      result: null,
      reviews: [],
      rule: {
        id: 2,
        ruleTitle: "농구 자유투 대결",
        ruleGoal: "정해진 위치에서 자유투를 던져 더 많이 성공시키는 것이 목표입니다.",
        ruleScoreDefinition: "10번 던져서 더 많이 성공한 사람이 승리",
        rulePreparation: "농구공, 농구대",
        ruleOrder: "1. 자유투 라인에서 번갈아 가며 슛\n2. 각자 10번씩 기회 제공",
        ruleDecision: "골에 들어가면 1점",
        ruleFoul: "라인 밟기 금지",
        ruleExtraInfo: "컨디션 조절 잘 하고 오세요!",
        majorCategory: "기존 스포츠",
        minorCategory: "농구"
      },
      type: "upcoming_game",
      isFriend: true,
      isCompleted: false
    },
    {
      id: "test-3",
      date: "2025-09-20",
      photos: ["https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=400&auto=format&fit=crop"],
      caption: "어제의 열정적인 경기",
      meta: {
        place: "경기 수원시 영통구 월드컵로 789",
        time: "오후 7:00"
      },
      tags: [],
      players: [
        {
          id: 4,
          name: "일반유저1",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop"
        },
        {
          id: 5,
          name: "일반유저2",
          avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop"
        }
      ],
      result: {
        scoreA: 1,
        scoreB: 0,
        winner: "일반유저1",
        sets: 1,
        duration: "30분",
        setScores: [
          { set: 1, scoreA: 5, scoreB: 3 }
        ]
      },
      reviews: [],
      rule: {
        id: 3,
        ruleTitle: "축구 1:1 대결",
        ruleGoal: "정해진 시간 내에 더 많은 골을 넣는 것이 목표입니다.",
        ruleScoreDefinition: "골 1개당 1점, 30분 내 더 많은 점수",
        rulePreparation: "축구공, 골대 2개, 필드",
        ruleOrder: "1. 킥오프로 시작\n2. 골 넣으면 상대방 킥오프\n3. 30분 경기",
        ruleDecision: "공이 골라인을 완전히 넘으면 득점",
        ruleFoul: "손 사용 금지, 거친 태클 금지",
        ruleExtraInfo: "안전한 경기 부탁드립니다!",
        majorCategory: "기존 스포츠",
        minorCategory: "축구"
      },
      type: "game",
      isFriend: false,
      isCompleted: true
    }
  ]
}

export function useFeed() {
  const posts = ref([])
  const currentUser = ref(null)
  const loading = ref(false)
  const hasMore = ref(true)


  // 시간 기반 필터링 - API에서 온 모든 데이터 표시
  const isPostValid = (post) => {
    // 초대 포스트는 항상 유효
    if (post.type === 'invite' || post.type === 'friend-invite') {
      return true
    }

    // 완료된 경기는 항상 유효 (API에서 적절히 필터링해서 보내줌)
    if (post.type === 'game' && post.isCompleted) {
      return true
    }

    // 예정된 경기는 항상 유효 (API에서 적절히 필터링해서 보내줌)
    if (post.type === 'upcoming_game' || (post.type === 'game' && !post.isCompleted)) {
      return true
    }

    return true
  }

  // 정렬된 피드 계산
  const sortedFeed = computed(() => {
    console.log('sortedFeed 계산 중, posts 개수:', posts.value.length)
    const validPosts = posts.value.filter(isPostValid)
    console.log('유효한 포스트 개수:', validPosts.length)

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

    const result = [
      ...friendsCompleted,
      ...friendsScheduled,
    ]

    // 친구 포스트와 일반 포스트 사이에 친구 초대 포스트 삽입
    // 친구 포스트가 있으면 친구 포스트 뒤에, 없으면 일반 포스트 앞에 삽입
    if (allCompleted.length > 0 || allScheduled.length > 0) {
      result.push({
        type: 'friend-invite',
        id: 'friend-invite-section',
        caption: '친구를 초대해보세요!'
      })
    }

    result.push(...invitePost, ...allCompleted, ...allScheduled)

    console.log('최종 sortedFeed 결과:', result.length, '개 포스트')
    return result
  })

  // 피드 로드
  const loadFeed = async () => {
    console.log('loadFeed 시작, 현재 모드:', FEED_MODE)
    loading.value = true
    console.log('loading 상태 설정:', loading.value)

    try {
      if (FEED_MODE === 'test') {
        // 테스트 모드: 더미 데이터 사용
        console.log('테스트 모드: 더미 데이터 사용')
        await new Promise(resolve => setTimeout(resolve, 500)) // 로딩 시뮬레이션
        posts.value = DUMMY_FEED_DATA.items || []
        console.log('더미 데이터 설정 완료:', posts.value.length, '개 포스트')
        console.log('더미 데이터:', DUMMY_FEED_DATA.items)
      } else {
        // 프로덕션 모드: 실제 API 호출
        console.log('프로덕션 모드: API 호출')
        const response = await api.get('/api/feed')
        posts.value = response.data.items || []
        console.log('API 응답 데이터:', response.data.items)
      }
      console.log('유효한 포스트:', posts.value.filter(isPostValid))
    } catch (error) {
      console.error('피드 로드 실패:', error)
      posts.value = []
    } finally {
      console.log('loading 상태 해제 전:', loading.value)
      loading.value = false
      console.log('loading 상태 해제 후:', loading.value)
      console.log('최종 posts 개수:', posts.value.length)
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
    // 초대 포스트 제거 (API 초대와 친구 초대 모두)
    posts.value = posts.value.filter(p => p.type !== 'invite' && p.type !== 'friend-invite')
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
    handleSkipInvite,
    // 모드 정보
    isTestMode: FEED_MODE === 'test',
    currentMode: FEED_MODE
  }
}