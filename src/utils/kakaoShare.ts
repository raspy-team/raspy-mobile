// 카카오톡으로 바로 보내기 (11/14: 공유 창이 없는 앱 안 브라우저에서는 '링크 복사'뿐이었다).
// 카카오 JS SDK의 Kakao.Share. 키는 지도와 같은 JavaScript 키(VUE_APP_KAKAO_JS_KEY), 카카오 콘솔 '플랫폼 > Web'에 도메인이 있어야 한다.
// 우리 앱(Capacitor) 안에서는 쓰지 않는다: 웹뷰가 카카오톡을 여는 주소를 막는다. 거기서는 '더보기'(기기 공유 창)에 카카오톡이 있다
import { kakaoMapKey } from './kakaoMap'
import { isCapacitorApp } from './nativeBridge'

const SDK = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js'
let loading: Promise<any | null> | null = null

export const kakaoShareAvailable = !!kakaoMapKey && !isCapacitorApp

function load(): Promise<any | null> {
  const w = window as any
  if (w.Kakao?.Share) return Promise.resolve(w.Kakao)
  if (loading) return loading
  loading = new Promise((resolve) => {
    const s = document.createElement('script')
    s.src = SDK
    s.onload = () => {
      try {
        if (!w.Kakao.isInitialized()) w.Kakao.init(kakaoMapKey)
        resolve(w.Kakao)
      } catch {
        resolve(null)
      }
    }
    s.onerror = () => { loading = null; resolve(null) }
    setTimeout(() => { if (!w.Kakao?.Share) { loading = null; resolve(null) } }, 6000)
    document.head.appendChild(s)
  })
  return loading
}

/** 시트가 열릴 때 미리 받아 둔다: 누른 그 자리에서 카카오톡이 열려야 브라우저가 막지 않는다 */
export function warmKakaoShare() {
  if (kakaoShareAvailable) void load()
}

/** 카카오톡 친구 고르기를 연다. 못 열면 false (부르는 쪽이 다른 길로) */
export async function kakaoShare(o: { title: string; description?: string; url: string; image?: string; button?: string }): Promise<boolean> {
  if (!kakaoShareAvailable) return false
  const Kakao = await load()
  if (!Kakao?.Share) return false
  try {
    const link = { mobileWebUrl: o.url, webUrl: o.url }
    Kakao.Share.sendDefault({
      objectType: 'feed',
      content: { title: o.title, description: o.description ?? '', imageUrl: o.image || 'https://matchapp.me/og-image.png', link },
      buttons: [{ title: o.button ?? '한 판 붙기', link }],
    })
    return true
  } catch {
    return false
  }
}
