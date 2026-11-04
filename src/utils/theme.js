// 화면 모드: 'dark'(기본) · 'light'. index.html이 첫 화면 전에 같은 값을 적용한다
// 11/5 고병연: 다크가 기본, 라이트는 설정에서 고른다. '기기 설정 따르기'는 뺐다
// (예전에 'system'을 고른 사람은 저장값이 없어 다크로 보인다)
import { ref } from 'vue'

const KEY = 'match_theme'
// 상단 막대(브라우저·홈 화면 앱) 색. tailwind.css의 --c-canvas와 같게
const BAR = { dark: '#121214', light: '#f7f7f5' }

const read = () => {
  try {
    return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

export const theme = ref(read())

export const THEME_OPTIONS = [
  { value: 'dark', label: '다크' },
  { value: 'light', label: '라이트' },
]

export function setTheme(value) {
  const v = value === 'light' ? 'light' : 'dark'
  theme.value = v
  document.documentElement.dataset.theme = v
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BAR[v])
  try {
    if (v === 'light') localStorage.setItem(KEY, 'light')
    else localStorage.removeItem(KEY)
  } catch {
    // 저장이 막힌 브라우저면 이번 방문 동안만 적용
  }
}
