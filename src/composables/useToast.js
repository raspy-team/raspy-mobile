import { ref } from 'vue'
import { feel } from '../utils/feel'

// 안 됐다는 알림은 손에도 답한다 (quality-rules G1-4). 알림 글은 이 한 곳을 지나므로 글로 가린다.
// 됐다는 알림('~했어요')마다 울리던 것은 뺐다: 버튼마다 울리는 것과 같이 과했다 (11/15 고병연). 됐다는 답은 경기의 순간(신청·승인·확정·답 내기)에만 화면이 낸다
const FAILED = /못 ?했|못했|실패|끊겼|끊겨|할 수 없어요|안 돼요|다시 (시도|해 주세요|눌러)/

const toastMsg = ref('')
const toastGoTo = ref('')
let timer = null

export function useToast() {
  const showToast = (msg, goTo = '') => {
    toastMsg.value = String(msg ?? '')
    if (FAILED.test(toastMsg.value)) feel('error')
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
