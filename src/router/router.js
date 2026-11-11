import { createRouter, createWebHistory } from 'vue-router'

// 첫 화면(경기 목록)만 바로 싣고, 나머지 화면은 들어갈 때 받는다

const Init = () => import('../views/InitView.vue')
import GameList from "../views/game/GameListView.vue"
const GameChatView = () => import('../views/game/ChatView.vue')
const CreateGame = () => import('../views/game/GameCreateWizard.vue')
const SettingProfile = () => import('../views/profile/SettingProfileView.vue')
const GameComment = () => import('../views/GameCommentView.vue')
const GamePlay = () => import('../views/game/GamePlayView.vue')
const GameResult = () => import('../views/game/GameResultView.vue')
const Profile = () => import('../views/profile/ProfileView.vue')
const NotFoundView = () => import('../views/NotFoundView.vue')
const Setting = () => import('../views/SettingView.vue')
const Rule = () => import('../views/RuleView.vue')
const RuleCreate = () => import('../views/rule/RuleCreateView.vue')
const RuleRanking = () => import('../views/rule/RuleRankingView.vue')
const MyRules = () => import('../views/rule/MyRulesView.vue')
const RuleDetail = () => import('../views/rule/RuleDetailView.vue')
const DmRoomList = () => import('../views/DmRoomList.vue')
const OauthCallback = () => import('../views/OauthCallBack.vue')
const Onboarding = () => import('../views/auth/OnboardingView.vue')
import { useToast } from '../composables/useToast'
import { installOnboardingGuard } from './onboardingGuard'

const GroupUserLogin = () => import('../views/auth/LoginView.vue')
const GroupUserRegister = () => import('../views/admin/GroupUserRegister.vue')

const Feed = () => import('../views/feed/FeedView.vue')
const GameView = () => import('../views/game/GameView.vue')

const AdminDashboard = () => import('../views/admin/AdminDashboard.vue')
const AdminRuleEditRequests = () => import('../views/admin/AdminRuleEditRequestsView.vue')

const routes = [
  {
    path: '/init',
    component: Init
  },
  // 첫 화면은 참가할 수 있는 경기. 피드(남의 경기 결과)는 /feed
  {
    path: '/',
    component: GameList
  },
  { path: '/game-list', redirect: '/' },
  // 개발할 때만: 공통 UI 부품 모음
  ...(import.meta.env.DEV ? [{ path: '/dev/ui', component: () => import('../views/dev/UiGallery.vue') }] : []),

  {
    path: '/oauth/callback',
    component: OauthCallback
  },
  // 약관 동의 + 닉네임·지역 (가입 직후, 또는 설정을 끝내지 않고 들어온 사람)
  { path: '/welcome', component: Onboarding },
  {
    path: '/set-profile',
    component: SettingProfile
  },
  {
    path: '/game',
    component: GameView
  },
  {
    path: '/chat/:targetUserId',
    component: GameChatView,
    props: true
  },
  {
    path: '/dm',
    component: DmRoomList,  
  },
  {
    path: '/create-game',
    component: CreateGame,
  },
  //
    {
    path: '/games/:gameId/comments',
    name: 'GameComments',
    component: GameComment,
    // 댓글 시트는 id를 받는다. 주소로 바로 들어와도 열리게 넘겨준다
    props: (route) => ({ id: route.params.gameId })
  },
    {
    path: '/games/:gameId/play',
    component: GamePlay,
    props: true
  },
  {
    path: '/games/:gameId/result',
    component: GameResult,
    props: true
  },
  // 옛 초대 링크(/invite/…, /invite-fall-back/…)는 뺐다: 지금 코드·서버가 만들지 않고, 링크 속 경기는 이미 끝났다 (목적 판정 11/11 부분 1)
  { path: '/profile/:id/stats', component: () => import('../views/profile/RecordView.vue') },
  // 능력·종합 순위 (kind: OVERALL·GROUP·ABILITY, key: ALL·BODY·능력 이름)
  { path: '/rankings/:kind/:key', component: () => import('../views/profile/ScopeRankingView.vue') },
  { path: '/profile/:id', component: Profile },

  { path: '/settings', component:  Setting},
  // 동네 인증·범위 (docs/direction.md '동네')
  { path: '/neighborhood', component: () => import('../views/NeighborhoodView.vue') },
  { path: '/settings/notifications', component: () => import('../views/settings/NotificationSettingsView.vue') },
  { path: '/settings/organizations', component: () => import('../views/settings/OrganizationsView.vue') },
  { path: '/settings/privacy', component: () => import('../views/settings/PrivacySettingsView.vue') },
  // 인기 게임 아이디·티어 (9번, 11/6)
  { path: '/settings/game-accounts', component: () => import('../views/settings/GameAccountsView.vue') },
  { path: '/notifications', component: () => import('../views/inbox/NotificationsView.vue') },
  { path: '/games', component: () => import('../views/play/GameCatalogView.vue') },
  // 동호회 (club/): 목록·만들기, 한 곳, 초대 링크
  { path: '/clubs', component: () => import('../views/club/ClubListView.vue') },
  { path: '/clubs/matches/:matchId', component: () => import('../views/club/ClubMatchView.vue'), meta: { keepOnQuery: true } },
  { path: '/clubs/:id', component: () => import('../views/club/ClubView.vue') },
  { path: '/club/join/:code', component: () => import('../views/club/ClubJoinView.vue') },
  // 대회 (tournament/): 리그·토너먼트
  { path: '/tournaments', component: () => import('../views/tournament/TournamentListView.vue') },
  { path: '/tournaments/:id', component: () => import('../views/tournament/TournamentView.vue') },
  // 만나서 하는 경기 중계 (live/): 점수·응원·반응. 앱 게임 관전은 /watch
  { path: '/live/:gameId', component: () => import('../views/live/LiveWatchView.vue') },
  // 위치 공유 링크 (안전·신뢰 C): 받은 친구가 로그인 없이 본다
  { path: '/s/:token', component: () => import('../views/safety/ShareView.vue') },
  // 지도 (안전·신뢰 G): 모집 중인 경기와 끝난 경기의 장소
  { path: '/map', component: () => import('../views/safety/MapView.vue') },
  // 휴대폰 본인인증 (안전·신뢰 H): 만나서 하는 경기 전에 한 번
  { path: '/verify', component: () => import('../views/safety/VerifyView.vue') },
  { path: '/games/:gameId(\\d+)', component: () => import('../views/game/OpenGameView.vue') },
  // 팀 경기 단톡방 (11/5 C)
  { path: '/games/:gameId(\\d+)/chat', component: () => import('../views/game/TeamChatView.vue') },
  // 가입 없이 한 판 (로그인 전, 허용된 게임만: utils/guestGames)
  // 상대 구하기 등록 (H2, 가입 전). /try/:key보다 먼저
  { path: '/try/partner', component: () => import('../views/play/PartnerTryView.vue') },
  { path: '/try/:key', component: () => import('../views/play/GuestPlayView.vue') },
  { path: '/play/:key', component: () => import('../views/play/AppGameView.vue') },
  // 광장 (11/5): 앱 게임을 2D 로비로. 처음 들어오면 기본 꾸미기부터
  { path: '/plaza', component: () => import('../views/plaza/PlazaView.vue') },
  { path: '/plaza/avatar', component: () => import('../views/plaza/AvatarEditView.vue') },
  { path: '/play/:key/live', component: () => import('../views/play/RealtimeView.vue') },
  { path: '/play/:key/battle', component: () => import('../views/play/BattleView.vue') },
  { path: '/play/:key/board', component: () => import('../views/play/SharedBoardView.vue') },
  { path: '/watch/:gameId', component: () => import('../views/play/WatchView.vue') },
  { path: '/vote/:gameId', component: () => import('../views/play/VoteView.vue') },
  { path: '/challenge/:gameId', component: () => import('../views/play/ChallengeView.vue') },
  { path: '/rules', component:  Rule, meta: { keepOnQuery: true } },
  { path: '/rules/create', component: RuleCreate},
  { path: '/rules/my-rules', component: MyRules},
  // 수정은 만들기 화면을 그대로 쓴다 (수정 요청으로 보낸다)
  { path: '/rules/edit/:id', component: RuleCreate, props: (r) => ({ editId: Number(r.params.id) }) },
  { path: '/rules/:ruleId(\\d+)', component: RuleDetail },
  { path: '/rules/:ruleId/ranking', component: RuleRanking, props: true},
  { path: '/group/register', component:  GroupUserRegister},
  { path: '/password-reset', component: () => import('../views/auth/PasswordResetView.vue'), meta: { keepOnQuery: true } },
  { path: '/group/login', component: GroupUserLogin, meta: { keepOnQuery: true } },
  { path: '/feed', component: Feed},

  // Admin routes
  { path: '/admin', component: AdminDashboard},
  { path: '/admin/rule-edit-requests', component: AdminRuleEditRequests},
  { path: '/admin/organizations', component: () => import('../views/admin/AdminOrganizationsView.vue') },


  /**
   * not found view
   */
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFoundView }

]

const router = createRouter({
  history: createWebHistory(),
  routes
})

installOnboardingGuard(router)

// 화면 파일(나눠 받는 조각)을 못 받으면 누른 탭이 아무 반응 없이 멈췄다 (11/4 밤샘).
// 끊겼으면 연결을 확인하라고 알리고, 연결돼 있는데 못 받으면 새로 배포돼 옛 조각이 사라진 것이라 그 화면으로 한 번 새로 연다
// 크롬·사파리·파이어폭스의 조각 실패, 그리고 Vite가 조각의 CSS를 미리 받다 실패할 때 (리뷰 D)
const CHUNK_ERROR = /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS/i
router.onError((error, to) => {
  if (!CHUNK_ERROR.test(String(error?.message || error))) return
  if (!navigator.onLine) {
    useToast().showToast('인터넷 연결을 확인해 주세요')
    return
  }
  const key = `chunk_reload_${to.fullPath}`
  try {
    // 한 번 새로 열었는데도 안 되면 되풀이하지 않는다. 대신 말없이 멈추지 않게 알린다 (목적 판정 11/11 부분 1)
    if (sessionStorage.getItem(key)) {
      useToast().showToast('화면을 불러오지 못했어요. 다시 눌러 주세요')
      sessionStorage.removeItem(key)
      return
    }
    sessionStorage.setItem(key, '1')
  } catch {
    return
  }
  // 같은 사이트 안으로 묶는다 ('//다른곳'으로 시작하는 주소가 밖으로 나가지 않게)
  window.location.assign(window.location.origin + to.fullPath)
})
// 제대로 열렸으면 표시를 지운다. 탭을 켜 둔 사이 배포가 또 있어도 다시 한 번 새로 열 수 있게 (리뷰 D)
router.afterEach((to) => {
  try {
    sessionStorage.removeItem(`chunk_reload_${to.fullPath}`)
  } catch {
    // 저장소를 못 쓰면 그대로
  }
})

export default router
