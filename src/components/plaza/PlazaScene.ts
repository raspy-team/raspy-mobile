// 광장 장면 (Phaser). 화면(PlazaView.vue)이 서버 응답을 넘겨주고, 누른 사람·물건·걸을 길을 콜백으로 돌려받는다.
// 그림은 모두 서버(/api/plaza/art/…)에서 받는다: LimeZu 그림은 재배포 금지라 공개 리포인 이 리포에 두지 않는다
import Phaser from 'phaser'
import type { components } from '@/api/schema'
import { API_BASE_URL } from '@/config/server'

type S = components['schemas']
export type Person = S['PersonView']
export type MapObj = S['Obj']
type Enter = S['EnterResponse']

export interface PlazaCallbacks {
  onTapPerson(id: number): void
  onTapObject(obj: MapObj): void
  onMove(path: number[][]): void
}

const ART = `${API_BASE_URL}/api/plaza/art`
const FRAME_W = 16
const FRAME_H = 32
const PER_ROW = 56
const DIRS = ['right', 'up', 'left', 'down'] as const
type Dir = (typeof DIRS)[number]
const SPEED = 72 // px/초
const FONT = '"Pretendard", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif'

interface Walker {
  p: Person
  sprite: Phaser.GameObjects.Sprite
  name: Phaser.GameObjects.Text
  badge?: Phaser.GameObjects.Text
  bubble?: Phaser.GameObjects.Container
  bubbleTimer?: Phaser.Time.TimerEvent
  path: { x: number; y: number }[]
  x: number
  y: number
  dir: Dir
  resting: boolean
}

export class PlazaScene extends Phaser.Scene {
  private data0!: Enter
  private cb!: PlazaCallbacks
  private walkers = new Map<number, Walker>()
  private hidden = new Set<number>()
  private walk!: Uint8Array
  private meId = 0
  private loadingSheets = new Set<string>()
  private pendingSprites = new Map<string, Person[]>()

  constructor() {
    super('plaza')
  }

  init(args: { enter: Enter; cb: PlazaCallbacks }) {
    this.data0 = args.enter
    this.cb = args.cb
    this.meId = args.enter.me.id
    this.hidden = new Set(args.enter.hidden)
    const bytes = Uint8Array.from(atob(args.enter.map.walk), (c) => c.charCodeAt(0))
    const m = args.enter.map
    const cols = (m.w * m.tile) / m.cell
    const rows = (m.h * m.tile) / m.cell
    this.walk = new Uint8Array(cols * rows)
    for (let i = 0; i < cols * rows; i++) this.walk[i] = (bytes[i >> 3] >> (7 - (i & 7))) & 1
  }

  preload() {
    this.load.crossOrigin = 'anonymous'
    this.load.spritesheet('terrain', `${ART}/map/terrain.png`, { frameWidth: 16, frameHeight: 16 })
    for (const s of new Set(this.data0.map.objects.map((o) => o.s))) this.load.image(`o:${s}`, `${ART}/map/${s}.png`)
    const sheets = new Set([this.data0.me, ...this.data0.people, ...this.data0.resting].map((p) => p.sheet))
    if (this.data0.statue) sheets.add(this.data0.statue.sheet)
    for (const s of sheets) this.loadSheet(s)
  }

  private loadSheet(sheet: string) {
    this.load.spritesheet(`a:${sheet}`, `${ART}/avatar/${sheet}.png`, { frameWidth: FRAME_W, frameHeight: FRAME_H })
  }

  create() {
    const m = this.data0.map
    const T = m.tile
    const W = m.w * T
    const H = m.h * T
    this.drawGround()
    for (const o of m.objects) this.drawObject(o)
    if (this.data0.statue) this.drawStatue()

    this.addWalker(this.data0.me)
    for (const p of this.data0.people) this.addWalker(p)
    for (const p of this.data0.resting) this.addWalker(p, true)

    const cam = this.cameras.main
    cam.setBounds(0, 0, W, H)
    cam.setZoom(this.zoomFor())
    cam.roundPixels = true
    const me = this.walkers.get(this.meId)
    // 화면 위는 광장 고르기 막대가 가린다: 나보다 조금 위를 비춰 노점 이름이 막대 아래로 오게
    if (me) cam.startFollow(me.sprite, true, 0.15, 0.15, 0, 36)
    this.scale.on('resize', () => cam.setZoom(this.zoomFor()))

    // 빈 땅을 누르면 거기까지 걷는다 (사람·물건을 누른 것은 그쪽에서 처리하고 여기로 오지 않게)
    this.input.on('pointerup', (ptr: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length || ptr.getDistance() > 12) return
      this.walkMeTo(ptr.worldX, ptr.worldY)
    })
    // 컴퓨터: 방향키·WASD로 한 걸음씩 (말 칸에 쓰는 중이면 무시)
    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? '').toLowerCase()
      if (tag === 'input' || tag === 'textarea') return
      const step: Record<string, [number, number]> = {
        ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1], ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0],
      }
      const d = step[e.code]
      const me = this.walkers.get(this.meId)
      if (!d || !me) return
      e.preventDefault()
      this.walkMeTo(me.x + d[0] * 40, me.y + d[1] * 40)
    })
    // 끌어서 둘러보기: 손가락으로 끌면 잠깐 따라가기를 멈춘다
    this.input.on('pointermove', (ptr: Phaser.Input.Pointer) => {
      if (!ptr.isDown || ptr.getDistance() < 12) return
      cam.stopFollow()
      cam.scrollX -= (ptr.x - ptr.prevPosition.x) / cam.zoom
      cam.scrollY -= (ptr.y - ptr.prevPosition.y) / cam.zoom
    })
  }

  /** 화면 폭에 맞춘 정수 배율 (픽셀이 흐려지지 않게) */
  private zoomFor() {
    const w = this.scale.width
    return w >= 900 ? 3 : w >= 360 ? 2 : 1.5
  }

  private drawGround() {
    const m = this.data0.map
    const t = m.terrain as unknown as Record<string, number[]>
    const cols = Number((m.terrain as Record<string, unknown>).cols)
    const grass = t.grass
    const map = this.make.tilemap({ width: m.w, height: m.h, tileWidth: 16, tileHeight: 16 })
    const tiles = map.addTilesetImage('terrain', 'terrain', 16, 16, 0, 0)!
    const layer = map.createBlankLayer('ground', tiles)!
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) layer.putTileAt(grass[(x * 7 + y * 13) % 5 ? 0 : 1], x, y)
    for (const a of m.ground) {
      const [bx, by] = t[a.kind]
      for (let y = 0; y < a.h; y++) for (let x = 0; x < a.w; x++) {
        const cx = x === 0 ? 0 : x === a.w - 1 ? 2 : 1
        const cy = y === 0 ? 0 : y === a.h - 1 ? 2 : 1
        layer.putTileAt(bx + cx + (by + cy) * cols, a.x + x, a.y + y)
      }
    }
    layer.setDepth(-10)
  }

  private drawObject(o: MapObj) {
    const img = this.add.image(o.x, o.y, `o:${o.s}`).setOrigin(0, 0)
    img.setDepth(o.y + img.height)
    if (o.label) {
      const label = this.add
        .text(o.x + img.width / 2, o.y - 2, o.label, { fontFamily: FONT, fontSize: '7px', color: '#ffffff', stroke: '#1b1b1f', strokeThickness: 2, resolution: 4 })
        .setOrigin(0.5, 1)
        .setDepth(100000)
      if (o.action) label.setStyle({ color: '#e8ff59' })
    }
    if (o.action) {
      img.setInteractive({ useHandCursor: true, pixelPerfect: false })
      img.on('pointerup', (ptr: Phaser.Input.Pointer) => ptr.getDistance() <= 12 && this.cb.onTapObject(o))
    }
  }

  /** 챔피언 자리: 천사상 앞 받침 위에 이 방 챔피언 캐릭터 (두 배 크기, 왕관) */
  private drawStatue() {
    const s = this.data0.statue!
    const spot = this.data0.map.objects.find((o) => o.action === 'champion')
    if (!spot) return
    const x = spot.x + 40
    const y = spot.y + 112
    this.add.rectangle(x, y + 1, 26, 8, 0x8d8a83).setOrigin(0.5, 1).setDepth(y)
    const key = `a:${s.sheet}`
    const make = () => {
      const st = this.add.sprite(x, y - 7, key, 3).setOrigin(0.5, 1).setScale(1.5).setDepth(y + 1).setTint(0xf2e6c8)
      st.setInteractive({ useHandCursor: true })
      st.on('pointerup', () => this.cb.onTapObject(spot))
      this.add.text(x, y - 56, '👑', { fontSize: '10px', resolution: 4 }).setOrigin(0.5, 1).setDepth(y + 2)
    }
    if (this.textures.exists(key)) make()
  }

  // ---- 사람 ----

  addWalker(p: Person, resting = false) {
    if (this.hidden.has(p.id) || this.walkers.has(p.id)) return
    const key = `a:${p.sheet}`
    if (!this.textures.exists(key)) {
      const list = this.pendingSprites.get(p.sheet) ?? []
      list.push({ ...p, restingMinutes: resting ? p.restingMinutes ?? 0 : p.restingMinutes })
      this.pendingSprites.set(p.sheet, list)
      if (!this.loadingSheets.has(p.sheet)) {
        this.loadingSheets.add(p.sheet)
        this.loadSheet(p.sheet)
        this.load.once(`filecomplete-spritesheet-a:${p.sheet}`, () => {
          this.loadingSheets.delete(p.sheet)
          const waiting = this.pendingSprites.get(p.sheet) ?? []
          this.pendingSprites.delete(p.sheet)
          waiting.forEach((w) => this.addWalker(w, w.restingMinutes != null))
        })
        this.load.start()
      }
      return
    }
    this.ensureAnims(p.sheet)
    const sprite = this.add.sprite(p.x, p.y, key, 3).setOrigin(0.5, 1)
    sprite.setInteractive({ useHandCursor: true })
    sprite.on('pointerup', (ptr: Phaser.Input.Pointer) => ptr.getDistance() <= 12 && this.cb.onTapPerson(p.id))
    const mine = p.id === this.meId
    const label = (p.champion ? '👑 ' : '') + p.name
    const name = this.add
      .text(p.x, p.y - FRAME_H - 1, label, { fontFamily: FONT, fontSize: '6px', color: mine ? '#e8ff59' : '#ffffff', stroke: '#1b1b1f', strokeThickness: 2, resolution: 4 })
      .setOrigin(0.5, 1)
    const w: Walker = { p, sprite, name, path: [], x: p.x, y: p.y, dir: 'down', resting }
    if (p.bot) {
      w.badge = this.add
        .text(0, 0, 'AI', { fontFamily: FONT, fontSize: '5px', color: '#121214', backgroundColor: '#9ad0ff', padding: { x: 1, y: 0 }, resolution: 4 })
        .setOrigin(0, 1)
    }
    if (resting) {
      sprite.setAlpha(0.5)
      name.setAlpha(0.6)
      name.setText(`💤 ${p.name}`)
    }
    this.walkers.set(p.id, w)
    this.place(w)
  }

  removeWalker(id: number) {
    const w = this.walkers.get(id)
    if (!w) return
    w.sprite.destroy()
    w.name.destroy()
    w.badge?.destroy()
    w.bubble?.destroy()
    this.walkers.delete(id)
  }

  /** 접속한 사람이 '쉬는 중' 자리에 있었으면 바꿔 끼운다 */
  join(p: Person) {
    const w = this.walkers.get(p.id)
    if (w?.resting) this.removeWalker(p.id)
    this.addWalker(p)
  }

  private ensureAnims(sheet: string) {
    const key = `a:${sheet}`
    if (this.anims.exists(`${key}:walk-down`)) return
    DIRS.forEach((d, i) => {
      const start = 2 * PER_ROW + i * 6
      this.anims.create({ key: `${key}:walk-${d}`, frames: this.anims.generateFrameNumbers(key, { start, end: start + 5 }), frameRate: 10, repeat: -1 })
      const idle = 1 * PER_ROW + i * 6
      this.anims.create({ key: `${key}:idle-${d}`, frames: this.anims.generateFrameNumbers(key, { start: idle, end: idle + 5 }), frameRate: 5, repeat: -1 })
    })
  }

  /** 남이 걷는다 (서버 신호) */
  walkPath(id: number, path: number[][]) {
    const w = this.walkers.get(id)
    if (!w || id === this.meId) return
    w.path = path.map(([x, y]) => ({ x, y }))
  }

  /** 말풍선 (big: 이모티콘은 크게, 짧게) */
  sayBubble(id: number, text: string, big = false) {
    const w = this.walkers.get(id)
    if (!w) return
    w.bubble?.destroy()
    w.bubbleTimer?.remove()
    const t = this.add.text(0, 0, text, {
      fontFamily: FONT,
      fontSize: big ? '12px' : '6px',
      color: '#121214',
      backgroundColor: '#ffffff',
      padding: { x: 3, y: 2 },
      wordWrap: { width: 90, useAdvancedWrap: true },
      resolution: 4,
    })
    t.setOrigin(0.5, 1)
    w.bubble = this.add.container(w.x, w.y - FRAME_H - 9, [t]).setDepth(200000)
    w.bubbleTimer = this.time.delayedCall(big ? 2500 : 5000, () => {
      w.bubble?.destroy()
      w.bubble = undefined
    })
  }

  private place(w: Walker) {
    w.sprite.setPosition(Math.round(w.x), Math.round(w.y)).setDepth(w.y)
    w.name.setPosition(Math.round(w.x), Math.round(w.y) - FRAME_H + 2).setDepth(150000)
    if (w.badge) w.badge.setPosition(Math.round(w.x) + w.name.width / 2 + 1, Math.round(w.y) - FRAME_H + 1).setDepth(150000)
    w.bubble?.setPosition(Math.round(w.x), Math.round(w.y) - FRAME_H - 7)
  }

  private nextDeclutter = 0

  /**
   * 이름표 정리 (11/6, 320px에서 이름표가 서로 겹쳤다): 내 이름은 늘, 남은 나와 가까운 순으로 보이되
   * 이미 보인 이름표와 겹치거나 너무 멀면(화면 반쯤 밖) 숨긴다. 말풍선이 떠 있는 사람은 이름도 보인다
   */
  private declutter() {
    const me = this.walkers.get(this.meId)
    if (!me) return
    const cam = this.cameras.main
    const far = (cam.width / cam.zoom) * 0.6
    const placed: Phaser.Geom.Rectangle[] = []
    const list = [...this.walkers.values()].sort((a, b) => {
      if (a.p.id === this.meId) return -1
      if (b.p.id === this.meId) return 1
      return Math.hypot(a.x - me.x, a.y - me.y) - Math.hypot(b.x - me.x, b.y - me.y)
    })
    for (const w of list) {
      const mine = w.p.id === this.meId
      const r = w.name.getBounds()
      const near = mine || !!w.bubble || Math.hypot(w.x - me.x, w.y - me.y) < far
      const free = mine || !placed.some((q) => Phaser.Geom.Intersects.RectangleToRectangle(q, r))
      const show = near && free
      w.name.setVisible(show)
      w.badge?.setVisible(show)
      if (show) placed.push(r)
    }
  }

  update(_t: number, dtMs: number) {
    if (_t > this.nextDeclutter) {
      this.nextDeclutter = _t + 250
      this.declutter()
    }
    const dt = Math.min(dtMs, 100) / 1000
    for (const w of this.walkers.values()) {
      const key = `a:${w.p.sheet}`
      if (!w.path.length) {
        if (!w.resting && w.sprite.anims.currentAnim?.key !== `${key}:idle-${w.dir}`) w.sprite.play(`${key}:idle-${w.dir}`)
        continue
      }
      const next = w.path[0]
      const dx = next.x - w.x
      const dy = next.y - w.y
      const dist = Math.hypot(dx, dy)
      const step = SPEED * dt
      if (dist <= step) {
        w.x = next.x
        w.y = next.y
        w.path.shift()
      } else {
        w.x += (dx / dist) * step
        w.y += (dy / dist) * step
      }
      const dir: Dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up'
      if (dist > 0.5) w.dir = dir
      if (w.sprite.anims.currentAnim?.key !== `${key}:walk-${w.dir}`) w.sprite.play(`${key}:walk-${w.dir}`)
      this.place(w)
    }
  }

  // ---- 내 걸음: 8px 칸 A* → 곧은 길로 줄이기 → 서버에 알리고 바로 걷는다 ----

  private walkMeTo(tx: number, ty: number) {
    const me = this.walkers.get(this.meId)
    if (!me) return
    const m = this.data0.map
    const cols = (m.w * m.tile) / m.cell
    const rows = (m.h * m.tile) / m.cell
    const cell = m.cell
    const start = this.nearestOpen(Math.floor(me.x / cell), Math.floor(me.y / cell), cols, rows)
    const goal = this.nearestOpen(Math.floor(tx / cell), Math.floor(ty / cell), cols, rows)
    if (start == null || goal == null) return
    const cells = this.astar(start, goal, cols, rows)
    if (!cells) return
    const pts = cells.map((i) => ({ x: (i % cols) * cell + cell / 2, y: Math.floor(i / cols) * cell + cell / 2 }))
    // 마지막 점은 누른 곳 그대로 (그 칸 안이면)
    if (goal === Math.floor(ty / cell) * cols + Math.floor(tx / cell)) pts[pts.length - 1] = { x: Math.round(tx), y: Math.round(ty) }
    const smooth = this.smooth({ x: me.x, y: me.y }, pts)
    me.path = smooth
    this.cameras.main.startFollow(me.sprite, true, 0.15, 0.15, 0, 36)
    this.cb.onMove(smooth.map((p) => [Math.round(p.x), Math.round(p.y)]))
  }

  private open(c: number, r: number, cols: number, rows: number) {
    return c >= 0 && r >= 0 && c < cols && r < rows && this.walk[r * cols + c] === 1
  }

  private nearestOpen(c: number, r: number, cols: number, rows: number): number | null {
    for (let d = 0; d < 12; d++)
      for (let dr = -d; dr <= d; dr++)
        for (let dc = -d; dc <= d; dc++) {
          if (Math.max(Math.abs(dr), Math.abs(dc)) !== d) continue
          if (this.open(c + dc, r + dr, cols, rows)) return (r + dr) * cols + c + dc
        }
    return null
  }

  private astar(start: number, goal: number, cols: number, rows: number): number[] | null {
    const h = (i: number) => Math.hypot((i % cols) - (goal % cols), Math.floor(i / cols) - Math.floor(goal / cols))
    const g = new Map<number, number>([[start, 0]])
    const from = new Map<number, number>()
    const open: [number, number][] = [[h(start), start]]
    const closed = new Set<number>()
    let guard = 0
    while (open.length && guard++ < 20000) {
      open.sort((a, b) => a[0] - b[0])
      const [, cur] = open.shift()!
      if (cur === goal) {
        const out = [cur]
        let k = cur
        while (from.has(k)) out.unshift((k = from.get(k)!))
        return out
      }
      if (closed.has(cur)) continue
      closed.add(cur)
      const c = cur % cols
      const r = Math.floor(cur / cols)
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const nc = c + dc
        const nr = r + dr
        if (!this.open(nc, nr, cols, rows)) continue
        if (dc && dr && (!this.open(c + dc, r, cols, rows) || !this.open(c, r + dr, cols, rows))) continue // 모서리 끼어 가지 않게
        const n = nr * cols + nc
        const ng = g.get(cur)! + (dc && dr ? 1.414 : 1)
        if (ng < (g.get(n) ?? Infinity)) {
          g.set(n, ng)
          from.set(n, cur)
          open.push([ng + h(n), n])
        }
      }
    }
    return null
  }

  /** 서로 곧게 보이는 점은 건너뛴다 (서버도 점 사이 곧은 길이 막히지 않았는지 본다) */
  private smooth(from: { x: number; y: number }, pts: { x: number; y: number }[]) {
    const out: { x: number; y: number }[] = []
    let anchor = from
    let i = 0
    while (i < pts.length) {
      let j = pts.length - 1
      while (j > i && !this.clear(anchor, pts[j])) j--
      out.push(pts[j])
      anchor = pts[j]
      i = j + 1
    }
    return out.slice(0, 60)
  }

  private clear(a: { x: number; y: number }, b: { x: number; y: number }) {
    const m = this.data0.map
    const cols = (m.w * m.tile) / m.cell
    const rows = (m.h * m.tile) / m.cell
    const steps = Math.max(1, Math.floor(Math.hypot(b.x - a.x, b.y - a.y) / 4))
    for (let k = 0; k <= steps; k++) {
      const x = a.x + ((b.x - a.x) * k) / steps
      const y = a.y + ((b.y - a.y) * k) / steps
      if (!this.open(Math.floor(x / m.cell), Math.floor(y / m.cell), cols, rows)) return false
    }
    return true
  }

  /** 차단을 새로 하면 그 사람을 바로 지운다 */
  hide(id: number) {
    this.hidden.add(id)
    this.removeWalker(id)
  }

  person(id: number): Person | undefined {
    return this.walkers.get(id)?.p
  }

  isResting(id: number) {
    return this.walkers.get(id)?.resting ?? false
  }
}

export function createPlaza(parent: HTMLElement, enter: Enter, cb: PlazaCallbacks): Phaser.Game {
  const scene = new PlazaScene()
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#2e5b3a',
    pixelArt: true,
    roundPixels: true,
    scale: { mode: Phaser.Scale.RESIZE, width: parent.clientWidth, height: parent.clientHeight },
    input: { activePointers: 2 },
    banner: false,
    scene: [],
  })
  game.scene.add('plaza', scene, true, { enter, cb })
  return game
}
