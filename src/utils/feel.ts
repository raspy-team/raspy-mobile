// 손맛: 일이 일어난 순간의 진동 + 효과음을 한 번에. 화면은 '무엇이 일어났나'만 말한다 (11/3, 디자인 리뷰 '감각').
//   feel('score')   점수 +1          feel('select')  탭·칩·별 고르기
//   feel('success') 신청·승인·확정·세트 끝   feel('win') / feel('lose') 경기 결과
// 진동·소리는 설정 > 화면에서 따로 끈다 (이 기기에만 저장)
import { ref } from 'vue'
import { haptic } from './haptics'
import { playSound } from './sound'

export type Feel = 'tap' | 'select' | 'score' | 'success' | 'win' | 'lose' | 'alert' | 'error'

// 진동 종류: 점수는 가볍게, 승패는 success·light로 (진 쪽에 '오류' 진동을 주지 않는다)
const HAPTIC: Record<Feel, string> = { tap: 'tap', select: 'select', score: 'tap', success: 'success', win: 'success', lose: 'light', alert: 'alert', error: 'error' }

const read = (key: string) => {
  try {
    return localStorage.getItem(key) !== 'off'
  } catch {
    return true
  }
}
const write = (key: string, on: boolean) => {
  try {
    if (on) localStorage.removeItem(key)
    else localStorage.setItem(key, 'off')
  } catch {
    // 저장 못 해도 이번에는 적용된다
  }
}

export const soundOn = ref(read('match_sound'))
export const hapticsOn = ref(read('match_haptics'))
export function setSound(on: boolean) {
  soundOn.value = on
  write('match_sound', on)
  if (on) playSound('select')
}
export function setHaptics(on: boolean) {
  hapticsOn.value = on
  write('match_haptics', on)
  if (on) haptic('select')
}

/** 그 결과를 처음 보는가. 연출(소리·진동·불꽃)은 처음 한 번만이다 (quality-rules G2-4). 기기에 최근 200개를 기억한다 */
export function firstSight(key: string): boolean {
  try {
    const seen: string[] = JSON.parse(localStorage.getItem('match_seen') || '[]')
    if (seen.includes(key)) return false
    seen.push(key)
    localStorage.setItem('match_seen', JSON.stringify(seen.slice(-200)))
  } catch {
    // 저장소를 못 쓰면 매번 처음으로 본다
  }
  return true
}

// quiet: 진동만. 제 소리가 있는 판(리듬·시간 감각)에서 손끝 답만 줄 때
let last: { kind: Feel; at: number } = { kind: 'tap', at: 0 }
export function feel(kind: Feel, quiet = false) {
  // 같은 답이 겹치지 않게: 화면이 success를 내고 알림 글도 success를 내면 한 번만 울린다
  const now = Date.now()
  if (kind !== 'tap' && kind !== 'select' && kind !== 'score' && last.kind === kind && now - last.at < 400) return
  last = { kind, at: now }
  if (hapticsOn.value) haptic(HAPTIC[kind])
  if (soundOn.value && !quiet) playSound(kind)
}
