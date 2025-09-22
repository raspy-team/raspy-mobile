import { createRouter, createWebHistory } from 'vue-router'

import Init from "../views/InitView.vue"
import GameList from "../views/game/GameListView.vue"
import Inbox from "../views/InboxView.vue"
import MyGameList from "../views/game/MyGameListView.vue"
import GameChatView from "../views/game/ChatView.vue"
import CreateGame from "../views/game/GameCreateWizard.vue"
import SettingProfile from "../views/profile/SettingProfileView.vue"
import GameComment from "../views/GameCommentView.vue"
import GamePlay from "../views/game/GamePlayView.vue"
import GameResult from "../views/game/GameResultView.vue"
import Profile from "../views/profile/ProfileView.vue"
import NotFoundView from "../views/NotFoundView.vue"
import InstagramShare from "../components/InstagramShare.vue"
import Setting from "../views/SettingView.vue"
import Rule from "../views/RuleView.vue"
import DmRoomList from '../views/DmRoomList.vue'
import OauthCallback from '../views/OauthCallBack.vue'

import GroupUserLogin from "../views/auth/LoginView.vue"
import GroupUserRegister from "../views/admin/GroupUserRegister.vue"
import InviteView from "../views/InviteView.vue"
import InviteDeep from "../views/InviteDeep.vue"
import { isAdmin } from '../utils/auth'

// Admin views (PC 전용 레이아웃/리스트 스켈레톤)
const AdminLayout = () => import('../views/admin/AdminLayout.vue')
const AdminDashboard = () => import('../views/admin/AdminDashboard.vue')
const AdminUsers = () => import('../views/admin/AdminUsers.vue')
const AdminReports = () => import('../views/admin/AdminReports.vue')
const AdminGames = () => import('../views/admin/AdminGames.vue')

const routes = [
  {
    path: '/init',
    component: Init
  },
  {
    path: '/game-list',
    component: GameList
  },
  {
    path: '/',
    component: GameList
  },

  {
    path: '/oauth/callback',
    component: OauthCallback
  },
  {
    path: '/set-profile',
    component: SettingProfile
  },
  {
    path: '/inbox',
    component: Inbox
  },
  {
    path: '/my-games',
    component: MyGameList
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
  // temp
  {
    path: '/insta',
    component: InstagramShare,
  },
  //
    {
    path: '/games/:gameId/comments',
    name: 'GameComments',
    component: GameComment,
    props: true
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
    path: '/invite/:gameId',
    component: InviteView,
  },
  { path: '/profile/:id', component: Profile },

  { path: '/settings', component:  Setting},
  { path: '/rules', component:  Rule},
  { path: '/group/register', component:  GroupUserRegister},
  { path: '/group/login', component: GroupUserLogin},
  {path:'/invite-fall-back/:gameId', component : InviteDeep}, 

  // admin routes
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAdmin: true },
    children: [
      { path: '', component: AdminDashboard, meta: { requiresAdmin: true } },
      { path: 'users', component: AdminUsers, meta: { requiresAdmin: true } },
      { path: 'reports', component: AdminReports, meta: { requiresAdmin: true } },
      { path: 'games', component: AdminGames, meta: { requiresAdmin: true } }
    ]
  },


  
  /**
   * not found view
   */
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFoundView }

]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// admin guard
router.beforeEach((to, from, next) => {
  if (to.meta && to.meta.requiresAdmin) {
    if (isAdmin()) return next()
    return next('/')
  }
  return next()
})

export default router
