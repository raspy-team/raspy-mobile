// useToast.js
import { ref } from 'vue'

const toastMsg = ref('')

export function useToast() {
  const showToast = (msg) => {
    toastMsg.value = msg
    setTimeout(() => (toastMsg.value = ''), 2000)
  }
  return { toastMsg, showToast }
}

export { toastMsg }
