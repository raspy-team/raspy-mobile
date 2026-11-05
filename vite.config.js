import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

// 카카오 지도 JavaScript 키: 로컬은 작업 폴더마다 .env.local을 만들지 않아도 되게 ~/.config/match/kakao_js_key 한 곳에서 읽는다.
// Vite는 이 파일을 실행한 뒤에 환경변수를 모으므로 여기서 넣으면 import.meta.env에 들어간다. 운영(Vercel)은 환경변수가 그대로 이긴다
const kakaoKeyFile = join(homedir(), '.config/match/kakao_js_key')
if (!process.env.VUE_APP_KAKAO_JS_KEY && existsSync(kakaoKeyFile)) {
  process.env.VUE_APP_KAKAO_JS_KEY = readFileSync(kakaoKeyFile, 'utf8').trim()
}

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
