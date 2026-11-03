// 효과음. 파일 없이 WebAudio로 짧게 만든다 (받을 것이 없고, 소리 하나가 0.1~0.5초).
// 크게 울리지 않는다: 손끝 '톡'이 기본이고, 이긴 순간만 짧은 화음. 진 순간은 슬프지 않게 낮고 부드럽게 내려간다.
// 브라우저는 사람이 한 번 누르기 전에는 소리를 막아서, 첫 터치에 소리 장치를 깨운다
type Note = { f: number; at: number; dur: number; type?: OscillatorType; gain?: number; to?: number }

const C5 = 523.25, E5 = 659.25, G5 = 783.99, C6 = 1046.5, E6 = 1318.5, G4 = 392, E4 = 329.63

const SOUNDS: Record<string, Note[]> = {
  tap: [{ f: 1400, at: 0, dur: 0.025, type: 'triangle', gain: 0.05 }],
  select: [{ f: 1100, at: 0, dur: 0.03, type: 'triangle', gain: 0.04 }],
  light: [{ f: 1100, at: 0, dur: 0.03, type: 'triangle', gain: 0.04 }],
  // 점수 +1: 짧게 위로 튕기는 소리
  score: [{ f: 660, to: 990, at: 0, dur: 0.07, type: 'sine', gain: 0.09 }],
  success: [
    { f: C6, at: 0, dur: 0.08, type: 'sine', gain: 0.07 },
    { f: E6, at: 0.07, dur: 0.12, type: 'sine', gain: 0.07 },
  ],
  win: [
    { f: C5, at: 0, dur: 0.1, type: 'triangle', gain: 0.08 },
    { f: E5, at: 0.08, dur: 0.1, type: 'triangle', gain: 0.08 },
    { f: G5, at: 0.16, dur: 0.1, type: 'triangle', gain: 0.08 },
    { f: C6, at: 0.24, dur: 0.28, type: 'triangle', gain: 0.09 },
  ],
  lose: [
    { f: G4, at: 0, dur: 0.16, type: 'sine', gain: 0.06 },
    { f: E4, at: 0.14, dur: 0.3, type: 'sine', gain: 0.05 },
  ],
  alert: [
    { f: 880, at: 0, dur: 0.09, type: 'square', gain: 0.03 },
    { f: 880, at: 0.16, dur: 0.09, type: 'square', gain: 0.03 },
  ],
  error: [{ f: 220, to: 180, at: 0, dur: 0.14, type: 'sawtooth', gain: 0.025 }],
}

let ctx: AudioContext | null = null
function audio(): AudioContext | null {
  if (ctx) return ctx
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  ctx = new AC()
  return ctx
}

// 첫 터치에 깨운다 (iOS는 사용자 동작 안에서 resume해야 소리가 난다)
if (typeof window !== 'undefined') {
  const unlock = () => {
    const c = audio()
    if (c && c.state === 'suspended') c.resume().catch(() => {})
    window.removeEventListener('pointerdown', unlock, true)
  }
  window.addEventListener('pointerdown', unlock, true)
}

export function playSound(kind: string) {
  const notes = SOUNDS[kind]
  const c = notes && audio()
  if (!c || c.state !== 'running') return
  const now = c.currentTime
  for (const n of notes) {
    const osc = c.createOscillator()
    const g = c.createGain()
    osc.type = n.type ?? 'sine'
    osc.frequency.setValueAtTime(n.f, now + n.at)
    if (n.to) osc.frequency.exponentialRampToValueAtTime(n.to, now + n.at + n.dur)
    // 딸깍 소리가 나지 않게 아주 짧게 올렸다가 부드럽게 줄인다
    g.gain.setValueAtTime(0, now + n.at)
    g.gain.linearRampToValueAtTime(n.gain ?? 0.06, now + n.at + 0.005)
    g.gain.exponentialRampToValueAtTime(0.0001, now + n.at + n.dur)
    osc.connect(g).connect(c.destination)
    osc.start(now + n.at)
    osc.stop(now + n.at + n.dur + 0.02)
  }
}
