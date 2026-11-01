// 화면 모드: 'system'(폰 설정을 따름) · 'light' · 'dark'. index.html이 첫 화면 전에 같은 값을 적용한다
import { ref } from 'vue'

const KEY = 'match_theme'
const read = () => {
  try {
    const t = localStorage.getItem(KEY)
    return t === 'light' || t === 'dark' ? t : 'system'
  } catch {
    return 'system'
  }
}

export const theme = ref(read())

export const THEME_OPTIONS = [
  { value: 'system', label: '기기 설정 따르기' },
  { value: 'light', label: '라이트' },
  { value: 'dark', label: '다크' },
]

export function setTheme(value) {
  theme.value = value
  const root = document.documentElement
  if (value === 'system') delete root.dataset.theme
  else root.dataset.theme = value
  try {
    if (value === 'system') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, value)
  } catch {
    // 저장이 막힌 브라우저면 이번 방문 동안만 적용
  }
}
