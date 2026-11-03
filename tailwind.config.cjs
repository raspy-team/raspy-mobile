/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors')

// 매치 색 체계 (2026-11-01). Tailwind 기본 팔레트를 쓰지 않는다.
// - 라이트·다크 두 벌. 값은 src/assets/tailwind.css의 CSS 변수(--c-*)에 있고, 기본은 폰 설정을 따른다
// - 바탕은 흑백(잉크). 주 버튼은 글자색 바탕(라이트=검정, 다크=흰색)
// - 색은 '시그널(볼트)' 하나. 칠할 때는 signal, 글자·아이콘은 signal-fg(라이트에서는 읽히게 어둡게)
// - 빨강은 위험(삭제·신고·오류)에만
const v = (name) => `rgb(var(--c-${name}) / <alpha-value>)`

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
      // 예전 'mono'(Geist Mono)는 빗금 0·고정폭이라 개발 도구처럼 보였다 (11/3 디자인 리뷰). 숫자는 Geist 그대로, 표 숫자(tabular-nums)로 자리만 맞춘다
      mono: ['Geist', '"Pretendard Variable"', 'Pretendard', '-apple-system', 'system-ui', 'sans-serif'],
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
      borderColor: { DEFAULT: v('line') },
      zIndex: {
        header: '30',
        nav: '40',
        sheet: '50',
        dialog: '60',
        toast: '70',
      },
      colors: {
        // 의미 이름 토큰. 화면은 이 이름만 쓴다 (bg-surface, text-fg-muted, bg-primary ...)
        canvas: v('canvas'),
        surface: v('surface'),
        'surface-2': v('surface-2'),
        'surface-3': v('surface-3'),
        line: v('line'),
        'line-strong': v('line-strong'),
        fg: v('fg'),
        'fg-muted': v('fg-muted'),
        'fg-subtle': v('fg-subtle'),
        primary: { DEFAULT: v('fg'), press: v('primary-press'), soft: 'rgb(var(--c-fg) / 0.08)', fg: v('fg'), on: v('canvas') },
        signal: { DEFAULT: v('signal'), soft: 'rgb(var(--c-signal) / var(--signal-soft))', fg: v('signal-fg'), on: v('signal-on') },
        danger: { DEFAULT: v('danger'), soft: 'rgb(var(--c-danger) / 0.12)', fg: v('danger-fg') },
        success: { DEFAULT: v('signal'), soft: 'rgb(var(--c-signal) / var(--signal-soft))', fg: v('signal-fg') },

        // 옛 화면에 남은 색 이름은 잉크(의미 토큰)로 모은다
        gray: { 100: v('fg'), 300: v('line-strong'), 400: v('fg-muted'), 500: v('fg-subtle'), 600: v('fg-subtle'), 700: v('line-strong'), 800: v('surface-3'), 900: v('surface') },
        rose: colors.red,
      },
    },
  },
  plugins: [],
}
