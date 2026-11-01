/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors')

// 매치 색 체계 (2026-11-01 새로 만듦). Tailwind 기본 팔레트를 쓰지 않는다.
// - 바탕은 흑백(잉크). 순검정·순백은 대비가 너무 세서 OLED에서 번지므로 아주 조금 띄운다
// - 주 버튼은 흰 바탕 + 검은 글씨. 색으로 강조하지 않고 명도로 강조한다
// - 색은 '시그널(볼트)' 하나뿐이고 작게만 쓴다: 승리, 진행 중, 안 읽음, 챔피언
// - 빨강은 위험(삭제·신고·오류)에만
const ink = {
  50: '#f7f7f8',
  100: '#ededef', // 본문 글자
  200: '#d4d4d8',
  300: '#b4b4bb',
  400: '#a0a0a8', // 보조 글자
  500: '#8b8b93', // 약한 글자 (카드 위에서도 대비 4.5:1 이상)
  600: '#5c5c64',
  700: '#2c2c31', // 강한 선
  800: '#1f1f23', // 선, 눌린 상태
  850: '#19191c', // 입력칸, 카드 안의 칸
  900: '#111113', // 카드·시트
  950: '#0a0a0b', // 화면 바탕
}
const volt = '#d2ff4d'

module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    // 모서리: 작은 것(칩·배지) 8px, 버튼·입력칸·카드 12px, 시트 16px, 원
    borderRadius: {
      none: '0',
      sm: '6px',
      DEFAULT: '8px',
      md: '8px',
      lg: '12px',
      xl: '12px',
      '2xl': '16px',
      '3xl': '16px',
      full: '9999px',
    },
    // 그림자 없이 평평하게. 층은 바탕 밝기로 나눈다 (선은 아껴 쓴다)
    boxShadow: {
      sm: 'none', DEFAULT: 'none', md: 'none', lg: 'none', xl: 'none', '2xl': 'none', inner: 'none', none: 'none',
    },
    fontFamily: {
      // 라틴·숫자는 Geist, 한글은 Pretendard가 받는다
      sans: ['Geist', '"Pretendard Variable"', 'Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      mono: ['"Geist Mono"', '"Pretendard Variable"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
    },
    // 굵기는 아껴 쓴다. 예전 화면의 font-bold(700)가 많아 한 단계 가볍게(620) 받아준다
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '620',
      extrabold: '680',
      black: '700',
    },
    extend: {
      borderColor: { DEFAULT: ink[800] },
      zIndex: {
        header: '30',
        nav: '40',
        sheet: '50',
        dialog: '60',
        toast: '70',
      },
      colors: {
        // 의미 이름 토큰. 화면은 이 이름만 쓴다 (bg-surface, text-fg-muted, bg-primary ...)
        canvas: ink[950],
        surface: ink[900],
        'surface-2': ink[850],
        'surface-3': ink[800],
        line: ink[800],
        'line-strong': ink[700],
        fg: ink[100],
        'fg-muted': ink[400],
        'fg-subtle': ink[500],
        // 주 행동: 흰 바탕 + 검은 글씨
        primary: { DEFAULT: ink[100], press: ink[300], soft: 'rgba(237,237,239,0.08)', fg: ink[100], on: ink[950] },
        signal: { DEFAULT: volt, soft: 'rgba(210,255,77,0.12)', fg: volt, on: ink[950] },
        danger: { DEFAULT: '#ff5c5c', soft: 'rgba(255,92,92,0.12)', fg: '#ff7a7a' },
        // '완료·승리'는 시그널 색으로
        success: { DEFAULT: volt, soft: 'rgba(210,255,77,0.12)', fg: volt },

        // 옛 화면에 남은 색 이름은 잉크로 모은다 (주황·파랑·보라가 다시 새어 나오지 않게)
        ink,
        gray: ink,
        neutral: ink,
        slate: ink,
        zinc: ink,
        orange: ink,
        amber: ink,
        pink: ink,
        rose: colors.red,
        fuchsia: ink,
        purple: ink,
        violet: ink,
        indigo: ink,
        blue: ink,
        sky: ink,
      },
    },
  },
  plugins: [],
}
