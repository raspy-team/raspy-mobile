/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors')

// 브랜드 색은 주황 하나. 화면마다 섞여 있던 보라·분홍·파랑 계열을 주황으로 모은다.
// 빨강(패배·삭제), 초록(승리·완료), 노랑(금메달)은 의미가 있는 색이라 그대로 둔다.
const brand = colors.orange

module.exports = {
  content: [
    "./public/index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gray: colors.neutral,
        slate: colors.neutral,
        amber: brand,
        pink: brand,
        rose: brand,
        fuchsia: brand,
        purple: brand,
        violet: brand,
        indigo: brand,
        blue: brand,
        sky: brand,
      },
    },
  },
  plugins: [
    function({ addBase }) {
      addBase({
        // 기본 폰트 크기
        'html': {
          fontSize: '16px',
        },
        // 작은 화면 (너비 360px 미만, 예: 구형 안드로이드)
        '@media (max-width: 300px)': {
          'html': {
            fontSize: '8px', // 87.5%
          },
        },
        // 작은 화면 (너비 360px 미만, 예: 구형 안드로이드)
        '@media (max-width: 359px)': {
          'html': {
            fontSize: '13px', // 87.5%
          },
        },
        // 일반 소형 화면 (360px~374px, 예: iPhone SE, 갤럭시 A 시리즈)
        '@media (min-width: 360px) and (max-width: 374px)': {
          'html': {
            fontSize: '13px', // 93.75%
          },
        },
        // 세로가 매우 긴 화면 (aspect ratio 19.5:9 이상, 예: 갤럭시 S 시리즈)
        '@media (min-aspect-ratio: 19.5/9)': {
          'html': {
            fontSize: '13px', // 약 90%
          },
        },
        // 극단적으로 긴 화면 (aspect ratio 20:9 이상, 예: 최신 플래그십 폰)
        '@media (min-aspect-ratio: 20/9)': {
          'html': {
            fontSize: '12.5px', // 약 84%
          },
        },
        // 태블릿 (너비 768px 이상)
        '@media (min-width: 768px)': {
          'html': {
            fontSize: '20px', // 태블릿은 오히려 키움
          },
        },
      })
    },
  ],
}
