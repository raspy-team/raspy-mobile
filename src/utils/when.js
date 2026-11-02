// 경기 시간 빠른 고르기 (경기 만들기·일정 정하기가 같이 쓴다). 서버는 Asia/Seoul LocalDateTime이라 로컬 시각 문자열로 보낸다
export function localIso(d) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:00`
}

function dayAt(addDays, hour) {
  const d = new Date()
  d.setDate(d.getDate() + addDays)
  d.setHours(hour, 0, 0, 0)
  return d
}

/** [{ label, date: () => 'YYYY-MM-DDTHH:mm:00' }] 지금 고를 수 있는 것만 */
export function quickTimes() {
  const now = new Date()
  const toSaturday = (6 - now.getDay() + 7) % 7 // 오늘이 토요일이면 0
  return [
    ...(now.getHours() < 18 ? [{ label: '오늘 저녁', date: () => localIso(dayAt(0, 19)) }] : []),
    { label: '내일 저녁', date: () => localIso(dayAt(1, 19)) },
    ...(now.getDay() === 0 ? [] : [{ label: '이번 주말', date: () => localIso(dayAt(toSaturday, 14)) }]),
  ]
}
