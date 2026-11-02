// 폰 위치 (동네 인증). 실패 이유를 사람이 알아들을 말로 바꾼다
export type Position = { lat: number; lon: number; accuracy: number }

export function getPosition(timeoutMs = 15000): Promise<Position> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('이 브라우저는 위치를 알려 주지 않아요'))
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude, accuracy: p.coords.accuracy }),
      (e) => {
        if (e.code === e.PERMISSION_DENIED) reject(new Error('위치 권한이 꺼져 있어요. 브라우저 설정에서 이 사이트의 위치를 허용해 주세요'))
        else if (e.code === e.TIMEOUT) reject(new Error('위치를 찾는 데 너무 오래 걸려요. 밖이나 창가에서 다시 해 주세요'))
        else reject(new Error('위치를 찾지 못했어요. 잠시 뒤 다시 해 주세요'))
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 },
    )
  })
}
