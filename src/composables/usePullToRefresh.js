// 목록 맨 위에서 아래로 당기면 새로고침 (터치)
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { feel } from '../utils/feel'

const THRESHOLD = 70

export function usePullToRefresh(onRefresh) {
  const pull = ref(0) // 당긴 거리(px). 표시용
  const refreshing = ref(false)
  let startY = null

  const onStart = (e) => {
    if (window.scrollY > 0 || refreshing.value) return
    startY = e.touches[0].clientY
  }
  const onMove = (e) => {
    if (startY === null) return
    const diff = e.touches[0].clientY - startY
    pull.value = diff > 0 && window.scrollY <= 0 ? Math.min(diff * 0.5, 100) : 0
  }
  const onEnd = async () => {
    if (startY === null) return
    startY = null
    if (pull.value >= THRESHOLD) {
      feel('tap') // 당겨서 새로고침이 걸린 순간
      refreshing.value = true
      pull.value = 48
      try {
        await onRefresh()
      } finally {
        refreshing.value = false
      }
    }
    pull.value = 0
  }

  onMounted(() => {
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onEnd)
  })
  onBeforeUnmount(() => {
    window.removeEventListener('touchstart', onStart)
    window.removeEventListener('touchmove', onMove)
    window.removeEventListener('touchend', onEnd)
  })

  return { pull, refreshing, ready: () => pull.value >= THRESHOLD }
}
