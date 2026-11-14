// 글 쓰는 화면을 키보드에 맞춘다: 판 머리부터 보이게 올리되, 내는 버튼이 키보드에 가려지면 버튼이 보일 만큼 더 올린다.
// 11/14 전수 평가: 질문이 두 줄이면 버튼이 보이는 화면(키보드 위) 아래로 밀려 '말하기'·'다 썼어요'가 그 밑에 반쯤 들어갔다
import { ref, onBeforeUnmount, type Ref } from 'vue'

const BAR = 20 // 보이는 화면(visualViewport) 아래 끝에서 띄울 틈. 키보드 위 막대는 보이는 화면 밖(바로 아래)에 뜬다

export function useKeyboardFit(root: Ref<HTMLElement | null>, action: Ref<HTMLElement | null>) {
  /** 쓰는 중: 화면을 더 올릴 수 있게 아래에 빈 자리를 둔다 (문서가 짧으면 스크롤이 안 된다) */
  const typing = ref(false)
  const vv = typeof window !== 'undefined' ? window.visualViewport : null
  let timers: number[] = []

  function fit() {
    const el = root.value
    if (!el) return
    const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0
    let target = window.scrollY + el.getBoundingClientRect().top - margin
    const keyboardUp = !!vv && vv.height < window.innerHeight - 120
    const btn = action.value
    if (keyboardUp && vv && btn) {
      // 머리에 맞춘 뒤의 버튼 아래 끝이 (보이는 화면 − 막대)를 넘으면 그만큼 더
      const bottomAfter = btn.getBoundingClientRect().bottom - (target - window.scrollY)
      const over = bottomAfter - (vv.height - BAR)
      if (over > 0) target += over
    }
    window.scrollTo({ top: Math.max(0, target), behavior: 'smooth' })
  }
  const onResize = () => timers.push(window.setTimeout(fit, 60))

  function onTypeStart() {
    typing.value = true
    // 키보드가 다 올라온 뒤에 맞춘다. 아이폰은 키보드가 오른 뒤 화면을 한 번 더 밀어서, 자리 잡은 신호(보이는 화면 크기 바뀜)와 조금 뒤에 다시 맞춘다
    timers.push(window.setTimeout(fit, 250), window.setTimeout(fit, 800))
    vv?.addEventListener('resize', onResize, { once: true })
  }
  function onTypeEnd() {
    // 버튼을 누르느라 초점이 나간 것일 수 있다: 바로 줄이면 버튼이 손가락 밑에서 밀린다
    timers.push(window.setTimeout(() => { if (!root.value?.contains(document.activeElement)) typing.value = false }, 400))
  }
  onBeforeUnmount(() => { timers.forEach(clearTimeout); vv?.removeEventListener('resize', onResize) })
  return { typing, onTypeStart, onTypeEnd, fit }
}

/** 키보드가 올라와 있나. 아래 고정 줄이 홈 바 자리(safe-area)를 비워 두면 키보드 위에 빈 띠가 생긴다: 올라와 있는 동안은 그 자리를 없앤다 */
export function useKeyboardOpen() {
  const open = ref(false)
  const vv = typeof window !== 'undefined' ? window.visualViewport : null
  const update = () => { open.value = !!vv && vv.height < window.screen.height * 0.75 }
  vv?.addEventListener('resize', update)
  update()
  onBeforeUnmount(() => vv?.removeEventListener('resize', update))
  return open
}
