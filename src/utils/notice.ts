// '알려 드릴게요'는 앱(휴대폰 알림)에서만 지킬 수 있다. 웹(인스타·카톡 앱 안 포함)은 알림함(위 종)에 남는 데까지가 사실이다 (경로 2 리뷰 N2, 가로 훑기 7절)
import { isCapacitorApp } from './nativeBridge'

/** "…면 알려 드려요" 자리에 쓰는 말 */
export const NOTICE = isCapacitorApp ? '알려 드려요' : '알림함(위 종)에 남겨 둘게요'
/** "끝나면 알림으로 알려 드릴게요" 자리 */
export const NOTICE_LONG = isCapacitorApp ? '알림으로 알려 드릴게요' : '알림함(위 종)에 남겨 둘게요'
