/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors')

// 브랜드 색은 주황 하나이고, 화면의 주 행동과 켜진 탭에만 쓴다.
// 보조로 쓰이던 파랑·보라·분홍 계열은 무채색으로 모아 주 행동과 다투지 않게 한다.
// 빨강(패배·삭제), 초록(승리·완료), 노랑(금메달)은 의미가 있는 색이라 그대로 둔다.
const brand = colors.orange
const quiet = colors.neutral

module.exports = {
  content: [
    "./index.html",
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
      // 겹치는 층의 순서. 숫자를 직접 쓰지 말고 이 이름으로 쓴다 (z-header, z-sheet ...)
      zIndex: {
        header: '30',
        nav: '40',
        sheet: '50',
        dialog: '60',
        toast: '70',
      },
      colors: {
        // 의미 이름 토큰. 새 코드는 이 이름만 쓴다 (bg-surface, text-fg-muted, bg-primary ...)
        canvas: '#000000', // 화면 바탕
        surface: colors.neutral[900], // 카드·시트
        'surface-2': colors.neutral[800], // 카드 안의 칸, 눌린 상태, 보조 버튼
        line: colors.neutral[800], // 구분선·테두리
        'line-strong': colors.neutral[700],
        fg: '#ffffff', // 본문 글자
        'fg-muted': colors.neutral[400], // 보조 글자
        'fg-subtle': '#8c8c8c', // 더 약한 글자 (시간, 개수). 카드 위에서도 대비 4.5:1을 넘게 neutral-500보다 조금 밝다
        // on: 주황 바탕 위의 글자. 흰 글자는 대비가 2.8:1이라 읽기 어렵다 (검은 글자는 7:1)
        primary: { DEFAULT: brand[500], press: brand[600], soft: 'rgba(249,115,22,0.15)', fg: brand[400], on: '#0a0a0a' },
        danger: { DEFAULT: colors.red[500], soft: 'rgba(239,68,68,0.15)', fg: colors.red[400] },
        success: { DEFAULT: colors.green[500], soft: 'rgba(34,197,94,0.15)', fg: colors.green[400] },

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
