import { createRouter, createWebHistory } from 'vue-router'

import Login from '../views/auth/LoginView.vue'
import Register from "../views/auth/RegisterView.vue"

import GameList from "../views/game/GameListView.vue"
import Inbox from "../views/InboxView.vue"
import MyGameList from "../views/game/MyGameListView.vue"
import GameChatView from "../views/game/ChatView.vue"
import CreateGame from "../views/game/CreateGameView.vue"
import SettingProfile from "../views/profile/SettingProfileView.vue"
import GameComment from "../views/GameCommentView.vue"
import GamePlay from "../views/game/GamePlayView.vue"
import GameResult from "../views/game/GameResultView.vue"
import Profile from "../views/profile/ProfileView.vue"

const routes = [
  {
    path: '/game-list',
    component: GameList
  },
  {
    path: '/',
    component: GameList
  },

  {
    path: '/login',
    component: Login
  },
  {
    path: '/register',
    component: Register
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
    path: '/chat/:gameId',
    component: GameChatView,
    props: true
  },
  {
    path: '/create-game',
    component: CreateGame,
  },
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
  { path: '/profile/:id', component: Profile },
  
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
