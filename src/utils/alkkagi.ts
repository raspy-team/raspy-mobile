// 알까기 물리. 서버 AlkkagiGame.kt의 AlkkagiPhysics와 같은 계산이다 (숫자를 바꾸면 둘 다 바꾼다).
// 화면은 이걸로 돌이 움직이는 모습을 그리고, 끝나면 서버가 준 자리에 맞춘다
export const RADIUS = 0.045
const MAX_SPEED = 2.4
const FRICTION = 1.3
const RESTITUTION = 0.9
export const DT = 1 / 120
const MAX_STEPS = 1200

export type Body = { id: number; mine: boolean; x: number; y: number; alive: boolean }
export type Shot = { stone: number; angle: number; power: number }

/** 저장 모양 "돌 번호,각도,힘" (서버 Shot.format과 같은 자릿수) */
export function formatShot(s: Shot) {
  const a = ((s.angle % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI
  return `${s.stone},${a.toFixed(4)},${Math.min(1, Math.max(0.05, s.power)).toFixed(3)}`
}

export function parseShot(move: string): Shot | null {
  const [stone, angle, power] = move.split(',').map(Number)
  if (![stone, angle, power].every(Number.isFinite)) return null
  return { stone, angle, power }
}

/** 한 번 튕긴 뒤의 움직임을 프레임마다 돌려준다 (마지막 프레임이 멈춘 모습) */
export function simulate(start: Body[], shot: Shot): Body[][] {
  const b = start.map((s) => ({ ...s, vx: 0, vy: 0 }))
  const s = b[shot.stone]
  if (!s || !s.alive) return [start]
  const speed = MAX_SPEED * shot.power
  s.vx = Math.cos(shot.angle) * speed
  s.vy = Math.sin(shot.angle) * speed
  const frames: Body[][] = []
  for (let step = 0; step < MAX_STEPS; step++) {
    let moving = false
    for (const o of b) {
      if (!o.alive) continue
      const v = Math.hypot(o.vx, o.vy)
      if (v === 0) continue
      const slowed = Math.max(0, v - FRICTION * DT)
      if (slowed < 0.004) {
        o.vx = 0
        o.vy = 0
        continue
      }
      o.vx = (o.vx / v) * slowed
      o.vy = (o.vy / v) * slowed
      o.x += o.vx * DT
      o.y += o.vy * DT
      moving = true
    }
    for (let i = 0; i < b.length; i++) {
      for (let j = i + 1; j < b.length; j++) {
        const p = b[i]
        const q = b[j]
        if (!p.alive || !q.alive) continue
        const dx = q.x - p.x
        const dy = q.y - p.y
        const d = Math.hypot(dx, dy)
        if (d >= 2 * RADIUS || d === 0) continue
        const nx = dx / d
        const ny = dy / d
        const push = (2 * RADIUS - d) / 2
        p.x -= nx * push
        p.y -= ny * push
        q.x += nx * push
        q.y += ny * push
        const rel = (p.vx - q.vx) * nx + (p.vy - q.vy) * ny
        if (rel <= 0) continue
        const impulse = (rel * (1 + RESTITUTION)) / 2
        p.vx -= impulse * nx
        p.vy -= impulse * ny
        q.vx += impulse * nx
        q.vy += impulse * ny
        moving = true
      }
    }
    for (const o of b) {
      if (o.alive && (o.x < 0 || o.x > 1 || o.y < 0 || o.y > 1)) {
        o.alive = false
        o.vx = 0
        o.vy = 0
      }
    }
    frames.push(b.map(({ id, mine, x, y, alive }) => ({ id, mine, x, y, alive })))
    if (!moving) break
  }
  return frames
}
