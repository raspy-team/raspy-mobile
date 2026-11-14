// 보내기 시트 하나를 앱 어디서나 (11/14: 스포티파이의 공유 화면처럼. 보낼 곳을 우리가 펼쳐 보인다).
// utils/share.ts의 shareLink가 이 시트를 연다. 시트는 App.vue에 한 번만 있다
import { reactive } from 'vue'

export type SendRequest = {
  url: string
  /** 함께 가는 한 줄 */
  text: string
  /** 시트 제목 */
  title?: string
  /** 미리 보일 그림(있으면 저장·스토리도 된다) */
  file?: File | null
  /** 인스타 스토리로 보내는 길이 따로 있으면 (임기응변 결과) */
  onStory?: (() => void) | null
  /** 카카오톡 카드의 버튼 글 */
  button?: string
  /** 측정 이름에 붙일 것 (어느 화면의 공유인지) */
  place?: string
}

export const sendSheet = reactive<{ open: boolean; req: SendRequest | null; done: ((sent: string) => void) | null }>({ open: false, req: null, done: null })

/** 시트를 연다. 보낸 곳 이름(안 보내고 닫으면 빈 글)으로 끝난다 */
export function openSendSheet(req: SendRequest): Promise<string> {
  sendSheet.done?.('')
  return new Promise((resolve) => {
    sendSheet.req = req
    sendSheet.done = resolve
    sendSheet.open = true
  })
}
export function closeSendSheet(sent = '') {
  sendSheet.open = false
  const d = sendSheet.done
  sendSheet.done = null
  d?.(sent)
}
