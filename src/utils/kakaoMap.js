// 카카오 지도 SDK (안전·신뢰 G). 키는 VUE_APP_KAKAO_JS_KEY (카카오 개발자 콘솔 > 앱 키 > JavaScript 키, Vercel 환경변수).
// 콘솔 '플랫폼 > Web'에 matchapp.me·raspy-mobile.vercel.app·localhost 도메인이 있어야 그려진다. 키가 없으면 null (화면은 목록만 보인다)
let loading = null

export const kakaoMapKey = import.meta.env.VUE_APP_KAKAO_JS_KEY || ''

export function loadKakaoMap() {
  if (!kakaoMapKey) return Promise.resolve(null)
  if (window.kakao?.maps?.LatLng) return Promise.resolve(window.kakao)
  if (loading) return loading
  loading = new Promise((resolve) => {
    const s = document.createElement('script')
    s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoMapKey}&autoload=false`
    s.onload = () => window.kakao.maps.load(() => resolve(window.kakao))
    s.onerror = () => { loading = null; resolve(null) }
    document.head.appendChild(s)
  })
  return loading
}

/** 지도 앱에서 열기 (키가 없어도 된다) */
export const kakaoMapLink = (name, lat, lon) => `https://map.kakao.com/link/map/${encodeURIComponent(name)},${lat},${lon}`
