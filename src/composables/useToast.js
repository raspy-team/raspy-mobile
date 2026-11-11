import { ref } from 'vue'

const toastMsg = ref('')
const toastGoTo = ref('')
let timer = null

export function useToast() {
  const showToast = (msg, goTo = '') => {
    toastMsg.value = String(msg ?? '')
    toastGoTo.value = goTo
    clearTimeout(timer)
    timer = setTimeout(() => {
      toastMsg.value = ''
      toastGoTo.value = ''
    }, Math.max(goTo ? 4000 : 2500, toastMsg.value.length * 70)) // 긴 문장은 읽을 시간만큼 (경로 1 N15: 두 줄 안내가 다 읽기 전에 사라졌다)
  }
  return { toastMsg, toastGoTo, showToast }
}

export { toastMsg, toastGoTo }
