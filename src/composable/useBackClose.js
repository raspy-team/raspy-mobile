import { watch, onBeforeUnmount } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

// 모달이 열려 있을 때 뒤로가기를 누르면 화면을 떠나지 않고 모달만 닫는다.
// 모달이 열리면 같은 주소로 기록을 하나 쌓고, 뒤로가기(popstate)가 오면 모달을 닫는다.
export function useBackClose(...flags) {
  let token = null
  const anyOpen = () => flags.some((f) => !!f.value)

  const onPop = () => {
    if (!token) return
    token = null
    flags.forEach((f) => {
      if (f.value) f.value = false
    })
  }

  watch(anyOpen, (open) => {
    if (open && !token) {
      token = Date.now()
      history.pushState({ ...history.state, __modal: token }, '')
    } else if (!open && token) {
      // 화면 안에서 닫았으면 쌓아둔 기록을 걷어낸다. 그 사이 다른 화면으로 이동했다면 건드리지 않는다
      const mine = token
      token = null
      setTimeout(() => {
        if (history.state?.__modal === mine) history.back()
      }, 80)
    }
  })

  // 모달이 열린 채로 다른 화면으로 가면, 모달용으로 쌓은 기록 자리를 새 화면이 대신 쓴다.
  // 그래야 나중에 뒤로가기를 한 번만 눌러도 이전 화면으로 돌아온다
  let replacing = false
  onBeforeRouteLeave((to) => {
    if (replacing || history.state?.__modal == null) {
      replacing = false
      return true
    }
    replacing = true
    token = null
    return { path: to.fullPath, replace: true }
  })

  window.addEventListener('popstate', onPop)
  onBeforeUnmount(() => window.removeEventListener('popstate', onPop))
}
