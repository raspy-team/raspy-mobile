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

/** [{ label, date: () => 'YYYY-MM-DDTHH:mm:00' }] 지금 고를 수 있는 것만.
 * 11/13 실제 기기 한 바퀴: 저녁 6시가 넘으면 오늘 고를 칸이 없었고, 금요일 밤의 '이번 주말'은 언제인지 몰랐다(토요일 오후엔 지난 시각이 됐다).
 * 그래서 '곧'(다음 정각에서 한 시간 뒤)을 늘 두고, 주말은 요일·시각을 그대로 쓴다 */
export function quickTimes() {
  const now = new Date()
  const h = now.getHours()
  const soonHour = h + 2 // 다음 정각 + 1시간쯤 (20:37 → 22시)
  const toSaturday = (6 - now.getDay() + 7) % 7 || (h < 13 ? 0 : 7) // 토요일 오후면 다음 주 토요일
  const hourLabel = (n) => (n < 12 ? `오전 ${n}시` : `오후 ${n === 12 ? 12 : n - 12}시`)
  const list = [
    ...(soonHour <= 23 ? [{ label: `오늘 ${hourLabel(soonHour)}`, date: () => localIso(dayAt(0, soonHour)) }] : []),
    ...(h < 17 ? [{ label: '오늘 저녁 7시', date: () => localIso(dayAt(0, 19)) }] : []),
    { label: '내일 저녁 7시', date: () => localIso(dayAt(1, 19)) },
    // 토요일 오전이면 오늘 2시 ('오늘 오후 2시'가 위에 이미 있으면 뺀다)
    ...(toSaturday === 0 && soonHour === 14 ? [] : [{ label: toSaturday === 0 ? '오늘 오후 2시' : toSaturday === 1 ? '내일 오후 2시' : toSaturday === 7 ? '다음 주 토요일 오후 2시' : '토요일 오후 2시', date: () => localIso(dayAt(toSaturday, 14)) }]),
  ]
  return list.sort((a, b) => a.date().localeCompare(b.date())) // 금요일엔 토요일 2시가 내일 저녁보다 먼저
}
