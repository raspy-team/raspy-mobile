import { createRouter, createWebHistory } from 'vue-router'
import Init from '../views/InitView.vue'

const routes = [
  {
    path: '/init',
    name: 'Init',
    component: Init
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
