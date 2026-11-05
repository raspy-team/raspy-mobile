// 사진 다루기: 파일 읽기 → 줄이기 → 올릴 File로. 사진을 고르는 화면들이 같이 쓴다

/** 파일을 data URL로 읽는다 */
export function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

/**
 * 고른 사진을 줄여서 미리보기(dataUrl)와 올릴 파일(file)로 돌려준다. 읽지 못하면 null
 * @param {File} file
 * @param {{ maxWidth?: number, quality?: number, name?: string }} opts
 */
export async function photoFromFile(file, { maxWidth = 800, quality = 0.3, name = file.name } = {}) {
  const raw = await readAsDataUrl(file).catch(() => null)
  if (!raw) return null
  const dataUrl = await compressImage(raw, maxWidth, quality)
  return { dataUrl, file: dataUrlToFile(dataUrl, name) }
}

/**
 * base64를 File 객체로 변환
 * @param {string} dataUrl
 * @param {string} filename
 * @returns {File}
 */
export function dataUrlToFile(dataUrl, filename = 'image.jpg') {
  const arr = dataUrl.split(',')
  const mime = arr[0].match(/:(.*?);/)[1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new File([u8arr], filename, { type: mime })
}

/**
 * 이미지 압축 (크기 최적화)
 * @param {string} dataUrl
 * @param {number} maxWidth - 가로·세로 최대 길이 (기본 800)
 * @param {number} quality - 품질 0~1 (기본 0.3)
 * @returns {Promise<string>} 압축된 base64 이미지
 */
export function compressImage(dataUrl, maxWidth = 800, quality = 0.3) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let width = img.width
      let height = img.height

      // 최대 너비 제한
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }

      // 높이도 같은 길이로 제한 (긴 세로 이미지 대응)
      if (height > maxWidth) {
        width = (width * maxWidth) / height
        height = maxWidth
      }

      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    img.src = dataUrl
  })
}
