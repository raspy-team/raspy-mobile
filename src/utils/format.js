// 날짜·시간을 사람이 읽는 말로

const DAYS = ['일', '월', '화', '수', '목', '금', '토']

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

/** '방금', '3분 전', '2시간 전', '5일 전', '3개월 전' */
export function timeAgo(value) {
  if (!value) return ''
  const sec = (Date.now() - new Date(value).getTime()) / 1000
  if (sec < 60) return '방금'
  if (sec < 3600) return `${Math.floor(sec / 60)}분 전`
  if (sec < 86400) return `${Math.floor(sec / 3600)}시간 전`
  if (sec < 2592000) return `${Math.floor(sec / 86400)}일 전`
  if (sec < 31104000) return `${Math.floor(sec / 2592000)}개월 전`
  return `${Math.floor(sec / 31104000)}년 전`
}

/** 경기 시각: '오늘 오후 7:00', '내일 오전 10:30', '11월 2일 (일) 오후 7:00'. 없으면 '시간 미정' */
export function matchTime(value) {
  if (!value || !String(value).trim()) return '시간 미정'
  const d = new Date(value)
  if (isNaN(d)) return '시간 미정'
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  const time = d.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })
  if (sameDay(d, now)) return `오늘 ${time}`
  if (sameDay(d, tomorrow)) return `내일 ${time}`
  const date = `${d.getMonth() + 1}월 ${d.getDate()}일 (${DAYS[d.getDay()]})`
  return d.getFullYear() === now.getFullYear() ? `${date} ${time}` : `${d.getFullYear()}년 ${date} ${time}`
}

/** 때 한 꼴 (quality-rules I-2): '오늘 오후 7:00' · '내일 오전 10:30' · '11월 2일 (일) 오후 7:00'. 값이 없으면 빈 글 */
export function dayTime(value) {
  return value && !isNaN(new Date(value)) ? matchTime(value) : ''
}

/** 날만: '오늘' · '내일' · '11월 2일' (올해가 아니면 '2025년 11월 2일') */
export function dayOnly(value) {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d)) return ''
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  if (sameDay(d, now)) return '오늘'
  if (sameDay(d, tomorrow)) return '내일'
  const date = `${d.getMonth() + 1}월 ${d.getDate()}일`
  return d.getFullYear() === now.getFullYear() ? date : `${d.getFullYear()}년 ${date}`
}

/** 장소: 비었으면 '장소 미정' */
export function place(value) {
  return value && String(value).trim() ? value : '장소 미정'
}

/** 전적: '3승 1무 2패' (모두 0이면 '첫 경기 전') */
// 레이팅과 전적 한 줄. 아직 안 해 본 사람은 빈 문자열 (기본값 '1500점 · 첫 경기 전'은 정보가 아니다)
export function ratingLine(stats) {
  const played = (stats?.wins || 0) + (stats?.draws || 0) + (stats?.losses || 0)
  return played ? `${stats.ruleRating || 1500}점 · ${record(stats)}` : ''
}

export function record(stats) {
  const w = stats?.wins || 0
  const d = stats?.draws || 0
  const l = stats?.losses || 0
  if (!w && !d && !l) return '첫 경기 전'
  return [`${w}승`, d ? `${d}무` : '', `${l}패`].filter(Boolean).join(' ')
}

// 문장·토스트에 넣는 이름. AI면 이름 없이 'AI' (11/14: 사람인 척하는 이름을 걷어 냈다. 서버 bot/AiMode)
export function who(p, fallback = '상대') {
  if (!p) return fallback
  const name = p.nickname ?? p.name ?? fallback
  return p.isBot ? 'AI' : name
}

// 받침에 따라 '으로/로' ('(으)로'처럼 괄호로 쓰지 않게, 11/5 밤샘 C). ㄹ 받침은 '로' (서울로)
export function withRo(word) {
  const s = String(word ?? '')
  const c = s.charCodeAt(s.length - 1) - 0xac00
  if (!(c >= 0 && c <= 11171)) {
    // 숫자는 읽는 소리로 (영·삼·육 → 으로, 일·칠·팔은 ㄹ이라 로). 영문은 b·k·m·n·p·t·g 끝이면 으로(Team으로), l은 ㄹ이라 로.
    // 서버 text/Josa.kt와 같은 규칙
    const d = s.slice(-1).toLowerCase()
    return s + (d !== '' && '036bkmnptg'.includes(d) ? '으로' : '로')
  }
  const jong = c % 28
  return s + (jong === 0 || jong === 8 ? '로' : '으로')
}

// AI가 상대가 되기까지 기다리는 시간 (서버의 botAfterSeconds): '15초', '1분', '1시간'
export function waitText(seconds) {
  if (seconds < 60) return `${seconds}초`
  if (seconds < 3600) return `${Math.round(seconds / 60)}분`
  return `${Math.round(seconds / 3600)}시간`
}

/** 내 동네에서 거리: 800m, 1.2km, 12km (UX 리뷰 ⑦). 없으면 '' */
export function distance(m) {
  // 같은 동(가운데끼리 0m)은 동 이름으로 충분하다
  if (m == null || m < 50) return ''
  if (m < 1000) return `${Math.max(100, Math.round(m / 100) * 100)}m`
  return m < 10000 ? `${(m / 1000).toFixed(1)}km` : `${Math.round(m / 1000)}km`
}
