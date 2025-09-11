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

import Feed from "../views/feed/FeedView.vue"

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
    component: Feed
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
  { path: '/feed', component: Feed},


  
  /**
   * not found view
   */
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFoundView }

]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
