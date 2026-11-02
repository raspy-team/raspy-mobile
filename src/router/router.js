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
import { installOnboardingGuard } from './onboardingGuard'

const GroupUserLogin = () => import('../views/auth/LoginView.vue')
const GroupUserRegister = () => import('../views/admin/GroupUserRegister.vue')
const InviteView = () => import('../views/InviteView.vue')
const InviteDeep = () => import('../views/InviteDeep.vue')

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
  {
    path: '/invite/:encodedUrl',
    component: InviteView,
  },
  { path: '/profile/:id/stats', component: () => import('../views/profile/RecordView.vue') },
  { path: '/profile/:id', component: Profile },

  { path: '/settings', component:  Setting},
  // 동네 인증·범위 (docs/direction.md '동네')
  { path: '/neighborhood', component: () => import('../views/NeighborhoodView.vue') },
  { path: '/settings/notifications', component: () => import('../views/settings/NotificationSettingsView.vue') },
  { path: '/notifications', component: () => import('../views/inbox/NotificationsView.vue') },
  { path: '/games', component: () => import('../views/play/GameCatalogView.vue') },
  { path: '/games/:gameId(\\d+)', component: () => import('../views/game/OpenGameView.vue') },
  { path: '/play/:key', component: () => import('../views/play/AppGameView.vue') },
  { path: '/play/:key/live', component: () => import('../views/play/RealtimeView.vue') },
  { path: '/vote/:gameId', component: () => import('../views/play/VoteView.vue') },
  { path: '/challenge/:gameId', component: () => import('../views/play/ChallengeView.vue') },
  { path: '/rules', component:  Rule},
  { path: '/rules/create', component: RuleCreate},
  { path: '/rules/my-rules', component: MyRules},
  // 수정은 만들기 화면을 그대로 쓴다 (수정 요청으로 보낸다)
  { path: '/rules/edit/:id', component: RuleCreate, props: (r) => ({ editId: Number(r.params.id) }) },
  { path: '/rules/:ruleId(\\d+)', component: RuleDetail },
  { path: '/rules/:ruleId/ranking', component: RuleRanking, props: true},
  { path: '/group/register', component:  GroupUserRegister},
  { path: '/group/login', component: GroupUserLogin},
  {path:'/invite-fall-back/:encodedUrl', component : InviteDeep},
  { path: '/feed', component: Feed},

  // Admin routes
  { path: '/admin', component: AdminDashboard},
  { path: '/admin/rule-edit-requests', component: AdminRuleEditRequests},


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

export default router
