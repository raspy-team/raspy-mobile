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

export function feel(kind: Feel) {
  if (hapticsOn.value) haptic(HAPTIC[kind])
  if (soundOn.value) playSound(kind)
}
