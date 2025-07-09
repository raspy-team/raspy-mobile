import { ref } from 'vue'

const toastMsg = ref('')
const toastGoTo = ref('')

export function useToast() {
  const showToast = (msg, goTo = '') => {
    toastMsg.value = msg
    toastGoTo.value = goTo
    const duration = goTo ? 4000 : 2000
    setTimeout(() => {
      toastMsg.value = ''
      toastGoTo.value = ''
    }, duration)
  }
  return { toastMsg, toastGoTo, showToast }
}

export { toastMsg, toastGoTo }
