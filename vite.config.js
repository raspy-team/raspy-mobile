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
      // 결과 공유 링크·그림 (운영은 vercel.json이 서버로 넘긴다). '/map' 같은 화면 주소는 건드리지 않게 숫자만
      '^/m/\\d+': { target: process.env.VUE_APP_API_URL || 'http://localhost:8080', changeOrigin: true },
    },
  },
})
