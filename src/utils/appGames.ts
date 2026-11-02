// 앱 게임 목록(이름표 → 아이콘). 규칙 목록·상세처럼 규칙만 받은 화면이 앱 게임 아이콘을 그릴 때 쓴다. 한 번만 부른다
import { ref } from 'vue'
import { GET } from '@/api/client'

const icons = ref<Record<string, string>>({})
let loading: Promise<void> | null = null

export function useAppGameIcons() {
  if (!loading) {
    loading = GET('/api/app-games')
      .then(({ data }) => {
        icons.value = Object.fromEntries(data.map((g) => [g.key, g.icon]))
      })
      .catch(() => {
        loading = null // 다음에 다시 시도
      })
  }
  return icons
}
