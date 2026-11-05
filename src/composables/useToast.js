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
    }, goTo ? 4000 : 2500)
  }
  return { toastMsg, toastGoTo, showToast }
}

export { toastMsg, toastGoTo }
