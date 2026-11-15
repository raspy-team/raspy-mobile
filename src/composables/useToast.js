import { ref } from 'vue'
import { feel } from '../utils/feel'

// 안 됐다는 알림은 손에도 다르게 답한다 (quality-rules G1-4). 알림 글은 이 한 곳을 지나므로 글로 가린다
const FAILED = /못 ?했|못했|실패|끊겼|끊겨|할 수 없어요|안 돼요|다시 (시도|해 주세요|눌러)/
// 일이 이루어졌다는 알림은 success로 (G1-3). '~했어요'로 끝나는 알림이 그것이다
const DONE = /(했어요|됐어요|보냈어요|열렸어요|바꿨어요|옮겼어요|넣었어요|뺐어요|지웠어요|받았어요|올렸어요|껐어요|켰어요)([.\s]|$)/

const toastMsg = ref('')
const toastGoTo = ref('')
let timer = null

export function useToast() {
  const showToast = (msg, goTo = '') => {
    toastMsg.value = String(msg ?? '')
    if (FAILED.test(toastMsg.value)) feel('error')
    else if (DONE.test(toastMsg.value)) feel('success')
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
