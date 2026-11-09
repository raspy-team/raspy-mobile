// 인스타 스토리 그림: 앱의 소식 카드(StoryCard)를 화면 밖에 그려 1080×1920 PNG로 찍는다 (snapdom).
// 서버 그림(raspy-api share/ShareImage.kt)은 Java로 따로 그려 앱 화면과 모양이 달랐다. 이건 앱의 글꼴·색·부품 그대로다 (11/9)
// 찍은 그림은 폰 공유 시트로 넘긴다 → 인스타 → 스토리. 공유 시트가 파일을 못 받으면(PC, 안드로이드 앱의 웹뷰) 내려받는다
import { createApp, h, nextTick } from 'vue'
import { snapdom } from '@zumer/snapdom'
import StoryCard from '../components/share/StoryCard.vue'
import UiIcon from '../components/ui/UiIcon.vue'
import { isCapacitorApp } from './nativeBridge'

const W = 1080
const H = 1920

/** 소식의 경기 한 장(post)을 스토리 그림 파일로 */
export async function storyFile(post: any, myId: number | null): Promise<File> {
  const host = document.createElement('div')
  // 화면 밖에. display:none이면 크기가 0이라 찍히지 않는다
  host.style.cssText = 'position:fixed;left:-10000px;top:0;pointer-events:none;'
  document.body.appendChild(host)
  const app = createApp({ render: () => h(StoryCard, { post, myId }) })
  app.component('UiIcon', UiIcon) // main.ts가 전역으로 등록하는 것과 같게
  app.mount(host)
  try {
    await nextTick()
    const el = host.firstElementChild as HTMLElement
    // 글꼴은 쓰일 때 받기 시작한다. 그림에 든 글자로 직접 불러야 기다릴 수 있다 (안 그러면 첫 장이 대체 글꼴로 찍혀 점수가 줄을 넘겼다).
    // Pretendard는 글자 묶음마다 파일이 나뉘어 있어 그림의 글자를 그대로 넘긴다
    const text = el.textContent || ''
    await Promise.all(
      ['400', '500', '600'].flatMap((w) => [
        document.fonts?.load(`${w} 16px Geist`, text),
        document.fonts?.load(`${w} 16px "Pretendard Variable"`, text),
      ]),
    ).catch(() => null)
    await document.fonts?.ready
    // 글꼴이 바뀐 뒤의 줄바꿈으로 한 번 더 그린다
    el.getBoundingClientRect()
    await new Promise((r) => requestAnimationFrame(() => r(null)))
    const opts = {
      format: 'png', width: W, height: H, dpr: 1, reconcile: true, embedFonts: 'auto', backgroundColor: '#121214',
      // 라틴·숫자 글꼴(Geist)은 우리 사이트의 파일을 직접 넣는다. 구글 글꼴에서 찾아 넣게 두면 사파리에서 가끔 빠져
      // 숫자가 한글 글꼴로 넓게 찍혔다 (웹킷 새 창 12번 중 1번). Geist는 SIL 오픈 폰트 라이선스
      localFonts: [{ family: 'Geist', src: '/fonts/geist-latin.woff2', weight: '400 700', style: 'normal' }],
      excludeFonts: { domains: ['fonts.gstatic.com', 'fonts.googleapis.com'] },
    } as any
    // 사파리는 그림 속에 넣은 글꼴을 처음 몇 장에서 아직 못 읽어 대체 글꼴로 찍는다(점수가 줄을 넘었다).
    // 첫 장은 버리고, 연달아 찍은 두 장이 바이트까지 같아지면 그것을 쓴다 (시험: 웹킷 새 창 첫 장 12번 모두 같은 그림, 11/9)
    await snapdom.toBlob(el, opts).catch(() => null)
    let blob: Blob = await snapdom.toBlob(el, opts)
    for (let i = 0; i < 3; i++) {
      const next: Blob = await snapdom.toBlob(el, opts)
      if (await sameBytes(blob, next)) break
      blob = next
    }
    if (!blob || !blob.size) throw new Error('empty')
    return new File([blob], `match-${post?.id ?? 'story'}.png`, { type: 'image/png' })
  } finally {
    app.unmount()
    host.remove()
  }
}

async function sameBytes(a: Blob, b: Blob): Promise<boolean> {
  if (!a || !b || a.size !== b.size) return false
  const [x, y] = await Promise.all([a.arrayBuffer(), b.arrayBuffer()])
  const u = new Uint8Array(x)
  const v = new Uint8Array(y)
  for (let i = 0; i < u.length; i++) if (u[i] !== v[i]) return false
  return true
}

/** 공유 시트로 넘긴다. 'shared'(넘김) · 'cancelled'(사용자가 닫음) · 'saved'(내려받음) · 'unsupported'(앱 웹뷰라 둘 다 안 됨) */
export async function shareStoryFile(file: File): Promise<'shared' | 'cancelled' | 'saved' | 'unsupported'> {
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return 'shared'
    } catch (e: any) {
      if (e?.name === 'AbortError') return 'cancelled'
    }
  }
  // 안드로이드 앱의 웹뷰는 공유 시트(navigator.share)도 내려받기도 없다. 앱에 공유 플러그인을 넣기 전까지는 알린다
  if (isCapacitorApp) return 'unsupported'
  const a = document.createElement('a')
  a.href = URL.createObjectURL(file)
  a.download = file.name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000)
  return 'saved'
}
