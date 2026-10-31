/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors')

// 브랜드 색은 주황 하나이고, 화면의 주 행동과 켜진 탭에만 쓴다.
// 보조로 쓰이던 파랑·보라·분홍 계열은 무채색으로 모아 주 행동과 다투지 않게 한다.
// 빨강(패배·삭제), 초록(승리·완료), 노랑(금메달)은 의미가 있는 색이라 그대로 둔다.
const brand = colors.orange
const quiet = colors.neutral

module.exports = {
  content: [
    "./public/index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    // 모서리는 두 가지뿐: 작은 것(칩·입력칸) 8px, 나머지(카드·버튼·모달) 12px, 그리고 원
    borderRadius: {
      none: '0',
      sm: '8px',
      DEFAULT: '8px',
      md: '8px',
      lg: '12px',
      xl: '12px',
      '2xl': '12px',
      '3xl': '12px',
      full: '9999px',
    },
    // 그림자 없이 평평하게. 층은 배경 밝기와 테두리로 나눈다
    boxShadow: {
      sm: 'none', DEFAULT: 'none', md: 'none', lg: 'none', xl: 'none', '2xl': 'none', inner: 'none', none: 'none',
    },
    extend: {
      // 'border'만 쓴 곳의 기본 선 색. 검은 바탕에 맞춘다
      borderColor: { DEFAULT: colors.neutral[800] },
      colors: {
        gray: colors.neutral,
        slate: colors.neutral,
        amber: brand,
        rose: colors.red,
        pink: quiet,
        fuchsia: quiet,
        purple: quiet,
        violet: quiet,
        indigo: quiet,
        blue: quiet,
        sky: quiet,
      },
    },
  },
  plugins: [],
}
