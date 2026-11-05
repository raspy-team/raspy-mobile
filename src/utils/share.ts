// 보내기: 폰에서는 공유 시트(카톡·메시지로 바로), 안 되면 복사. 돌려준 문장을 토스트로 보여 준다 (빈 문장이면 보일 것 없음)
import { copyText } from './clipboard'
import { POST } from '@/api/client'

type ShareOptions = {
  /** 공유 시트의 제목 */
  title?: string
  /** 복사로 대신했을 때 보일 문장 */
  copied?: string
}

/** 링크(url)와 한 줄(text)을 보낸다. url이 비면 글만 보내고, 복사할 때도 글을 복사한다 */
export async function shareLink(url: string, text: string, opts: ShareOptions = {}): Promise<string> {
  if (navigator.share) {
    try {
      await navigator.share({ title: opts.title, text, ...(url ? { url } : {}) })
      return ''
    } catch (e) {
      if ((e as Error).name === 'AbortError') return '' // 사용자가 닫았다
    }
  }
  return (await copyText(url || text)) ? (opts.copied ?? '링크를 복사했어요') : '복사하지 못했어요'
}

/** 경기 링크를 받아 보낸다 (열린 경기는 신청 화면, 끝난 경기는 소식) */
export async function shareGameInvite(gameId: number, text: string, opts: ShareOptions = {}): Promise<string> {
  let url = ''
  try {
    const { data } = await POST('/api/invite', { query: { gameId } })
    url = (data as { url?: string } | undefined)?.url ?? ''
  } catch {
    // 아래에서 같이 알린다
  }
  if (!url) return '링크를 만들지 못했어요'
  return shareLink(url, text, opts)
}
