// 저장소(localStorage·sessionStorage)를 못 쓰는 브라우저에서도 앱이 뜨게 한다 (11/17).
// 사파리의 '모든 쿠키 차단'이나 저장소를 꺼 둔 앱 안 웹뷰에서는 저장소를 건드리는 순간 오류가 나거나 저장소가 아예 없다.
// 앱은 뜰 때부터 저장소를 읽어서(로그인 토큰·기기 번호), 그런 브라우저에서는 빈 화면이었다.
// 그럴 때만 이 화면이 떠 있는 동안 쓰는 메모리 저장소로 바꿔 끼운다: 새로 고치면 잊지만 가입 없는 한 판은 끝까지 된다.
// main.js의 맨 첫 import여야 한다 (다른 모듈이 불러와지며 저장소를 읽기 전에)
function memoryStorage() {
  const m = new Map()
  return {
    getItem: (k) => (m.has(String(k)) ? m.get(String(k)) : null),
    setItem: (k, v) => void m.set(String(k), String(v)),
    removeItem: (k) => void m.delete(String(k)),
    clear: () => m.clear(),
    key: (i) => [...m.keys()][i] ?? null,
    get length() {
      return m.size
    },
  }
}

for (const name of ['localStorage', 'sessionStorage']) {
  let works = false
  try {
    const s = window[name]
    s.setItem('__probe', '1')
    s.removeItem('__probe')
    works = true
  } catch {
    // 막혔거나 없다
  }
  if (!works) {
    try {
      Object.defineProperty(window, name, { value: memoryStorage(), configurable: true, writable: true })
    } catch {
      // 바꿔 끼우지도 못하면 예전처럼 둔다
    }
  }
}
