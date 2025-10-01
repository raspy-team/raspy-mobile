/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // 다크 모드 활성화 (class 기반)
  content: [
    "./public/index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 다크 테마용 색상 팔레트 예시
        'base-dark': '#18181b', // 배경
        'surface-dark': '#232326',
        'primary-dark': '#fdba74',
        'secondary-dark': '#fb923c',
        'text-dark': '#f3f4f6',
        'card-dark': '#232326',
      },
    },
  },
  plugins: [],
}
