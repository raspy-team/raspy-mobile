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

/** 장소: 비었으면 '장소 미정' */
export function place(value) {
  return value && String(value).trim() ? value : '장소 미정'
}

/** 전적: '3승 1무 2패' (모두 0이면 '첫 경기 전') */
export function record(stats) {
  const w = stats?.wins || 0
  const d = stats?.draws || 0
  const l = stats?.losses || 0
  if (!w && !d && !l) return '첫 경기 전'
  return [`${w}승`, d ? `${d}무` : '', `${l}패`].filter(Boolean).join(' ')
}
