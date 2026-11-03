// 코트의 스피커 (관중, 11/3 세션 2. docs/live-spectator-review.md A): 관중이 보낸 박수·응원을 점수판 휴대폰이 짧은 소리로 낸다.
// 야마하 Remote Cheerer(J리그 2020)의 동네판. 파일 없이 잡음을 잘라 박수 소리를 만든다. 끄면 localStorage에 남긴다
const KEY = 'live.crowdSound'
let ctx: AudioContext | null = null
let last = 0

export function crowdSoundOn(): boolean {
  try { return localStorage.getItem(KEY) !== 'off' } catch { return true }
}

export function setCrowdSound(on: boolean) {
  try { localStorage.setItem(KEY, on ? 'on' : 'off') } catch { /* 저장 못 해도 이번엔 따른다 */ }
}

/** 박수 한 번 (claps번 겹쳐 친다). 너무 잦으면 0.25초에 한 번만 */
export function clap(claps = 1) {
  if (!crowdSoundOn()) return
  const now = Date.now()
  if (now - last < 250) return
  last = now
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') ctx.resume()
    for (let i = 0; i < Math.min(claps, 4); i++) {
      const t = ctx.currentTime + i * 0.07 + Math.random() * 0.03
      const len = Math.floor(ctx.sampleRate * 0.08)
      const buf = ctx.createBuffer(1, len, ctx.sampleRate)
      const d = buf.getChannelData(0)
      for (let j = 0; j < len; j++) d[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / len, 4)
      const src = ctx.createBufferSource()
      src.buffer = buf
      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.value = 1500 + Math.random() * 800
      const gain = ctx.createGain()
      gain.gain.value = 0.35
      src.connect(filter).connect(gain).connect(ctx.destination)
      src.start(t)
    }
  } catch { /* 소리를 못 내는 브라우저는 조용히 */ }
}
