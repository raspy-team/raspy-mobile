// 스토어에 앱이 나와 있나. public/app.html의 IOS_LIVE·ANDROID_LIVE와 함께 켠다 (지금: App Store 심사 대기, Play 비공개 테스트)
// 켜면 스토리 안내 시트에 '앱에서는 바로 올라가요 · 앱 받기'가 보인다. 받는 곳은 /app (기기에 맞는 스토어로 보낸다)
import { isAndroidUa, isCapacitorApp } from './nativeBridge'

const IOS_LIVE = false
const ANDROID_LIVE = false
const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)

/** 이 기기에서 받을 수 있는 앱이 있고, 지금은 앱 밖(웹)인가 */
export const appDownloadable = !isCapacitorApp && ((isIos && IOS_LIVE) || (isAndroidUa && ANDROID_LIVE))
export const APP_PAGE = '/app?utm_source=web&utm_medium=story_guide'
