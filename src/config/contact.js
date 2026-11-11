// 문의처 한 곳. 화면 여러 곳(로그인·비밀번호 찾기·설정)과 서버 문구(com.raspy.backend.config.Contact)가 이 주소를 쓴다.
// 서비스 문의 주소 (Zoho 메일, 11/11 고병연). 바꿀 땐 여기와 서버 config/Contact.kt 한 줄만 (가로 훑기 9절: 개인 메일이 여섯 곳에 흩어져 있었다)
export const CONTACT_EMAIL = 'yeonkoh@matchapp.me'

/** 메일 앱을 여는 주소. 제목은 [매치]로 시작한다 */
export function contactMailto(subject) {
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`[매치] ${subject}`)}`
}
