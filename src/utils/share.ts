// 보내기: 폰에서는 공유 시트(카톡·메시지로 바로), 안 되면 복사. 돌려준 문장을 토스트로 보여 준다 (빈 문장이면 보일 것 없음)
import { copyText } from './clipboard'
import { POST } from '@/api/client'
import { withShareRef } from './shareRef'
import { openSendSheet } from '../stores/sendSheet'

type ShareOptions = {
  /** 시트의 제목 */
  title?: string
  /** (옛 방식) 복사로 대신했을 때 보일 문장. 이제 시트가 스스로 말한다 */
  copied?: string
  /** 미리 보일 그림 (있으면 저장도 된다) */
  file?: File | null
  /** 인스타 스토리로 보내는 길 */
  onStory?: (() => void) | null
  /** 카카오톡 카드의 버튼 글 */
  button?: string
  /** 어느 화면의 공유인지 (측정) */
  place?: string
}

/**
 * 링크(url)와 한 줄(text)을 보낸다: 보내기 시트를 연다 (11/14, components/share/SendSheet.vue).
 * 예전엔 기기 공유 창을 바로 열고, 없으면 말없이 복사했다. 돌려주는 문장은 늘 비어 있다(시트가 스스로 알린다): 부르는 쪽의 토스트 코드는 그대로 둬도 된다
 */
export async function shareLink(url: string, text: string, opts: ShareOptions = {}): Promise<string> {
  // 우리 주소면 공유 번호를 단다 (누가 데려왔는지 센다)
  url = withShareRef(url)
  // 링크 없이 글만 보내는 곳(만남 안전의 '지인에게 알리기')은 예전처럼 기기 공유 창·복사
  if (!url) {
    if (navigator.share) {
      try { await navigator.share({ title: opts.title, text }); return '' } catch (e) { if ((e as Error).name === 'AbortError') return '' }
    }
    return (await copyText(text)) ? (opts.copied ?? '복사했어요') : '복사하지 못했어요'
  }
  await openSendSheet({ url, text, title: opts.title, file: opts.file, onStory: opts.onStory, button: opts.button, place: opts.place })
  return ''
}

/** shareLink와 같지만 어디로 보냈는지 돌려준다('kakao'·'copy'·'sms'…). 안 보내고 닫으면 빈 글 */
export function sendLink(url: string, text: string, opts: ShareOptions = {}): Promise<string> {
  return openSendSheet({ url: withShareRef(url), text, title: opts.title, file: opts.file, onStory: opts.onStory, button: opts.button, place: opts.place })
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
  // 경기 초대: 받은 사람이 할 일은 '신청'이다 (카카오톡 카드의 버튼 글)
  return shareLink(url, text, { title: '경기에 부르기', button: '신청하기', place: 'game_invite', ...opts })
}
