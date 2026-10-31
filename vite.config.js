import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  // .env.local과 Vercel 설정의 VUE_APP_* 이름을 그대로 쓴다. 새로 만드는 값은 VITE_*로
  envPrefix: ['VITE_', 'VUE_APP_'],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 8081,
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true, ws: true },
    },
  },
})
