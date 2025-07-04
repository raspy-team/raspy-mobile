import { createApp } from 'vue'
import App from './App.vue'
import './assets/tailwind.css'
import router from './router/router.js'
import  { setRouter } from './api/api'
setRouter(router) // api.js에 router 주입

createApp(App)
  .use(router) 
  .mount('#app')