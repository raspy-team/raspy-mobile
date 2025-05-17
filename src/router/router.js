import { createRouter, createWebHistory } from 'vue-router'

import Login from '../views/auth/LoginView.vue'
import Register from "../views/auth/RegisterView.vue"

import GameList from "../views/game/GameListView.vue"
import Inbox from "../views/InboxView.vue"
import UpcomingGames from "../views/game/UpcomingGameListView.vue"
import GameChatView from "../views/game/ChatView.vue"
import CreateGame from "../views/game/CreateGameView.vue"
import SettingProfile from "../views/profile/SettingProfileView.vue"

const routes = [
  {
    path: '/game-list',
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
    path: '/upcoming-games',
    component: UpcomingGames
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
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
