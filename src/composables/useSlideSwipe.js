// 한 게시물 안에서 사진·경기 정보·랭킹을 좌우로 넘기는 제스처 (터치·마우스 공통). 두 번 탭하면 onDoubleTap
import { ref, computed } from 'vue'
import { isOnControl, findScrollable, tryVibrate, SNAP_TRANSITION } from './swipe'

/**
 * @param {object} o
 * @param {import('vue').Ref<number>} o.total 슬라이드 수
 * @param {() => void} o.onDoubleTap
 */
export function useSlideSwipe({ total, onDoubleTap }) {
  const currentSlide = ref(0)
  const translateX = ref(0)
  const animating = ref(false)

  let isDown = false
  let startX = 0
  let startY = 0
  let dx = 0
  let dy = 0
  let isVertical = false
  let startedAt = 0
  let scrollEl = null
  let lastTapAt = 0

  const wrapperStyle = computed(() => ({
    width: total.value * 100 + 'vw',
    transform: `translateX(calc(${-currentSlide.value * 100}vw + ${translateX.value}px))`,
    transition: animating.value ? SNAP_TRANSITION : 'none',
    willChange: 'transform',
  }))

  function start(x, y, target) {
    startX = x
    startY = y
    dx = 0
    dy = 0
    isVertical = false
    animating.value = false
    scrollEl = findScrollable(target)
    isDown = true
    startedAt = Date.now()
  }

  function move(x, y) {
    if (!isDown) return
    dx = x - startX
    dy = y - startY
    // 세로가 우세하거나 스크롤 영역 안이면 가로로 넘기지 않는다
    if (!isVertical && ((Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 4) || scrollEl)) isVertical = true
    if (isVertical) {
      translateX.value = 0
      return
    }
    const atEdge = (currentSlide.value === 0 && dx > 0) || (currentSlide.value === total.value - 1 && dx < 0)
    translateX.value = atEdge ? dx * 0.35 : dx
  }

  function commitSlide(dir) {
    animating.value = true
    translateX.value = 0
    // 다음 프레임에 번호를 바꿔야 전환 애니메이션이 깔끔하다
    requestAnimationFrame(() => {
      const before = currentSlide.value
      currentSlide.value = Math.max(0, Math.min(currentSlide.value + dir, total.value - 1))
      if (currentSlide.value !== before) tryVibrate(10)
    })
  }

  function end(target, tapTolerance) {
    if (!isDown) return
    const threshold = Math.floor(window.innerWidth * 0.12)
    const velocityX = dx / Math.max(1, Date.now() - startedAt) // px/ms
    if (!isVertical && (Math.abs(dx) > threshold || Math.abs(velocityX) > 0.25)) {
      commitSlide(dx < 0 ? 1 : -1)
    } else {
      // 거의 안 움직였으면 탭. 260ms 안에 두 번이면 두 번 탭
      const still = Math.abs(dx) <= tapTolerance && Math.abs(dy) <= tapTolerance
      if (still && !isOnControl(target)) {
        const now = Date.now()
        if (now - lastTapAt < 260) {
          onDoubleTap()
          lastTapAt = 0
        } else {
          lastTapAt = now
        }
      }
      animating.value = true
      translateX.value = 0
    }
    setTimeout(() => {
      animating.value = false
    }, 380)
    isDown = false
  }

  return {
    currentSlide,
    wrapperStyle,
    onTouchStart: (e) => start(e.touches[0].clientX, e.touches[0].clientY, e.target),
    onTouchMove: (e) => move(e.touches[0].clientX, e.touches[0].clientY),
    onTouchEnd: (e) => end(e?.target, 10),
    onMouseDown: (e) => !isOnControl(e.target) && start(e.clientX, e.clientY, e.target),
    onMouseMove: (e) => move(e.clientX, e.clientY),
    onMouseUp: (e) => end(e?.target, 6),
  }
}
