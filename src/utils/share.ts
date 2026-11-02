// 링크 보내기: 폰에서는 공유 시트(카톡·메시지로 바로), 안 되면 복사. 돌려준 문장을 토스트로 보여 준다
import { copyText } from './clipboard'

export async function shareLink(url: string, text: string): Promise<string> {
  if (navigator.share) {
    try {
      await navigator.share({ text, url })
      return ''
    } catch (e) {
      if ((e as Error).name === 'AbortError') return '' // 사용자가 닫았다
    }
  }
  return (await copyText(url)) ? '링크를 복사했어요' : '복사하지 못했어요'
}
