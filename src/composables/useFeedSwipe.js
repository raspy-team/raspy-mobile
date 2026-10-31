// 피드를 위아래로 넘기는 제스처 (터치·마우스 공통)
import { ref, computed } from 'vue'
import { isOnControl, findScrollable, SNAP_TRANSITION } from './swipe'

/**
 * @param {object} o
 * @param {import('vue').Ref<number>} o.index 지금 보고 있는 게시물 번호
 * @param {import('vue').Ref<number>} o.count 게시물 수
 * @param {(next: number) => void} o.onChange 넘김이 끝났을 때 새 번호로 바꾼다
 */
export function useFeedSwipe({ index, count, onChange }) {
  const feedIsPointerDown = ref(false)
  const feedAnimating = ref(false)
  const feedTranslateY = ref(0)

  let startX = 0
  let startY = 0
  let dx = 0
  let dy = 0
  let isVertical = false
  let startedAt = 0
  let scrollEl = null
  let direction = 0 // 1: 다음, -1: 이전, 0: 제자리

  const screenH = () => (typeof window !== 'undefined' ? window.innerHeight : 800)
  const slideStyle = (offset) => ({
    transform: `translateY(${offset + feedTranslateY.value}px)`,
    transition: feedAnimating.value ? SNAP_TRANSITION : 'none',
    willChange: 'transform',
  })
  const feedWrapperStyle = computed(() => slideStyle(0))
  const nextPreviewStyle = computed(() => slideStyle(screenH()))
  const prevPreviewStyle = computed(() => slideStyle(-screenH()))

  function start(x, y, target) {
    // 넘어가는 애니메이션 중에는 새 제스처를 받지 않는다
    if (feedAnimating.value) return
    startX = x
    startY = y
    dx = 0
    dy = 0
    isVertical = false
    feedIsPointerDown.value = true
    startedAt = Date.now()
    scrollEl = findScrollable(target)
    direction = 0
    feedTranslateY.value = 0
  }

  function move(x, y) {
    if (!feedIsPointerDown.value) return
    dx = x - startX
    dy = y - startY
    if (!isVertical) {
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 6 && !scrollEl) isVertical = true
      // 가로가 우세하면 사진 슬라이드에 넘긴다
      if (Math.abs(dx) > Math.abs(dy) + 6) {
        feedIsPointerDown.value = false
        isVertical = false
        feedTranslateY.value = 0
        return
      }
    }
    if (isVertical && !scrollEl) {
      // 처음·끝에서는 덜 끌려오게
      const atEdge = (index.value === 0 && dy > 0) || (index.value === count.value - 1 && dy < 0)
      feedTranslateY.value = atEdge ? dy * 0.35 : dy
    }
  }

  function snapTo(dir, y) {
    feedAnimating.value = true
    direction = dir
    requestAnimationFrame(() => {
      feedTranslateY.value = y
    })
  }

  function end(target) {
    if (!feedIsPointerDown.value) return
    const threshold = Math.floor(screenH() * 0.08)
    const velocityY = (dy / Math.max(1, Date.now() - startedAt)) * 1000 // px/s
    const moved = Math.abs(dy) > threshold || Math.abs(velocityY) > 300
    const vertical = Math.abs(dy) > Math.abs(dx)

    if (vertical && moved && !isOnControl(target, { allowSwipeAttr: true })) {
      if (dy < 0 && index.value < count.value - 1) snapTo(1, -screenH())
      else if (dy > 0 && index.value > 0) snapTo(-1, screenH())
      else snapTo(0, 0)
    } else {
      snapTo(0, 0)
    }
    feedIsPointerDown.value = false
    isVertical = false
    scrollEl = null
  }

  function onFeedSnapTransitionEnd(e) {
    if (!feedAnimating.value) return
    if (e && e.target !== e.currentTarget) return
    if (direction !== 0) onChange(index.value + direction)
    // 넘긴 뒤에는 애니메이션 없이 제자리로
    feedAnimating.value = false
    direction = 0
    feedTranslateY.value = 0
  }

  return {
    feedIsPointerDown,
    feedAnimating,
    feedWrapperStyle,
    nextPreviewStyle,
    prevPreviewStyle,
    onFeedSnapTransitionEnd,
    onFeedTouchStart: (e) => e.touches?.[0] && start(e.touches[0].clientX, e.touches[0].clientY, e.target),
    onFeedTouchMove: (e) => e.touches?.[0] && move(e.touches[0].clientX, e.touches[0].clientY),
    onFeedTouchEnd: (e) => end(e?.target),
    onFeedMouseDown: (e) => !isOnControl(e.target) && start(e.clientX, e.clientY, e.target),
    onFeedMouseMove: (e) => move(e.clientX, e.clientY),
    onFeedMouseUp: (e) => end(e?.target),
  }
}
