// 눌렀다·끝났다는 느낌을 짧은 진동으로 준다. 진동 길이는 여기서만 정한다.
// 안드로이드(웹·앱 웹뷰)는 navigator.vibrate로 된다. iOS 웹은 지원하지 않아 조용히 넘어간다
const PATTERNS = {
  tap: 8, // 점수 올리기, 좋아요처럼 자주 누르는 것
  success: [12, 60, 24], // 신청, 결과 확인, 세트·경기 끝
  alert: 400, // 세트 시간이 다 됨
  error: [40, 60, 40], // 눌렀는데 안 됐다 (연결 끊김)
}

export function haptic(kind = 'tap') {
  try {
    navigator.vibrate?.(PATTERNS[kind] ?? PATTERNS.tap)
  } catch {
    // 막힌 환경(iframe 등)에서는 무시
  }
}
