// 공유 그림: 앱의 소식 카드(StoryCard)를 화면 밖에 그려 PNG로 찍는다 (snapdom).
// 서버 그림(raspy-api share/ShareImage.kt)은 Java로 따로 그려 앱 화면과 모양이 달랐다. 이건 앱의 글꼴·색·부품 그대로다 (11/9)
// 공유 시트(ShareSheet)는 시트가 열리자마자 디자인마다 미리 찍어 둔다. 누른 순간 바로 넘겨야 사파리가 공유를 막지 않는다
// (사파리는 누른 뒤 잠깐 안에만 공유 창을 연다. 누르고 나서 2초 동안 그리면 막혔다)
import { createApp, h, nextTick } from 'vue'
import { snapdom } from '@zumer/snapdom'
import StoryCard from '../components/share/StoryCard.vue'
import UiIcon from '../components/ui/UiIcon.vue'
import { isCapacitorApp, MatchInstagram } from './nativeBridge'

/** dark·volt: 스토리 한 장(1080×1920) · sticker: 투명 바탕 카드, 내 사진 위에 붙인다 */
export type StoryVariant = 'dark' | 'volt' | 'sticker'

const W = 1080
const H = 1920

/** 소식의 경기 한 장(post)을 그림 파일로 */
export async function storyFile(post: any, myId: number | null, variant: StoryVariant = 'dark'): Promise<File> {
  return componentFile(StoryCard, { post, myId, variant }, variant, `match-${post?.id ?? 'story'}-${variant}.png`)
}

/** 아무 카드 컴포넌트를 화면 밖에 그려 그림 파일로 (임기응변 등급 결과 카드 등). 크기·글꼴 처리는 storyFile과 같다 */
export async function componentFile(component: any, props: Record<string, unknown>, variant: StoryVariant, name: string): Promise<File> {
  // 글꼴 받기나 그림 찍기가 끝나지 않으면 버튼이 영원히 돌았다(11/11 폰). 시간이 지나면 못 찍은 것으로 본다
  let timer: ReturnType<typeof setTimeout> | undefined
  const limit = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('timeout')), SNAP_LIMIT_MS) })
  try {
    return await Promise.race([snapFile(component, props, variant, name), limit])
  } finally {
    clearTimeout(timer)
  }
}

// 첫 장은 아이폰에서 오래 걸린다(글꼴을 받아 그림에 넣는다). 끝없이 돌지만 않게, 첫 장을 버리지는 않을 만큼
const SNAP_LIMIT_MS = 45_000
// 그림 속 글꼴: 숫자·영문은 Geist(그림에 넣는다), 한글은 기기 글꼴 (아이폰 Apple SD Gothic Neo, 안드로이드 Noto Sans CJK)
const SNAP_FONT = 'Geist, -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", "Noto Sans CJK KR", system-ui, sans-serif'
// 글꼴을 넣은 그림을 한 번 제대로 찍었나 (그 뒤로는 한 장이면 된다)
let warmed = false

async function snapFile(component: any, props: Record<string, unknown>, variant: StoryVariant, name: string): Promise<File> {
  const host = document.createElement('div')
  // 화면 밖에. display:none이면 크기가 0이라 찍히지 않는다
  host.style.cssText = 'position:fixed;left:-10000px;top:0;pointer-events:none;'
  // 한글은 기기 기본 글꼴로 그린다. Pretendard는 글자 묶음마다 파일이 나뉘어 그림 한 장에 스무 개 넘게 받아 통째로 넣었고,
  // 아이폰은 그런 그림을 처리하는 동안 화면이 멈춰 공유 시트가 아무것도 눌리지 않았다 (11/12). 숫자·영문 Geist는 작은 파일 하나라 넣는다.
  // 찍기 전 화면에서도 같은 글꼴로 그려야 그림 속 줄바꿈이 어긋나지 않는다
  host.className = 'story-snap'
  if (!document.getElementById('story-snap-font')) {
    const st = document.createElement('style')
    st.id = 'story-snap-font'
    st.textContent = `.story-snap, .story-snap * { font-family: ${SNAP_FONT} !important; }`
    document.head.appendChild(st)
  }
  document.body.appendChild(host)
  const app = createApp({ render: () => h(component, props) })
  app.component('UiIcon', UiIcon) // main.ts가 전역으로 등록하는 것과 같게
  app.mount(host)
  try {
    await nextTick()
    const el = host.firstElementChild as HTMLElement
    // 글꼴은 쓰일 때 받기 시작한다. 그림에 든 글자로 직접 불러야 기다릴 수 있다 (안 그러면 첫 장이 대체 글꼴로 찍혀 점수가 줄을 넘겼다).
    const text = el.textContent || ''
    await Promise.all(['400', '500', '600'].map((w) => document.fonts?.load(`${w} 16px Geist`, text))).catch(() => null)
    await document.fonts?.ready
    // 글꼴이 바뀐 뒤의 줄바꿈으로 한 번 더 그린다
    el.getBoundingClientRect()
    await new Promise((r) => requestAnimationFrame(() => r(null)))
    const sticker = variant === 'sticker'
    const opts = {
      format: 'png',
      dpr: 1,
      reconcile: true,
      embedFonts: 'auto',
      // 스토리는 정해진 크기, 스티커는 카드 높이 그대로(너비 1080에 맞춰 비율 유지)이고 바탕을 비운다
      ...(sticker ? { width: W } : { width: W, height: H, backgroundColor: variant === 'volt' ? '#d2ff4d' : '#121214' }),
      // 라틴·숫자 글꼴(Geist)은 우리 사이트의 파일을 직접 넣는다. 구글 글꼴에서 찾아 넣게 두면 사파리에서 가끔 빠져
      // 숫자가 한글 글꼴로 넓게 찍혔다 (웹킷 새 창 12번 중 1번). Geist는 SIL 오픈 폰트 라이선스
      localFonts: [{ family: 'Geist', src: '/fonts/geist-latin.woff2', weight: '400 700', style: 'normal' }],
      excludeFonts: { domains: ['fonts.gstatic.com', 'fonts.googleapis.com', 'cdn.jsdelivr.net'], families: ['Pretendard Variable', 'Pretendard'] },
    } as any
    // 사파리는 그림 속에 넣은 글꼴을 처음 몇 장에서 아직 못 읽어 대체 글꼴로 찍는다(점수가 줄을 넘었다).
    // 첫 장은 버리고, 연달아 찍은 두 장이 바이트까지 같아지면 그것을 쓴다 (시험: 웹킷 새 창 첫 장 20번 모두 같은 그림, 11/9).
    // 이 기다림은 화면을 연 뒤 처음 한 번만 하면 된다. 아이폰은 첫 장이 수십 초 걸리는데 그림마다 4~5번씩 다시 찍어
    // 공유 시트의 인스타 버튼이 끝없이 돌았다 (11/11 아이폰 시뮬레이터: 첫 그림 10~30초, 그다음 0.5초)
    let blob: Blob
    if (!warmed) {
      await snapdom.toBlob(el, opts).catch(() => null)
      blob = await snapdom.toBlob(el, opts)
      for (let i = 0; i < 3; i++) {
        const next: Blob = await snapdom.toBlob(el, opts)
        if (await sameBytes(blob, next)) break
        blob = next
      }
    } else {
      blob = await snapdom.toBlob(el, opts)
    }
    if (!blob || !blob.size) throw new Error('empty')
    warmed = true
    return new File([blob], name, { type: 'image/png' })
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

export type ShareResult = 'shared' | 'cancelled' | 'saved' | 'unsupported'

/**
 * 폰 공유 창으로 그림(+글·링크)을 넘긴다. 누른 그 자리에서 불러야 한다(앞에 await 없이).
 * 공유 창이 파일을 못 받으면 PC는 내려받고, 앱 웹뷰는 'unsupported'
 */
export function shareFiles(files: File[], text?: string): Promise<ShareResult> {
  const data: ShareData = text ? { files, text } : { files }
  if (navigator.canShare?.(data)) {
    return navigator.share(data).then(
      () => 'shared' as const,
      (e: any) => (e?.name === 'AbortError' ? 'cancelled' : download(files[0])),
    )
  }
  return Promise.resolve(download(files[0]))
}

function download(file: File): ShareResult {
  // 안드로이드 앱의 웹뷰는 공유 창(navigator.share)도 내려받기도 없다. 앱에 공유 플러그인을 넣기 전까지는 알린다
  if (isCapacitorApp) return 'unsupported'
  const a = document.createElement('a')
  a.href = URL.createObjectURL(file)
  a.download = file.name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000)
  return 'saved'
}

/** 인스타·카톡 같은 앱 안 브라우저: 내려받기가 실제로 저장되지 않는다 */
export const inAppBrowser = /Instagram|KAKAOTALK|FBAN|FBAV|Line\//i.test(navigator.userAgent)

/** 폰인지 (인스타 앱을 열 수 있는 곳) */
export const isPhone = /iphone|ipad|android/i.test(navigator.userAgent)

/**
 * 스티커: 투명 그림을 클립보드에 넣고 인스타 스토리 카메라를 연다. 인스타는 클립보드의 그림을 '스티커 추가'로 띄운다
 * (Strava의 '클립보드에 복사' 길). 클립보드에 그림을 못 넣는 브라우저면 false
 */
export async function copyStickerAndOpenInstagram(file: File, link?: string): Promise<boolean> {
  try {
    if (!navigator.clipboard || typeof ClipboardItem === 'undefined') return false
    // 그림과 함께 링크도 (인스타 '링크' 스티커에 붙여 넣는다)
    const types: Record<string, Blob> = { 'image/png': file }
    if (link) types['text/plain'] = new Blob([link], { type: 'text/plain' })
    await navigator.clipboard.write([new ClipboardItem(types)])
  } catch {
    return false
  }
  if (isPhone) window.location.href = 'instagram://story-camera'
  return true
}

/** 인스타 공식 '스토리로 공유'에 쓰는 페이스북 앱 ID (developers.facebook.com '매치', 11/9). 비밀값이 아니다 */
export const INSTAGRAM_APP_ID = '1427683232858104'

/** 디자인마다 인스타 편집기의 배경색 (위·아래가 다르면 인스타가 그러데이션을 만든다) */
const STORY_BG: Record<StoryVariant, [string, string]> = {
  dark: ['#121214', '#2E2E33'],
  volt: ['#D2FF4D', '#D2FF4D'],
  sticker: ['#121214', '#121214'],
}

function dataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(r.error)
    r.readAsDataURL(file)
  })
}

/**
 * 앱(native/instagram-stories): 스포티파이처럼 인스타 스토리 편집기를 바로 연다. 배경은 고른 디자인의 색,
 * 위에는 결과 카드 스티커(투명 바탕, 손가락으로 옮기고 키운다). 인스타가 없으면 'not_installed'
 */
export async function openInstagramStoryNative(sticker: File, variant: StoryVariant, link?: string): Promise<'opened' | 'not_installed' | 'failed'> {
  const [topColor, bottomColor] = STORY_BG[variant]
  try {
    await (MatchInstagram as any).shareToStory({ appId: INSTAGRAM_APP_ID, sticker: await dataUrl(sticker), topColor, bottomColor, link })
    return 'opened'
  } catch (e: any) {
    return String(e?.message || e).includes('not_installed') ? 'not_installed' : 'failed'
  }
}

/**
 * 인스타 스토리에서 '링크' 스티커로 붙일 주소. 경기 주소(서명 붙은 /m/{경기})가 있으면 그 경기로, 없으면 홈으로.
 * 꼬리표(어느 경기에서 왔는지)와 공유 번호(누가 보냈는지)를 단다
 */
export function storyHomeLink(postId: number | string, postUrl?: string, shareCode?: string): string {
  const u = new URL(postUrl || 'https://matchapp.me/')
  u.searchParams.set('utm_source', 'instagram')
  u.searchParams.set('utm_medium', 'story')
  u.searchParams.set('utm_campaign', `m${postId}`)
  if (shareCode) u.searchParams.set('r', shareCode)
  return u.toString()
}
